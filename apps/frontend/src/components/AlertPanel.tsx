'use client'

import { useEffect, useRef } from 'react'
import { 
  useAlertStore,
  useAlerts,
  useAlertPanelOpen,
  useSoundEnabled,
  getSeverityColor,
  formatTimeSince
} from '@/store/useAlertStore'

export function AlertPanel() {
  const alerts = useAlerts()
  const isOpen = useAlertPanelOpen()
  const soundEnabled = useSoundEnabled()
  const panelRef = useRef<HTMLDivElement>(null)
  
  const {
    closeAlertPanel,
    acknowledgeAlert,
    acknowledgeAllAlerts,
    dismissAlert,
    clearAcknowledgedAlerts,
    toggleSound
  } = useAlertStore()
  
  // Handle escape key to close panel
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        closeAlertPanel()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, closeAlertPanel])
  
  // Handle click outside to close panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node) && isOpen) {
        closeAlertPanel()
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, closeAlertPanel])
  
  // Prevent body scroll when panel is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])
  
  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged)
  const acknowledgedAlerts = alerts.filter(alert => alert.acknowledged)
  
  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 bg-black bg-opacity-50 transition-opacity z-40
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={closeAlertPanel}
      />
      
      {/* Panel */}
      <div
        ref={panelRef}
        className={`
          fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Alert Center
            </h2>
            {unacknowledgedAlerts.length > 0 && (
              <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {unacknowledgedAlerts.length}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className={`
                p-2 rounded-lg transition-colors
                ${soundEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}
              `}
              title={soundEnabled ? 'Sound enabled' : 'Sound muted'}
            >
              {soundEnabled ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.779L4.83 14H2a1 1 0 01-1-1V7a1 1 0 011-1h2.83l3.553-2.779zm2.404 3.094a.75.75 0 001.214.922 4.5 4.5 0 010 5.816.75.75 0 00-1.214.922 6 6 0 010-7.66zm3.097 1.39a.75.75 0 011.262.784 7.5 7.5 0 010 8.311.75.75 0 01-1.262-.784 6 6 0 000-6.642z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.779L4.83 14H2a1 1 0 01-1-1V7a1 1 0 011-1h2.83l3.553-2.779z" />
                  <path d="M15.85 8.757a.75.75 0 00-1.06-1.06L13.5 9.086l-1.29-1.29a.75.75 0 00-1.06 1.061l1.29 1.29-1.29 1.29a.75.75 0 001.06 1.061l1.29-1.29 1.29 1.29a.75.75 0 101.061-1.061L14.561 10.5l1.29-1.743z" />
                </svg>
              )}
            </button>
            
            {/* Close Button */}
            <button
              onClick={closeAlertPanel}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              title="Close panel"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {alerts.length === 0 ? (
            /* Empty State */
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">All Clear!</h3>
                <p className="text-gray-500">No active alerts at this time.</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {/* Action Buttons */}
              {unacknowledgedAlerts.length > 0 && (
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex space-x-2">
                    <button
                      onClick={acknowledgeAllAlerts}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Acknowledge All ({unacknowledgedAlerts.length})
                    </button>
                    {acknowledgedAlerts.length > 0 && (
                      <button
                        onClick={clearAcknowledgedAlerts}
                        className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        Clear Acknowledged
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              {/* Unacknowledged Alerts */}
              {unacknowledgedAlerts.length > 0 && (
                <div className="p-4 pb-0">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                    Active Alerts ({unacknowledgedAlerts.length})
                  </h3>
                  <div className="space-y-3">
                    {unacknowledgedAlerts.map((alert) => (
                      <AlertCard
                        key={alert.id}
                        alert={alert}
                        onAcknowledge={() => acknowledgeAlert(alert.id)}
                        onDismiss={() => dismissAlert(alert.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Acknowledged Alerts */}
              {acknowledgedAlerts.length > 0 && (
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                    Acknowledged ({acknowledgedAlerts.length})
                  </h3>
                  <div className="space-y-3">
                    {acknowledgedAlerts.slice(0, 5).map((alert) => (
                      <AlertCard
                        key={alert.id}
                        alert={alert}
                        onDismiss={() => dismissAlert(alert.id)}
                        acknowledged
                      />
                    ))}
                    {acknowledgedAlerts.length > 5 && (
                      <p className="text-xs text-gray-500 text-center py-2">
                        And {acknowledgedAlerts.length - 5} more acknowledged alerts...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// Alert Card Component
interface AlertCardProps {
  alert: {
    id: string
    deviceName: string
    location: string
    severity: 'CRITICAL' | 'WARNING' | 'NORMAL'
    type: string
    message: string
    details?: string
    timestamp: string
    acknowledged: boolean
    acknowledgedAt?: string
    acknowledgedBy?: string
  }
  onAcknowledge?: () => void
  onDismiss: () => void
  acknowledged?: boolean
}

function AlertCard({ alert, onAcknowledge, onDismiss, acknowledged = false }: AlertCardProps) {
  const colors = getSeverityColor(alert.severity)
  
  return (
    <div className={`
      ${colors.bg} ${colors.border} border rounded-lg p-3 transition-all duration-200
      ${acknowledged ? 'opacity-75' : 'hover:shadow-md'}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <span className="text-sm">{colors.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-gray-900 truncate">
              {alert.deviceName}
            </p>
            <p className="text-xs text-gray-600 truncate">
              {alert.location}
            </p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center space-x-1 ml-2">
          {!acknowledged && onAcknowledge && (
            <button
              onClick={onAcknowledge}
              className="p-1 rounded text-gray-600 hover:text-blue-600 hover:bg-white transition-colors"
              title="Acknowledge alert"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          )}
          <button
            onClick={onDismiss}
            className="p-1 rounded text-gray-600 hover:text-red-600 hover:bg-white transition-colors"
            title="Dismiss alert"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Message */}
      <p className={`text-sm ${colors.text} mb-2`}>
        {alert.message}
      </p>
      
      {/* Details */}
      {alert.details && (
        <p className="text-xs text-gray-600 mb-2">
          {alert.details}
        </p>
      )}
      
      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{formatTimeSince(alert.timestamp)}</span>
        <div className="flex items-center space-x-2">
          <span className="capitalize">{alert.type.toLowerCase()}</span>
          <span>•</span>
          <span className="capitalize">{alert.severity.toLowerCase()}</span>
        </div>
      </div>
      
      {/* Acknowledged Info */}
      {acknowledged && alert.acknowledgedAt && (
        <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
          Acknowledged {formatTimeSince(alert.acknowledgedAt)}
          {alert.acknowledgedBy && ` by ${alert.acknowledgedBy}`}
        </div>
      )}
    </div>
  )
}