import { prisma } from '@coldtrace/database';
import { pubsub } from '../lib/pubsub';

export interface SimulatorStats {
  totalReadings: number;
  successfulReadings: number;
  failedReadings: number;
  alertsCreated: number;
  runtime: number;
  devicesOnline: number;
  devicesOffline: number;
  devicesInExcursion: number;
  lowBatteryDevices: number;
}

export interface SimulatorResult {
  success: boolean;
  message: string;
  affectedDevices: any[];
}

// Helper function to determine reading status
function getReadingStatus(
  temperature: number,
  minTemp?: number | null,
  maxTemp?: number | null
): string {
  if (!minTemp || !maxTemp) return 'NORMAL';

  if (temperature < minTemp - 1 || temperature > maxTemp + 1) {
    return 'CRITICAL';
  } else if (temperature < minTemp || temperature > maxTemp) {
    return 'WARNING';
  } else {
    return 'NORMAL';
  }
}

// In-memory simulator state (shared with actual simulator if running)
class SimulatorService {
  private static instance: SimulatorService;
  private simulatorStats: SimulatorStats = {
    totalReadings: 0,
    successfulReadings: 0,
    failedReadings: 0,
    alertsCreated: 0,
    runtime: 0,
    devicesOnline: 0,
    devicesOffline: 0,
    devicesInExcursion: 0,
    lowBatteryDevices: 0,
  };

  static getInstance(): SimulatorService {
    if (!SimulatorService.instance) {
      SimulatorService.instance = new SimulatorService();
    }
    return SimulatorService.instance;
  }

  async triggerExcursion(deviceId?: string): Promise<SimulatorResult> {
    try {
      let device;

      if (deviceId) {
        device = await prisma.device.findUnique({
          where: { id: deviceId },
        });

        if (!device) {
          return {
            success: false,
            message: `Device with ID ${deviceId} not found`,
            affectedDevices: [],
          };
        }

        if (device.status !== 'ONLINE') {
          return {
            success: false,
            message: `Device ${device.name} is not online`,
            affectedDevices: [],
          };
        }
      } else {
        // Get a random online device
        const onlineDevices = await prisma.device.findMany({
          where: { status: 'ONLINE', isActive: true },
        });

        if (onlineDevices.length === 0) {
          return {
            success: false,
            message: 'No online devices available for excursion',
            affectedDevices: [],
          };
        }

        device =
          onlineDevices[Math.floor(Math.random() * onlineDevices.length)];
      }

      // Create a high-temperature reading to simulate excursion
      const excursionReading = await prisma.reading.create({
        data: {
          deviceId: device.id,
          temperature: 12.0, // Above safe range
          battery: device.battery || 85.0,
          status: 'CRITICAL',
          timestamp: new Date(),
        },
        include: {
          device: true,
        },
      });

      // Create reading with status for subscription
      const readingWithStatus = {
        ...excursionReading,
        status: getReadingStatus(12.0, device.minTemp, device.maxTemp),
      };

      // Publish temperature update to subscriptions
      console.log(
        `📡 Publishing temperature excursion for device ${device.name}`
      );
      pubsub.publish('TEMPERATURE_UPDATES', {
        temperatureUpdates: readingWithStatus,
      });

      // Also publish to device-specific channel
      const deviceSpecificChannel = `TEMPERATURE_UPDATES_${device.id}`;
      pubsub.publish(deviceSpecificChannel, {
        temperatureUpdates: readingWithStatus,
      });

      return {
        success: true,
        message: `Temperature excursion triggered on ${device.name} (12°C)`,
        affectedDevices: [device],
      };
    } catch (error) {
      console.error('Error triggering excursion:', error);
      return {
        success: false,
        message: 'Failed to trigger excursion',
        affectedDevices: [],
      };
    }
  }

