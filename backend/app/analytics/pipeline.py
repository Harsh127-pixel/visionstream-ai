"""
pipeline.py
~~~~~~~~~~~
Combined analytics pipeline that turns a raw player list (from PoseTracker)
into a single broadcast-ready JSON payload.
"""
import logging
from typing import Optional

from .clustering import cluster_formation
from .fatigue    import FatigueTracker

logger = logging.getLogger(__name__)

# Module-level FatigueTracker so it persists state across frames
_fatigue_tracker = FatigueTracker()


def run_analytics(
    player_list: list[dict],
    timestamp: Optional[float] = None,
    k_clusters: int = 3,
) -> dict:
    """
    Run the full analytics pipeline on a detected player list.

    Args:
        player_list: List of player dicts from PoseTracker.process_frame():
            [{
                "player_id": int,
                "centroid": {"x": float, "y": float},
                "bbox": {...},
                "landmarks": [...]
            }, ...]
        timestamp: UNIX timestamp of the frame (uses current time if None).
        k_clusters: How many formation zones to cluster into.

    Returns:
        {
            "timestamp": float,
            "player_count": int,
            "formation": {
                "clusters": [...],
                "formation_spread": float
            },
            "fatigue": {player_id: score, ...},
            "players": [
                {"player_id": int, "centroid": {...}, "fatigue": float}
            ]
        }
    """
    import time
    if timestamp is None:
        timestamp = time.time()

    # ── Update fatigue history ───────────────────────────────────────────────────
    for player in player_list:
        pid = player["player_id"]
        cx  = player["centroid"]["x"]
        cy  = player["centroid"]["y"]
        _fatigue_tracker.update(pid, cx, cy, ts=timestamp)

    # ── Build position list for clustering ──────────────────────────────────────
    positions = [
        {"player_id": p["player_id"], "x": p["centroid"]["x"], "y": p["centroid"]["y"]}
        for p in player_list
    ]

    # ── Run sub-modules ──────────────────────────────────────────────────────────
    formation = cluster_formation(positions, k=k_clusters)
    fatigue_scores = _fatigue_tracker.all_fatigue()

    # ── Build per-player summary ─────────────────────────────────────────────────
    players_summary = [
        {
            "player_id": p["player_id"],
            "centroid":  p["centroid"],
            "fatigue":   fatigue_scores.get(p["player_id"], 50.0),
        }
        for p in player_list
    ]

    return {
        "timestamp":     timestamp,
        "player_count":  len(player_list),
        "formation":     formation,
        "fatigue":       fatigue_scores,
        "players":       players_summary,
    }


def reset_fatigue() -> None:
    """Reset the module-level FatigueTracker (useful between sessions)."""
    global _fatigue_tracker
    _fatigue_tracker = FatigueTracker()
