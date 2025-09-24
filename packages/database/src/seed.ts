import { prisma, DeviceStatus, ReadingStatus } from './index';

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
      latitude: 27.893,
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
    {
      deviceId: 'STP-VAC-011',
      name: 'Community Clinic K',
      location: 'St. Petersburg Community Health Center',
      latitude: 27.7676,
      longitude: -82.6403,
      minTemp: 2.0,
      maxTemp: 8.0,
      battery: 88.0,
      status: DeviceStatus.ONLINE,
    },
    {
      deviceId: 'CLW-VAC-012',
      name: 'Mobile Unit L',
      location: 'Clearwater Mobile Vaccine Clinic',
      latitude: 27.9659,
      longitude: -82.8001,
      minTemp: 2.0,
      maxTemp: 8.0,
      battery: 93.0,
      status: DeviceStatus.ONLINE,
    },
  ];

  // Idempotent seed: clear existing data first
  console.log('🧹 Clearing existing data (alerts, readings, devices)...');
  await prisma.alert.deleteMany();
  await prisma.reading.deleteMany();
  await prisma.device.deleteMany();

  // Create vaccine storage devices
  console.log('📱 Creating Tampa vaccine storage devices...');
  const createdDevices = await prisma.device.createManyAndReturn({
    data: vaccineDevices,
  });

  console.log(`✅ Created ${createdDevices.length} devices in Tampa, Florida`);

  // Create initial readings for each device
  console.log('📊 Creating initial sensor readings...');
  const readings = [];

  for (const device of createdDevices) {
    // Generate 14 days of historical readings for each device (every 2 hours)
    const totalDays = 14;
    const readingsPerDay = 12; // 2 hours interval
    const totalSteps = totalDays * readingsPerDay; // 168 steps

    // Determine recharge point: when baseline battery (<20%) then recharge within next 24h
    const thresholdStep = Math.floor(0.2 * (totalSteps - 1));
    const rechargeOffset = Math.floor(Math.random() * readingsPerDay); // 0..11
    const rechargeStep = Math.max(0, thresholdStep - rechargeOffset);

    let lastBatteryForDevice = device.battery ?? 100.0;

    for (let step = totalSteps - 1; step >= 0; step--) {
      // step = totalSteps-1 (oldest), 0 (newest/now)
      const timestamp = new Date(Date.now() - step * 2 * 60 * 60 * 1000);

      // Vaccine storage temperature (2-8°C) with some variation
      const baseTemp = 5.0; // Middle of vaccine range
      const tempVariation = (Math.random() - 0.5) * 3; // ±1.5°C variation
      const temperature = baseTemp + tempVariation;

      // Linear battery drain 100 -> 0 over 14 days, with a single recharge when <20%
      let battery: number;
      if (step > rechargeStep) {
        // Before recharge event: constant-rate drain from 100 based on elapsed steps since oldest
        const perStepDrain = 100 / (totalSteps - 1);
        const elapsedStepsSinceOldest = totalSteps - 1 - step;
        battery = 100 - elapsedStepsSinceOldest * perStepDrain;
      } else if (step === rechargeStep) {
        // Recharge at this timestamp
        battery = 100;
      } else {
        // After recharge towards now: drain from 100 using the same per-step rate
        const perStepDrain = 100 / (totalSteps - 1);
        const stepsSinceRecharge = rechargeStep - step;
        battery = 100 - stepsSinceRecharge * perStepDrain;
      }

      // Clamp to [0, 100] and round to 2 decimals
      battery = Math.max(0, Math.min(100, Math.round(battery * 100) / 100));

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

      lastBatteryForDevice = battery;
    }

    // Update device battery to the latest reading's battery value
    await prisma.device.update({
      where: { id: device.id },
      data: { battery: lastBatteryForDevice },
    });
  }

  await prisma.reading.createMany({
    data: readings,
  });

  console.log(
    `📈 Created ${readings.length} temperature readings across 14 days`
  );
  console.log('✅ Vaccine monitoring system seeded successfully!');

  // Display summary
  console.log('\n📋 Vaccine Cold-Chain Monitoring Summary:');
  console.log(
    `   💉 Vaccine Storage Devices: ${createdDevices.length} (Tampa Bay Area)`
  );
  console.log(
    `   📊 Temperature Readings: ${readings.length} (14 days history)`
  );
  console.log('');
  console.log(`   🌡️  Temperature Range: 2-8°C (vaccine storage)`);
  console.log(
    `   🔋 Battery Monitoring: Linear drain with single recharge below 20%`
  );
  console.log('\n🌐 Access your data:');
  console.log(
    '   📱 Prisma Studio: pnpm --filter @coldtrace/database db:studio'
  );
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
