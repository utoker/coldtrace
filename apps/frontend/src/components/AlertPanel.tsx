'use client';

import { useState, useEffect } from 'react';
import { X, Filter, Check } from 'lucide-react';
import {
  useAlertStore,
  useFilteredAlerts,
  useAlertStats,
  AlertFilterStatus,
} from '@/store/useAlertStore';
import { useAlertOperations } from '@/hooks/useAlertOperations';
import { AlertCard } from './AlertCard';
import { cn } from '@/lib/utils';

interface AlertPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const filterOptions: {
  value: AlertFilterStatus;
  label: string;
  color: string;
}[] = [
  { value: 'all', label: 'All Alerts', color: 'text-gray-600' },
  { value: 'unread', label: 'Unread', color: 'text-blue-600' },
  { value: 'critical', label: 'Critical', color: 'text-red-600' },
  { value: 'warning', label: 'Warning', color: 'text-orange-600' },
  { value: 'resolved', label: 'Resolved', color: 'text-green-600' },
];

export function AlertPanel({ isOpen, onClose }: AlertPanelProps) {
  const [showFilters, setShowFilters] = useState(false);

  // Store state
  const filteredAlerts = useFilteredAlerts();
  const stats = useAlertStats();
  const {
    filters,
    setStatusFilter,
    setSearchFilter,
    resetFilters,
    selectAlert,
  } = useAlertStore();

  // GraphQL operations
  const { markAsRead, markAllAsRead, resolveAlert, deleteAlert } =
    useAlertOperations();

  // Close panel on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleMarkAsRead = async (alertId: string) => {
    await markAsRead(alertId);
  };

  const handleResolve = async (alertId: string) => {
    await resolveAlert(alertId, 'System User'); // In real app, get from auth context
  };

  const handleDelete = async (alertId: string) => {
    await deleteAlert(alertId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleFilterChange = (status: AlertFilterStatus) => {
    setStatusFilter(status);
    setShowFilters(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchFilter(e.target.value);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50',
          'transform transition-transform duration-300 ease-in-out',
          'lg:relative lg:transform-none lg:shadow-lg lg:rounded-lg',
          'flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Alerts</h2>
            <p className="text-sm text-gray-600">
              {stats.unread} unread, {stats.critical} critical
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Mark all as read */}
            {stats.unread > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                title="Mark all as read"
              >
                <Check className="h-5 w-5" />
              </button>
            )}

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                showFilters
                  ? 'text-blue-600 bg-blue-100'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
              )}
              title="Filter alerts"
            >
              <Filter className="h-5 w-5" />
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="p-4 border-b bg-gray-50">
            {/* Search */}
            <div className="mb-3">
              <input
                type="text"
                placeholder="Search alerts..."
                value={filters.search}
                onChange={handleSearchChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Status filters */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                Status
              </label>
              <div className="grid grid-cols-2 gap-1">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterChange(option.value)}
                    className={cn(
                      'px-2 py-1 text-xs rounded-lg transition-colors text-left',
                      filters.status === option.value
                        ? 'bg-blue-100 text-blue-800'
                        : 'hover:bg-gray-100 text-gray-700'
                    )}
                  >
                    <span className={option.color}>●</span> {option.label}
                    {option.value === 'unread' && stats.unread > 0 && (
                      <span className="ml-1 text-gray-500">
                        ({stats.unread})
                      </span>
                    )}
                    {option.value === 'critical' && stats.critical > 0 && (
                      <span className="ml-1 text-gray-500">
                        ({stats.critical})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear filters */}
            {(filters.status !== 'all' || filters.search) && (
              <button
                onClick={resetFilters}
                className="mt-3 text-xs text-blue-600 hover:text-blue-800"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Alert List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <div className="text-4xl mb-2">🔔</div>
              <p className="text-sm font-medium">No alerts found</p>
              <p className="text-xs">
                {filters.status === 'all' && !filters.search
                  ? 'All systems are running normally'
                  : 'Try adjusting your filters'}
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {filteredAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  compact
                  onMarkAsRead={handleMarkAsRead}
                  onResolve={handleResolve}
                  onDelete={handleDelete}
                  onClick={selectAlert}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing {filteredAlerts.length} of {stats.total} alerts
            </span>
            <span>Last updated: now</span>
          </div>
        </div>
      </div>
    </>
  );
}
