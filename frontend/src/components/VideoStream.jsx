import { useState, useRef, useEffect } from 'react'
import {
  Activity,
  Camera,
  ChevronDown,
  Crosshair,
  Maximize2,
  Pause,
  Play,
} from 'lucide-react'
import { useWebRTC } from '../hooks/useWebRTC'

import { AnalyticsOverlay } from './AnalyticsOverlay'

export function VideoStream({ analyticsData }) {
  const { stream, status, error } = useWebRTC()
  const videoRef = useRef(null)

  // Wire the MediaStream from the hook to the <video> element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])
  const [playing, setPlaying] = useState(true)
  const [showTrails, setShowTrails] = useState(true)
  const [camera, setCamera] = useState('Camera 01 · Main stand')

  const hasStream = status === 'connected'

  return (
    <section className="panel-surface overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/20">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 md:px-5">
        <div className="flex items-center gap-3">
          <span
            className={`flex items-center gap-2 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] ${
              hasStream
                ? 'bg-red-500/10 text-red-300 ring-1 ring-inset ring-red-400/20'
                : 'bg-amber-500/10 text-amber-300 ring-1 ring-inset ring-amber-400/20'
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${
                hasStream ? 'animate-pulse bg-red-400' : 'bg-amber-400'
              }`}
            />
            {hasStream ? 'Live feed' : status.toUpperCase()}
          </span>
          <span className="hidden text-xs text-slate-400 sm:inline">
            Session 04 · Live WebRTC Stream
          </span>
        </div>

        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="camera-select">
            Select camera
          </label>
          <div className="relative">
            <Camera
              aria-hidden="true"
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
            />
            <select
              id="camera-select"
              value={camera}
              aria-label="Select camera"
              className="h-8 max-w-[calc(100vw-5rem)] appearance-none rounded-md border border-white/10 bg-slate-900/60 py-1 pl-8 pr-8 text-xs font-medium text-slate-200 outline-none transition hover:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/30"
              onChange={(e) => setCamera(e.target.value)}
            >
              <option>Camera 01 · Main stand</option>
              <option>Camera 02 · Tactical view</option>
              <option>Camera 03 · Goal line</option>
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-2.5 top-1/2 size-3 -translate-y-1/2 text-slate-400"
            />
          </div>
          <button
            aria-label="Open video fullscreen"
            className="control-button hidden sm:inline-flex"
            type="button"
          >
            <Maximize2 aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>

      {/* Video Stage */}
      <div className="relative aspect-[4/3] min-h-[360px] w-full overflow-hidden bg-[#071018] sm:aspect-video">
        {/* Real HTML5 Video element fed by WebRTC stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`h-full w-full object-cover transition-opacity duration-500 ${
            hasStream ? 'opacity-100' : 'opacity-20'
          }`}
        />

        {/* Pitch overlay grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(78, 214, 204, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(78, 214, 204, 0.08) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />

        {/* Connection Loading Overlay */}
        {!hasStream && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs">
            {status === 'connecting' && (
              <>
                <div className="size-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                <p className="mt-3 text-xs text-slate-300">
                  Connecting WebRTC stream...
                </p>
              </>
            )}
            {status === 'error' && (
              <div className="text-center">
                <p className="text-sm font-semibold text-red-400">
                  Connection Error
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {error || 'Failed to establish WebRTC connection'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Real-time 60fps canvas player tracking & formation cluster overlay */}
        <AnalyticsOverlay analyticsData={analyticsData} />

        {/* AI Tracking Active badge */}
        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-md bg-black/50 px-2.5 py-1.5 backdrop-blur-sm">
          <Crosshair aria-hidden="true" className="size-3.5 text-cyan-300" />
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-300">
            YOLOv8 Pose Active
          </span>
        </div>

        {/* Stream info badge */}
        <div className="absolute bottom-4 right-4 rounded-md border border-white/10 bg-black/50 px-2.5 py-1.5 font-mono text-[10px] text-slate-300 backdrop-blur-sm">
          WebRTC · 60 FPS
        </div>

        {/* Player controls bar */}
        <div className="absolute inset-x-4 bottom-4 flex items-center gap-3 rounded-xl border border-white/10 bg-[#071018]/85 px-3 py-2 backdrop-blur-md sm:inset-x-5">
          <button
            aria-label={playing ? 'Pause video' : 'Play video'}
            className="grid size-8 shrink-0 place-items-center rounded-full bg-cyan-300 text-[#071018] transition hover:bg-cyan-200"
            onClick={() => setPlaying(!playing)}
            type="button"
          >
            {playing ? (
              <Pause aria-hidden="true" className="size-3.5 fill-current" />
            ) : (
              <Play aria-hidden="true" className="ml-0.5 size-3.5 fill-current" />
            )}
          </button>
          <span className="font-mono text-[10px] text-slate-400">LIVE</span>
          <div className="h-1 flex-1 rounded-full bg-white/15">
            <div className="h-full w-full rounded-full bg-cyan-400 animate-pulse" />
          </div>
          <button
            aria-pressed={showTrails}
            aria-label="Toggle player movement trails"
            className={`hidden items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold transition sm:flex ${
              showTrails
                ? 'bg-cyan-300/15 text-cyan-200'
                : 'text-white/50 hover:text-white'
            }`}
            onClick={() => setShowTrails(!showTrails)}
            type="button"
          >
            <Activity aria-hidden="true" className="size-3" /> Trails
          </button>
        </div>
      </div>
    </section>
  )
}
