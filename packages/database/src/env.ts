import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file in the database package directory
config({ path: resolve(__dirname, '../.env') });

// Validate required environment variables
function validateEnvironment() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.error('Please ensure you have:');
    console.error('1. Created a .env file in packages/database/');
    console.error('2. Set DATABASE_URL to your PostgreSQL connection string');
    console.error('3. Started your PostgreSQL server');
    console.error('\nExample DATABASE_URL:');
    console.error('DATABASE_URL="postgresql://username:password@localhost:5432/coldtrace?schema=public"');
    process.exit(1);
  }
  
  console.log('✅ DATABASE_URL loaded successfully');
}

// Auto-validate on import
validateEnvironment();

export { validateEnvironment };