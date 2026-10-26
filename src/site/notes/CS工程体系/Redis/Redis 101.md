---
{"dg-publish":true,"permalink":"/CS工程体系/Redis/Redis 101/","dg-note-properties":{}}
---



四个维度建模redis的功能

## 速度

Mysql记录数据经历四个阶段
- parse mysql
- plan execution
- traverse-B-Tree
- read from disk （block neck）
	- 100 us

Redis 数据保存着 RAM
- 100ns


## 数据结构

- redis natively understand data struct
	- list
	- set
	- hash
	- sorted set
		- 神器，很方便做业务
	


## 处理并发链接：IO 多路复用


redis 依赖单线程处理多个client请求
- 多线程需要 mutex 避免数据竞争，会引入**锁竞争、上下文切换、复杂度上升**等问题，让代码难以维护、行为难以预测
- Redis 在单线程里使用 **epoll loop** 感知就绪的套接字，然后按 epoll 的触发顺序，**直接读取套接字内容到该 client 的 query buffer，并在同一次事件循环里立即解析、执行命令**，结果写入 reply buffer 后再注册可写事件写回。
	- 这种形式天然保证数据操作的原子性![Pasted image 20260920112120.png](/img/user/CS%E5%B7%A5%E7%A8%8B%E4%BD%93%E7%B3%BB/Redis/Pasted%20image%2020260920112120.png)

>补充：当 redis 服务多个客户，数据请求或返回数据量比较大时（比如读取前 100 名排行榜，或者日志写入），网络 IO 会成为瓶颈。redis 通过开启 IO 多线程（`io_thd_*` 线程，需配置 `io-threads N` 且 N>1）来并行处理**套接字读写和协议解析**，解决网络 IO 导致的耗时问题。但是**命令处理、逻辑处理** 部分仍然是单线程的。



## 持久化

Ram is volatile ， 为了避免断电导致的数据丢失问题，Redis有两套数据持久化机制

### RDB - Redis DataBase

redis take point-in-time snapshot of entir dataset and saves them to disk

![Pasted image 20260920115849.png](/img/user/CS%E5%B7%A5%E7%A8%8B%E4%BD%93%E7%B3%BB/Redis/Pasted%20image%2020260920115849.png)

redis 执行策略
- fork一个子进程，子进程负责备份数据
	- ![Pasted image 20260920115911.png](/img/user/CS%E5%B7%A5%E7%A8%8B%E4%BD%93%E7%B3%BB/Redis/Pasted%20image%2020260920115911.png)
	- 如果在备份过程中，redis需要写入，就会触发 os 到写时复制操作
		- ![Pasted image 20260920120021.png](/img/user/CS%E5%B7%A5%E7%A8%8B%E4%BD%93%E7%B3%BB/Redis/Pasted%20image%2020260920120021.png)


RDB 强调的是快速备份以及利用备份快速恢复

### AOF - Append Only File

![Pasted image 20260920120853.png](/img/user/CS%E5%B7%A5%E7%A8%8B%E4%BD%93%E7%B3%BB/Redis/Pasted%20image%2020260920120853.png)
redis会按对数据库的操作序记录每个操作指令，即使redis挂了，redis也能根据这个日志回放数据操作，还原数据库



AOF强调保证即使断电也不会丢失最近时间（秒，分钟）的数据。


## 经典用法

### 01 · API rate limiting（限流）

#### 核心思想

> **限流是一套策略（窗口多大、上限多少、按什么维度限），Redis 只是用"原子计数 + TTL"帮你把这套策略高效、并发安全地落地。Redis 本身不限流，它只是"记录 + 判断的执行者"，规则是你定的。**



```redis
SET k 1 EX 60
```


规则：每个用户 60 秒内最多 10 次。

```
用户请求 → 应用 → 执行 Lua（发给 Redis）→ Redis 返回 0/1 → 放行/拒绝
```

**Lua 什么时候运行？**
> **每个请求都执行一次**，不是定时任务。每次请求，应用把 Lua 发给 Redis，Redis 单线程一口气跑完"计数 + 过期 + 判断"，返回放行或拒绝。


 #### 限流 Lua 脚本

