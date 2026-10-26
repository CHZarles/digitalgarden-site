---
dg-publish: true
permalink: /AI/CUDA/CUDA 101：从线程组织到硬件执行/
---
> **结论**：CUDA 用 Grid、Block 和 Thread 组织一次计算。GPU 用 SM 和 Warp 执行这些线程。程序的组织图不是芯片的物理布局图。

本文讨论常见的 CUDA C++ SIMT Kernel。本文把正确性规则和性能现象分开说明。

## 术语

| 术语 | 含义 |
|---|---|
| Host（主机） | 运行主机代码的 CPU 及其内存。 |
| Device（设备） | 执行 Kernel 的 GPU 及其设备内存。 |
| Kernel（核函数） | 由 GPU 线程执行的函数。 |
| Grid（网格） | 一次 Kernel 启动中的全部 Block。 |
| Block（线程块） | 一组在同一个 SM 上执行的 Thread。 |
| Thread（线程） | 执行一份 Kernel 代码的逻辑实例。 |
| SM（流式多处理器） | 执行 Block 的 GPU 硬件单元。 |
| Warp（线程束） | 同一 Block 中的一组 32 个 Thread。 |
| SIMT（单指令多线程） | 以 Warp 为单位执行多个 Thread 的编程模型。 |
| Stream（流） | 按入队顺序执行操作的队列。 |

## 1. 用两种视角理解 CUDA

**程序视角：**

![CUDA 的线程组织与内存访问范围示意图](/img/user/AI/CUDA/img/cuda_逻辑示意图.png)

*图 1：线程组织与内存访问范围。图片由读者提供。*

图中的 Grid 包含多个 Block。每个 Block 包含多个 Thread。图中的寄存器表示 Thread 私有数据。图中的共享内存表示块内 Thread 可以访问的数据。

**启动关系：**

![Host、Stream、Kernel、Grid、Block 和 Thread 的关系](/img/user/AI/CUDA/img/01_launch.png)

*图 2：Host 向 Stream 提交启动操作。一次 Kernel 启动创建一个 Grid。*

Stream 保存启动操作。Stream 不是 Grid 的组成部分。同一个 Kernel 函数可以在同一个 Stream 中启动多次。[3]

**硬件映射：**

![Block 到 SM 的运行时映射](/img/user/AI/CUDA/img/02_mapping.png)

*图 3：Block 到 SM 的一种分配示例。箭头不规定 Block 的执行顺序。*

**Warp 与 SIMT：**

![Block、Warp、SIMT 和 Thread 的关系](/img/user/AI/CUDA/img/03_warp_simt.png)

*图 4：一个有 64 个 Thread 的 Block 分成两个 Warp。图中只展开 Warp 0。*

Warp 发生分支时，当前指令只由活跃的 Thread 执行。[1]

Grid、Block 和 Thread 描述程序如何划分工作。它们不是芯片上的固定区域。SM、计算单元和存储资源属于硬件。一个 SM 可以同时驻留多个 Block。一个 Block 的线程在同一个 SM 上执行。[1]

图中的「Grid (Device)」表示这次 Grid 在 GPU 上执行。它不表示一块 GPU 同时只能运行一个 Grid。图中的共享内存和寄存器属于 SM 的物理资源。图中的框表示程序的访问范围，不表示芯片上的位置。[1]

## 2. 一次 Kernel 启动怎样工作

Host 用启动配置指定 Grid 和 Block 的尺寸：

```cpp
kernel<<<gridSize, blockSize>>>(arguments);
```

`gridSize` 指定 Grid 中的 Block 数量。`blockSize` 指定每个 Block 的 Thread 数量。一次启动创建一个 Grid。同一个 Kernel 函数可以启动多次；每次启动都有自己的 Grid。[1][2]

Grid 给 Block 提供坐标范围。Grid 还定义这次启动的工作规模。Grid 可以是一维、二维或三维。维度帮助程序把线程映射到数组、图像或三维数据。[1]

GPU 将 Block 分配给 SM。Block 的执行顺序没有保证。Grid 很大时，所有 Block 无须同时驻留在 GPU 上。[1]

## 3. 每个 Thread 怎样找到自己的数据

