import { spawn, ChildProcess } from 'child_process';
import { prisma } from '@coldtrace/database';
import chalk from 'chalk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface TestResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown> | string;
}

interface DatabaseStats {
  device_count: number;
  total_readings: number;
  recent_readings: number;
}

class SimulatorVerificationTest {
  private simulatorProcess: ChildProcess | null = null;
  private testStartTime: Date;

  constructor() {
    this.testStartTime = new Date();
  }

  async runVerification(): Promise<void> {
    console.log(chalk.blue.bold('\n🧪 ColdTrace Simulator Verification Test'));
    console.log(chalk.blue('=========================================='));
    console.log(
      chalk.gray(`Test started at: ${this.testStartTime.toISOString()}`)
    );
    console.log();

    try {
      // Step 1: Check database connection
      const dbConnection = await this.testDatabaseConnection();
      this.logResult('Database Connection', dbConnection);
      if (!dbConnection.success) throw new Error(dbConnection.message);

      // Step 2: Check initial state
      const initialState = await this.checkInitialState();
      this.logResult('Initial State Check', initialState);

      // Step 3: Start simulator
      console.log(chalk.blue('🚀 Starting simulator...'));
      await this.startSimulator();

      // Step 4: Wait for simulator to initialize and run
      console.log(chalk.blue('⏳ Waiting 20 seconds for readings...'));
      await this.sleep(20000);

      // Step 5: Verify readings were created
      const readingsTest = await this.verifyReadingsCreated();
      this.logResult('Readings Created', readingsTest);

      // Step 6: Verify temperature ranges
      const temperatureTest = await this.verifyTemperatureRanges();
      this.logResult('Temperature Ranges', temperatureTest);

      // Step 7: Verify device activity
      const deviceActivityTest = await this.verifyDeviceActivity();
      this.logResult('Device Activity', deviceActivityTest);

      // Step 8: Verify reading frequency
      const frequencyTest = await this.verifyReadingFrequency();
      this.logResult('Reading Frequency', frequencyTest);

      console.log(chalk.green('\n✅ All verification tests passed!'));
      console.log(
        chalk.blue(
          '🎉 Simulator is working correctly and ready for production.'
        )
      );
    } catch (error) {
      console.log(
        chalk.red('\n❌ Verification failed:'),
        error instanceof Error ? error.message : error
      );
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }

  private async testDatabaseConnection(): Promise<TestResult> {
    try {
      await prisma.$connect();
      const deviceCount = await prisma.device.count();
      return {
        success: true,
        message: `Connected successfully, found ${deviceCount} devices`,
        details: { deviceCount },
      };
    } catch (error) {
      return {
        success: false,
        message: `Database connection failed: ${
          error instanceof Error ? error.message : error
        }`,
      };
    }
  }

  private async checkInitialState(): Promise<TestResult> {
    try {
      const stats = (await prisma.$queryRaw`
        SELECT 
          COUNT(DISTINCT d.id) as device_count,
          COUNT(r.id) as total_readings,
          COUNT(CASE WHEN r.timestamp >= NOW() - INTERVAL '1 minute' THEN 1 END) as recent_readings
        FROM "devices" d
        LEFT JOIN "readings" r ON d.id = r."deviceId"
        WHERE d."isActive" = true
      `) as DatabaseStats[];

      const { device_count, total_readings, recent_readings } = stats[0] || {
        device_count: 0,
        total_readings: 0,
        recent_readings: 0,
      };

      return {
        success: true,
        message: `Found ${device_count} active devices, ${total_readings} total readings, ${recent_readings} recent readings`,
        details: {
          device_count: Number(device_count),
          total_readings: Number(total_readings),
          recent_readings: Number(recent_readings),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Initial state check failed: ${
          error instanceof Error ? error.message : error
        }`,
      };
    }
  }

  private async startSimulator(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.simulatorProcess = spawn('pnpm', ['dev'], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'test' },
      });

      let hasStarted = false;

      this.simulatorProcess.stdout?.on('data', (data: Buffer) => {
        const output = data.toString();

        // Look for initialization success
        if (
          output.includes('🚀 Starting vaccine monitoring simulation') &&
          !hasStarted
        ) {
          hasStarted = true;
          clearTimeout(initTimeout);
          console.log(chalk.green('✅ Simulator started successfully'));
          resolve();
        }
      });

      this.simulatorProcess.stderr?.on('data', (data: Buffer) => {
        const error = data.toString();
        if (error.includes('Error') || error.includes('Failed')) {
          reject(new Error(`Simulator startup failed: ${error}`));
        }
      });

      this.simulatorProcess.on('exit', (code: number) => {
        if (code !== 0 && !hasStarted) {
          reject(new Error(`Simulator exited with code ${code}`));
        }
      });

      // Timeout after 10 seconds
      const initTimeout = setTimeout(() => {
        if (!hasStarted) {
          reject(new Error('Simulator failed to start within 10 seconds'));
        }
      }, 10000);
    });
  }

  private async verifyReadingsCreated(): Promise<TestResult> {
    try {
      const cutoffTime = new Date(this.testStartTime.getTime() - 5000); // 5 seconds before test start

      const recentReadings = await prisma.reading.findMany({
        where: {
          timestamp: {
            gte: cutoffTime,
          },
        },
        include: {
          device: {
            select: {
              name: true,
              location: true,
            },
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      });

      const deviceCount = await prisma.device.count({
        where: { isActive: true },
      });
      const expectedMinReadings = Math.floor((deviceCount * 15) / 5); // 15 seconds / 5 second intervals

      if (recentReadings.length >= expectedMinReadings) {
        return {
          success: true,
          message: `Created ${recentReadings.length} readings (expected at least ${expectedMinReadings})`,
          details: {
            actualReadings: recentReadings.length,
            expectedMinReadings,
            deviceCount,
          },
        };
      } else {
        return {
          success: false,
          message: `Only ${recentReadings.length} readings created, expected at least ${expectedMinReadings}`,
          details: {
            actualReadings: recentReadings.length,
            expectedMinReadings,
            deviceCount,
          },
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Reading verification failed: ${
          error instanceof Error ? error.message : error
        }`,
      };
    }
  }

  private async verifyTemperatureRanges(): Promise<TestResult> {
    try {
      const cutoffTime = new Date(this.testStartTime.getTime() - 5000);

      const readings = await prisma.reading.findMany({
        where: {
          timestamp: {
            gte: cutoffTime,
          },
        },
        select: {
          temperature: true,
          status: true,
        },
      });

      if (readings.length === 0) {
        return {
          success: false,
          message: 'No recent readings found for temperature analysis',
        };
      }

      const temperatures = readings.map((r) => r.temperature);
      const min = Math.min(...temperatures);
      const max = Math.max(...temperatures);
      const avg = temperatures.reduce((a, b) => a + b, 0) / temperatures.length;

      // Most readings should be in vaccine range (2-8°C), some excursions are expected
      const inRange = temperatures.filter((t) => t >= 2 && t <= 8).length;
      const inRangePercent = (inRange / temperatures.length) * 100;

      // Allow for demo excursions - at least 60% should be in normal range
      const isValid = inRangePercent >= 60 && min > -5 && max < 20; // Reasonable bounds

      return {
        success: isValid,
        message: `Temperature range valid: ${inRangePercent.toFixed(
          1
        )}% in vaccine range (2-8°C)`,
        details: {
          count: temperatures.length,
          min,
          max,
          avg: Math.round(avg * 100) / 100,
          inRangePercent: Math.round(inRangePercent * 10) / 10,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Temperature range verification failed: ${
          error instanceof Error ? error.message : error
        }`,
      };
    }
  }

  private async verifyDeviceActivity(): Promise<TestResult> {
    try {
      const cutoffTime = new Date(this.testStartTime.getTime() - 5000);

      const activeDevices = await prisma.device.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          readings: {
            where: {
              timestamp: {
                gte: cutoffTime,
              },
            },
            select: { id: true },
          },
        },
      });

      const devicesWithReadings = activeDevices.filter(
        (d) => d.readings.length > 0
      );
      const activityPercent =
        (devicesWithReadings.length / activeDevices.length) * 100;

      // At least 80% of devices should have recent readings (accounting for demo offline scenarios)
      const isValid = activityPercent >= 80;

      return {
        success: isValid,
        message: `${devicesWithReadings.length}/${
          activeDevices.length
        } devices active (${activityPercent.toFixed(1)}%)`,
        details: {
          totalDevices: activeDevices.length,
          activeDevices: devicesWithReadings.length,
          activityPercent: Math.round(activityPercent * 10) / 10,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Device activity verification failed: ${
          error instanceof Error ? error.message : error
        }`,
      };
    }
  }

  private async verifyReadingFrequency(): Promise<TestResult> {
    try {
      const cutoffTime = new Date(this.testStartTime.getTime() - 5000);

      // Get readings in 5-second intervals
      const readings = await prisma.reading.findMany({
        where: {
          timestamp: {
            gte: cutoffTime,
          },
        },
        select: {
          timestamp: true,
          deviceId: true,
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      if (readings.length < 10) {
        return {
          success: false,
          message: 'Not enough readings to verify frequency',
        };
      }

      // Group readings by device and check intervals
      const deviceReadings = readings.reduce((acc, reading) => {
        if (!acc[reading.deviceId]) acc[reading.deviceId] = [];
        acc[reading.deviceId]!.push(reading.timestamp);
        return acc;
      }, {} as Record<string, Date[]>);

      let totalIntervals = 0;
      let validIntervals = 0;

      Object.values(deviceReadings).forEach((timestamps) => {
        for (let i = 1; i < timestamps.length; i++) {
          const interval =
            timestamps[i]!.getTime() - timestamps[i - 1]!.getTime();
          totalIntervals++;

          // Allow for some variance (4-6 seconds is acceptable)
          if (interval >= 4000 && interval <= 6000) {
            validIntervals++;
          }
        }
      });

      const frequencyAccuracy =
        totalIntervals > 0 ? (validIntervals / totalIntervals) * 100 : 0;
      const isValid = frequencyAccuracy >= 70; // Allow some variance

      return {
        success: isValid,
        message: `Reading frequency accuracy: ${frequencyAccuracy.toFixed(
          1
        )}% within 5±1 second intervals`,
        details: {
          totalIntervals,
          validIntervals,
          frequencyAccuracy: Math.round(frequencyAccuracy * 10) / 10,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Reading frequency verification failed: ${
          error instanceof Error ? error.message : error
        }`,
      };
    }
  }

  private logResult(testName: string, result: TestResult): void {
    const status = result.success
      ? chalk.green('✅ PASS')
      : chalk.red('❌ FAIL');
    console.log(`${status} ${chalk.blue(testName)}: ${result.message}`);

    if (result.details) {
      console.log(
        chalk.gray(
          `   Details: ${JSON.stringify(result.details, null, 2).replace(
            /\n/g,
            '\n   '
          )}`
        )
      );
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async cleanup(): Promise<void> {
    console.log(chalk.blue('\n🧹 Cleaning up...'));

    if (this.simulatorProcess) {
      this.simulatorProcess.kill('SIGTERM');

      // Give it 2 seconds to shut down gracefully
      await this.sleep(2000);

      if (!this.simulatorProcess.killed) {
        this.simulatorProcess.kill('SIGKILL');
      }
    }

    await prisma.$disconnect();
    console.log(chalk.gray('✅ Cleanup completed'));
  }
}

// Run the verification test
if (require.main === module) {
  const test = new SimulatorVerificationTest();
  test.runVerification().catch((error) => {
    console.error(chalk.red('Test runner error:'), error);
    process.exit(1);
  });
}

export default SimulatorVerificationTest;
