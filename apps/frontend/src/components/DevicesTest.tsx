'use client'

import { useQuery, useSubscription } from '@apollo/client/react'
import { gql } from '@apollo/client'
import { useEffect, useState } from 'react'

// Type definitions
interface Device {
  id: string
  deviceId: string
  name: string
  location: string
  status: string
  isActive: boolean
  battery: number
  minTemp: number
  maxTemp: number
  latestReading?: {
    id: string
    temperature: number
    battery: number
    status: string
    timestamp: string
  }
}

interface ReadingUpdate {
  id: string
  deviceId: string
  temperature: number
  battery: number
  status: string
  timestamp: string
  device: {
    name: string
    location: string
  }
}

// GraphQL Queries
const GET_DEVICES = gql`
  query GetDevices($limit: Int) {
    getDevices(limit: $limit) {
      id
      deviceId
      name
      location
      status
      isActive
      battery
      minTemp
      maxTemp
      latestReading {
        id
        temperature
        battery
        status
        timestamp
      }
    }
  }
`

// GraphQL Subscriptions
const TEMPERATURE_UPDATES = gql`
  subscription TemperatureUpdates {
    temperatureUpdates {
      id
      deviceId
      temperature
      battery
      status
      timestamp
      device {
        name
        location
      }
    }
  }
`

const NEW_ALERTS = gql`
  subscription NewAlerts {
    newAlerts {
      id
      deviceId
      type
      severity
      message
      temperature
      threshold
      acknowledged
      createdAt
      device {
        name
        location
      }
    }
  }
`

export function DevicesTest() {
  const [connectionStatus, setConnectionStatus] = useState({
    http: 'connecting',
    websocket: 'connecting'
  })
  
  // Query for devices (tests HTTP connection)
  const { loading, error, data } = useQuery(GET_DEVICES, {
    variables: { limit: 10 }
  })

  // Update connection status based on query results
  useEffect(() => {
    if (data) {
      setConnectionStatus(prev => ({ ...prev, http: 'connected' }))
    } else if (error) {
      setConnectionStatus(prev => ({ ...prev, http: 'error' }))
    }
  }, [data, error])

  // Subscribe to temperature updates (tests WebSocket connection)
  const { data: tempData, error: tempError } = useSubscription(TEMPERATURE_UPDATES)

  // Subscribe to new alerts
  const { data: alertData } = useSubscription(NEW_ALERTS)

  // Update WebSocket connection status based on subscription results
  useEffect(() => {
    if (tempData) {
      setConnectionStatus(prev => ({ ...prev, websocket: 'connected' }))
    } else if (tempError) {
      setConnectionStatus(prev => ({ ...prev, websocket: 'error' }))
    }
  }, [tempData, tempError])

  const [recentUpdates, setRecentUpdates] = useState<ReadingUpdate[]>([])

  useEffect(() => {
    if (tempData && typeof tempData === 'object' && 'temperatureUpdates' in tempData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setRecentUpdates(prev => [(tempData as any).temperatureUpdates, ...prev.slice(0, 4)])
    }
  }, [tempData])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-500'
      case 'connecting': return 'text-yellow-500'
      case 'error': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return '✅'
      case 'connecting': return '🔄'
      case 'error': return '❌'
      default: return '⏳'
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">GraphQL Connection Test</h1>
      
      {/* Connection Status */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <span>{getStatusIcon(connectionStatus.http)}</span>
            <span className="font-medium">HTTP (Queries/Mutations):</span>
            <span className={`font-semibold ${getStatusColor(connectionStatus.http)}`}>
              {connectionStatus.http}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span>{getStatusIcon(connectionStatus.websocket)}</span>
            <span className="font-medium">WebSocket (Subscriptions):</span>
            <span className={`font-semibold ${getStatusColor(connectionStatus.websocket)}`}>
              {connectionStatus.websocket}
            </span>
          </div>
        </div>
      </div>

      {/* Devices Query Results */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Devices (Query Test)</h2>
        {loading && <p className="text-gray-600">Loading devices...</p>}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <p className="text-red-700 font-semibold">Error loading devices:</p>
            <p className="text-red-600 text-sm">{error.message}</p>
          </div>
        )}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {data && typeof data === 'object' && 'getDevices' in data && (data as any).getDevices && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(data as any).getDevices.map((device: Device) => (
              <div key={device.id} className="border border-gray-200 rounded p-4">
                <h3 className="font-semibold">{device.name}</h3>
                <p className="text-sm text-gray-600">{device.location}</p>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Status:</span>
                    <span className={`font-medium ${
                      device.status === 'ONLINE' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {device.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Battery:</span>
                    <span>{device.battery?.toFixed(1)}%</span>
                  </div>
                  {device.latestReading && (
                    <div className="flex justify-between text-sm">
                      <span>Temperature:</span>
                      <span className={`font-medium ${
                        device.latestReading.status === 'NORMAL' ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {device.latestReading.temperature.toFixed(1)}°C
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Real-time Updates */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Real-time Updates (Subscription Test)</h2>
        {recentUpdates.length === 0 ? (
          <p className="text-gray-600">Waiting for real-time temperature updates...</p>
        ) : (
          <div className="space-y-3">
            {recentUpdates.map((update, index) => (
              <div key={`${update.id}-${index}`} className="border-l-4 border-blue-400 pl-4 py-2 bg-blue-50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{update.device.name}</p>
                    <p className="text-sm text-gray-600">{update.device.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{update.temperature.toFixed(1)}°C</p>
                    <p className="text-xs text-gray-500">
                      {new Date(update.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {(() => {
          if (alertData && typeof alertData === 'object' && 'newAlerts' in alertData) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const alert = (alertData as any).newAlerts
            return (
              <div className="mt-4 bg-red-50 border border-red-200 rounded p-4">
                <h3 className="font-semibold text-red-700">Latest Alert</h3>
                <p className="text-sm text-red-600">{alert.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {alert.device.name} - {alert.device.location}
                </p>
              </div>
            )
          }
          return null
        })()}
      </div>
    </div>
  )
}