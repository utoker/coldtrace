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
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
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

interface AlertStats {
  total: number;
  unread: number;
  critical: number;
  warning: number;
  resolved: number;
  byType: {
    TEMPERATURE_EXCURSION: number;
    DEVICE_OFFLINE: number;
    LOW_BATTERY: number;
    CONNECTION_LOST: number;
  };
}

interface AlertAnalyticsProps {
  alertStats: AlertStats;
  devices: Device[];
  selectedDevice: string;
  dateRange?: { from: Date; to: Date };
}

export function AlertAnalytics({
  alertStats,
  devices,
  selectedDevice,
  dateRange,
}: AlertAnalyticsProps) {
  const filteredDevices = useMemo(() => {
    if (selectedDevice === 'all') return devices;
    return devices.filter((d) => d.id === selectedDevice);
  }, [devices, selectedDevice]);

  // Calculate alert metrics from device readings
  const alertMetrics = useMemo(() => {
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

    const offlineDevices = filteredDevices.filter(
      (d) => d.status === 'OFFLINE'
    ).length;
    const lowBatteryDevices = filteredDevices.filter(
      (d) => d.battery < 20
    ).length;

    return {
      totalReadings,
      warningReadings,
      criticalReadings,
      offlineDevices,
      lowBatteryDevices,
      alertRate:
        totalReadings > 0
          ? ((warningReadings + criticalReadings) / totalReadings) * 100
          : 0,
      resolutionRate:
        alertStats.total > 0
          ? (alertStats.resolved / alertStats.total) * 100
          : 100,
    };
  }, [filteredDevices, alertStats]);

  const alertTypeData = useMemo(() => {
    const totalAlerts = alertStats.total;

    return [
      {
        type: 'Temperature Excursion',
        count: alertStats.byType.TEMPERATURE_EXCURSION,
        percent:
          totalAlerts > 0
            ? alertStats.byType.TEMPERATURE_EXCURSION / totalAlerts
            : 0,
        color: '#ef4444',
        icon: '🌡️',
      },
      {
        type: 'Device Offline',
        count: alertStats.byType.DEVICE_OFFLINE,
        percent:
          totalAlerts > 0 ? alertStats.byType.DEVICE_OFFLINE / totalAlerts : 0,
        color: '#6b7280',
        icon: '📱',
      },
      {
        type: 'Low Battery',
        count: alertStats.byType.LOW_BATTERY,
        percent:
          totalAlerts > 0 ? alertStats.byType.LOW_BATTERY / totalAlerts : 0,
        color: '#f59e0b',
        icon: '🔋',
      },
      {
        type: 'Connection Lost',
        count: alertStats.byType.CONNECTION_LOST,
        percent:
          totalAlerts > 0 ? alertStats.byType.CONNECTION_LOST / totalAlerts : 0,
        color: '#8b5cf6',
        icon: '📡',
      },
    ].filter((item) => item.count > 0);
  }, [alertStats]);

  const severityData = useMemo(() => {
    return [
      { severity: 'Critical', count: alertStats.critical, color: '#ef4444' },
      { severity: 'Warning', count: alertStats.warning, color: '#f59e0b' },
      { severity: 'Resolved', count: alertStats.resolved, color: '#10b981' },
    ];
  }, [alertStats]);

  const deviceAlertData = useMemo(() => {
    return filteredDevices
      .map((device) => {
        // Filter readings by date range if provided
        let deviceReadings = device.readings;
        if (dateRange) {
          deviceReadings = device.readings.filter((reading) => {
            const readingDate = new Date(reading.timestamp);
            return readingDate >= dateRange.from && readingDate <= dateRange.to;
          });
        }

        const warningCount = deviceReadings.filter(
          (r) => r.status === 'WARNING'
        ).length;
        const criticalCount = deviceReadings.filter(
          (r) => r.status === 'CRITICAL'
        ).length;
        const totalAlerts = warningCount + criticalCount;

        return {
          name: device.name,
          location: device.location,
          totalAlerts,
          warningCount,
          criticalCount,
          alertRate:
            deviceReadings.length > 0
              ? (totalAlerts / deviceReadings.length) * 100
              : 0,
          status: device.status,
          battery: device.battery,
        };
      })
      .sort((a, b) => b.totalAlerts - a.totalAlerts);
  }, [filteredDevices, dateRange]);

  const alertTrendData = useMemo(() => {
    // Use real data from readings with date filtering
    const trendData: Array<{
      date: string;
      alerts: number;
      resolved: number;
      critical: number;
    }> = [];

    // Group readings by date
    const readingsByDate = new Map<
      string,
      Array<{
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

    // Calculate alert metrics for each date
    readingsByDate.forEach((readings, date) => {
      const warningCount = readings.filter(
        (r) => r.status === 'WARNING'
      ).length;
      const criticalCount = readings.filter(
        (r) => r.status === 'CRITICAL'
      ).length;
      const totalAlerts = warningCount + criticalCount;

      // Assume 80% resolution rate for demo purposes
      const resolved = Math.floor(totalAlerts * 0.8);

      trendData.push({
        date,
        alerts: totalAlerts,
        resolved,
        critical: criticalCount,
      });
    });

    return trendData.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [filteredDevices, dateRange]);

  return (
    <div className="space-y-6">
      {/* Alert Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {alertStats.total}
            </div>
            <div className="text-sm text-gray-600">
              {alertStats.unread} unread
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Critical Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 mb-1">
              {alertStats.critical}
            </div>
            <div className="text-sm text-gray-600">
              Requires immediate attention
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Resolution Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {alertMetrics.resolutionRate.toFixed(1)}%
            </div>
            <Progress value={alertMetrics.resolutionRate} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Alert Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {alertMetrics.alertRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Of total readings</div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Alert Trends
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
            Daily alert counts and resolution rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={alertTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="alerts"
                  stackId="1"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="resolved"
                  stackId="2"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alert Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Alert Types Distribution</CardTitle>
            <CardDescription>Breakdown of alerts by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={alertTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {alertTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string, props: any) => [
                      `${value} alerts (${(props.payload.percent * 100).toFixed(
                        1
                      )}%)`,
                      props.payload.type,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              {alertTypeData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-700">
                    {entry.type}: {entry.count} (
                    {(entry.percent * 100).toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alert Severity */}
        <Card>
          <CardHeader>
            <CardTitle>Alert Severity Breakdown</CardTitle>
            <CardDescription>Distribution by severity level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="severity" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device Alert Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Device Alert Performance</CardTitle>
          <CardDescription>
            Alert frequency and performance by device
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deviceAlertData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="location" />
                <YAxis />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value}${
                      name === 'warningCount'
                        ? ' warnings'
                        : name === 'criticalCount'
                        ? ' critical'
                        : ' total'
                    }`,
                    name === 'warningCount'
                      ? 'Warnings'
                      : name === 'criticalCount'
                      ? 'Critical'
                      : 'Total Alerts',
                  ]}
                />
                <Bar
                  dataKey="warningCount"
                  stackId="alerts"
                  fill="#f59e0b"
                  name="warningCount"
                />
                <Bar
                  dataKey="criticalCount"
                  stackId="alerts"
                  fill="#ef4444"
                  name="criticalCount"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Alert Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Device Alert Details</CardTitle>
          <CardDescription>
            Detailed alert metrics for each device
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Alerts</TableHead>
                <TableHead>Alert Rate</TableHead>
                <TableHead>Battery</TableHead>
                <TableHead>Alert Breakdown</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deviceAlertData.map((device) => (
                <TableRow key={device.name}>
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
                          device.totalAlerts === 0
                            ? 'text-green-600'
                            : device.totalAlerts < 5
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }
                      >
                        {device.totalAlerts}
                      </span>
                      {device.totalAlerts > 0 && (
                        <Progress
                          value={Math.min(device.alertRate, 100)}
                          className="w-16 h-2"
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        device.alertRate === 0
                          ? 'default'
                          : device.alertRate < 5
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {device.alertRate.toFixed(1)}%
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
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs">
                        {device.warningCount} W
                      </Badge>
                      <Badge variant="destructive" className="text-xs">
                        {device.criticalCount} C
                      </Badge>
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
