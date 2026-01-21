/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * ====================================================================
 * Plugin Entry Point
 * ====================================================================
 * 
 * This file demonstrates how to register a custom driver as a plugin.
 * The plugin system allows ObjectStack to discover and use your driver.
 */

import { InMemoryDriver } from './memory-driver';

/**
 * Export the driver class for direct usage
 */
export { InMemoryDriver } from './memory-driver';
export type { DriverOptions } from './memory-driver';

/**
 * Export as a plugin
 * 
 * This format allows ObjectStack to automatically discover and register
 * your driver when the plugin is loaded.
 * 
 * Usage:
 * ```typescript
 * import { ObjectQL } from '@objectql/core';
 * import MyDriverPlugin from './my-driver';
 * 
 * const app = new ObjectQL({
 *   plugins: [MyDriverPlugin]
 * });
 * ```
 */
export default {
    name: 'plugin-driver-memory',
    version: '1.0.0',
    drivers: [new InMemoryDriver()]
};
