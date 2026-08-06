import { useState } from 'react'
import { Users } from 'lucide-react'

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

export function FatigueChart({ players: livePlayers, fatigueMap }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null)

  // Extract players array from payload or convert fatigueMap
  const trackedPlayers =
    livePlayers && livePlayers.length > 0
      ? livePlayers
      : fatigueMap
      ? Object.entries(fatigueMap).map(([pid, score]) => ({
          player_id: parseInt(pid, 10),
          fatigue: score,
        }))
      : []

  const average =
    trackedPlayers.length > 0
      ? Math.round(
          trackedPlayers.reduce((sum, p) => sum + (p.fatigue ?? 50), 0) /
            trackedPlayers.length
        )
      : 50

  return (
    <section className="panel-surface rounded-2xl border border-white/10 p-5 shadow-xl shadow-black/10">
      <SectionHeading
        eyebrow="Player condition"
        title="Fatigue"
        action={
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            <Users aria-hidden="true" className="size-3.5" />{' '}
            {trackedPlayers.length} tracked
          </span>
        }
      />

      <div className="mt-5 flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/35 px-3.5 py-3">
        <div>
          <p className="text-xs text-slate-400">Squad average</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-slate-100">
            {average}
            <span className="ml-1 text-xs font-normal text-slate-400">/ 100</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Alert threshold</p>
          <p className="mt-1 font-mono text-sm font-medium text-amber-200">
            65 / 100
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {trackedPlayers.length > 0 ? (
          trackedPlayers.map((player) => {
            const score = Math.round(player.fatigue ?? 50)
            const pid = `P-${String(player.player_id).padStart(2, '0')}`
            const isSelected = selectedPlayer === player.player_id

            const barColor =
              score >= 80
                ? 'bg-red-400'
                : score >= 65
                ? 'bg-amber-300'
                : 'bg-cyan-300'

            const badgeStyle =
              score >= 80
                ? 'bg-red-500/15 text-red-200'
                : score >= 65
                ? 'bg-amber-500/15 text-amber-200'
                : 'bg-cyan-300/15 text-cyan-200'

            return (
              <button
                aria-pressed={isSelected}
                className={`rounded-xl border p-3 text-left transition ${
                  isSelected
                    ? 'border-cyan-300/35 bg-cyan-300/[0.07]'
                    : 'border-transparent hover:border-white/10 hover:bg-slate-900/30'
                }`}
                key={player.player_id}
                onClick={() => setSelectedPlayer(player.player_id)}
                type="button"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-lg text-[10px] font-bold ${badgeStyle}`}
                    >
                      {String(player.player_id).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-200">
                        {pid}{' '}
                        <span className="font-normal text-slate-400">
                          · Player #{player.player_id + 1}
                        </span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        Position: (
                        {Math.round(player.centroid?.x || 0)},{' '}
                        {Math.round(player.centroid?.y || 0)})
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-sm font-semibold text-slate-100">
                    {score}
                    <span className="ml-0.5 text-[10px] font-normal text-slate-400">
                      %
                    </span>
                  </span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-900/70">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </button>
            )
          })
        ) : (
          <p className="py-4 text-center text-xs text-slate-500">
            No active players detected
          </p>
        )}
      </div>
    </section>
  )
}
