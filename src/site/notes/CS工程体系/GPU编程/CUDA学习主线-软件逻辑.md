---
{"dg-publish":true,"permalink":"/CS工程体系/GPU编程/CUDA学习主线-软件逻辑/","dg-note-properties":{}}
---

# CUDA 学习主线-软件逻辑

> **从 GPU 提供的机制出发，学习 CUDA 如何组织状态、提交工作和回收结果。**

这条主线关注 CUDA Runtime、Driver API 和 kernel 代码的行为。
它和 [[CS工程体系/GPU编程/CUDA学习主线-硬件逻辑\|CUDA学习主线-硬件逻辑]] 使用同一组硬件事实，但观察角度不同。

## 软件和硬件的共同边界

CUDA 软件通过这些接口使用 GPU：

- kernel 函数与 Grid / Block / Thread 配置；
- CUDA Runtime 或 Driver API 的 Context、Module、Stream 和 Event；
- Device 内存、Pinned Host Memory、Unified Memory 和映射内存；
- kernel 参数、命令队列和异步提交；
- `__syncthreads()`、原子操作、Memory Fence 和 Stream 同步；
- CUDA Error、Event、Profiler 和设备状态查询。

硬件专题解释线程、Cache、显存和执行单元怎样工作。
软件专题解释 CUDA 如何把这些机制组织成可编程接口。

## 软件主线的共同路径

```text
Host 代码选择设备并建立 Context
  → 分配或映射 Host / Device 内存
  → 把输入数据复制到 Device
  → 配置 Grid、Block、共享内存和 Stream
  → 异步提交 kernel
  → GPU 把 Block 分配到 SM，执行 Warp 指令
  → kernel 写回 Device 内存或产生错误状态
  → Event、同步或下一次 API 调用观察完成
  → 复制结果回 Host，释放资源
```

这条路径是学习索引。每个专题只展开自己负责的状态和动作。

## 推荐顺序

| 顺序 | 主题 | 软件主线要回答的问题 |
| --- | --- | --- |
| 1 | [[CS工程体系/GPU编程/GPU硬件结构-软件逻辑\|GPU硬件结构-软件逻辑]] | CUDA 能看到哪些设备属性，Runtime 和 Driver 怎样建立执行环境？ |
| 2 | [[CS工程体系/GPU编程/CUDA线程层次与执行模型-软件逻辑\|CUDA线程层次与执行模型-软件逻辑]] | Grid、Block、Warp 和线程索引怎样表达并行任务？ |
| 3 | [[GPU内存层次-软件逻辑\|GPU内存层次-软件逻辑]] | `cudaMalloc`、共享内存、常量内存和 Unified Memory 怎样选择？ |
| 4 | [[CUDA数据传输-软件逻辑\|CUDA数据传输-软件逻辑]] | Host 与 Device 之间怎样复制、映射和重叠传输？ |
| 5 | [[CUDA同步与原子操作-软件逻辑\|CUDA同步与原子操作-软件逻辑]] | 线程块内、设备内和 Host 侧分别怎样同步？ |
| 6 | [[CUDA资源分配与占用率-软件逻辑\|CUDA资源分配与占用率-软件逻辑]] | 如何根据寄存器、共享内存和线程数判断可并发 Block？ |
| 7 | [[CUDA流与异步执行-软件逻辑\|CUDA流与异步执行-软件逻辑]] | Stream、Event 和默认流怎样表达依赖关系？ |
| 8 | [[CUDA错误处理与性能分析-软件逻辑\|CUDA错误处理与性能分析-软件逻辑]] | 异步错误在哪里出现，如何用 profiler 找到瓶颈？ |

## 每个软件专题的固定格式

```text
一张软件状态图
+ 一条 CUDA 关键路径
+ 一个业务场景例子
```

业务场景放在末尾，用来解释 API 选择带来的行为、延迟和吞吐影响。

