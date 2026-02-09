/**
 * ObjectQL Multi-Tenancy Plugin
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { RuntimePlugin, RuntimeContext } from '@objectql/types';
import { ConsoleLogger, type Logger } from '@objectql/types';
import type { MultiTenancyPluginConfig, TenantAuditLog } from './types';
import { TenantIsolationError } from './types';
import { MultiTenancyPluginConfigSchema } from './config.schema';
import { TenantResolver } from './tenant-resolver';
import { QueryFilterInjector } from './query-filter-injector';
import { MutationGuard } from './mutation-guard';

/**
 * Extended kernel with multitenancy capabilities
 */
interface KernelWithMultiTenancy {
  multitenancy?: {
    config: MultiTenancyPluginConfig;
    resolver: TenantResolver;
    injector: QueryFilterInjector;
    guard: MutationGuard;
    auditLog: TenantAuditLog[];
  };
  use?: (hookName: string, handler: (context: any) => Promise<void>) => void;
  hooks?: any;
}

/**
 * ObjectQL Multi-Tenancy Plugin
 * 
 * Implements automatic tenant isolation for SaaS applications:
 * - Auto-inject tenant_id filters on all queries
 * - Auto-set tenant_id on new records
 * - Verify tenant_id matches on updates/deletes
 * - Prevent cross-tenant data access
 * - Schema isolation options (shared, table-prefix, separate-schema)
 * 
 * Design Philosophy:
 * - Plugin, not Core modification: Core remains zero-assumption
 * - Hook-based injection: Tenant isolation via beforeFind/beforeCreate/beforeUpdate hooks
 * - Security by default: Strict mode enabled by default
 * - Flexible configuration: Support multiple tenant isolation strategies
 */
export class MultiTenancyPlugin implements RuntimePlugin {
  name = '@objectql/plugin-multitenancy';
  version = '4.2.0';
  
  private config: MultiTenancyPluginConfig;
  private resolver!: TenantResolver;
  private injector!: QueryFilterInjector;
  private guard!: MutationGuard;
  private auditLog: TenantAuditLog[] = [];
  private logger: Logger;
  
  constructor(config: Partial<MultiTenancyPluginConfig> = {}) {
    // Validate and parse configuration using Zod schema
    this.config = MultiTenancyPluginConfigSchema.parse(config);
    
    // Initialize structured logger
    this.logger = new ConsoleLogger({ name: this.name, level: 'info' });
  }
  
  /**
   * Adapter for @objectstack/core compatibility
   */
  init = async (kernel: any): Promise<void> => {
    const ctx: any = {
      engine: kernel,
      getKernel: () => kernel
    };
    return this.install(ctx);
  };
  
  start = async (_kernel: any): Promise<void> => {
    // Multi-tenancy plugin doesn't have specific start logic
    return;
  };
  
  /**
   * Install the plugin into the kernel
   */
  async install(ctx: any): Promise<void> {
    const kernel = (ctx.engine || (ctx.getKernel && ctx.getKernel())) as KernelWithMultiTenancy;
    
    this.logger.info('Installing multi-tenancy plugin', {
      config: {
        enabled: this.config.enabled,
        tenantField: this.config.tenantField,
        strictMode: this.config.strictMode,
        schemaIsolation: this.config.schemaIsolation,
      }
    });
    
    if (!this.config.enabled) {
      this.logger.warn('Multi-tenancy plugin is disabled');
      return;
    }
    
    // Initialize multi-tenancy components
    this.resolver = new TenantResolver(
      this.config.tenantResolver,
      this.config.validateTenantContext,
      this.config.throwOnMissingTenant
    );
    
    this.injector = new QueryFilterInjector(
      this.config.tenantField,
      this.config.strictMode,
      this.logger
    );
    
    this.guard = new MutationGuard(
      this.config.tenantField,
      this.config.strictMode,
      this.logger
    );
    
    // Make multi-tenancy components accessible from kernel
    kernel.multitenancy = {
      config: this.config,
      resolver: this.resolver,
      injector: this.injector,
      guard: this.guard,
      auditLog: this.auditLog,
    };
    
    // Register hooks
    this.registerHooks(kernel, ctx);
    
    this.logger.info('Multi-tenancy plugin installed successfully');
  }
  
  /**
   * Called when the kernel starts
   */
  async onStart(_ctx: RuntimeContext): Promise<void> {
    this.logger.info('Multi-tenancy plugin started');
  }
  
