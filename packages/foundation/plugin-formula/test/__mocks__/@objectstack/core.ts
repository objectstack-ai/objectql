/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Mock for @objectstack/core to enable Jest testing
 * 
 * Since @objectstack/core@0.9.2 uses ES modules with import.meta,
 * which Jest doesn't support well, we provide this mock for testing.
 */

export const createLogger = jest.fn(() => ({
  trace: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  fatal: jest.fn(),
}));

export const ObjectKernel = jest.fn();
export const LiteKernel = jest.fn();
export const createApiRegistryPlugin = jest.fn();
