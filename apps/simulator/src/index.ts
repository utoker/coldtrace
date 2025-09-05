import { ApolloClient, InMemoryCache, gql, HttpLink } from '@apollo/client';
import fetch from 'cross-fetch';
import dotenv from 'dotenv';
import chalk from 'chalk';
import * as readline from 'readline';

// Load environment variables
dotenv.config();

// Interfaces for GraphQL responses
interface Device {
  id: string;
  deviceId: string;
  name: string;
  location: string;
  minTemp: number;
  maxTemp: number;
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
  // Demo-specific fields
  isInExcursion: boolean;
  targetTemperature: number;
  demoMode: string | null;
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
  private isShuttingDown = false;
  private rl?: readline.Interface;

  // GraphQL Queries and Mutations
  private readonly GET_DEVICES = gql`
    query GetDevices {
      getDevices {
        id
        deviceId
        name
        location
        minTemp
        maxTemp
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

    // Configure Apollo Client
    this.client = new ApolloClient({
      link: new HttpLink({
        uri: process.env.GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql',
        fetch,
      }),
      cache: new InMemoryCache(),
      defaultOptions: {
        watchQuery: {
          errorPolicy: 'all',
        },
        query: {
          errorPolicy: 'all',
        },
        mutate: {
          errorPolicy: 'all',
        },
      },
    });

    // Setup readline for interactive controls
    try {
      this.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      console.log(
        chalk.green(
          '✅ Interactive controls initialized - keyboard commands ready'
        )
      );
    } catch (error) {
      console.error(
        chalk.red('❌ Failed to setup interactive controls:'),
        error
      );
      // Continue without interactive controls
    }

    // Setup graceful shutdown
    this.setupShutdownHandlers();

    // Setup interactive controls
    this.setupInteractiveControls();

    // Initialize and start
    this.initialize();
  }

  private setupShutdownHandlers(): void {
    const shutdown = () => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;

      console.log(chalk.yellow('\n🛑 Shutting down gracefully...'));

      if (this.rl) {
        this.rl.close();
      }

      if (this.intervalId) {
        clearInterval(this.intervalId);
      }

      this.displayFinalStats();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }

  private setupInteractiveControls(): void {
    if (!this.rl) {
      console.error(chalk.red('❌ Readline interface not initialized'));
      return;
    }

    console.log(chalk.blue('🎮 Setting up interactive controls...'));

    this.rl.on('line', (input: string) => {
      const command = input.trim().toLowerCase();

      // Debug logging to help troubleshoot
      console.log(
        chalk.magenta(
          `[DEBUG] Received command: "${command}" (length: ${command.length})`
        )
      );

      switch (command) {
        case 'e':
          this.triggerExcursion();
          break;
        case 'b':
          this.simulateLowBattery();
          break;
        case 'o':
          this.takeDeviceOffline();
          break;
        case 'r':
          this.returnToNormal();
          break;
        case 's':
          console.log(chalk.magenta('[DEBUG] Executing showCurrentStats()'));
          this.showCurrentStats();
          break;
        case 'q':
          this.gracefulShutdown();
          break;
        case 'p':
          this.simulatePowerOutage();
          break;
        case 'a':
          this.simulateBatchArrival();
          break;
        case 'h':
        case 'help':
          this.showControls();
          break;
        default:
          if (command !== '') {
            console.log(chalk.yellow('❓ Unknown command. Type "h" for help.'));
          }
      }
    });

    console.log(
      chalk.green('✅ Interactive controls ready - try typing "h" for help')
    );
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
    this.showControls();

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

    try {
      const result = await this.client.query<{ getDevices: Device[] }>({
        query: this.GET_DEVICES,
        fetchPolicy: 'network-only', // Always fetch fresh data
      });

      if (result.data?.getDevices) {
        const devices = result.data.getDevices as Device[];

        devices.forEach((device) => {
          this.devices.set(device.id, {
            ...device,
            battery: 100.0, // Start with full battery
            isOnline: true,
            lastReadingTime: new Date(),
            // Demo-specific fields
            isInExcursion: false,
            targetTemperature: 5.0, // Default vaccine storage temperature
            demoMode: null,
          });
        });

        console.log(
          chalk.green(`✅ Fetched ${devices.length} devices from database`)
        );

        // Display loaded devices
        devices.forEach((device) => {
          console.log(
            chalk.gray(`  📱 ${device.name} (${device.location}) - `) +
              chalk.cyan(`${device.minTemp}°C to ${device.maxTemp}°C`)
          );
        });
        console.log();
      } else {
        throw new Error('No devices returned from backend');
      }
    } catch (error) {
      console.error(chalk.red('❌ Failed to load devices:'), error);
      throw error;
    }
  }

  private generateVaccineTemperature(device: DeviceState): number {
    // Check if device is in demo mode
    if (device.isInExcursion) {
      // Gradually move towards target temperature
      const currentTemp = device.targetTemperature || 12.0;
      const variation = (Math.random() - 0.5) * 1.0; // Small variation
      return Math.round((currentTemp + variation) * 100) / 100;
    }

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

    // Normal variation: ±1.5°C (90% of the time)
    const normalVariation = (Math.random() - 0.5) * 3.0;

    // 10% chance of excursion outside normal range (reduced if in demo)
    const excursionChance = device.demoMode ? 0.02 : 0.1; // Less random excursions during demo
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
    console.log(chalk.green('🚀 Starting vaccine monitoring simulation...'));
    console.log(chalk.blue('📊 Sending readings every 10 minutes...\n'));

    this.intervalId = setInterval(async () => {
      if (this.isShuttingDown) return;

      const promises = Array.from(this.devices.entries()).map(
        async ([_deviceId, device]) => {
          // Update battery level (decreases by 0.1% per reading, now every 10 minutes) - only for online devices
          if (device.isOnline) {
            device.battery = Math.max(0, device.battery - 0.1);
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
    }, 600000); // Send readings every 10 minutes
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

  // Demo Control Methods
  private showControls(): void {
    console.log(chalk.green('📋 Interactive Demo Controls:'));
    console.log(chalk.gray('═══════════════════════════'));
    console.log(
      chalk.yellow('  e + Enter') +
        chalk.gray(' - Trigger temperature excursion on random device')
    );
    console.log(
      chalk.yellow('  b + Enter') +
        chalk.gray(' - Simulate low battery on random device')
    );
    console.log(
      chalk.yellow('  o + Enter') + chalk.gray(' - Take random device offline')
    );
    console.log(
      chalk.yellow('  p + Enter') +
        chalk.gray(' - Simulate power outage (all devices offline)')
    );
    console.log(
      chalk.yellow('  a + Enter') +
        chalk.gray(' - Simulate batch arrival (bring 3 devices online)')
    );
    console.log(
      chalk.yellow('  r + Enter') + chalk.gray(' - Reset all devices to normal')
    );
    console.log(
      chalk.yellow('  s + Enter') + chalk.gray(' - Show current statistics')
    );
    console.log(chalk.yellow('  h + Enter') + chalk.gray(' - Show this help'));
    console.log(chalk.yellow('  q + Enter') + chalk.gray(' - Quit gracefully'));
    console.log(chalk.gray('  Ctrl+C   ') + chalk.gray(' - Emergency stop'));
    console.log();
  }

  private getRandomOnlineDevice(): DeviceState | null {
    const onlineDevices = Array.from(this.devices.values()).filter(
      (d) => d.isOnline
    );
    if (onlineDevices.length === 0) return null;
    return (
      onlineDevices[Math.floor(Math.random() * onlineDevices.length)] || null
    );
  }

  private triggerExcursion(): void {
    const device = this.getRandomOnlineDevice();
    if (!device) {
      console.log(chalk.red('❌ No online devices available for excursion'));
      return;
    }

    device.isInExcursion = true;
    device.targetTemperature = 12.0; // Spike to dangerous temperature
    device.demoMode = 'excursion';

    console.log(
      chalk.red(`🌡️  EXCURSION: ${device.name} temperature spiking to 12°C!`)
    );

    // Reset after 5 minutes
    setTimeout(() => {
      if (device.demoMode === 'excursion') {
        device.isInExcursion = false;
        device.targetTemperature = 5.0;
        device.demoMode = null;
        console.log(
          chalk.green(
            `✅ ${device.name} excursion resolved, returning to normal`
          )
        );
      }
    }, 5 * 60 * 1000);
  }

  private simulateLowBattery(): void {
    const device = this.getRandomOnlineDevice();
    if (!device) {
      console.log(
        chalk.red('❌ No online devices available for battery simulation')
      );
      return;
    }

    device.battery = Math.random() * 15 + 5; // Between 5-20%
    device.demoMode = 'low_battery';

    console.log(
      chalk.yellow(
        `🔋 LOW BATTERY: ${device.name} battery at ${device.battery.toFixed(
          1
        )}%`
      )
    );
  }

  private takeDeviceOffline(): void {
    const device = this.getRandomOnlineDevice();
    if (!device) {
      console.log(chalk.red('❌ No online devices to take offline'));
      return;
    }

    device.isOnline = false;
    device.demoMode = 'offline';

    console.log(chalk.red(`📴 OFFLINE: ${device.name} has gone offline`));
  }

  private simulatePowerOutage(): void {
    const onlineDevices = Array.from(this.devices.values()).filter(
      (d) => d.isOnline
    );
    if (onlineDevices.length === 0) {
      console.log(
        chalk.red('❌ No online devices for power outage simulation')
      );
      return;
    }

    // Take all devices offline
    onlineDevices.forEach((device) => {
      device.isOnline = false;
      device.demoMode = 'power_outage';
    });

    console.log(
      chalk.red(
        `⚡ POWER OUTAGE: All ${onlineDevices.length} devices went offline!`
      )
    );

    // Bring them back after 30 seconds
    setTimeout(() => {
      onlineDevices.forEach((device) => {
        if (device.demoMode === 'power_outage') {
          device.isOnline = true;
          device.demoMode = null;
        }
      });
      console.log(
        chalk.green(
          `🔌 POWER RESTORED: ${onlineDevices.length} devices back online`
        )
      );
    }, 30 * 1000);
  }

  private simulateBatchArrival(): void {
    const offlineDevices = Array.from(this.devices.values()).filter(
      (d) => !d.isOnline
    );
    if (offlineDevices.length === 0) {
      console.log(chalk.yellow('💡 No offline devices to bring online'));
      return;
    }

    const devicesToActivate = offlineDevices.slice(0, 3);
    devicesToActivate.forEach((device) => {
      device.isOnline = true;
      device.battery = 85 + Math.random() * 15; // 85-100%
      device.demoMode = null;
    });

    console.log(
      chalk.green(
        `📦 BATCH ARRIVAL: ${devicesToActivate.length} devices came online simultaneously`
      )
    );
    devicesToActivate.forEach((device) => {
      console.log(
        chalk.gray(
          `  📱 ${device.name} - ${device.battery.toFixed(1)}% battery`
        )
      );
    });
  }

  private returnToNormal(): void {
    let changesCount = 0;

    Array.from(this.devices.values()).forEach((device) => {
      if (
        device.demoMode !== null ||
        device.isInExcursion ||
        !device.isOnline
      ) {
        device.isOnline = true;
        device.isInExcursion = false;
        device.targetTemperature = 5.0;
        device.demoMode = null;
        device.battery = Math.max(device.battery, 85 + Math.random() * 15);
        changesCount++;
      }
    });

    if (changesCount > 0) {
      console.log(
        chalk.green(
          `🔄 RESET: ${changesCount} devices returned to normal operation`
        )
      );
    } else {
      console.log(chalk.blue('ℹ️  All devices are already in normal state'));
    }
  }

  private showCurrentStats(): void {
    const runtime = Math.round(
      (Date.now() - this.stats.startTime.getTime()) / 1000
    );
    const successRate =
      this.stats.totalReadings > 0
        ? Math.round(
            (this.stats.successfulReadings / this.stats.totalReadings) * 100
          )
        : 0;

    console.log(chalk.blue('\n📊 Current Statistics:'));
    console.log(chalk.gray('════════════════════'));
    console.log(
      chalk.green(`✅ Successful readings: ${this.stats.successfulReadings}`)
    );
    console.log(chalk.red(`❌ Failed readings: ${this.stats.failedReadings}`));
    console.log(
      chalk.yellow(`⚠️  Alerts created: ${this.stats.alertsCreated}`)
    );
    console.log(chalk.blue(`📈 Success rate: ${successRate}%`));
    console.log(chalk.gray(`⏱️  Runtime: ${runtime}s`));

    // Device status overview
    const onlineDevices = Array.from(this.devices.values()).filter(
      (d) => d.isOnline
    );
    const offlineDevices = Array.from(this.devices.values()).filter(
      (d) => !d.isOnline
    );
    const excursionDevices = Array.from(this.devices.values()).filter(
      (d) => d.isInExcursion
    );
    const lowBatteryDevices = Array.from(this.devices.values()).filter(
      (d) => d.battery < 20
    );

    console.log(chalk.gray('\n🏥 Device Status Overview:'));
    console.log(chalk.green(`  📱 Online devices: ${onlineDevices.length}`));
    console.log(chalk.red(`  📴 Offline devices: ${offlineDevices.length}`));
    console.log(
      chalk.yellow(`  🌡️  Temperature excursions: ${excursionDevices.length}`)
    );
    console.log(
      chalk.hex('#FFA500')(
        `  🔋 Low battery devices: ${lowBatteryDevices.length}`
      )
    );
    console.log();
  }

  private gracefulShutdown(): void {
    console.log(chalk.yellow('🛑 Shutting down gracefully...'));

    if (this.rl) {
      this.rl.close();
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.displayFinalStats();
    process.exit(0);
  }
}

// Start the simulator
new VaccineSimulator();
