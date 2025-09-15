'use client';

import { useEffect, useRef, useState, useMemo, memo } from 'react';

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

    // Utility function to create device hash for change detection
    const createDeviceHash = useMemo(
      () => (device: Device) =>
        `${device.id}-${device.latitude}-${device.longitude}-${device.status}-${
          device.latestReading?.status || ''
        }-${device.battery}`,
      []
    );

    // Create a stable hash of devices to prevent unnecessary updates
    const devicesHash = useMemo(
      () => devices.map(createDeviceHash).join('|'),
      [devices, createDeviceHash]
    );

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

          // Import CSS and inject custom styles
          if (typeof window !== 'undefined') {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            if (!document.querySelector(`link[href="${link.href}"]`)) {
              document.head.appendChild(link);
            }

            // Inject custom map styles
            if (!document.querySelector('#map-component-styles')) {
              const style = document.createElement('style');
              style.id = 'map-component-styles';
              style.textContent = `
                .leaflet-container,
                .leaflet-map-pane,
                .leaflet-tile-pane,
                .leaflet-overlay-pane,
                .leaflet-shadow-pane,
                .leaflet-marker-pane,
                .leaflet-tooltip-pane,
                .leaflet-popup-pane,
                .leaflet-control-container {
                  z-index: 1 !important;
                }
                .leaflet-popup {
                  z-index: 2 !important;
                }
                .device-marker {
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                }
                .device-popup {
                  padding: 8px;
                  min-width: 200px;
                }
                .popup-title {
                  font-weight: 600;
                  color: #111827;
                  margin: 0 0 4px 0;
                }
                .popup-location {
                  font-size: 14px;
                  color: #6b7280;
                  margin: 0 0 8px 0;
                }
                .popup-details {
                  font-size: 14px;
                  line-height: 1.5;
                }
                .popup-row {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 4px;
                }
                .popup-button {
                  margin-top: 8px;
                  width: 100%;
                  background-color: #2563eb;
                  color: white;
                  padding: 4px 12px;
                  border-radius: 4px;
                  border: none;
                  font-size: 14px;
                  cursor: pointer;
                  transition: background-color 0.2s;
                }
                .popup-button:hover {
                  background-color: #1d4ed8;
                }
              `;
              document.head.appendChild(style);
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
            scrollWheelZoom: false,
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

          // Device status color mapping
          const getDeviceStatusColor = (device: Device): string => {
            if (device.status === 'OFFLINE') return '#6b7280'; // gray
            if (device.status === 'MAINTENANCE') return '#f59e0b'; // yellow
            if (device.latestReading?.status === 'CRITICAL') return '#ef4444'; // red
            if (device.latestReading?.status === 'WARNING') return '#f59e0b'; // orange
            return '#10b981'; // green - normal
          };

          // Create custom icons based on device status
          const createIcon = (device: Device) => {
            const color = getDeviceStatusColor(device);

            return L.divIcon({
              html: `<div class="device-marker" style="background-color: ${color}"></div>`,
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

              // Create popup content with cleaner structure
              const createPopupContent = (device: Device): string => {
                const getStatusColor = (status: string) => {
                  switch (status) {
                    case 'ONLINE':
                      return '#059669';
                    case 'OFFLINE':
                      return '#dc2626';
                    default:
                      return '#d97706';
                  }
                };

                const getTemperatureColor = (status?: string) => {
                  switch (status) {
                    case 'CRITICAL':
                      return '#dc2626';
                    case 'WARNING':
                      return '#ea580c';
                    default:
                      return '#059669';
                  }
                };

                const temperatureSection = device.latestReading
                  ? `<div class="popup-row">
                       <span>Temperature:</span>
                       <span style="font-weight: 500; color: ${getTemperatureColor(
                         device.latestReading.status
                       )};">
                         ${device.latestReading.temperature.toFixed(1)}°C
                       </span>
                     </div>`
                  : '';

                return `
                  <div class="device-popup">
                    <h3 class="popup-title">${device.name}</h3>
                    <p class="popup-location">${device.location}</p>
                    <div class="popup-details">
                      <div class="popup-row">
                        <span>Status:</span>
                        <span style="font-weight: 500; color: ${getStatusColor(
                          device.status
                        )};">
                          ${device.status}
                        </span>
                      </div>
                      ${temperatureSection}
                      <div class="popup-row">
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
                      class="popup-button"
                    >
                      View Details
                    </button>
                  </div>
                `;
              };

              const popupContent = createPopupContent(device);

              marker.bindPopup(popupContent);
              marker.addTo(map);
              markersRef.current.set(device.id, marker);
            }
          });

          // Fit bounds to show all markers
          if (devices.length > 0) {
            const markerArray = Array.from(
              markersRef.current.values()
            ) as L.Marker[];
            // Only fit bounds if there are valid markers
            if (markerArray.length > 0) {
              const group = L.featureGroup(markerArray);
              const bounds = group.getBounds();
              if (bounds.isValid()) {
                map.fitBounds(bounds.pad(0.1));
              }
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
          className="rounded-lg border overflow-hidden"
          style={{ height: '600px' }}
        >
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-destructive mb-2">
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
              <p className="text-destructive font-medium">Map failed to load</p>
              <p className="text-sm text-muted-foreground mt-1">{mapError}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
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
        className="rounded-lg border overflow-hidden relative"
        style={{ height: '600px' }}
      >
        <div
          ref={mapRef}
          style={{ height: '100%', width: '100%', zIndex: 1 }}
          className="leaflet-container"
        />
        {!isMapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading map...</span>
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    if (prevProps.devices.length !== nextProps.devices.length) {
      return false;
    }

    // Create hash function for consistent comparison
    const createHash = (device: Device) =>
      `${device.id}-${device.latitude}-${device.longitude}-${device.status}-${
        device.latestReading?.status || ''
      }-${device.battery}`;

    // Compare device hashes
    const prevHash = prevProps.devices.map(createHash).join('|');
    const nextHash = nextProps.devices.map(createHash).join('|');

    return prevHash === nextHash; // memo returns true to skip re-render
  }
);

export default MapComponent;
