import { gql } from '@apollo/client';

// Alert Fragments
export const ALERT_FRAGMENT = gql`
  fragment AlertFragment on Alert {
    id
    deviceId
    type
    severity
    title
    message
    isRead
    isResolved
    resolvedAt
    resolvedBy
    createdAt
    updatedAt
    device {
      id
      name
      location
    }
  }
`;

// Queries
export const GET_ALERTS = gql`
  ${ALERT_FRAGMENT}
  query GetAlerts(
    $deviceId: ID
    $unreadOnly: Boolean = false
    $limit: Int = 50
    $offset: Int = 0
  ) {
    getAlerts(
      deviceId: $deviceId
      unreadOnly: $unreadOnly
      limit: $limit
      offset: $offset
    ) {
      ...AlertFragment
    }
  }
`;

export const GET_ALERT = gql`
  ${ALERT_FRAGMENT}
  query GetAlert($id: ID!) {
    getAlert(id: $id) {
      ...AlertFragment
    }
  }
`;

export const GET_UNREAD_ALERT_COUNT = gql`
  query GetUnreadAlertCount($deviceId: ID) {
    getUnreadAlertCount(deviceId: $deviceId)
  }
`;

export const GET_ALERT_STATS = gql`
  query GetAlertStats {
    getAlertStats {
      total
      unread
      critical
      warning
      resolved
      byType {
        TEMPERATURE_EXCURSION
        DEVICE_OFFLINE
        LOW_BATTERY
        CONNECTION_LOST
      }
    }
  }
`;

// Mutations
export const MARK_ALERT_AS_READ = gql`
  ${ALERT_FRAGMENT}
  mutation MarkAlertAsRead($id: ID!) {
    markAlertAsRead(id: $id) {
      ...AlertFragment
    }
  }
`;

export const MARK_MULTIPLE_ALERTS_AS_READ = gql`
  mutation MarkMultipleAlertsAsRead($ids: [ID!]!) {
    markMultipleAlertsAsRead(ids: $ids) {
      count
      success
    }
  }
`;

export const RESOLVE_ALERT = gql`
  ${ALERT_FRAGMENT}
  mutation ResolveAlert($id: ID!, $resolvedBy: String) {
    resolveAlert(id: $id, resolvedBy: $resolvedBy) {
      ...AlertFragment
    }
  }
`;

export const DELETE_ALERT = gql`
  ${ALERT_FRAGMENT}
  mutation DeleteAlert($id: ID!) {
    deleteAlert(id: $id) {
      ...AlertFragment
    }
  }
`;

// Subscriptions
export const ALERT_CREATED = gql`
  ${ALERT_FRAGMENT}
  subscription AlertCreated {
    alertCreated {
      ...AlertFragment
    }
  }
`;

export const ALERT_UPDATED = gql`
  ${ALERT_FRAGMENT}
  subscription AlertUpdated {
    alertUpdated {
      ...AlertFragment
    }
  }
`;

export const ALERT_RESOLVED = gql`
  ${ALERT_FRAGMENT}
  subscription AlertResolved {
    alertResolved {
      ...AlertFragment
    }
  }
`;

export const ALERT_DELETED = gql`
  ${ALERT_FRAGMENT}
  subscription AlertDeleted {
    alertDeleted {
      ...AlertFragment
    }
  }
`;

export const ALERTS_BULK_UPDATED = gql`
  subscription AlertsBulkUpdated {
    alertsBulkUpdated {
      alertIds
      action
    }
  }
`;
