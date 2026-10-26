---
{"dg-publish":true,"permalink":"/AI/model-deploy/YOLOv13部署课程跟做笔记/","dg-note-properties":{}}
---

# YOLOv13 部署课程跟做笔记

来源：B 站《YOLOv13 从训练到模型部署全流程实战：PyTorch → ONNX → TensorRT》  
BV：`BV1MZbjzSEtV`  
配套仓库：<https://github.com/scq6688/YOLOv13-ONNX-TensorRT>

## 项目目标

从零完成一个目标检测项目的完整链路：

1. 采集并标注图像数据
2. 划分训练集、验证集、测试集
3. 训练 YOLOv13 模型
4. 导出 ONNX 模型
5. 分别实现 Python 与 C++ 的 ONNXRuntime 推理
6. 构建 TensorRT engine
7. 分别实现 Python 与 C++ 的 TensorRT 推理
8. 接入摄像头，完成实时检测与性能对比

## 每集内容与产出

### 1. PyTorch → ONNXRuntime → TensorRT 原理概述

**核心内容**

- 三种推理方式：PyTorch、ONNXRuntime、TensorRT
- PyTorch 适合训练，但生产环境推理性能不够优
- ONNX 是跨平台中间格式，兼容性好
- ONNXRuntime 是轻量推理引擎，支持 CPU、GPU、RK3588、Intel、ARM 等
- TensorRT 是 NVIDIA 专用高性能推理引擎，适合 GPU 和 Jetson
- TensorRT 依赖具体硬件环境，engine 文件通常要在目标设备上生成

**关键结论**

- 没有 NVIDIA 设备时，优先选择 ONNXRuntime
- 有 NVIDIA 设备时，优先选择 TensorRT

### 2. Ubuntu 安装 NVIDIA 驱动

**核心内容**

- 在 Ubuntu 中安装 NVIDIA 显卡驱动
- 可通过系统推荐驱动或附加驱动界面安装
- 安装后重启

**验证命令**

```bash
nvidia-smi
```

### 3. Anaconda 与 PyTorch GPU 环境

**核心内容**

- 安装 Anaconda
- 使用国内镜像加速下载
- 创建 Python 虚拟环境
- 在虚拟环境中安装 GPU 版 PyTorch

**关键命令**

```bash
conda create -n yolov13 python=3.11
conda activate yolov13
```

**跟做产出**

- 可用的 `yolov13` 虚拟环境
- GPU 版 PyTorch 环境

### 4. LabelImg 数据标注

**核心内容**

- 安装 LabelImg
- 创建 YOLO 格式数据集
- 标注猫、狗、杯子三类目标
- YOLO 标签格式：类别 ID + 归一化坐标

**跟做产出**

- 原始图像目录
- YOLO 标签目录
- `classes.txt`

### 5. 数据集划分

**核心内容**

- 训练集用于训练模型参数
- 验证集用于调整超参数
- 测试集用于最终评估
- 常见比例：小数据集可用 75/15/15 或 80/10/10
- 课程使用 75/15/15

**跟做产出**

```text
dataset/
  images/train/
  images/val/
  images/test/
  labels/train/
  labels/val/
  labels/test/
```

### 6. YOLOv13 训练实战

**核心内容**

- 下载 YOLOv13 源码
- 创建 `yolov13` 虚拟环境
- 安装 `torch`、`torchvision`
- 安装 Flash Attention
- 配置数据集 YAML
- 配置训练参数
- 训练模型
- 评估模型
- 接入摄像头测试

**关键参数**

- `data`：数据集 YAML 路径
- `imgsz`：训练分辨率
- `epochs`：训练轮数
- `batch`：批大小
- `workers`：数据加载线程数
- `device`：训练设备
- `amp`：混合精度开关

**关键文件**

- `dataset.yaml`
- `train.py`
- `predict.py`
- `val.py`
- `cam.py`

### 7. YOLOv13 转 ONNX 并用 Python 推理

**核心内容**

