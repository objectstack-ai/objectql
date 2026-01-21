/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * @deprecated This package has been replaced by @objectql/plugin-server
 * 
 * This package now serves as a compatibility layer that re-exports from @objectql/plugin-server.
 * Please update your imports to use @objectql/plugin-server directly:
 * 
 * @example
 * ```typescript
 * // Old (deprecated, but still works):
 * import { createNodeHandler } from '@objectql/server';
 * 
 * // New (recommended):
 * import { createNodeHandler } from '@objectql/plugin-server';
 * 
 * // Or use the plugin directly:
 * import { ServerPlugin } from '@objectql/plugin-server';
 * ```
 * 
 * All server functionality has been moved to @objectql/plugin-server
 * to enable a plugin-based architecture with support for multiple frameworks.
 */

// Re-export everything from the plugin package
export * from '@objectql/plugin-server';
