'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertTriangle,
  WifiOff,
  Battery,
  Wifi,
  CheckCircle,
  Eye,
  X,
  MapPin,
  Clock,
  User,
  Thermometer,
} from 'lucide-react';
import { Alert } from '@/store/useAlertStore';
import { useAlertOperations } from '@/hooks/useAlertOperations';
import { formatDistanceToNow } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';

interface AlertDetailModalProps {
  alert: Alert | null;
  isOpen: boolean;
  onClose: () => void;
}

const alertTypeIcons = {
  TEMPERATURE_EXCURSION: AlertTriangle,
  DEVICE_OFFLINE: WifiOff,
  LOW_BATTERY: Battery,
  CONNECTION_LOST: Wifi,
};

const alertTypeLabels = {
  TEMPERATURE_EXCURSION: 'Temperature Excursion',
  DEVICE_OFFLINE: 'Device Offline',
  LOW_BATTERY: 'Low Battery',
  CONNECTION_LOST: 'Connection Lost',
};

const alertTypeDescriptions = {
  TEMPERATURE_EXCURSION:
    'Temperature readings have exceeded safe thresholds for vaccine storage',
  DEVICE_OFFLINE: 'Device is not responding and may require maintenance',
  LOW_BATTERY: 'Device battery level is critically low and needs replacement',
  CONNECTION_LOST: 'Network connection to the device has been interrupted',
};

const severityColors = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-200',
  WARNING: 'bg-orange-100 text-orange-800 border-orange-200',
};

export function AlertDetailModal({
  alert,
  isOpen,
  onClose,
}: AlertDetailModalProps) {
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const { markAsRead, resolveAlert, deleteAlert } = useAlertOperations();

  if (!alert) return null;

  const IconComponent = alertTypeIcons[alert.type];
  const timeAgo = formatDistanceToNow(new Date(alert.createdAt), {
    addSuffix: true,
  });
  const resolvedTimeAgo = alert.resolvedAt
    ? formatDistanceToNow(new Date(alert.resolvedAt), { addSuffix: true })
    : null;

  const handleMarkAsRead = async () => {
    setIsActionLoading('read');
    try {
      await markAsRead(alert.id);
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleResolve = async () => {
    setIsActionLoading('resolve');
    try {
      await resolveAlert(alert.id, 'System User');
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleDelete = async () => {
    setIsActionLoading('delete');
    try {
      await deleteAlert(alert.id);
      onClose(); // Close modal after deletion
    } finally {
      setIsActionLoading(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div
              className={cn(
                'p-2 rounded-lg',
                alert.severity === 'CRITICAL' ? 'bg-red-50' : 'bg-orange-50'
              )}
            >
              <IconComponent
                className={cn(
                  'h-6 w-6',
                  alert.severity === 'CRITICAL'
                    ? 'text-red-600'
                    : 'text-orange-600'
                )}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span>{alert.title}</span>
                {!alert.isRead && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                )}
                {alert.isResolved && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
              </div>
              <div className="text-sm font-normal text-gray-600 mt-1">
                {alertTypeLabels[alert.type]}
              </div>
            </div>
            <Badge className={cn('text-xs', severityColors[alert.severity])}>
              {alert.severity}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Alert Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alert Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Description
                </h4>
                <p className="text-sm text-gray-600">{alert.message}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Alert Type
                </h4>
                <p className="text-sm text-gray-600">
                  {alertTypeDescriptions[alert.type]}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">
                    Created
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{timeAgo}</span>
                  </div>
                </div>

                {alert.isResolved && alert.resolvedAt && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">
                      Resolved
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{resolvedTimeAgo}</span>
                    </div>
                  </div>
                )}
              </div>

              {alert.resolvedBy && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">
                    Resolved By
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span>{alert.resolvedBy}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Device Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Device Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">
                    Device Name
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Thermometer className="h-4 w-4" />
                    <span>{alert.device.name}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">
                    Location
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{alert.device.location}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">
                  Device ID
                </h4>
                <div className="text-sm text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded">
                  {alert.device.id}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alert Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alert Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-700 font-medium">Alert ID:</span>
                  <div className="text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded mt-1">
                    {alert.id}
                  </div>
                </div>

                <div>
                  <span className="text-gray-700 font-medium">Status:</span>
                  <div className="mt-1">
                    <Badge
                      variant="outline"
                      className={cn(
                        alert.isResolved
                          ? 'text-green-700 border-green-200'
                          : alert.isRead
                          ? 'text-blue-700 border-blue-200'
                          : 'text-red-700 border-red-200'
                      )}
                    >
                      {alert.isResolved
                        ? 'Resolved'
                        : alert.isRead
                        ? 'Read'
                        : 'Unread'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              {!alert.isRead && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAsRead}
                  disabled={isActionLoading === 'read'}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  {isActionLoading === 'read' ? 'Marking...' : 'Mark as Read'}
                </Button>
              )}

              {!alert.isResolved && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResolve}
                  disabled={isActionLoading === 'resolve'}
                  className="flex items-center gap-2 text-green-600 border-green-200 hover:bg-green-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  {isActionLoading === 'resolve' ? 'Resolving...' : 'Resolve'}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={isActionLoading === 'delete'}
                className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
                {isActionLoading === 'delete' ? 'Deleting...' : 'Delete'}
              </Button>

              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