  /**
   * Register multi-tenancy hooks with the kernel
   * @private
   */
  private registerHooks(kernel: KernelWithMultiTenancy, ctx: any): void {
    const registerHook = (name: string, handler: any) => {
      if (typeof ctx.hook === 'function') {
        ctx.hook(name, handler);
      } else if (typeof (kernel as any).use === 'function') {
        (kernel as any).use(name, handler);
      } else if (typeof (kernel as any).hooks?.register === 'function') {
        (kernel as any).hooks.register(name, handler);
      }
    };
    
    // Register beforeFind hook - inject tenant_id filter
    registerHook('beforeFind', async (context: any) => {
      await this.handleBeforeFind(context);
    });
    this.logger.debug('beforeFind hook registered');
    
    // Register beforeCount hook - inject tenant_id filter
    registerHook('beforeCount', async (context: any) => {
      await this.handleBeforeCount(context);
    });
    this.logger.debug('beforeCount hook registered');
    
    // Register beforeCreate hook - auto-set tenant_id
    registerHook('beforeCreate', async (context: any) => {
      await this.handleBeforeCreate(context);
    });
    this.logger.debug('beforeCreate hook registered');
    
    // Register beforeUpdate hook - verify tenant_id
    registerHook('beforeUpdate', async (context: any) => {
      await this.handleBeforeUpdate(context);
    });
    this.logger.debug('beforeUpdate hook registered');
    
    // Register beforeDelete hook - verify tenant_id
    registerHook('beforeDelete', async (context: any) => {
      await this.handleBeforeDelete(context);
    });
    this.logger.debug('beforeDelete hook registered');
  }
  
  /**
   * Handle beforeFind hook - inject tenant filter
   * @private
   */
  private async handleBeforeFind(context: any): Promise<void> {
    const objectName = context.objectName || context.object;
    
    if (!objectName) {
      return;
    }
    
    // Check if object is exempt from tenant isolation
    if (this.config.exemptObjects.includes(objectName)) {
      this.logger.debug('Object exempt from tenant isolation', { objectName });
      return;
    }
    
    try {
      // Resolve tenant ID
      const tenantId = await this.resolver.resolveTenantId(context);
      
      if (!tenantId) {
        if (this.config.throwOnMissingTenant) {
          throw new TenantIsolationError(
            `Tenant context required for query on ${objectName}`,
            { objectName, operation: 'find', reason: 'NO_TENANT_CONTEXT' }
          );
        }
        return;
      }
      
      // Inject tenant filter into query
      this.injector.injectTenantFilter(context.query || {}, tenantId, objectName);
      
      // Log audit if enabled
      if (this.config.enableAudit) {
        this.logAudit({
          timestamp: Date.now(),
          tenantId,
          userId: context.user?.id,
          objectName,
          operation: 'find',
          allowed: true,
        });
      }
    } catch (error) {
      this.logger.error('Error in beforeFind hook', error as Error, { objectName });
      
      // Log denial if audit enabled
      if (this.config.enableAudit && error instanceof TenantIsolationError) {
        this.logAudit({
          timestamp: Date.now(),
          tenantId: error.details?.tenantId || 'unknown',
          userId: context.user?.id,
          objectName,
          operation: 'find',
          allowed: false,
          reason: error.details?.reason || error.message,
        });
      }
      
      throw error;
    }
  }
  
  /**
   * Handle beforeCount hook - inject tenant filter
   * @private
   */
  private async handleBeforeCount(context: any): Promise<void> {
    // Same logic as beforeFind
    await this.handleBeforeFind(context);
  }
  
  /**
   * Handle beforeCreate hook - auto-set tenant_id
   * @private
   */
  private async handleBeforeCreate(context: any): Promise<void> {
    const objectName = context.objectName || context.object;
    
    if (!objectName) {
      return;
    }
    
    // Check if object is exempt from tenant isolation
    if (this.config.exemptObjects.includes(objectName)) {
      this.logger.debug('Object exempt from tenant isolation', { objectName });
      return;
    }
    
    try {
      // Resolve tenant ID
      const tenantId = await this.resolver.resolveTenantId(context);
      
      if (!tenantId) {
        if (this.config.throwOnMissingTenant) {
          throw new TenantIsolationError(
            `Tenant context required for create on ${objectName}`,
            { objectName, operation: 'create', reason: 'NO_TENANT_CONTEXT' }
          );
        }
        return;
      }
      
      // Auto-set tenant_id on data
      this.guard.autoSetTenantId(context.data, tenantId, objectName);
      
      // Log audit if enabled
      if (this.config.enableAudit) {
        this.logAudit({
          timestamp: Date.now(),
          tenantId,
          userId: context.user?.id,
          objectName,
          operation: 'create',
          allowed: true,
        });
      }
    } catch (error) {
      this.logger.error('Error in beforeCreate hook', error as Error, { objectName });
      
      // Log denial if audit enabled
      if (this.config.enableAudit && error instanceof TenantIsolationError) {
        this.logAudit({
          timestamp: Date.now(),
          tenantId: error.details?.tenantId || 'unknown',
          userId: context.user?.id,
          objectName,
          operation: 'create',
          allowed: false,
          reason: error.details?.reason || error.message,
        });
      }
      
      throw error;
    }
  }
  
