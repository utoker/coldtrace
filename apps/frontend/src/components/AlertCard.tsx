'use client';

import { formatDistanceToNow } from '@/lib/dateUtils';
import {
  AlertTriangle,
  WifiOff,
  Battery,
  Wifi,
  CheckCircle,
  Eye,
  X,
} from 'lucide-react';
import { Alert } from '@/store/useAlertStore';
import { cn } from '@/lib/utils';

interface AlertCardProps {
  alert: Alert;
  onMarkAsRead?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
  onDelete?: (alertId: string) => void;
  onClick?: (alert: Alert) => void;
  compact?: boolean;
}

const alertTypeIcons = {
  TEMPERATURE_EXCURSION: AlertTriangle,
  DEVICE_OFFLINE: WifiOff,
  LOW_BATTERY: Battery,
  CONNECTION_LOST: Wifi,
};

const alertTypeColors = {
  TEMPERATURE_EXCURSION: {
    CRITICAL: 'text-red-600 bg-red-50 border-red-200',
    WARNING: 'text-orange-600 bg-orange-50 border-orange-200',
  },
  DEVICE_OFFLINE: {
    CRITICAL: 'text-gray-600 bg-gray-50 border-gray-200',
    WARNING: 'text-gray-600 bg-gray-50 border-gray-200',
  },
  LOW_BATTERY: {
    CRITICAL: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    WARNING: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  },
  CONNECTION_LOST: {
    CRITICAL: 'text-blue-600 bg-blue-50 border-blue-200',
    WARNING: 'text-blue-600 bg-blue-50 border-blue-200',
  },
};

export function AlertCard({
  alert,
  onMarkAsRead,
  onResolve,
  onDelete,
  onClick,
  compact = false,
}: AlertCardProps) {
  const IconComponent = alertTypeIcons[alert.type];
  const colorClasses = alertTypeColors[alert.type][alert.severity];
  const timeAgo = formatDistanceToNow(new Date(alert.createdAt), {
    addSuffix: true,
  });

  const handleCardClick = () => {
    if (onClick) {
      onClick(alert);
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMarkAsRead) {
      onMarkAsRead(alert.id);
    }
  };

  const handleResolve = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onResolve) {
      onResolve(alert.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(alert.id);
    }
  };

  if (compact) {
    return (
      <div
        onClick={handleCardClick}
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border transition-all duration-200',
          'hover:shadow-md cursor-pointer',
          colorClasses,
          !alert.isRead && 'ring-2 ring-blue-200 ring-opacity-50',
          alert.isResolved && 'opacity-60'
        )}
      >
        <div className="flex-shrink-0">
          <IconComponent className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium truncate">{alert.title}</h4>
            {!alert.isRead && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
            )}
            {alert.isResolved && (
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {alert.device.name} • {timeAgo}
          </p>
        </div>

        <div className="flex items-center gap-1">
          {!alert.isRead && onMarkAsRead && (
            <button
              onClick={handleMarkAsRead}
              className="p-1 rounded hover:bg-white/50 transition-colors"
              title="Mark as read"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}

          {!alert.isResolved && onResolve && (
            <button
              onClick={handleResolve}
              className="p-1 rounded hover:bg-white/50 transition-colors"
              title="Resolve alert"
            >
              <CheckCircle className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        'p-4 rounded-lg border transition-all duration-200',
        'hover:shadow-lg cursor-pointer',
        colorClasses,
        !alert.isRead && 'ring-2 ring-blue-200 ring-opacity-50',
        alert.isResolved && 'opacity-60'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <IconComponent className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">{alert.title}</h3>
              {!alert.isRead && (
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
              )}
              {alert.isResolved && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
              <span>{alert.device.name}</span>
              <span>•</span>
              <span>{alert.device.location}</span>
              <span>•</span>
              <span>{timeAgo}</span>
            </div>
          </div>
        </div>

        {/* Severity badge */}
        <div
          className={cn(
            'px-2 py-1 rounded-full text-xs font-medium',
            alert.severity === 'CRITICAL'
              ? 'bg-red-100 text-red-800'
              : 'bg-orange-100 text-orange-800'
          )}
        >
          {alert.severity}
        </div>
      </div>

      {/* Message */}
      <p className="text-sm text-gray-700 mb-4">{alert.message}</p>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Alert ID: {alert.id.slice(-8)}</span>
          {alert.isResolved && alert.resolvedAt && (
            <>
              <span>•</span>
              <span>
                Resolved{' '}
                {formatDistanceToNow(new Date(alert.resolvedAt), {
                  addSuffix: true,
                })}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!alert.isRead && onMarkAsRead && (
            <button
              onClick={handleMarkAsRead}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-white/50 transition-colors"
            >
              <Eye className="h-3 w-3" />
              Mark Read
            </button>
          )}

          {!alert.isResolved && onResolve && (
            <button
              onClick={handleResolve}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-white/50 transition-colors"
            >
              <CheckCircle className="h-3 w-3" />
              Resolve
            </button>
          )}

          {onDelete && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-red-100 text-red-600 transition-colors"
            >
              <X className="h-3 w-3" />
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