```lua
-- KEYS[1] = "rate:user:123"
-- ARGV[1] = 窗口秒数 60
-- ARGV[2] = 限制次数 10

local current = redis.call('INCR', KEYS[1])   -- 计数 +1
if current == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])    -- 第一次才设过期
end
if current > tonumber(ARGV[2]) then
    return 0    -- 超限，拒绝
end
return 1        -- 放行
```

执行过程：
- 第 1 次：INCR=1，设过期 60s，1≤10 → 放行
- 第 5 次：INCR=5，5≤10 → 放行
- 第 11 次：INCR=11，11>10 → 拒绝
- 60 秒后 key 过期，计数归零，重新开始

#### Lua 脚本谁执行

> **客户端发过去，Redis 服务端用内置 Lua 解释器在主线程里执行。**

```
你的应用 ──发脚本──▶ Redis ──主线程执行──▶ 返回结果
```

- 客户端只负责"发送"，不负责"运行"
- Redis 内置 Lua 5.1 解释器，`redis.call(...)` 直接调用 Redis 内部命令函数
- 因为脚本在单线程里一次跑完，所以整段是**原子**的
- 生产上通常用 `EVALSHA`（先 `SCRIPT LOAD` 拿 sha1，之后只传 sha1）

#### 常见限流方案

| 方案 | 做法 | 特点 |
|---|---|---|
| 固定窗口计数器 | INCR + EXPIRE | 简单，有边界问题 |
| 滑动窗口 | ZSET 存时间戳 | 平滑，内存占用大 |
| 令牌桶/漏桶 | Lua 计算令牌 | 最贴近生产，允许突发 |




### 02 · Service messaging（服务消息）



> Redis 也能当**消息中间件**，用来做服务之间的解耦和异步通信。两种机制：**PUB/SUB（发布订阅）** 和 **STREAMS（流）**。

解决的问题：下单后要通知库存、积分、物流等服务。
同步调用耦合严重、一个挂了全挂。
消息机制让下单服务只管"发一条消息"，其他服务自己订阅/消费。

#### PUB/SUB（发布订阅）


```
发布者 ──PUBLISH channel msg──▶ Redis ──▶ 所有订阅该频道的订阅者
```

| 命令 | 作用 |
|---|---|
| `SUBSCRIBE news` | 订阅频道 |
| `PUBLISH news "hello"` | 发消息 |
| `PSUBSCRIBE news.*` | 模式订阅 |

##### SUB 端怎么收到消息（重点）

> **订阅者建立长连接并进入"订阅模式"；Redis 在内存里记下"频道→订阅者"映射；一旦有人 PUBLISH，Redis 就沿这些长连接主动把消息推给订阅者。是服务端主动推送，不是订阅者轮询。**

内部结构：

```
pubsub_channels:
  "news"   → [客户端A, 客户端B]
  "sports" → [客户端C]
```

PUBLISH 时查表，给对应连接各写一条消息。

##### 关键特性

| 特性 | 说明 |
|---|---|
| 必须保持连接 | 断线期间消息**永久丢失**，不补发 |
| 订阅模式下不能发普通命令 | 只能 SUBSCRIBE/UNSUBSCRIBE/PSUBSCRIBE/PUNSUBSCRIBE/PING/QUIT |
| 收不到历史消息 | PUBLISH 时谁在线谁收到 |
| 无 ACK | 推出去就不管，失败不重发 |
| 广播 | 同频道所有订阅者都收到 |

##### 代码例子（Python）

```python
# 订阅者
import redis
r = redis.Redis(decode_responses=True)
p = r.pubsub()
p.subscribe('news')
for message in p.listen():          # 阻塞等推送
    if message['type'] == 'message':
        print(message['channel'], message['data'])

# 发布者
r.publish('news', 'hello world')
```



#### STREAMS（流）


> **STREAMS 是一个只能追加、可持久、可回溯、支持消费组和 ACK 的日志型数据结构，像 Kafka 的简化版。**

