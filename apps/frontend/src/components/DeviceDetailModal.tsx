'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useSubscription } from '@apollo/client/react';
import { gql } from '@apollo/client';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Download, Battery, Thermometer, Clock } from 'lucide-react';

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

interface DeviceDetailModalProps {
  device: Device | null;
  isOpen: boolean;
  onClose: () => void;
}

interface DeviceReadingsData {
  getDeviceReadings: Reading[];
}

const GET_DEVICE_READINGS = gql`
  query GetDeviceReadings($deviceId: ID!, $limit: Int) {
    getDeviceReadings(deviceId: $deviceId, limit: $limit) {
      id
      deviceId
      temperature
      battery
      status
      timestamp
    }
  }
`;

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

export function DeviceDetailModal({
  device,
  isOpen,
  onClose,
}: DeviceDetailModalProps) {
  const [timeRange, setTimeRange] = useState('24h');
  const [chartData, setChartData] = useState<any[]>([]);

  // GraphQL queries
  const {
    data: readingsData,
    loading: readingsLoading,
    error: readingsError,
    refetch,
  } = useQuery<DeviceReadingsData>(GET_DEVICE_READINGS, {
    variables: {
      deviceId: device?.id,
      limit: 1000,
    },
    skip: !device || !isOpen,
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  });

  // Log errors and data for debugging
  useEffect(() => {
    if (readingsError) {
      console.error('DeviceDetailModal: Readings query error:', readingsError);
    }
  }, [readingsError]);

  useEffect(() => {
    if (readingsData) {
      console.log('DeviceDetailModal: Readings query completed:', readingsData);
    }
  }, [readingsData]);

  // Temperature updates subscription
  useSubscription(TEMPERATURE_UPDATES, {
    skip: !device || !isOpen,
    onData: () => {
      refetch();
    },
  });

  // Process chart data with client-side time filtering
  useEffect(() => {
    if (readingsData?.getDeviceReadings) {
      const readings = readingsData.getDeviceReadings;

      // Filter readings based on time range
      const now = new Date();
      let cutoffTime: Date;

      switch (timeRange) {
        case '1h':
          cutoffTime = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '6h':
          cutoffTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
          break;
        case '24h':
          cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      const filteredReadings = readings.filter(
        (reading: Reading) => new Date(reading.timestamp) >= cutoffTime
      );

      // Format timestamp based on time range
      const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        switch (timeRange) {
          case '1h':
          case '6h':
            return date.toLocaleTimeString(); // Just time for short periods
          case '24h':
            return date.toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }); // Date + time for 24h
          case '7d':
            return date.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            }); // Just date for 7 days
          default:
            return date.toLocaleTimeString();
        }
      };

      const processedData = filteredReadings
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        ) // Sort by time ascending
        .map((reading: Reading) => ({
          timestamp: formatTimestamp(reading.timestamp),
          temperature: reading.temperature,
          battery: reading.battery || 0,
          status: reading.status,
        }));

      setChartData(processedData);
    }
  }, [readingsData, timeRange]);

  // Export to CSV function
  const exportToCSV = useCallback(() => {
    if (!device || !readingsData?.getDeviceReadings) return;

    const readings = readingsData.getDeviceReadings;
    const csvHeaders = [
      'Timestamp',
      'Temperature (°C)',
      'Battery (%)',
      'Status',
    ];
    const csvData = readings.map((reading: Reading) => [
      new Date(reading.timestamp).toISOString(),
      reading.temperature.toString(),
      (reading.battery || 0).toString(),
      reading.status,
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
  }, [device, readingsData]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return 'default';
      case 'OFFLINE':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getBatteryColor = (battery: number) => {
    if (battery > 75) return 'text-green-600';
    if (battery > 50) return 'text-yellow-600';
    if (battery > 25) return 'text-orange-600';
    return 'text-red-600';
  };

  const getTemperatureColor = (temp: number) => {
    if (temp < 2 || temp > 8) return 'text-red-600';
    if (temp < 4 || temp > 6) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Badge variant={getStatusVariant(device?.status || '')}>
                {device?.status}
              </Badge>
              <div>
                <DialogTitle className="flex items-center space-x-2">
                  <Thermometer className="h-5 w-5" />
                  <span>{device?.name}</span>
                </DialogTitle>
                <DialogDescription>
                  {device?.location} • ID: {device?.deviceId}
                </DialogDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </DialogHeader>

        {device && (
          <div className="space-y-6">
            {/* Current Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Thermometer className="h-4 w-4 mr-2" />
                    Current Temperature
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${getTemperatureColor(
                      device.latestReading?.temperature || 0
                    )}`}
                  >
                    {device.latestReading?.temperature?.toFixed(1) || '--'}°C
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Status: {device.latestReading?.status || 'Unknown'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Battery className="h-4 w-4 mr-2" />
                    Battery Level
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${getBatteryColor(
                      device.battery
                    )}`}
                  >
                    {Math.round(device.battery)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {device.battery > 20 ? 'Good' : 'Low Battery'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Last Reading
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-medium">
                    {device.latestReading?.timestamp
                      ? new Date(
                          device.latestReading.timestamp
                        ).toLocaleString()
                      : 'No data'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {device.isActive ? 'Active' : 'Inactive'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Time Range Selector */}
            <div className="flex space-x-2">
              {['1h', '6h', '24h', '7d'].map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                >
                  {range}
                </Button>
              ))}
            </div>

            {/* Temperature Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Temperature History</CardTitle>
                <CardDescription>
                  Temperature readings over the selected time period
                </CardDescription>
              </CardHeader>
              <CardContent>
                {readingsLoading ? (
                  <div className="flex flex-col items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading chart data...</span>
                    <div className="text-xs text-muted-foreground mt-2">
                      Device: {device?.name} | Range: {timeRange}
                    </div>
                  </div>
                ) : readingsError ? (
                  <div className="flex items-center justify-center h-64 text-destructive">
                    Error loading temperature data: {readingsError.message}
                  </div>
                ) : chartData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="timestamp"
                          fontSize={12}
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis
                          fontSize={12}
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="temperature"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={false}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <p>No temperature data available</p>
                    <p className="text-xs mt-2">
                      Device: {device?.name} | Time Range: {timeRange}
                    </p>
                    {readingsData && (
                      <p className="text-xs mt-1">
                        Total readings:{' '}
                        {readingsData.getDeviceReadings?.length || 0}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
