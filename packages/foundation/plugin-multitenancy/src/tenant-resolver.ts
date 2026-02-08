/**
 * ObjectQL Multi-Tenancy Plugin - Tenant Resolver
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { TenantContext } from './types';
import { TenantIsolationError } from './types';

/**
 * Tenant resolver function type
 */
export type TenantResolverFn = (context: any) => string | Promise<string>;

/**
 * Default tenant resolver
 * Extracts tenant ID from context in order of priority:
 * 1. context.tenantId (explicit)
 * 2. context.user.tenantId (from user object)
 * 3. context.user.tenant_id (alternative naming)
 */
export const defaultTenantResolver: TenantResolverFn = (context: any): string => {
  // Priority 1: Explicit tenantId
  if (context.tenantId) {
    return String(context.tenantId);
  }
  
  // Priority 2: User's tenantId
  if (context.user?.tenantId) {
    return String(context.user.tenantId);
  }
  
  // Priority 3: User's tenant_id (snake_case)
  if (context.user?.tenant_id) {
    return String(context.user.tenant_id);
  }
  
  throw new TenantIsolationError(
    'Unable to resolve tenant ID from context',
    { reason: 'NO_TENANT_IN_CONTEXT' }
  );
};

/**
 * Tenant resolver class
 * Handles tenant context extraction and validation
 */
export class TenantResolver {
  constructor(
    private resolverFn: TenantResolverFn = defaultTenantResolver,
    private validateTenantContext: boolean = true,
    private throwOnMissingTenant: boolean = true
  ) {}
  
  /**
   * Resolve tenant ID from context
   */
  async resolveTenantId(context: any): Promise<string | null> {
    try {
      const tenantId = await this.resolverFn(context);
      
      if (this.validateTenantContext && !tenantId) {
        if (this.throwOnMissingTenant) {
          throw new TenantIsolationError(
            'Tenant context validation failed: no tenant ID found',
            { reason: 'MISSING_TENANT_ID' }
          );
        }
        return null;
      }
      
      return tenantId;
    } catch (error) {
      if (this.throwOnMissingTenant) {
        throw error;
      }
      return null;
    }
  }
  
  /**
   * Extract full tenant context from request context
   */
  async extractTenantContext(context: any): Promise<TenantContext | null> {
    const tenantId = await this.resolveTenantId(context);
    
    if (!tenantId) {
      return null;
    }
    
    return {
      tenantId,
      requestContext: context,
      user: context.user,
    };
  }
  
  /**
   * Validate that a tenant ID is present in context
   */
  validateTenant(tenantId: string | null, objectName: string, operation: string): void {
    if (!tenantId) {
      throw new TenantIsolationError(
        `Tenant isolation violation: No tenant context for ${operation} on ${objectName}`,
        {
          objectName,
          operation,
          reason: 'NO_TENANT_CONTEXT',
        }
      );
    }
  }
}
