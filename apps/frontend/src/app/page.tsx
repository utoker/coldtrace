import { Navbar } from '@/components/Navbar';
import { SimulatorControls } from '@/components/SimulatorControls';
import { MapView } from '@/components/MapView';
import { DeviceGrid } from '@/components/DeviceGrid';
import { Footer } from '@/components/Footer';
import { DashboardStats } from '@/components/DashboardStats';
import { AlertSystem } from '@/components/AlertSystem';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="text-5xl sm:text-7xl font-thin tracking-tight text-gray-900 mb-6">
              ColdTrace
            </h1>
            <p className="text-xl sm:text-2xl font-light text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Advanced cold chain monitoring for vaccine storage and
              distribution
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <DashboardStats />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 space-y-16 pb-24">
        {/* Simulator Controls */}
        <section>
          <SimulatorControls />
        </section>

        {/* Map View */}
        <section>
          <MapView />
        </section>

        {/* Device Cards */}
        <section>
          <DeviceGrid />
        </section>
      </div>

      {/* Footer */}
      <Footer />

      {/* Alert System */}
      <AlertSystem />
    </main>
  );
}
