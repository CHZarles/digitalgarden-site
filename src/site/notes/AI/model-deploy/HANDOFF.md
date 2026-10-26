---
{"dg-publish":true,"permalink":"/AI/model-deploy/HANDOFF/","dg-note-properties":{}}
---

# Handoff

日期：2026-10-15

## 当前项目

基于 B 站课程《YOLOv13 从训练到模型部署全流程实战》，将原示例数据集替换为无人机视角目标检测数据集 **VisDrone2019-DET**。

目标链路：

```text
VisDrone 数据下载
→ VisDrone 标注转 YOLO
→ YOLOv13 训练
→ ONNX 导出
→ ONNXRuntime Python/C++ 推理
→ TensorRT Python/C++ 推理
```

## 本地文件

工作目录：

```bash
/Users/charles/Documents/Obsidian Vault/AI-Native/model-deploy
```

主要文件：

- `YOLOv13部署课程跟做笔记.md`：课程 12 集内容提取和跟做路线
- `visdrone_project/README.md`：VisDrone 项目使用说明
- `visdrone_project/scripts/download_visdrone.py`：数据下载脚本
- `visdrone_project/scripts/convert_visdrone_to_yolo.py`：VisDrone → YOLO 标注转换脚本
- `visdrone_project/scripts/validate_dataset.py`：YOLO 数据集校验脚本
- `visdrone_project/scripts/train_yolov13.py`：YOLOv13 训练脚本，当前 `device="cuda"`
- `visdrone_project/data/visdrone.yaml`：数据集配置，类别为 VisDrone 10 类
- `course-materials/`：B 站课程字幕和文本提取结果

注意：本地当前脚本在 `visdrone_project/scripts/` 下。

## DGX Spark 环境

连接方式：

```bash
ssh 36.141.69.172
```

主机信息：

- 主机名：`spark-4805`
- 用户：`czh`
- 系统：Ubuntu ARM64
- 内核：`6.17.0-1029-nvidia`
- GPU：NVIDIA GB10
- 驱动：`610.43.02`
- Python：`3.12.3`
- 虚拟环境：`~/visdrone_project/.venv`

项目路径：

```bash
/home/czh/visdrone_project
```

## 远端当前状态

已完成：

1. 创建 `~/visdrone_project`
2. 创建 Python 虚拟环境 `.venv`
3. 安装 `requests`、`pillow`
4. 下载 VisDrone train/val 数据
5. 解压数据
6. 转换为 YOLO 格式
7. 校验数据集通过

数据位置：

- 原始数据：`~/visdrone_project/data/VisDrone2019-DET`
- YOLO 数据：`~/visdrone_project/data/yolo`

数据规模：

- Train：6,471 张图片，313,557 个目标框
- Val：548 张图片，33,873 个目标框

已过滤：

- `ignored regions`
- `others`
- 无效标注

## 类别映射

VisDrone 原始类别 0~9 转为 YOLO 类别 0~9：

```text
0 pedestrian
1 people
2 bicycle
3 car
4 van
5 truck
6 tricycle
7 awning-tricycle
8 bus
9 motor
```

## 当前问题

远端 GitHub 直连超时，因此数据在本机下载后通过 `scp` 传入 DGX Spark。

远端脚本当前位于 `~/visdrone_project/` 根目录，而不是本地的 `scripts/` 子目录：

- `download_visdrone.py`
- `convert_visdrone_to_yolo.py`
- `validate_dataset.py`
- `train_yolov13.py`
- `visdrone.yaml`
- `README.md`

远端 `visdrone.yaml` 中的绝对路径仍是本机 macOS 路径，训练前需要改成：

```yaml
path: /home/czh/visdrone_project/data/yolo
```

## 下一步

### 1. 修正远端数据集路径

```bash
ssh 36.141.69.172
cd ~/visdrone_project
sed -i 's#^path:.*#path: /home/czh/visdrone_project/data/yolo#' visdrone.yaml
```

### 2. 安训练依赖

```bash
source .venv/bin/activate
pip install -U pip ultralytics
```

如果 `ultralytics` 在 ARM64 上安装遇到问题，优先检查 PyTorch CUDA/ARM 轮子。

### 3. 启动训练

```bash
cd ~/visdrone_project
source .venv/bin/activate
python train_yolov13.py
```

当前训练参数：

```python
data="../data/visdrone.yaml"
imgsz=1280
epochs=50
batch=-1
device="cuda"
```

注意：`train_yolov13.py` 位于项目根目录时，`data="../data/visdrone.yaml"` 是错误路径。需要改成：

```python
data="visdrone.yaml"
```

或将脚本移动到 `scripts/` 后再运行。

如果 `batch=-1` 自动估批失败，改为：

```python
batch=16
```

显存或统一内存压力大时继续降到 `8`。

### 4. 训练完成后

建议按顺序验证：

1. 用 val 集评估 mAP
2. 导出 ONNX
3. 用 ONNXRuntime Python 推理
4. 导出 TensorRT engine
5. 用 TensorRT Python 推理
6. 再做 C++ 部署

## 关键命令备份

### 同步本地工程到远端

```bash
scp -r visdrone_project/README.md \
  visdrone_project/data/visdrone.yaml \
  visdrone_project/scripts/download_visdrone.py \
  visdrone_project/scripts/convert_visdrone_to_yolo.py \
  visdrone_project/scripts/validate_dataset.py \
  visdrone_project/scripts/train_yolov13.py \
  36.141.69.172:/home/czh/visdrone_project/
```

### 远端重新校验数据

```bash
ssh 36.141.69.172
cd ~/visdrone_project
.venv/bin/python validate_dataset.py \
  --dataset /home/czh/visdrone_project/data/yolo \
  --splits train val
```

### 查看远端 GPU

```bash
ssh 36.141.69.172 'nvidia-smi'
```

