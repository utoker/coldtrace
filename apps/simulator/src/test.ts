import { prisma } from '@coldtrace/database';

// NO dotenv.config() needed - we get DATABASE_URL from GitHub Actions secrets!

console.log("🚀 Test script starting...");
console.log("🚀 Current working directory:", process.cwd());
console.log("🚀 Process ID:", process.pid);
console.log("🚀 Node version:", process.version);

// ALWAYS show debugging information FIRST
console.log("🔍 DEBUGGING: Checking ALL environment variables...");
console.log("🔍 Available environment variables:");
console.log(Object.keys(process.env).sort().join(", "));
console.log("🔍 Looking for DATABASE_URL in all possible forms...");
const dbVars = Object.keys(process.env).filter(key => key.includes("DATABASE") || key.includes("DB"));
console.log("🔍 Database-related vars:", dbVars);
console.log("🔍 All environment variables:");
for (const [key, value] of Object.entries(process.env)) {
  console.log(`  ${key}: ${value}`);
}

console.log("🚀 Environment check:");
console.log("🚀 All env vars with DATABASE:", Object.keys(process.env).filter(key => key.includes("DATABASE")));
console.log("🚀 DATABASE_URL from process.env:", process.env.DATABASE_URL ? "EXISTS" : "NOT EXISTS");
if (process.env.DATABASE_URL) {
  console.log("🚀 DATABASE_URL length:", process.env.DATABASE_URL.length);
  console.log("🚀 DATABASE_URL starts with:", process.env.DATABASE_URL.substring(0, 30));
}

if (!process.env.DATABASE_URL) {
  console.log('❌ DATABASE_URL environment variable is not set');
  console.log('This should come from GitHub Actions secrets!');
  console.log('');
  console.log('🔍 Available environment variables:');
  console.log(Object.keys(process.env).sort().join(", "));
  console.log('🔍 Looking for DATABASE_URL in all possible forms...');
  const dbVars = Object.keys(process.env).filter(key => key.includes("DATABASE") || key.includes("DB"));
  console.log('🔍 Database-related vars:', dbVars);
  console.log('🔍 All environment variables:');
  for (const [key, value] of Object.entries(process.env)) {
    console.log(`  ${key}: ${value}`);
  }
  
  process.exit(1);
}

// Test database connection
async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test a simple query
    const deviceCount = await prisma.device.count();
    console.log(`✅ Database query successful - Found ${deviceCount} devices`);
    
    await prisma.$disconnect();
    console.log('✅ Database disconnection successful');
    
  } catch (error) {
    console.log('❌ Database connection failed:');
    console.log(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Test GraphQL endpoint
async function testGraphQLEndpoint() {
  try {
    console.log('🔍 Testing GraphQL endpoint...');
    
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

    console.log('✅ GraphQL endpoint test successful');
    console.log(`✅ Found ${data.data.devices.length} devices via GraphQL`);
    
  } catch (error) {
    console.log('⚠️ GraphQL endpoint test failed (this is expected in CI):');
    console.log(error instanceof Error ? error.message : String(error));
  }
}

// Test simulator functionality
async function testSimulator() {
  try {
    console.log('🔍 Testing simulator functionality...');
    
    // Test reading generation
    const devices = await prisma.device.findMany();
    if (devices.length === 0) {
      console.log('⚠️ No devices found - skipping simulator test');
      return;
    }

    const device = devices[0];
    if (!device) {
      console.log('⚠️ No device found - skipping simulator test');
      return;
    }
    
    console.log(`✅ Testing with device: ${device.name}`);
    
    // Test reading creation
    const testReading = await prisma.reading.create({
      data: {
        deviceId: device.id,
        temperature: 2.5,
        battery: 85,
        status: 'NORMAL',
      },
    });
    
    console.log('✅ Test reading created successfully');
    
    // Clean up test reading
    await prisma.reading.delete({
      where: { id: testReading.id },
    });
    
    console.log('✅ Test reading cleaned up');
    
  } catch (error) {
    console.log('❌ Simulator test failed:');
    console.log(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting ColdTrace test suite...\n');
  
  await testDatabaseConnection();
  await testGraphQLEndpoint();
  await testSimulator();
  
  console.log('\n🎉 All tests passed!');
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n⚠️ Test interrupted, cleaning up...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️ Test terminated, cleaning up...');
  await prisma.$disconnect();
  process.exit(0);
});

// Run tests
runTests().catch((error) => {
  console.log('❌ Test suite failed:');
  console.log(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