CUDA 提供四组内建变量：[2]

| 变量 | 表示什么 | 在哪里相同 |
|---|---|---|
| `threadIdx` | Thread 在 Block 内的坐标 | 不同 Block 可以重复 |
| `blockIdx` | Block 在 Grid 内的坐标 | 同一 Block 内相同 |
| `blockDim` | Block 的尺寸 | 同一次启动内相同 |
| `gridDim` | Grid 的尺寸 | 同一次启动内相同 |

对于一维数据，Thread 可以计算全局索引：

```cpp
int i = blockIdx.x * blockDim.x + threadIdx.x;
```

例如，每个 Block 有 256 个 Thread。Block 0 的 Thread 0 得到 `i = 0`。Block 1 的 Thread 0 得到 `i = 256`。两个 Thread 的 `threadIdx.x` 都是 0；它们的 `blockIdx.x` 不同。

`threadIdx` 是 CUDA 提供的块内坐标。`i` 是程序计算的全局索引。同一 Warp 内的 Thread 执行相同的索引公式，但各自得到不同结果。[2]

![一维 Grid 中 Block 与 Thread 的索引](/img/user/AI/CUDA/img/07_index_1d.png)

*图 5：`threadIdx.x` 在每个 Block 中重新从 0 开始。`blockIdx.x * blockDim.x` 给每个 Block 一个不同的起点。*

![gridDim 改变 Grid 的范围](/img/user/AI/CUDA/img/08_griddim_extent.png)

*图 6：`gridDim.x` 决定有多少个 Block，因此决定这次启动覆盖多少个 Thread；它不改变已有 Thread 的索引。图中每个 Block 有 4 个 Thread。*

对于二维数据，分别计算两个方向的坐标：

```cpp
int x = blockIdx.x * blockDim.x + threadIdx.x;
int y = blockIdx.y * blockDim.y + threadIdx.y;
```

![二维 Grid 中的 Thread 坐标](/img/user/AI/CUDA/img/09_index_2d.png)

*图 7：`gridDim` 给出两个方向上的 Block 数。`x`、`y` 由各方向的 `blockIdx`、`blockDim` 和 `threadIdx` 计算。*

这些公式用来确定单个 Thread 的位置。`gridDim` 用来确定 Grid 的范围，也可用于计算总线程数。若要把二维坐标压成一维索引，还需要用到行宽；行宽可能由 `gridDim.x * blockDim.x` 得到，具体取决于数据布局。[2]

## 4. Warp 怎样执行 Thread

NVIDIA GPU 将同一 Block 的 Thread 按 32 个一组组成 Warp。一个有 256 个 Thread 的 Block 包含 8 个 Warp。Warp 是调度和执行的重要单位。Thread 仍各自保有程序状态和数据。[1][2]

如果 Block 有 100 个 Thread，最后一个 Warp 只有 4 个有效 Thread。其余 28 个位置闲置。因此，Block 的 Thread 总数通常选为 32 的倍数。具体大小还受资源用量和任务形状影响。[1]

同一 Warp 内的 Thread 可以走不同分支。不同分支会造成 **Warp 发散**。执行一个分支时，硬件屏蔽不走该分支的 Thread。发散可能降低硬件利用率；性能损失没有固定比例。[1]

## 5. 数据放在哪里

| 存储空间 | 谁能访问 | 数据通常存放在哪里 |
|---|---|---|
| 寄存器 | 单个 Thread 读写。 | SM 的寄存器存储体。 |
| 共享内存 | 同一 Block 的 Thread 读写。 | SM 的片上资源。 |
| 全局内存 | 设备上的 Thread 访问相应地址。 | 设备内存。 |
| 常量内存 | Kernel 中的 Thread 只读。 | 设备内存；SM 有常量缓存。 |
| 局部内存 | 单个 Thread 读写。 | 通常在设备内存。 |

**程序中的访问范围：**

![五种 CUDA 存储空间的访问范围](/img/user/AI/CUDA/img/04_memory_scope.png)

*图 8：寄存器和局部内存对 Thread 私有。共享内存由同一 Block 的 Thread 共用。*

**硬件中的存放位置：**

![五种 CUDA 存储空间的物理位置示意](/img/user/AI/CUDA/img/05_memory_physical.png)

