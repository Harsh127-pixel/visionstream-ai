import { useState } from 'react'
import './App.css'

/**
 * App — top-level shell for VisionStream AI.
 *
 * Layout (scaffolding only — no business logic):
 *   ┌─────────────────────────────────────────┐
 *   │                  Header                  │
 *   ├───────────────────────┬─────────────────┤
 *   │      Video Area       │  Analytics Panel │
 *   │   (WebRTC feed here)  │  (metrics here)  │
 *   └───────────────────────┴─────────────────┘
 */
export default function App() {
  const [status, setStatus] = useState('idle')

  return (
    <div className="app-shell">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="app-header">
        <div className="logo">
          <span className="logo-icon">⬡</span>
          <h1>VisionStream AI</h1>
        </div>
        <nav className="header-nav">
          <span className={`status-badge status-${status}`}>{status}</span>
        </nav>
      </header>

      {/* ── Main Content ────────────────────────────────────── */}
      <main className="app-main">
        {/* Video area */}
        <section className="video-section">
          <div className="video-container">
            <div className="video-placeholder">
              <span className="video-icon">🎥</span>
              <p>WebRTC video feed will render here</p>
              <small>Connect a camera stream to begin</small>
            </div>
            {/* Actual <video> element will be wired up via a hook later */}
            <video id="local-video" autoPlay playsInline muted className="video-el hidden" />
          </div>

          <div className="video-controls">
            <button
              className="btn btn-primary"
              onClick={() => setStatus('connecting')}
            >
              Start Stream
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setStatus('idle')}
            >
              Stop
            </button>
          </div>
        </section>

        {/* Analytics sidebar */}
        <aside className="analytics-sidebar">
          <h2 className="sidebar-title">Analytics</h2>

          <div className="analytics-panel">
            <h3>Object Detection</h3>
            <p className="panel-placeholder">No data yet</p>
          </div>

          <div className="analytics-panel">
            <h3>Pose Estimation</h3>
            <p className="panel-placeholder">No data yet</p>
          </div>

          <div className="analytics-panel">
            <h3>Activity Recognition</h3>
            <p className="panel-placeholder">No data yet</p>
          </div>

          <div className="analytics-panel">
            <h3>Session Stats</h3>
            <ul className="stats-list">
              <li><span>FPS</span> <strong>—</strong></li>
              <li><span>Latency</span> <strong>—</strong></li>
              <li><span>Frames</span> <strong>—</strong></li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  )
}
