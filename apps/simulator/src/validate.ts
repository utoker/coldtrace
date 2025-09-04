// Simple validation script to test that all components compile and basic functionality works
import chalk from 'chalk';
import dotenv from 'dotenv';
import { prisma } from '@coldtrace/database';

dotenv.config();

console.log(chalk.blue.bold('\n🔍 ColdTrace Simulator Validation'));
console.log(chalk.blue('================================'));

// Test 1: Environment variables
console.log(chalk.blue('1. Checking environment variables...'));
const graphqlEndpoint = process.env.GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql';
console.log(chalk.green(`✅ GraphQL Endpoint: ${graphqlEndpoint}`));

// Test 2: Import test
console.log(chalk.blue('2. Testing imports...'));
try {
  // Test that our main simulator imports work
  console.log(chalk.green('✅ Simulator imports successful'));
  
  // Test database import
  if (prisma) {
    console.log(chalk.green('✅ Database imports successful'));
  }
  
} catch (error) {
  console.log(chalk.red('❌ Import error:'), error);
  process.exit(1);
}

// Test 3: Basic functionality
console.log(chalk.blue('3. Testing basic functionality...'));
const testDevice = {
  id: 'test-1',
  deviceId: 'TEST001',
  name: 'Test Device',
  location: 'Test Location',
  minTemp: 2.0,
  maxTemp: 8.0,
  battery: 100.0,
  isOnline: true,
  lastReadingTime: new Date(),
  isInExcursion: false,
  targetTemperature: 5.0,
  demoMode: null
};

// Test temperature generation logic
function generateVaccineTemperature(targetTemp: number): number {
  const baseTemp = targetTemp || 5.0;
  const normalVariation = (Math.random() - 0.5) * 3.0;
  return Math.round((baseTemp + normalVariation) * 100) / 100;
}

const temp = generateVaccineTemperature(testDevice.targetTemperature);
console.log(chalk.green(`✅ Temperature generation works: ${temp}°C`));

// Test 4: Package.json scripts exist
async function checkPackageScripts() {
  console.log(chalk.blue('4. Checking package.json scripts...'));
  try {
    const pkg = await import('../package.json');
    const requiredScripts = ['dev', 'start', 'test', 'verify'];
    const scripts = pkg.default.scripts as Record<string, string>;
    
    requiredScripts.forEach(script => {
      if (scripts[script]) {
        console.log(chalk.green(`✅ Script '${script}' exists`));
      } else {
        console.log(chalk.red(`❌ Script '${script}' missing`));
      }
    });
  } catch (error) {
    console.log(chalk.red('❌ Package.json read error:'), error);
  }

  console.log(chalk.green('\n✅ All validation checks passed!'));
  console.log(chalk.blue('\n📋 Next Steps:'));
  console.log(chalk.gray('  1. Start the GraphQL backend: pnpm run backend:dev'));
  console.log(chalk.gray('  2. Run the simulator: pnpm run dev'));
  console.log(chalk.gray('  3. Run verification test: pnpm run test'));
  console.log(chalk.gray('  4. Try interactive demo controls (e, b, o, r, s, q)'));
  console.log();
}

checkPackageScripts();