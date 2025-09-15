// Load and validate environment variables first
import './env';

import { PrismaClient, Device, Reading } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn'] // Removed 'query' to reduce console noise
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Export all Prisma types and client
export * from '@prisma/client';
export default prisma;

// Utility types for common database operations
export type DeviceWithReadings = Device & {
  readings: Reading[];
};

export type ReadingWithDevice = Reading & {
  device: Device;
};

// Database utility functions
export const db = {
  // Device utilities
  async getActiveDevices() {
    return prisma.device.findMany({
      where: { isActive: true },
      include: {
        readings: {
          orderBy: { timestamp: 'desc' },
          take: 1, // Latest reading only
        },
      },
    });
  },

  async getDeviceById(deviceId: string) {
    return prisma.device.findUnique({
      where: { id: deviceId },
      include: {
        readings: {
          orderBy: { timestamp: 'desc' },
          take: 10, // Last 10 readings
        },
      },
    });
  },

  // Reading utilities
  async getLatestReadings(deviceId?: string, limit = 50) {
    return prisma.reading.findMany({
      where: deviceId ? { deviceId } : {},
      include: { device: true },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  },

  async getReadingsInTimeRange(
    deviceId: string,
    startTime: Date,
    endTime: Date
  ) {
    return prisma.reading.findMany({
      where: {
        deviceId,
        timestamp: {
          gte: startTime,
          lte: endTime,
        },
      },
      orderBy: { timestamp: 'asc' },
    });
  },

  // Analytics utilities
  async getDeviceStats() {
    const [totalDevices, activeDevices, totalReadings] = await Promise.all([
      prisma.device.count(),
      prisma.device.count({ where: { isActive: true } }),
      prisma.reading.count(),
    ]);

    return {
      totalDevices,
      activeDevices,
      totalReadings,
      offlineDevices: totalDevices - activeDevices,
    };
  },

  async getTemperatureStats(deviceId: string, hours = 24) {
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    const readings = await prisma.reading.findMany({
      where: {
        deviceId,
        timestamp: { gte: startTime },
      },
      select: { temperature: true },
    });

    if (readings.length === 0) return null;

    const temperatures = readings.map((r) => r.temperature);
    return {
      min: Math.min(...temperatures),
      max: Math.max(...temperatures),
      avg: temperatures.reduce((a, b) => a + b, 0) / temperatures.length,
      count: readings.length,
    };
  },
};
