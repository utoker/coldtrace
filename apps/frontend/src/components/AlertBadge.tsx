'use client'

import { useEffect, useState } from 'react'
import { 
  useAlertStore, 
  useUnacknowledgedCount, 
  useCriticalAlerts 
} from '@/store/useAlertStore'

export function AlertBadge() {
  const unacknowledgedCount = useUnacknowledgedCount()
  const criticalAlerts = useCriticalAlerts()
  const { toggleAlertPanel } = useAlertStore()
  
  const [isNewAlert, setIsNewAlert] = useState(false)
  const [previousCount, setPreviousCount] = useState(0)
  
  // Animate when new alerts arrive
  useEffect(() => {
    if (unacknowledgedCount > previousCount && previousCount > 0) {
      setIsNewAlert(true)
      const timer = setTimeout(() => setIsNewAlert(false), 3000)
      return () => clearTimeout(timer)
    }
    setPreviousCount(unacknowledgedCount)
    return () => {}
  }, [unacknowledgedCount, previousCount])
  
  // Don't show badge if no alerts
  if (unacknowledgedCount === 0) {
    return null
  }
  
  const hasCritical = criticalAlerts.length > 0
  
  return (
    <button
      onClick={toggleAlertPanel}
      className={`
        relative flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200
        ${hasCritical 
          ? 'bg-red-50 hover:bg-red-100 border border-red-200' 
          : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
        }
        ${isNewAlert ? 'animate-pulse' : ''}
      `}
      title={`${unacknowledgedCount} unacknowledged alert${unacknowledgedCount > 1 ? 's' : ''}`}
    >
      {/* Alert Icon */}
      <div className="relative">
        {hasCritical ? (
          <svg 
            className="w-5 h-5 text-red-600" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              fillRule="evenodd" 
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
              clipRule="evenodd" 
            />
          </svg>
        ) : (
          <svg 
            className="w-5 h-5 text-gray-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 01-15 0v5z" 
            />
          </svg>
        )}
        
        {/* Notification Badge */}
        <div
          className={`
            absolute -top-2 -right-2 min-w-[18px] h-[18px] rounded-full flex items-center justify-center
            text-white text-xs font-bold
            ${hasCritical ? 'bg-red-500' : 'bg-gray-500'}
            ${isNewAlert ? 'animate-bounce' : ''}
          `}
        >
          {unacknowledgedCount > 99 ? '99+' : unacknowledgedCount}
        </div>
        
        {/* Pulse Ring for Critical Alerts */}
        {hasCritical && (
          <div className="absolute -top-1 -right-1 w-6 h-6">
            <div className="w-full h-full bg-red-400 rounded-full animate-ping opacity-75"></div>
          </div>
        )}
      </div>
      
      {/* Text Label (Hidden on Mobile) */}
      <span className={`
        hidden sm:block text-sm font-medium
        ${hasCritical ? 'text-red-700' : 'text-gray-700'}
      `}>
        {hasCritical ? 'Critical Alerts' : 'Alerts'}
      </span>
      
      {/* Chevron Icon */}
      <svg 
        className={`
          w-4 h-4 transition-transform duration-200
          ${hasCritical ? 'text-red-600' : 'text-gray-600'}
        `} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M19 9l-7 7-7-7" 
        />
      </svg>
    </button>
  )
}