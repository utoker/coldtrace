'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQuery, useSubscription } from '@apollo/client/react';
import { gql } from '@apollo/client';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';

interface Device {
  id: string;
  deviceId: string;
  name: string;
  location: string;
  battery: number;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  isActive: boolean;
  minTemp?: number;
  maxTemp?: number;
  latestReading?: {
    temperature: number;
    status: 'NORMAL' | 'WARNING' | 'CRITICAL';
    timestamp: string;
  };
}

interface Reading {
  id: string;
  deviceId: string;
  temperature: number;
  battery?: number;
  status: string;
  timestamp: string;
}

interface DeviceHistoryData {
  getDeviceHistory: {
    deviceId: string;
    readings: Reading[];
    totalCount: number;
    timeRange: {
      startTime: string;
      endTime: string;
      duration: string;
    };
  };
}

interface DeviceStatsData {
  getDeviceStats: {
    deviceId: string;
    readingCount: number;
    temperatureStats: {
      min: number;
      max: number;
      avg: number;
      current?: number;
    };
    complianceRate: number;
    lastReading?: Reading;
  };
}

interface DeviceDetailModalProps {
  device: Device | null;
  isOpen: boolean;
  onClose: () => void;
}

// GraphQL queries
const GET_DEVICE_HISTORY = gql`
  query GetDeviceHistory(
    $deviceId: ID!
    $timeRange: TimeRangeInput!
    $limit: Int
  ) {
    getDeviceHistory(
      deviceId: $deviceId
      timeRange: $timeRange
      limit: $limit
    ) {
      deviceId
      readings {
        id
        deviceId
        temperature
        battery
        status
        timestamp
      }
      totalCount
      timeRange {
        startTime
        endTime
        duration
      }
    }
  }
`;

const GET_DEVICE_STATS = gql`
  query GetDeviceStats($deviceId: ID!) {
    getDeviceStats(deviceId: $deviceId) {
      deviceId
      readingCount
      temperatureStats {
        min
        max
        avg
        current
      }
      complianceRate
      lastReading {
        id
        temperature
        battery
        status
        timestamp
      }
    }
  }
`;

const TEMPERATURE_UPDATES = gql`
  subscription TemperatureUpdates($deviceId: ID) {
    temperatureUpdates(deviceId: $deviceId) {
      id
      deviceId
      temperature
      battery
      status
      timestamp
    }
  }
`;

