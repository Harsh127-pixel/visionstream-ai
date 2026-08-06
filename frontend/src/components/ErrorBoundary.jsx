import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('VisionStream AI Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#0b1219] p-6 text-slate-100">
          <div className="max-w-md rounded-2xl border border-red-500/20 bg-slate-900/80 p-6 text-center backdrop-blur-md">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-red-500/10 text-red-400">
              ⚠️
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">
              Application Error
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              An unexpected error occurred in the live control room rendering pipeline.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 rounded-lg bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300"
              type="button"
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
