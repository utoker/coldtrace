'use client';

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Activity,
  Battery,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

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

interface DevicePerformanceAnalyticsProps {
  devices: Device[];
  selectedDevice: string;
  dateRange?: { from: Date; to: Date };
}

export function DevicePerformanceAnalytics({
  devices,
  selectedDevice,
  dateRange,
}: DevicePerformanceAnalyticsProps) {
  const filteredDevices = useMemo(() => {
    if (selectedDevice === 'all') return devices;
    return devices.filter((d) => d.id === selectedDevice);
  }, [devices, selectedDevice]);

  const devicePerformanceData = useMemo(() => {
    return filteredDevices.map((device) => {
      const totalReadings = device.readings.length;
      const normalReadings = device.readings.filter(
        (r) => r.status === 'NORMAL'
      ).length;
      const warningReadings = device.readings.filter(
        (r) => r.status === 'WARNING'
      ).length;
      const criticalReadings = device.readings.filter(
        (r) => r.status === 'CRITICAL'
      ).length;

      const uptimePercentage =
        totalReadings > 0 ? (normalReadings / totalReadings) * 100 : 100;
      const batteryDrainRate = calculateBatteryDrainRate(device.readings);
      const avgTemperature =
        totalReadings > 0
          ? device.readings.reduce((sum, r) => sum + r.temperature, 0) /
            totalReadings
          : 0;

      return {
        id: device.id,
        name: device.name,
        location: device.location,
        status: device.status,
        battery: device.battery,
        totalReadings,
        normalReadings,
        warningReadings,
        criticalReadings,
        uptimePercentage,
        batteryDrainRate,
        avgTemperature,
        complianceRate:
          totalReadings > 0 ? (normalReadings / totalReadings) * 100 : 100,
        lastReading: device.latestReading?.timestamp,
      };
    });
  }, [filteredDevices]);

  const batteryTrendData = useMemo(() => {
    const trendData: Array<{
      timestamp: Date;
      battery: number;
      deviceName: string;
    }> = [];

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

        // Ensure battery is a valid number and within expected range (0-100)
        const batteryValue =
          typeof reading.battery === 'number' &&
          reading.battery >= 0 &&
          reading.battery <= 100
            ? reading.battery
            : Math.min(100, Math.max(0, reading.battery || 100)); // Clamp to 0-100 range

        trendData.push({
          timestamp: readingDate,
          battery: batteryValue,
          deviceName: device.name,
        });
      });
    });

    return trendData.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
  }, [filteredDevices, dateRange]);

  const statusDistribution = useMemo(() => {
    const statuses = ['ONLINE', 'OFFLINE', 'MAINTENANCE'];
    const totalDevices = filteredDevices.length;

    return statuses.map((status) => {
      const count = filteredDevices.filter((d) => d.status === status).length;
      const percent = totalDevices > 0 ? count / totalDevices : 0;

      return {
        status,
        count,
        percent,
        color:
          status === 'ONLINE'
            ? '#10b981'
            : status === 'OFFLINE'
            ? '#ef4444'
            : '#f59e0b',
      };
    });
  }, [filteredDevices]);

  const performanceMetrics = useMemo(() => {
    const totalDevices = filteredDevices.length;
    const onlineDevices = filteredDevices.filter(
      (d) => d.status === 'ONLINE'
    ).length;
    const avgBattery =
      filteredDevices.reduce((sum, d) => sum + d.battery, 0) / totalDevices;
    const avgUptime =
      devicePerformanceData.reduce((sum, d) => sum + d.uptimePercentage, 0) /
      totalDevices;
    const lowBatteryDevices = filteredDevices.filter(
      (d) => d.battery < 20
    ).length;

    return {
      totalDevices,
      onlineDevices,
      avgBattery,
      avgUptime,
      lowBatteryDevices,
      offlineDevices: totalDevices - onlineDevices,
    };
  }, [filteredDevices, devicePerformanceData]);

  return (
    <div className="space-y-6">
      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Device Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {performanceMetrics.onlineDevices}/
              {performanceMetrics.totalDevices}
            </div>
            <div className="text-sm text-gray-600">
              {performanceMetrics.offlineDevices} offline
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Average Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {performanceMetrics.avgUptime.toFixed(1)}%
            </div>
            <Progress value={performanceMetrics.avgUptime} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Battery Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {performanceMetrics.avgBattery.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600">
              {performanceMetrics.lowBatteryDevices} devices low
            </div>
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
              {performanceMetrics.avgUptime > 90
                ? 'Excellent'
                : performanceMetrics.avgUptime > 75
                ? 'Good'
                : 'Needs Attention'}
            </div>
            <div className="flex items-center gap-1">
              {performanceMetrics.avgUptime > 90 ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : performanceMetrics.avgUptime > 75 ? (
                <TrendingUp className="h-4 w-4 text-yellow-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm text-gray-600">Overall</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Device Status Distribution
          </CardTitle>
          <CardDescription>
            Current status breakdown of all monitored devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, _name: string, item) => {
                    const percent = (item as any)?.payload?.percent as
                      | number
                      | undefined;
                    const status = (item as any)?.payload?.status as
                      | string
                      | undefined;
                    return [
                      `${value} devices (${((percent ?? 0) * 100).toFixed(
                        1
                      )}%)`,
                      status ?? 'Status',
                    ];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {statusDistribution.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-gray-700">
                  {entry.status}: {entry.count} (
                  {(entry.percent * 100).toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Battery Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Battery className="h-5 w-5" />
              Battery Level Trends
            </CardTitle>
            <CardDescription>Battery level changes over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={batteryTrendData}>
                  {/* Show all readings for last 7 days */}
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) =>
                      value instanceof Date
                        ? value.toLocaleDateString()
                        : new Date(value).toLocaleDateString()
                    }
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    labelFormatter={(value) =>
                      value instanceof Date
                        ? value.toLocaleString()
                        : new Date(value).toLocaleString()
                    }
                    formatter={(value: number) => [
                      `${value.toFixed(1)}%`,
                      'Battery',
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="battery"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                  />
                  {/* Reference lines */}
                  <Line
                    type="monotone"
                    dataKey={() => 20}
                    stroke="#ef4444"
                    strokeDasharray="5 5"
                    strokeWidth={1}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey={() => 50}
                    stroke="#f59e0b"
                    strokeDasharray="5 5"
                    strokeWidth={1}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Device Performance Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Device Performance Comparison</CardTitle>
            <CardDescription>
              Uptime percentage by device location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={devicePerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="location" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    formatter={(value: number) => [
                      `${value.toFixed(1)}%`,
                      'Uptime',
                    ]}
                  />
                  <Bar
                    dataKey="uptimePercentage"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Device Performance Details</CardTitle>
          <CardDescription>
            Detailed performance metrics for each device
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Battery</TableHead>
                <TableHead>Uptime</TableHead>
                <TableHead>Compliance</TableHead>
                <TableHead>Readings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devicePerformanceData.map((device) => (
                <TableRow key={device.id}>
                  <TableCell className="font-medium">{device.name}</TableCell>
                  <TableCell>{device.location}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        device.status === 'ONLINE' ? 'default' : 'destructive'
                      }
                    >
                      {device.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          device.battery > 50
                            ? 'text-green-600'
                            : device.battery > 20
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }
                      >
                        {device.battery.toFixed(0)}%
                      </span>
                      <Progress value={device.battery} className="w-16 h-2" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          device.uptimePercentage > 90
                            ? 'text-green-600'
                            : device.uptimePercentage > 75
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }
                      >
                        {device.uptimePercentage.toFixed(1)}%
                      </span>
                      <Progress
                        value={device.uptimePercentage}
                        className="w-16 h-2"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        device.complianceRate >= 95 ? 'default' : 'destructive'
                      }
                    >
                      {device.complianceRate.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex gap-1">
                        <Badge variant="outline" className="text-xs">
                          {device.normalReadings} N
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {device.warningReadings} W
                        </Badge>
                        <Badge variant="destructive" className="text-xs">
                          {device.criticalReadings} C
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to calculate battery drain rate
function calculateBatteryDrainRate(
  readings: Array<{ battery: number; timestamp: string }>
): number {
  if (readings.length < 2) return 0;

  const sortedReadings = [...readings].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  const firstReading = sortedReadings[0];
  const lastReading = sortedReadings[sortedReadings.length - 1];
  if (!firstReading || !lastReading) return 0;

  const timeDiff =
    new Date(lastReading.timestamp).getTime() -
    new Date(firstReading.timestamp).getTime();
  const batteryDiff = firstReading.battery - lastReading.battery;

  // Return battery drain per hour
  return timeDiff > 0 ? batteryDiff / (timeDiff / (1000 * 60 * 60)) : 0;
}
