/**
 * ObjectQL - Logger Type Definitions
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Defines the canonical Logger interface for the ObjectQL ecosystem.
 * All packages must use this interface instead of direct console.* calls.
 */

/**
 * Log severity levels (RFC 5424 Syslog)
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Log output format
 */
export type LogFormat = 'json' | 'pretty' | 'compact';

/**
 * Structured log entry for serialization
 */
export interface LogEntry {
  /** ISO 8601 timestamp */
  readonly timestamp: string;
  /** Log severity level */
  readonly level: LogLevel;
  /** Logger name / component identifier */
  readonly name: string;
  /** Human-readable message */
  readonly message: string;
  /** Structured metadata (key-value pairs) */
  readonly data?: Record<string, unknown>;
  /** Error object, if applicable */
  readonly error?: {
    readonly name: string;
    readonly message: string;
    readonly stack?: string;
  };
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  /** Logger name / component identifier */
  readonly name: string;
  /** Minimum log level to emit */
  readonly level?: LogLevel;
  /** Output format */
  readonly format?: LogFormat;
}

/**
 * Canonical Logger interface for the ObjectQL ecosystem
 *
 * All packages must program against this interface.
 * Implementations are provided by the runtime layer (`@objectstack/core`
 * or a custom adapter), keeping foundation packages runtime-agnostic.
 *
 * @example
 * ```typescript
 * class MyPlugin {
 *   private logger: Logger;
 *   constructor(logger: Logger) {
 *     this.logger = logger;
 *   }
 *   async process() {
 *     this.logger.info('Processing started', { batch: 42 });
 *   }
 * }
 * ```
 */
export interface Logger {
  /** Finest-grained informational events */
  trace(message: string, data?: Record<string, unknown>): void;
  /** Detailed debug information */
  debug(message: string, data?: Record<string, unknown>): void;
  /** Informational messages that highlight progress */
  info(message: string, data?: Record<string, unknown>): void;
  /** Potentially harmful situations */
  warn(message: string, data?: Record<string, unknown>): void;
  /** Error events that might still allow the application to continue */
  error(message: string, error?: Error, data?: Record<string, unknown>): void;
  /** Severe error events that will presumably lead to application abort */
  fatal(message: string, error?: Error, data?: Record<string, unknown>): void;
}

/**
 * Factory function signature for creating Logger instances.
 * Typically provided by the runtime layer.
 */
export type LoggerFactory = (config: LoggerConfig) => Logger;

/**
 * Console-based Logger implementation
 *
 * A zero-dependency reference implementation suitable for:
 * - Unit tests (without mocking an external logger library)
 * - Development environments
 * - Packages that cannot depend on `@objectstack/core`
 *
 * For production use, prefer the structured logger from `@objectstack/core`.
 */
export class ConsoleLogger implements Logger {
  private readonly name: string;
  private readonly level: LogLevel;
  private static readonly LEVELS: Record<LogLevel, number> = {
    trace: 0,
    debug: 1,
    info: 2,
    warn: 3,
    error: 4,
    fatal: 5,
  };

  constructor(config: LoggerConfig) {
    this.name = config.name;
    this.level = config.level ?? 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    return ConsoleLogger.LEVELS[level] >= ConsoleLogger.LEVELS[this.level];
  }

  private format(level: LogLevel, message: string, data?: Record<string, unknown>): string {
    const ts = new Date().toISOString();
    const prefix = `${ts} [${level.toUpperCase().padEnd(5)}] [${this.name}]`;
    if (data && Object.keys(data).length > 0) {
      return `${prefix} ${message} ${JSON.stringify(data)}`;
    }
    return `${prefix} ${message}`;
  }

  trace(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog('trace')) console.debug(this.format('trace', message, data));
  }

  debug(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog('debug')) console.debug(this.format('debug', message, data));
  }

  info(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog('info')) console.log(this.format('info', message, data));
  }

  warn(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog('warn')) console.warn(this.format('warn', message, data));
  }

  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    if (this.shouldLog('error')) {
      console.error(this.format('error', message, data));
      if (error?.stack) console.error(error.stack);
    }
  }

  fatal(message: string, error?: Error, data?: Record<string, unknown>): void {
    if (this.shouldLog('fatal')) {
      console.error(this.format('fatal', message, data));
      if (error?.stack) console.error(error.stack);
    }
  }
}

/**
 * No-op Logger implementation
 *
 * Useful for suppressing all log output (e.g., in benchmarks or silent tests).
 */
export class NullLogger implements Logger {
  trace(): void { /* no-op */ }
  debug(): void { /* no-op */ }
  info(): void { /* no-op */ }
  warn(): void { /* no-op */ }
  error(): void { /* no-op */ }
  fatal(): void { /* no-op */ }
}
