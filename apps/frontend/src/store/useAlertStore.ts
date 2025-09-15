'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useMemo } from 'react';

// Types
export interface Alert {
  id: string;
  deviceId: string;
  type:
    | 'TEMPERATURE_EXCURSION'
    | 'DEVICE_OFFLINE'
    | 'LOW_BATTERY'
    | 'CONNECTION_LOST';
  severity: 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  isRead: boolean;
  isResolved: boolean;
  resolvedAt?: string | undefined;
  resolvedBy?: string | undefined;
  createdAt: string;
  updatedAt: string;
  device: {
    id: string;
    name: string;
    location: string;
  };
}

export type AlertFilterStatus =
  | 'all'
  | 'unread'
  | 'critical'
  | 'warning'
  | 'resolved';
export type AlertSortBy = 'createdAt' | 'severity' | 'type' | 'device';

// Store state interface
interface AlertStoreState {
  // Data
  alerts: Alert[];
  selectedAlert: Alert | null;

  // UI State (persisted)
  filters: {
    status: AlertFilterStatus;
    search: string;
    deviceId?: string | undefined;
  };
  sortBy: AlertSortBy;
  sortDirection: 'asc' | 'desc';
  isAlertPanelOpen: boolean;

  // Actions
  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  updateAlert: (alertId: string, updates: Partial<Alert>) => void;
  removeAlert: (alertId: string) => void;
  selectAlert: (alert: Alert | null) => void;

  // Filter and sort actions
  setStatusFilter: (status: AlertFilterStatus) => void;
  setSearchFilter: (search: string) => void;
  setDeviceFilter: (deviceId?: string) => void;
  setSortBy: (sortBy: AlertSortBy) => void;
  setSortDirection: (direction: 'asc' | 'desc') => void;

  // UI actions
  setAlertPanelOpen: (isOpen: boolean) => void;
  toggleAlertPanel: () => void;

  // Helper actions
  resetFilters: () => void;
  getAlertById: (alertId: string) => Alert | undefined;
  getUnreadCount: () => number;
  getCriticalCount: () => number;
  getAlertsByDevice: (deviceId: string) => Alert[];
  markAsRead: (alertId: string) => void;
  markAllAsRead: () => void;
  resolveAlert: (alertId: string, resolvedBy?: string) => void;
}

// Helper functions for sorting and filtering
const sortAlerts = (
  alerts: Alert[],
  sortBy: AlertSortBy,
  direction: 'asc' | 'desc'
): Alert[] => {
  return [...alerts].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'createdAt':
        comparison =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'severity':
        // Critical comes before Warning
        const severityOrder = { CRITICAL: 2, WARNING: 1 };
        comparison = severityOrder[a.severity] - severityOrder[b.severity];
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
      case 'device':
        comparison = a.device.name.localeCompare(b.device.name);
        break;
      default:
        comparison = 0;
    }

    return direction === 'desc' ? -comparison : comparison;
  });
};

const filterAlerts = (
  alerts: Alert[],
  filters: AlertStoreState['filters']
): Alert[] => {
  return alerts.filter((alert) => {
    // Status filter
    if (filters.status !== 'all') {
      switch (filters.status) {
        case 'unread':
          if (alert.isRead) return false;
          break;
        case 'critical':
          if (alert.severity !== 'CRITICAL') return false;
          break;
        case 'warning':
          if (alert.severity !== 'WARNING') return false;
          break;
        case 'resolved':
          if (!alert.isResolved) return false;
          break;
      }
    }

    // Device filter
    if (filters.deviceId && alert.deviceId !== filters.deviceId) {
      return false;
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesTitle = alert.title.toLowerCase().includes(searchLower);
      const matchesMessage = alert.message.toLowerCase().includes(searchLower);
      const matchesDevice = alert.device.name
        .toLowerCase()
        .includes(searchLower);
      const matchesLocation = alert.device.location
        .toLowerCase()
        .includes(searchLower);

      if (
        !matchesTitle &&
        !matchesMessage &&
        !matchesDevice &&
        !matchesLocation
      ) {
        return false;
      }
    }

    return true;
  });
};

