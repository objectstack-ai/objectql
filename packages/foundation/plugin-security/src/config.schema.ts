/**
 * ObjectQL Security Plugin - Configuration Schema
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { z } from 'zod';

/**
 * Permission storage backend type
 */
export const PermissionStorageTypeSchema = z.enum(['memory', 'redis', 'database', 'custom']);

/**
 * Database configuration for permission storage
 */
export const DatabaseConfigSchema = z.object({
  datasource: z.string(),
  table: z.string().optional()
});

/**
 * Security Plugin Configuration Schema
 * 
 * Validates the configuration for the ObjectQL Security Plugin using Zod.
 * This ensures type safety and runtime validation for plugin configuration.
 */
export const SecurityPluginConfigSchema = z.object({
  /**
   * Enable security checks globally
   * @default true
   */
  enabled: z.boolean().optional().default(true),
  
  /**
   * Type of permission storage
   * @default 'memory'
   */
  storageType: PermissionStorageTypeSchema.optional().default('memory'),
  
  /**
   * Permission configurations (for memory storage)
   */
  permissions: z.array(z.any()).optional().default([]),
  
  /**
   * Redis connection string (for redis storage)
   */
  redisUrl: z.string().optional(),
  
  /**
   * Database connection config (for database storage)
   */
  databaseConfig: DatabaseConfigSchema.optional(),
  
  /**
   * Exemption list - objects that skip permission checks
   * @default []
   */
  exemptObjects: z.array(z.string()).optional().default([]),
  
  /**
   * Enable row-level security (RLS) filtering
   * @default true
   */
  enableRowLevelSecurity: z.boolean().optional().default(true),
  
  /**
   * Enable field-level security (FLS) masking
   * @default true
   */
  enableFieldLevelSecurity: z.boolean().optional().default(true),
  
  /**
   * Pre-compile permission rules at startup for better performance
   * @default true
   */
  precompileRules: z.boolean().optional().default(true),
  
  /**
   * Cache permission check results (in-memory)
   * @default true
   */
  enableCache: z.boolean().optional().default(true),
  
  /**
   * Cache TTL in milliseconds
   * @default 60000 (1 minute)
   */
  cacheTTL: z.number().positive().optional().default(60000),
  
  /**
   * Throw error on permission denied
   * If false, silently filters data instead
   * @default true
   */
  throwOnDenied: z.boolean().optional().default(true),
  
  /**
   * Enable audit logging for permission checks
   * @default false
   */
  enableAudit: z.boolean().optional().default(false),
  
  /**
   * Custom storage implementation
   * Required if storageType is 'custom'
   */
  storage: z.any().optional()
});

export type SecurityPluginConfig = z.infer<typeof SecurityPluginConfigSchema>;
