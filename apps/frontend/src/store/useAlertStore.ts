'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { toast } from 'sonner'
import { useMemo } from 'react'

// Alert types
export interface Alert {
  id: string
  deviceId: string
  deviceName: string
  location: string
  severity: 'CRITICAL' | 'WARNING' | 'NORMAL'
  type: 'TEMPERATURE' | 'BATTERY' | 'CONNECTION' | 'MAINTENANCE'
  message: string
  details: string
  timestamp: string
  acknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: string
}

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'NORMAL'
export type AlertType = 'TEMPERATURE' | 'BATTERY' | 'CONNECTION' | 'MAINTENANCE'

// Store state interface
interface AlertStoreState {
  // Data
  alerts: Alert[]
  
  // UI State (persisted)
  alertPanelOpen: boolean
  soundEnabled: boolean
  lastAlertSound: number
  
  // Actions
  addAlert: (alert: Omit<Alert, 'id' | 'acknowledged'>) => void
  acknowledgeAlert: (alertId: string) => void
  acknowledgeAllAlerts: () => void
  dismissAlert: (alertId: string) => void
  clearAcknowledgedAlerts: () => void
  
  // UI Actions
  toggleAlertPanel: () => void
  openAlertPanel: () => void
  closeAlertPanel: () => void
  toggleSound: () => void
  
  // Helper actions
  getAlertById: (alertId: string) => Alert | undefined
  getAlertsByDevice: (deviceId: string) => Alert[]
  getAlertsByType: (type: AlertType) => Alert[]
  getAlertsBySeverity: (severity: AlertSeverity) => Alert[]
}

// Helper function to generate unique IDs
const generateAlertId = () => {
  return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Helper function to play alert sounds
const playAlertSound = (severity: AlertSeverity, soundEnabled: boolean, lastSoundTime: number) => {
  if (!soundEnabled) return

  // Prevent sound spam (max 1 sound per 3 seconds)
  const now = Date.now()
  if (now - lastSoundTime < 3000) return

  // Create audio context and play different sounds based on severity
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    // Different frequencies and patterns for different severities
    switch (severity) {
      case 'CRITICAL':
        // Urgent rapid beeps
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1)
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2)
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
        break
      case 'WARNING':
        // Moderate chime
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime)
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.15)
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.4)
        break
      case 'NORMAL':
        // Soft notification
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime)
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.2)
        break
    }

    return now
  } catch (error) {
    console.warn('Audio playback failed:', error)
    return lastSoundTime
  }
}

// Helper function to get severity color
export const getSeverityColor = (severity: AlertSeverity) => {
  switch (severity) {
    case 'CRITICAL':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        badge: 'bg-red-500',
        icon: '🔴'
      }
    case 'WARNING':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-800',
        badge: 'bg-yellow-500',
        icon: '🟡'
      }
    case 'NORMAL':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-800',
        badge: 'bg-blue-500',
        icon: '🔵'
      }
  }
}

// Helper function to format time since alert
export const formatTimeSince = (timestamp: string) => {
  const now = new Date().getTime()
  const alertTime = new Date(timestamp).getTime()
  const diffInMinutes = Math.floor((now - alertTime) / (1000 * 60))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
}

