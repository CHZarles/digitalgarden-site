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

这一节只解决一个问题：**一个 Thread 怎样根据自己的坐标，找到它负责的数据位置？**

CUDA 给每个 Thread 提供四组内建变量。它们分别描述 Thread 的位置和整个执行范围：[2]

### 3.1 先认识四组内建变量

| 变量 | 描述 | 变化范围或相同范围 |
|---|---|---|
| `threadIdx` | Thread 在当前 Block 内的坐标 | 不同 Block 可以重复；同一 Block 内各 Thread 不同 |
| `blockIdx` | Block 在当前 Grid 内的坐标 | 同一 Block 内相同；不同 Block 通常不同 |
| `blockDim` | 一个 Block 在各方向的 Thread 数 | 同一次 Kernel 启动内相同 |
| `gridDim` | 一个 Grid 在各方向的 Block 数 | 同一次 Kernel 启动内相同 |

这些变量都有 `.x`、`.y`、`.z` 三个分量。使用哪个分量，取决于数据是一维、二维还是三维。

### 3.2 一维数据：把两个局部坐标接成一个全局索引

在一维数据中，每个 Block 负责一段连续位置。Thread 的全局索引是：

```cpp
int i = blockIdx.x * blockDim.x + threadIdx.x;
```

可以分两步读这个公式：

1. `blockIdx.x * blockDim.x`：找到当前 Block 负责的起点。
2. `threadIdx.x`：找到 Thread 在这个 Block 内的偏移量。

例如，每个 Block 有 256 个 Thread：

- Block 0 的 Thread 0：`0 * 256 + 0 = 0`。
- Block 1 的 Thread 0：`1 * 256 + 0 = 256`。

两个 Thread 的 `threadIdx.x` 都是 0，但它们属于不同 Block，所以 `blockIdx.x` 不同。

![一维 Grid 中 Block 与 Thread 的索引](/img/user/AI/CUDA/img/07_index_1d.png)

*图 5：`threadIdx.x` 在每个 Block 中重新从 0 开始。`blockIdx.x * blockDim.x` 给每个 Block 一个不同的起点。*

这里没有把 `gridDim.x` 乘进公式，因为 `gridDim.x` 表示 **Block 的总数**，不是当前 Block 的起点。它用于描述 Grid 的范围和总工作量，而不是计算某个 Thread 在本 Block 外的偏移。

![gridDim 改变 Grid 的范围](/img/user/AI/CUDA/img/08_griddim_extent.png)

*图 6：`gridDim.x` 决定有多少个 Block，因此决定这次启动覆盖多少个 Thread；它不改变已有 Thread 的索引。图中每个 Block 有 4 个 Thread。*

### 3.3 二维数据：分别计算两个方向

对于图像或矩阵，Thread 通常有两个坐标：

```cpp
int x = blockIdx.x * blockDim.x + threadIdx.x;
int y = blockIdx.y * blockDim.y + threadIdx.y;
```

`x` 和 `y` 分别计算，不需要把 `gridDim` 直接放进这两个坐标公式。`gridDim` 仍然规定 Grid 在两个方向上有多大。

![二维 Grid 中的 Thread 坐标](/img/user/AI/CUDA/img/09_index_2d.png)

*图 7：`gridDim` 给出两个方向上的 Block 数。`x`、`y` 由各方向的 `blockIdx`、`blockDim` 和 `threadIdx` 计算。*

如果数据在内存中是一条线，还可以把 `(x, y)` 再压成一维索引：

```cpp
int id = x + y * width;
```

这里的 `width` 是一行中有多少个元素。它属于数据布局，不一定等于 `gridDim.x`。

### 3.4 三维数据：先定位 Block，再定位 Thread

三维 Grid 可以先看成多层二维网格：`z` 表示第几层；每一层内部再用 `x` 和 `y` 定位 Block。

![三维 Grid 的分层表示](/img/user/AI/CUDA/img/17_3d_layers_simple.png)

*图 8：`gridDim = (2, 2, 3)` 表示 3 层，每层有 2×2 个 Block。*

找到 Block 后，再在这个 Block 内定位 Thread。Block 内的 `z` 仍表示层，`x` 和 `y` 表示该层中的位置。

![先定位 Block，再定位 Thread](/img/user/AI/CUDA/img/18_nested_index_simple.png)

*图 9：先得到 `block_id = 9`，再得到 `thread_offset = 5`，最后计算 `id = 9 × 8 + 5 = 77`。*

如果确实需要把三维坐标压成一个一维编号，可以明确写出两级展平：

```cpp
int block_id = blockIdx.x
             + blockIdx.y * gridDim.x
             + blockIdx.z * gridDim.x * gridDim.y;

int thread_offset = threadIdx.x
                  + threadIdx.y * blockDim.x
                  + threadIdx.z * blockDim.x * blockDim.y;

int threads_per_block = blockDim.x * blockDim.y * blockDim.z;
int id = block_id * threads_per_block + thread_offset;
```

这段代码采用“`x` 方向变化最快，`z` 方向变化最慢”的顺序。它先计算当前 Block 是整个 Grid 中的第几个，再计算当前 Thread 是该 Block 内的第几个，最后把两者拼接起来。

### 3.5 一句话记忆

> **`threadIdx` 找 Block 内的位置，`blockIdx` 找 Grid 内的 Block；`blockDim` 和 `gridDim` 告诉程序每一级有多大。**

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

*图 10：寄存器和局部内存对 Thread 私有。共享内存由同一 Block 的 Thread 共用。*

**硬件中的存放位置：**

![五种 CUDA 存储空间的物理位置示意](/img/user/AI/CUDA/img/05_memory_physical.png)

*图 11：共享内存按 Block 分配，但使用 SM 的物理资源。局部内存对 Thread 私有，但其数据通常在设备内存。*

**一次块内复用的例子：**

![CUDA 中全局内存、共享内存、寄存器、常量内存与局部内存的数据流](/img/user/AI/CUDA/img/06_memory_flow.png)

*图 12：部分 Thread 从全局内存加载数据。块内 Thread 可以从共享内存重复读取。图中的共享内存路径不是每次计算的必经路径。*

图 10 表示谁能访问数据。图 11 表示物理资源的位置。两个视角不能混为一谈。[1][2]

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
