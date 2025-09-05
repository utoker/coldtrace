'use client';

import { useQuery, useSubscription } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useState, useEffect } from 'react';

const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    getDevices {
      id
      status
      isActive
      battery
      latestReading {
        temperature
        status
        timestamp
      }
    }
    getActiveAlerts {
      id
      severity
      type
      acknowledged
    }
  }
`;

// Add subscriptions for real-time updates
const TEMPERATURE_UPDATES = gql`
  subscription TemperatureUpdates {
    temperatureUpdates {
      deviceId
      temperature
      status
      timestamp
    }
  }
`;

const NEW_ALERTS = gql`
  subscription NewAlerts {
    newAlerts {
      id
      deviceId
      severity
      type
      acknowledged
    }
  }
`;

interface Device {
  id: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  isActive: boolean;
  battery: number;
  latestReading?: {
    temperature: number;
    status: 'NORMAL' | 'WARNING' | 'CRITICAL';
    timestamp: string;
  };
}

interface Alert {
  id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: string;
  acknowledged: boolean;
}

interface DashboardStatsData {
  getDevices: Device[];
  getActiveAlerts: Alert[];
}

export function DashboardStats() {
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  // Monitor WebSocket connection status
  useEffect(() => {
    const handleWSConnected = () => setWsConnected(true);
    const handleWSError = () => setWsConnected(false);
    const handleWSClosed = () => setWsConnected(false);

    // Set initial state from window global
    if (typeof window !== 'undefined') {
      setWsConnected(!!window.__GRAPHQL_WS_CONNECTED__);
    }

    // Listen for connection events
    window.addEventListener('graphql-ws-connected', handleWSConnected);
    window.addEventListener('graphql-ws-error', handleWSError);
    window.addEventListener('graphql-ws-closed', handleWSClosed);

    return () => {
      window.removeEventListener('graphql-ws-connected', handleWSConnected);
      window.removeEventListener('graphql-ws-error', handleWSError);
      window.removeEventListener('graphql-ws-closed', handleWSClosed);
    };
  }, []);

  // Query with adaptive polling - much less frequent when WebSocket is connected
  const { loading, error, data, refetch } = useQuery(GET_DASHBOARD_STATS, {
    pollInterval: wsConnected ? 300000 : 60000, // 5 min when WS connected, 1 min when not
    errorPolicy: 'all',
  });

  // Subscribe to real-time updates - always attempt connection to establish WebSocket
  useSubscription(TEMPERATURE_UPDATES, {
    skip: false, // Always try to connect - this will trigger WebSocket connection
    onData: ({ data }) => {
      // Refetch dashboard stats when temperature updates occur
      refetch();
    },
    onError: (error) => {
      console.error(
        '❌ DashboardStats: Temperature subscription error:',
        error
      );
      // Don't set wsConnected to false here - let the connection events handle it
    },
  });

  useSubscription(NEW_ALERTS, {
    skip: false, // Always try to connect - this will trigger WebSocket connection
    onData: ({ data }) => {
      // Refetch dashboard stats when new alerts occur
      refetch();
    },
    onError: (error) => {
      console.error('❌ DashboardStats: Alert subscription error:', error);
      // Don't set wsConnected to false here - let the connection events handle it
    },
  });

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md p-6 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="w-16 h-4 bg-gray-300 rounded mb-2"></div>
                <div className="w-12 h-8 bg-gray-300 rounded"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-700">Unable to load dashboard statistics</p>
        </div>
      </div>
    );
  }

  const devices: Device[] = (data as DashboardStatsData)?.getDevices || [];
  const alerts: Alert[] = (data as DashboardStatsData)?.getActiveAlerts || [];

  // Calculate statistics
  const totalDevices = devices.length;
  const onlineDevices = devices.filter((d) => d.status === 'ONLINE').length;
  const offlineDevices = devices.filter((d) => d.status === 'OFFLINE').length;
  const maintenanceDevices = devices.filter(
    (d) => d.status === 'MAINTENANCE'
  ).length;

  const devicesWithReadings = devices.filter((d) => d.latestReading);
  const inRangeDevices = devicesWithReadings.filter(
    (d) =>
      d.latestReading &&
      d.latestReading.temperature >= 2 &&
      d.latestReading.temperature <= 8
  ).length;

  const criticalAlerts = alerts.filter(
    (a) => a.severity === 'CRITICAL' && !a.acknowledged
  ).length;
  const totalUnacknowledgedAlerts = alerts.filter(
    (a) => !a.acknowledged
  ).length;

  const averageTemperature =
    devicesWithReadings.length > 0
      ? devicesWithReadings.reduce(
          (sum, d) => sum + (d.latestReading?.temperature || 0),
          0
        ) / devicesWithReadings.length
      : 0;

  const averageBattery =
    devices.length > 0
      ? devices.reduce((sum, d) => sum + d.battery, 0) / devices.length
      : 0;

  const stats = [
    {
      title: 'Total Devices',
      value: totalDevices,
      subtitle: `${onlineDevices} online, ${offlineDevices} offline`,
      icon: '📱',
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-200',
    },
    {
      title: 'Temperature Status',
      value: `${inRangeDevices}/${devicesWithReadings.length}`,
      subtitle: `${averageTemperature.toFixed(1)}°C avg`,
      icon: '🌡️',
      color: inRangeDevices === devicesWithReadings.length ? 'green' : 'yellow',
      bgColor:
        inRangeDevices === devicesWithReadings.length
          ? 'bg-green-50'
          : 'bg-yellow-50',
      textColor:
        inRangeDevices === devicesWithReadings.length
          ? 'text-green-600'
          : 'text-yellow-600',
      borderColor:
        inRangeDevices === devicesWithReadings.length
          ? 'border-green-200'
          : 'border-yellow-200',
    },
    {
      title: 'Active Alerts',
      value: totalUnacknowledgedAlerts,
      subtitle:
        criticalAlerts > 0 ? `${criticalAlerts} critical` : 'All handled',
      icon: criticalAlerts > 0 ? '🚨' : '✅',
      color:
        criticalAlerts > 0
          ? 'red'
          : totalUnacknowledgedAlerts > 0
          ? 'yellow'
          : 'green',
      bgColor:
        criticalAlerts > 0
          ? 'bg-red-50'
          : totalUnacknowledgedAlerts > 0
          ? 'bg-yellow-50'
          : 'bg-green-50',
      textColor:
        criticalAlerts > 0
          ? 'text-red-600'
          : totalUnacknowledgedAlerts > 0
          ? 'text-yellow-600'
          : 'text-green-600',
      borderColor:
        criticalAlerts > 0
          ? 'border-red-200'
          : totalUnacknowledgedAlerts > 0
          ? 'border-yellow-200'
          : 'border-green-200',
    },
    {
      title: 'System Health',
      value: `${Math.round(averageBattery)}%`,
      subtitle: `Battery average`,
      icon: averageBattery > 50 ? '🔋' : averageBattery > 20 ? '🪫' : '⚠️',
      color:
        averageBattery > 50 ? 'green' : averageBattery > 20 ? 'yellow' : 'red',
      bgColor:
        averageBattery > 50
          ? 'bg-green-50'
          : averageBattery > 20
          ? 'bg-yellow-50'
          : 'bg-red-50',
      textColor:
        averageBattery > 50
          ? 'text-green-600'
          : averageBattery > 20
          ? 'text-yellow-600'
          : 'text-red-600',
      borderColor:
        averageBattery > 50
          ? 'border-green-200'
          : averageBattery > 20
          ? 'border-yellow-200'
          : 'border-red-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`${stat.bgColor} ${stat.borderColor} border rounded-lg shadow-sm hover:shadow-md transition-shadow p-6`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                {stat.title}
              </p>
              <p className={`text-2xl font-bold ${stat.textColor} mb-1`}>
                {stat.value}
              </p>
              <p className="text-xs text-gray-500">{stat.subtitle}</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-sm">
              <span className="text-2xl">{stat.icon}</span>
            </div>
          </div>

          {/* Status indicators */}
          {index === 0 && ( // Device status breakdown
            <div className="mt-4 flex space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">{onlineDevices} online</span>
              </div>
              {offlineDevices > 0 && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-gray-600">
                    {offlineDevices} offline
                  </span>
                </div>
              )}
              {maintenanceDevices > 0 && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-gray-600">
                    {maintenanceDevices} maintenance
                  </span>
                </div>
              )}
            </div>
          )}

          {index === 1 &&
            devicesWithReadings.length > 0 && ( // Temperature range indicator
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        (inRangeDevices / devicesWithReadings.length) * 100
                      }%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round(
                    (inRangeDevices / devicesWithReadings.length) * 100
                  )}
                  % in optimal range
                </p>
              </div>
            )}
        </div>
      ))}
    </div>
  );
}
