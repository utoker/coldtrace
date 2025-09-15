'use client';

import { useEffect } from 'react';
import { useQuery, useSubscription } from '@apollo/client/react';
import { useAlertStore } from '@/store/useAlertStore';
import {
  GET_ALERTS,
  GET_UNREAD_ALERT_COUNT,
  ALERT_CREATED,
  ALERT_UPDATED,
  ALERT_RESOLVED,
  ALERT_DELETED,
} from '@/graphql/alerts';
import { toast } from 'sonner';

export function useAlerts() {
  const { setAlerts, addAlert, updateAlert, removeAlert, filters } =
    useAlertStore();

  // Query alerts
  const {
    data: alertsData,
    loading,
    error,
    refetch,
  } = useQuery(GET_ALERTS, {
    variables: {
      deviceId: filters.deviceId,
      unreadOnly: filters.status === 'unread',
      limit: 100,
    },
    pollInterval: 30000, // Poll every 30 seconds as fallback
    errorPolicy: 'all',
  });

  // Sync alerts with store
  useEffect(() => {
    if (alertsData?.getAlerts) {
      setAlerts(alertsData.getAlerts);
    }
  }, [alertsData, setAlerts]);

  // Subscribe to new alerts
  useSubscription(ALERT_CREATED, {
    onData: ({ data: subscriptionData }) => {
      if (subscriptionData?.data?.alertCreated) {
        const newAlert = subscriptionData.data.alertCreated;
        addAlert(newAlert);

        // Show toast notification for new alerts
        toast.error(newAlert.title, {
          description: newAlert.message,
          action: {
            label: 'View',
            onClick: () => {
              // Open alert panel
              useAlertStore.getState().setAlertPanelOpen(true);
            },
          },
        });
      }
    },
    onError: (error) => {
      console.error('Alert subscription error:', error);
    },
  });

  // Subscribe to alert updates
  useSubscription(ALERT_UPDATED, {
    onData: ({ data: subscriptionData }) => {
      if (subscriptionData?.data?.alertUpdated) {
        const updatedAlert = subscriptionData.data.alertUpdated;
        updateAlert(updatedAlert.id, updatedAlert);
      }
    },
  });

  // Subscribe to alert resolutions
  useSubscription(ALERT_RESOLVED, {
    onData: ({ data: subscriptionData }) => {
      if (subscriptionData?.data?.alertResolved) {
        const resolvedAlert = subscriptionData.data.alertResolved;
        updateAlert(resolvedAlert.id, resolvedAlert);

        toast.success('Alert resolved', {
          description: `${resolvedAlert.title} has been resolved`,
        });
      }
    },
  });

  // Subscribe to alert deletions
  useSubscription(ALERT_DELETED, {
    onData: ({ data: subscriptionData }) => {
      if (subscriptionData?.data?.alertDeleted) {
        const deletedAlert = subscriptionData.data.alertDeleted;
        removeAlert(deletedAlert.id);
      }
    },
  });

  return {
    loading,
    error,
    refetch,
  };
}
