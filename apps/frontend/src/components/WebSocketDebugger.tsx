'use client';

import { useState, useEffect } from 'react';
import { useSubscription } from '@apollo/client/react';
import { gql } from '@apollo/client';

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

const PING_SUBSCRIPTION = gql`
  subscription PingTest {
    ping
  }
`;

// Proper types for WebSocket debugger
interface UpdateEvent {
  timestamp: string;
  type: 'ping' | 'error' | 'temperature' | 'status' | 'connection';
  message: string;
  deviceName?: string;
  temperature?: number;
  status?: string;
}

// Extend window interface for global WebSocket status
declare global {
  interface Window {
    __GRAPHQL_WS_CONNECTED__?: boolean;
  }
}

export function WebSocketDebugger() {
  const [isVisible, setIsVisible] = useState(false);
  const [updates, setUpdates] = useState<UpdateEvent[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'connecting' | 'connected' | 'error'
  >('disconnected');
  const [lastPing, setLastPing] = useState<Date | null>(null);

  // Monitor global WebSocket connection status
  useEffect(() => {
    const checkConnectionStatus = () => {
      const connected = window.__GRAPHQL_WS_CONNECTED__;
      setConnectionStatus(connected ? 'connected' : 'disconnected');
    };

    const handleWSConnected = () => {
      setConnectionStatus('connected');
      addUpdate('connection', 'WebSocket connected successfully');
    };

    const handleWSError = (event: CustomEvent) => {
      setConnectionStatus('error');
      addUpdate(
        'error',
        `WebSocket error: ${event.detail?.message || 'Unknown error'}`
      );
    };

    const handleWSClosed = () => {
      setConnectionStatus('disconnected');
      addUpdate('error', 'WebSocket connection closed');
    };

    const handleWSConnecting = () => {
      setConnectionStatus('connecting');
      addUpdate('connection', 'WebSocket connecting...');
    };

    // Initial check
    checkConnectionStatus();

    // Listen for connection events
    window.addEventListener('graphql-ws-connected', handleWSConnected);
    window.addEventListener('graphql-ws-error', handleWSError as EventListener);
    window.addEventListener('graphql-ws-closed', handleWSClosed);
    window.addEventListener('graphql-ws-connecting', handleWSConnecting);

    return () => {
      window.removeEventListener('graphql-ws-connected', handleWSConnected);
      window.removeEventListener(
        'graphql-ws-error',
        handleWSError as EventListener
      );
      window.removeEventListener('graphql-ws-closed', handleWSClosed);
      window.removeEventListener('graphql-ws-connecting', handleWSConnecting);
    };
  }, []);

  const addUpdate = (
    type: UpdateEvent['type'],
    message: string,
    deviceName?: string,
    temperature?: number,
    status?: string
  ) => {
    const update: UpdateEvent = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      deviceName,
      temperature,
      status,
    };
    setUpdates((prev) => [update, ...prev.slice(0, 49)]); // Keep last 50 updates
  };

  // Subscribe to temperature updates
  useSubscription(TEMPERATURE_UPDATES, {
    skip: false,
    onData: ({ data }) => {
      if (data?.temperatureUpdates) {
        const reading = data.temperatureUpdates;
        addUpdate(
          'temperature',
          `Temperature update: ${reading.temperature}°C (${reading.status})`,
          reading.device.name,
          reading.temperature,
          reading.status
        );
      }
    },
    onError: (error) => {
      addUpdate('error', `Temperature subscription error: ${error.message}`);
    },
  });

  // Subscribe to device status changes
  useSubscription(DEVICE_STATUS_CHANGED, {
    skip: false,
    onData: ({ data }) => {
      if (data?.deviceStatusChanged) {
        const device = data.deviceStatusChanged;
        addUpdate(
          'status',
          `Status changed: ${device.status} (Active: ${device.isActive})`,
          device.name,
          undefined,
          device.status
        );
      }
    },
    onError: (error) => {
      addUpdate('error', `Status subscription error: ${error.message}`);
    },
  });

  // Subscribe to ping for basic connectivity test
  useSubscription(PING_SUBSCRIPTION, {
    skip: false,
    onData: ({ data }) => {
      if (data?.ping) {
        setLastPing(new Date());
        addUpdate('ping', `Ping: ${data.ping}`);
      }
    },
    onError: (error) => {
      addUpdate('error', `Ping subscription error: ${error.message}`);
    },
  });

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-600';
      case 'connecting':
        return 'bg-yellow-600';
      case 'error':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getUpdateIcon = (type: UpdateEvent['type']) => {
    switch (type) {
      case 'temperature':
        return '🌡️';
      case 'status':
        return '🔄';
      case 'ping':
        return '📡';
      case 'error':
        return '❌';
      default:
        return '💡';
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className={`fixed bottom-4 left-4 ${getStatusColor()} text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg hover:opacity-80 transition-opacity`}
        title="WebSocket Debug Console"
      >
        🔌 WS: {connectionStatus.toUpperCase()}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 w-96 max-h-96 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl text-white overflow-hidden">
      {/* Header */}
      <div
        className={`${getStatusColor()} px-4 py-2 flex justify-between items-center`}
      >
        <div className="flex items-center space-x-2">
          <span className="font-medium">WebSocket Debug</span>
          <span className="text-xs opacity-80">({updates.length} events)</span>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-white hover:bg-black hover:bg-opacity-20 rounded px-2 py-1 text-xs"
        >
          ✕
        </button>
      </div>

      {/* Status */}
      <div className="px-4 py-2 bg-gray-800 text-xs border-b border-gray-700">
        <div className="flex justify-between">
          <span>
            Status: <span className="font-mono">{connectionStatus}</span>
          </span>
          {lastPing && (
            <span>
              Last ping:{' '}
              <span className="font-mono">{lastPing.toLocaleTimeString()}</span>
            </span>
          )}
        </div>
      </div>

      {/* Updates */}
      <div className="max-h-64 overflow-y-auto">
        {updates.length === 0 ? (
          <div className="p-4 text-gray-400 text-center text-sm">
            Waiting for WebSocket events...
          </div>
        ) : (
          updates.map((update, index) => (
            <div
              key={index}
              className={`px-4 py-2 text-xs border-b border-gray-800 hover:bg-gray-800 ${
                update.type === 'error' ? 'bg-red-900 bg-opacity-20' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <span className="mr-2">{getUpdateIcon(update.type)}</span>
                  <span className="text-gray-300">{update.message}</span>
                  {update.deviceName && (
                    <div className="text-gray-400 mt-1">
                      Device: {update.deviceName}
                    </div>
                  )}
                </div>
                <span className="text-gray-500 text-xs ml-2">
                  {update.timestamp}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-2 bg-gray-800 border-t border-gray-700">
        <button
          onClick={() => setUpdates([])}
          className="text-xs text-gray-400 hover:text-white"
        >
          Clear History
        </button>
      </div>
    </div>
  );
}
