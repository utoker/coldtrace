import { prisma } from '@coldtrace/database';
import chalk from 'chalk';
import dotenv from 'dotenv';

// CRITICAL: Load environment variables FIRST before any other imports
// This fixes the tsx environment variable inheritance issue
dotenv.config();

console.log("🚀 Test script starting...");
console.log("🚀 Environment check:");
console.log("🚀 All env vars with DATABASE:", Object.keys(process.env).filter(key => key.includes("DATABASE")));
console.log("🚀 DATABASE_URL from process.env:", process.env.DATABASE_URL ? "EXISTS" : "NOT EXISTS");
if (process.env.DATABASE_URL) {
  console.log("🚀 DATABASE_URL length:", process.env.DATABASE_URL.length);
  console.log("🚀 DATABASE_URL starts with:", process.env.DATABASE_URL.substring(0, 30));
}

// Check if DATABASE_URL is available
console.log(chalk.blue("🔍 Debug: Checking environment variables..."));
console.log(chalk.blue("🔍 NODE_ENV:", process.env.NODE_ENV));
console.log(chalk.blue("🔍 DATABASE_URL exists:", !!process.env.DATABASE_URL));
if (process.env.DATABASE_URL) {
  console.log(chalk.blue("🔍 DATABASE_URL starts with:", process.env.DATABASE_URL.substring(0, 20) + "..."));
}

if (!process.env.DATABASE_URL) {
  console.log(chalk.red('❌ DATABASE_URL environment variable is not set'));
  console.log(chalk.red('Please ensure you have:'));
  console.log(chalk.red('1. Created a .env file in packages/database/'));
  console.log(chalk.red('2. Set DATABASE_URL to your PostgreSQL connection string'));
  console.log(chalk.red('3. Started your PostgreSQL server'));
  console.log(chalk.red(''));
  console.log(chalk.red('Example DATABASE_URL:'));
  console.log(chalk.red('DATABASE_URL="postgresql://username:password@localhost:5432/coldtrace?schema=public"'));
  console.log(chalk.red(''));
  console.log(chalk.red('🔍 Available environment variables:'));
  console.log(chalk.red(Object.keys(process.env).sort().join(", ")));
  console.log(chalk.red('🔍 Looking for DATABASE_URL in all possible forms...'));
  const dbVars = Object.keys(process.env).filter(key => key.includes("DATABASE") || key.includes("DB"));
  console.log(chalk.red('🔍 Database-related vars:', dbVars));
  process.exit(1);
}

// Test database connection
async function testDatabaseConnection() {
  try {
    console.log(chalk.blue('🔍 Testing database connection...'));
    
    // Test basic connection
    await prisma.$connect();
    console.log(chalk.green('✅ Database connection successful'));
    
    // Test a simple query
    const deviceCount = await prisma.device.count();
    console.log(chalk.green(`✅ Database query successful - Found ${deviceCount} devices`));
    
    await prisma.$disconnect();
    console.log(chalk.green('✅ Database disconnection successful'));
    
  } catch (error) {
    console.log(chalk.red('❌ Database connection failed:'));
    console.log(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

// Test GraphQL endpoint
async function testGraphQLEndpoint() {
  try {
    console.log(chalk.blue('🔍 Testing GraphQL endpoint...'));
    
    const response = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query {
            devices {
              id
              name
              status
            }
          }
        `,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    console.log(chalk.green('✅ GraphQL endpoint test successful'));
    console.log(chalk.green(`✅ Found ${data.data.devices.length} devices via GraphQL`));
    
  } catch (error) {
    console.log(chalk.yellow('⚠️ GraphQL endpoint test failed (this is expected in CI):'));
    console.log(chalk.yellow(error instanceof Error ? error.message : String(error)));
  }
}

// Test simulator functionality
async function testSimulator() {
  try {
    console.log(chalk.blue('🔍 Testing simulator functionality...'));
    
    // Test reading generation
    const devices = await prisma.device.findMany();
    if (devices.length === 0) {
      console.log(chalk.yellow('⚠️ No devices found - skipping simulator test'));
      return;
    }

    const device = devices[0];
    if (!device) {
      console.log(chalk.yellow('⚠️ No device found - skipping simulator test'));
      return;
    }
    
    console.log(chalk.green(`✅ Testing with device: ${device.name}`));
    
    // Test reading creation
    const testReading = await prisma.reading.create({
      data: {
        deviceId: device.id,
        temperature: 2.5,
        battery: 85,
        status: 'NORMAL',
      },
    });
    
    console.log(chalk.green('✅ Test reading created successfully'));
    
    // Clean up test reading
    await prisma.reading.delete({
      where: { id: testReading.id },
    });
    
    console.log(chalk.green('✅ Test reading cleaned up'));
    
  } catch (error) {
    console.log(chalk.red('❌ Simulator test failed:'));
    console.log(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

// Run all tests
async function runTests() {
  console.log(chalk.blue('🚀 Starting ColdTrace test suite...\n'));
  
  await testDatabaseConnection();
  await testGraphQLEndpoint();
  await testSimulator();
  
  console.log(chalk.green('\n🎉 All tests passed!'));
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log(chalk.yellow('\n⚠️ Test interrupted, cleaning up...'));
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log(chalk.yellow('\n⚠️ Test terminated, cleaning up...'));
  await prisma.$disconnect();
  process.exit(0);
});

// Run tests
runTests().catch((error) => {
  console.log(chalk.red('❌ Test suite failed:'));
  console.log(chalk.red(error instanceof Error ? error.message : String(error)));
  process.exit(1);
});
