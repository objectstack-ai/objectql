/**
 * ObjectQL Multi-Tenancy Plugin - Unit Tests
 * Copyright (c) 2026-present ObjectStack Inc.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MultiTenancyPlugin } from '../src';

describe('MultiTenancyPlugin', () => {
  let plugin: MultiTenancyPlugin;
  
  beforeEach(() => {
    plugin = new MultiTenancyPlugin({
      enabled: true,
      tenantField: 'tenant_id',
      strictMode: true,
    });
  });
  
  it('should initialize with default config', () => {
    expect(plugin).toBeDefined();
    expect(plugin.name).toBe('@objectql/plugin-multitenancy');
    expect(plugin.version).toBe('4.2.0');
  });
  
  it('should accept custom configuration', () => {
    const customPlugin = new MultiTenancyPlugin({
      enabled: false,
      tenantField: 'organization_id',
      strictMode: false,
      exemptObjects: ['users', 'tenants'],
    });
    
    expect(customPlugin).toBeDefined();
  });
  
  it('should validate configuration schema', () => {
    expect(() => {
      new MultiTenancyPlugin({
        strictMode: 'invalid' as any,
      });
    }).toThrow();
  });
});

describe('MultiTenancyPlugin - Installation', () => {
  it('should install into mock kernel', async () => {
    const plugin = new MultiTenancyPlugin();
    const mockKernel: any = {
      hooks: {
        register: () => {},
      },
    };
    
    const ctx = {
      engine: mockKernel,
      hook: () => {},
    };
    
    await plugin.install(ctx);
    
    expect(mockKernel.multitenancy).toBeDefined();
    expect(mockKernel.multitenancy.config).toBeDefined();
    expect(mockKernel.multitenancy.resolver).toBeDefined();
    expect(mockKernel.multitenancy.injector).toBeDefined();
    expect(mockKernel.multitenancy.guard).toBeDefined();
  });
  
  it('should skip installation when disabled', async () => {
    const plugin = new MultiTenancyPlugin({ enabled: false });
    const mockKernel: any = {};
    
    const ctx = {
      engine: mockKernel,
      hook: () => {},
    };
    
    await plugin.install(ctx);
    
    expect(mockKernel.multitenancy).toBeUndefined();
  });
});

describe('MultiTenancyPlugin - Audit Logs', () => {
  let plugin: MultiTenancyPlugin;
  
  beforeEach(() => {
    plugin = new MultiTenancyPlugin({
      enableAudit: true,
    });
  });
  
  it('should retrieve audit logs', () => {
    const logs = plugin.getAuditLogs();
    expect(Array.isArray(logs)).toBe(true);
  });
  
  it('should clear audit logs', () => {
    plugin.clearAuditLogs();
    const logs = plugin.getAuditLogs();
    expect(logs.length).toBe(0);
  });
});