  async simulateLowBattery(deviceId?: string): Promise<SimulatorResult> {
    try {
      let device;

      if (deviceId) {
        device = await prisma.device.findUnique({
          where: { id: deviceId },
        });

        if (!device) {
          return {
            success: false,
            message: `Device with ID ${deviceId} not found`,
            affectedDevices: [],
          };
        }
      } else {
        // Get a random online device
        const onlineDevices = await prisma.device.findMany({
          where: { status: 'ONLINE', isActive: true },
        });

        if (onlineDevices.length === 0) {
          return {
            success: false,
            message: 'No online devices available for low battery simulation',
            affectedDevices: [],
          };
        }

        device =
          onlineDevices[Math.floor(Math.random() * onlineDevices.length)];
      }

      // Create a reading with low battery
      const lowBattery = Math.random() * 15 + 5; // 5-20%
      const batteryReading = await prisma.reading.create({
        data: {
          deviceId: device.id,
          temperature: 5.0, // Normal temperature
          battery: lowBattery,
          status: 'NORMAL',
          timestamp: new Date(),
        },
        include: {
          device: true,
        },
      });

      // Create reading with status for subscription
      const readingWithStatus = {
        ...batteryReading,
        status: getReadingStatus(5.0, device.minTemp, device.maxTemp),
      };

      // Publish temperature update to subscriptions
      pubsub.publish('TEMPERATURE_UPDATES', {
        temperatureUpdates: readingWithStatus,
      });

      // Also publish to device-specific channel
      const deviceSpecificChannel = `TEMPERATURE_UPDATES_${device.id}`;
      pubsub.publish(deviceSpecificChannel, {
        temperatureUpdates: readingWithStatus,
      });

      return {
        success: true,
        message: `Low battery simulated on ${device.name} (${lowBattery.toFixed(
          1
        )}%)`,
        affectedDevices: [device],
      };
    } catch (error) {
      console.error('Error simulating low battery:', error);
      return {
        success: false,
        message: 'Failed to simulate low battery',
        affectedDevices: [],
      };
    }
  }