  /**
   * Handle beforeUpdate hook - verify tenant_id
   * @private
   */
  private async handleBeforeUpdate(context: any): Promise<void> {
    const objectName = context.objectName || context.object;
    
    if (!objectName) {
      return;
    }
    
    // Check if object is exempt from tenant isolation
    if (this.config.exemptObjects.includes(objectName)) {
      this.logger.debug('Object exempt from tenant isolation', { objectName });
      return;
    }
    
    try {
      // Resolve tenant ID
      const tenantId = await this.resolver.resolveTenantId(context);
      
      if (!tenantId) {
        if (this.config.throwOnMissingTenant) {
          throw new TenantIsolationError(
            `Tenant context required for update on ${objectName}`,
            { objectName, operation: 'update', reason: 'NO_TENANT_CONTEXT' }
          );
        }
        return;
      }
      
      // Verify tenant_id on update
      this.guard.verifyUpdateTenant(
        context.previousData,
        context.data,
        tenantId,
        objectName
      );
      
      // Log audit if enabled
      if (this.config.enableAudit) {
        this.logAudit({
          timestamp: Date.now(),
          tenantId,
          userId: context.user?.id,
          objectName,
          operation: 'update',
          allowed: true,
        });
      }
    } catch (error) {
      this.logger.error('Error in beforeUpdate hook', error as Error, { objectName });
      
      // Log denial if audit enabled
      if (this.config.enableAudit && error instanceof TenantIsolationError) {
        this.logAudit({
          timestamp: Date.now(),
          tenantId: error.details?.tenantId || 'unknown',
          userId: context.user?.id,
          objectName,
          operation: 'update',
          allowed: false,
          reason: error.details?.reason || error.message,
        });
      }
      
      throw error;
    }
  }
  
  /**
   * Handle beforeDelete hook - verify tenant_id
   * @private
   */
  private async handleBeforeDelete(context: any): Promise<void> {
    const objectName = context.objectName || context.object;
    
    if (!objectName) {
      return;
    }
    
    // Check if object is exempt from tenant isolation
    if (this.config.exemptObjects.includes(objectName)) {
      this.logger.debug('Object exempt from tenant isolation', { objectName });
      return;
    }
    
    try {
      // Resolve tenant ID
      const tenantId = await this.resolver.resolveTenantId(context);
      
      if (!tenantId) {
        if (this.config.throwOnMissingTenant) {
          throw new TenantIsolationError(
            `Tenant context required for delete on ${objectName}`,
            { objectName, operation: 'delete', reason: 'NO_TENANT_CONTEXT' }
          );
        }
        return;
      }
      
      // Verify tenant_id on delete
      this.guard.verifyDeleteTenant(
        context.previousData,
        tenantId,
        objectName
      );
      
      // Log audit if enabled
      if (this.config.enableAudit) {
        this.logAudit({
          timestamp: Date.now(),
          tenantId,
          userId: context.user?.id,
          objectName,
          operation: 'delete',
          allowed: true,
        });
      }
    } catch (error) {
      this.logger.error('Error in beforeDelete hook', error as Error, { objectName });
      
      // Log denial if audit enabled
      if (this.config.enableAudit && error instanceof TenantIsolationError) {
        this.logAudit({
          timestamp: Date.now(),
          tenantId: error.details?.tenantId || 'unknown',
          userId: context.user?.id,
          objectName,
          operation: 'delete',
          allowed: false,
          reason: error.details?.reason || error.message,
        });
      }
      
      throw error;
    }
  }
  
  /**
   * Log audit entry
   * @private
   */
  private logAudit(entry: TenantAuditLog): void {
    this.auditLog.push(entry);
    
    // Keep only last 1000 entries (simple in-memory limit)
    if (this.auditLog.length > 1000) {
      this.auditLog.shift();
    }
  }
  
  /**
   * Get audit logs
   */
  getAuditLogs(limit: number = 100): TenantAuditLog[] {
    return this.auditLog.slice(-limit);
  }
  
  /**
   * Clear audit logs
   */
  clearAuditLogs(): void {
    this.auditLog = [];
  }
}