// Create the store with persistence for UI state only
export const useAlertStore = create<AlertStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      alerts: [],
      selectedAlert: null,

      // UI State (these will be persisted)
      filters: {
        status: 'all' as AlertFilterStatus,
        search: '',
        deviceId: undefined,
      },
      sortBy: 'createdAt',
      sortDirection: 'desc',
      isAlertPanelOpen: false,

      // Actions
      setAlerts: (alerts) => set({ alerts }),

      addAlert: (alert) =>
        set((state) => ({
          alerts: state.alerts.some((existing) => existing.id === alert.id)
            ? state.alerts
            : [alert, ...state.alerts],
        })),

      updateAlert: (alertId, updates) =>
        set((state) => ({
          alerts: state.alerts.map((alert) =>
            alert.id === alertId ? { ...alert, ...updates } : alert
          ),
        })),

      removeAlert: (alertId) =>
        set((state) => ({
          alerts: state.alerts.filter((alert) => alert.id !== alertId),
        })),

      selectAlert: (alert) => set({ selectedAlert: alert }),

      // Filter and sort actions
      setStatusFilter: (status) =>
        set((state) => ({
          filters: { ...state.filters, status },
        })),

      setSearchFilter: (search) =>
        set((state) => ({
          filters: { ...state.filters, search },
        })),

      setDeviceFilter: (deviceId) =>
        set((state) => ({
          filters: { ...state.filters, deviceId },
        })),

      setSortBy: (sortBy) => set({ sortBy }),

      setSortDirection: (direction) => set({ sortDirection: direction }),

      // UI actions
      setAlertPanelOpen: (isOpen) => set({ isAlertPanelOpen: isOpen }),

      toggleAlertPanel: () =>
        set((state) => ({
          isAlertPanelOpen: !state.isAlertPanelOpen,
        })),

      // Helper actions
      resetFilters: () =>
        set({
          filters: {
            status: 'all' as AlertFilterStatus,
            search: '',
            deviceId: undefined,
          },
        }),

      getAlertById: (alertId) => {
        return get().alerts.find((alert) => alert.id === alertId);
      },

      getUnreadCount: () => {
        return get().alerts.filter((alert) => !alert.isRead).length;
      },

      getCriticalCount: () => {
        return get().alerts.filter(
          (alert) => alert.severity === 'CRITICAL' && !alert.isResolved
        ).length;
      },

      getAlertsByDevice: (deviceId) => {
        return get().alerts.filter((alert) => alert.deviceId === deviceId);
      },

      markAsRead: (alertId) =>
        set((state) => ({
          alerts: state.alerts.map((alert) =>
            alert.id === alertId ? { ...alert, isRead: true } : alert
          ),
        })),

      markAllAsRead: () =>
        set((state) => ({
          alerts: state.alerts.map((alert) => ({ ...alert, isRead: true })),
        })),

      resolveAlert: (alertId, resolvedBy) =>
        set((state) => ({
          alerts: state.alerts.map((alert) =>
            alert.id === alertId
              ? {
                  ...alert,
                  isResolved: true,
                  resolvedAt: new Date().toISOString(),
                  resolvedBy: resolvedBy || undefined,
                  isRead: true,
                }
              : alert
          ),
        })),
    }),
    {
      name: 'coldtrace-alert-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist UI state, not the alerts data
      partialize: (state) => ({
        filters: state.filters,
        sortBy: state.sortBy,
        sortDirection: state.sortDirection,
        isAlertPanelOpen: state.isAlertPanelOpen,
      }),
    }
  )
);

// Custom hook for filtered and sorted alerts
export const useFilteredAlerts = () => {
  const alerts = useAlertStore((state) => state.alerts);
  const filters = useAlertStore((state) => state.filters);
  const sortBy = useAlertStore((state) => state.sortBy);
  const sortDirection = useAlertStore((state) => state.sortDirection);

  return useMemo(() => {
    const filtered = filterAlerts(alerts, filters);
    return sortAlerts(filtered, sortBy, sortDirection);
  }, [alerts, filters, sortBy, sortDirection]);
};

// Custom hook for alert statistics
export const useAlertStats = () => {
  const alerts = useAlertStore((state) => state.alerts);

  return useMemo(() => {
    const total = alerts.length;
    const unread = alerts.filter((alert) => !alert.isRead).length;
    const critical = alerts.filter(
      (alert) => alert.severity === 'CRITICAL' && !alert.isResolved
    ).length;
    const unreadCritical = alerts.filter(
      (alert) =>
        alert.severity === 'CRITICAL' && !alert.isResolved && !alert.isRead
    ).length;
    const warning = alerts.filter(
      (alert) => alert.severity === 'WARNING' && !alert.isResolved
    ).length;
    const resolved = alerts.filter((alert) => alert.isResolved).length;

    const byType = alerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      unread,
      critical,
      unreadCritical,
      warning,
      resolved,
      byType,
    };
  }, [alerts]);
};

// Custom hook for device-specific alerts
export const useDeviceAlerts = (deviceId: string) => {
  const alerts = useAlertStore((state) => state.alerts);

  return useMemo(() => {
    return alerts.filter((alert) => alert.deviceId === deviceId);
  }, [alerts, deviceId]);
};
