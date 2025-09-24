'use client';
import { Navbar } from '@/components/Navbar';
import { AlertSystem } from '@/components/AlertSystem';
import dynamic from 'next/dynamic';

const AnalyticsDashboard = dynamic(
  () =>
    import('@/components/AnalyticsDashboard').then((m) => m.AnalyticsDashboard),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-6 rounded-xl bg-white/60 border border-white/20"
            >
              <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
              <div className="h-8 w-16 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-32 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        <div className="p-6 rounded-xl bg-white/60 border border-white/20">
          <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
          <div className="h-64 w-full bg-gray-200 rounded" />
        </div>
      </div>
    ),
  }
);

export default function AnalyticsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navbar */}
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-light tracking-tight text-gray-900 mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Comprehensive insights into your cold chain monitoring system
          </p>
        </div>
        <AnalyticsDashboard />
      </div>

      {/* Alert System */}
      <AlertSystem />
    </main>
  );
}
