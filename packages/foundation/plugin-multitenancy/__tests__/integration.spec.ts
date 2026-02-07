/**
 * ObjectQL Multi-Tenancy Plugin - Integration Tests
 * Copyright (c) 2026-present ObjectStack Inc.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MultiTenancyPlugin, TenantIsolationError } from '../src';

describe('MultiTenancyPlugin - Integration', () => {
  let plugin: MultiTenancyPlugin;
  let mockHooks: Map<string, Function[]>;
  
  beforeEach(() => {
    mockHooks = new Map();
    plugin = new MultiTenancyPlugin({
      enabled: true,
      tenantField: 'tenant_id',
      strictMode: true,
      exemptObjects: ['users'],
    });
  });
  
  const createMockContext = () => {
    const hooks = mockHooks;
    return {
      hook: (name: string, handler: Function) => {
        if (!hooks.has(name)) {
          hooks.set(name, []);
        }
        hooks.get(name)!.push(handler);
      },
      engine: {
        hooks: {
          register: (name: string, handler: Function) => {
            if (!hooks.has(name)) {
              hooks.set(name, []);
            }
            hooks.get(name)!.push(handler);
          },
        },
      },
    };
  };
  
  const triggerHook = async (name: string, context: any) => {
    const handlers = mockHooks.get(name) || [];
    for (const handler of handlers) {
      await handler(context);
    }
  };
  
  it('should install and register all hooks', async () => {
    const ctx = createMockContext();
    await plugin.install(ctx);
    
    expect(mockHooks.has('beforeFind') || mockHooks.has('beforeQuery')).toBe(true);
    expect(mockHooks.has('beforeCreate')).toBe(true);
    expect(mockHooks.has('beforeUpdate')).toBe(true);
    expect(mockHooks.has('beforeDelete')).toBe(true);
  });
  
  it('should inject tenant filter on beforeFind', async () => {
    const ctx = createMockContext();
    await plugin.install(ctx);
    
    const hookContext = {
      objectName: 'accounts',
      query: {},
      tenantId: 'tenant-123',
    };
    
    await triggerHook('beforeFind', hookContext);
    
    expect(hookContext.query.tenant_id).toBe('tenant-123');
  });
  
  it('should auto-set tenant_id on beforeCreate', async () => {
    const ctx = createMockContext();
    await plugin.install(ctx);
    
    const hookContext = {
      objectName: 'accounts',
      data: { name: 'Acme Corp' },
      tenantId: 'tenant-123',
    };
    
    await triggerHook('beforeCreate', hookContext);
    
    expect(hookContext.data.tenant_id).toBe('tenant-123');
  });
  
  it('should verify tenant on beforeUpdate', async () => {
    const ctx = createMockContext();
    await plugin.install(ctx);
    
    const hookContext = {
      objectName: 'accounts',
      data: { name: 'New Name' },
      previousData: { id: 1, tenant_id: 'tenant-123' },
      tenantId: 'tenant-123',
    };
    
    await expect(triggerHook('beforeUpdate', hookContext)).resolves.not.toThrow();
  });
  
  it('should throw on cross-tenant update', async () => {
    const ctx = createMockContext();
    await plugin.install(ctx);
    
    const hookContext = {
      objectName: 'accounts',
      data: { name: 'New Name' },
      previousData: { id: 1, tenant_id: 'tenant-456' },
      tenantId: 'tenant-123',
    };
    
    await expect(triggerHook('beforeUpdate', hookContext)).rejects.toThrow(
      TenantIsolationError
    );
  });
  
  it('should verify tenant on beforeDelete', async () => {
    const ctx = createMockContext();
    await plugin.install(ctx);
    
    const hookContext = {
      objectName: 'accounts',
      previousData: { id: 1, tenant_id: 'tenant-123' },
      tenantId: 'tenant-123',
    };
    
    await expect(triggerHook('beforeDelete', hookContext)).resolves.not.toThrow();
  });
  
  it('should throw on cross-tenant delete', async () => {
    const ctx = createMockContext();
    await plugin.install(ctx);
    
    const hookContext = {
      objectName: 'accounts',
      previousData: { id: 1, tenant_id: 'tenant-456' },
      tenantId: 'tenant-123',
    };
    
    await expect(triggerHook('beforeDelete', hookContext)).rejects.toThrow(
      TenantIsolationError
    );
  });
  
  it('should skip exempt objects', async () => {
    const ctx = createMockContext();
    await plugin.install(ctx);
    
    const hookContext = {
      objectName: 'users',
      query: {},
      tenantId: 'tenant-123',
    };
    
    await triggerHook('beforeFind', hookContext);
    
    // Should not inject tenant_id for exempt objects
    expect(hookContext.query.tenant_id).toBeUndefined();
  });
  
  it('should extract tenant from user context', async () => {
    const ctx = createMockContext();
    await plugin.install(ctx);
    
    const hookContext = {
      objectName: 'accounts',
      query: {},
      user: { id: 'user-1', tenantId: 'tenant-789' },
    };
    
    await triggerHook('beforeFind', hookContext);
    
    expect(hookContext.query.tenant_id).toBe('tenant-789');
  });
  
  it('should throw when tenant context is missing', async () => {
    const ctx = createMockContext();
    await plugin.install(ctx);
    
    const hookContext = {
      objectName: 'accounts',
      query: {},
      // No tenant context
    };
    
    await expect(triggerHook('beforeFind', hookContext)).rejects.toThrow(
      TenantIsolationError
    );
  });
  
  it('should log audit entries when enabled', async () => {
    const auditPlugin = new MultiTenancyPlugin({
      enableAudit: true,
    });
    
    const ctx = createMockContext();
    await auditPlugin.install(ctx);
    
    const hookContext = {
      objectName: 'accounts',
      query: {},
      tenantId: 'tenant-123',
      user: { id: 'user-1' },
    };
    
    await triggerHook('beforeFind', hookContext);
    
    const logs = auditPlugin.getAuditLogs();
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].tenantId).toBe('tenant-123');
    expect(logs[0].objectName).toBe('accounts');
    expect(logs[0].operation).toBe('find');
  });
  
  it('should support custom tenant resolver', async () => {
    const customPlugin = new MultiTenancyPlugin({
      tenantResolver: (ctx: any) => `org-${ctx.organizationId}`,
    });
    
    const ctx = createMockContext();
    await customPlugin.install(ctx);
    
    const hookContext = {
      objectName: 'accounts',
      query: {},
      organizationId: '999',
    };
    
    await triggerHook('beforeFind', hookContext);
    
    expect(hookContext.query.tenant_id).toBe('org-999');
  });
});
