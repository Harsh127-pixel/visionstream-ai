import { useEffect, useState } from 'react'

const WS_URL = 'ws://localhost:8000/ws/analytics'

export function useAnalyticsSocket() {
  const [analyticsData, setAnalyticsData] = useState(null)
  const [status, setStatus] = useState('connecting') // connecting, connected, disconnected, error
  const [error, setError] = useState(null)

  useEffect(() => {
    let socket = null
    let reconnectTimeout = null

    function connect() {
      setStatus('connecting')
      socket = new WebSocket(WS_URL)

      socket.onopen = () => {
        setStatus('connected')
        setError(null)
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setAnalyticsData(data)
        } catch (err) {
          console.error('Failed to parse analytics WS payload:', err)
        }
      }

      socket.onerror = (err) => {
        console.error('Analytics WS error:', err)
        setError('WebSocket error')
        setStatus('error')
      }

      socket.onclose = () => {
        setStatus('disconnected')
        // Attempt automatic reconnect after 3 seconds
        reconnectTimeout = setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      if (socket) socket.close()
    }
  }, [])

  return { analyticsData, status, error }
}
