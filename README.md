# VisionStream AI

[![CI](https://github.com/Harsh127-pixel/visionstream-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/Harsh127-pixel/visionstream-ai/actions/workflows/ci.yml)
![Python](https://img.shields.io/badge/Python-3.11%2B-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-green?logo=fastapi)
![WebRTC](https://img.shields.io/badge/WebRTC-Realtime-orange?logo=webrtc)
![React](https://img.shields.io/badge/React-19-cyan?logo=react)
![Vite](https://img.shields.io/badge/Vite-6.0-purple?logo=vite)
![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-blue?logo=tailwindcss)
![Docker](https://img.shields.io/badge/Docker-Enabled-blue?logo=docker)

A live video streaming application integrating WebRTC and React.js for low-latency sports broadcasting, with a real-time AI camera tracking pipeline (OpenCV + MediaPipe) that maps player coordinates, and K-means clustering (Scikit-learn) for formation and fatigue analytics, served via concurrent FastAPI APIs.

---

## 📷 Preview & Demo

*(Add project demo GIF or screenshots here)*

---

## 🏗️ System Architecture

```text
               ┌─────────────────────────────────────────┐
               │          Browser Client (React)         │
               │  - HTML5 <video> & WebRTC PeerConn      │
               │  - 60fps HTML5 Canvas AnalyticsOverlay  │
               └────────────┬───────────────▲────────────┘
                            │               │
            WebRTC Offer/   │               │ WebSocket
            Answer (HTTP)   │               │ /ws/analytics (~500ms)
                            ▼               │
               ┌────────────────────────────┴────────────┐
               │        FastAPI Async Backend            │
               │  - /offer WebRTC Signaling Router       │
               │  - background Broadcast Task Loop       │
               └────────────┬────────────────────────────┘
                            │
                            ▼
               ┌─────────────────────────────────────────┐
               │     Vision & AI Analytics Pipeline      │
               │  - TrackHandler (Ring Buffer)           │
               │  - PoseTracker (YOLOv8/MediaPipe)       │
               │  - K-Means Clustering (sklearn)         │
               │  - FatigueTracker (Rolling Movement)    │
               └─────────────────────────────────────────┘
```

---

## ⚡ Key Features

- **Low-Latency Streaming**: Sub-second WebRTC video ingest & playback directly from browser webcam.
- **AI Camera Tracking**: Real-time pose detection and centroid tracking using OpenCV and YOLOv8-pose.
- **Spatial Intelligence**: Scikit-Learn K-means clustering ($k=3$) grouping players into formation zones and calculating team compactness spread.
- **Fatigue Monitoring**: Rolling movement history tracking speed decay to detect player exhaustion.
- **60fps Canvas Overlay**: Smooth requestAnimationFrame canvas overlay rendering colored player dots, IDs, and translucent convex hull cluster boundaries.

---

## 🚀 Quickstart

### Option 1: Docker Compose (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/Harsh127-pixel/visionstream-ai.git
   cd visionstream-ai
   ```

2. Start services:
   ```bash
   docker-compose up --build
   ```

3. Open in browser:
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Option 2: Manual Setup

#### Backend Setup

```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## ⚙️ Environment Variables

Copy the example environment configuration files:

- **Backend**: `cp backend/.env.example backend/.env`
- **Frontend**: `cp frontend/.env.example frontend/.env`

| Variable | Default | Description |
|---|---|---|
| `KMEANS_K` | `3` | Default formation cluster count |
| `BROADCAST_INTERVAL_SEC` | `0.5` | WebSocket analytics broadcast cadence (seconds) |
| `ALLOWED_ORIGINS` | `http://localhost:5173` | CORS allowed origins |
| `VITE_BACKEND_URL` | `http://localhost:8000` | Frontend API backend endpoint |
| `VITE_WS_URL` | `ws://localhost:8000/ws/analytics` | Frontend WebSocket endpoint |

---

## 🧪 Testing

Run unit tests for the analytics engine:

```bash
cd backend
pytest tests/ -v
```

---

## 📜 License

MIT License. Built for real-time video streaming & AI analytics.
