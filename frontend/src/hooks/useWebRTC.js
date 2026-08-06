/**
 * useWebRTC.js
 * ──────────────────────────────────────────────────────────────────────────
 * Custom hook that:
 *  1. Requests camera access via getUserMedia
 *  2. Creates an RTCPeerConnection and adds the local video track
 *  3. Performs offer/answer signaling with the FastAPI backend (POST /offer)
 *     using vanilla ICE — ICE candidates are gathered before the offer is sent
 *     so no trickle-ICE logic is needed
 *  4. Exposes { stream, status, error } to the consumer
 *
 * Status values: 'idle' | 'requesting' | 'connecting' | 'connected' | 'error'
 */

import { useState, useEffect, useRef } from 'react'

const BACKEND_OFFER_URL = 'http://localhost:8000/offer'

const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

/**
 * Wait until the RTCPeerConnection has finished gathering ICE candidates
 * so the local SDP is complete before we send it to the backend.
 */
function waitForIceGathering(pc) {
  return new Promise((resolve) => {
    if (pc.iceGatheringState === 'complete') {
      resolve()
      return
    }
    function onStateChange() {
      if (pc.iceGatheringState === 'complete') {
        pc.removeEventListener('icegatheringstatechange', onStateChange)
        resolve()
      }
    }
    pc.addEventListener('icegatheringstatechange', onStateChange)
  })
}

export function useWebRTC() {
  const [stream, setStream] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const pcRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function startWebRTC() {
      // ── 1. Request camera ─────────────────────────────────────────────────
      setStatus('requesting')

      let localStream
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      } catch (err) {
        if (cancelled) return
        const msg =
          err.name === 'NotAllowedError'
            ? 'Camera permission denied. Please allow camera access and refresh.'
            : err.name === 'NotFoundError'
            ? 'No camera found. Please connect a webcam and refresh.'
            : `Camera error: ${err.message}`
        setError(msg)
        setStatus('error')
        return
      }

      if (cancelled) {
        localStream.getTracks().forEach((t) => t.stop())
        return
      }

      // Expose stream immediately so the <video> element can show the preview
      setStream(localStream)
      setStatus('connecting')

      // ── 2. Create RTCPeerConnection ───────────────────────────────────────
      const pc = new RTCPeerConnection(ICE_CONFIG)
      pcRef.current = pc

      // Add all local video tracks to the peer connection
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream))

      // ── 3. Create SDP offer & gather ICE candidates ───────────────────────
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // Wait for full ICE gathering (vanilla ICE — bake candidates into SDP)
      await waitForIceGathering(pc)

      if (cancelled) return

      // ── 4. Send offer to backend, receive answer ──────────────────────────
      let answerData
      try {
        const res = await fetch(BACKEND_OFFER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sdp: pc.localDescription.sdp,
            type: pc.localDescription.type,
          }),
        })

        if (!res.ok) {
          throw new Error(`Backend signaling failed with HTTP ${res.status}`)
        }

        answerData = await res.json()
      } catch (err) {
        if (cancelled) return
        setError(`Signaling error: ${err.message}`)
        setStatus('error')
        return
      }

      // ── 5. Apply the remote description (backend's SDP answer) ────────────
      await pc.setRemoteDescription(new RTCSessionDescription(answerData))

      if (!cancelled) {
        setStatus('connected')
      }
    }

    startWebRTC()

    // Cleanup: stop all tracks and close the peer connection on unmount
    return () => {
      cancelled = true
      if (pcRef.current) {
        pcRef.current.close()
        pcRef.current = null
      }
    }
  }, []) // Run once on mount

  return { stream, status, error }
}
