'use client';

import { useMutation } from '@apollo/client/react';
import {
  MARK_ALERT_AS_READ,
  MARK_MULTIPLE_ALERTS_AS_READ,
  RESOLVE_ALERT,
  DELETE_ALERT,
} from '@/graphql/alerts';
import { useAlertStore } from '@/store/useAlertStore';
import { toast } from 'sonner';

/**
 * Hook for alert operations without subscriptions
 * Use this when you only need to perform operations on alerts
 * without setting up subscriptions (to avoid duplicate subscriptions)
 */
export function useAlertOperations() {
  // Mutations
  const [markAsReadMutation] = useMutation(MARK_ALERT_AS_READ);
  const [markMultipleAsReadMutation] = useMutation(
    MARK_MULTIPLE_ALERTS_AS_READ
  );
  const [resolveAlertMutation] = useMutation(RESOLVE_ALERT);
  const [deleteAlertMutation] = useMutation(DELETE_ALERT);

  // Helper functions
  const markAsRead = async (alertId: string) => {
    try {
      await markAsReadMutation({
        variables: { id: alertId },
      });
      // Don't update store optimistically - let the subscription handle it
    } catch (error) {
      console.error('Error marking alert as read:', error);
      toast.error('Failed to mark alert as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadAlerts = useAlertStore
        .getState()
        .alerts.filter((alert) => !alert.isRead);
      const alertIds = unreadAlerts.map((alert) => alert.id);

      if (alertIds.length === 0) return;

      await markMultipleAsReadMutation({
        variables: { ids: alertIds },
      });

      // Don't update store optimistically - let the subscription handle it
      toast.success(`Marked ${alertIds.length} alerts as read`);
    } catch (error) {
      console.error('Error marking alerts as read:', error);
      toast.error('Failed to mark alerts as read');
    }
  };

  const resolveAlert = async (alertId: string, resolvedBy?: string) => {
    try {
      await resolveAlertMutation({
        variables: { id: alertId, resolvedBy },
      });
      // Don't update store optimistically - let the subscription handle it
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error('Failed to resolve alert');
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      await deleteAlertMutation({
        variables: { id: alertId },
      });
      // Don't update store optimistically - let the subscription handle it
      toast.success('Alert deleted');
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast.error('Failed to delete alert');
    }
  };

  return {
    markAsRead,
    markAllAsRead,
    resolveAlert,
    deleteAlert,
  };
}
