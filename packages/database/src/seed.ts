import { prisma, DeviceStatus, AlertType, AlertSeverity, ReadingStatus } from './index';

async function seed() {
  console.log('💉 Seeding ColdTrace Vaccine Monitoring System...');

  // Tampa Bay Area Vaccine Storage Devices
  const vaccineDevices = [
    {
      deviceId: 'TGH-VAC-001',
      name: 'Vaccine Cooler A',
      location: 'Tampa General Hospital Pharmacy',
      latitude: 27.9462,
      longitude: -82.4595,
      minTemp: 2.0,
      maxTemp: 8.0,
      battery: 100.0,
      status: DeviceStatus.ONLINE,
    },
    {
      deviceId: 'USF-VAC-002',
      name: 'Transport Unit B',
      location: 'USF Health Tampa Campus',
      latitude: 28.0644,
      longitude: -82.4267,
      minTemp: 2.0,
      maxTemp: 8.0,
      battery: 95.0,
      status: DeviceStatus.ONLINE,
    },
    {
      deviceId: 'MOF-VAC-003',
      name: 'Hospital Freezer C',
      location: 'Moffitt Cancer Center Pharmacy',
      latitude: 28.0639,
      longitude: -82.4185,
      minTemp: 2.0,
      maxTemp: 8.0,
      battery: 98.0,
      status: DeviceStatus.ONLINE,
    },
    {
      deviceId: 'CVS-VAC-004',
      name: 'Pharmacy Cooler D',
      location: 'CVS Pharmacy - Hyde Park',
      latitude: 27.9465,
      longitude: -82.4743,
      minTemp: 2.0,
      maxTemp: 8.0,
      battery: 92.0,
      status: DeviceStatus.ONLINE,
    },
    {
      deviceId: 'WAL-VAC-005',
      name: 'Pharmacy Unit E',
      location: 'Walgreens - Westshore Plaza',
      latitude: 27.8930,
      longitude: -82.5131,
      minTemp: 2.0,
      maxTemp: 8.0,
      battery: 100.0,
      status: DeviceStatus.ONLINE,
    },
    {
      deviceId: 'DOH-VAC-006',
      name: 'Distribution Center F',
      location: 'Florida Dept of Health - Tampa',
      latitude: 27.9755,
      longitude: -82.5333,
      minTemp: 2.0,
      maxTemp: 8.0,
      battery: 87.0,
      status: DeviceStatus.ONLINE,
    },
    {
      deviceId: 'TGH-VAC-007',
      name: 'Mobile Unit G',
      location: 'TGH Mobile Vaccine Unit',
      latitude: 27.9167,
      longitude: -82.4482,
      minTemp: 2.0,
      maxTemp: 8.0,
      battery: 94.0,
      status: DeviceStatus.ONLINE,
    },
    {
      deviceId: 'YBC-VAC-008',
      name: 'Community Center H',
      location: 'Ybor City Community Health Center',
      latitude: 27.9659,
      longitude: -82.4384,
      minTemp: 2.0,
      maxTemp: 8.0,
      battery: 89.0,
      status: DeviceStatus.ONLINE,
    },
    {
      deviceId: 'SEM-VAC-009',
      name: 'Transport Vehicle I',
      location: 'Seminole Heights Mobile Unit',
      latitude: 28.0123,
      longitude: -82.4715,
      minTemp: 2.0,
      maxTemp: 8.0,
      battery: 96.0,
      status: DeviceStatus.ONLINE,
    },
    {
      deviceId: 'BRN-VAC-010',
      name: 'Vaccine Storage J',
      location: 'Brandon Regional Hospital',
      latitude: 27.9378,
      longitude: -82.2859,
      minTemp: 2.0,
      maxTemp: 8.0,
      battery: 91.0,
      status: DeviceStatus.ONLINE,
    },
  ];

  // Create vaccine storage devices
  console.log('📱 Creating Tampa vaccine storage devices...');
  const createdDevices = await prisma.device.createManyAndReturn({
    data: vaccineDevices,
  });

  console.log(`✅ Created ${createdDevices.length} devices in Tampa, Florida`);

  // Create initial readings for each device
  console.log('📊 Creating initial sensor readings...');
  const readings = [];
  const alerts = [];

  for (const device of createdDevices) {
    // Generate 7 days of historical readings for each device (every 2 hours)
    for (let i = 0; i < 84; i++) { // 7 days * 12 readings per day
      const timestamp = new Date(Date.now() - (i * 2 * 60 * 60 * 1000)); // 2 hours apart
      
      // Vaccine storage temperature (2-8°C) with some variation
      const baseTemp = 5.0; // Middle of vaccine range
      const tempVariation = (Math.random() - 0.5) * 3; // ±1.5°C variation
      const temperature = baseTemp + tempVariation;
      
      // Battery level with gradual drain
      const batteryDrain = i * 0.1; // Gradual battery decrease
      const battery = Math.max(15, device.battery - batteryDrain + (Math.random() * 2));
      
      // Determine reading status based on temperature
      const getReadingStatus = (temp: number): ReadingStatus => {
        if (temp < 1 || temp > 9) return ReadingStatus.CRITICAL;
        if (temp < 2 || temp > 8) return ReadingStatus.WARNING;
        return ReadingStatus.NORMAL;
      };

      readings.push({
        deviceId: device.id,
        temperature,
        battery,
        status: getReadingStatus(temperature),
        timestamp,
      });

      // Create alerts for temperature threshold violations
      if (temperature > device.maxTemp) {
        alerts.push({
          deviceId: device.id,
          type: AlertType.TEMPERATURE_HIGH,
          severity: temperature > (device.maxTemp + 2) ? AlertSeverity.CRITICAL : AlertSeverity.HIGH,
          message: `High Temperature Alert - ${device.name}: ${temperature.toFixed(1)}°C exceeds maximum threshold of ${device.maxTemp}°C`,
          temperature: temperature,
          threshold: device.maxTemp,
          acknowledged: false,
          createdAt: timestamp,
        });
      }

      if (temperature < device.minTemp) {
        alerts.push({
          deviceId: device.id,
          type: AlertType.TEMPERATURE_LOW,
          severity: temperature < (device.minTemp - 2) ? AlertSeverity.CRITICAL : AlertSeverity.HIGH,
          message: `Low Temperature Alert - ${device.name}: ${temperature.toFixed(1)}°C below minimum threshold of ${device.minTemp}°C`,
          temperature: temperature,
          threshold: device.minTemp,
          acknowledged: false,
          createdAt: timestamp,
        });
      }

      if (battery < 20) {
        alerts.push({
          deviceId: device.id,
          type: AlertType.BATTERY_LOW,
          severity: AlertSeverity.MEDIUM,
          message: `Low Battery - ${device.name}: Battery level at ${battery.toFixed(1)}%`,
          temperature: null,
          threshold: 20,
          acknowledged: false,
          createdAt: timestamp,
        });
      }
    }
  }

  await prisma.reading.createMany({
    data: readings,
  });

  if (alerts.length > 0) {
    await prisma.alert.createMany({
      data: alerts,
    });
    console.log(`⚠️  Created ${alerts.length} alerts based on sensor data`);
  }

  console.log(`📈 Created ${readings.length} temperature readings across 7 days`);
  console.log('✅ Vaccine monitoring system seeded successfully!')
  
  // Display summary
  console.log('\n📋 Vaccine Cold-Chain Monitoring Summary:');
  console.log(`   💉 Vaccine Storage Devices: ${createdDevices.length} (Tampa Bay Area)`);
  console.log(`   📊 Temperature Readings: ${readings.length} (7 days history)`);
  console.log(`   ⚠️  Temperature Alerts: ${alerts.length}`);
  console.log(`   🌡️  Temperature Range: 2-8°C (vaccine storage)`);
  console.log(`   🔋 Battery Monitoring: Enabled`);
  console.log('\n🌐 Access your data:');
  console.log('   📱 Prisma Studio: pnpm --filter @coldtrace/database db:studio');
  console.log('   🗄️  GraphQL Playground: http://localhost:4000/graphql');
}

seed()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });