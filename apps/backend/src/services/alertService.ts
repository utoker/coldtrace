import {
  PrismaClient,
  AlertType,
  AlertSeverity,
  Alert,
} from '@coldtrace/database';
import { pubsub } from '../lib/pubsub';

interface CreateAlertInput {
  deviceId: string;
  type: AlertType;
  severity: AlertSeverity;
  deviceName: string;
  location: string;
  currentValue?: number;
  threshold?: number;
  additionalData?: Record<string, any>;
}

export class AlertService {
  constructor(private prisma: PrismaClient) {}

  async createAlert(input: CreateAlertInput): Promise<Alert> {
    const { title, message } = this.generateAlertContent(input);

    const alert = await this.prisma.alert.create({
      data: {
        deviceId: input.deviceId,
        type: input.type,
        severity: input.severity,
        title,
        message,
      },
      include: {
        device: true,
      },
    });

    // Publish to WebSocket subscribers for real-time updates
    pubsub.publish('ALERT_CREATED', {
      alertCreated: alert,
    });

    console.log(`🚨 Alert created: ${alert.title} - ${alert.message}`);
    return alert;
  }

  private generateAlertContent(input: CreateAlertInput): {
    title: string;
    message: string;
  } {
    const templates = {
      TEMPERATURE_EXCURSION: {
        title: `Temperature ${input.severity} - ${input.deviceName}`,
        message: `Temperature ${input.currentValue}°C is outside safe range ${
          input.threshold ? `(threshold: ${input.threshold}°C)` : ''
        } at ${input.location}`,
      },
      DEVICE_OFFLINE: {
        title: `Device Offline - ${input.deviceName}`,
        message: `Device at ${input.location} has gone offline and is no longer sending readings`,
      },
      LOW_BATTERY: {
        title: `Low Battery - ${input.deviceName}`,
        message: `Battery level at ${input.currentValue}% for device at ${input.location}. Replace battery soon.`,
      },
      CONNECTION_LOST: {
        title: `Connection Lost - ${input.deviceName}`,
        message: `Lost connection to device at ${input.location}. Check network connectivity.`,
      },
    };

    return templates[input.type];
  }

  async getAlerts(options?: {
    deviceId?: string;
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Alert[]> {
    const {
      deviceId,
      unreadOnly = false,
      limit = 50,
      offset = 0,
    } = options || {};

    return this.prisma.alert.findMany({
      where: {
        ...(deviceId && { deviceId }),
        ...(unreadOnly && { isRead: false }),
      },
      include: {
        device: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });
  }

  async getAlertById(id: string): Promise<Alert | null> {
    return this.prisma.alert.findUnique({
      where: { id },
      include: {
        device: true,
      },
    });
  }

  async getUnreadCount(deviceId?: string): Promise<number> {
    return this.prisma.alert.count({
      where: {
        ...(deviceId && { deviceId }),
        isRead: false,
      },
    });
  }

  async markAsRead(alertId: string): Promise<Alert> {
    const alert = await this.prisma.alert.update({
      where: { id: alertId },
      data: { isRead: true },
      include: {
        device: true,
      },
    });

    // Publish update for real-time UI updates
    pubsub.publish('ALERT_UPDATED', {
      alertUpdated: alert,
    });

    return alert;
  }

  async markMultipleAsRead(alertIds: string[]): Promise<{ count: number }> {
    const result = await this.prisma.alert.updateMany({
      where: {
        id: { in: alertIds },
      },
      data: { isRead: true },
    });

    // Publish bulk update
    pubsub.publish('ALERTS_BULK_UPDATED', {
      alertsBulkUpdated: { alertIds, action: 'mark_read' },
    });

    return result;
  }

  async resolveAlert(alertId: string, resolvedBy?: string): Promise<Alert> {
    const alert = await this.prisma.alert.update({
      where: { id: alertId },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy,
        isRead: true, // Auto-mark as read when resolved
      },
      include: {
        device: true,
      },
    });

    // Publish update for real-time UI updates
    pubsub.publish('ALERT_RESOLVED', {
      alertResolved: alert,
    });

    console.log(`✅ Alert resolved: ${alert.title}`);
    return alert;
  }

  async deleteAlert(alertId: string): Promise<Alert> {
    const alert = await this.prisma.alert.delete({
      where: { id: alertId },
      include: {
        device: true,
      },
    });

    // Publish deletion for real-time UI updates
    pubsub.publish('ALERT_DELETED', {
      alertDeleted: alert,
    });

    return alert;
  }

  // Helper method to check if an alert should be created (avoid duplicates)
  async shouldCreateAlert(
    deviceId: string,
    type: AlertType,
    timeWindowMinutes: number = 5
  ): Promise<boolean> {
    const recentAlert = await this.prisma.alert.findFirst({
      where: {
        deviceId,
        type,
        createdAt: {
          gte: new Date(Date.now() - timeWindowMinutes * 60 * 1000),
        },
      },
    });

    return !recentAlert;
  }

  // Get alert statistics for dashboard
  async getAlertStats(): Promise<{
    total: number;
    unread: number;
    critical: number;
    warning: number;
    resolved: number;
    byType: Record<AlertType, number>;
  }> {
    const [total, unread, critical, warning, resolved, byTypeResults] =
      await Promise.all([
        this.prisma.alert.count(),
        this.prisma.alert.count({ where: { isRead: false } }),
        this.prisma.alert.count({ where: { severity: 'CRITICAL' } }),
        this.prisma.alert.count({ where: { severity: 'WARNING' } }),
        this.prisma.alert.count({ where: { isResolved: true } }),
        this.prisma.alert.groupBy({
          by: ['type'],
          _count: { type: true },
        }),
      ]);

    const byType = byTypeResults.reduce((acc, item) => {
      acc[item.type] = item._count.type;
      return acc;
    }, {} as Record<AlertType, number>);

    return {
      total,
      unread,
      critical,
      warning,
      resolved,
      byType,
    };
  }
}

// Create singleton instance
const prisma = new PrismaClient();
export const alertService = new AlertService(prisma);
