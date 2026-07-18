import { ApolloClient, InMemoryCache, gql, HttpLink } from '@apollo/client';
import fetch from 'cross-fetch';
import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables
dotenv.config();

// Interfaces for GraphQL responses
interface Device {
  id: string;
  deviceId: string;
  name: string;
  location: string;
  latitude?: number;
  longitude?: number;
  minTemp: number;
  maxTemp: number;
  battery: number;
  status: string;
}

interface Reading {
  id: string;
  temperature: number;
  battery: number;
  status: string;
}

// Alert interface for future use
// interface Alert {
//   id: string;
//   message: string;
// }

// Simulator device state
interface DeviceState extends Device {
  battery: number;
  isOnline: boolean;
  lastReadingTime: Date;
  // Production fields
  isMobile: boolean;
  targetTemperature: number;
}

// Statistics tracking
interface Stats {
  totalReadings: number;
  successfulReadings: number;
  failedReadings: number;
  alertsCreated: number;
  startTime: Date;
}

class VaccineSimulator {
  private client: ApolloClient;
  private devices: Map<string, DeviceState> = new Map();
  private stats: Stats;
  private intervalId?: NodeJS.Timeout;
  private refetchIntervalId?: NodeJS.Timeout;
  private isShuttingDown = false;

  // GraphQL Queries and Mutations
  private readonly GET_DEVICES = gql`
    query GetDevices {
      getDevices {
        id
        deviceId
        name
        location
        latitude
        longitude
        minTemp
        maxTemp
        battery
        status
      }
    }
  `;

  private readonly CREATE_READING = gql`
    mutation CreateReading($input: CreateReadingInput!) {
      createReading(input: $input) {
        id
        temperature
        battery
        status
      }
    }
  `;

