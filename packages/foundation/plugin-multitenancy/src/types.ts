/**
 * ObjectQL Multi-Tenancy Plugin - Type Definitions
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { MultiTenancyPluginConfig } from './config.schema';

/**
 * Tenant context extracted from request
 */
export interface TenantContext {
  /**
   * Current tenant ID
   */
  tenantId: string;
  
  /**
   * Original request context
   */
  requestContext?: any;
  
  /**
   * User information
   */
  user?: {
    id: string | number;
    tenantId?: string;
    [key: string]: any;
  };
}

/**
 * Audit log entry for tenant operations
 */
export interface TenantAuditLog {
  /**
   * Timestamp of the event
   */
  timestamp: number;
  
  /**
   * Tenant ID involved
   */
  tenantId: string;
  
  /**
   * User ID who performed the operation
   */
  userId?: string | number;
  
  /**
   * Object name being accessed
   */
  objectName: string;
  
  /**
   * Operation type
   */
  operation: string;
  
  /**
   * Whether the operation was allowed
   */
  allowed: boolean;
  
  /**
   * Reason for denial (if denied)
   */
  reason?: string;
  
  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Tenant isolation error
 */
export class TenantIsolationError extends Error {
  code = 'TENANT_ISOLATION_ERROR';
  
  constructor(
    message: string,
    public details?: {
      tenantId?: string;
      objectName?: string;
      operation?: string;
      reason?: string;
    }
  ) {
    super(message);
    this.name = 'TenantIsolationError';
    Object.setPrototypeOf(this, TenantIsolationError.prototype);
  }
}

/**
 * Re-export config type for convenience
 */
export type { MultiTenancyPluginConfig };
