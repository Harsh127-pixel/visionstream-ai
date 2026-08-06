from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.webrtc.signaling import router as webrtc_router

app = FastAPI(
    title="VisionStream AI",
    description="Real-time video analytics backend powered by WebRTC and AI",
    version="0.1.0",
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
app.include_router(webrtc_router)          # POST /offer
# app.include_router(analytics_router, prefix="/analytics")  # future
