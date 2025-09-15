'use client';

import { useState, useEffect } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { useAlertStore, useAlertStats } from '@/store/useAlertStore';
import { cn } from '@/lib/utils';

interface AlertBellProps {
  className?: string;
  onClick?: () => void;
}

export function AlertBell({ className, onClick }: AlertBellProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [previousUnreadCount, setPreviousUnreadCount] = useState(0);
  const { unread, critical, unreadCritical } = useAlertStats();
  const toggleAlertPanel = useAlertStore((state) => state.toggleAlertPanel);
  const isAlertPanelOpen = useAlertStore((state) => state.isAlertPanelOpen);

  // Animate only when new alerts are added (unread count increases)
  useEffect(() => {
    if (unread > previousUnreadCount && previousUnreadCount > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
    setPreviousUnreadCount(unread);
  }, [unread, previousUnreadCount]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      toggleAlertPanel();
    }
  };

  const hasCritical = critical > 0;
  const hasUnreadCritical = unreadCritical > 0;

  return (
    <button
      onClick={handleClick}
      className={cn(
        'relative p-2 rounded-lg transition-all duration-200',
        'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        isAnimating && 'animate-pulse',
        isAlertPanelOpen && 'bg-gray-100',
        className
      )}
      aria-label={`Alerts${hasCritical ? ` (${critical} critical)` : ''}`}
    >
      {/* Bell Icon */}
      <div className="relative">
        {hasCritical ? (
          <BellRing
            className={cn(
              'h-6 w-6 transition-colors',
              hasCritical ? 'text-red-600' : 'text-orange-500'
            )}
          />
        ) : (
          <Bell className="h-6 w-6 text-gray-500" />
        )}

        {/* Notification dot for unread critical alerts */}
        {hasUnreadCritical && (
          <div className="absolute -top-2 -right-2 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </div>

      {/* Pulse effect for unread critical alerts - only when animating */}
      {hasUnreadCritical && isAnimating && (
        <div className="absolute inset-0 rounded-lg bg-red-500 opacity-20 animate-ping" />
      )}
    </button>
  );
}
