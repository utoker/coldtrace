'use client'

import { useEffect, useState } from 'react'
import { useAlertStore } from '@/store/useAlertStore'
import { toast } from 'sonner'

export function TestAlertButton() {
  const { addAlert } = useAlertStore()
  const [hasTriggeredDemo, setHasTriggeredDemo] = useState(false)
  
  // Auto-trigger a demo alert on first load to show the system works
  useEffect(() => {
    if (!hasTriggeredDemo) {
      const timer = setTimeout(() => {
        console.log('Triggering demo alert to verify system works...')
        triggerTestAlert('NORMAL')
        setHasTriggeredDemo(true)
      }, 2000) // Wait 2 seconds after page load
      
      return () => clearTimeout(timer)
    }
    return () => {}
  }, [hasTriggeredDemo])

  const triggerTestAlert = (severity: 'CRITICAL' | 'WARNING' | 'NORMAL') => {
    const messages = {
      CRITICAL: {
        message: 'Temperature too high: 12.5°C',
        details: 'Temperature has exceeded the safe maximum of 8°C',
        type: 'TEMPERATURE' as const
      },
      WARNING: {
        message: 'Battery low: 15%',
        details: 'Device battery level is 15%. Consider replacing or recharging soon.',
        type: 'BATTERY' as const
      },
      NORMAL: {
        message: 'Device maintenance due',
        details: 'Scheduled maintenance is recommended for optimal performance.',
        type: 'MAINTENANCE' as const
      }
    }
    
    const alertConfig = messages[severity]
    
    console.log('TestAlertButton: Triggering alert', { severity, alertConfig })
    
    const alertData = {
      deviceId: 'demo-device-1',
      deviceName: 'Demo Cold Storage Unit',
      location: 'Warehouse A - Section 3',
      severity,
      ...alertConfig,
      timestamp: new Date().toISOString()
    }
    
    console.log('TestAlertButton: Alert data', alertData)
    
    try {
      addAlert(alertData)
      console.log('TestAlertButton: Alert added successfully')
    } catch (error) {
      console.error('TestAlertButton: Error adding alert', error)
    }
  }
  
  const testDirectToast = (type: 'error' | 'warning' | 'info') => {
    console.log('Testing direct toast call:', type)
    try {
      switch (type) {
        case 'error':
          toast.error('Direct toast error test')
          break
        case 'warning':
          toast.warning('Direct toast warning test')
          break
        case 'info':
          toast.info('Direct toast info test')
          break
      }
      console.log('Direct toast call completed successfully')
    } catch (error) {
      console.error('Direct toast call failed:', error)
    }
  }
  
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-500">Alert Test:</span>
        <button
          onClick={() => triggerTestAlert('CRITICAL')}
          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          title="Test critical alert"
        >
          Critical
        </button>
        <button
          onClick={() => triggerTestAlert('WARNING')}
          className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
          title="Test warning alert"
        >
          Warning
        </button>
        <button
          onClick={() => triggerTestAlert('NORMAL')}
          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          title="Test info alert"
        >
          Info
        </button>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-500">Direct Toast:</span>
        <button
          onClick={() => testDirectToast('error')}
          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          title="Test direct toast error"
        >
          Toast Error
        </button>
        <button
          onClick={() => testDirectToast('warning')}
          className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
          title="Test direct toast warning"
        >
          Toast Warning
        </button>
        <button
          onClick={() => testDirectToast('info')}
          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          title="Test direct toast info"
        >
          Toast Info
        </button>
      </div>
    </div>
  )
}