import { GraphQLError } from 'graphql';
import { GraphQLScalarType, Kind } from 'graphql';
import { GraphQLContext } from './context';
import { PrismaClient } from '@coldtrace/database';
import { simulatorService } from '../services/simulatorService';
import { pubsub } from '../lib/pubsub';

// Helper function to calculate compliance rate
async function calculateComplianceRate(
  prisma: PrismaClient,
  deviceId: string,
  minTemp?: number | null,
  maxTemp?: number | null
): Promise<number> {
  if (!minTemp || !maxTemp) return 100; // If no thresholds set, assume 100% compliance

  const totalReadings = await prisma.reading.count({
    where: { deviceId },
  });

  if (totalReadings === 0) return 100;

  const compliantReadings = await prisma.reading.count({
    where: {
      deviceId,
      temperature: {
        gte: minTemp,
        lte: maxTemp,
      },
    },
  });

  return Math.round((compliantReadings / totalReadings) * 100);
}

// Helper function to determine reading status
function getReadingStatus(
  temperature: number,
  minTemp?: number | null,
  maxTemp?: number | null
): string {
  if (!minTemp || !maxTemp) return 'NORMAL';

  const tempDiff = Math.max(
    Math.abs(temperature - minTemp),
    Math.abs(temperature - maxTemp)
  );

  if (temperature < minTemp || temperature > maxTemp) {
    return tempDiff > 2 ? 'CRITICAL' : 'WARNING';
  }

  return 'NORMAL';
}

// Custom DateTime scalar
const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'DateTime custom scalar type',
  serialize(value: unknown) {
    if (value instanceof Date) {
      return value.toISOString();
    }
    throw new Error('Value must be a Date object');
  },
  parseValue(value: unknown) {
    if (typeof value === 'string') {
      return new Date(value);
    }
    throw new Error('Value must be a string');
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    throw new Error('Value must be a string');
  },
});

// Using generated types from GraphQL Code Generator

