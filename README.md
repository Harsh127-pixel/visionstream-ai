# VisionStream AI

Real-time video analytics platform powered by WebRTC, FastAPI, and AI inference pipelines.

## Tech Stack

| Layer      | Technology                                              |
|------------|---------------------------------------------------------|
| Frontend   | React 18, Vite, Vanilla CSS                             |
| Backend    | FastAPI, Uvicorn, Python 3.11                           |
| Video      | WebRTC (aiortc), OpenCV                                 |
| AI/ML      | MediaPipe, scikit-learn, NumPy                          |
| Transport  | WebSockets, REST                                        |
| Container  | Docker, Docker Compose                                  |

---

## Project Structure

```
visionstream-ai/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI entry point
│   │   ├── webrtc/          # WebRTC signalling & peer logic
│   │   ├── vision/          # OpenCV / MediaPipe processing
│   │   ├── analytics/       # Metric aggregation & ML inference
│   │   ├── ws/              # WebSocket connection managers
│   │   └── models/          # Pydantic data models
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- Docker & Docker Compose (optional, for containerised dev)

---

### Backend Setup

```bash
# 1. Create and activate a virtual environment
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run the dev server
uvicorn app.main:app --reload --port 8000
```

The API will be available at **http://localhost:8000**.  
Interactive docs: **http://localhost:8000/docs**

---

### Frontend Setup

```bash
# 1. Install dependencies
cd frontend
npm install

# 2. Start the Vite dev server
npm run dev
```

The app will be available at **http://localhost:5173**.

---

### Docker (Full Stack)

```bash
# From the repo root
docker-compose up --build
```

| Service  | URL                        |
|----------|----------------------------|
| Frontend | http://localhost:5173      |
| Backend  | http://localhost:8000      |
| API Docs | http://localhost:8000/docs |

---

## Health Check

```bash
curl http://localhost:8000/health
# {"status":"ok","service":"visionstream-ai"}
```

---

## License

MIT
