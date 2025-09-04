'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { useMemo } from 'react'

// Types
export interface Device {
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

export interface TemperatureReading {
  temperature: number
  status: 'NORMAL' | 'WARNING' | 'CRITICAL'
  timestamp: string
}

export type FilterStatus = 'all' | 'normal' | 'warning' | 'critical'
export type SortBy = 'name' | 'temperature' | 'battery' | 'location'
export type ViewMode = 'grid' | 'list' | 'map'

// Store state interface
interface DeviceStoreState {
  // Data
  devices: Device[]
  selectedDevice: Device | null
  
  // UI State (persisted)
  filters: {
    status: FilterStatus
    search: string
  }
  sortBy: SortBy
  sortDirection: 'asc' | 'desc'
  view: ViewMode
  
  // Actions
  setDevices: (devices: Device[]) => void
  updateDeviceReading: (deviceId: string, reading: TemperatureReading) => void
  updateDeviceStatus: (deviceId: string, status: Device['status'], isActive: boolean) => void
  selectDevice: (device: Device | null) => void
  
  // Filter and sort actions
  setStatusFilter: (status: FilterStatus) => void
  setSearchFilter: (search: string) => void
  setSortBy: (sortBy: SortBy) => void
  setSortDirection: (direction: 'asc' | 'desc') => void
  setView: (view: ViewMode) => void
  
  // Helper actions
  resetFilters: () => void
  getDeviceById: (deviceId: string) => Device | undefined
  getDevicesWithCriticalAlerts: () => Device[]
  getDeviceStats: () => {
    total: number
    online: number
    offline: number
    maintenance: number
    normal: number
    warning: number
    critical: number
  }
}

// Helper functions for filtering and sorting
const filterDevices = (devices: Device[], filters: DeviceStoreState['filters']) => {
  return devices.filter(device => {
    // Status filter
    if (filters.status !== 'all') {
      const readingStatus = device.latestReading?.status?.toLowerCase()
      if (readingStatus !== filters.status) {
        return false
      }
    }
    
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      return (
        device.name.toLowerCase().includes(searchLower) ||
        device.location.toLowerCase().includes(searchLower) ||
        device.deviceId.toLowerCase().includes(searchLower)
      )
    }
    
    return true
  })
}

const sortDevices = (devices: Device[], sortBy: SortBy, direction: 'asc' | 'desc') => {
  return [...devices].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'temperature': {
        const tempA = a.latestReading?.temperature ?? -999
        const tempB = b.latestReading?.temperature ?? -999
        comparison = tempA - tempB
        break
      }
      case 'battery':
        comparison = a.battery - b.battery
        break
      case 'location':
        comparison = a.location.localeCompare(b.location)
        break
    }
    
    return direction === 'asc' ? comparison : -comparison
  })
}

// Create the store with persistence
export const useDeviceStore = create<DeviceStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      devices: [],
      selectedDevice: null,
      
      // UI State (these will be persisted)
      filters: {
        status: 'all',
        search: ''
      },
      sortBy: 'name',
      sortDirection: 'asc',
      view: 'grid',
      
      // Actions
      setDevices: (devices) => set({ devices }),
      
      updateDeviceReading: (deviceId, reading) => set((state) => ({
        devices: state.devices.map(device =>
          device.id === deviceId
            ? { ...device, latestReading: reading }
            : device
        )
      })),
      
      updateDeviceStatus: (deviceId, status, isActive) => set((state) => ({
        devices: state.devices.map(device =>
          device.id === deviceId
            ? { ...device, status, isActive }
            : device
        )
      })),
      
      selectDevice: (device) => set({ selectedDevice: device }),
      
      // Filter and sort actions
      setStatusFilter: (status) => set((state) => ({
        filters: { ...state.filters, status }
      })),
      
      setSearchFilter: (search) => set((state) => ({
        filters: { ...state.filters, search }
      })),
      
      setSortBy: (sortBy) => set({ sortBy }),
      
      setSortDirection: (direction) => set({ sortDirection: direction }),
      
      setView: (view) => set({ view }),
      
      // Helper actions
      resetFilters: () => set({
        filters: { status: 'all', search: '' }
      }),
      
      getDeviceById: (deviceId) => {
        return get().devices.find(device => device.id === deviceId)
      },
      
      getDevicesWithCriticalAlerts: () => {
        return get().devices.filter(device => 
          device.latestReading?.status === 'CRITICAL'
        )
      },
      
      getDeviceStats: () => {
        const { devices } = get()
        return devices.reduce((stats, device) => {
          stats.total++
          
          // Status counts
          if (device.status === 'ONLINE') stats.online++
          else if (device.status === 'OFFLINE') stats.offline++
          else if (device.status === 'MAINTENANCE') stats.maintenance++
          
          // Reading status counts
          const readingStatus = device.latestReading?.status
          if (readingStatus === 'NORMAL') stats.normal++
          else if (readingStatus === 'WARNING') stats.warning++
          else if (readingStatus === 'CRITICAL') stats.critical++
          
          return stats
        }, {
          total: 0,
          online: 0,
          offline: 0,
          maintenance: 0,
          normal: 0,
          warning: 0,
          critical: 0
        })
      }
    }),
    {
      name: 'coldtrace-dashboard-preferences',
      storage: createJSONStorage(() => localStorage),
      // Only persist UI preferences, not data
      partialize: (state) => ({
        filters: state.filters,
        sortBy: state.sortBy,
        sortDirection: state.sortDirection,
        view: state.view
      })
    }
  )
)

// Selector hooks for better performance
export const useDevices = () => useDeviceStore((state) => state.devices)

export const useFilteredDevices = () => {
  const devices = useDeviceStore((state) => state.devices)
  const filters = useDeviceStore((state) => state.filters)
  const sortBy = useDeviceStore((state) => state.sortBy)
  const sortDirection = useDeviceStore((state) => state.sortDirection)
  
  return useMemo(() => {
    const filtered = filterDevices(devices, filters)
    return sortDevices(filtered, sortBy, sortDirection)
  }, [devices, filters, sortBy, sortDirection])
}

export const useSelectedDevice = () => useDeviceStore((state) => state.selectedDevice)
export const useDeviceFilters = () => useDeviceStore((state) => state.filters)
export const useDeviceSortBy = () => useDeviceStore((state) => state.sortBy)
export const useDeviceSortDirection = () => useDeviceStore((state) => state.sortDirection)
export const useDeviceSort = () => {
  const sortBy = useDeviceSortBy()
  const sortDirection = useDeviceSortDirection()
  return { sortBy, sortDirection }
}
export const useDeviceView = () => useDeviceStore((state) => state.view)

export const useDeviceStats = () => {
  const devices = useDeviceStore((state) => state.devices)
  
  return useMemo(() => {
    return devices.reduce((stats, device) => {
      stats.total++
      
      // Status counts
      if (device.status === 'ONLINE') stats.online++
      else if (device.status === 'OFFLINE') stats.offline++
      else if (device.status === 'MAINTENANCE') stats.maintenance++
      
      // Reading status counts
      const readingStatus = device.latestReading?.status
      if (readingStatus === 'NORMAL') stats.normal++
      else if (readingStatus === 'WARNING') stats.warning++
      else if (readingStatus === 'CRITICAL') stats.critical++
      
      return stats
    }, {
      total: 0,
      online: 0,
      offline: 0,
      maintenance: 0,
      normal: 0,
      warning: 0,
      critical: 0
    })
  }, [devices])
}