// Create the alert store
export const useAlertStore = create<AlertStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      alerts: [],
      
      // UI State (persisted)
      alertPanelOpen: false,
      soundEnabled: true,
      lastAlertSound: 0,
      
      // Actions
      addAlert: (alertData) => {
        console.log('AlertStore: addAlert called with data:', alertData)
        
        const alert: Alert = {
          ...alertData,
          id: generateAlertId(),
          acknowledged: false
        }
        
        console.log('AlertStore: Generated alert object:', alert)
        
        set((state) => ({
          alerts: [alert, ...state.alerts] // Add to beginning for newest first
        }))
        
        console.log('AlertStore: Alert added to store')
        
        const { soundEnabled, lastAlertSound } = get()
        
        // Play sound and update last sound time
        const newSoundTime = playAlertSound(alert.severity, soundEnabled, lastAlertSound)
        if (newSoundTime) {
          set({ lastAlertSound: newSoundTime })
        }
        
        console.log('AlertStore: About to trigger toast notification')
        
        // Show toast notification with appropriate type
        const toastOptions = {
          description: `${alert.location} • Click to view details`,
          action: {
            label: 'View',
            onClick: () => get().openAlertPanel()
          },
          duration: alert.severity === 'CRITICAL' ? 10000 : 5000
        }
        
        const message = `${alert.deviceName}: ${alert.message}`
        
        // Use different toast types based on severity
        try {
          switch (alert.severity) {
            case 'CRITICAL':
              console.log('AlertStore: Triggering toast.error for CRITICAL alert')
              toast.error(message, toastOptions)
              break
            case 'WARNING':
              console.log('AlertStore: Triggering toast.warning for WARNING alert')
              toast.warning(message, toastOptions)
              break
            case 'NORMAL':
              console.log('AlertStore: Triggering toast.info for NORMAL alert')
              toast.info(message, toastOptions)
              break
          }
          console.log('AlertStore: Toast triggered successfully:', { message, severity: alert.severity })
        } catch (error) {
          console.error('AlertStore: Error triggering toast:', error)
        }
        
        // Auto-open panel for critical alerts
        if (alert.severity === 'CRITICAL') {
          get().openAlertPanel()
        }
      },
      
      acknowledgeAlert: (alertId) => set((state) => ({
        alerts: state.alerts.map(alert =>
          alert.id === alertId
            ? {
                ...alert,
                acknowledged: true,
                acknowledgedAt: new Date().toISOString(),
                acknowledgedBy: 'Current User' // TODO: Replace with actual user
              }
            : alert
        )
      })),
      
      acknowledgeAllAlerts: () => set((state) => ({
        alerts: state.alerts.map(alert => ({
          ...alert,
          acknowledged: true,
          acknowledgedAt: new Date().toISOString(),
          acknowledgedBy: 'Current User' // TODO: Replace with actual user
        }))
      })),
      
      dismissAlert: (alertId) => set((state) => ({
        alerts: state.alerts.filter(alert => alert.id !== alertId)
      })),
      
      clearAcknowledgedAlerts: () => set((state) => ({
        alerts: state.alerts.filter(alert => !alert.acknowledged)
      })),
      
      // UI Actions
      toggleAlertPanel: () => set((state) => ({
        alertPanelOpen: !state.alertPanelOpen
      })),
      
      openAlertPanel: () => set({ alertPanelOpen: true }),
      
      closeAlertPanel: () => set({ alertPanelOpen: false }),
      
      toggleSound: () => set((state) => ({
        soundEnabled: !state.soundEnabled
      })),
      
      // Helper actions
      getAlertById: (alertId) => {
        return get().alerts.find(alert => alert.id === alertId)
      },
      
      getAlertsByDevice: (deviceId) => {
        return get().alerts.filter(alert => alert.deviceId === deviceId)
      },
      
      getAlertsByType: (type) => {
        return get().alerts.filter(alert => alert.type === type)
      },
      
      getAlertsBySeverity: (severity) => {
        return get().alerts.filter(alert => alert.severity === severity)
      }
    }),
    {
      name: 'coldtrace-alert-preferences',
      storage: createJSONStorage(() => localStorage),
      // Only persist UI preferences, not alerts (they should come from server)
      partialize: (state) => ({
        alertPanelOpen: state.alertPanelOpen,
        soundEnabled: state.soundEnabled
      })
    }
  )
)

// Selector hooks for better performance
export const useAlerts = () => useAlertStore((state) => state.alerts)

export const useUnacknowledgedAlerts = () => {
  const alerts = useAlertStore((state) => state.alerts)
  
  return useMemo(() => {
    return alerts.filter(alert => !alert.acknowledged)
  }, [alerts])
}

export const useUnacknowledgedCount = () => {
  const alerts = useAlertStore((state) => state.alerts)
  
  return useMemo(() => {
    return alerts.filter(alert => !alert.acknowledged).length
  }, [alerts])
}

export const useCriticalAlerts = () => {
  const alerts = useAlertStore((state) => state.alerts)
  
  return useMemo(() => {
    return alerts.filter(alert => alert.severity === 'CRITICAL' && !alert.acknowledged)
  }, [alerts])
}

export const useAlertPanelOpen = () => useAlertStore((state) => state.alertPanelOpen)
export const useSoundEnabled = () => useAlertStore((state) => state.soundEnabled)