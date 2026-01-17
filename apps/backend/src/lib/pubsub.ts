import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis';

// Redis connection configuration
// Note: With exactOptionalPropertyTypes, we must omit optional props when undefined
// rather than setting them to undefined. Use conditional spread to include them only when set.
const getRedisOptions = () => {
  const redisUrl = process.env.REDIS_URL;

  // If REDIS_URL is provided (Railway, Upstash, etc.), parse it
  if (redisUrl) {
    try {
      // Parse Redis URL format: redis://[:password@]host[:port][/db-number]
      const url = new URL(redisUrl);
      const base = {
        host: url.hostname,
        port: parseInt(url.port || '6379'),
        retryStrategy: (times: number) => Math.min(times * 50, 2000),
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      };
      return {
        ...base,
        ...(url.password ? { password: url.password } : {}),
        ...(url.protocol === 'rediss:' ? { tls: {} as object } : {}),
      };
    } catch (error) {
      console.warn('Failed to parse REDIS_URL, using fallback config:', error);
    }
  }

  // Fallback to separate environment variables or localhost
  const base = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    retryStrategy: (times: number) => Math.min(times * 50, 2000),
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  };
  const pwd = process.env.REDIS_PASSWORD;
  return {
    ...base,
    ...(pwd ? { password: pwd } : {}),
  };
};

const options = getRedisOptions();

// Create separate Redis clients for publisher and subscriber
// This is required by graphql-redis-subscriptions
const publisher = new Redis(options);
const subscriber = new Redis(options);

// Handle connection events for debugging
publisher.on('connect', () => {
  console.log('✅ Redis Publisher connected');
});

publisher.on('ready', () => {
  console.log('✅ Redis Publisher ready');
});

publisher.on('error', (err) => {
  console.error('❌ Redis Publisher error:', err.message);
});

publisher.on('close', () => {
  console.log('🔌 Redis Publisher connection closed');
});

subscriber.on('connect', () => {
  console.log('✅ Redis Subscriber connected');
});

subscriber.on('ready', () => {
  console.log('✅ Redis Subscriber ready');
});

subscriber.on('error', (err) => {
  console.error('❌ Redis Subscriber error:', err.message);
});

subscriber.on('close', () => {
  console.log('🔌 Redis Subscriber connection closed');
});

// Create Redis PubSub instance
export const pubsub = new RedisPubSub({
  publisher,
  subscriber,
});

// Graceful shutdown handlers
const shutdown = async () => {
  console.log('🛑 Shutting down Redis connections...');
  try {
    await publisher.quit();
    await subscriber.quit();
    console.log('✅ Redis connections closed gracefully');
  } catch (error) {
    console.error('❌ Error closing Redis connections:', error);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Log initialization
console.log(
  `🔌 Redis PubSub initialized (host: ${options.host}, port: ${options.port})`
);
