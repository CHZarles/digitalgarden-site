---
{"dg-publish":true,"permalink":"/CS工程体系/计算机网络/HTTP协议系列/HTTP 基础/","dg-note-properties":{}}
---

### 请求-响应协议

http 规定两件事
- 客户端如何表达请求
- 服务器如何返回结果


client:
```http
GET /user/42 HTTP1.1
Host: api.example.com
Accept: application/json
```
server:
```HTTP
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 31

{ "id":42 , "name":"Alice" }
```

#### 请求报文

请求行
- 方法    请求目标              HTTP 版本
- GET     /users/42             HTTP/1.1
Header
- 描述通讯信息
空行
Body（可选）
- HTML/JSON/XML/图片/视频/压缩包/表单数据/....

#### 响应报文

状态行
- HTTP 版本    状态码    原因短语
- HTTP/1.1        200        OK
Header
-  描述通讯信息
空行
body（可选）
- 同上



**HTTP 不限制 Body 的具体格式，格式由 `Content-Type` 说明。**




## 无状态

HTTP 协议是无状态的，本身不会自动记住上一次请求


如：

```
请求 1：登录
请求 2：查看订单
```

从 HTTP 协议角度看，请求 2 并不知道请求 1 发生过。


> HTTP 层不会自动替你维护“这是同一个用户”的上下文。


## Cookie  Session Token

登录后的典型流程：

```
1. 客户端 POST /login
2. 服务器验证用户名和密码
3. 服务器返回身份凭证
4. 客户端以后每次请求都携带凭证
```


#### Cookie

服务器响应：

```
HTTP/1.1 200 OK
Set-Cookie: session_id=abc123; HttpOnly; Secure; SameSite=Lax
```

浏览器保存 Cookie，之后自动发送：

```
GET /profile HTTP/1.1
Cookie: session_id=abc123
```
> 只带数据，**不带属性**。 HttpOnly, Secure 这种算属性


Cookie 是客户端保存、自动随请求发送的一小段数据。

常见属性：

- `HttpOnly`：JavaScript 不能直接读取
- `Secure`：只通过 HTTPS 发送
- `SameSite`：限制跨站请求携带 Cookie
- `Domain`：作用域名
- `Path`：作用路径
- `Max-Age` / `Expires`：有效期


### Session

Session 通常是服务器端保存的状态：

```
session_id=abc123
        ↓
服务器 Session 存储：
abc123 → 用户 Alice、登录时间、权限
```

客户端只保存一个随机 ID，真正的信息在服务器端。

优点：

- 服务端容易撤销登录
- 不把太多信息暴露给客户端

代价：

- 服务器需要维护 Session 存储
- 多台服务器时要共享存储，或使用其他会话策略


> **Session 没有标准**，只是一个**被广泛采用的模式（pattern）**
> - 比如 Java生态里的 Tomcat 集成了 **Servlet 规范里的 `HttpSession` API**
> -  你完全可以不用它，自己发明一套（比如把状态编码进 token、或用自定义 header）



### Token

Token 通常由客户端保存，并主动放入请求：

```
Authorization: Bearer eyJhbGciOi...
```

常见形式：

- 不透明 Token：服务器拿它去查数据库或缓存
- JWT：Token 内部包含声明，服务器可以验证签名

Token 不代表一定比 Session 安全。安全性取决于：

- 是否使用 HTTPS
- 是否妥善保存
- 是否设置过期时间
- 是否支持撤销
- 是否防止重放和窃取




## URI URL URN

URI 是 统一资源标识符

```
URI
├── URL：通过位置或访问方式标识资源
└── URN：通过持久名称标识资源
```

### URI 的设计哲学

URI 不一定对应服务器上的一个文件。

```
/users/42
/orders/2026-001
/articles/http-basics
```

它们更适合被理解为：

> 对某种资源的稳定标识。

资源可以是：

- 一个用户
- 一组订单
- 一篇文章
- 一次搜索结果
- 一个抽象业务对象

URI 设计的重点不是“服务器目录结构”，而是“资源身份”。



## HTTP 方法

HTTP 方法是在向客户端、缓存、代理和开发者作出语义承诺。

#### GET

读取资源
- Safe
- 幂等
	- 相同请求执行一次或多次，资源状态相同
#### POST
 提交一个处理请求
	- 把数据提交给某个资源，由服务器处理

**创建**资源是最常见的用法, 此外还有
	- 执行业务动作
	- 提交表单
	- 触发复杂处理
	- 进行搜索
	- 上传文件

 POST 通常：
	- 不安全
	- 不幂等
		- 如果客户端因为网络超时而重试 POST，可能会创建两份订单。因此支付、下单等场景常使用幂等键：   `Idempotency-Key: request-abc-123`
	- 默认不适合直接缓存


#### PUT

PUT 的核心语义是：

> 用请求中的表示，替换指定 URI 对应的资源。


``` HTTP
PUT /users/42
Content-Type: application/json

{
  "id": 42,
  "name": "Alice",
  "email": "alice@example.com"
}
```

PUT：客户端明确指定要操作 `/users/42`

方法是**幂等的**

⚠️注意：如果接口约定 PUT 是完整替换，那么缺少字段可能意味着：

- 字段被清空
- 使用默认值
- 请求非法

具体行为需要 API 文档明确，但客户端不应把 PUT 当成 PATCH 使用。


### PATCH

这个方法的含义是对资源执行局部修改。

PATCH 只提交需要变化的部分，不要求携带完整资源。

但 PATCH 是否幂等，取决于具体操作：

#### 幂等的 PATCH

```
{"name": "Bob"}
```

重复执行后，名字仍然是 Bob。

#### 非幂等的 PATCH

```
{"op": "increment", "path": "/balance", "value": 10}
```

重复执行可能加两次钱。

所以：

> PATCH 不是天然幂等，必须看补丁操作本身。



### DELETE

删除指定 URI 对应的资源。DELETE 通常被认为是幂等的。
```HTTP
DELETE /users/42
```


## REST

HTTP 的一种资源化使用方式。 用一个简单公式理解 REST 风格：

```
URI = 名词，表示资源
HTTP 方法 = 动词，表示操作
状态码 = 操作结果
```

例如：

```
GET /articles/123
PATCH /articles/123
DELETE /articles/123
```

表示获取/修改/删除文章 123。

