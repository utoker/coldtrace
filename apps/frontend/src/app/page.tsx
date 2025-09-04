import { ConnectionStatus } from '@/components/ConnectionStatus'
import { DashboardStats } from '@/components/DashboardStats'
import { DeviceGrid } from '@/components/DeviceGrid'
import { FilterBar } from '@/components/FilterBar'
import { AlertBadge } from '@/components/AlertBadge'
import { AlertPanel } from '@/components/AlertPanel'
import { TestAlertButton } from '@/components/TestAlertButton'
import { WebSocketTest } from '@/components/WebSocketTest'

export default function Home() {
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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
        
        {/* Device Grid */}
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Device Monitoring
            </h2>
            <p className="text-sm text-gray-600">
              Real-time temperature monitoring across all registered devices
            </p>
          </div>
          
          {/* Filter and Sort Controls */}
          <FilterBar />
          
          {/* Device Grid/List */}
          <DeviceGrid />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Monitor</h3>
              <p className="text-xs text-gray-600">
                Track temperature and conditions in real-time across your cold chain infrastructure.
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Trace</h3>
              <p className="text-xs text-gray-600">
                Complete visibility from source to destination with comprehensive audit trails.
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Alert</h3>
              <p className="text-xs text-gray-600">
                Instant notifications when conditions exceed safe temperature thresholds.
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Analyze</h3>
              <p className="text-xs text-gray-600">
                Generate insights and reports to optimize your cold chain operations.
              </p>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              © 2024 ColdTrace. Professional IoT monitoring solution for cold chain management.
            </p>
          </div>
        </div>
      </footer>
      
      {/* Alert Panel */}
      <AlertPanel />
      
      {/* WebSocket Connection Test */}
      <WebSocketTest />
    </main>
  )
}