##### 消息长什么样

```
流 events:
  ├── 1690000000000-0   {type: "order_created", id: "123"}
  ├── 1690000000001-0   {type: "order_paid",    id: "123"}
  └── ... 只能往后追加
```

每条消息有 **ID（时间戳-序号，单调递增）** 和 **field-value 内容**。


| 命令 | 作用 |
|---|---|
| `XADD events * type order_created id 123` | 追加消息，`*` 让 Redis 自动生成 ID |
| `XREAD COUNT 10 STREAMS events 0` | 读消息 |
| `XLEN events` | 流长度 |
| `XRANGE events - +` | 按范围读历史 |
| `XGROUP CREATE events mygroup 0` | 创建消费组 |
| `XREADGROUP GROUP mygroup consumer1 COUNT 10 STREAMS events >` | 消费组读新消息 |
| `XACK events mygroup <id>` | 确认消息 |
| `XPENDING events mygroup` | 查看未确认消息 |
| `XCLAIM ...` | 转移超时消息给别的消费者重试 |
| `XTRIM events MAXLEN 10000` | 裁剪旧消息防内存爆 |

##### 消费组（精髓）

- **PUB/SUB 是广播**（所有订阅者都收到）
- **STREAMS 消费组是分摊**（一条消息只被组内一个消费者处理）

```
流里消息: 1,2,3,4,5,6
consumer1 XREADGROUP ... > → 1,2,3
consumer2 XREADGROUP ... > → 4,5,6
```

- `>`：只读组内还没被读过的消息
- 读完进入该消费者的 **PENDING 列表**
- 处理完要 `XACK`
- 没 ACK 的消息，可用 `XPENDING` 查看、`XCLAIM` 转移重试 → **"至少一次投递"**


### 03 · Atomic booking（原子预订）


> **用 Redis 事务保证"多步操作要么全做、要么全不做"，典型场景是订票/扣库存这种不能出错的业务。**


订票往往多步：

```
1. 检查库存 > 0
2. 库存 -1
3. 生成订单
4. 记录日志
```

中间被插进来或执行一半失败 → **超卖** 或 **数据不一致**。所以需要原子性。

#### Redis 事务：MULTI / EXEC

```redis
MULTI              -- 开启事务，之后命令先排队不执行
DECR stock         -- 库存 -1
LPUSH orders 1001  -- 生成订单
EXEC               -- 一次性按顺序执行
```

| 命令        | 作用          |
| --------- | ----------- |
| `MULTI`   | 开启事务，后续命令排队 |
| `EXEC`    | 一次性执行队列所有命令 |
| `DISCARD` | 放弃事务，清空队列   |

**关键：MULTI 到 EXEC 之间的命令连续执行，中间不会插入其他客户端的命令。**


#### 必须知道的坑：不支持回滚

> **Redis 事务不是"失败全部回滚"。`EXEC` 后命令一条条执行，某条失败其他继续执行。**

```redis
MULTI
SET a 1
INCR a        -- 报错（a 不是数字）
SET b 2
EXEC
```

结果：`a=1`、`b=2` 都成功，只有 `INCR a` 失败。**不会撤销。**


#### 更常用的替代：Lua 脚本

```lua
-- 原子扣库存：先判断，再扣
local stock = tonumber(redis.call('GET', KEYS[1]))
if stock <= 0 then
    return 0   -- 库存不足
end
redis.call('DECR', KEYS[1])
redis.call('LPUSH', KEYS[2], ARGV[1])
return 1       -- 成功
```

|          | MULTI/EXEC | Lua 脚本      |
| -------- | ---------- | ----------- |
| 原子不被打断   | ✅          | ✅           |
| 根据中间结果判断 | ❌          | ✅           |
| 失败回滚     | ❌          | ❌（但可先判断再操作） |
| 常用度      | 一般         | 高           |
|          |            |             |

**结论：需要"先判断再操作"的原子逻辑用 Lua；只是简单打包几条命令用 MULTI/EXEC。**