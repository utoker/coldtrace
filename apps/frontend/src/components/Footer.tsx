export function Footer() {
  return (
    <footer className="bg-gradient-to-t from-gray-50 to-white border-t border-gray-100 mt-24">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
              <span className="text-white font-semibold text-lg">M</span>
            </div>
            <h3 className="text-lg font-light text-gray-900">Monitor</h3>
            <p className="text-gray-600 leading-relaxed">
              Track temperature and conditions in real-time across your cold
              chain infrastructure.
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4">
              <span className="text-white font-semibold text-lg">T</span>
            </div>
            <h3 className="text-lg font-light text-gray-900">Trace</h3>
            <p className="text-gray-600 leading-relaxed">
              Complete visibility from source to destination with comprehensive
              audit trails.
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mb-4">
              <span className="text-white font-semibold text-lg">A</span>
            </div>
            <h3 className="text-lg font-light text-gray-900">Alert</h3>
            <p className="text-gray-600 leading-relaxed">
              Instant notifications when conditions exceed safe temperature
              thresholds.
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4">
              <span className="text-white font-semibold text-lg">A</span>
            </div>
            <h3 className="text-lg font-light text-gray-900">Analyze</h3>
            <p className="text-gray-600 leading-relaxed">
              Generate insights and reports to optimize your cold chain
              operations.
            </p>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-200 text-center">
          <p className="text-gray-500 font-light">
            © 2024 ColdTrace. Professional cold chain monitoring solution.
          </p>
        </div>
      </div>
    </footer>
  );
}
