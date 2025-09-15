'use client';

import { useQuery, useSubscription } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useState, useEffect, useCallback } from 'react';
import { DeviceCard } from './DeviceCard';
import { DeviceDetailModal } from './DeviceDetailModal';
import {
  useDeviceStore,
  useFilteredDevices,
  useDeviceView,
} from '@/store/useDeviceStore';

// GraphQL Queries
const GET_DEVICES = gql`
  query GetDevices($limit: Int) {
    getDevices(limit: $limit) {
      id
      deviceId
      name
      location
      latitude
      longitude
      battery
      status
      isActive
      latestReading {
        temperature
        status
        timestamp
      }
    }
  }
`;

// GraphQL Subscriptions
const TEMPERATURE_UPDATES = gql`
  subscription TemperatureUpdates {
    temperatureUpdates {
      id
      deviceId
      temperature
      status
      timestamp
      device {
        id
        name
      }
    }
  }
`;

const DEVICE_STATUS_CHANGED = gql`
  subscription DeviceStatusChanged {
    deviceStatusChanged {
      id
      deviceId
      name
      status
      isActive
    }
  }
`;

interface Device {
  id: string;
  deviceId: string;
  name: string;
  location: string;
  latitude?: number;
  longitude?: number;
  battery: number;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  isActive: boolean;
  latestReading?: {
    temperature: number;
    status: 'NORMAL' | 'WARNING' | 'CRITICAL';
    timestamp: string;
  };
}

interface TemperatureUpdatesData {
  temperatureUpdates: {
    id: string;
    deviceId: string;
    temperature: number;
    status: 'NORMAL' | 'WARNING' | 'CRITICAL';
    timestamp: string;
    device: {
      id: string;
      name: string;
    };
  };
}

interface DeviceStatusChangedData {
  deviceStatusChanged: {
    id: string;
    deviceId: string;
    name: string;
    status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
    isActive: boolean;
  };
}

interface GetDevicesData {
  getDevices: Device[];
}

// Proper error types for Apollo Client
interface ApolloError {
  name: string;
  message: string;
  stack?: string;
  graphQLErrors?: Array<{ message: string }>;
  networkError?: Error;
}

