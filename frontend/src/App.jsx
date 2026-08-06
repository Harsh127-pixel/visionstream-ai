import { useState } from 'react'
import {
  BarChart3,
  Bell,
  CircleHelp,
  Crosshair,
  Gauge,
  LayoutDashboard,
  Radio,
  Search,
  Settings2,
  Signal,
  SlidersHorizontal,
  Sparkles,
  Target,
  Video,
  Zap,
} from 'lucide-react'
import { useAnalyticsSocket } from './hooks/useAnalyticsSocket'
import { VideoStream } from './components/VideoStream'
import { FormationPanel } from './components/FormationPanel'
import { FatigueChart } from './components/FatigueChart'

function Sidebar() {
  const [active, setActive] = useState('Overview')
  const items = [
    { label: 'Overview', icon: LayoutDashboard },
    { label: 'Live tracking', icon: Crosshair },
    { label: 'Performance', icon: BarChart3 },
    { label: 'Sessions', icon: Video },
  ]
  return (
    <aside className="hidden w-[72px] shrink-0 flex-col items-center border-r border-white/10 bg-[#070d14] py-5 lg:flex">
      <div className="grid size-9 place-items-center rounded-xl bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-300/10">
        <Sparkles aria-hidden="true" className="size-5" />
      </div>
      <nav aria-label="Primary navigation" className="mt-12 flex flex-col gap-3">
        {items.map(({ label, icon: Icon }) => (
          <button
            aria-label={label}
            aria-pressed={active === label}
            className={`nav-button ${active === label ? 'nav-button-active' : ''}`}
            key={label}
            onClick={() => setActive(label)}
            type="button"
          >
            <Icon aria-hidden="true" className="size-[18px]" />
          </button>
        ))}
      </nav>
      <div className="mt-auto flex flex-col gap-3">
        <button aria-label="Help" className="nav-button" type="button">
          <CircleHelp aria-hidden="true" className="size-[18px]" />
        </button>
        <button aria-label="Settings" className="nav-button" type="button">
          <Settings2 aria-hidden="true" className="size-[18px]" />
        </button>
      </div>
    </aside>
  )
}

function Topbar({ wsStatus }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-[#070d14]/90 px-4 py-4 backdrop-blur-xl md:px-7">
      <div className="flex items-center gap-3 lg:hidden">
        <div className="grid size-8 place-items-center rounded-lg bg-cyan-300 text-slate-950">
          <Sparkles aria-hidden="true" className="size-4" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-white">
          VisionStream <span className="text-cyan-300">AI</span>
        </span>
      </div>
      <div className="hidden items-center gap-3 lg:flex">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300">
            Live operations
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-white">
            Matchday control room
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-3 py-1.5 sm:flex">
          <Signal aria-hidden="true" className="size-3.5 text-emerald-300" />
          <span className="text-xs font-medium text-emerald-200">
            WS: {wsStatus.toUpperCase()}
          </span>
        </div>
        <button aria-label="Search" className="icon-button" type="button">
          <Search aria-hidden="true" className="size-4" />
        </button>
        <button aria-label="Notifications" className="icon-button relative" type="button">
          <Bell aria-hidden="true" className="size-4" />
          <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-cyan-300" />
        </button>
      </div>
    </header>
  )
}

export default function App() {
  const { analyticsData, status: wsStatus } = useAnalyticsSocket()

  const playerCount = analyticsData?.player_count || 0
  const isLive = analyticsData && !analyticsData.status

  return (
    <main className="min-h-screen bg-[#0b1219] text-slate-100">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <Topbar wsStatus={wsStatus} />

          <div className="mx-auto max-w-[1540px] p-4 md:p-7">
            {/* Header section */}
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">
                  VisionStream AI · Real-Time Control Room
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] md:text-3xl text-white">
                  Matchday Intelligence Dashboard
                </h2>
                <p className="mt-1 max-w-xl text-sm leading-6 text-slate-400">
                  Monitor live WebRTC player tracking, formation clustering, and real-time squad fatigue.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="secondary-action" type="button">
                  <SlidersHorizontal aria-hidden="true" className="size-3.5" /> Configure view
                </button>
                <button className="primary-action" type="button">
                  <Radio aria-hidden="true" className="size-3.5" /> Broadcast mode
                </button>
              </div>
            </div>

            {/* Main grid */}
            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(330px,0.75fr)]">
              {/* Left Column: Video & Metric tiles */}
              <div className="flex min-w-0 flex-col gap-5">
                <VideoStream analyticsData={analyticsData} />

                <div className="grid gap-5 md:grid-cols-3">
                  <div className="metric-tile">
                    <span className="metric-icon">
                      <Target aria-hidden="true" className="size-4" />
                    </span>
                    <div>
                      <p className="text-[11px] text-slate-400">Players detected</p>
                      <p className="mt-1 font-mono text-xl font-semibold text-white">
                        {playerCount}{' '}
                        <span className="text-xs font-normal text-emerald-400">
                          {isLive ? 'Live' : 'Standby'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="metric-tile">
                    <span className="metric-icon">
                      <Gauge aria-hidden="true" className="size-4" />
                    </span>
                    <div>
                      <p className="text-[11px] text-slate-400">Tracking accuracy</p>
                      <p className="mt-1 font-mono text-xl font-semibold text-white">
                        98.7<span className="text-xs font-normal text-slate-400">%</span>
                      </p>
                    </div>
                  </div>

                  <div className="metric-tile">
                    <span className="metric-icon">
                      <Zap aria-hidden="true" className="size-4" />
                    </span>
                    <div>
                      <p className="text-[11px] text-slate-400">Analytics cadence</p>
                      <p className="mt-1 font-mono text-xl font-semibold text-white">
                        500<span className="text-xs font-normal text-slate-400">ms</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Formation & Fatigue panels */}
              <div className="flex flex-col gap-5">
                <FormationPanel formation={analyticsData?.formation} />
                <FatigueChart
                  players={analyticsData?.players}
                  fatigueMap={analyticsData?.fatigue}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
