'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery, useSubscription } from '@apollo/client/react';
import { gql } from '@apollo/client';
import dynamic from 'next/dynamic';
import { DeviceDetailModal } from './DeviceDetailModal';

// Dynamically import the entire map component to avoid SSR issues
const DynamicMap = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div
      className="bg-white rounded-lg shadow overflow-hidden"
      style={{ height: '600px' }}
    >
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading map...</span>
      </div>
    </div>
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
  const { data, loading, error, refetch } = useQuery<GetDevicesData>(
    GET_DEVICES,
    {
      variables: { limit: 100 },
      errorPolicy: 'all',
    }
  );

  // Debounce refetch to prevent excessive updates
  const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedRefetch = useCallback(() => {
    if (refetchTimeoutRef.current) {
      clearTimeout(refetchTimeoutRef.current);
    }

    refetchTimeoutRef.current = setTimeout(() => {
      refetch();
    }, 1000); // Wait 1 second after the last update
  }, [refetch]);

  // Subscribe to real-time updates
  useSubscription(TEMPERATURE_UPDATES, {
    skip: false,
    onData: ({ data }) => {
      console.log('📡 MapView: Temperature update received:', data);

      if (data?.temperatureUpdates) {
        const tempUpdate = data.temperatureUpdates;

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
  useSubscription(DEVICE_STATUS_CHANGED, {
    skip: false,
    onData: ({ data }) => {
      console.log('📡 MapView: Device status change received:', data);

      if (data?.deviceStatusChanged) {
        const updatedDevice = data.deviceStatusChanged;
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

    // Cleanup timeout on unmount
    return () => {
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
      }
    };
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
    <div className="w-full h-full">
      {/* Map Header */}
      <div className="bg-white rounded-lg shadow mb-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Device Map</h2>
            <p className="text-sm text-gray-600">
              {devicesWithLocation.length} devices with location data
            </p>
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

      {/* Dynamic Map Component */}
      <DynamicMap
        key="map-component" // Prevent remounting
        devices={devicesWithLocation}
        onDeviceClick={handleDeviceClick}
      />

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