export function DeviceGrid() {
  const [updatingDevices, setUpdatingDevices] = useState<Set<string>>(
    new Set()
  );
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [wsConnected, setWsConnected] = useState(false);
  const [subscriptionErrors, setSubscriptionErrors] = useState<number>(0);

  // Zustand stores
  const filteredDevices = useFilteredDevices();
  const view = useDeviceView();
  const { setDevices, updateDeviceReading, updateDeviceStatus, setView } =
    useDeviceStore();

  // Modal handlers
  const handleDeviceClick = useCallback((device: Device) => {
    setSelectedDevice(device);
    setIsModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedDevice(null);
  }, []);

  // Optimized state update function with useCallback
  const updateDeviceWithFlash = useCallback((deviceId: string) => {
    setUpdatingDevices((prev) => new Set(prev).add(deviceId));
    setLastUpdate(new Date());

    setTimeout(() => {
      setUpdatingDevices((prev) => {
        const newSet = new Set(prev);
        newSet.delete(deviceId);
        return newSet;
      });
    }, 2000);
  }, []);

  // WebSocket connection monitoring
  useEffect(() => {
    const handleWSConnected = () => {
      console.log('✅ DeviceGrid: WebSocket connected');
      setWsConnected(true);
      setSubscriptionErrors(0);
    };

    const handleWSError = () => {
      console.log('❌ DeviceGrid: WebSocket error detected');
      setWsConnected(false);
    };

    const handleWSClosed = () => {
      console.log('🔌 DeviceGrid: WebSocket connection closed');
      setWsConnected(false);
    };

    // Listen for custom WebSocket events
    window.addEventListener('graphql-ws-connected', handleWSConnected);
    window.addEventListener('graphql-ws-error', handleWSError);
    window.addEventListener('graphql-ws-closed', handleWSClosed);

    return () => {
      window.removeEventListener('graphql-ws-connected', handleWSConnected);
      window.removeEventListener('graphql-ws-error', handleWSError);
      window.removeEventListener('graphql-ws-closed', handleWSClosed);
    };
  }, []);

  // Query for devices with conditional polling - only poll when WebSocket is down
  const { loading, error, data, refetch } = useQuery(GET_DEVICES, {
    variables: { limit: 20 },
    pollInterval: wsConnected
      ? 0
      : Math.min(60000, 30000 + subscriptionErrors * 10000), // No polling when WS connected, exponential backoff when not
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
  });

  // Sync GraphQL data with Zustand store
  useEffect(() => {
    if ((data as GetDevicesData)?.getDevices) {
      const devices = (data as GetDevicesData).getDevices;
      setDevices(devices);
      setLastUpdate(new Date()); // Update timestamp when new data is loaded
    }
  }, [data, setDevices]);

  // Subscribe to temperature updates - always attempt connection to establish WebSocket
  useSubscription(TEMPERATURE_UPDATES, {
    skip: false, // Always try to connect - this will trigger WebSocket connection
    onData: ({ data: subscriptionData }) => {
      if (
        (subscriptionData as unknown as TemperatureUpdatesData)
          ?.temperatureUpdates
      ) {
        const reading = (subscriptionData as unknown as TemperatureUpdatesData)
          .temperatureUpdates;
        const deviceId = reading.device.id;

        // Mark WebSocket as working when we receive data
        if (!wsConnected) {
          console.log(
            '✅ DeviceGrid: WebSocket working - received temperature update'
          );
          setWsConnected(true);
          setSubscriptionErrors(0);
        }

        // Update store with new reading
        updateDeviceReading(deviceId, {
          temperature: reading.temperature,
          status: reading.status,
          timestamp: reading.timestamp,
        });

        // Flash the updated device using optimized function
        updateDeviceWithFlash(deviceId);
      }
    },
    onError: (error: ApolloError) => {
      console.error('❌ DeviceGrid: Temperature subscription error:', error);
      setWsConnected(false);
      setSubscriptionErrors((prev) => prev + 1);
      console.error(
        '   - WebSocket subscription failed, will use HTTP polling fallback'
      );
      console.error('   - Error details:', error.message);
    },
  });

  // Subscribe to device status changes - always attempt connection to establish WebSocket
  useSubscription(DEVICE_STATUS_CHANGED, {
    skip: false, // Always try to connect - this will trigger WebSocket connection
    onData: ({ data: subscriptionData }) => {
      if (
        (subscriptionData as unknown as DeviceStatusChangedData)
          ?.deviceStatusChanged
      ) {
        const device = (subscriptionData as unknown as DeviceStatusChangedData)
          .deviceStatusChanged;

        // Mark WebSocket as working when we receive data
        if (!wsConnected) {
          console.log(
            '✅ DeviceGrid: WebSocket working - received device status update'
          );
          setWsConnected(true);
          setSubscriptionErrors(0);
        }

        // Update store with new status
        updateDeviceStatus(device.id, device.status, device.isActive);

        // Flash the updated device using optimized function
        updateDeviceWithFlash(device.id);
      }
    },
    onError: (error: ApolloError) => {
      console.error('❌ DeviceGrid: Device status subscription error:', error);
      setWsConnected(false);
      setSubscriptionErrors((prev) => prev + 1);
      console.error(
        '   - WebSocket subscription failed, will use HTTP polling fallback'
      );
    },
  });

  // Conditional polling is handled by the main query based on WebSocket connection status

  // Loading skeleton
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6 animate-pulse"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <div className="w-16 h-4 bg-gray-300 rounded"></div>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-5 h-5 bg-gray-300 rounded"></div>
                  <div className="w-10 h-4 bg-gray-300 rounded"></div>
                </div>
              </div>
              <div className="mb-4">
                <div className="w-32 h-6 bg-gray-300 rounded mb-2"></div>
                <div className="w-24 h-4 bg-gray-200 rounded mb-1"></div>
                <div className="w-20 h-3 bg-gray-200 rounded"></div>
              </div>
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-300 rounded"></div>
                    <div>
                      <div className="w-16 h-8 bg-gray-300 rounded mb-1"></div>
                      <div className="w-12 h-3 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            Failed to Load Devices
          </h3>
          <p className="text-gray-600 mb-4">
            Unable to connect to the monitoring system. Please check your
            connection.
          </p>
          <button
            onClick={() => refetch()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Use filtered devices from store
  const devices = filteredDevices;

  // Empty state - only check if not loading and no devices in store
  if (!loading && devices.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.75 0-5.117 1.39-6.522 3.5m13.044 0A7.962 7.962 0 0112 15c-2.75 0-5.117 1.39-6.522 3.5"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            No Devices Found
          </h3>
          <p className="text-gray-600 mb-4">
            No monitoring devices are currently registered in the system.
          </p>
          <button
            onClick={() => refetch()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Stats Summary */}
      <div className="mb-6 text-center">
        <p className="text-sm text-gray-600">
          Monitoring{' '}
          <span className="font-semibold text-slate-900">{devices.length}</span>{' '}
          devices
          {devices.filter((d) => d.status === 'ONLINE').length > 0 && (
            <>
              {' • '}
              <span className="font-semibold text-green-600">
                {devices.filter((d) => d.status === 'ONLINE').length} online
              </span>
            </>
          )}
          {updatingDevices.size > 0 && (
            <>
              {' • '}
              <span className="font-semibold text-blue-600 animate-pulse">
                Live updates active
              </span>
            </>
          )}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Last updated: {lastUpdate.toLocaleTimeString()}
          {' • '}
          <span
            className={`font-medium ${
              wsConnected ? 'text-green-600' : 'text-orange-600'
            }`}
          >
            {wsConnected ? '🔗 Real-time' : '📡 Polling'}
          </span>
          {subscriptionErrors > 0 && (
            <span className="text-red-500 ml-1">
              (⚠️ {subscriptionErrors} errors)
            </span>
          )}
        </p>
      </div>

      {/* Device Grid/List */}
      {view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {devices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              isUpdating={updatingDevices.has(device.id)}
              onClick={() => handleDeviceClick(device)}
            />
          ))}
        </div>
      ) : view === 'list' ? (
        <div className="space-y-4">
          {devices.map((device) => (
            <div
              key={device.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <DeviceCard
                device={device}
                isUpdating={updatingDevices.has(device.id)}
                onClick={() => handleDeviceClick(device)}
              />
            </div>
          ))}
        </div>
      ) : (
        // Map view placeholder
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-4">
            <span className="text-4xl">🗺️</span>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            Map View Coming Soon
          </h3>
          <p className="text-gray-600 mb-4">
            Geographic device visualization will be available in a future
            update.
          </p>
          <button
            onClick={() => setView('grid')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Switch to Grid View
          </button>
        </div>
      )}

      {/* Device Detail Modal */}
      <DeviceDetailModal
        device={selectedDevice}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
}
