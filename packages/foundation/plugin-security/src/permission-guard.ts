/**
 * ObjectQL Security Plugin - Permission Guard
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { 
  PermissionConfig, 
  PermissionCheckResult, 
  ObjectOperation,
  FieldOperation
} from '@objectql/types';
import type { SecurityContext, PermissionCacheEntry } from './types';
import { PermissionLoader } from './permission-loader';

/**
 * Permission Guard
 * 
 * Executes permission checks for CRUD operations (allowCreate/Read/Edit/Delete).
 * Implements caching and uses pre-compiled rules for performance.
 */
export class PermissionGuard {
  private loader: PermissionLoader;
  private cache: Map<string, PermissionCacheEntry>;
  private cacheEnabled: boolean;
  private cacheTTL: number;
  
  constructor(
    loader: PermissionLoader,
    cacheEnabled: boolean = true,
    cacheTTL: number = 60000
  ) {
    this.loader = loader;
    this.cache = new Map();
    this.cacheEnabled = cacheEnabled;
    this.cacheTTL = cacheTTL;
  }
  
  /**
   * Check if an operation is allowed
   */
  async checkPermission(context: SecurityContext): Promise<PermissionCheckResult> {
    // Check cache first
    if (this.cacheEnabled) {
      const cached = this.getCached(context);
      if (cached) {
        return cached;
      }
    }
    
    // Load permission configuration
    const config = await this.loader.load(context.objectName);
    
    if (!config) {
      // No permission config means all operations are allowed
      return {
        granted: true,
        reason: 'No permission configuration found'
      };
    }
    
    // Check permission based on operation type
    const result = await this.evaluatePermission(context, config);
    
    // Cache the result
    if (this.cacheEnabled) {
      this.setCached(context, result);
    }
    
    return result;
  }
  
  /**
   * Check object-level permissions (create, read, update, delete)
   */
  async checkObjectPermission(
    context: SecurityContext,
    operation: ObjectOperation
  ): Promise<PermissionCheckResult> {
    return this.checkPermission({ ...context, operation });
  }
  
  /**
   * Check field-level permissions (read, update)
   */
  async checkFieldPermission(
    context: SecurityContext,
    field: string,
    operation: FieldOperation
  ): Promise<PermissionCheckResult> {
    return this.checkPermission({ 
      ...context, 
      field, 
      operation 
    });
  }
  
  /**
   * Evaluate permission based on configuration
   */
  private async evaluatePermission(
    context: SecurityContext,
    config: PermissionConfig
  ): Promise<PermissionCheckResult> {
    const user = context.user;
    
    // If no user, deny access
    if (!user) {
      return {
        granted: false,
        reason: 'No user context provided'
      };
    }
    
    // Get user roles
    const userRoles = user.roles || [];
    
    // Check field-level permissions
    if (context.field && config.field_permissions) {
      return this.checkFieldLevelPermission(
        context.field,
        context.operation as FieldOperation,
        userRoles,
        config
      );
    }
    
    // Check object-level permissions
    if (config.object_permissions) {
      const objectPermResult = this.checkObjectLevelPermission(
        context.operation as ObjectOperation,
        userRoles,
        config
      );
      
      if (!objectPermResult.granted) {
        return objectPermResult;
      }
    }
    
    // Check record-level rules if we have record data
    if (context.record && config.record_rules) {
      return this.checkRecordLevelPermission(context, userRoles, config);
    }
    
    // Check row-level security
    if (config.row_level_security?.enabled) {
      return this.checkRowLevelSecurity(context, userRoles, config);
    }
    
    // Default: grant access if no explicit rules deny it
    return {
      granted: true,
      reason: 'No restrictions found'
    };
  }
  
  /**
   * Check object-level permissions
   */
  private checkObjectLevelPermission(
    operation: ObjectOperation,
    userRoles: string[],
    config: PermissionConfig
  ): PermissionCheckResult {
    const objectPerms = config.object_permissions;
    
    if (!objectPerms) {
      return { granted: true };
    }
    
    // Get allowed roles for this operation
    const allowedRoles = (objectPerms as any)[operation];
    
    if (!allowedRoles || !Array.isArray(allowedRoles)) {
      return {
        granted: false,
        reason: `No roles configured for operation: ${operation}`
      };
    }
    
    // Check if user has any of the allowed roles
    const hasRole = userRoles.some(role => allowedRoles.includes(role));
    
    if (!hasRole) {
      return {
        granted: false,
        reason: `User roles [${userRoles.join(', ')}] not authorized for operation: ${operation}`
      };
    }
    
    return { granted: true };
  }
  
