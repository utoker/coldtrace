'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';
import dynamic from 'next/dynamic';
import { DeviceDetailModal } from './DeviceDetailModal';
import { MapPin, Loader2 } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { useDeviceStore } from '@/store/useDeviceStore';

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

export function MapView() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Use Zustand store for devices and selected device
  const devices = useDeviceStore((state) => state.devices);
  const selectedDevice = useDeviceStore((state) => state.selectedDevice);
  const selectDevice = useDeviceStore((state) => state.selectDevice);
  const setDevices = useDeviceStore((state) => state.setDevices);

  // Fetch devices - initial load only, real-time updates handled by DeviceGrid subscriptions
  const { data, loading, error } = useQuery<GetDevicesData>(GET_DEVICES, {
    variables: { limit: 100 },
    errorPolicy: 'all',
  });

  // Sync initial data with store
  useEffect(() => {
    if (data?.getDevices) {
      // Only update store if it's empty or we have fresher data
      if (devices.length === 0) {
        setDevices(data.getDevices);
      }
    }
  }, [data, devices.length, setDevices]);

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDeviceClick = useCallback(
    (device: Device) => {
      selectDevice(device); // Update global store only
    },
    [selectDevice]
  );

  const handleViewDetails = useCallback(
    (device: Device) => {
      selectDevice(device); // Update global store
      setIsModalOpen(true); // Open modal
    },
    [selectDevice]
  );

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    selectDevice(null); // Clear global selection
  }, [selectDevice]);

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
    <div className="h-full flex flex-col overflow-hidden">
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

      <div className="flex-1 p-0 overflow-hidden relative">
        <DynamicMap
          devices={devicesWithLocation}
          onDeviceClick={handleDeviceClick}
          onViewDetails={handleViewDetails}
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
