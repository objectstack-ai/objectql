/**
 * ObjectQL Multi-Tenancy Plugin - Tenant Resolver Tests
 * Copyright (c) 2026-present ObjectStack Inc.
 */

import { describe, it, expect } from 'vitest';
import { TenantResolver, defaultTenantResolver } from '../src/tenant-resolver';
import { TenantIsolationError } from '../src/types';

describe('defaultTenantResolver', () => {
  it('should extract tenantId from context.tenantId', () => {
    const context = { tenantId: 'tenant-123' };
    const result = defaultTenantResolver(context);
    expect(result).toBe('tenant-123');
  });
  
  it('should extract tenantId from context.user.tenantId', () => {
    const context = {
      user: { id: 'user-1', tenantId: 'tenant-456' },
    };
    const result = defaultTenantResolver(context);
    expect(result).toBe('tenant-456');
  });
  
  it('should extract tenantId from context.user.tenant_id', () => {
    const context = {
      user: { id: 'user-1', tenant_id: 'tenant-789' },
    };
    const result = defaultTenantResolver(context);
    expect(result).toBe('tenant-789');
  });
  
  it('should prioritize context.tenantId over user.tenantId', () => {
    const context = {
      tenantId: 'tenant-explicit',
      user: { tenantId: 'tenant-user' },
    };
    const result = defaultTenantResolver(context);
    expect(result).toBe('tenant-explicit');
  });
  
  it('should throw error when no tenant found', () => {
    const context = { user: { id: 'user-1' } };
    expect(() => defaultTenantResolver(context)).toThrow(TenantIsolationError);
  });
});

describe('TenantResolver', () => {
  it('should resolve tenant ID successfully', async () => {
    const resolver = new TenantResolver();
    const context = { tenantId: 'tenant-123' };
    
    const result = await resolver.resolveTenantId(context);
    expect(result).toBe('tenant-123');
  });
  
  it('should return null when throwOnMissingTenant is false', async () => {
    const resolver = new TenantResolver(undefined, true, false);
    const context = {};
    
    const result = await resolver.resolveTenantId(context);
    expect(result).toBeNull();
  });
  
  it('should throw when throwOnMissingTenant is true', async () => {
    const resolver = new TenantResolver(undefined, true, true);
    const context = {};
    
    await expect(resolver.resolveTenantId(context)).rejects.toThrow(
      TenantIsolationError
    );
  });
  
  it('should extract full tenant context', async () => {
    const resolver = new TenantResolver();
    const context = {
      tenantId: 'tenant-123',
      user: { id: 'user-1' },
    };
    
    const result = await resolver.extractTenantContext(context);
    
    expect(result).toBeDefined();
    expect(result?.tenantId).toBe('tenant-123');
    expect(result?.user).toEqual({ id: 'user-1' });
  });
  
  it('should validate tenant presence', () => {
    const resolver = new TenantResolver();
    
    expect(() => {
      resolver.validateTenant(null, 'accounts', 'create');
    }).toThrow(TenantIsolationError);
    
    expect(() => {
      resolver.validateTenant('tenant-123', 'accounts', 'create');
    }).not.toThrow();
  });
  
  it('should use custom resolver function', async () => {
    const customResolver = (ctx: any) => `custom-${ctx.orgId}`;
    const resolver = new TenantResolver(customResolver);
    const context = { orgId: '999' };
    
    const result = await resolver.resolveTenantId(context);
    expect(result).toBe('custom-999');
  });
  
  it('should handle async resolver function', async () => {
    const asyncResolver = async (ctx: any) => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return `async-${ctx.id}`;
    };
    const resolver = new TenantResolver(asyncResolver);
    const context = { id: 'async-tenant' };
    
    const result = await resolver.resolveTenantId(context);
    expect(result).toBe('async-async-tenant');
  });
});
