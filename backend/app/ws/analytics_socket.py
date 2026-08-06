"""
analytics_socket.py
~~~~~~~~~~~~~~~~~~~~
WebSocket endpoint /ws/analytics and its background broadcast loop.

Architecture
------------
- WebSocket clients connect and are added to `_clients` set.
- A background asyncio task (`_broadcast_loop`) fires every ~500 ms:
    1. Reads latest player tracking data from the WebRTC ring buffer
       (via signaling._latest_handler)
    2. Passes player list to analytics/pipeline.run_analytics()
    3. Serialises result to JSON and broadcasts to all live clients
- Dead/disconnected clients are pruned silently per send so one bad
  connection never crashes the broadcast loop.
- The task is started and cleanly cancelled via FastAPI's lifespan
  context manager (registered in main.py).
"""

import asyncio
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.analytics.pipeline import run_analytics

logger = logging.getLogger(__name__)
router = APIRouter(tags=["websocket"])

# ---------------------------------------------------------------------------
# Connected clients registry
# ---------------------------------------------------------------------------
_clients: set[WebSocket] = set()


# ---------------------------------------------------------------------------
# WebSocket endpoint
# ---------------------------------------------------------------------------

@router.websocket("/ws/analytics")
async def analytics_ws(websocket: WebSocket):
    """Accept a client, keep it alive until it disconnects."""
    await websocket.accept()
    _clients.add(websocket)
    logger.info("WS client connected (total: %d)", len(_clients))

    try:
        # Keep the connection open; we only send, never receive here.
        # If the client sends anything we just discard it.
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    except Exception as exc:
        logger.debug("WS client error: %s", exc)
    finally:
        _clients.discard(websocket)
        logger.info("WS client disconnected (remaining: %d)", len(_clients))


# ---------------------------------------------------------------------------
# Background broadcast loop  (run as an asyncio.Task from lifespan)
# ---------------------------------------------------------------------------

async def _broadcast_loop() -> None:
    """
    Every 500 ms: pull latest tracking data → run analytics → broadcast JSON.
    Imported and started by main.py's lifespan.
    """
    # Import here to avoid circular import at module load time
    from app.webrtc.signaling import _latest_handler as _get_handler

    logger.info("Analytics broadcast loop started.")
    while True:
        try:
            await asyncio.sleep(0.5)

            # Pull latest handler reference each iteration (it may change if
            # the browser reconnects and a new RTCPeerConnection is made)
            from app.webrtc import signaling as _sig
            handler = _sig._latest_handler

            if handler is None:
                # No WebRTC stream yet – broadcast a "no-stream" heartbeat
                payload = {"status": "waiting", "message": "No active stream"}
            else:
                tracking = handler.get_latest_tracking_data()
                if not tracking:
                    payload = {"status": "waiting", "message": "No tracking data yet"}
                else:
                    player_list = tracking.get("players", [])
                    analytics   = run_analytics(player_list, timestamp=tracking.get("timestamp"))
                    payload     = analytics

            if not _clients:
                continue   # No one listening — skip serialisation

            message = json.dumps(payload, default=float)   # default=float handles numpy types
            dead: set[WebSocket] = set()

            for ws in list(_clients):
                try:
                    await ws.send_text(message)
                except Exception:
                    dead.add(ws)

            _clients.difference_update(dead)
            if dead:
                logger.debug("Pruned %d dead WS client(s)", len(dead))

        except asyncio.CancelledError:
            logger.info("Analytics broadcast loop cancelled.")
            break
        except Exception as exc:
            # Never let an unexpected error kill the loop
            logger.error("Broadcast loop error: %s", exc, exc_info=True)
