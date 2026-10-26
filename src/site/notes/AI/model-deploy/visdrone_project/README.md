---
{"dg-publish":true,"permalink":"/AI/model-deploy/visdrone_project/README/","dg-note-properties":{}}
---

# VisDrone2019-DET to YOLOv13

本目录用于把 B 站课程中的猫/狗/杯子示例，替换为无人机视角目标检测数据集 VisDrone2019-DET。

## 1. 安装依赖

```bash
python -m pip install requests pillow ultralytics
```

## 2. 下载数据

```bash
cd visdrone_project
python scripts/download_visdrone.py --splits train val
```

## 3. 解压数据

```bash
cd data/VisDrone2019-DET
unzip VisDrone2019-DET-train.zip
unzip VisDrone2019-DET-val.zip
```

## 4. 转换标注

```bash
cd ../../
python scripts/convert_visdrone_to_yolo.py --splits train val
python scripts/validate_dataset.py --splits train val
```

## 5. 训练

macOS 使用 MPS：

```bash
cd scripts
python train_yolov13.py
```

Linux NVIDIA GPU 使用 CUDA：

```python
device="0"
```

如果显存不足，把 `batch=-1` 改为固定 batch，例如 `batch=8` 或 `batch=4`。

## 类别映射

VisDrone 原始类别 0~9 会转换为 YOLO 类别 0~9。

注意：VisDrone 的 `ignored regions`、`others` 和无效标注会被过滤。

