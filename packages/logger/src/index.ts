import pino from 'pino';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LoggerConfig {
  level?: LogLevel;
  environment?: string;
  service?: string;
  requestId?: string;
}

export interface Logger {
  trace: (obj: any, msg?: string) => void;
  debug: (obj: any, msg?: string) => void;
  info: (obj: any, msg?: string) => void;
  warn: (obj: any, msg?: string) => void;
  error: (obj: any, msg?: string) => void;
  fatal: (obj: any, msg?: string) => void;
  child: (bindings: Record<string, any>) => Logger;
}

class ColdTraceLogger implements Logger {
  private pino: pino.Logger;

  constructor(config: LoggerConfig = {}) {
    const {
      level = 'info',
      environment = process.env.NODE_ENV || 'development',
      service = 'coldtrace',
      requestId,
    } = config;

    const baseConfig: pino.LoggerOptions = {
      level,
      base: {
        service,
        environment,
        ...(requestId && { requestId }),
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level: (label) => ({ level: label }),
      },
    };

    // Pretty print in development
    if (environment === 'development') {
      this.pino = pino(
        baseConfig,
        pino.destination({
          sync: true,
          dest: process.stdout.fd,
        })
      );
    } else {
      this.pino = pino(baseConfig);
    }
  }

  trace(obj: any, msg?: string): void {
    this.pino.trace(obj, msg);
  }

  debug(obj: any, msg?: string): void {
    this.pino.debug(obj, msg);
  }

  info(obj: any, msg?: string): void {
    this.pino.info(obj, msg);
  }

  warn(obj: any, msg?: string): void {
    this.pino.warn(obj, msg);
  }

  error(obj: any, msg?: string): void {
    this.pino.error(obj, msg);
  }

  fatal(obj: any, msg?: string): void {
    this.pino.fatal(obj, msg);
  }

  child(bindings: Record<string, any>): Logger {
    return new ColdTraceLogger({
      level: this.pino.level as LogLevel,
      environment: this.pino.bindings().environment,
      service: this.pino.bindings().service,
      requestId: this.pino.bindings().requestId,
      ...bindings,
    });
  }
}

// Factory function to create logger instances
export function createLogger(config: LoggerConfig = {}): Logger {
  return new ColdTraceLogger(config);
}

// Default logger instance
export const logger = createLogger({
  level: (process.env.LOG_LEVEL as LogLevel) || 'info',
  environment: process.env.NODE_ENV || 'development',
  service: 'coldtrace',
});

// Request-scoped logger factory
export function createRequestLogger(
  requestId: string,
  service?: string
): Logger {
  return createLogger({
    requestId,
    service: service || 'coldtrace',
    level: (process.env.LOG_LEVEL as LogLevel) || 'info',
    environment: process.env.NODE_ENV || 'development',
  });
}

// Client-safe logger for frontend (minimal implementation)
export function createClientLogger(): Logger {
  const isDev = process.env.NODE_ENV === 'development';
  const logLevel = process.env.NEXT_PUBLIC_LOG_LEVEL || 'info';

  return {
    trace: (obj: any, msg?: string) => {
      if (isDev && logLevel === 'debug') console.trace(obj, msg);
    },
    debug: (obj: any, msg?: string) => {
      if (isDev && logLevel === 'debug') console.debug(obj, msg);
    },
    info: (obj: any, msg?: string) => {
      if (isDev) console.info(obj, msg);
    },
    warn: (obj: any, msg?: string) => {
      console.warn(obj, msg);
    },
    error: (obj: any, msg?: string) => {
      console.error(obj, msg);
    },
    fatal: (obj: any, msg?: string) => {
      console.error('FATAL:', obj, msg);
    },
    child: () => createClientLogger(),
  };
}
