import { z } from 'zod';
import { config } from 'dotenv';

// Load environment variables from .env files
config();

// Development environment schema
const developmentSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  DATABASE_URL: z
    .string()
    .url()
    .refine(
      (url) => url.startsWith('postgresql://'),
      'DATABASE_URL must be a valid PostgreSQL connection string'
    ),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  PORT: z.coerce.number().min(1000).max(65535).default(3000),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_FRONTEND_URL: z.string().url().optional(),
  // Comma-separated list of allowed origins for CORS and WebSocket
  ALLOWED_ORIGINS: z.string().optional(),
  // Redis configuration (optional - Railway auto-injects REDIS_URL)
  REDIS_URL: z.string().url().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.coerce.number().optional(),
  REDIS_PASSWORD: z.string().optional(),
});

// Production environment schema (lenient requirements for this project)
// Many auth-related variables are optional since they are not used yet
const productionSchema = developmentSchema.extend({
  NODE_ENV: z.literal('production'),
  NEXTAUTH_SECRET: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_FRONTEND_URL: z.string().url().optional(),
  // Allow empty; backend will fall back to localhost origins if not provided
  ALLOWED_ORIGINS: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  // Redis configuration (optional - Railway auto-injects REDIS_URL)
  REDIS_URL: z.string().url().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.coerce.number().optional(),
  REDIS_PASSWORD: z.string().optional(),
});

// Select schema based on environment
const getSchema = () => {
  return process.env.NODE_ENV === 'production'
    ? productionSchema
    : developmentSchema;
};

// Parse and validate environment variables
export function validateEnvironment() {
  const schema = getSchema();
  const result = schema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Environment validation failed:');
    console.error('');

    result.error.errors.forEach((error) => {
      const path = error.path.join('.');
      console.error(`  ${path}: ${error.message}`);
    });

    console.error('');
    console.error(
      'Please check your .env file and ensure all required variables are set.'
    );
    console.error('For examples, see .env.example or .env.production.example');
    process.exit(1);
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log(
      `✅ Environment validated successfully (${result.data.NODE_ENV})`
    );
  }
  return result.data;
}

// Export validated environment variables
export const env = validateEnvironment();

// Environment-specific utilities
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Database utilities
export const getDatabaseConfig = () => ({
  url: env.DATABASE_URL,
  logging: isDevelopment,
});

// API configuration
export const getApiConfig = () => ({
  port: env.PORT,
  apiUrl: env.NEXT_PUBLIC_API_URL,
  frontendUrl: env.NEXT_PUBLIC_FRONTEND_URL,
});

// Logging configuration
export const getLogConfig = () => ({
  level: env.LOG_LEVEL,
  enableConsole: isDevelopment,
  enableFile: isProduction,
});

// CORS / WebSocket allowed origins helper
export const getAllowedOrigins = (fallback: string[] = []): string[] => {
  const raw = env.ALLOWED_ORIGINS;
  if (raw && typeof raw === 'string') {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  return fallback;
};

export default env;
