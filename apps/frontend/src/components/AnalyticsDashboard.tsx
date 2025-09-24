'use client';

import { useState } from 'react';
import { useQuery, useSubscription } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
// removed unused imports
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Thermometer,
  Battery,
  AlertTriangle,
  Calendar as CalendarIcon,
  Download,
  Filter,
  BarChart3,
  Activity,
} from 'lucide-react';
import { TemperatureAnalytics } from './TemperatureAnalytics';
import * as XLSX from 'xlsx';
import { DevicePerformanceAnalytics } from './DevicePerformanceAnalytics';
import { AlertAnalytics } from './AlertAnalytics';
import { FleetOverview } from './FleetOverview';

// GraphQL Queries and Subscriptions
const GET_ANALYTICS_DATA = gql`
  query GetAnalyticsData {
    getDevices {
      id
      deviceId
      name
      location
      status
      battery
      isActive
      createdAt
      latestReading {
        temperature
        status
        timestamp
      }
      readings {
        temperature
        battery
        status
        timestamp
      }
    }
    getAlertStats {
      total
      unread
      critical
      warning
      resolved
      byType {
        TEMPERATURE_EXCURSION
        DEVICE_OFFLINE
        LOW_BATTERY
        CONNECTION_LOST
      }
    }
  }
`;

// WebSocket Subscriptions for real-time updates
const TEMPERATURE_UPDATES = gql`
  subscription TemperatureUpdates {
    temperatureUpdates {
      id
      deviceId
      temperature
      battery
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
      deviceId
      status
      timestamp
    }
  }
`;

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

interface AnalyticsData {
  getDevices: Device[];
  getAlertStats: AlertStats;
}

