---
{"dg-publish":true,"permalink":"/CS工程体系/GPU编程/CUDA学习入口/","dg-note-properties":{}}
---

# CUDA 学习入口

这套笔记沿用“操作系统”目录的学习方式：

```text
硬件路径
  → 软件 / API 如何配置硬件
  → 一条完整的执行或数据路径
  → 用代码和性能现象验证
```

不要从 API 清单开始背。先能回答一次 kernel 从 Host 到 GPU、从线程到显存、再把结果交回 Host 的完整路径。

## 先只理解一个词：kernel launch

先暂时忘记 Grid、Block、Warp、Stream 和 Context。

```cpp
// 这是一个在 GPU 上运行的函数
__global__ void add_one(int* data) {
    data[0] = data[0] + 1;
}

// CPU 执行这一行，请 GPU 运行上面的函数
add_one<<<1, 1>>>(data);

// CPU 等 GPU 做完
cudaDeviceSynchronize();
```

这段代码里有三个不同动作：

| 代码 | 谁在做 | 含义 |
| --- | --- | --- |
| `__global__ void add_one(...)` | CUDA 编译器 / GPU | 声明一个可以由 CPU 发起、在 GPU 执行的函数，也叫 kernel |
| `add_one<<<1, 1>>>(data)` | CPU | 发出一次 kernel launch，请 GPU 执行这个函数 |
| `cudaDeviceSynchronize()` | CPU 等待 | 等 GPU 完成已经提交的工作 |

`<<<1, 1>>>` 不是普通函数参数。它是执行配置：先理解成“启动 1 组、每组 1 个 GPU 线程”。
真正传给函数的参数是后面的 `(data)`。

最小因果链只有这一条：

```text
CPU 执行 launch 语句
  → 请求送到 GPU
  → GPU 执行 kernel
  → CPU 等待或继续执行
```

所以，**kernel 是 GPU 要执行的函数，kernel launch 是 CPU 请求 GPU 执行这个函数的动作**。

先把这句话和上面的 3 行代码看懂，再继续读后面的硬件结构。

## 第一次阅读顺序

1. [[CS工程体系/GPU编程/CUDA学习主线-硬件逻辑\|CUDA学习主线-硬件逻辑]]：先看 GPU 的组件和总体路径，再从 [[CS工程体系/GPU编程/GPU硬件结构-硬件逻辑\|GPU硬件结构-硬件逻辑]] 选择目标芯片的独立结构图。
2. [[CS工程体系/GPU编程/CUDA学习主线-软件逻辑\|CUDA学习主线-软件逻辑]]：再看 Runtime、Context、Stream 和 kernel 提交。
3. [[CS工程体系/GPU编程/GPU硬件结构-硬件逻辑\|GPU硬件结构-硬件逻辑]]：沿着一次 kernel launch 追踪硬件，并读对应的 Volta / Turing / Ampere / Ada / Hopper / Blackwell 图。
4. [[CS工程体系/GPU编程/GPU硬件结构-软件逻辑\|GPU硬件结构-软件逻辑]]：对照 Host 代码如何建立 Context、分配内存和提交 kernel。
5. [[CS工程体系/GPU编程/软件-硬件边界专题-硬件逻辑\|软件-硬件边界专题-硬件逻辑]] 与 [[CS工程体系/GPU编程/软件-硬件边界专题-软件逻辑\|软件-硬件边界专题-软件逻辑]]：确认每个概念属于硬件机制还是 CUDA 组织方式。

读完第一主题后，再进入：

```text
线程层次与执行模型
  → GPU 内存层次
  → Host / Device 数据传输
  → 同步与原子操作
  → 资源分配与占用率
  → Stream、异步执行和性能分析
```

## 每篇笔记的阅读动作

对每个主题固定问四个问题：

1. 硬件里有哪些组件？
2. 数据或控制请求经过什么路径？
3. CUDA 用哪个 API、关键字或线程组织方式接入这条路径？
4. 这条路径如何影响延迟、吞吐、带宽或并发？

## 第一个实践闭环

先完成一个最小的向量加法：

```text
Host 分配输入
  → Device 分配缓冲区
  → Host 到 Device 复制
  → 启动一维 Grid / Block
  → kernel 读取输入并写入输出
  → 同步并检查错误
  → Device 到 Host 复制
  → 校验结果并释放资源
```

这个练习只验证路径是否闭合，不以优化为目标。确认路径后，再用矩阵乘法观察共享内存、同步和访存模式。

## 学习记录建议

每学完一个主题，在对应文件末尾补三段：

```text
我能画出的路径：
我还分不清的硬件 / 软件边界：
我用什么代码或测量结果验证：
```

