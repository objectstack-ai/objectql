/**
 * Mock for @objectstack/core
 * Re-exports from runtime mock for backward compatibility
 */

export * from './runtime';

export const createLogger = (options: any) => ({
    info: console.log,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
    child: () => ({ info: console.log, warn: console.warn, error: console.error, debug: console.debug })
});
