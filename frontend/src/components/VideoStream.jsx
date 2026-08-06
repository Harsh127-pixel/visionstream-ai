/**
 * VideoStream.jsx
 * ───────────────────────────────────────────────────────────────────────────
 * Renders the live webcam feed via WebRTC.
 *
 * - Uses the useWebRTC hook to get the local media stream.
 * - Attaches the stream to a <video> element via srcObject.
 * - Shows a spinner overlay while the camera / signaling is in progress.
 * - Shows a styled error panel if camera access is denied or unavailable.
 * - Shows a pulsing "LIVE" badge once connected.
 */

import { useEffect, useRef } from 'react'
import { useWebRTC } from '../hooks/useWebRTC'
import './VideoStream.css'

export default function VideoStream({ onStatusChange }) {
  const videoRef = useRef(null)
  const { stream, status, error } = useWebRTC()

  // Attach the media stream to the <video> element as soon as it's available
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  // Bubble status up to App.jsx so the header badge stays in sync
  useEffect(() => {
    if (onStatusChange) onStatusChange(status)
  }, [status, onStatusChange])

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="video-error" role="alert">
        <span className="error-icon">📷</span>
        <p className="error-title">Camera Unavailable</p>
        <p className="error-message">{error}</p>
        <span className="error-hint">Refresh the page after granting permission.</span>
      </div>
    )
  }

  // ── Normal video render ────────────────────────────────────────────────────
  return (
    <div className="video-wrapper">
      {/* Overlay spinner while camera/signaling is still starting */}
      {status !== 'connected' && (
        <div className="video-overlay" aria-label="Connecting…">
          <div className="spinner" />
          <p>
            {status === 'requesting'
              ? 'Requesting camera access…'
              : 'Connecting to VisionStream backend…'}
          </p>
        </div>
      )}

      {/* Live indicator */}
      {status === 'connected' && (
        <div className="live-badge" aria-label="Stream live">
          <span className="live-dot" />
          Live
        </div>
      )}

      {/* The video element — muted so autoplay is allowed by the browser */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="video-feed"
        aria-label="Local webcam feed"
      />
    </div>
  )
}
