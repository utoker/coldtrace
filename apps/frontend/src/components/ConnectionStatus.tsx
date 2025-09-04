'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@apollo/client/react'
import { gql } from '@apollo/client'

// Simple query to test connection
const CONNECTION_TEST = gql`
  query ConnectionTest {
    hello
  }
`

type ConnectionState = 'connected' | 'connecting' | 'disconnected' | 'error'

export function ConnectionStatus() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting')
  const [lastConnected, setLastConnected] = useState<Date | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [wsConnected, setWsConnected] = useState<boolean>(false)

  // One-time connection test on mount only
  const { error, data, refetch } = useQuery(CONNECTION_TEST, {
    errorPolicy: 'all',
    fetchPolicy: 'network-only',
  })

  // Handle initial query results
  useEffect(() => {
    if (data && !error) {
      setConnectionState('connected')
      setLastConnected(new Date())
      setRetryCount(0)
    } else if (error) {
      setConnectionState('error')
      setRetryCount(prev => prev + 1)
    }
  }, [data, error])

  // Monitor WebSocket connection state using events instead of polling
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleWSConnected = () => {
      console.log('✅ ConnectionStatus: WebSocket connected')
      setWsConnected(true)
      setConnectionState('connected')
      setLastConnected(new Date())
      setRetryCount(0)
    }
    
    const handleWSError = (event: CustomEvent) => {
      console.error('❌ ConnectionStatus: WebSocket error:', event.detail)
      setWsConnected(false)
      setConnectionState('error')
      setRetryCount(prev => prev + 1)
    }
    
    const handleWSClosed = (event: CustomEvent) => {
      console.warn('🔌 ConnectionStatus: WebSocket closed:', event.detail)
      setWsConnected(false)
      setConnectionState('disconnected')
    }

    const handleWSConnecting = () => {
      console.log('🔄 ConnectionStatus: WebSocket connecting...')
      setConnectionState('connecting')
    }

    // Set initial state from window global
    if (typeof window !== 'undefined') {
      const isConnected = !!window.__GRAPHQL_WS_CONNECTED__
      setWsConnected(isConnected)
      if (isConnected) {
        setConnectionState('connected')
        setLastConnected(new Date())
      }
    }

    // Listen for WebSocket connection events
    window.addEventListener('graphql-ws-connected', handleWSConnected)
    window.addEventListener('graphql-ws-error', handleWSError as EventListener)
    window.addEventListener('graphql-ws-closed', handleWSClosed as EventListener)
    window.addEventListener('graphql-ws-connecting', handleWSConnecting)

    return () => {
      window.removeEventListener('graphql-ws-connected', handleWSConnected)
      window.removeEventListener('graphql-ws-error', handleWSError as EventListener)
      window.removeEventListener('graphql-ws-closed', handleWSClosed as EventListener)
      window.removeEventListener('graphql-ws-connecting', handleWSConnecting)
    }
  }, [])

  // Retry connection test when needed (but not on a timer)
  const handleRetry = () => {
    setConnectionState('connecting')
    setRetryCount(prev => prev + 1)
    refetch()
  }

  const getStatusConfig = () => {
    switch (connectionState) {
      case 'connected':
        return {
          color: 'bg-green-500',
          textColor: 'text-green-700',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: '🟢',
          text: 'LIVE',
          description: 'Real-time data streaming'
        }
      case 'connecting':
        return {
          color: 'bg-yellow-500',
          textColor: 'text-yellow-700',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: '🟡',
          text: 'CONNECTING',
          description: 'Establishing connection...'
        }
      case 'disconnected':
        return {
          color: 'bg-gray-500',
          textColor: 'text-gray-700',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: '⚪',
          text: 'OFFLINE',
          description: 'Connection inactive'
        }
      case 'error':
        return {
          color: 'bg-red-500',
          textColor: 'text-red-700',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: '🔴',
          text: 'DISCONNECTED',
          description: retryCount > 0 ? `Reconnecting... (${retryCount})` : 'Connection failed'
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 mb-6`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${config.color} ${connectionState === 'connected' ? 'animate-pulse' : ''}`}></div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">{config.icon}</span>
              <span className={`font-semibold ${config.textColor}`}>
                {config.text}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {config.description}
            </p>
          </div>
        </div>

        {/* Connection details */}
        <div className="text-right text-sm text-gray-500">
          {lastConnected && connectionState === 'connected' && (
            <p>Connected at {lastConnected.toLocaleTimeString()}</p>
          )}
          {connectionState === 'error' && retryCount > 0 && (
            <p>Retry #{retryCount}</p>
          )}
          {connectionState === 'connecting' && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
              <span>Connecting...</span>
            </div>
          )}
        </div>
      </div>

      {/* Connection quality indicator */}
      {connectionState === 'connected' && (
        <div className="mt-3 flex items-center space-x-4 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <span>📡</span>
            <span>GraphQL: Active</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>⚡</span>
            <span>WebSocket: {wsConnected ? 'Streaming' : 'Disconnected'}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>🔄</span>
            <span>Auto-refresh: On</span>
          </div>
        </div>
      )}

      {/* Reconnection status */}
      {connectionState === 'error' && (
        <div className="mt-3 text-xs text-red-600">
          <p>⚠️ Connection lost. Attempting to reconnect automatically...</p>
          {retryCount > 3 && (
            <p className="mt-1">If connection issues persist, please check your network or contact support.</p>
          )}
          <button
            onClick={handleRetry}
            className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
          >
            Retry Now
          </button>
        </div>
      )}
    </div>
  )
}