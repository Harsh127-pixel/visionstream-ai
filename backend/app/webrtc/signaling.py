"""
signaling.py
~~~~~~~~~~~~
WebRTC offer/answer HTTP signaling endpoint.

Flow
----
1. Browser creates an SDP offer and POSTs it to POST /offer
2. Backend creates an RTCPeerConnection, sets the remote description,
   creates an answer, waits for ICE gathering, and returns the answer SDP.
3. Browser sets the returned answer as its remote description — done.

No separate signaling server is needed; vanilla ICE is used (candidates
are baked into the SDP before it is returned).
"""

import asyncio
import logging

from fastapi import APIRouter
from pydantic import BaseModel
from aiortc import RTCPeerConnection, RTCSessionDescription

from .track_handler import VideoTrackHandler

logger = logging.getLogger(__name__)
router = APIRouter(tags=["webrtc"])

# ---------------------------------------------------------------------------
# Keep a module-level registry so peer connections aren't garbage-collected
# while they are alive.
# ---------------------------------------------------------------------------
_active_pcs: set[RTCPeerConnection] = set()
_latest_handler: VideoTrackHandler | None = None


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class SDPPayload(BaseModel):
    """SDP offer sent by the browser."""
    sdp: str
    type: str   # always "offer" from the client


class SDPAnswer(BaseModel):
    """SDP answer returned to the browser."""
    sdp: str
    type: str   # always "answer"


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.post("/offer", response_model=SDPAnswer)
async def offer(payload: SDPPayload) -> dict:
    """
    Accept an SDP offer, negotiate a peer connection, return an SDP answer.
    """
    pc = RTCPeerConnection()
    _active_pcs.add(pc)
    logger.info("New RTCPeerConnection created (total active: %d)", len(_active_pcs))

    # ── Lifecycle logging ────────────────────────────────────────────────────
    @pc.on("connectionstatechange")
    async def on_connection_state_change():
        logger.info("Connection state → %s", pc.connectionState)
        if pc.connectionState in ("failed", "closed"):
            await pc.close()
            _active_pcs.discard(pc)
            logger.info("Peer connection removed (remaining: %d)", len(_active_pcs))

    @pc.on("iceconnectionstatechange")
    async def on_ice_state_change():
        logger.info("ICE connection state → %s", pc.iceConnectionState)

    # ── Track handler ────────────────────────────────────────────────────────
    @pc.on("track")
    def on_track(track):
        logger.info("track received – kind=%s  id=%s", track.kind, track.id)

        if track.kind == "video":
            handler = VideoTrackHandler(track)
            
            global _latest_handler
            _latest_handler = handler

            @track.on("ended")
            async def on_ended():
                logger.info("Video track ended (id=%s) – stopping handler", track.id)
                handler.stop()

    # ── SDP offer / answer exchange ──────────────────────────────────────────
    remote_offer = RTCSessionDescription(sdp=payload.sdp, type=payload.type)
    await pc.setRemoteDescription(remote_offer)

    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    # Wait for vanilla ICE gathering so all candidates are in the SDP
    # (avoids the need for trickle-ICE on the frontend)
    gather_timer = 0
    while pc.iceGatheringState != "complete" and gather_timer < 2.0:
        await asyncio.sleep(0.05)
        gather_timer += 0.05

    logger.info("SDP answer ready – returning to client")
    return {"sdp": pc.localDescription.sdp, "type": pc.localDescription.type}


@router.get("/debug/latest-frame-data")
async def debug_latest_frame_data():
    """Temporary debug endpoint to view the most recent player detection JSON."""
    if _latest_handler:
        data = _latest_handler.get_latest_tracking_data()
        if data:
            return data
    return {"message": "No tracking data available"}
