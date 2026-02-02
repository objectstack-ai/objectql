/**
 * ObjectQL Security Plugin
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { RuntimePlugin, RuntimeContext } from '@objectql/types';
import type { Logger } from '@objectstack/spec/contracts';
import { createLogger } from '@objectstack/core';
import type { SecurityPluginConfig, SecurityContext, PermissionAuditLog } from './types';
import { SecurityPluginConfigSchema } from './config.schema';
import { PermissionLoader } from './permission-loader';
import { PermissionGuard } from './permission-guard';
import { QueryTrimmer } from './query-trimmer';
import { FieldMasker } from './field-masker';

/**
 * Extended ObjectStack Kernel with security capabilities
 */
interface KernelWithSecurity {
  security?: {
    loader: PermissionLoader;
    guard: PermissionGuard;
    trimmer: QueryTrimmer;
    masker: FieldMasker;
    config: SecurityPluginConfig;
  };
  use?: (hookName: string, handler: (context: any) => Promise<void>) => void;
}

/**
 * ObjectQL Security Plugin
 * 
 * Implements comprehensive security for ObjectQL following @objectstack/spec protocol:
 * - RBAC (Role-Based Access Control)
 * - Field-Level Security (FLS)
 * - Row-Level Security (RLS)
 * - Permission Guards
 * - Query Trimming
 * - Field Masking
 * - Audit Logging
 * 
 * Design Philosophy:
 * - Aspect-Oriented: Security is a cross-cutting concern, not business logic
 * - Protocol-Driven: Implements @objectstack/spec permission protocol
 * - Zero-Intrusion: Can be enabled/disabled without code changes
 * - Performance-First: Pre-compiles rules, works at AST level
 */
export class ObjectQLSecurityPlugin implements RuntimePlugin {
  name = '@objectql/plugin-security';
  version = '4.0.5';
  
  private config: SecurityPluginConfig;
  private loader!: PermissionLoader;
  private guard!: PermissionGuard;
  private trimmer!: QueryTrimmer;
  private masker!: FieldMasker;
  private auditLog: PermissionAuditLog[] = [];
  private logger: Logger;
  
  constructor(config: SecurityPluginConfig = {}) {
    // Validate and parse configuration using Zod schema
    const validatedConfig = SecurityPluginConfigSchema.parse(config);
    
    // Set configuration with validated defaults
    this.config = validatedConfig;
    
    // Initialize structured logger
    this.logger = createLogger({
      name: this.name,
      level: 'info',
      format: 'pretty'
    });
  }
  
  /**
   * Install the plugin into the kernel
   * This is called during kernel initialization
   */
  async install(ctx: any): Promise<void> {
    const kernel = (ctx.engine || (ctx.getKernel && ctx.getKernel())) as KernelWithSecurity;
    
    this.logger.info('Installing security plugin', { 
      config: { 
        enabled: this.config.enabled, 
        storageType: this.config.storageType 
      } 
    });
    
    if (!this.config.enabled) {
      this.logger.warn('Security plugin is disabled');
      return;
    }
    
    // Initialize security components
    this.loader = new PermissionLoader(this.config);
    this.guard = new PermissionGuard(
      this.loader,
      this.config.enableCache,
      this.config.cacheTTL
    );
    this.trimmer = new QueryTrimmer(this.loader);
    this.masker = new FieldMasker(this.loader);
    
    // Pre-load and compile all permissions
    if (this.config.precompileRules) {
      await this.loader.loadAll();
      this.logger.info('Permission rules pre-compiled');
    }
    
    // Make security components accessible from the kernel
    kernel.security = {
      loader: this.loader,
      guard: this.guard,
      trimmer: this.trimmer,
      masker: this.masker,
      config: this.config
    };
    
    // Register security hooks
    this.registerSecurityHooks(kernel, ctx);
    
    this.logger.info('Security plugin installed successfully');
  }
  
  /**
   * Called when the kernel starts
   */
  async onStart(ctx: RuntimeContext): Promise<void> {
    this.logger.info('Security plugin started');
  }

  // --- Adapter for @objectstack/core compatibility ---
  async init(ctx: any): Promise<void> {
    return this.install(ctx);
  }

  async start(ctx: any): Promise<void> {
    return this.onStart(ctx);
  }
  // ---------------------------------------------------
  
  /**
   * Register security hooks with the kernel
   * @private
   */
  private registerSecurityHooks(kernel: KernelWithSecurity, ctx: any): void {
    const registerHook = (name: string, handler: any) => {
        if (typeof ctx.hook === 'function') {
            ctx.hook(name, handler);
        } else if (typeof (kernel as any).use === 'function') {
            (kernel as any).use(name, handler);
        } else if (typeof (kernel as any).hooks?.register === 'function') {
           (kernel as any).hooks.register(name, handler);
        }
    };

    // Register beforeQuery hook for row-level security
    if (this.config.enableRowLevelSecurity) {
      registerHook('beforeQuery', async (context: any) => {
        await this.handleBeforeQuery(context);
      });
      this.logger.debug('beforeQuery hook registered');
    }
    
    // Register beforeMutation hook for permission checks
    registerHook('beforeMutation', async (context: any) => {
        await this.handleBeforeMutation(context);
    });
    this.logger.debug('beforeMutation hook registered');
    
    // Register afterQuery hook for field-level security
    if (this.config.enableFieldLevelSecurity) {
      registerHook('afterQuery', async (context: any) => {
        await this.handleAfterQuery(context);
      });
      this.logger.debug('afterQuery hook registered');
    }
  }
  
