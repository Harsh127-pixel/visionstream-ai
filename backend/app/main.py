"""
main.py
~~~~~~~
FastAPI application entry-point.

Startup sequence
----------------
1. lifespan starts the analytics broadcast background task
2. WebRTC signalling router registered at POST /offer
3. WebSocket router registered at /ws/analytics
"""
from contextlib import asynccontextmanager
import asyncio
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.webrtc.signaling import router as webrtc_router
from app.ws.analytics_socket import router as ws_router, _broadcast_loop

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Lifespan — start / stop background tasks
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Runs on startup (before `yield`) and on shutdown (after `yield`).
    Preferred over the deprecated @app.on_event("startup") pattern.
    """
    # ── Startup ─────────────────────────────────────────────────────────────
    logger.info("Starting analytics broadcast loop…")
    broadcast_task = asyncio.create_task(_broadcast_loop())

    yield   # application is running

    # ── Shutdown ─────────────────────────────────────────────────────────────
    logger.info("Shutting down — cancelling broadcast loop…")
    broadcast_task.cancel()
    try:
        await broadcast_task
    except asyncio.CancelledError:
        pass


# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------

app = FastAPI(
    title="VisionStream AI",
    description="Real-time video analytics backend powered by WebRTC and AI",
    version="0.1.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS — allow the Vite dev server on localhost:5173
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health", tags=["meta"])
async def health_check():
    """Simple liveness probe."""
    return {"status": "ok", "service": "visionstream-ai"}


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(webrtc_router)   # POST /offer, GET /debug/latest-frame-data
app.include_router(ws_router)       # WS  /ws/analytics