*图 9：共享内存按 Block 分配，但使用 SM 的物理资源。局部内存对 Thread 私有，但其数据通常在设备内存。*

**一次块内复用的例子：**

![CUDA 中全局内存、共享内存、寄存器、常量内存与局部内存的数据流](/img/user/AI/CUDA/img/06_memory_flow.png)

*图 10：部分 Thread 从全局内存加载数据。块内 Thread 可以从共享内存重复读取。图中的共享内存路径不是每次计算的必经路径。*

图 8 表示谁能访问数据。图 9 表示物理资源的位置。两个视角不能混为一谈。[1][2]

## 6. Thread 怎样协作

同一 Block 的 Thread 可以用共享内存交换数据。一个 Thread 写入后，其他 Thread 读取前必须满足同步条件。`__syncthreads()` 提供常用的块内屏障。同一 Block 的全部 Thread 到达该屏障后，后续读取才可以依赖屏障前的写入。[2]

同一 Warp 的 Thread 还可以使用 Warp Shuffle 交换值。这个机制不使用共享内存，属于进阶内容。[4]

普通 Kernel 不提供任意 Block 之间的全局屏障。不同 Block 可以访问同一全局内存分配，但访问同一位置时必须处理顺序与数据竞争。[1]

如果下一阶段依赖前一阶段的全部结果，可以把两个 Kernel 依次放入同一个 Stream。同一 Stream 按入队顺序执行。Kernel 启动对 Host 通常是异步的；Host 读取结果前必须确认相关操作结束。[3]

较新的 GPU 还支持 Thread Block Cluster。Cluster 提供特定条件下的跨 Block 协作和分布式共享内存。这不改变普通 Block 的基础规则。[1]

## 7. 用数组加法串起这些概念

下面是 Kernel 与启动配置的片段。它不是完整程序。

```cpp
__global__ void add(const float* a, const float* b, float* c, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) {
        c[i] = a[i] + b[i];
    }
}

int blockSize = 256;
int gridSize = (n + blockSize - 1) / blockSize;
add<<<gridSize, blockSize>>>(d_a, d_b, d_c, n);
```

当 `n = 1000` 时，`gridSize = 4`。这次启动创建 4 个 Block，共 1024 个 Thread。索引为 1000 至 1023 的 Thread 不写数组。每个有效 Thread 负责一个数组元素。[2]

相邻 Thread 访问相邻元素。这种访问方式有利于合并全局内存请求。合并访问不保证只产生一次内存事务。实际事务数取决于地址分布、数据大小和对齐方式。[2]

## 初学阶段的稳定心智模型

1. 一次 Kernel 启动定义一个 Grid。
2. Grid 包含 Block；Block 包含 Thread。
3. 一个 Block 在一个 SM 上执行；不同 Block 的顺序没有保证。
4. 同一 Block 的 Thread 可以用共享内存和块内屏障协作。
5. 同一 Warp 的 32 个 Thread 一起受硬件调度，但各自保有索引和数据。
6. 不同 Block 访问同一全局内存时，程序必须处理数据竞争和执行顺序。
7. 程序组织图说明逻辑关系；硬件图说明执行资源。

## 来源与验证

- [1] [NVIDIA CUDA Programming Guide：Programming Model](https://docs.nvidia.com/cuda/cuda-programming-guide/01-introduction/programming-model.html)。核对线程层级、SM、Warp、内存与 Cluster。
- [2] [NVIDIA CUDA Programming Guide：Writing SIMT Kernels](https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/writing-cuda-kernels.html)。核对内建索引、共享内存、块内同步与合并访问。
- [3] [NVIDIA CUDA Programming Guide：Asynchronous Execution](https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/asynchronous-execution.html)。核对 Stream 顺序与异步启动。
- [4] [NVIDIA CUDA Programming Guide：C++ Language Extensions](https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/cpp-language-extensions.html)。核对 Warp Shuffle 函数。
- [对话材料](https://chat.deepseek.com/share/2io8pj763gher0l5hw)。用于确定本文覆盖的问题。

**验证状态**：已验证上述概念与官方文档一致。示例代码只用于说明索引和启动尺寸；未编译或运行。
