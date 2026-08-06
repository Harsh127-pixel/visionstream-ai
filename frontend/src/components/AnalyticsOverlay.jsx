import { useEffect, useRef } from 'react'

// Color palettes matching v0 design:
// Cluster 0: Cyan (#67e8f9)
// Cluster 1: Violet (#c084fc)
// Cluster 2: Amber (#fde047)
// Fallback: Red (#f87171)
const CLUSTER_COLORS = [
  { stroke: '#67e8f9', fill: 'rgba(103, 232, 249, 0.15)', dot: '#38bdf8' },
  { stroke: '#c084fc', fill: 'rgba(192, 132, 252, 0.15)', dot: '#a855f7' },
  { stroke: '#fde047', fill: 'rgba(253, 224, 71, 0.15)', dot: '#eab308' },
  { stroke: '#f87171', fill: 'rgba(248, 113, 113, 0.15)', dot: '#ef4444' },
]

// 2D Convex Hull (Andrew's Monotone Chain Algorithm)
function getConvexHull(points) {
  if (points.length <= 2) return points
  const sorted = [...points].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x))

  const lower = []
  for (const p of sorted) {
    while (
      lower.length >= 2 &&
      crossProduct(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
    ) {
      lower.pop()
    }
    lower.push(p)
  }

  const upper = []
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i]
    while (
      upper.length >= 2 &&
      crossProduct(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
    ) {
      upper.pop()
    }
    upper.push(p)
  }

  upper.pop()
  lower.pop()
  return lower.concat(upper)
}

function crossProduct(o, a, b) {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
}

export function AnalyticsOverlay({ analyticsData }) {
  const canvasRef = useRef(null)
  const dataRef = useRef(analyticsData)

  // Keep latest data in ref for rAF loop
  useEffect(() => {
    dataRef.current = analyticsData
  }, [analyticsData])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let animFrameId = null

    // Resize observer to keep internal canvas resolution matching display size
    const handleResize = () => {
      if (!canvas.parentElement) return
      const rect = canvas.parentElement.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        canvas.width = rect.width
        canvas.height = rect.height
      }
    }

    const resizeObserver = new ResizeObserver(handleResize)
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement)
    }
    handleResize()

    const render = () => {
      const width = canvas.width
      const height = canvas.height

      ctx.clearRect(0, 0, width, height)

      const payload = dataRef.current
      if (payload && payload.players && payload.players.length > 0) {
        // Frame coordinate space (assuming 960x540 default unless provided)
        const frameW = payload.frame_width || 960
        const frameH = payload.frame_height || 540

        const scaleX = width / frameW
        const scaleY = height / frameH

        const players = payload.players
        const playerMap = new Map()
        players.forEach((p) => {
          let px, py
          if (p.norm_centroid) {
            px = p.norm_centroid.x * width
            py = p.norm_centroid.y * height
          } else if (p.centroid && p.centroid.x <= 1.0 && p.centroid.y <= 1.0) {
            px = p.centroid.x * width
            py = p.centroid.y * height
          } else {
            px = p.centroid.x * scaleX
            py = p.centroid.y * scaleY
          }

          playerMap.set(p.player_id, {
            x: px,
            y: py,
            id: p.player_id,
          })
        })

        const clusters = payload.formation?.clusters || []

        // 1. Draw Cluster outlines (Convex Hull / Circles)
        clusters.forEach((cluster, idx) => {
          const color = CLUSTER_COLORS[idx % CLUSTER_COLORS.length]
          const clusterPoints = []

          cluster.player_ids.forEach((pid) => {
            const pt = playerMap.get(pid)
            if (pt) clusterPoints.push(pt)
          })

          if (clusterPoints.length === 1) {
            // Circle around single player
            const p = clusterPoints[0]
            ctx.beginPath()
            ctx.arc(p.x, p.y, 35, 0, 2 * Math.PI)
            ctx.fillStyle = color.fill
            ctx.fill()
            ctx.strokeStyle = color.stroke
            ctx.lineWidth = 1.5
            ctx.setLineDash([4, 4])
            ctx.stroke()
            ctx.setLineDash([])
          } else if (clusterPoints.length === 2) {
            // Capsule / Pill outline around two players
            const [p1, p2] = clusterPoints
            const pad = 30

            ctx.save()
            ctx.beginPath()
            ctx.lineWidth = pad * 2
            ctx.lineCap = 'round'
            ctx.strokeStyle = color.fill
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()

            ctx.lineWidth = 1.5
            ctx.setLineDash([4, 4])
            ctx.strokeStyle = color.stroke
            ctx.stroke()
            ctx.restore()
          } else if (clusterPoints.length >= 3) {
            // Convex Hull with padding for 3+ players
            const hull = getConvexHull(clusterPoints)
            if (hull.length > 0) {
              ctx.save()
              ctx.beginPath()
              ctx.moveTo(hull[0].x, hull[0].y)
              for (let i = 1; i < hull.length; i++) {
                ctx.lineTo(hull[i].x, hull[i].y)
              }
              ctx.closePath()
              ctx.fillStyle = color.fill
              ctx.fill()
              ctx.strokeStyle = color.stroke
              ctx.lineWidth = 1.5
              ctx.setLineDash([6, 4])
              ctx.stroke()
              ctx.restore()
            }
          }
        })

        // 2. Draw Player Dots & Labels
        players.forEach((p) => {
          const pt = playerMap.get(p.player_id)
          if (!pt) return
          const px = pt.x
          const py = pt.y
          const pidStr = `P-${String(p.player_id).padStart(2, '0')}`

          // Find player's cluster color
          let playerColor = CLUSTER_COLORS[0]
          clusters.forEach((c, idx) => {
            if (c.player_ids.includes(p.player_id)) {
              playerColor = CLUSTER_COLORS[idx % CLUSTER_COLORS.length]
            }
          })

          // Outer Glow
          ctx.beginPath()
          ctx.arc(px, py, 8, 0, 2 * Math.PI)
          ctx.fillStyle = playerColor.fill
          ctx.fill()

          // Inner Dot
          ctx.beginPath()
          ctx.arc(px, py, 4, 0, 2 * Math.PI)
          ctx.fillStyle = playerColor.dot
          ctx.fill()
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 1.5
          ctx.stroke()

          // Player ID Label Pill
          const labelText = pidStr
          ctx.font = '600 10px monospace'
          const textWidth = ctx.measureText(labelText).width
          const boxWidth = textWidth + 8
          const boxHeight = 14
          const boxX = px - boxWidth / 2
          const boxY = py + 8

          // Label Background
          ctx.fillStyle = 'rgba(7, 16, 24, 0.85)'
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
          ctx.lineWidth = 1
          ctx.beginPath()
          if (ctx.roundRect) {
            ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 3)
          } else {
            ctx.rect(boxX, boxY, boxWidth, boxHeight)
          }
          ctx.fill()
          ctx.stroke()

          // Label Text
          ctx.fillStyle = '#ffffff'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(labelText, px, boxY + boxHeight / 2)
        })
      }

      animFrameId = requestAnimationFrame(render)
    }

    animFrameId = requestAnimationFrame(render)

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId)
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-10 h-full w-full"
    />
  )
}
