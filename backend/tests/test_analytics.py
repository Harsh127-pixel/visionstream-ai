"""
tests/test_analytics.py
~~~~~~~~~~~~~~~~~~~~~~~
Unit tests for clustering.py and fatigue.py.
Run with:  venv/Scripts/pytest tests/test_analytics.py -v
"""
import math
import time

import pytest

from app.analytics.clustering import cluster_formation
from app.analytics.fatigue    import FatigueTracker


# ── Fixtures ────────────────────────────────────────────────────────────────────

def make_player(pid: int, x: float, y: float) -> dict:
    return {"player_id": pid, "x": x, "y": y}


# ═══════════════════════════════════════════════════════════════════════════════
# clustering tests
# ═══════════════════════════════════════════════════════════════════════════════

class TestClusterFormation:

    def test_empty_input_returns_empty(self):
        result = cluster_formation([])
        assert result["clusters"] == []
        assert result["formation_spread"] == 0.0

    def test_fewer_players_than_k_reduces_k(self):
        """With only 2 players, k should silently drop from 3 → 2."""
        players = [make_player(0, 0, 0), make_player(1, 100, 100)]
        result = cluster_formation(players, k=3)
        assert len(result["clusters"]) == 2

    def test_cluster_count_matches_k(self):
        players = [make_player(i, float(i * 100), float(i * 50)) for i in range(9)]
        result = cluster_formation(players, k=3)
        assert len(result["clusters"]) == 3

    def test_all_players_assigned_to_a_cluster(self):
        players = [make_player(i, float(i * 10), 0.0) for i in range(6)]
        result = cluster_formation(players, k=2)
        assigned = [pid for c in result["clusters"] for pid in c["player_ids"]]
        assert sorted(assigned) == list(range(6))

    def test_formation_spread_is_zero_for_single_point(self):
        """All players at the same location → spread should be 0."""
        players = [make_player(i, 50.0, 50.0) for i in range(3)]
        result = cluster_formation(players, k=3)
        assert result["formation_spread"] == pytest.approx(0.0, abs=1e-6)

    def test_formation_spread_positive_for_spread_players(self):
        """Players spread across frame → spread > 0."""
        players = [
            make_player(0,   0.0,   0.0),
            make_player(1, 100.0,   0.0),
            make_player(2,   0.0, 100.0),
            make_player(3, 100.0, 100.0),
        ]
        result = cluster_formation(players, k=2)
        assert result["formation_spread"] > 0.0

    def test_cluster_centroids_are_finite(self):
        players = [make_player(i, float(i * 30), float(i * 20)) for i in range(6)]
        result = cluster_formation(players, k=3)
        for cluster in result["clusters"]:
            assert math.isfinite(cluster["centroid"]["x"])
            assert math.isfinite(cluster["centroid"]["y"])


# ═══════════════════════════════════════════════════════════════════════════════
# fatigue tests
# ═══════════════════════════════════════════════════════════════════════════════

class TestFatigueTracker:

    def test_cold_start_returns_neutral(self):
        tracker = FatigueTracker()
        # Fresh tracker — no data at all
        assert tracker.compute_fatigue(99) == 50.0

    def test_insufficient_history_returns_neutral(self):
        tracker = FatigueTracker()
        # Only a few points, not enough for comparison windows
        for i in range(5):
            tracker.update(0, float(i * 10), 0.0, ts=float(i))
        assert tracker.compute_fatigue(0) == 50.0

    def test_no_speed_decay_gives_low_fatigue(self):
        """
        Player maintains constant speed throughout session.
        Fatigue score should be near 0 (no decay).
        """
        tracker = FatigueTracker()
        # Simulate 25 s of constant-speed movement (10 px/s)
        for i in range(50):
            tracker.update(0, i * 10.0, 0.0, ts=i * 0.5)

        score = tracker.compute_fatigue(0)
        # Allow a small tolerance due to floating-point arithmetic
        assert score < 10.0, f"Expected low fatigue, got {score}"

    def test_full_speed_decay_gives_high_fatigue(self):
        """
        Player moves fast at start, then stops completely.
        Fatigue score should be near 100.
        """
        tracker = FatigueTracker()
        base_ts = 0.0

        # First 10 s: lots of movement (100 px / 0.5 s = 200 px/s)
        for i in range(20):
            tracker.update(0, float(i * 100), 0.0, ts=base_ts + i * 0.5)

        # Next 15 s: player barely moves (1 px / 0.5 s)
        last_x = float(19 * 100)
        for i in range(30):
            tracker.update(0, last_x + i * 1.0, 0.0, ts=base_ts + 10.0 + i * 0.5)

        score = tracker.compute_fatigue(0)
        assert score > 70.0, f"Expected high fatigue, got {score}"

    def test_all_fatigue_returns_dict_for_all_players(self):
        tracker = FatigueTracker()
        # Add minimal entries (cold-start, but IDs should appear)
        for pid in [0, 1, 2]:
            tracker.update(pid, 0.0, 0.0)
        result = tracker.all_fatigue()
        assert set(result.keys()) == {0, 1, 2}

    def test_fatigue_score_clamped_between_0_and_100(self):
        """Score must always be in [0, 100] even for extreme inputs."""
        tracker = FatigueTracker()
        base_ts = 0.0
        # Early: very fast
        for i in range(20):
            tracker.update(0, float(i * 1000), 0.0, ts=base_ts + i * 0.5)
        # Late: completely stationary
        for i in range(30):
            tracker.update(0, 20000.0, 0.0, ts=base_ts + 10.0 + i * 0.5)

        score = tracker.compute_fatigue(0)
        assert 0.0 <= score <= 100.0
