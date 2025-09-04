'use client';

import { useQuery, useSubscription } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useState, useEffect, useCallback } from 'react';
import { DeviceCard } from './DeviceCard';
import {
  useDeviceStore,
  useFilteredDevices,
  useDeviceView,
} from '@/store/useDeviceStore';
import { useAlertStore } from '@/store/useAlertStore';

// GraphQL Queries
const GET_DEVICES = gql`
  query GetDevices($limit: Int) {
    getDevices(limit: $limit) {
      id
      deviceId
      name
      location
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

// Proper WebSocket event types
type WebSocketEvent = CustomEvent<{
  message?: string;
  code?: number;
  wasClean?: boolean;
}>;

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
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [wsError, setWsError] = useState<string | null>(null);

  // Zustand stores
  const filteredDevices = useFilteredDevices();
  const view = useDeviceView();
  const { setDevices, updateDeviceReading, updateDeviceStatus, setView } =
    useDeviceStore();
  const { addAlert, alerts } = useAlertStore();

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

  // Monitor WebSocket connection status with enhanced debugging
  useEffect(() => {
    const handleWSConnected = () => {
      console.log(
        '✅ DeviceGrid: WebSocket connected, subscriptions will activate'
      );
      console.log('   - Switching to low-frequency polling (10 minutes)');
      console.log('   - Temperature and device status subscriptions active');
      setWsConnected(true);
      setWsError(null);
    };

    const handleWSError = (event: WebSocketEvent) => {
      console.error(
        '❌ DeviceGrid: WebSocket error, falling back to HTTP polling'
      );
      console.error('   - Error details:', event.detail);
      console.error('   - Switching to high-frequency polling (30 seconds)');
      setWsConnected(false);
      setWsError(event.detail?.message || 'WebSocket connection failed');
    };

    const handleWSClosed = (event: WebSocketEvent) => {
      const closeEvent = event.detail;
      console.warn(
        '🔌 DeviceGrid: WebSocket closed, falling back to HTTP polling'
      );
      console.warn('   - Close code:', closeEvent?.code);
      console.warn('   - Was clean:', closeEvent?.wasClean);
      console.warn('   - Switching to high-frequency polling (30 seconds)');
      setWsConnected(false);
      if (closeEvent && !closeEvent.wasClean) {
        setWsError(`Connection lost (Code: ${closeEvent.code})`);
      }
    };

    const handleWSConnecting = () => {
      console.log('🔄 DeviceGrid: WebSocket connecting...');
    };

    // Set initial state from window global and log current state
    if (typeof window !== 'undefined') {
      const isConnected = !!window.__GRAPHQL_WS_CONNECTED__;
      console.log(
        '🔍 DeviceGrid: Initial WebSocket state:',
        isConnected ? 'connected' : 'disconnected'
      );
      setWsConnected(isConnected);
    }

    // Listen for connection events
    window.addEventListener('graphql-ws-connected', handleWSConnected);
    window.addEventListener('graphql-ws-error', handleWSError as EventListener);
    window.addEventListener(
      'graphql-ws-closed',
      handleWSClosed as EventListener
    );
    window.addEventListener('graphql-ws-connecting', handleWSConnecting);

    return () => {
      window.removeEventListener('graphql-ws-connected', handleWSConnected);
      window.removeEventListener(
        'graphql-ws-error',
        handleWSError as EventListener
      );
      window.removeEventListener(
        'graphql-ws-closed',
        handleWSClosed as EventListener
      );
      window.removeEventListener('graphql-ws-connecting', handleWSConnecting);
    };
  }, []);

  // Query for devices with much less frequent polling when WebSocket is connected
  const { loading, error, data, refetch } = useQuery(GET_DEVICES, {
    variables: { limit: 20 },
    // Much less frequent polling when WebSocket is working
    pollInterval: wsConnected ? 600000 : 30000, // 10 min when WS connected, 30 sec when not
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
  });

  // Sync GraphQL data with Zustand store and check for battery alerts with deduplication
  useEffect(() => {
    if ((data as GetDevicesData)?.getDevices) {
      const devices = (data as GetDevicesData).getDevices;
      setDevices(devices);

      // Check for low battery alerts on initial load with deduplication
      console.log('Devices loaded, checking for alerts:', devices.length);
      devices.forEach((device) => {
        // Check for existing battery alert to prevent duplicates
        const existingBatteryAlert = alerts.find(
          (alert) =>
            alert.deviceId === device.id &&
            alert.type === 'BATTERY' &&
            !alert.acknowledged
        );

        if (
          !existingBatteryAlert &&
          device.battery <= 20 &&
          device.status === 'ONLINE'
        ) {
          console.log(
            'Generating battery alert for device:',
            device.name,
            'Battery:',
            device.battery
          );
          addAlert({
            deviceId: device.id,
            deviceName: device.name,
            location: device.location,
            severity: device.battery <= 10 ? 'CRITICAL' : 'WARNING',
            type: 'BATTERY',
            message: `Battery low: ${device.battery}%`,
            details: `Device battery level is ${device.battery}%. Consider replacing or recharging soon.`,
            timestamp: new Date().toISOString(),
          });
        }

        // Check for offline device alerts with deduplication
        const existingConnectionAlert = alerts.find(
          (alert) =>
            alert.deviceId === device.id &&
            alert.type === 'CONNECTION' &&
            !alert.acknowledged
        );

        if (!existingConnectionAlert && device.status === 'OFFLINE') {
          addAlert({
            deviceId: device.id,
            deviceName: device.name,
            location: device.location,
            severity: 'WARNING',
            type: 'CONNECTION',
            message: 'Device offline',
            details: 'Device has lost connection and is not reporting data.',
            timestamp: new Date().toISOString(),
          });
        }
      });
    }
  }, [data, setDevices, addAlert, alerts]);

  // Log subscription status changes
  useEffect(() => {
    if (wsConnected) {
      console.log('🔔 DeviceGrid: Subscriptions ACTIVATED');
      console.log('   - temperatureUpdates subscription: ACTIVE');
      console.log('   - deviceStatusChanged subscription: ACTIVE');
      console.log('   - HTTP polling reduced to 10 minutes');
    } else {
      console.log('⏸️ DeviceGrid: Subscriptions SKIPPED');
      console.log('   - temperatureUpdates subscription: SKIPPED');
      console.log('   - deviceStatusChanged subscription: SKIPPED');
      console.log('   - HTTP polling increased to 30 seconds');
    }
  }, [wsConnected]);

  // Subscribe to temperature updates - always attempt connection to establish WebSocket
  useSubscription(TEMPERATURE_UPDATES, {
    skip: false, // Always try to connect - this will trigger WebSocket connection
    onData: ({ data: subscriptionData }) => {
      console.log(
        '🌡️ DeviceGrid: Temperature update received via WebSocket:',
        subscriptionData
      );
      if (
        (subscriptionData as unknown as TemperatureUpdatesData)
          ?.temperatureUpdates
      ) {
        const reading = (subscriptionData as unknown as TemperatureUpdatesData)
          .temperatureUpdates;
        const deviceId = reading.device.id;

        // Update store with new reading
        updateDeviceReading(deviceId, {
          temperature: reading.temperature,
          status: reading.status,
          timestamp: reading.timestamp,
        });

        // Generate alerts based on temperature reading with null safety
        const device = filteredDevices.find((d) => d.id === deviceId);
        console.log('Temperature update received:', {
          deviceId,
          reading,
          device: device?.name,
        });

        if (device && reading.status !== 'NORMAL') {
          console.log('Generating alert for temperature violation:', {
            device: device.name,
            temperature: reading.temperature,
            status: reading.status,
          });
          const severity =
            reading.status === 'CRITICAL' ? 'CRITICAL' : 'WARNING';
          let message = '';
          let details = '';

          if (reading.temperature < 2) {
            message = `Temperature too low: ${reading.temperature.toFixed(
              1
            )}°C`;
            details = 'Temperature has dropped below the safe minimum of 2°C';
          } else if (reading.temperature > 8) {
            message = `Temperature too high: ${reading.temperature.toFixed(
              1
            )}°C`;
            details = 'Temperature has exceeded the safe maximum of 8°C';
          } else {
            message = `Temperature warning: ${reading.temperature.toFixed(
              1
            )}°C`;
            details = 'Temperature is approaching critical thresholds';
          }

          addAlert({
            deviceId: device.id,
            deviceName: device.name,
            location: device.location,
            severity,
            type: 'TEMPERATURE',
            message,
            details,
            timestamp: reading.timestamp,
          });
        }

        // Flash the updated device using optimized function
        updateDeviceWithFlash(deviceId);
      }
    },
    onError: (error: ApolloError) => {
      console.error('❌ DeviceGrid: Temperature subscription error:', error);
      console.error('   - This indicates WebSocket subscription is failing');
      console.error('   - Error name:', error.name);
      console.error('   - Error message:', error.message);
      console.error('   - Error stack:', error.stack);
      console.error('   - GraphQL errors:', error.graphQLErrors);
      console.error('   - Network error:', error.networkError);
      console.error('   - Will rely on HTTP polling for updates');

      // Improved error handling with specific error types
      if (error.networkError) {
        setWsError('Network connection failed');
      } else if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        setWsError(
          `GraphQL error: ${
            error.graphQLErrors[0]?.message || 'Unknown GraphQL error'
          }`
        );
      } else {
        setWsError(`Temperature subscription error: ${error.message}`);
      }
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

        // Update store with new status
        updateDeviceStatus(device.id, device.status, device.isActive);

        // Flash the updated device using optimized function
        updateDeviceWithFlash(device.id);
      }
    },
    onError: (error: ApolloError) => {
      console.error('❌ DeviceGrid: Device status subscription error:', error);
      console.error('   - Error name:', error.name);
      console.error('   - Error message:', error.message);
      console.error('   - Error stack:', error.stack);
      console.error('   - GraphQL errors:', error.graphQLErrors);
      console.error('   - Network error:', error.networkError);

      // Improved error handling with specific error types
      if (error.networkError) {
        setWsError('Network connection failed');
      } else if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        setWsError(
          `GraphQL error: ${
            error.graphQLErrors[0]?.message || 'Unknown GraphQL error'
          }`
        );
      } else {
        setWsError(`Device subscription error: ${error.message}`);
      }
    },
  });

  // No additional fallback polling needed - the main query already handles this

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
        <div className="flex items-center justify-center space-x-4 mb-2">
          {/* Connection Status */}
          <div className="flex items-center space-x-1">
            {wsConnected ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 font-medium">
                  Real-time Active
                </span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-orange-600 font-medium">
                  {wsError ? 'Using HTTP Fallback' : 'Connecting...'}
                </span>
              </>
            )}
          </div>
        </div>

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
          {wsConnected ? (
            <span className="text-green-600 ml-2">
              • WebSocket Mode (Polling: 10min)
            </span>
          ) : (
            <span className="text-orange-600 ml-2">
              • HTTP Mode (Polling: 30sec)
            </span>
          )}
          {wsError && <span className="text-red-500 ml-2">• {wsError}</span>}
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
    </div>
  );
}
