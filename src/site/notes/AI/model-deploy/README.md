---
{"dg-publish":true,"permalink":"/AI/model-deploy/README/","dg-note-properties":{}}
---

# model-deploy

YOLOv13 model deployment practice based on the VisDrone2019-DET drone-view object detection dataset.

## Project workflow

```text
Download VisDrone data
  -> Convert annotations to YOLO format
  -> Validate the dataset
  -> Train YOLOv13
  -> Export and run ONNX Runtime / TensorRT inference
```

## Repository layout

- `visdrone_project/`: dataset preparation and training scripts
- `course-materials/`: course notes and extracted subtitles
- `YOLOv13部署课程跟做笔记.md`: end-to-end course notes
- `HANDOFF.md`: current progress and remote training notes

## Quick start

```bash
python -m pip install requests pillow ultralytics
python visdrone_project/scripts/download_visdrone.py --splits train val
# Extract the downloaded archives under visdrone_project/data/VisDrone2019-DET/
python visdrone_project/scripts/convert_visdrone_to_yolo.py --splits train val
python visdrone_project/scripts/validate_dataset.py --splits train val
```

The dataset archives, converted images, labels, model weights, and training runs are intentionally ignored by Git. Update `visdrone_project/data/visdrone.yaml` for the local dataset path before training.