export function DeviceDetailModal({
  device,
  isOpen,
  onClose,
}: DeviceDetailModalProps) {
  const [chartData, setChartData] = useState<
    Array<{
      timestamp: string;
      temperature: number;
      battery?: number;
      status: string;
      time: string;
      excursion?: boolean;
    }>
  >([]);

  // Calculate 24 hours ago (memoized to prevent constant recalculation)
  const timeRange = useMemo(() => {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);
    return {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    };
  }, [isOpen]); // Only recalculate when modal opens

  // Fetch device history (last 24 hours)
  const {
    data: historyData,
    loading: historyLoading,
    refetch: refetchHistory,
    error: historyError,
  } = useQuery<DeviceHistoryData>(GET_DEVICE_HISTORY, {
    variables: {
      deviceId: device?.id,
      timeRange,
      limit: 1000,
    },
    skip: !device || !isOpen,
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
  });

  // Fetch device statistics
  const {
    data: statsData,
    loading: statsLoading,
    refetch: refetchStats,
  } = useQuery<DeviceStatsData>(GET_DEVICE_STATS, {
    variables: { deviceId: device?.id },
    skip: !device || !isOpen,
    errorPolicy: 'all',
  });

  // Debounced refetch to prevent too frequent updates
  const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedRefetch = useCallback(() => {
    if (refetchTimeoutRef.current) {
      clearTimeout(refetchTimeoutRef.current);
    }

    refetchTimeoutRef.current = setTimeout(() => {
      console.log('🔄 Debounced refetch triggered');
      refetchHistory();
      refetchStats();
    }, 2000); // Wait 2 seconds after the last update before refetching
  }, [refetchHistory, refetchStats]);

  // Debug logging - simplified
  useEffect(() => {
    if (isOpen && device) {
      console.log('🔍 History query state:', {
        loading: historyLoading,
        hasData: !!historyData,
        hasError: !!historyError,
        deviceId: device.id,
        variables: {
          deviceId: device.id,
          timeRange,
        },
        errorMsg: historyError?.message,
      });

      if (historyData && !historyLoading) {
        console.log(
          '✅ History loaded:',
          historyData.getDeviceHistory?.readings?.length,
          'readings'
        );
      }

      if (historyError) {
        console.error('❌ History error:', historyError.message);
        console.error('❌ Full error:', historyError);
      }
    }
  }, [isOpen, device, historyLoading, historyData, historyError]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
      }
    };
  }, []);

  // Subscribe to real-time updates for this specific device
  useSubscription(TEMPERATURE_UPDATES, {
    variables: { deviceId: device?.id },
    skip: !device || !isOpen,
    onData: ({ data }) => {
      console.log('📊 DeviceDetailModal: Real-time update received:', data);
      // Use debounced refetch to prevent too frequent updates
      debouncedRefetch();
    },
    onError: (error) => {
      console.error('❌ DeviceDetailModal: Subscription error:', error);
    },
  });

  // Process chart data when history data changes
  useEffect(() => {
    if (historyData?.getDeviceHistory?.readings) {
      const readings = historyData.getDeviceHistory.readings;
      const minTemp = device?.minTemp || 2;
      const maxTemp = device?.maxTemp || 8;

      const processedData = readings
        .map((reading) => ({
          timestamp: reading.timestamp,
          temperature: reading.temperature,
          ...(reading.battery !== undefined && reading.battery !== null
            ? { battery: reading.battery }
            : {}),
          status: reading.status,
          time: new Date(reading.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          excursion:
            reading.temperature < minTemp || reading.temperature > maxTemp,
        }))
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

      setChartData(processedData);
    }
  }, [historyData, device]);

  // Handle ESC key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Export to CSV function
  const exportToCSV = useCallback(() => {
    if (!device || !historyData?.getDeviceHistory?.readings) return;

    const readings = historyData.getDeviceHistory.readings;
    const csvHeaders = [
      'Device Name',
      'Device ID',
      'Location',
      'Timestamp',
      'Temperature (°C)',
      'Battery (%)',
      'Status',
      'In Range',
    ];

    const csvData = readings.map((reading) => [
      device.name,
      device.deviceId,
      device.location,
      new Date(reading.timestamp).toISOString(),
      reading.temperature,
      reading.battery || '',
      reading.status,
      reading.temperature >= (device.minTemp || 2) &&
      reading.temperature <= (device.maxTemp || 8)
        ? 'Yes'
        : 'No',
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `${device.name}_temperature_history_${
        new Date().toISOString().split('T')[0]
      }.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [device, historyData]);

  // Temperature color coding
  const getTemperatureColor = (temp: number) => {
    if (temp < 2) return 'text-blue-600';
    if (temp <= 4) return 'text-blue-500';
    if (temp <= 6) return 'text-green-600';
    if (temp <= 8) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBatteryIcon = (battery: number) => {
    if (battery > 75) return '🔋';
    if (battery > 50) return '🔋';
    if (battery > 25) return '🪫';
    return '🪫';
  };

  if (!isOpen || !device) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="relative transform overflow-hidden rounded-t-lg sm:rounded-lg bg-white shadow-xl transition-all w-full h-full sm:h-auto sm:my-8 sm:max-w-6xl sm:w-full animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:fade-in-0 duration-300">
          {/* Header */}
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-4 h-4 rounded-full ${
                        device.status === 'ONLINE'
                          ? 'bg-green-500'
                          : device.status === 'OFFLINE'
                          ? 'bg-red-500'
                          : 'bg-orange-500'
                      }`}
                    />
                    <span className="text-sm font-medium text-gray-600">
                      {device.status}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    {device.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {device.location} • ID: {device.deviceId}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={exportToCSV}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Export CSV
                </button>
                <button
                  onClick={onClose}
                  className="rounded-md bg-white text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <span className="sr-only">Close</span>
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-gray-50 px-4 py-5 sm:p-6 max-h-[calc(100vh-120px)] sm:max-h-none overflow-y-auto">
            {historyLoading || statsLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">
                  Loading device data...
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Statistics Section */}
                <div className="lg:col-span-1 space-y-4">
                  {/* Current Temperature */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Current Status
                    </h4>
                    {statsData?.getDeviceStats?.temperatureStats && (
                      <div className="text-center">
                        <div
                          className={`text-4xl font-bold mb-2 ${getTemperatureColor(
                            statsData.getDeviceStats.temperatureStats.current ||
                              0
                          )}`}
                        >
                          {(
                            statsData.getDeviceStats.temperatureStats.current ||
                            device.latestReading?.temperature ||
                            0
                          ).toFixed(1)}
                          °C
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          Status: {device.latestReading?.status || 'Unknown'}
                        </p>

                        {/* Battery */}
                        <div className="flex items-center justify-center space-x-2 mb-4">
                          <span className="text-2xl">
                            {getBatteryIcon(device.battery)}
                          </span>
                          <span className="text-lg font-semibold">
                            {Math.round(device.battery)}%
                          </span>
                        </div>

                        {/* Range indicator */}
                        <div className="text-sm">
                          <span className="text-gray-600">Target Range: </span>
                          <span className="font-medium">
                            {device.minTemp || 2}°C - {device.maxTemp || 8}°C
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Statistics */}
                  {statsData?.getDeviceStats && (
                    <div className="bg-white rounded-lg shadow p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">
                        24-Hour Statistics
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Min Temperature:
                          </span>
                          <span className="font-medium">
                            {statsData.getDeviceStats.temperatureStats.min.toFixed(
                              1
                            )}
                            °C
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Max Temperature:
                          </span>
                          <span className="font-medium">
                            {statsData.getDeviceStats.temperatureStats.max.toFixed(
                              1
                            )}
                            °C
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Average:</span>
                          <span className="font-medium">
                            {statsData.getDeviceStats.temperatureStats.avg.toFixed(
                              1
                            )}
                            °C
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Compliance Rate:
                          </span>
                          <span
                            className={`font-medium ${
                              statsData.getDeviceStats.complianceRate >= 95
                                ? 'text-green-600'
                                : statsData.getDeviceStats.complianceRate >= 80
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}
                          >
                            {statsData.getDeviceStats.complianceRate.toFixed(1)}
                            %
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Readings:</span>
                          <span className="font-medium">
                            {statsData.getDeviceStats.readingCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chart Section */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Temperature History (Last 24 Hours)
                    </h4>

                    {chartData.length > 0 ? (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart
                            data={chartData}
                            margin={{
                              top: 20,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#f0f0f0"
                            />
                            <XAxis
                              dataKey="time"
                              tick={{ fontSize: 12 }}
                              tickLine={{ stroke: '#e0e0e0' }}
                              axisLine={{ stroke: '#e0e0e0' }}
                            />
                            <YAxis
                              tick={{ fontSize: 12 }}
                              tickLine={{ stroke: '#e0e0e0' }}
                              axisLine={{ stroke: '#e0e0e0' }}
                              domain={['dataMin - 1', 'dataMax + 1']}
                              label={{
                                value: 'Temperature (°C)',
                                angle: -90,
                                position: 'insideLeft',
                              }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e0e0e0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                              }}
                              formatter={(value: number, name: string) => [
                                `${value.toFixed(1)}°C`,
                                name === 'temperature' ? 'Temperature' : name,
                              ]}
                              labelFormatter={(label) => `Time: ${label}`}
                            />

                            {/* Min threshold line */}
                            <ReferenceLine
                              y={device?.minTemp || 2}
                              stroke="#22c55e"
                              strokeDasharray="5 5"
                              strokeWidth={2}
                              label={{
                                value: `Min: ${device?.minTemp || 2}°C`,
                                position: 'top',
                              }}
                            />

                            {/* Max threshold line */}
                            <ReferenceLine
                              y={device?.maxTemp || 8}
                              stroke="#ef4444"
                              strokeDasharray="5 5"
                              strokeWidth={2}
                              label={{
                                value: `Max: ${device?.maxTemp || 8}°C`,
                                position: 'top',
                              }}
                            />

                            {/* Temperature line */}
                            <Line
                              type="monotone"
                              dataKey="temperature"
                              stroke="#3b82f6"
                              strokeWidth={2}
                              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                              activeDot={{
                                r: 5,
                                stroke: '#3b82f6',
                                strokeWidth: 2,
                                fill: 'white',
                              }}
                              connectNulls={false}
                            />

                            {/* Excursion highlighting */}
                            {chartData.some((point) => point.excursion) && (
                              <Area
                                type="monotone"
                                dataKey={(entry: {
                                  excursion?: boolean;
                                  temperature: number;
                                }) =>
                                  entry.excursion ? entry.temperature : null
                                }
                                stroke="none"
                                fill="#fecaca"
                                fillOpacity={0.3}
                                connectNulls={false}
                              />
                            )}
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-80 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <div className="text-4xl mb-2">📊</div>
                          <p className="text-gray-600">
                            No temperature data available
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Chart Legend */}
                    <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>Temperature</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>Min Threshold ({device.minTemp || 2}°C)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span>Max Threshold ({device.maxTemp || 8}°C)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-200 rounded-full"></div>
                        <span>Excursion Periods</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
