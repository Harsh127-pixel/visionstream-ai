"""
pose_tracker.py
~~~~~~~~~~~~~~~
Wraps YOLOv8n-Pose to detect players and estimate 17 COCO keypoints per person.
Uses ultralytics which is already installed and fully supports Python 3.13.

Replaces the MediaPipe approach, which has no Python 3.13 wheels.
"""
import logging

import cv2
import numpy as np
from ultralytics import YOLO

logger = logging.getLogger(__name__)

# COCO keypoint names (indices 0-16)
COCO_KEYPOINTS = [
    "nose", "left_eye", "right_eye", "left_ear", "right_ear",
    "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
    "left_wrist", "right_wrist", "left_hip", "right_hip",
    "left_knee", "right_knee", "left_ankle", "right_ankle"
]

# Hip indices in COCO keypoints (for centroid calculation)
LEFT_HIP_IDX  = 11
RIGHT_HIP_IDX = 12


class PoseTracker:
    def __init__(self):
        """Load YOLOv8n-Pose once. Auto-downloads on first run (~6 MB)."""
        try:
            self._model = YOLO("yolov8n-pose.pt")
            logger.info("PoseTracker: YOLOv8n-Pose model loaded successfully.")
        except Exception as e:
            logger.error(f"PoseTracker: Failed to load model: {e}")
            self._model = None

    def process_frame(self, frame: np.ndarray) -> list[dict]:
        """
        Run YOLOv8 pose estimation on a full BGR frame.

        Returns:
            List of player dicts:
            {
                "player_id": int,
                "bbox": {"x_min", "y_min", "x_max", "y_max", "confidence"},
                "landmarks": [{"name": str, "x": float, "y": float, "confidence": float}, ...],
                "centroid": {"x": float, "y": float}
            }
        """
        if self._model is None:
            return []

        # Resize to max 960px wide for performance
        orig_h, orig_w = frame.shape[:2]
        if orig_w > 960:
            scale = 960 / orig_w
            frame_in = cv2.resize(frame, (960, int(orig_h * scale)))
        else:
            scale = 1.0
            frame_in = frame

        try:
            results = self._model(frame_in, verbose=False)
        except Exception as e:
            logger.error(f"PoseTracker inference error: {e}")
            return []

        players = []

        for result in results:
            # result.boxes: bounding boxes (N, 6) – xyxy + conf + cls
            # result.keypoints: keypoints (N, 17, 3) – x, y, confidence
            if result.boxes is None or result.keypoints is None:
                continue

            boxes = result.boxes.xyxy.cpu().numpy()        # (N, 4)
            confs = result.boxes.conf.cpu().numpy()        # (N,)
            kpts  = result.keypoints.data.cpu().numpy()    # (N, 17, 3)

            for i, (box, conf, kp) in enumerate(zip(boxes, confs, kpts)):
                x_min, y_min, x_max, y_max = box

                # Scale coordinates back to original frame size
                x_min = float(x_min / scale)
                y_min = float(y_min / scale)
                x_max = float(x_max / scale)
                y_max = float(y_max / scale)

                landmarks = []
                for j, (kx, ky, kc) in enumerate(kp):
                    landmarks.append({
                        "name":       COCO_KEYPOINTS[j],
                        "x":          float(kx / scale),
                        "y":          float(ky / scale),
                        "confidence": float(kc),
                    })

                # Centroid = average of hip keypoints (if visible)
                left_hip  = landmarks[LEFT_HIP_IDX]
                right_hip = landmarks[RIGHT_HIP_IDX]
                centroid_x = (left_hip["x"] + right_hip["x"]) / 2
                centroid_y = (left_hip["y"] + right_hip["y"]) / 2

                players.append({
                    "player_id": i,
                    "bbox": {
                        "x_min":      x_min,
                        "y_min":      y_min,
                        "x_max":      x_max,
                        "y_max":      y_max,
                        "confidence": float(conf),
                    },
                    "landmarks": landmarks,
                    "centroid":  {"x": centroid_x, "y": centroid_y},
                })

        return players
