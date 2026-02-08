/**
 * ObjectQL Multi-Tenancy Plugin
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Main plugin export
export { MultiTenancyPlugin } from './plugin';

// Core components
export { TenantResolver, defaultTenantResolver } from './tenant-resolver';
export type { TenantResolverFn } from './tenant-resolver';
export { QueryFilterInjector } from './query-filter-injector';
export { MutationGuard } from './mutation-guard';

// Configuration schema
export {
  MultiTenancyPluginConfigSchema,
  SchemaIsolationModeSchema,
} from './config.schema';
export type { SchemaIsolationMode } from './config.schema';

// Type exports
export type {
  MultiTenancyPluginConfig,
  TenantContext,
  TenantAuditLog,
} from './types';
export { TenantIsolationError } from './types';
