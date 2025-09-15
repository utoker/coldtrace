'use client';

import { Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Navbar() {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString());
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="glass-effect border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div>
              <h1 className="text-2xl font-light tracking-wide text-gray-900">
                ColdTrace
              </h1>
            </div>
            <div className="hidden lg:flex items-center space-x-6">
              <span className="text-sm font-medium text-gray-600">
                Dashboard
              </span>
              <span className="text-sm font-medium text-gray-400">
                Analytics
              </span>
              <span className="text-sm font-medium text-gray-400">
                Settings
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span className="font-mono">{currentTime}</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
