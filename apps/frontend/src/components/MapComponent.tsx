'use client';

import { useEffect, useRef, useState, useMemo, useCallback, memo } from 'react';

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

interface MapComponentProps {
  devices: Device[];
  onDeviceClick: (device: Device) => void;
}

const MapComponent = memo(
  function MapComponent({ devices, onDeviceClick }: MapComponentProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMapRef = useRef<any>(null);
    const markersRef = useRef<Map<string, any>>(new Map());
    const [isMapReady, setIsMapReady] = useState(false);
    const [mapError, setMapError] = useState<string | null>(null);
    const initializingRef = useRef(false);
    const lastDevicesHashRef = useRef<string>('');

    // Create a stable hash of devices to prevent unnecessary updates
    const devicesHash = useMemo(() => {
      return devices
        .map(
          (d) =>
            `${d.id}-${d.latitude}-${d.longitude}-${d.status}-${
              d.latestReading?.status || ''
            }-${d.battery}`
        )
        .join('|');
    }, [devices]);

    // Initialize map
    useEffect(() => {
      if (!mapRef.current || leafletMapRef.current || initializingRef.current)
        return;

      initializingRef.current = true;

      const initMap = async () => {
        try {
          setMapError(null);
          // Import Leaflet dynamically
          const L = await import('leaflet');

          // Import CSS
          if (typeof window !== 'undefined') {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            if (!document.querySelector(`link[href="${link.href}"]`)) {
              document.head.appendChild(link);
            }
          }

          // Fix default markers
          delete (L.Icon.Default.prototype as any)._getIconUrl;
          L.Icon.Default.mergeOptions({
            iconRetinaUrl:
              'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
            iconUrl:
              'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
            shadowUrl:
              'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          });

          // Create map
          const map = L.map(mapRef.current!, {
            center: [27.9506, -82.4572], // Tampa Bay area
            zoom: 10,
            zoomControl: true,
            scrollWheelZoom: true,
            doubleClickZoom: true,
            dragging: true,
          });

          // Add tile layer
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          }).addTo(map);

          leafletMapRef.current = map;
          setIsMapReady(true);
        } catch (error) {
          console.error('Error initializing map:', error);
          setMapError(
            error instanceof Error ? error.message : 'Failed to initialize map'
          );
        } finally {
          initializingRef.current = false;
        }
      };

      initMap();

      // Cleanup
      return () => {
        if (leafletMapRef.current) {
          leafletMapRef.current.remove();
          leafletMapRef.current = null;
          markersRef.current.clear();
          setIsMapReady(false);
        }
      };
    }, []);

    // Update markers when devices actually change (based on hash)
    useEffect(() => {
      if (!isMapReady || !leafletMapRef.current) return;

      // Only update if devices actually changed
      if (devicesHash === lastDevicesHashRef.current) return;
      lastDevicesHashRef.current = devicesHash;

      const updateMarkers = async () => {
        try {
          const L = await import('leaflet');
          const map = leafletMapRef.current;

          // Clear existing markers
          markersRef.current.forEach((marker) => {
            map.removeLayer(marker);
          });
          markersRef.current.clear();

          // Create custom icons based on device status
          const createIcon = (device: Device) => {
            let color = '#10b981'; // green - normal

            if (device.status === 'OFFLINE') {
              color = '#6b7280'; // gray
            } else if (device.status === 'MAINTENANCE') {
              color = '#f59e0b'; // yellow
            } else if (device.latestReading?.status === 'CRITICAL') {
              color = '#ef4444'; // red
            } else if (device.latestReading?.status === 'WARNING') {
              color = '#f59e0b'; // orange
            }

            return L.divIcon({
              html: `
              <div style="
                background-color: ${color};
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              "></div>
            `,
              className: 'custom-marker',
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            });
          };

          // Add markers for each device
          devices.forEach((device) => {
            if (device.latitude && device.longitude) {
              const marker = L.marker([device.latitude, device.longitude], {
                icon: createIcon(device),
              });

              // Create popup content
              const popupContent = `
              <div style="padding: 8px; min-width: 200px;">
                <h3 style="font-weight: 600; color: #111827; margin: 0 0 4px 0;">${
                  device.name
                }</h3>
                <p style="font-size: 14px; color: #6b7280; margin: 0 0 8px 0;">${
                  device.location
                }</p>
                <div style="font-size: 14px; line-height: 1.5;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span>Status:</span>
                    <span style="font-weight: 500; color: ${
                      device.status === 'ONLINE'
                        ? '#059669'
                        : device.status === 'OFFLINE'
                        ? '#dc2626'
                        : '#d97706'
                    };">
                      ${device.status}
                    </span>
                  </div>
                  ${
                    device.latestReading
                      ? `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                      <span>Temperature:</span>
                      <span style="font-weight: 500; color: ${
                        device.latestReading.status === 'CRITICAL'
                          ? '#dc2626'
                          : device.latestReading.status === 'WARNING'
                          ? '#ea580c'
                          : '#059669'
                      };">
                        ${device.latestReading.temperature.toFixed(1)}°C
                      </span>
                    </div>
                  `
                      : ''
                  }
                  <div style="display: flex; justify-content: space-between;">
                    <span>Battery:</span>
                    <span style="font-weight: 500; color: ${
                      device.battery > 20 ? '#059669' : '#dc2626'
                    };">
                      ${device.battery}%
                    </span>
                  </div>
                </div>
                <button 
                  onclick="window.handleDeviceClick('${device.id}')"
                  style="
                    margin-top: 8px;
                    width: 100%;
                    background-color: #2563eb;
                    color: white;
                    padding: 4px 12px;
                    border-radius: 4px;
                    border: none;
                    font-size: 14px;
                    cursor: pointer;
                  "
                  onmouseover="this.style.backgroundColor='#1d4ed8'"
                  onmouseout="this.style.backgroundColor='#2563eb'"
                >
                  View Details
                </button>
              </div>
            `;

              marker.bindPopup(popupContent);
              marker.addTo(map);
              markersRef.current.set(device.id, marker);
            }
          });

          // Fit bounds to show all markers
          if (devices.length > 0) {
            const group = new L.featureGroup(
              Array.from(markersRef.current.values())
            );
            if (group.getBounds().isValid()) {
              map.fitBounds(group.getBounds().pad(0.1));
            }
          }
        } catch (error) {
          console.error('Error updating markers:', error);
        }
      };

      updateMarkers();
    }, [devicesHash, isMapReady]);

    // Set up global click handler for popup buttons
    useEffect(() => {
      if (typeof window !== 'undefined') {
        (window as any).handleDeviceClick = (deviceId: string) => {
          const device = devices.find((d) => d.id === deviceId);
          if (device) {
            onDeviceClick(device);
          }
        };
      }

      return () => {
        if (typeof window !== 'undefined') {
          delete (window as any).handleDeviceClick;
        }
      };
    }, [devices, onDeviceClick]);

    if (mapError) {
      return (
        <div
          className="bg-white rounded-lg shadow overflow-hidden"
          style={{ height: '600px' }}
        >
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-red-600 mb-2">
                <svg
                  className="w-8 h-8 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-red-600 font-medium">Map failed to load</p>
              <p className="text-sm text-gray-500 mt-1">{mapError}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className="bg-white rounded-lg shadow overflow-hidden relative"
        style={{ height: '600px' }}
      >
        <div
          ref={mapRef}
          style={{ height: '100%', width: '100%' }}
          className="leaflet-container"
        />
        {!isMapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading map...</span>
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    if (prevProps.devices.length !== nextProps.devices.length) {
      console.log('🗺️ MapComponent: Re-rendering due to device count change');
      return false;
    }

    // Compare device hashes
    const prevHash = prevProps.devices
      .map(
        (d) =>
          `${d.id}-${d.latitude}-${d.longitude}-${d.status}-${
            d.latestReading?.status || ''
          }-${d.battery}`
      )
      .join('|');
    const nextHash = nextProps.devices
      .map(
        (d) =>
          `${d.id}-${d.latitude}-${d.longitude}-${d.status}-${
            d.latestReading?.status || ''
          }-${d.battery}`
      )
      .join('|');

    const shouldUpdate = prevHash !== nextHash;
    if (shouldUpdate) {
      console.log('🗺️ MapComponent: Re-rendering due to device data change');
      console.log('Previous hash:', prevHash.substring(0, 100) + '...');
      console.log('Next hash:', nextHash.substring(0, 100) + '...');
    }

    return !shouldUpdate; // memo returns true to skip re-render
  }
);

export default MapComponent;
