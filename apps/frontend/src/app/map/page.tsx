import { MapView } from '@/components/MapView';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { DashboardStats } from '@/components/DashboardStats';
import { AlertBadge } from '@/components/AlertBadge';
import { AlertPanel } from '@/components/AlertPanel';
import { TestAlertButton } from '@/components/TestAlertButton';
import { WebSocketTest } from '@/components/WebSocketTest';
import { SimulatorControls } from '@/components/SimulatorControls';
import Link from 'next/link';

export default function MapPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  ColdTrace IoT Dashboard
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Real-time cold chain monitoring and device management
                </p>
              </div>
              <div className="hidden sm:block">
                <AlertBadge />
              </div>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              <div className="block sm:hidden">
                <AlertBadge />
              </div>
              <TestAlertButton />
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Last updated: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Connection Status */}
        <ConnectionStatus />

        {/* Dashboard Statistics */}
        <DashboardStats />

        {/* Simulator Controls */}
        <div className="mb-8">
          <SimulatorControls />
        </div>

        {/* Device Monitoring Section */}
        <div className="mb-8">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                  Device Monitoring
                </h2>
                <p className="text-sm text-gray-600">
                  Real-time temperature monitoring across all registered devices
                </p>
              </div>

              {/* View Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <Link
                  href="/"
                  className="px-4 py-2 text-sm font-medium rounded-md text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                      />
                    </svg>
                    Grid View
                  </div>
                </Link>
                <Link
                  href="/map"
                  className="px-4 py-2 text-sm font-medium rounded-md bg-white text-gray-900 shadow-sm"
                >
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Map View
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Map View */}
          <MapView />
        </div>
      </div>

      {/* Alert Panel */}
      <AlertPanel />

      {/* WebSocket Connection Test */}
      <WebSocketTest />
    </main>
  );
}
