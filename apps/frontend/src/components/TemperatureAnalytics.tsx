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
import { Separator } from '@/components/ui/separator';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { Line } from 'recharts';
import { Thermometer, TrendingUp, TrendingDown } from 'lucide-react';

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

interface TemperatureAnalyticsProps {
  devices: Device[];
  selectedDevice: string;
  dateRange?: { from: Date; to: Date };
}

export function TemperatureAnalytics({
  devices,
  selectedDevice,
  dateRange,
}: TemperatureAnalyticsProps) {
  const filteredDevices = useMemo(() => {
    if (selectedDevice === 'all') return devices;
    return devices.filter((d) => d.id === selectedDevice);
  }, [devices, selectedDevice]);

  const temperatureData = useMemo(() => {
    const data: Array<{
      timestamp: Date;
      temperature: number;
      deviceName: string;
      status: string;
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

        data.push({
          timestamp: readingDate,
          temperature: reading.temperature,
          deviceName: device.name,
          status: reading.status,
        });
      });
    });

    return data.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [filteredDevices, dateRange]);

  const temperatureDistribution = useMemo(() => {
    const ranges = [
      {
        range: 'Below 2°C',
        min: -Infinity,
        max: 2,
        count: 0,
        color: '#ef4444',
      },
      { range: '2-8°C (Optimal)', min: 2, max: 8, count: 0, color: '#10b981' },
      {
        range: '8-10°C (Warning)',
        min: 8,
        max: 10,
        count: 0,
        color: '#f59e0b',
      },
      {
        range: 'Above 10°C',
        min: 10,
        max: Infinity,
        count: 0,
        color: '#dc2626',
      },
    ];

    temperatureData.forEach((dataPoint) => {
      ranges.forEach((range) => {
        if (
          dataPoint.temperature >= range.min &&
          dataPoint.temperature < range.max
        ) {
          range.count++;
        }
      });
    });

    const totalReadings = temperatureData.length;

    return ranges
      .filter((range) => range.count > 0)
      .map((range) => ({
        ...range,
        percent: totalReadings > 0 ? range.count / totalReadings : 0,
      }));
  }, [temperatureData]);

  const complianceStats = useMemo(() => {
    const totalReadings = temperatureData.length;
    const compliantReadings = temperatureData.filter(
      (d) => d.temperature >= 2 && d.temperature <= 8
    ).length;
    const warningReadings = temperatureData.filter(
      (d) => d.temperature < 2 || d.temperature > 8
    ).length;
    const criticalReadings = temperatureData.filter(
      (d) => d.temperature < 1 || d.temperature > 10
    ).length;

    return {
      total: totalReadings,
      compliant: compliantReadings,
      warning: warningReadings,
      critical: criticalReadings,
      complianceRate:
        totalReadings > 0 ? (compliantReadings / totalReadings) * 100 : 100,
    };
  }, [temperatureData]);

  const averageTemperature = useMemo(() => {
    if (temperatureData.length === 0) return 0;
    return (
      temperatureData.reduce((sum, d) => sum + d.temperature, 0) /
      temperatureData.length
    );
  }, [temperatureData]);

  const temperatureTrend = useMemo(() => {
    if (temperatureData.length < 2) return 0;
    const firstHalf = temperatureData.slice(
      0,
      Math.floor(temperatureData.length / 2)
    );
    const secondHalf = temperatureData.slice(
      Math.floor(temperatureData.length / 2)
    );

    const firstAvg =
      firstHalf.reduce((sum, d) => sum + d.temperature, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, d) => sum + d.temperature, 0) / secondHalf.length;

    return ((secondAvg - firstAvg) / firstAvg) * 100;
  }, [temperatureData]);

  return (
    <div className="space-y-6">
      {/* Temperature Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Average Temperature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {averageTemperature.toFixed(1)}°C
            </div>
            <div className="flex items-center text-sm">
              {temperatureTrend > 0 ? (
                <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
              )}
              <span
                className={
                  temperatureTrend > 0 ? 'text-red-500' : 'text-green-500'
                }
              >
                {Math.abs(temperatureTrend).toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Compliance Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {complianceStats.complianceRate.toFixed(1)}%
            </div>
            <Progress value={complianceStats.complianceRate} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Readings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {complianceStats.total.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">
              {complianceStats.compliant.toLocaleString()} compliant
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Temperature Violations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {complianceStats.warning + complianceStats.critical}
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                {complianceStats.warning} warnings
              </Badge>
              <Badge variant="destructive" className="text-xs">
                {complianceStats.critical} critical
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Temperature Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5" />
            Temperature Trends Over Time
          </CardTitle>
          <CardDescription>
            Historical temperature readings for{' '}
            {selectedDevice === 'all'
              ? 'all devices'
              : filteredDevices[0]?.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={temperatureData}>
                {/* Show all filtered data */}
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) => {
                    const date =
                      value instanceof Date ? value : new Date(value);
                    // Show date and time for better clarity
                    return (
                      date.toLocaleDateString() +
                      ' ' +
                      date.toLocaleTimeString()
                    );
                  }}
                />
                <YAxis domain={[0, 15]} />
                <Tooltip
                  labelFormatter={(value) =>
                    value instanceof Date
                      ? value.toLocaleString()
                      : new Date(value).toLocaleString()
                  }
                  formatter={(value: number) => [
                    `${value.toFixed(1)}°C`,
                    'Temperature',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="temperature"
                  stroke="#2563eb"
                  fill="#2563eb"
                  fillOpacity={0.2}
                />
                {/* Reference lines for optimal range */}
                <Line
                  type="monotone"
                  dataKey={() => 2}
                  stroke="#10b981"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey={() => 8}
                  stroke="#10b981"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temperature Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Temperature Distribution</CardTitle>
            <CardDescription>
              Distribution of temperature readings across optimal and warning
              ranges
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={temperatureDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {temperatureDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, _name: string, item) => {
                      const percent = (item as any)?.payload?.percent as
                        | number
                        | undefined;
                      const range = (item as any)?.payload?.range as
                        | string
                        | undefined;
                      return [
                        `${value} readings (${((percent ?? 0) * 100).toFixed(
                          1
                        )}%)`,
                        range ?? 'Range',
                      ];
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              {temperatureDistribution.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-700">
                    {entry.range}: {entry.count} (
                    {(entry.percent * 100).toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Compliance Status */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Status</CardTitle>
            <CardDescription>
              Current compliance status and violation breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Compliance</span>
                <Badge
                  variant={
                    complianceStats.complianceRate >= 95
                      ? 'default'
                      : 'destructive'
                  }
                >
                  {complianceStats.complianceRate.toFixed(1)}%
                </Badge>
              </div>
              <Progress
                value={complianceStats.complianceRate}
                className="h-2"
              />

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Compliant Readings</span>
                  </div>
                  <span className="text-sm font-medium">
                    {complianceStats.compliant}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">Warning Readings</span>
                  </div>
                  <span className="text-sm font-medium">
                    {complianceStats.warning}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm">Critical Readings</span>
                  </div>
                  <span className="text-sm font-medium">
                    {complianceStats.critical}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device-specific Temperature Comparison */}
      {selectedDevice === 'all' && (
        <Card>
          <CardHeader>
            <CardTitle>Device Temperature Comparison</CardTitle>
            <CardDescription>
              Average temperature by device location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={filteredDevices.map((device) => ({
                    name: device.location,
                    temperature: device.latestReading?.temperature || 0,
                    status: device.latestReading?.status || 'NORMAL',
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 15]} />
                  <Tooltip
                    formatter={(value: number) => [
                      `${value.toFixed(1)}°C`,
                      'Temperature',
                    ]}
                  />
                  <Bar
                    dataKey="temperature"
                    fill="#2563eb"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
