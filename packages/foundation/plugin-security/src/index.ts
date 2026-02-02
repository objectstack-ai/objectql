/**
 * ObjectQL Security Plugin
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Main plugin export
export { ObjectQLSecurityPlugin } from './plugin';

// Core components
export { PermissionLoader } from './permission-loader';
export { PermissionGuard } from './permission-guard';
export { QueryTrimmer } from './query-trimmer';
export { FieldMasker } from './field-masker';

// Configuration schema
export { 
  SecurityPluginConfigSchema,
  PermissionStorageTypeSchema,
  DatabaseConfigSchema 
} from './config.schema';

// Type exports
export type {
  SecurityPluginConfig,
  PermissionStorageType,
  IPermissionStorage,
  CompiledPermissionRule,
  SecurityContext,
  PermissionCacheEntry,
  PermissionAuditLog,
  Role
} from './types';

// Re-export permission types from @objectql/types for convenience
export type {
  PermissionConfig,
  ObjectPermissions,
  FieldPermission,
  FieldPermissions,
  RecordRule,
  RecordRuleCondition,
  RecordRulePermissions,
  SharingRule,
  ActionPermission,
  ActionPermissions,
  ViewPermission,
  ViewPermissions,
  RowLevelSecurity,
  FieldMaskConfig,
  FieldMasking,
  AuditConfig,
  PermissionCheckContext,
  PermissionCheckResult
} from '@objectql/types';
