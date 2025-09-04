'use client'

import { useState, useEffect } from 'react'

interface Device {
  id: string
  deviceId: string
  name: string
  location: string
  battery: number
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE'
  isActive: boolean
  latestReading?: {
    temperature: number
    status: 'NORMAL' | 'WARNING' | 'CRITICAL'
    timestamp: string
  }
}

interface DeviceCardProps {
  device: Device
  isUpdating?: boolean
}

export function DeviceCard({ device, isUpdating = false }: DeviceCardProps) {
  const [flashUpdate, setFlashUpdate] = useState(false)
  
  // Temperature color coding
  const getTemperatureColor = (temp: number) => {
    if (temp < 2) return { bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-200' }
    if (temp <= 4) return { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-100' }
    if (temp <= 6) return { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-100' }
    if (temp <= 8) return { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-100' }
    return { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' }
  }

  const getTemperatureIcon = (temp: number) => {
    if (temp < 2) return '🥶'
    if (temp <= 4) return '❄️'
    if (temp <= 6) return '✅'
    if (temp <= 8) return '⚠️'
    return '🔥'
  }

  // Battery color coding
  const getBatteryColor = (battery: number) => {
    if (battery > 50) return 'text-green-600'
    if (battery > 20) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Status indicator
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ONLINE': return { color: 'bg-green-500', text: 'Online', textColor: 'text-green-700' }
      case 'OFFLINE': return { color: 'bg-red-500', text: 'Offline', textColor: 'text-red-700' }
      case 'MAINTENANCE': return { color: 'bg-orange-500', text: 'Maintenance', textColor: 'text-orange-700' }
      default: return { color: 'bg-gray-500', text: 'Unknown', textColor: 'text-gray-700' }
    }
  }

  // Flash animation when updated
  useEffect(() => {
    if (isUpdating) {
      setFlashUpdate(true)
      const timer = setTimeout(() => setFlashUpdate(false), 1000)
      return () => clearTimeout(timer)
    }
    return () => {}
  }, [isUpdating])

  const temperature = device.latestReading?.temperature
  const tempColors = temperature ? getTemperatureColor(temperature) : null
  const statusConfig = getStatusConfig(device.status)

  return (
    <div 
      className={`
        bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300
        border-2 p-6
        ${flashUpdate ? 'border-blue-400 shadow-lg' : 'border-gray-100'}
        ${isUpdating ? 'animate-pulse' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${statusConfig.color} ${device.status === 'ONLINE' ? 'animate-pulse' : ''}`}></div>
          <span className={`text-sm font-medium ${statusConfig.textColor}`}>
            {statusConfig.text}
          </span>
        </div>
        
        {/* Battery */}
        <div className="flex items-center space-x-1">
          <svg className={`w-5 h-5 ${getBatteryColor(device.battery)}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M15.67 4H14V2c0-1.1-.9-2-2-2s-2 .9-2 2v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/>
            <path d="M11 20v-5.5c0-.28.22-.5.5-.5s.5.22.5.5V20c0 .28-.22.5-.5.5s-.5-.22-.5-.5z"/>
          </svg>
          <span className={`text-sm font-semibold ${getBatteryColor(device.battery)}`}>
            {Math.round(device.battery)}%
          </span>
        </div>
      </div>

      {/* Device Info */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">
          {device.name}
        </h3>
        <p className="text-sm text-gray-600 mb-1">{device.location}</p>
        <p className="text-xs text-gray-500">ID: {device.deviceId}</p>
      </div>

      {/* Temperature */}
      {temperature !== undefined ? (
        <div className={`rounded-lg p-4 ${tempColors?.bg} ${tempColors?.border} border`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{getTemperatureIcon(temperature)}</span>
              <div>
                <div className={`text-2xl font-bold ${tempColors?.text}`}>
                  {temperature.toFixed(1)}°C
                </div>
                <div className="text-xs text-gray-600">
                  Status: {device.latestReading?.status || 'Unknown'}
                </div>
              </div>
            </div>
            
            {/* Live indicator */}
            {device.status === 'ONLINE' && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                <span className="text-xs text-green-600 font-medium">LIVE</span>
              </div>
            )}
          </div>
          
          {/* Last updated */}
          {device.latestReading?.timestamp && (
            <div className="mt-2 text-xs text-gray-500">
              Updated: {new Date(device.latestReading.timestamp).toLocaleTimeString()}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg p-4 bg-gray-50 border border-gray-200">
          <div className="text-center text-gray-500">
            <span className="text-2xl">📊</span>
            <div className="text-sm mt-1">No temperature data</div>
          </div>
        </div>
      )}
      
      {/* Temperature range indicator */}
      <div className="mt-3 flex items-center justify-center space-x-1 text-xs text-gray-500">
        <span>Target: 2-8°C</span>
        {temperature !== undefined && (
          <>
            <span>•</span>
            <span className={temperature >= 2 && temperature <= 8 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
              {temperature >= 2 && temperature <= 8 ? 'In Range' : 'Out of Range'}
            </span>
          </>
        )}
      </div>
    </div>
  )
}