export function AnalyticsDashboard() {
  const [selectedDevice, setSelectedDevice] = useState<string>('all');
  const [dateRange, setDateRange] = useState<
    { from: Date; to: Date } | undefined
  >(() => {
    // Set default date range to last 7 days
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 7);
    return { from, to };
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [wsConnected, setWsConnected] = useState(false);

  const { loading, error, data, refetch } = useQuery<AnalyticsData>(
    GET_ANALYTICS_DATA,
    {
      pollInterval: wsConnected ? 0 : 600000, // Never poll when WS connected, 10 minutes when WS fails
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
    }
  );

  // WebSocket subscriptions for real-time updates
  useSubscription(TEMPERATURE_UPDATES, {
    skip: false, // Always try to connect
    onData: ({ data: subscriptionData }) => {
      if (process.env.NODE_ENV !== 'production') {
        console.log(
          '📊 Analytics: Temperature update received:',
          subscriptionData
        );
      }
      setWsConnected(true);
      // Refetch data when we receive real-time updates
      refetch();
    },
    onError: (error) => {
      if (process.env.NODE_ENV !== 'production') {
        console.error('❌ Analytics: Temperature subscription error:', error);
      }
      setWsConnected(false);
    },
  });

  useSubscription(DEVICE_STATUS_CHANGED, {
    skip: false, // Always try to connect
    onData: ({ data: subscriptionData }) => {
      if (process.env.NODE_ENV !== 'production') {
        console.log(
          '📊 Analytics: Device status update received:',
          subscriptionData
        );
      }
      setWsConnected(true);
      // Refetch data when we receive real-time updates
      refetch();
    },
    onError: (error) => {
      if (process.env.NODE_ENV !== 'production') {
        console.error('❌ Analytics: Device status subscription error:', error);
      }
      setWsConnected(false);
    },
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <p className="text-lg font-medium">Failed to load analytics data</p>
            <p className="text-sm text-gray-500 mt-2">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const devices = data?.getDevices || [];
  const alertStats = data?.getAlertStats || {
    total: 0,
    unread: 0,
    critical: 0,
    warning: 0,
    resolved: 0,
    byType: {
      TEMPERATURE_EXCURSION: 0,
      DEVICE_OFFLINE: 0,
      LOW_BATTERY: 0,
      CONNECTION_LOST: 0,
    },
  };

  // Ensure all alert type fields are defined
  const safeAlertStats = {
    ...alertStats,
    byType: {
      TEMPERATURE_EXCURSION: alertStats.byType?.TEMPERATURE_EXCURSION || 0,
      DEVICE_OFFLINE: alertStats.byType?.DEVICE_OFFLINE || 0,
      LOW_BATTERY: alertStats.byType?.LOW_BATTERY || 0,
      CONNECTION_LOST: alertStats.byType?.CONNECTION_LOST || 0,
    },
  };

  // Calculate key metrics
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

  const averageBattery =
    devices.length > 0
      ? devices.reduce((sum, d) => sum + d.battery, 0) / devices.length
      : 0;

  const complianceRate =
    devicesWithReadings.length > 0
      ? (inRangeDevices / devicesWithReadings.length) * 100
      : 100;

  const keyMetrics = [
    {
      title: 'Total Devices',
      value: totalDevices,
      subtitle: `${onlineDevices} online, ${offlineDevices} offline`,
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Temperature Compliance',
      value: `${complianceRate.toFixed(1)}%`,
      subtitle: `${inRangeDevices}/${devicesWithReadings.length} in range`,
      icon: Thermometer,
      color:
        complianceRate >= 95
          ? 'text-green-600'
          : complianceRate >= 80
          ? 'text-yellow-600'
          : 'text-red-600',
      bgColor:
        complianceRate >= 95
          ? 'bg-green-50'
          : complianceRate >= 80
          ? 'bg-yellow-50'
          : 'bg-red-50',
    },
    {
      title: 'System Health',
      value: `${averageBattery.toFixed(0)}%`,
      subtitle: 'Average battery level',
      icon: Battery,
      color:
        averageBattery > 50
          ? 'text-green-600'
          : averageBattery > 20
          ? 'text-yellow-600'
          : 'text-red-600',
      bgColor:
        averageBattery > 50
          ? 'bg-green-50'
          : averageBattery > 20
          ? 'bg-yellow-50'
          : 'bg-red-50',
    },
    {
      title: 'Active Alerts',
      value: safeAlertStats.unread,
      subtitle: `${safeAlertStats.critical} critical, ${safeAlertStats.warning} warning`,
      icon: AlertTriangle,
      color:
        safeAlertStats.critical > 0
          ? 'text-red-600'
          : safeAlertStats.warning > 0
          ? 'text-yellow-600'
          : 'text-green-600',
      bgColor:
        safeAlertStats.critical > 0
          ? 'bg-red-50'
          : safeAlertStats.warning > 0
          ? 'bg-yellow-50'
          : 'bg-green-50',
    },
  ];

  function handleExportReport() {
    try {
      const fromLabel = dateRange?.from
        ? dateRange.from.toISOString().slice(0, 10)
        : 'start';
      const toLabel = dateRange?.to
        ? dateRange.to.toISOString().slice(0, 10)
        : 'end';

      // no-op

      // Build workbook and helper function
      const workbook = XLSX.utils.book_new();
      const addSheet = (name: string, rows: Array<Array<unknown>>) => {
        const ws = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(workbook, ws, name);
      };

      // Filters
      const selectedDeviceName =
        selectedDevice === 'all'
          ? 'All Devices'
          : devices.find((d) => d.id === selectedDevice)?.name ||
            selectedDevice;
      const summaryRows: Array<Array<unknown>> = [];
      summaryRows.push([`Analytics Report (${fromLabel} to ${toLabel})`]);
      summaryRows.push(['Generated At', new Date().toISOString()]);
      summaryRows.push([]);
      summaryRows.push(['Filters']);
      summaryRows.push(['Selected Device', selectedDeviceName]);
      summaryRows.push(['Date Range', `${fromLabel} to ${toLabel}`]);
      summaryRows.push([]);
      summaryRows.push(['Summary']);
      summaryRows.push(['Metric', 'Value', 'Details']);
      summaryRows.push([
        'Total Devices',
        totalDevices,
        `${onlineDevices} online; ${offlineDevices} offline; ${maintenanceDevices} maintenance`,
      ]);
      summaryRows.push([
        'Temperature Compliance',
        `${complianceRate.toFixed(1)}%`,
        `${inRangeDevices}/${devicesWithReadings.length} in range`,
      ]);
      summaryRows.push([
        'Average Battery',
        `${averageBattery.toFixed(0)}%`,
        'Average across all devices',
      ]);
      summaryRows.push([
        'Alerts',
        safeAlertStats.total,
        `${safeAlertStats.critical} critical; ${safeAlertStats.warning} warning; ${safeAlertStats.resolved} resolved`,
      ]);
      summaryRows.push([]);
      summaryRows.push(['Alerts By Type']);
      summaryRows.push(['Type', 'Count']);
      summaryRows.push([
        'TEMPERATURE_EXCURSION',
        safeAlertStats.byType.TEMPERATURE_EXCURSION,
      ]);
      summaryRows.push([
        'DEVICE_OFFLINE',
        safeAlertStats.byType.DEVICE_OFFLINE,
      ]);
      summaryRows.push(['LOW_BATTERY', safeAlertStats.byType.LOW_BATTERY]);
      summaryRows.push([
        'CONNECTION_LOST',
        safeAlertStats.byType.CONNECTION_LOST,
      ]);
      addSheet('Summary', summaryRows);

      // Summary content moved to Summary sheet (XLSX)

      // Start Devices sheet
      const devicesRows: Array<Array<unknown>> = [];
      devicesRows.push([
        'Name',
        'Location',
        'Status',
        'Avg Battery %',
        'Readings',
        'Min Temp',
        'Max Temp',
        'Avg Temp',
        'In-Range % (2-8C)',
        'Warnings',
        'Criticals',
        'First Reading',
        'Last Reading',
      ]);

      // Date range helpers
      const startMs = dateRange?.from
        ? new Date(dateRange.from).setHours(0, 0, 0, 0)
        : undefined;
      const endMs = dateRange?.to
        ? new Date(dateRange.to).setHours(23, 59, 59, 999)
        : undefined;
      const isWithinRange = (iso?: string) => {
        if (!iso) return true;
        const t = new Date(iso).getTime();
        if (Number.isNaN(t)) return true;
        if (startMs !== undefined && t < startMs) return false;
        if (endMs !== undefined && t > endMs) return false;
        return true;
      };

      const devicesToReport =
        selectedDevice === 'all'
          ? devices
          : devices.filter((d) => d.id === selectedDevice);

      // Devices header handled in devicesRows
      for (const device of devicesToReport) {
        const readingsInRange = (device.readings || []).filter((r) =>
          isWithinRange(r.timestamp)
        );
        const temps = readingsInRange
          .map((r) => r.temperature)
          .filter((v) => typeof v === 'number');
        const minTemp = temps.length ? Math.min(...temps) : undefined;
        const maxTemp = temps.length ? Math.max(...temps) : undefined;
        const avgTemp = temps.length
          ? temps.reduce((a, b) => a + b, 0) / temps.length
          : undefined;
        const inRangeCount = readingsInRange.filter(
          (r) =>
            typeof r.temperature === 'number' &&
            r.temperature >= 2 &&
            r.temperature <= 8
        ).length;
        const warnings = readingsInRange.filter(
          (r) => r.status === 'WARNING'
        ).length;
        const criticals = readingsInRange.filter(
          (r) => r.status === 'CRITICAL'
        ).length;
        const firstTs = readingsInRange.length
          ? readingsInRange[0]?.timestamp || ''
          : '';
        const lastTs = readingsInRange.length
          ? readingsInRange[readingsInRange.length - 1]?.timestamp || ''
          : '';
        const avgBatteryForDevice = (() => {
          const vals = readingsInRange
            .map((r) => r.battery)
            .filter((v) => typeof v === 'number');
          if (!vals.length) return device.battery;
          return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
        })();

        devicesRows.push([
          device.name,
          device.location,
          device.status,
          avgBatteryForDevice,
          readingsInRange.length,
          minTemp === undefined ? '' : Number(minTemp).toFixed(3),
          maxTemp === undefined ? '' : Number(maxTemp).toFixed(3),
          avgTemp === undefined ? '' : Number(avgTemp).toFixed(3),
          readingsInRange.length
            ? ((inRangeCount / readingsInRange.length) * 100).toFixed(1) + '%'
            : '',
          warnings,
          criticals,
          firstTs ? new Date(firstTs).toISOString() : '',
          lastTs ? new Date(lastTs).toISOString() : '',
        ]);
      }
      addSheet('Devices', devicesRows);

      // Readings sheet
      const readingsRows: Array<Array<unknown>> = [];
      readingsRows.push([
        'Device',
        'Timestamp',
        'Temperature',
        'Battery',
        'Status',
      ]);
      for (const device of devicesToReport) {
        const sortedReadings = (device.readings || [])
          .filter((r) => isWithinRange(r.timestamp))
          .slice()
          .sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        for (const r of sortedReadings) {
          readingsRows.push([
            device.name,
            r.timestamp ? new Date(r.timestamp).toISOString() : '',
            r.temperature,
            r.battery,
            r.status,
          ]);
        }
      }
      addSheet('Readings', readingsRows);

      // Save workbook
      XLSX.writeFile(
        workbook,
        `analytics-report_${fromLabel}_to_${toLabel}.xlsx`,
        { bookType: 'xlsx', compression: true }
      );
    } catch (err) {
      console.error('Failed to export analytics report:', err);
    }
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {keyMetrics.map((metric, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  {metric.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <metric.icon className={`h-4 w-4 ${metric.color}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {metric.value}
              </div>
              <p className="text-sm text-gray-600">{metric.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Device</label>
              <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                <SelectTrigger>
                  <SelectValue placeholder="Select device" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Devices</SelectItem>
                  {devices.map((device) => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.name} ({device.location})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">
                Date Range
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange
                      ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
                      : 'Select date range'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange as any}
                    onSelect={(r: any) => {
                      if (!r) return setDateRange(undefined);
                      if (r.from && r.to) {
                        setDateRange({
                          from: r.from as Date,
                          to: r.to as Date,
                        });
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleExportReport}
              >
                <Download className="h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="temperature" className="flex items-center gap-2">
            <Thermometer className="h-4 w-4" />
            Temperature
          </TabsTrigger>
          <TabsTrigger value="devices" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Devices
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alerts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <FleetOverview
            devices={devices}
            alertStats={safeAlertStats}
            selectedDevice={selectedDevice}
            dateRange={dateRange as any as { from: Date; to: Date }}
          />
        </TabsContent>

        <TabsContent value="temperature" className="space-y-6">
          <TemperatureAnalytics
            devices={devices}
            selectedDevice={selectedDevice}
            dateRange={dateRange as any as { from: Date; to: Date }}
          />
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <DevicePerformanceAnalytics
            devices={devices}
            selectedDevice={selectedDevice}
            dateRange={dateRange as any as { from: Date; to: Date }}
          />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <AlertAnalytics
            alertStats={safeAlertStats}
            devices={devices}
            selectedDevice={selectedDevice}
            dateRange={dateRange as any}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
