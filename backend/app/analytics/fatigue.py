"""
fatigue.py
~~~~~~~~~~
Per-player fatigue estimation based on movement speed decay over time.

Algorithm
---------
- Maintain a deque of (timestamp, centroid_x, centroid_y) per player.
- Compare average speed in the **last 10 s** of the session vs the
  **first 10 s** of the session.
- Fatigue score = 100 * (1 - later_speed / early_speed), clamped to [0, 100].
  Higher score → more speed decay → more fatigued.
- Cold-start: return 50.0 (neutral) until we have enough history.
"""
import math
import logging
import collections
import time
from typing import Optional

logger = logging.getLogger(__name__)

# Minimum number of data points required before we produce a real score
_COLD_START_MIN_POINTS = 10
# Window length in seconds used to compute "early" and "late" speeds
_WINDOW_SECONDS = 10.0
# Maximum number of history entries per player (caps memory usage)
_MAX_HISTORY = 300


class FatigueTracker:
    def __init__(self) -> None:
        # player_id -> deque of (timestamp, x, y)
        self._history: dict[int, collections.deque] = {}

    # ── Public API ───────────────────────────────────────────────────────────────

    def update(self, player_id: int, x: float, y: float, ts: Optional[float] = None) -> None:
        """Record a new centroid observation for a player."""
        if ts is None:
            ts = time.time()
        if player_id not in self._history:
            self._history[player_id] = collections.deque(maxlen=_MAX_HISTORY)
        self._history[player_id].append((ts, x, y))

    def compute_fatigue(self, player_id: int) -> float:
        """
        Compute a 0–100 fatigue score for the given player.

        Returns 50.0 if not enough history is available (cold-start).
        Higher → more fatigued.
        """
        history = self._history.get(player_id)
        if not history or len(history) < _COLD_START_MIN_POINTS:
            return 50.0   # neutral / cold-start

        pts = list(history)   # [(ts, x, y), ...]

        # ── Compute instantaneous speeds for all consecutive pairs ───────────────
        speeds: list[tuple[float, float]] = []   # (mid_ts, speed)
        for (t0, x0, y0), (t1, x1, y1) in zip(pts, pts[1:]):
            dt = t1 - t0
            if dt <= 0:
                continue
            dist   = math.hypot(x1 - x0, y1 - y0)
            speed  = dist / dt
            mid_ts = (t0 + t1) / 2
            speeds.append((mid_ts, speed))

        if not speeds:
            return 50.0

        min_ts = speeds[0][0]
        max_ts = speeds[-1][0]
        session_len = max_ts - min_ts

        # Need at least ~twice the window to compare early vs late meaningfully
        if session_len < _WINDOW_SECONDS:
            return 50.0

        early_cutoff = min_ts + _WINDOW_SECONDS
        late_cutoff  = max_ts  - _WINDOW_SECONDS

        early_speeds = [s for ts, s in speeds if ts <= early_cutoff]
        late_speeds  = [s for ts, s in speeds if ts >= late_cutoff]

        if not early_speeds or not late_speeds:
            return 50.0

        early_avg = sum(early_speeds) / len(early_speeds)
        late_avg  = sum(late_speeds)  / len(late_speeds)

        if early_avg == 0:
            return 50.0

        # Fatigue = speed decay expressed as 0–100
        decay  = 1.0 - (late_avg / early_avg)
        score  = max(0.0, min(100.0, decay * 100.0))
        return round(score, 2)

    def all_fatigue(self) -> dict[int, float]:
        """Return a {player_id: fatigue_score} mapping for all known players."""
        return {pid: self.compute_fatigue(pid) for pid in self._history}
