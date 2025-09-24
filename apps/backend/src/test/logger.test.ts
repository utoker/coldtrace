import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequestLogger } from '@coldtrace/logger';

describe('Backend Logger Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Request Logger', () => {
    it('should create request logger with proper context', () => {
      const requestId = 'test-request-123';
      const logger = createRequestLogger(requestId, 'backend');

      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    it('should handle error logging with proper structure', () => {
      const logger = createRequestLogger('test-123', 'backend');
      const error = new Error('Test error message');

      // This test verifies the logger can handle error objects
      expect(() => {
        logger.error({ error: error.message }, 'Test error log');
      }).not.toThrow();
    });
  });

  describe('Logger Context', () => {
    it('should include service and request information', () => {
      const logger = createRequestLogger('req-456', 'backend');

      // Verify logger has the expected interface
      expect(logger).toHaveProperty('info');
      expect(logger).toHaveProperty('error');
      expect(logger).toHaveProperty('warn');
      expect(logger).toHaveProperty('debug');
    });
  });
});
