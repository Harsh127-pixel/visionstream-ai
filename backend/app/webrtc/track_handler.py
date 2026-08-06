"""
track_handler.py
~~~~~~~~~~~~~~~~
Wraps an incoming aiortc video MediaStreamTrack, continuously pulls
frames in the background, and exposes the latest one as a BGR numpy array.
"""

import asyncio
import logging
from typing import Optional

import numpy as np
from aiortc import MediaStreamTrack

logger = logging.getLogger(__name__)


class VideoTrackHandler:
    """
    Consume frames from a WebRTC video track and store the most recent one.

    Usage::

        handler = VideoTrackHandler(track)
        frame = await handler.get_latest_frame()   # np.ndarray | None
        handler.stop()                             # call on cleanup
    """

    def __init__(self, track: MediaStreamTrack) -> None:
        if track.kind != "video":
            raise ValueError(f"Expected a video track, got kind={track.kind!r}")

        self.track = track
        self._latest_frame: Optional[np.ndarray] = None
        self._task: asyncio.Task = asyncio.ensure_future(self._consume_frames())

    # ------------------------------------------------------------------
    # Internal frame consumer
    # ------------------------------------------------------------------

    async def _consume_frames(self) -> None:
        """Pull frames from the track forever; store the latest as BGR ndarray."""
        logger.info("track received – starting frame consumer for track id=%s", self.track.id)
        try:
            while True:
                # recv() returns an av.VideoFrame (from PyAV, wrapped by aiortc)
                frame = await self.track.recv()
                # Convert to a BGR numpy array (compatible with OpenCV)
                self._latest_frame = frame.to_ndarray(format="bgr24")
        except asyncio.CancelledError:
            logger.info("Frame consumer cancelled (track id=%s)", self.track.id)
        except Exception as exc:
            # Track ended normally or connection was torn down
            logger.warning("Frame consumer stopped (track id=%s): %s", self.track.id, exc)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def get_latest_frame(self) -> Optional[np.ndarray]:
        """Return the most recently received frame, or None if not yet available."""
        return self._latest_frame

    def stop(self) -> None:
        """Cancel the background consumer task."""
        if self._task and not self._task.done():
            self._task.cancel()
            logger.info("VideoTrackHandler stopped (track id=%s)", self.track.id)
