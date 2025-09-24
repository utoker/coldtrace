import { Navbar } from '@/components/Navbar';
import { SimulatorControls } from '@/components/SimulatorControls';
import { MapView } from '@/components/MapView';
import { DeviceGrid } from '@/components/DeviceGrid';
import { Footer } from '@/components/Footer';
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 space-y-16 p-24">
        {/* Map and Controls Side-by-Side */}
        <section>
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-apple border border-white/20 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3 h-[600px]">
              <div className="lg:col-span-2 border-r border-gray-100/50">
                <MapView />
              </div>
              <div className="lg:col-span-1">
                <SimulatorControls />
              </div>
            </div>
          </div>
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