  /**
   * Check field-level permissions
   */
  private checkFieldLevelPermission(
    field: string,
    operation: FieldOperation,
    userRoles: string[],
    config: PermissionConfig
  ): PermissionCheckResult {
    const fieldPerms = config.field_permissions;
    
    if (!fieldPerms || !fieldPerms[field]) {
      // No field-level restriction, allow access
      return { granted: true };
    }
    
    const fieldPerm = fieldPerms[field];
    const allowedRoles = fieldPerm[operation];
    
    if (!allowedRoles || !Array.isArray(allowedRoles)) {
      return {
        granted: false,
        reason: `No roles configured for field ${field} operation: ${operation}`
      };
    }
    
    const hasRole = userRoles.some(role => allowedRoles.includes(role));
    
    if (!hasRole) {
      return {
        granted: false,
        reason: `User roles not authorized to ${operation} field: ${field}`
      };
    }
    
    return { granted: true };
  }
  
  /**
   * Check record-level permissions using pre-compiled rules
   */
  private checkRecordLevelPermission(
    context: SecurityContext,
    userRoles: string[],
    config: PermissionConfig
  ): PermissionCheckResult {
    const rules = config.record_rules || [];
    const compiledRules = this.loader.getCompiledRules(context.objectName);
    
    // Use compiled rules if available, otherwise fall back to raw rules
    if (compiledRules.length > 0) {
      for (const compiledRule of compiledRules) {
        if (compiledRule.evaluator) {
          const matches = compiledRule.evaluator({
            record: context.record,
            user: context.user
          });
          
          if (matches) {
            // Check if this rule grants the requested permission
            const operation = context.operation;
            const hasPermission = this.checkRuleBitmask(
              compiledRule.permissionBitmask,
              operation
            );
            
            if (hasPermission) {
              return {
                granted: true,
                rule: compiledRule.ruleName
              };
            }
          }
        }
      }
    } else {
      // Fallback: evaluate rules directly
      for (const _rule of rules) {
        // This would require implementing condition evaluation
        // For now, we'll use the compiled version
      }
    }
    
    return {
      granted: false,
      reason: 'No record rules matched'
    };
  }
  
  /**
   * Check row-level security
   */
  private checkRowLevelSecurity(
    context: SecurityContext,
    userRoles: string[],
    config: PermissionConfig
  ): PermissionCheckResult {
    const rls = config.row_level_security;
    
    if (!rls || !rls.enabled) {
      return { granted: true };
    }
    
    // Check if user role has bypass permission
    if (rls.exceptions) {
      for (const exception of rls.exceptions) {
        if (userRoles.includes(exception.role) && exception.bypass) {
          return {
            granted: true,
            reason: `Role ${exception.role} bypasses RLS`
          };
        }
      }
    }
    
    // For now, if RLS is enabled and no bypass, we assume the query trimmer
    // will handle the filtering, so we grant access here
    return { granted: true };
  }
  
  /**
   * Check if a bitmask grants a specific permission
   */
  private checkRuleBitmask(bitmask: number, operation: string): boolean {
    const operationMap: Record<string, number> = {
      'read': 0,
      'update': 1,
      'delete': 2
    };
    
    const bit = operationMap[operation];
    if (bit === undefined) {
      return false;
    }
    
    return (bitmask & (1 << bit)) !== 0;
  }
  
  /**
   * Get cached permission check result
   */
  private getCached(context: SecurityContext): PermissionCheckResult | undefined {
    const key = this.getCacheKey(context);
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }
    
    // Check if cache entry is still valid
    const now = Date.now();
    if (now - entry.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.result;
  }
  
  /**
   * Cache a permission check result
   */
  private setCached(context: SecurityContext, result: PermissionCheckResult): void {
    const key = this.getCacheKey(context);
    this.cache.set(key, {
      result,
      timestamp: Date.now()
    });
  }
  
  /**
   * Generate cache key for a permission check
   */
  private getCacheKey(context: SecurityContext): string {
    const parts = [
      context.user?.id || 'anonymous',
      context.objectName,
      context.operation,
      context.recordId || '',
      context.field || ''
    ];
    return parts.join(':');
  }
  
  /**
   * Clear the permission cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
