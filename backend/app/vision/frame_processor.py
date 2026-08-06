"""
frame_processor.py
~~~~~~~~~~~~~~~~~~
Lightweight frame preprocessing utilities.

Note: Person detection + pose estimation is now handled in a single YOLOv8n-pose
pass inside PoseTracker, so this module is intentionally minimal.
"""
import cv2
import numpy as np


def resize_for_inference(frame: np.ndarray, max_width: int = 960) -> tuple[np.ndarray, float]:
    """
    Resize a frame to max_width while preserving aspect ratio.

    Returns:
        (resized_frame, scale_factor)
        scale_factor = original_width / new_width
        Multiply output coordinates by scale_factor to get original-space coords.
    """
    orig_w = frame.shape[1]
    if orig_w <= max_width:
        return frame, 1.0

    scale = orig_w / max_width
    new_w = max_width
    new_h = int(frame.shape[0] / scale)
    return cv2.resize(frame, (new_w, new_h)), scale