  async takeDeviceOffline(deviceId?: string): Promise<SimulatorResult> {
    try {
      let device;

      if (deviceId) {
        device = await prisma.device.findUnique({
          where: { id: deviceId },
        });

        if (!device) {
          return {
            success: false,
            message: `Device with ID ${deviceId} not found`,
            affectedDevices: [],
          };
        }
      } else {
        // Get a random online device
        const onlineDevices = await prisma.device.findMany({
          where: { status: 'ONLINE', isActive: true },
        });

        if (onlineDevices.length === 0) {
          return {
            success: false,
            message: 'No online devices to take offline',
            affectedDevices: [],
          };
        }

        device =
          onlineDevices[Math.floor(Math.random() * onlineDevices.length)];
      }

      // Update device status to offline
      const updatedDevice = await prisma.device.update({
        where: { id: device.id },
        data: { status: 'OFFLINE' },
        include: {
          readings: {
            take: 1,
            orderBy: { timestamp: 'desc' },
          },
          alerts: {
            where: { acknowledged: false },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      // Publish device status change
      console.log(
        `📡 Publishing device status change: ${device.name} -> OFFLINE`
      );
      pubsub.publish('DEVICE_STATUS_CHANGED', {
        deviceStatusChanged: updatedDevice,
      });

      return {
        success: true,
        message: `${device.name} has been taken offline`,
        affectedDevices: [updatedDevice],
      };
    } catch (error) {
      console.error('Error taking device offline:', error);
      return {
        success: false,
        message: 'Failed to take device offline',
        affectedDevices: [],
      };
    }
  }

  async simulatePowerOutage(): Promise<SimulatorResult> {
    try {
      const onlineDevices = await prisma.device.findMany({
        where: { status: 'ONLINE', isActive: true },
      });

      if (onlineDevices.length === 0) {
        return {
          success: false,
          message: 'No online devices for power outage simulation',
          affectedDevices: [],
        };
      }

      // Take all devices offline
      await prisma.device.updateMany({
        where: { status: 'ONLINE', isActive: true },
        data: { status: 'OFFLINE' },
      });

      // Get updated devices
      const updatedDevices = await prisma.device.findMany({
        where: { id: { in: onlineDevices.map((d) => d.id) } },
        include: {
          readings: {
            take: 1,
            orderBy: { timestamp: 'desc' },
          },
          alerts: {
            where: { acknowledged: false },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      // Publish device status changes for all affected devices
      updatedDevices.forEach((device) => {
        pubsub.publish('DEVICE_STATUS_CHANGED', {
          deviceStatusChanged: device,
        });
      });

      // Schedule bringing them back online after 30 seconds
      setTimeout(async () => {
        try {
          await prisma.device.updateMany({
            where: { id: { in: onlineDevices.map((d) => d.id) } },
            data: { status: 'ONLINE' },
          });

          // Get restored devices and publish status changes
          const restoredDevices = await prisma.device.findMany({
            where: { id: { in: onlineDevices.map((d) => d.id) } },
            include: {
              readings: {
                take: 1,
                orderBy: { timestamp: 'desc' },
              },
              alerts: {
                where: { acknowledged: false },
                orderBy: { createdAt: 'desc' },
              },
            },
          });

          // Publish device status changes for restored devices
          restoredDevices.forEach((device) => {
            pubsub.publish('DEVICE_STATUS_CHANGED', {
              deviceStatusChanged: device,
            });
          });

          console.log(
            `🔌 POWER RESTORED: ${onlineDevices.length} devices back online`
          );
        } catch (error) {
          console.error('Error restoring power:', error);
        }
      }, 30 * 1000);

      return {
        success: true,
        message: `Power outage simulated - ${onlineDevices.length} devices went offline`,
        affectedDevices: updatedDevices,
      };
    } catch (error) {
      console.error('Error simulating power outage:', error);
      return {
        success: false,
        message: 'Failed to simulate power outage',
        affectedDevices: [],
      };
    }
  }

  async simulateBatchArrival(): Promise<SimulatorResult> {
    try {
      const offlineDevices = await prisma.device.findMany({
        where: { status: 'OFFLINE', isActive: true },
        take: 3,
      });

      if (offlineDevices.length === 0) {
        return {
          success: false,
          message: 'No offline devices to bring online',
          affectedDevices: [],
        };
      }

      // Bring devices online
      const deviceIds = offlineDevices.map((d) => d.id);
      await prisma.device.updateMany({
        where: { id: { in: deviceIds } },
        data: { status: 'ONLINE' },
      });

      // Create readings for the newly online devices
      const readingPromises = offlineDevices.map((device) =>
        prisma.reading.create({
          data: {
            deviceId: device.id,
            temperature: 5.0,
            battery: 85 + Math.random() * 15, // 85-100%
            status: 'NORMAL',
            timestamp: new Date(),
          },
        })
      );

      await Promise.all(readingPromises);

      // Get updated devices
      const updatedDevices = await prisma.device.findMany({
        where: { id: { in: deviceIds } },
        include: {
          readings: {
            take: 1,
            orderBy: { timestamp: 'desc' },
          },
          alerts: {
            where: { acknowledged: false },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      // Publish device status changes
      updatedDevices.forEach((device) => {
        pubsub.publish('DEVICE_STATUS_CHANGED', {
          deviceStatusChanged: device,
        });
      });

      // Create and publish temperature readings for the newly online devices
      const readingPromises2 = updatedDevices.map(async (device) => {
        const reading = await prisma.reading.findFirst({
          where: { deviceId: device.id },
          orderBy: { timestamp: 'desc' },
          include: { device: true },
        });

        if (reading) {
          const readingWithStatus = {
            ...reading,
            status: getReadingStatus(
              reading.temperature,
              device.minTemp,
              device.maxTemp
            ),
          };

          // Publish temperature update
          pubsub.publish('TEMPERATURE_UPDATES', {
            temperatureUpdates: readingWithStatus,
          });

          const deviceSpecificChannel = `TEMPERATURE_UPDATES_${device.id}`;
          pubsub.publish(deviceSpecificChannel, {
            temperatureUpdates: readingWithStatus,
          });
        }
      });

      await Promise.all(readingPromises2);

      return {
        success: true,
        message: `Batch arrival simulated - ${offlineDevices.length} devices came online`,
        affectedDevices: updatedDevices,
      };
    } catch (error) {
      console.error('Error simulating batch arrival:', error);
      return {
        success: false,
        message: 'Failed to simulate batch arrival',
        affectedDevices: [],
      };
    }
  }

  async returnToNormal(): Promise<SimulatorResult> {
    try {
      // Get all devices that need to be reset
      const devicesToReset = await prisma.device.findMany({
        where: {
          OR: [{ status: 'OFFLINE' }, { status: 'MAINTENANCE' }],
          isActive: true,
        },
      });

      if (devicesToReset.length === 0) {
        return {
          success: true,
          message: 'All devices are already in normal state',
          affectedDevices: [],
        };
      }

      // Reset all devices to normal
      await prisma.device.updateMany({
        where: { id: { in: devicesToReset.map((d) => d.id) } },
        data: { status: 'ONLINE' },
      });

      // Create normal readings for all reset devices
      const readingPromises = devicesToReset.map((device) =>
        prisma.reading.create({
          data: {
            deviceId: device.id,
            temperature: 5.0,
            battery: 85 + Math.random() * 15, // 85-100%
            status: 'NORMAL',
            timestamp: new Date(),
          },
        })
      );

      await Promise.all(readingPromises);

      // Get updated devices
      const updatedDevices = await prisma.device.findMany({
        where: { id: { in: devicesToReset.map((d) => d.id) } },
        include: {
          readings: {
            take: 1,
            orderBy: { timestamp: 'desc' },
          },
          alerts: {
            where: { acknowledged: false },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      // Publish device status changes
      updatedDevices.forEach((device) => {
        pubsub.publish('DEVICE_STATUS_CHANGED', {
          deviceStatusChanged: device,
        });
      });

      // Publish temperature readings for reset devices
      const temperaturePromises = updatedDevices.map(async (device) => {
        const reading = await prisma.reading.findFirst({
          where: { deviceId: device.id },
          orderBy: { timestamp: 'desc' },
          include: { device: true },
        });

        if (reading) {
          const readingWithStatus = {
            ...reading,
            status: getReadingStatus(
              reading.temperature,
              device.minTemp,
              device.maxTemp
            ),
          };

          // Publish temperature update
          pubsub.publish('TEMPERATURE_UPDATES', {
            temperatureUpdates: readingWithStatus,
          });

          const deviceSpecificChannel = `TEMPERATURE_UPDATES_${device.id}`;
          pubsub.publish(deviceSpecificChannel, {
            temperatureUpdates: readingWithStatus,
          });
        }
      });

      await Promise.all(temperaturePromises);

      return {
        success: true,
        message: `${devicesToReset.length} devices returned to normal operation`,
        affectedDevices: updatedDevices,
      };
    } catch (error) {
      console.error('Error returning to normal:', error);
      return {
        success: false,
        message: 'Failed to return devices to normal',
        affectedDevices: [],
      };
    }
  }

  async getSimulatorStats(): Promise<SimulatorStats> {
    try {
      // Get real-time stats from database
      const devices = await prisma.device.findMany({
        where: { isActive: true },
        include: {
          readings: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
        },
      });

      const totalReadings = await prisma.reading.count();
      const recentReadings = await prisma.reading.findMany({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      });

      const alerts = await prisma.alert.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      });

      const devicesOnline = devices.filter((d) => d.status === 'ONLINE').length;
      const devicesOffline = devices.filter(
        (d) => d.status === 'OFFLINE'
      ).length;
      const lowBatteryDevices = devices.filter((d) => {
        const latestReading = d.readings[0];
        return (
          latestReading && latestReading.battery && latestReading.battery < 20
        );
      }).length;

      // Check for devices in excursion (recent critical readings)
      const criticalReadings = await prisma.reading.findMany({
        where: {
          status: 'CRITICAL',
          timestamp: {
            gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
          },
        },
        distinct: ['deviceId'],
      });

      return {
        totalReadings,
        successfulReadings: recentReadings.length, // Approximate
        failedReadings: 0, // Would need to track this separately
        alertsCreated: alerts,
        runtime: Math.floor(Date.now() / 1000), // Uptime in seconds
        devicesOnline,
        devicesOffline,
        devicesInExcursion: criticalReadings.length,
        lowBatteryDevices,
      };
    } catch (error) {
      console.error('Error getting simulator stats:', error);
      return {
        totalReadings: 0,
        successfulReadings: 0,
        failedReadings: 0,
        alertsCreated: 0,
        runtime: 0,
        devicesOnline: 0,
        devicesOffline: 0,
        devicesInExcursion: 0,
        lowBatteryDevices: 0,
      };
    }
  }
}

export const simulatorService = SimulatorService.getInstance();
