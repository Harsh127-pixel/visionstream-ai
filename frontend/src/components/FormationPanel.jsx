import { Settings2 } from 'lucide-react'

function SectionHeading({ eyebrow, title, action }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-100">
          {title}
        </h2>
      </div>
      {action}
    </div>
  )
}

export function FormationPanel({ formation }) {
  // Use real data from WS payload or fallback gracefully
  const clusters = formation?.clusters || []
  const clusterCount = clusters.length
  const spread = formation?.formation_spread || 0.0

  // Derive status from spread metric
  let status = 'Waiting'
  let progressWidth = '0%'
  if (formation) {
    if (spread < 50) {
      status = 'Compact'
      progressWidth = '25%'
    } else if (spread < 150) {
      status = 'Balanced'
      progressWidth = '62.4%'
    } else {
      status = 'Spread'
      progressWidth = '90%'
    }
  }

  const zoneColors = [
    { color: 'bg-cyan-400', label: 'Attacking Third' },
    { color: 'bg-violet-400', label: 'Middle Third' },
    { color: 'bg-amber-300', label: 'Defensive Third' },
  ]

  return (
    <section className="panel-surface rounded-2xl border border-white/10 p-5 shadow-xl shadow-black/10">
      <SectionHeading
        eyebrow="Spatial intelligence"
        title="Formation"
        action={
          <button
            aria-label="Formation settings"
            className="icon-button"
            type="button"
          >
            <Settings2 aria-hidden="true" className="size-4" />
          </button>
        }
      />

      <div className="mt-5 grid grid-cols-[1fr_auto] items-end gap-4">
        <div>
          <p className="text-xs text-slate-400">Cluster count</p>
          <p className="mt-1 font-mono text-5xl font-semibold tracking-[-0.08em] text-slate-100">
            {clusterCount}
            <span className="ml-2 text-sm font-normal tracking-normal text-slate-400">
              groups
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Formation spread</p>
          <p className="mt-1 font-mono text-2xl font-semibold tracking-tight text-cyan-200">
            {spread.toFixed(1)}
            <span className="ml-1 text-sm font-normal text-slate-400">px</span>
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.06] p-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-cyan-300 shadow-[0_0_10px_currentColor]" />
            <span className="text-xs text-slate-400">Current formation</span>
          </div>
          <span className="rounded-full bg-cyan-300/10 px-2.5 py-1 text-xs font-semibold text-cyan-200">
            {status}
          </span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-900/70">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-violet-300 to-amber-200 transition-all duration-500"
            style={{ width: progressWidth }}
          />
        </div>
        <div className="mt-2 flex justify-between font-mono text-[9px] uppercase tracking-[0.16em] text-slate-400">
          <span>Compact</span>
          <span>Balanced</span>
          <span>Spread</span>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {clusters.length > 0 ? (
          clusters.map((cluster, idx) => {
            const style = zoneColors[idx % zoneColors.length]
            return (
              <div
                className="flex items-center justify-between gap-3"
                key={cluster.cluster_id}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={`size-2.5 shrink-0 rounded-sm ${style.color}`}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-200">
                      Zone {cluster.cluster_id + 1}
                    </p>
                    <p className="truncate text-[11px] text-slate-400">
                      Centroid: ({Math.round(cluster.centroid.x)},{' '}
                      {Math.round(cluster.centroid.y)})
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs text-slate-400">
                  {cluster.player_ids.length} player(s)
                </span>
              </div>
            )
          })
        ) : (
          <p className="py-2 text-center text-xs text-slate-500">
            No clusters active
          </p>
        )}
      </div>
    </section>
  )
}
