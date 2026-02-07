/**
 * ObjectQL Multi-Tenancy Plugin - Configuration Schema
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { z } from 'zod';

/**
 * Schema isolation mode
 */
export const SchemaIsolationModeSchema = z.enum(['none', 'table-prefix', 'separate-schema']);

export type SchemaIsolationMode = z.infer<typeof SchemaIsolationModeSchema>;

/**
 * Multi-tenancy plugin configuration schema
 */
export const MultiTenancyPluginConfigSchema = z.object({
  /**
   * Enable/disable the plugin
   * @default true
   */
  enabled: z.boolean().default(true),
  
  /**
   * Field name for tenant identification
   * @default 'tenant_id'
   */
  tenantField: z.string().default('tenant_id'),
  
  /**
   * Strict mode prevents cross-tenant queries
   * When enabled, throws errors on cross-tenant access attempts
   * @default true
   */
  strictMode: z.boolean().default(true),
  
  /**
   * Tenant resolver function to get current tenant from context
   * If not provided, falls back to context.user.tenantId or context.tenantId
   */
  tenantResolver: z.function()
    .args(z.any())
    .returns(z.union([z.string(), z.promise(z.string())]))
    .optional(),
  
  /**
   * Schema isolation mode
   * - 'none': Shared table with tenant_id column (default)
   * - 'table-prefix': Separate tables per tenant (e.g., accounts_tenant_1)
   * - 'separate-schema': Separate database schemas per tenant
   * @default 'none'
   */
  schemaIsolation: SchemaIsolationModeSchema.default('none'),
  
  /**
   * Objects that are exempt from tenant isolation
   * These objects are accessible across tenants (e.g., 'users', 'tenants')
   * @default []
   */
  exemptObjects: z.array(z.string()).default([]),
  
  /**
   * Auto-create tenant_id field on objects
   * When enabled, automatically adds tenant_id field to object schemas
   * @default true
   */
  autoAddTenantField: z.boolean().default(true),
  
  /**
   * Enable tenant context validation
   * When enabled, validates that tenant context exists before operations
   * @default true
   */
  validateTenantContext: z.boolean().default(true),
  
  /**
   * Throw error when tenant context is missing
   * @default true
   */
  throwOnMissingTenant: z.boolean().default(true),
  
  /**
   * Enable audit logging for cross-tenant access attempts
   * @default true
   */
  enableAudit: z.boolean().default(true),
});

export type MultiTenancyPluginConfig = z.infer<typeof MultiTenancyPluginConfigSchema>;