  constructor() {
    this.stats = {
      totalReadings: 0,
      successfulReadings: 0,
      failedReadings: 0,
      alertsCreated: 0,
      startTime: new Date(),
    };

    // Configure Apollo Client with increased timeout for Railway cold starts
    // Create a custom fetch with timeout
    const fetchWithTimeout: typeof fetch = async (input, options = {}) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      try {
        const response = await fetch(input, {
          ...options,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    };

    this.client = new ApolloClient({
      link: new HttpLink({
        uri: process.env.GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql',
        fetch: fetchWithTimeout,
      }),
      cache: new InMemoryCache(),
      defaultOptions: {
        watchQuery: {
          errorPolicy: 'all',
          fetchPolicy: 'network-only',
        },
        query: {
          errorPolicy: 'all',
          fetchPolicy: 'network-only',
        },
        mutate: {
          errorPolicy: 'all',
        },
      },
    });

    // Setup graceful shutdown
    this.setupShutdownHandlers();

    // Initialize and start
    this.initialize();
  }

  private setupShutdownHandlers(): void {
    const shutdown = () => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;

      console.log(chalk.yellow('\n🛑 Shutting down gracefully...'));

      if (this.intervalId) {
        clearInterval(this.intervalId);
      }
      if (this.refetchIntervalId) {
        clearInterval(this.refetchIntervalId);
      }

      this.displayFinalStats();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }

  private async initialize(): Promise<void> {
    console.log(chalk.blue.bold('\n💉 ColdTrace Vaccine Monitoring Simulator'));
    console.log(chalk.blue('========================================'));
    console.log(
      chalk.gray(
        `GraphQL Endpoint: ${
          process.env.GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql'
        }`
      )
    );
    console.log(chalk.gray('Temperature Range: 2-8°C (Vaccine Storage)'));
    console.log();

    try {
      console.log(chalk.blue('🔄 Initializing simulator...'));
      await this.loadDevicesFromBackend();
      console.log(
        chalk.green(
          `✅ Connected to GraphQL at ${
            process.env.GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql'
          }`
        )
      );
      this.startSimulation();
    } catch (error) {
      console.error(chalk.red('❌ Failed to initialize simulator:'), error);
      process.exit(1);
    }
  }

  private async loadDevicesFromBackend(): Promise<void> {
    console.log(chalk.blue('📡 Fetching devices from GraphQL backend...'));

    // Retry logic for Railway cold start (database may be sleeping)
    const maxRetries = 3;
    const retryDelays = [5000, 10000, 15000]; // 5s, 10s, 15s

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          chalk.gray(
            `   Attempt ${attempt}/${maxRetries}${
              attempt > 1 ? ' (database may be waking up...)' : ''
            }`
          )
        );

        const result = await this.client.query<{ getDevices: Device[] }>({
          query: this.GET_DEVICES,
          fetchPolicy: 'network-only', // Always fetch fresh data
        });

        if (result.data?.getDevices) {
          const devices = result.data.getDevices as Device[];

          if (devices.length === 0) {
            throw new Error(
              'Query succeeded but no devices found in database. Please ensure devices are seeded.'
            );
          }

          this.reconcileDevices(devices);

          console.log(
            chalk.green(`✅ Fetched ${devices.length} devices from database`)
          );

          // Display loaded devices
          devices.forEach((device) => {
            const deviceType = this.isMobileDevice(device) ? '🚛' : '🏥';
            console.log(
              chalk.gray(
                `  ${deviceType} ${device.name} (${device.location}) - `
              ) +
                chalk.cyan(`${device.minTemp}°C to ${device.maxTemp}°C, `) +
                chalk.yellow(`${device.battery.toFixed(1)}% battery`)
            );
          });
          console.log();
          return; // Success, exit retry loop
        } else {
          throw new Error('No devices data in GraphQL response');
        }
      } catch (error) {
        const isLastAttempt = attempt === maxRetries;
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        if (isLastAttempt) {
          console.error(
            chalk.red(
              `❌ Failed to load devices after ${maxRetries} attempts:`
            ),
            errorMessage
          );
          throw error;
        }

        console.warn(
          chalk.yellow(`⚠️  Attempt ${attempt} failed: ${errorMessage}`)
        );
        const delay = retryDelays[attempt - 1] || 10000;
        console.log(chalk.gray(`   Retrying in ${delay / 1000} seconds...`));
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // Merge fresh device rows from the DB into the in-memory Map. On first load
  // this populates the Map; on later calls it reconciles status/threshold
  // changes without discarding drift state (battery, lastReadingTime,
  // targetTemperature). Devices removed from the DB are dropped; new ones are
  // added. isOnline flips both ways so a device flipped in the UI (via
  // takeDeviceOffline / returnToNormal / simulateBatchArrival / power-outage)
  // is picked up on the next refetch.
  private reconcileDevices(fresh: Device[]): void {
    const freshIds = new Set<string>();
    for (const device of fresh) {
      freshIds.add(device.id);
      const existing = this.devices.get(device.id);
      if (existing) {
        // Update fields that the DB owns; preserve simulator-owned drift state.
        existing.name = device.name;
        existing.location = device.location;
        if (device.latitude !== undefined) existing.latitude = device.latitude;
        if (device.longitude !== undefined)
          existing.longitude = device.longitude;
        existing.minTemp = device.minTemp;
        existing.maxTemp = device.maxTemp;
        existing.status = device.status;
        existing.isOnline = device.status === 'ONLINE';
        existing.isMobile = this.isMobileDevice(device);
      } else {
        this.devices.set(device.id, {
          ...device,
          battery: device.battery,
          isOnline: device.status === 'ONLINE',
          lastReadingTime: new Date(),
          isMobile: this.isMobileDevice(device),
          targetTemperature: 5.0,
        });
      }
    }
    // Drop any device that no longer exists in the DB.
    for (const id of this.devices.keys()) {
      if (!freshIds.has(id)) this.devices.delete(id);
    }
  }

  private async refetchDeviceStatus(): Promise<void> {
    if (this.isShuttingDown) return;
    try {
      const result = await this.client.query<{ getDevices: Device[] }>({
        query: this.GET_DEVICES,
        fetchPolicy: 'network-only',
      });
      const fresh = result.data?.getDevices as Device[] | undefined;
      if (!fresh || fresh.length === 0) return;

      const before = new Map<string, boolean>();
      for (const [id, d] of this.devices) before.set(id, d.isOnline);

      this.reconcileDevices(fresh);

      // Log flips so operators can see reconciliation happen.
      for (const [id, d] of this.devices) {
        const prev = before.get(id);
        if (prev === undefined) {
          console.log(chalk.cyan(`🔄 refetch: added ${d.name} (${d.status})`));
        } else if (prev !== d.isOnline) {
          console.log(
            chalk.cyan(
              `🔄 refetch: ${d.name} ${prev ? 'ONLINE→OFFLINE' : 'OFFLINE→ONLINE'}`
            )
          );
        }
      }
      for (const id of before.keys()) {
        if (!this.devices.has(id)) {
          console.log(chalk.cyan(`🔄 refetch: removed device ${id}`));
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(chalk.yellow(`⚠️  device refetch failed: ${msg}`));
    }
  }

  private isMobileDevice(device: Device): boolean {
    const mobileKeywords = ['mobile', 'transport', 'vehicle', 'truck', 'unit'];
    return mobileKeywords.some((keyword) =>
      device.name.toLowerCase().includes(keyword)
    );
  }

  private updateMobileDeviceLocation(device: DeviceState): void {
    if (!device.latitude || !device.longitude) return;

    // Simulate movement within Tampa Bay area
    // Tampa Bay bounds: lat 27.8-28.2, lng -82.6 to -82.3
    const latVariation = (Math.random() - 0.5) * 0.01; // ±0.005 degrees (~0.5km)
    const lngVariation = (Math.random() - 0.5) * 0.01;

    const newLat = Math.max(
      27.8,
      Math.min(28.2, device.latitude + latVariation)
    );
    const newLng = Math.max(
      -82.6,
      Math.min(-82.3, device.longitude + lngVariation)
    );

    device.latitude = newLat;
    device.longitude = newLng;

    console.log(
      chalk.blue(
        `🚛 ${device.name} moved to: ${newLat.toFixed(4)}, ${newLng.toFixed(4)}`
      )
    );
  }

  private generateVaccineTemperature(device: DeviceState): number {
    // Check if device is offline
    if (!device.isOnline) {
      // Return last known temperature with slight drift
      return (
        Math.round(
          (device.targetTemperature + (Math.random() - 0.5) * 0.5) * 100
        ) / 100
      );
    }

    // Base temperature for vaccines: 5°C (middle of 2-8°C range)
    const baseTemp = device.targetTemperature || 5.0;

    // Normal variation: ±1.5°C for realistic temperature fluctuations
    const normalVariation = (Math.random() - 0.5) * 3.0;

    // Very low chance of excursion in production (0.1% chance)
    const excursionChance = 0.001;
    const randomCheck = Math.random();
    let temperature: number;

    if (randomCheck < excursionChance) {
      // Temperature excursion - go outside the safe range
      if (Math.random() < 0.5) {
        // Too cold (below 2°C)
        temperature = device.minTemp - (Math.random() * 2 + 0.5);
      } else {
        // Too warm (above 8°C)
        temperature = device.maxTemp + (Math.random() * 5 + 0.5);
      }
    } else {
      // Normal temperature within expected range
      temperature = baseTemp + normalVariation;
    }

    return Math.round(temperature * 100) / 100; // Round to 2 decimal places
  }

  private calculateReadingStatus(
    temperature: number,
    minTemp: number,
    maxTemp: number
  ): string {
    if (temperature < minTemp - 1 || temperature > maxTemp + 1) {
      return 'CRITICAL';
    } else if (temperature < minTemp || temperature > maxTemp) {
      return 'WARNING';
    } else {
      return 'NORMAL';
    }
  }

  private getStatusColor(status: string): typeof chalk.red {
    switch (status) {
      case 'CRITICAL':
        return chalk.red;
      case 'WARNING':
        return chalk.yellow;
      case 'NORMAL':
      default:
        return chalk.green;
    }
  }

  private async sendReadingWithRetry(
    deviceId: string,
    input: { deviceId: string; temperature: number; battery: number },
    maxRetries = 3
  ): Promise<Reading | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.client.mutate<{ createReading: Reading }>({
          mutation: this.CREATE_READING,
          variables: { input },
        });

        if (result.data?.createReading) {
          return result.data.createReading as Reading;
        }
        throw new Error('No reading data returned');
      } catch (error) {
        if (attempt === maxRetries) {
          console.error(
            chalk.red(
              `❌ Failed to send reading for ${deviceId} after ${maxRetries} attempts:`
            ),
            error instanceof Error ? error.message : error
          );
          return null;
        }

        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    return null;
  }

  private startSimulation(): void {
    const intervalMinutes = Number(process.env.SIM_INTERVAL_MINUTES || 10);
    const refetchMinutes = Number(process.env.SIM_REFETCH_MINUTES || 5);
    const runOnce = process.env.SIM_RUN_ONCE === 'true';

    console.log(chalk.green('🚀 Starting vaccine monitoring simulation...'));
    console.log(
      chalk.blue(`📊 Sending readings every ${intervalMinutes} minutes...\n`)
    );

    const tick = async () => {
      if (this.isShuttingDown) return;

      const promises = Array.from(this.devices.entries()).map(
        async ([_deviceId, device]) => {
          // Update battery level (decreases by 0.5% per reading, now every 2 hours) - only for online devices
          if (device.isOnline) {
            device.battery = Math.max(0, device.battery - 0.5); // 0.5% every 2 hours (6% per day)

            // Auto-recharge when battery drops below 20%
            if (device.battery < 20) {
              device.battery = 100;
              console.log(
                chalk.green(
                  `🔋 AUTO-RECHARGE: ${device.name} battery recharged to 100%`
                )
              );
            }
          }

          // Update location for mobile devices
          if (device.isMobile && device.isOnline) {
            this.updateMobileDeviceLocation(device);
          }

          device.lastReadingTime = new Date();

          // Generate vaccine storage temperature
          const temperature = this.generateVaccineTemperature(device);
          const status = this.calculateReadingStatus(
            temperature,
            device.minTemp,
            device.maxTemp
          );

          // Skip sending readings for offline devices
          if (!device.isOnline) {
            console.log(
              chalk.gray(`[${new Date().toISOString().substring(11, 19)}] `) +
                chalk.red(device.name) +
                ': ' +
                chalk.gray(`${temperature}°C`) +
                chalk.red(', OFFLINE - no reading sent')
            );
            return; // Skip the rest for offline devices
          }

          // Prepare reading input
          const readingInput = {
            deviceId: device.id,
            temperature,
            battery: device.battery,
          };

          this.stats.totalReadings++;

          // Send reading to backend
          const reading = await this.sendReadingWithRetry(
            device.id,
            readingInput
          );

          if (reading) {
            this.stats.successfulReadings++;

            // Display with color coding
            const statusColor = this.getStatusColor(status);
            const timestamp = new Date().toISOString().substring(11, 19);

            console.log(
              chalk.gray(`[${timestamp}] `) +
                chalk.blue(device.name) +
                ': ' +
                statusColor(`${temperature}°C`) +
                chalk.gray(`, ${device.battery.toFixed(2)}%, ${status}`) +
                chalk.green(' ✓ saved')
            );

            // Check for alerts (temperature excursions)
            if (status === 'WARNING' || status === 'CRITICAL') {
              this.stats.alertsCreated++;
            }
          } else {
            this.stats.failedReadings++;
          }
        }
      );

      await Promise.all(promises);

      // Show periodic statistics every reading cycle (since they're now 10 minutes apart)
      if (
        this.stats.totalReadings > 0 &&
        this.stats.totalReadings % this.devices.size === 0
      ) {
        const successRate = Math.round(
          (this.stats.successfulReadings / this.stats.totalReadings) * 100
        );
        console.log(
          chalk.blue(
            `📈 Total readings sent: ${this.stats.totalReadings}, Success rate: ${successRate}%`
          )
        );
      }
    };

    // Run immediately once if requested, then exit
    if (runOnce) {
      tick()
        .then(() => this.displayFinalStats())
        .catch((_e) => this.displayFinalStats());
      return;
    }

    // Schedule interval
    this.intervalId = setInterval(tick, intervalMinutes * 60 * 1000);

    // Periodically refetch device status so status flips in the UI
    // (takeDeviceOffline / returnToNormal / batch arrival / power outage) are
    // observed within one refetch interval, in both directions.
    if (refetchMinutes > 0) {
      console.log(
        chalk.blue(
          `🔄 Refetching device status every ${refetchMinutes} minutes\n`
        )
      );
      this.refetchIntervalId = setInterval(
        () => void this.refetchDeviceStatus(),
        refetchMinutes * 60 * 1000
      );
    }
  }

  private displayFinalStats(): void {
    const runtime = Math.round(
      (Date.now() - this.stats.startTime.getTime()) / 1000
    );
    const successRate =
      this.stats.totalReadings > 0
        ? Math.round(
            (this.stats.successfulReadings / this.stats.totalReadings) * 100
          )
        : 0;

    console.log(chalk.blue('\n📊 Simulation Statistics:'));
    console.log(chalk.gray('========================'));
    console.log(
      chalk.green(`✅ Successful readings: ${this.stats.successfulReadings}`)
    );
    console.log(chalk.red(`❌ Failed readings: ${this.stats.failedReadings}`));
    console.log(
      chalk.yellow(`⚠️  Alerts created: ${this.stats.alertsCreated}`)
    );
    console.log(chalk.blue(`📈 Success rate: ${successRate}%`));
    console.log(chalk.gray(`⏱️  Runtime: ${runtime}s`));
    console.log(chalk.gray(`🔋 Devices monitored: ${this.devices.size}`));
    console.log(chalk.blue('\n👋 Vaccine monitoring simulation stopped.\n'));
  }
}

// Start the simulator
new VaccineSimulator();
