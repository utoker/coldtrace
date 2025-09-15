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

// In-memory simulator state (shared with actual simulator if running)
class SimulatorService {
  private static instance: SimulatorService;

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

      // Create a high-temperature reading using the createReading resolver
      // This will trigger the alert logic automatically
      const excursionTemp = 12.0; // Above safe range

      // Get current device state for accurate battery level
      const currentDevice = await prisma.device.findUnique({
        where: { id: device!.id },
      });

      // Use the createReading resolver to ensure proper data handling
      const { resolvers } = await import('../graphql/resolvers');
      await resolvers.Mutation.createReading(
        null,
        {
          input: {
            deviceId: device!.id,
            temperature: excursionTemp,
            battery: currentDevice?.battery || 85.0,
          },
        },
        { prisma }
      );

      console.log(
        `🌡️ SimulatorService: Created temperature excursion reading for ${
          device?.name ?? 'Unknown device'
        } at ${excursionTemp}°C`
      );

      return {
        success: true,
        message: `Temperature excursion triggered on ${device!.name} (12°C)`,
        affectedDevices: [device!],
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

      // Create a reading with low battery using the createReading resolver
      // This will trigger the alert logic automatically
      const lowBattery = Math.random() * 15 + 5; // 5-20%

      // First, update the device's battery field in the database
      await prisma.device.update({
        where: { id: device!.id },

        data: { battery: lowBattery },
      });

      // Use the createReading resolver to ensure proper data handling
      const { resolvers } = await import('../graphql/resolvers');
      await resolvers.Mutation.createReading(
        null,
        {
          input: {
            deviceId: device!.id,
            temperature: 5.0, // Normal temperature
            battery: lowBattery,
          },
        },
        { prisma }
      );

      console.log(
        `🔋 SimulatorService: Created low battery reading for ${
          device!.name
        } with ${lowBattery.toFixed(1)}% battery`
      );

      // Get the updated device with new battery level
      const updatedDevice = await prisma.device.findUnique({
        where: { id: device!.id },
        include: {
          readings: {
            take: 1,
            orderBy: { timestamp: 'desc' },
          },
        },
      });

      // Publish device status change to update frontend
      if (updatedDevice) {
        pubsub.publish('DEVICE_STATUS_CHANGED', {
          deviceStatusChanged: updatedDevice,
        });
      }

      return {
        success: true,
        message: `Low battery simulated on ${
          device!.name
        } (${lowBattery.toFixed(1)}%)`,
        affectedDevices: [device!],
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
        where: { id: device!.id },
        data: { status: 'OFFLINE' },
        include: {
          readings: {
            take: 1,
            orderBy: { timestamp: 'desc' },
          },
        },
      });

      // Publish device status change
      console.log(
        `📡 Publishing device status change: ${device!.name} -> OFFLINE`
      );
      pubsub.publish('DEVICE_STATUS_CHANGED', {
        deviceStatusChanged: updatedDevice,
      });

      return {
        success: true,
        message: `${device!.name} has been taken offline`,
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

      // Bring devices online with good battery levels
      const deviceIds = offlineDevices.map((d) => d.id);
      await prisma.device.updateMany({
        where: { id: { in: deviceIds } },
        data: {
          status: 'ONLINE',
          battery: 85 + Math.random() * 15, // 85-100%
        },
      });

      // Get updated devices with new battery levels
      const updatedDevicesForReadings = await prisma.device.findMany({
        where: { id: { in: deviceIds } },
      });

      // Create readings for the newly online devices using the createReading resolver
      // This ensures proper data handling and WebSocket events are published
      const { resolvers } = await import('../graphql/resolvers');
      const readingPromises = updatedDevicesForReadings.map((device) =>
        resolvers.Mutation.createReading(
          null,
          {
            input: {
              deviceId: device.id,
              temperature: 5.0,
              battery: device.battery,
            },
          },
          { prisma }
        )
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
        },
      });

      // Publish device status changes
      updatedDevices.forEach((device) => {
        pubsub.publish('DEVICE_STATUS_CHANGED', {
          deviceStatusChanged: device,
        });
      });

      // Temperature updates are already published by the createReading resolver

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

      // Reset all devices to normal with good battery levels
      await prisma.device.updateMany({
        where: { id: { in: devicesToReset.map((d) => d.id) } },
        data: {
          status: 'ONLINE',
          battery: 85 + Math.random() * 15, // 85-100%
        },
      });

      // Get updated devices with new battery levels
      const updatedDevicesForReadings = await prisma.device.findMany({
        where: { id: { in: devicesToReset.map((d) => d.id) } },
      });

      // Create normal readings for all reset devices using the createReading resolver
      // This ensures proper data handling and WebSocket events are published
      const { resolvers } = await import('../graphql/resolvers');
      const readingPromises = updatedDevicesForReadings.map((device) =>
        resolvers.Mutation.createReading(
          null,
          {
            input: {
              deviceId: device.id,
              temperature: 5.0,
              battery: device.battery,
            },
          },
          { prisma }
        )
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
        },
      });

      // Publish device status changes
      updatedDevices.forEach((device) => {
        pubsub.publish('DEVICE_STATUS_CHANGED', {
          deviceStatusChanged: device,
        });
      });

      // Temperature updates are already published by the createReading resolver

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
        alertsCreated: 0, // Alerts disabled
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
