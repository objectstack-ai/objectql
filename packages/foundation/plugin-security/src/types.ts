/**
 * ObjectQL Security Plugin - Type Definitions
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { PermissionConfig, PermissionCheckContext, PermissionCheckResult } from '@objectql/types';
import type { Role } from '@objectstack/spec/auth';

// Re-export Role from @objectstack/spec for convenience
export type { Role };

/**
 * Permission storage backend type
 */
export type PermissionStorageType = 'memory' | 'redis' | 'database' | 'custom';

/**
 * Custom permission storage interface
 */
export interface IPermissionStorage {
  /**
   * Load permission configuration for an object
   */
  load(objectName: string): Promise<PermissionConfig | undefined>;
  
  /**
   * Load all permission configurations
   */
  loadAll(): Promise<Map<string, PermissionConfig>>;
  
  /**
   * Reload permissions from storage
   */
  reload(): Promise<void>;
}

/**
 * Configuration for the Security Plugin
 * 
 * @deprecated Use SecurityPluginConfigSchema from './config.schema' for runtime validation
 */
export interface SecurityPluginConfig {
  /**
   * Enable security checks globally
   * @default true
   */
  enabled?: boolean;
  
  /**
   * Type of permission storage
   * @default 'memory'
   */
  storageType?: PermissionStorageType;
  
  /**
   * Custom storage implementation
   * Required if storageType is 'custom'
   */
  storage?: IPermissionStorage;
  
  /**
   * Permission configurations (for memory storage)
   */
  permissions?: PermissionConfig[];
  
  /**
   * Redis connection string (for redis storage)
   */
  redisUrl?: string;
  
  /**
   * Database connection config (for database storage)
   */
  databaseConfig?: {
    datasource: string;
    table?: string;
  };
  
  /**
   * Exemption list - objects that skip permission checks
   * @default []
   */
  exemptObjects?: string[];
  
  /**
   * Enable row-level security (RLS) filtering
   * @default true
   */
  enableRowLevelSecurity?: boolean;
  
  /**
   * Enable field-level security (FLS) masking
   * @default true
   */
  enableFieldLevelSecurity?: boolean;
  
  /**
   * Pre-compile permission rules at startup for better performance
   * @default true
   */
  precompileRules?: boolean;
  
  /**
   * Cache permission check results (in-memory)
   * @default true
   */
  enableCache?: boolean;
  
  /**
   * Cache TTL in milliseconds
   * @default 60000 (1 minute)
   */
  cacheTTL?: number;
  
  /**
   * Throw error on permission denied
   * If false, silently filters data instead
   * @default true
   */
  throwOnDenied?: boolean;
  
  /**
   * Enable audit logging for permission checks
   * @default false
   */
  enableAudit?: boolean;
}

/**
 * Pre-compiled permission rule for fast evaluation
 */
export interface CompiledPermissionRule {
  /** Original rule name */
  ruleName: string;
  
  /** Bitmask for quick permission checks */
  permissionBitmask: number;
  
  /** Lookup map for role-based checks */
  roleLookup: Map<string, Set<string>>;
  
  /** Compiled condition evaluator */
  evaluator?: (context: any) => boolean;
  
  /** Priority for rule precedence */
  priority: number;
}

/**
 * Context for permission evaluation with current user
 */
export interface SecurityContext {
  /** Current user information */
  user?: {
    id: string;
    roles?: string[];
    [key: string]: any;
  };
  
  /** Object being accessed */
  objectName: string;
  
  /** Operation being performed */
  operation: string;
  
  /** Record ID (for record-level checks) */
  recordId?: string;
  
  /** Record data (for condition evaluation) */
  record?: any;
  
  /** Field name (for field-level checks) */
  field?: string;
}

/**
 * Permission check cache entry
 */
export interface PermissionCacheEntry {
  result: PermissionCheckResult;
  timestamp: number;
}

/**
 * Audit log entry for permission checks
 */
export interface PermissionAuditLog {
  timestamp: number;
  userId: string;
  objectName: string;
  operation: string;
  granted: boolean;
  reason?: string;
  recordId?: string;
  field?: string;
}
