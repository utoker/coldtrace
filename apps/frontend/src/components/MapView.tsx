'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useSubscription } from '@apollo/client/react';
import { gql } from '@apollo/client';
import dynamic from 'next/dynamic';
import { DeviceDetailModal } from './DeviceDetailModal';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MapPin, Loader2 } from 'lucide-react';

// Dynamically import the entire map component to avoid SSR issues
const DynamicMap = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <Card>
      <CardContent className="flex items-center justify-center h-[600px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading map...</span>
        </div>
      </CardContent>
    </Card>
  ),
});

// Types
interface Device {
  id: string;
  deviceId: string;
  name: string;
  location: string;
  latitude?: number;
  longitude?: number;
  battery: number;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  isActive: boolean;
  latestReading?: {
    temperature: number;
    status: 'NORMAL' | 'WARNING' | 'CRITICAL';
    timestamp: string;
  };
}

interface GetDevicesData {
  getDevices: Device[];
}

interface TemperatureUpdateData {
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
  deviceStatusChanged: Device;
}

// GraphQL Queries - Updated to include latitude/longitude
const GET_DEVICES = gql`
  query GetDevices($limit: Int) {
    getDevices(limit: $limit) {
      id
      deviceId
      name
      location
      latitude
      longitude
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
      location
      latitude
      longitude
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

export function MapView() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Fetch devices
  const { data, loading, error } = useQuery<GetDevicesData>(GET_DEVICES, {
    variables: { limit: 100 },
    errorPolicy: 'all',
  });

  // Subscribe to real-time updates
  useSubscription<TemperatureUpdateData>(TEMPERATURE_UPDATES, {
    skip: false,
    onData: ({ data }) => {
      console.log('📡 MapView: Temperature update received:', data);

      if (data?.data?.temperatureUpdates) {
        const tempUpdate = data.data.temperatureUpdates;

        // Update only the specific device's latest reading
        setDevices((prevDevices) =>
          prevDevices.map((device) =>
            device.id === tempUpdate.deviceId
              ? {
                  ...device,
                  latestReading: {
                    temperature: tempUpdate.temperature,
                    status: tempUpdate.status,
                    timestamp: tempUpdate.timestamp,
                  },
                }
              : device
          )
        );
      }
    },
  });

  // Subscribe to device status changes
  useSubscription<DeviceStatusChangedData>(DEVICE_STATUS_CHANGED, {
    skip: false,
    onData: ({ data }) => {
      console.log('📡 MapView: Device status change received:', data);

      if (data?.data?.deviceStatusChanged) {
        const updatedDevice = data.data.deviceStatusChanged;
        console.log(
          `🔄 MapView: Updating device ${updatedDevice.name} status to ${updatedDevice.status}`
        );

        // Update only the specific device in local state
        setDevices((prevDevices) => {
          const newDevices = prevDevices.map((device) =>
            device.id === updatedDevice.id
              ? { ...device, ...updatedDevice }
              : device
          );
          console.log(
            `📊 MapView: Updated devices array, changed device found: ${newDevices.some(
              (d) => d.id === updatedDevice.id
            )}`
          );
          return newDevices;
        });
      }
    },
  });

  // Update devices when data changes
  useEffect(() => {
    if (data?.getDevices) {
      setDevices(data.getDevices);
    }
  }, [data]);

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDeviceClick = useCallback((device: Device) => {
    setSelectedDevice(device);
    setIsModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedDevice(null);
  }, []);

  // Memoize filtered devices to prevent unnecessary re-renders
  const devicesWithLocation = useMemo(() => {
    return devices.filter((device) => device.latitude && device.longitude);
  }, [devices]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading devices...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-red-600">
          Error loading devices: {error.message}
        </div>
      </div>
    );
  }

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Initializing map...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Device Map</CardTitle>
              <CardDescription>
                {devicesWithLocation.length} devices with location data
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>Normal</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
              <span>Warning</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span>Critical</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
              <span>Offline</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <DynamicMap
          key="map-component"
          devices={devicesWithLocation}
          onDeviceClick={handleDeviceClick}
        />
      </CardContent>

      {/* Device Detail Modal */}
      {selectedDevice && (
        <DeviceDetailModal
          device={selectedDevice}
          isOpen={isModalOpen}
          onClose={handleModalClose}
        />
      )}
    </Card>
  );
}
