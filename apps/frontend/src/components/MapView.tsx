'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useSubscription } from '@apollo/client/react';
import { gql } from '@apollo/client';
import dynamic from 'next/dynamic';
import { DeviceDetailModal } from './DeviceDetailModal';
import { MapPin, Loader2 } from 'lucide-react';
import { Card, CardContent } from './ui/card';

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
        console.log(
          '🌡️ MapView: Processing temperature update for device:',
          tempUpdate.deviceId,
          'Status:',
          tempUpdate.status,
          'Temp:',
          tempUpdate.temperature
        );

        // Update only the specific device's latest reading
        setDevices((prevDevices) => {
          const updatedDevices = prevDevices.map((device) => {
            if (device.id === tempUpdate.deviceId) {
              console.log(
                '🔄 MapView: Updating device',
                device.name,
                'from',
                device.latestReading?.status,
                'to',
                tempUpdate.status
              );
              return {
                ...device,
                latestReading: {
                  temperature: tempUpdate.temperature,
                  status: tempUpdate.status,
                  timestamp: tempUpdate.timestamp,
                },
              };
            }
            return device;
          });
          console.log(
            '📊 MapView: Updated devices array, devices with critical status:',
            updatedDevices.filter((d) => d.latestReading?.status === 'CRITICAL')
              .length
          );
          return updatedDevices;
        });
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
          const newDevices = prevDevices.map((device) => {
            if (device.id === updatedDevice.id) {
              // Preserve the latestReading from temperature updates
              const preservedLatestReading = device.latestReading;
              const mergedDevice = { ...device, ...updatedDevice };

              // If we have a preserved latestReading, use it instead of the one from updatedDevice
              if (preservedLatestReading) {
                mergedDevice.latestReading = preservedLatestReading;
              }

              console.log(
                `🔄 MapView: Merging device ${updatedDevice.name} status to ${updatedDevice.status}, preserving latestReading:`,
                preservedLatestReading
              );

              return mergedDevice;
            }
            return device;
          });
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

  // Update devices when query data changes, but preserve any newer latestReading
  useEffect(() => {
    if (data?.getDevices) {
      setDevices((prev) => {
        if (prev.length === 0) return data.getDevices;

        const prevById = new Map(prev.map((d) => [d.id, d] as const));
        return data.getDevices.map((incoming) => {
          const existing = prevById.get(incoming.id);
          if (!existing) return incoming;

          const existingReading = existing.latestReading;
          const incomingReading = incoming.latestReading;

          // Decide which latestReading to keep (prefer the newer timestamp if both exist)
          let mergedLatestReading = incomingReading;
          if (existingReading) {
            if (
              !incomingReading ||
              new Date(existingReading.timestamp).getTime() >=
                new Date(incomingReading.timestamp).getTime()
            ) {
              mergedLatestReading = existingReading;
            }
          }

          const merged: Device = { ...incoming } as Device;
          if (mergedLatestReading) {
            // Only set latestReading when we have a value to avoid setting undefined
            (merged as any).latestReading = mergedLatestReading;
          }
          return merged;
        });
      });
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
    return devices.filter(
      (device) => device.latitude != null && device.longitude != null
    );
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
    <div className="h-full flex flex-col">
      <div className="px-8 py-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-light text-gray-900">Device Map</h3>
              <p className="text-gray-600 text-sm mt-1">
                {devicesWithLocation.length} devices with location data
              </p>
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
      </div>

      <div className="flex-1 p-0">
        <DynamicMap
          devices={devicesWithLocation}
          onDeviceClick={handleDeviceClick}
        />
      </div>

      {/* Device Detail Modal */}
      {selectedDevice && (
        <DeviceDetailModal
          device={selectedDevice}
          isOpen={isModalOpen}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
