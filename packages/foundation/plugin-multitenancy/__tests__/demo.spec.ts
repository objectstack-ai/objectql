/**
 * Multi-Tenancy Plugin - End-to-End Demo
 * 
 * This demo shows the plugin in action with a real-world scenario
 */

import { describe, it, expect } from 'vitest';
import { MultiTenancyPlugin, TenantIsolationError } from '../src';

describe('Multi-Tenancy E2E Demo', () => {
  it('should demonstrate complete tenant isolation workflow', async () => {
    const plugin = new MultiTenancyPlugin({
      tenantField: 'tenant_id',
      strictMode: true,
      exemptObjects: ['users'],
      enableAudit: true,
    });
    
    // Simulate kernel installation
    const mockHooks = new Map<string, Function[]>();
    const mockKernel = {
      hooks: {
        register: (name: string, handler: Function) => {
          if (!mockHooks.has(name)) {
            mockHooks.set(name, []);
          }
          mockHooks.get(name)!.push(handler);
        },
      },
    };
    
    await plugin.install({
      engine: mockKernel,
      hook: (name: string, handler: Function) => {
        if (!mockHooks.has(name)) {
          mockHooks.set(name, []);
        }
        mockHooks.get(name)!.push(handler);
      },
    });
    
    // Helper to trigger hooks
    const triggerHook = async (name: string, context: any) => {
      const handlers = mockHooks.get(name) || [];
      for (const handler of handlers) {
        await handler(context);
      }
    };
    
    // SCENARIO 1: Tenant A creates an account
    console.log('\n=== Scenario 1: Tenant A creates account ===');
    const createContext = {
      objectName: 'accounts',
      data: {
        name: 'Acme Corporation',
        industry: 'Technology',
      },
      tenantId: 'tenant-a',
      user: { id: 'user-1' },
    };
    
    await triggerHook('beforeCreate', createContext);
    
    // Verify tenant_id was auto-set
    expect(createContext.data.tenant_id).toBe('tenant-a');
    console.log('✓ Auto-set tenant_id:', createContext.data.tenant_id);
    
    // SCENARIO 2: Tenant A queries their accounts
    console.log('\n=== Scenario 2: Tenant A queries accounts ===');
    const findContext = {
      objectName: 'accounts',
      query: { industry: 'Technology' },
      tenantId: 'tenant-a',
    };
    
    await triggerHook('beforeFind', findContext);
    
    // Verify filter was injected
    expect(findContext.query.tenant_id).toBe('tenant-a');
    console.log('✓ Injected tenant filter:', findContext.query);
    
    // SCENARIO 3: Tenant B tries to access Tenant A's account
    console.log('\n=== Scenario 3: Cross-tenant update attempt ===');
    const crossTenantUpdate = {
      objectName: 'accounts',
      data: { name: 'Hacked Name' },
      previousData: {
        id: 1,
        name: 'Acme Corporation',
        tenant_id: 'tenant-a', // This belongs to Tenant A
      },
      tenantId: 'tenant-b', // But Tenant B is trying to update it
    };
    
    // Should throw error
    await expect(
      triggerHook('beforeUpdate', crossTenantUpdate)
    ).rejects.toThrow(TenantIsolationError);
    
    console.log('✓ Cross-tenant update blocked');
    
    // SCENARIO 4: Exempt object access
    console.log('\n=== Scenario 4: Exempt object (users) ===');
    const userQuery = {
      objectName: 'users',
      query: { email: 'test@example.com' },
      tenantId: 'tenant-a',
    };
    
    await triggerHook('beforeFind', userQuery);
    
    // Should NOT inject tenant_id for exempt objects
    expect(userQuery.query.tenant_id).toBeUndefined();
    console.log('✓ Exempt object skipped tenant filter');
    
    // SCENARIO 5: Audit log verification
    console.log('\n=== Scenario 5: Audit logs ===');
    const logs = plugin.getAuditLogs();
    
    expect(logs.length).toBeGreaterThan(0);
    
    // Find the create operation
    const createLog = logs.find(
      log => log.operation === 'create' && log.objectName === 'accounts'
    );
    expect(createLog).toBeDefined();
    expect(createLog?.tenantId).toBe('tenant-a');
    expect(createLog?.allowed).toBe(true);
    
    // Find the denied update
    const deniedLog = logs.find(
      log => log.operation === 'update' && log.allowed === false
    );
    expect(deniedLog).toBeDefined();
    expect(deniedLog?.reason).toContain('CROSS_TENANT');
    
    console.log('✓ Audit logs captured:', logs.length, 'entries');
    console.log('  - Create allowed:', createLog?.allowed);
    console.log('  - Update denied:', deniedLog?.allowed === false);
    
    console.log('\n=== Demo Complete ===\n');
  });
});
