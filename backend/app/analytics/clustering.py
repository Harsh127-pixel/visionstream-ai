"""
clustering.py
~~~~~~~~~~~~~
Formation analysis via KMeans clustering of player positions.
"""
import math
import logging
from typing import Optional

import numpy as np
from sklearn.cluster import KMeans

logger = logging.getLogger(__name__)


def cluster_formation(
    player_positions: list[dict],
    k: int = 3,
) -> dict:
    """
    Group players into formation zones using KMeans.

    Args:
        player_positions: List of {"player_id": int, "x": float, "y": float}
        k: Number of clusters (formation zones). Reduced automatically when
           fewer players than k are detected.

    Returns:
        {
            "clusters": [
                {"cluster_id": int, "centroid": {"x": float, "y": float},
                 "player_ids": [int, ...]},
                ...
            ],
            "formation_spread": float   # avg distance of players from overall centroid
        }
    """
    # ── Edge cases ──────────────────────────────────────────────────────────────
    if not player_positions:
        return {"clusters": [], "formation_spread": 0.0}

    n = len(player_positions)
    k = min(k, n)   # can't have more clusters than players

    # ── Extract coordinates ─────────────────────────────────────────────────────
    ids  = [p["player_id"] for p in player_positions]
    pts  = np.array([[p["x"], p["y"]] for p in player_positions], dtype=float)

    # ── KMeans ──────────────────────────────────────────────────────────────────
    km = KMeans(n_clusters=k, n_init="auto", random_state=42)
    labels = km.fit_predict(pts)

    # ── Build cluster list ───────────────────────────────────────────────────────
    clusters: list[dict] = []
    for cluster_id in range(k):
        mask = labels == cluster_id
        cx, cy = km.cluster_centers_[cluster_id]
        member_ids = [ids[i] for i in range(n) if mask[i]]
        clusters.append({
            "cluster_id": cluster_id,
            "centroid": {"x": float(cx), "y": float(cy)},
            "player_ids": member_ids,
        })

    # ── Formation spread ─────────────────────────────────────────────────────────
    overall_cx = float(pts[:, 0].mean())
    overall_cy = float(pts[:, 1].mean())
    spread = float(np.mean([
        math.hypot(p["x"] - overall_cx, p["y"] - overall_cy)
        for p in player_positions
    ]))

    return {"clusters": clusters, "formation_spread": spread}
