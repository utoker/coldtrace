'use client';

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
// Badge not used in this component
import { Progress } from '@/components/ui/progress';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { TrendingUp, CheckCircle, XCircle } from 'lucide-react';

interface Device {
  id: string;
  deviceId: string;
  name: string;
  location: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  battery: number;
  isActive: boolean;
  createdAt: string;
  latestReading?: {
    temperature: number;
    status: 'NORMAL' | 'WARNING' | 'CRITICAL';
    timestamp: string;
  };
  readings: Array<{
    temperature: number;
    battery: number;
    status: 'NORMAL' | 'WARNING' | 'CRITICAL';
    timestamp: string;
  }>;
}

// (Unused) Alert statistics interface removed to satisfy linter

interface FleetOverviewProps {
  devices: Device[];
  selectedDevice: string;
  dateRange?: { from: Date; to: Date };
}

export function FleetOverview({
  devices,
  selectedDevice,
  dateRange,
}: FleetOverviewProps) {
  const filteredDevices = useMemo(() => {
    if (selectedDevice === 'all') return devices;
    return devices.filter((d) => d.id === selectedDevice);
  }, [devices, selectedDevice]);

  const fleetMetrics = useMemo(() => {
    const totalDevices = filteredDevices.length;
    const onlineDevices = filteredDevices.filter(
      (d) => d.status === 'ONLINE'
    ).length;
    const offlineDevices = filteredDevices.filter(
      (d) => d.status === 'OFFLINE'
    ).length;
    const maintenanceDevices = filteredDevices.filter(
      (d) => d.status === 'MAINTENANCE'
    ).length;

    const devicesWithReadings = filteredDevices.filter((d) => d.latestReading);
    const inRangeDevices = devicesWithReadings.filter(
      (d) =>
        d.latestReading &&
        d.latestReading.temperature >= 2 &&
        d.latestReading.temperature <= 8
    ).length;

    const averageTemperature =
      devicesWithReadings.length > 0
        ? devicesWithReadings.reduce(
            (sum, d) => sum + (d.latestReading?.temperature || 0),
            0
          ) / devicesWithReadings.length
        : 0;

    const averageBattery =
      filteredDevices.length > 0
        ? filteredDevices.reduce((sum, d) => sum + d.battery, 0) /
          filteredDevices.length
        : 0;

    const complianceRate =
      devicesWithReadings.length > 0
        ? (inRangeDevices / devicesWithReadings.length) * 100
        : 100;

    const totalReadings = filteredDevices.reduce(
      (sum, device) => sum + device.readings.length,
      0
    );
    const warningReadings = filteredDevices.reduce(
      (sum, device) =>
        sum + device.readings.filter((r) => r.status === 'WARNING').length,
      0
    );
    const criticalReadings = filteredDevices.reduce(
      (sum, device) =>
        sum + device.readings.filter((r) => r.status === 'CRITICAL').length,
      0
    );

    return {
      totalDevices,
      onlineDevices,
      offlineDevices,
      maintenanceDevices,
      inRangeDevices,
      averageTemperature,
      averageBattery,
      complianceRate,
      totalReadings,
      warningReadings,
      criticalReadings,
      uptimePercentage:
        totalDevices > 0 ? (onlineDevices / totalDevices) * 100 : 100,
      alertRate:
        totalReadings > 0
          ? ((warningReadings + criticalReadings) / totalReadings) * 100
          : 0,
    };
  }, [filteredDevices]);

  // Previously computed location-level aggregates were unused; removed to satisfy linter

  const performanceTrendData = useMemo(() => {
    // Use real data from readings with date filtering
    const trendData: Array<{
      date: string;
      uptime: number;
      compliance: number;
      battery: number;
    }> = [];

    // Group readings by date
    const readingsByDate = new Map<
      string,
      Array<{
        temperature: number;
        battery: number;
        status: string;
        timestamp: string;
      }>
    >();

    filteredDevices.forEach((device) => {
      device.readings.forEach((reading) => {
        const readingDate = new Date(reading.timestamp);

        // Apply date range filter if provided
        if (dateRange) {
          const { from, to } = dateRange;
          if (readingDate < from || readingDate > to) {
            return; // Skip this reading if it's outside the date range
          }
        }

        const dateKey = readingDate.toLocaleDateString();
        if (!readingsByDate.has(dateKey)) {
          readingsByDate.set(dateKey, []);
        }
        readingsByDate.get(dateKey)!.push(reading);
      });
    });

    // Calculate metrics for each date
    readingsByDate.forEach((readings, date) => {
      const totalReadings = readings.length;
      const compliantReadings = readings.filter(
        (r) => r.temperature >= 2 && r.temperature <= 8
      ).length;

      const averageBattery =
        readings.reduce((sum, r) => sum + r.battery, 0) / totalReadings;
      const complianceRate =
        totalReadings > 0 ? (compliantReadings / totalReadings) * 100 : 100;

      // Calculate uptime based on device status (simplified)
      const onlineDevices = filteredDevices.filter(
        (d) => d.status === 'ONLINE'
      ).length;
      const totalDevices = filteredDevices.length;
      const uptime =
        totalDevices > 0 ? (onlineDevices / totalDevices) * 100 : 100;

      trendData.push({
        date,
        uptime,
        compliance: complianceRate,
        battery: averageBattery,
      });
    });

    return trendData.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [filteredDevices, fleetMetrics, dateRange]);

  return (
    <div className="space-y-6">
      {/* Fleet Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Fleet Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {fleetMetrics.onlineDevices}/{fleetMetrics.totalDevices}
            </div>
            <div className="text-sm text-gray-600">
              {fleetMetrics.offlineDevices} offline,{' '}
              {fleetMetrics.maintenanceDevices} maintenance
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              System Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {fleetMetrics.uptimePercentage.toFixed(1)}%
            </div>
            <Progress value={fleetMetrics.uptimePercentage} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Temperature Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {fleetMetrics.complianceRate.toFixed(1)}%
            </div>
            <Progress value={fleetMetrics.complianceRate} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {fleetMetrics.uptimePercentage > 90 &&
              fleetMetrics.complianceRate > 95
                ? 'Excellent'
                : fleetMetrics.uptimePercentage > 75 &&
                  fleetMetrics.complianceRate > 85
                ? 'Good'
                : 'Needs Attention'}
            </div>
            <div className="flex items-center gap-1">
              {fleetMetrics.uptimePercentage > 90 &&
              fleetMetrics.complianceRate > 95 ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : fleetMetrics.uptimePercentage > 75 &&
                fleetMetrics.complianceRate > 85 ? (
                <TrendingUp className="h-4 w-4 text-yellow-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm text-gray-600">Overall</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Fleet Performance Trends
            {dateRange ? (
              <span className="text-sm font-normal text-muted-foreground">
                ({dateRange.from.toLocaleDateString()} -{' '}
                {dateRange.to.toLocaleDateString()})
              </span>
            ) : (
              <span className="text-sm font-normal text-muted-foreground">
                (Last 7 Days)
              </span>
            )}
          </CardTitle>
          <CardDescription>
            System-wide performance metrics over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(1)}%`,
                    name === 'uptime'
                      ? 'Uptime'
                      : name === 'compliance'
                      ? 'Compliance'
                      : 'Battery',
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="uptime"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="compliance"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="battery"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Fleet Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"></div>
    </div>
  );
}