- 将 `.pt` 权重导出为 `.onnx`
- `half=True` 表示 FP16 精度
- 使用 ONNXRuntime 加载模型
- 完成图像预处理、推理、后处理
- 实现 NMS
- 在图像上绘制检测框

**跟做产出**

- `best.onnx`
- Python 版 ONNX 推理脚本

### 8. ONNXRuntime C++ 工程化部署

**核心内容**

- 下载 Linux x64 版 ONNXRuntime
- 源码编译 OpenCV C++ 版
- 编写 C++ 预处理模块
- 编写 C++ 后处理模块
- 使用 CMake 构建工程
- 实现图片检测和摄像头检测

**跟做产出**

- `yolov13_image`
- `yolov13_cam`
- C++ ONNX 推理工程

### 9. CUDA 与 cuDNN 配置

**核心内容**

- 下载并安装完整版 CUDA
- 配置环境变量
- 下载 cuDNN
- 将 cuDNN 库复制到 CUDA 目录
- 验证 CUDA 和 cuDNN

**说明**

PyTorch pip 安装通常只包含运行所需的 CUDA 子集。要使用 TensorRT，需要安装完整版 CUDA 和 cuDNN。

### 10. TensorRT C++ 与 Python 环境

**核心内容**

- 从 NVIDIA 官网下载 TensorRT
- 选择与 CUDA 版本匹配的 TensorRT
- 配置 `LD_LIBRARY_PATH`
- 编译官方 sample 验证 C++ 安装
- 在 Python 虚拟环境中安装 TensorRT whl
- 验证 Python 导入

### 11. YOLOv13 TensorRT Python 部署

**核心内容**

- 初始化 CUDA
- 加载 TensorRT engine
- 分配输入输出内存
- 绑定输入输出
- 图像预处理
- 模型推理
- 后处理
- 坐标映射回原图
- 绘制检测框
- 计算端到端帧率

**跟做产出**

- `yolov13.engine`
- Python 版 TensorRT 推理脚本

### 12. YOLOv13 TensorRT C++ 工业部署

**核心内容**

- C++ 读取 engine
- 创建 TensorRT runtime
- 反序列化 engine
- 创建执行 context
- 异步推理
- 高效前后处理
- 内存预分配
- OpenCV 可视化
- 摄像头实时检测

**性能参考**

- PyTorch Python：约 30~40 FPS
- ONNXRuntime / TensorRT Python：约 60 FPS
- TensorRT C++：约 120~130 FPS

## 推荐跟做顺序

1. 配置 Ubuntu + NVIDIA 驱动
2. 安装 Anaconda
3. 创建 `yolov13` 环境
4. 准备并标注数据
5. 划分数据集
6. 配置 `dataset.yaml`
7. 训练 YOLOv13
8. 评估模型精度
9. 接入摄像头，记录 PyTorch FPS
10. 导出 ONNX
11. 实现 Python ONNX 推理
12. 实现 C++ ONNX 推理
13. 安装 CUDA + cuDNN
14. 安装 TensorRT
15. 生成 TensorRT engine
16. 实现 Python TensorRT 推理
17. 实现 C++ TensorRT 推理
18. 对比所有方案的性能与精度

## 跟做时的注意点

1. **训练数据要足够**：课程示例只有 50 张左右，仅适合演示流程。实际项目建议每个类别至少数百到上千张。
2. **预训练权重看类别**：自定义类别与 COCO 类别相似时可加载；类别差异大时不建议加载。
3. **TensorRT engine 与硬件绑定**：不要把本机生成的 engine 直接复制到其他 GPU 使用，应在目标设备上生成。
4. **精度与速度平衡**：FP16 通常比较稳妥，INT8 速度更快但精度可能下降，需要重新评估。
5. **数据集划分要固定随机种子**：避免重复运行脚本时数据分布改变。
6. **C++ 工程注意版本匹配**：OpenCV、ONNXRuntime、CUDA、cuDNN、TensorRT 版本要对应。

