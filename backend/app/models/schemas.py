"""
schemas.py
~~~~~~~~~~
Pydantic schemas for the outgoing WebSocket analytics payload.

These document and type the JSON structure broadcast over /ws/analytics.
They are not enforced at the socket layer (we send plain dicts), but serve
as the canonical contract for the frontend and any future OpenAPI docs.
"""
from __future__ import annotations
from typing import Optional
from pydantic import BaseModel


class LandmarkData(BaseModel):
    """Single COCO keypoint detected on a player."""
    name: str
    x: float
    y: float
    confidence: float


class BBoxData(BaseModel):
    """Bounding box around a detected player."""
    x_min: float
    y_min: float
    x_max: float
    y_max: float
    confidence: float


class CentroidData(BaseModel):
    """2D centroid position (averaged hip landmarks)."""
    x: float
    y: float


class PlayerData(BaseModel):
    """Per-player analytics summary broadcast per frame."""
    player_id: int
    centroid: CentroidData
    fatigue: float           # 0–100; higher = more fatigued


class ClusterCentroid(BaseModel):
    x: float
    y: float


class ClusterData(BaseModel):
    """One formation zone (KMeans cluster)."""
    cluster_id: int
    centroid: ClusterCentroid
    player_ids: list[int]


class FormationData(BaseModel):
    """Formation clustering results for a frame."""
    clusters: list[ClusterData]
    formation_spread: float   # average distance of players from overall centroid


class AnalyticsPayload(BaseModel):
    """
    Top-level payload broadcast over /ws/analytics every ~500 ms.

    JSON shape:
    {
        "timestamp":    1786023054.14,
        "player_count": 2,
        "formation":    { "clusters": [...], "formation_spread": 70.1 },
        "fatigue":      { "0": 12.5, "1": 67.0 },
        "players":      [ { "player_id": 0, "centroid": {...}, "fatigue": 12.5 }, ... ]
    }
    """
    timestamp: float
    player_count: int
    formation: FormationData
    fatigue: dict[str, float]   # player_id (str key from JSON) -> score
    players: list[PlayerData]