export const resolvers = {
  DateTime: DateTimeScalar,

  Query: {
    hello: () => 'Hello from ColdTrace GraphQL API!',

    getDevices: async (
      _parent: unknown,
      args: {
        status?: string;
        isActive?: boolean;
        location?: string;
        limit?: number;
        offset?: number;
      },
      { prisma }: GraphQLContext
    ) => {
      const { status, isActive, location, limit = 50, offset = 0 } = args;
      try {
        const where: Record<string, unknown> = {};

        if (status) where.deviceType = status; // Note: Database still uses deviceType field
        if (typeof isActive === 'boolean') where.isActive = isActive;
        if (location)
          where.location = { contains: location, mode: 'insensitive' };

        return await prisma.device.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
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
      } catch (error) {
        console.error('Error fetching devices:', error);
        throw new GraphQLError('Failed to fetch devices');
      }
    },

    getDevice: async (
      _parent: unknown,
      args: { id: string },
      { prisma }: GraphQLContext
    ) => {
      const { id } = args;
      try {
        const device = await prisma.device.findUnique({
          where: { id },
          include: {
            readings: {
              take: 10,
              orderBy: { timestamp: 'desc' },
            },
            alerts: {
              where: { acknowledged: false },
              orderBy: { createdAt: 'desc' },
            },
          },
        });

        if (!device) {
          throw new GraphQLError(`Device with id ${id} not found`);
        }

        return device;
      } catch (error) {
        console.error('Error fetching device:', error);
        if (error instanceof GraphQLError) {
          throw error;
        }
        throw new GraphQLError('Failed to fetch device');
      }
    },

    getDeviceReadings: async (
      _parent: unknown,
      args: {
        deviceId: string;
        startTime?: Date;
        endTime?: Date;
        limit?: number;
      },
      { prisma }: GraphQLContext
    ) => {
      const { deviceId, startTime, endTime, limit = 100 } = args;
      try {
        const where: Record<string, unknown> = { deviceId };

        if (startTime || endTime) {
          where.timestamp = {};
          if (startTime)
            (where.timestamp as Record<string, unknown>).gte = startTime;
          if (endTime)
            (where.timestamp as Record<string, unknown>).lte = endTime;
        }

        return await prisma.reading.findMany({
          where,
          take: limit,
          orderBy: { timestamp: 'desc' },
          include: {
            device: true,
            alerts: true,
          },
        });
      } catch (error) {
        console.error('Error fetching device readings:', error);
        throw new GraphQLError('Failed to fetch device readings');
      }
    },

    getActiveAlerts: async (
      _parent: unknown,
      args: { deviceId?: string },
      { prisma }: GraphQLContext
    ) => {
      const { deviceId } = args;
      try {
        const where: Record<string, unknown> = {
          acknowledged: false, // Only unacknowledged alerts
        };
        if (deviceId) where.deviceId = deviceId;

        return await prisma.alert.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          include: {
            device: true,
            reading: true,
          },
        });
      } catch (error) {
        console.error('Error fetching active alerts:', error);
        throw new GraphQLError('Failed to fetch active alerts');
      }
    },

    getDeviceHistory: async (
      _parent: unknown,
      args: {
        deviceId: string;
        timeRange: {
          startTime: Date;
          endTime: Date;
        };
        limit?: number;
      },
      { prisma }: GraphQLContext
    ) => {
      const { deviceId, timeRange, limit = 1000 } = args;
      const { startTime, endTime } = timeRange;

      try {
        // Get readings within time range
        const readings = await prisma.reading.findMany({
          where: {
            deviceId,
            timestamp: {
              gte: startTime,
              lte: endTime,
            },
          },
          take: limit,
          orderBy: { timestamp: 'desc' },
          include: {
            device: true,
            alerts: true,
          },
        });

        // Get total count for pagination info
        const totalCount = await prisma.reading.count({
          where: {
            deviceId,
            timestamp: {
              gte: startTime,
              lte: endTime,
            },
          },
        });

        // Calculate duration
        const durationMs = endTime.getTime() - startTime.getTime();
        const durationHours = Math.round(durationMs / (1000 * 60 * 60));
        const duration =
          durationHours < 24
            ? `${durationHours} hours`
            : `${Math.round(durationHours / 24)} days`;

        const result = {
          deviceId,
          readings,
          totalCount,
          timeRange: {
            startTime,
            endTime,
            duration,
          },
        };

        return result;
      } catch (error) {
        console.error('Error fetching device history:', error);
        throw new GraphQLError('Failed to fetch device history');
      }
    },

    getDeviceStats: async (
      _parent: any,
      args: any,
      { prisma }: GraphQLContext
    ) => {
      const { deviceId } = args;
      try {
        // Get aggregated temperature stats
        const tempStats = await prisma.reading.aggregate({
          where: { deviceId },
          _min: { temperature: true, timestamp: true },
          _max: { temperature: true, timestamp: true },
          _avg: { temperature: true },
          _count: true,
        });

        // Get latest reading for current values
        const latestReading = await prisma.reading.findFirst({
          where: { deviceId },
          orderBy: { timestamp: 'desc' },
          include: {
            device: true,
            alerts: true,
          },
        });

        // Calculate compliance rate (percentage of readings within temperature range)
        const device = await prisma.device.findUnique({
          where: { id: deviceId },
        });
        const complianceRate = await calculateComplianceRate(
          prisma,
          deviceId,
          device?.minTemp,
          device?.maxTemp
        );

        return {
          deviceId,
          readingCount: tempStats._count || 0,
          temperatureStats: {
            min: tempStats._min.temperature || 0,
            max: tempStats._max.temperature || 0,
            avg: tempStats._avg.temperature || 0,
            current: latestReading?.temperature || null,
          },
          complianceRate,
          lastReading: latestReading,
        };
      } catch (error) {
        console.error('Error fetching device stats:', error);
        throw new GraphQLError('Failed to fetch device stats');
      }
    },
  },

  Mutation: {
    createDevice: async (
      _parent: any,
      args: any,
      { prisma }: GraphQLContext
    ) => {
      const { input } = args;
      try {
        return await prisma.device.create({
          data: input,
          include: {
            readings: true,
            alerts: true,
          },
        });
      } catch (error) {
        console.error('Error creating device:', error);
        throw new GraphQLError('Failed to create device');
      }
    },

    updateDevice: async (
      _parent: any,
      args: any,
      { prisma }: GraphQLContext
    ) => {
      const { id, input } = args;
      try {
        // Filter out null/undefined values to match Prisma's exactOptionalPropertyTypes
        const updateData = Object.fromEntries(
          Object.entries(input).filter(
            ([_, value]) => value !== null && value !== undefined
          )
        );

        return await prisma.device.update({
          where: { id },
          data: updateData,
          include: {
            readings: true,
            alerts: true,
          },
        });
      } catch (error) {
        console.error('Error updating device:', error);
        throw new GraphQLError('Failed to update device');
      }
    },

    createReading: async (
      _parent: any,
      args: any,
      { prisma }: GraphQLContext
    ) => {
      const { input } = args;
      try {
        // Get device to check temperature thresholds
        const device = await prisma.device.findUnique({
          where: { id: input.deviceId },
        });

        if (!device) {
          throw new GraphQLError(`Device with id ${input.deviceId} not found`);
        }

        // Determine reading status
        const status = getReadingStatus(
          input.temperature,
          device.minTemp,
          device.maxTemp
        );

        // Create the reading
        const reading = await prisma.reading.create({
          data: {
            deviceId: input.deviceId,
            temperature: input.temperature,
            battery: input.battery,
          },
          include: {
            device: true,
          },
        });

        // Create reading with status (this would be added to the reading data if we had status field in DB)
        const readingWithStatus = {
          ...reading,
          status,
        };

        // Check for alerts and create them
        if (device.minTemp && input.temperature < device.minTemp) {
          const alert = await prisma.alert.create({
            data: {
              deviceId: input.deviceId,
              readingId: reading.id,
              type: 'TEMPERATURE_LOW',
              severity:
                input.temperature < device.minTemp - 2 ? 'CRITICAL' : 'HIGH',
              message: `Low Temperature Alert - ${device.name}: Temperature ${input.temperature}°C below minimum threshold of ${device.minTemp}°C`,
              temperature: input.temperature,
              threshold: device.minTemp,
            },
            include: { device: true },
          });

          pubsub.publish('NEW_ALERTS', { newAlerts: alert });
        }

        if (device.maxTemp && input.temperature > device.maxTemp) {
          const alert = await prisma.alert.create({
            data: {
              deviceId: input.deviceId,
              readingId: reading.id,
              type: 'TEMPERATURE_HIGH',
              severity:
                input.temperature > device.maxTemp + 2 ? 'CRITICAL' : 'HIGH',
              message: `High Temperature Alert - ${device.name}: Temperature ${input.temperature}°C exceeds maximum threshold of ${device.maxTemp}°C`,
              temperature: input.temperature,
              threshold: device.maxTemp,
            },
            include: { device: true },
          });

          pubsub.publish('NEW_ALERTS', { newAlerts: alert });
        }

        if (input.battery && input.battery < 20) {
          const alert = await prisma.alert.create({
            data: {
              deviceId: input.deviceId,
              type: 'BATTERY_LOW',
              severity: 'MEDIUM',
              message: `Low Battery - ${device.name}: Battery level at ${input.battery}%`,
              temperature: null,
              threshold: 20,
            },
            include: { device: true },
          });

          pubsub.publish('NEW_ALERTS', { newAlerts: alert });
        }

        // Publish temperature update to both general and device-specific channels
        pubsub.publish('TEMPERATURE_UPDATES', {
          temperatureUpdates: readingWithStatus,
        });

        // Also publish to device-specific channel for targeted subscriptions
        const deviceSpecificChannel = `TEMPERATURE_UPDATES_${readingWithStatus.deviceId}`;
        console.log(
          '📡 Publishing temperature update to device-specific channel:',
          deviceSpecificChannel
        );
        pubsub.publish(deviceSpecificChannel, {
          temperatureUpdates: readingWithStatus,
        });

        return readingWithStatus;
      } catch (error) {
        console.error('Error creating reading:', error);
        if (error instanceof GraphQLError) {
          throw error;
        }
        throw new GraphQLError('Failed to create reading');
      }
    },

    acknowledgeAlert: async (
      _parent: any,
      args: any,
      { prisma }: GraphQLContext
    ) => {
      const { id } = args;
      try {
        const alert = await prisma.alert.update({
          where: { id },
          data: {
            acknowledged: true,
          },
          include: {
            device: true,
          },
        });

        return alert;
      } catch (error) {
        console.error('Error acknowledging alert:', error);
        throw new GraphQLError('Failed to acknowledge alert');
      }
    },

    // Simulator Controls
    triggerExcursion: async (_parent: any, args: { deviceId?: string }) => {
      try {
        return await simulatorService.triggerExcursion(args.deviceId);
      } catch (error) {
        console.error('Error triggering excursion:', error);
        throw new GraphQLError('Failed to trigger excursion');
      }
    },

    simulateLowBattery: async (_parent: any, args: { deviceId?: string }) => {
      try {
        return await simulatorService.simulateLowBattery(args.deviceId);
      } catch (error) {
        console.error('Error simulating low battery:', error);
        throw new GraphQLError('Failed to simulate low battery');
      }
    },

    takeDeviceOffline: async (_parent: any, args: { deviceId?: string }) => {
      try {
        return await simulatorService.takeDeviceOffline(args.deviceId);
      } catch (error) {
        console.error('Error taking device offline:', error);
        throw new GraphQLError('Failed to take device offline');
      }
    },

    simulatePowerOutage: async () => {
      try {
        return await simulatorService.simulatePowerOutage();
      } catch (error) {
        console.error('Error simulating power outage:', error);
        throw new GraphQLError('Failed to simulate power outage');
      }
    },

    simulateBatchArrival: async () => {
      try {
        return await simulatorService.simulateBatchArrival();
      } catch (error) {
        console.error('Error simulating batch arrival:', error);
        throw new GraphQLError('Failed to simulate batch arrival');
      }
    },

    returnToNormal: async () => {
      try {
        return await simulatorService.returnToNormal();
      } catch (error) {
        console.error('Error returning to normal:', error);
        throw new GraphQLError('Failed to return to normal');
      }
    },

    getSimulatorStats: async () => {
      try {
        return await simulatorService.getSimulatorStats();
      } catch (error) {
        console.error('Error getting simulator stats:', error);
        throw new GraphQLError('Failed to get simulator stats');
      }
    },
  },

  Subscription: {
    temperatureUpdates: {
      subscribe: (_parent: any, args: any) => {
        const { deviceId } = args;
        console.log(
          '🔔 Setting up temperatureUpdates subscription for device:',
          deviceId || 'ALL'
        );
        return pubsub.asyncIterableIterator([
          deviceId ? `TEMPERATURE_UPDATES_${deviceId}` : 'TEMPERATURE_UPDATES',
        ]);
      },
    },

    newAlerts: {
      subscribe: () => {
        console.log('🔔 Setting up newAlerts subscription');
        return pubsub.asyncIterableIterator(['NEW_ALERTS']);
      },
    },

    deviceStatusChanged: {
      subscribe: () => {
        console.log('🔔 Setting up deviceStatusChanged subscription');
        return pubsub.asyncIterableIterator(['DEVICE_STATUS_CHANGED']);
      },
    },

    ping: {
      subscribe: () => {
        console.log('🔔 Setting up ping subscription');
        return pubsub.asyncIterableIterator(['PING']);
      },
    },
  },

  // Field resolvers
  Device: {
    latestReading: async (
      parent: any,
      _args: any,
      { prisma }: GraphQLContext
    ) => {
      return await prisma.reading.findFirst({
        where: { deviceId: parent.id },
        orderBy: { timestamp: 'desc' },
      });
    },
  },

  Reading: {
    device: async (parent: any, _args: any, { prisma }: GraphQLContext) => {
      return await prisma.device.findUnique({
        where: { id: parent.deviceId },
      });
    },
    status: async (parent: any, _args: any, { prisma }: GraphQLContext) => {
      // If status is already set on the reading, return it
      if (parent.status) return parent.status;

      // Otherwise, calculate it based on temperature and device thresholds
      const device = await prisma.device.findUnique({
        where: { id: parent.deviceId },
      });

      return getReadingStatus(
        parent.temperature,
        device?.minTemp,
        device?.maxTemp
      );
    },
  },

  Alert: {
    device: async (parent: any, _args: any, { prisma }: GraphQLContext) => {
      return await prisma.device.findUnique({
        where: { id: parent.deviceId },
      });
    },
    // The Alert model now has these fields directly, no need for field resolvers
  },
};

// Set up ping timer for WebSocket testing
setInterval(() => {
  const timestamp = new Date().toISOString();
  const message = `Ping at ${timestamp}`;
  pubsub.publish('PING', { ping: message });
}, 5000); // Every 5 seconds
