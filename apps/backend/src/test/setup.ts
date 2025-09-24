// Test setup file for backend tests
import { beforeAll, afterAll } from 'vitest';

// Global test setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error'; // Reduce log noise in tests
});

afterAll(async () => {
  // Cleanup after all tests
});
