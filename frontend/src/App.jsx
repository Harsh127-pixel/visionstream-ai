import { useState, useCallback } from 'react'
import './App.css'
import VideoStream from './components/VideoStream'

/**
 * App — top-level shell for VisionStream AI.
 *
 * Layout:
 *   ┌─────────────────────────────────────────┐
 *   │                  Header                  │
 *   ├───────────────────────┬─────────────────┤
 *   │    VideoStream        │  Analytics Panel │
 *   │  (live WebRTC feed)   │  (metrics here)  │
 *   └───────────────────────┴─────────────────┘
 */
export default function App() {
  // status is driven by the VideoStream component via onStatusChange callback
  const [status, setStatus] = useState('idle')

  const handleStatusChange = useCallback((newStatus) => {
    setStatus(newStatus)
  }, [])

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
        {/* Video area — VideoStream handles WebRTC internally */}
        <section className="video-section">
          <div className="video-container">
            <VideoStream onStatusChange={handleStatusChange} />
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
