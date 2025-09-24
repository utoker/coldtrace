import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createLogger,
  createRequestLogger,
  createClientLogger,
} from '../src/index';

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createLogger', () => {
    it('should create a logger instance', () => {
      const logger = createLogger();
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('should create logger with custom config', () => {
      const logger = createLogger({
        level: 'debug',
        service: 'test-service',
        environment: 'test',
      });
      expect(logger).toBeDefined();
    });
  });

  describe('createRequestLogger', () => {
    it('should create a request-scoped logger', () => {
      const logger = createRequestLogger('req-123', 'test-service');
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
    });
  });

  describe('createClientLogger', () => {
    it('should create a client-safe logger', () => {
      const logger = createClientLogger();
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    it('should respect log level in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      process.env.NEXT_PUBLIC_LOG_LEVEL = 'debug';

      const logger = createClientLogger();
      expect(logger).toBeDefined();

      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Logger methods', () => {
    it('should have all required methods', () => {
      const logger = createLogger();
      const methods = [
        'trace',
        'debug',
        'info',
        'warn',
        'error',
        'fatal',
        'child',
      ];

      methods.forEach((method) => {
        expect(typeof logger[method as keyof typeof logger]).toBe('function');
      });
    });

    it('should create child logger', () => {
      const parentLogger = createLogger();
      const childLogger = parentLogger.child({ requestId: 'child-123' });

      expect(childLogger).toBeDefined();
      expect(typeof childLogger.info).toBe('function');
    });
  });
});
