'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

interface WebSocketContextType {
  isConnected: boolean
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error'
  lastConnected: Date | null
  retryCount: number
  error: string | null
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  connectionState: 'disconnected',
  lastConnected: null,
  retryCount: 0,
  error: null,
})

export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}

interface WebSocketProviderProps {
  children: React.ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const [lastConnected, setLastConnected] = useState<Date | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleConnected = useCallback(() => {
    console.log('🌐 WebSocketProvider: Connection established')
    setIsConnected(true)
    setConnectionState('connected')
    setLastConnected(new Date())
    setRetryCount(0)
    setError(null)
  }, [])

  const handleError = useCallback((event: CustomEvent) => {
    console.error('🌐 WebSocketProvider: Connection error:', event.detail)
    setIsConnected(false)
    setConnectionState('error')
    setRetryCount(prev => prev + 1)
    setError(event.detail?.message || 'WebSocket connection error')
  }, [])

  const handleClosed = useCallback((event: CustomEvent) => {
    console.warn('🌐 WebSocketProvider: Connection closed:', event.detail)
    setIsConnected(false)
    setConnectionState('disconnected')
    setError(null)
  }, [])

  const handleConnecting = useCallback(() => {
    console.log('🌐 WebSocketProvider: Connecting...')
    setConnectionState('connecting')
    setError(null)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Set initial state from window global
    const initialConnected = !!window.__GRAPHQL_WS_CONNECTED__
    console.log('🌐 WebSocketProvider: Initial connection state:', initialConnected ? 'connected' : 'disconnected')
    
    if (initialConnected) {
      setIsConnected(true)
      setConnectionState('connected')
      setLastConnected(new Date())
    }

    // Listen for connection events
    window.addEventListener('graphql-ws-connected', handleConnected)
    window.addEventListener('graphql-ws-error', handleError as EventListener)
    window.addEventListener('graphql-ws-closed', handleClosed as EventListener)
    window.addEventListener('graphql-ws-connecting', handleConnecting)

    return () => {
      window.removeEventListener('graphql-ws-connected', handleConnected)
      window.removeEventListener('graphql-ws-error', handleError as EventListener)
      window.removeEventListener('graphql-ws-closed', handleClosed as EventListener)
      window.removeEventListener('graphql-ws-connecting', handleConnecting)
    }
  }, [handleConnected, handleError, handleClosed, handleConnecting])

  const value: WebSocketContextType = {
    isConnected,
    connectionState,
    lastConnected,
    retryCount,
    error,
  }

  console.log('🌐 WebSocketProvider: Current state:', value)

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}