  /**
   * Handle beforeQuery hook - apply row-level security
   * @private
   */
  private async handleBeforeQuery(context: any): Promise<void> {
    const objectName = context.objectName || context.object;
    
    if (!objectName) {
      return; // No object specified
    }
    
    // Check if object is exempt from security
    if (this.config.exemptObjects?.includes(objectName)) {
      return;
    }
    
    // Extract user context
    const securityContext = this.extractSecurityContext(context, objectName, 'read');
    
    // Apply row-level security to query
    try {
      await this.trimmer.applyRowLevelSecurity(
        objectName,
        context.query || {},
        securityContext
      );
      
      // Also apply record rules as filters
      await this.trimmer.applyRecordRules(
        objectName,
        context.query || {},
        securityContext,
        'read'
      );
      
      // Check if query is impossible (optimization)
      if (this.trimmer.isQueryImpossible(context.query || {})) {
        context.result = [];
        context.skip = true; // Skip database query
      }
    } catch (error) {
      this.logger.error('Error in beforeQuery', error as Error, { 
        objectName, 
        operation: 'read' 
      });
      if (this.config.throwOnDenied) {
        throw error;
      }
    }
  }
  
  /**
   * Handle beforeMutation hook - check permissions
   * @private
   */
  private async handleBeforeMutation(context: any): Promise<void> {
    const objectName = context.objectName || context.object;
    const operation = context.operation; // 'create', 'update', 'delete'
    
    if (!objectName || !operation) {
      return;
    }
    
    // Check if object is exempt from security
    if (this.config.exemptObjects?.includes(objectName)) {
      return;
    }
    
    // Extract user context
    const securityContext = this.extractSecurityContext(
      context, 
      objectName, 
      operation,
      context.id,
      context.data
    );
    
    // Check permission
    try {
      const result = await this.guard.checkObjectPermission(
        securityContext,
        operation as any
      );
      
      // Log audit if enabled
      if (this.config.enableAudit) {
        this.logAudit(securityContext, result);
      }
      
      if (!result.granted) {
        const error = new Error(
          `Permission denied: ${result.reason || 'Insufficient permissions'}`
        );
        (error as any).code = 'PERMISSION_DENIED';
        (error as any).details = result;
        
        if (this.config.throwOnDenied) {
          throw error;
        } else {
          context.skip = true; // Skip the mutation
        }
      }
    } catch (error) {
      this.logger.error('Error in beforeMutation', error as Error, { 
        objectName, 
        operation 
      });
      throw error;
    }
  }
  
  /**
   * Handle afterQuery hook - apply field-level security
   * @private
   */
  private async handleAfterQuery(context: any): Promise<void> {
    const objectName = context.objectName || context.object;
    
    if (!objectName || !context.result) {
      return;
    }
    
    // Check if object is exempt from security
    if (this.config.exemptObjects?.includes(objectName)) {
      return;
    }
    
    // Extract user context
    const securityContext = this.extractSecurityContext(context, objectName, 'read');
    
    // Apply field-level security to results
    try {
      const results = Array.isArray(context.result) 
        ? context.result 
        : [context.result];
      
      const maskedResults = await this.masker.applyFieldLevelSecurity(
        objectName,
        results,
        securityContext,
        'read'
      );
      
      context.result = Array.isArray(context.result)
        ? maskedResults
        : maskedResults[0];
    } catch (error) {
      this.logger.error('Error in afterQuery', error as Error, { 
        objectName, 
        operation: 'read' 
      });
      if (this.config.throwOnDenied) {
        throw error;
      }
    }
  }
  
  /**
   * Extract security context from the request context
   * @private
   */
  private extractSecurityContext(
    context: any,
    objectName: string,
    operation: string,
    recordId?: string,
    record?: any
  ): SecurityContext {
    return {
      user: context.user || context.userId ? {
        id: context.userId,
        roles: context.roles,
        ...context.user
      } : undefined,
      objectName,
      operation,
      recordId,
      record
    };
  }
  
  /**
   * Log audit entry
   * @private
   */
  private logAudit(context: SecurityContext, result: any): void {
    const entry: PermissionAuditLog = {
      timestamp: Date.now(),
      userId: context.user?.id || 'anonymous',
      objectName: context.objectName,
      operation: context.operation,
      granted: result.granted,
      reason: result.reason,
      recordId: context.recordId,
      field: context.field
    };
    
    this.auditLog.push(entry);
    
    // Keep only last 1000 entries (simple in-memory limit)
    if (this.auditLog.length > 1000) {
      this.auditLog.shift();
    }
  }
  
  /**
   * Get audit logs
   */
  getAuditLogs(limit: number = 100): PermissionAuditLog[] {
    return this.auditLog.slice(-limit);
  }
  
  /**
   * Clear audit logs
   */
  clearAuditLogs(): void {
    this.auditLog = [];
  }
}
