/**
 * ObjectQL Multi-Tenancy Plugin - Mutation Guard Tests
 * Copyright (c) 2026-present ObjectStack Inc.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConsoleLogger } from '@objectql/types';
import { MutationGuard } from '../src/mutation-guard';
import { TenantIsolationError } from '../src/types';

describe('MutationGuard', () => {
  let guard: MutationGuard;
  let logger: ConsoleLogger;
  
  beforeEach(() => {
    logger = new ConsoleLogger({ name: 'test', level: 'silent' });
    guard = new MutationGuard('tenant_id', true, logger);
  });
  
  describe('autoSetTenantId', () => {
    it('should auto-set tenant_id on new record', () => {
      const data = { name: 'Acme Corp' };
      guard.autoSetTenantId(data, 'tenant-123', 'accounts');
      
      expect(data.tenant_id).toBe('tenant-123');
    });
    
    it('should not override existing matching tenant_id', () => {
      const data = { name: 'Acme Corp', tenant_id: 'tenant-123' };
      guard.autoSetTenantId(data, 'tenant-123', 'accounts');
      
      expect(data.tenant_id).toBe('tenant-123');
    });
    
    it('should throw on cross-tenant create in strict mode', () => {
      const data = { name: 'Acme Corp', tenant_id: 'tenant-456' };
      
      expect(() => {
        guard.autoSetTenantId(data, 'tenant-123', 'accounts');
      }).toThrow(TenantIsolationError);
    });
    
    it('should allow cross-tenant create in non-strict mode', () => {
      const nonStrictGuard = new MutationGuard('tenant_id', false, logger);
      const data = { name: 'Acme Corp', tenant_id: 'tenant-456' };
      
      expect(() => {
        nonStrictGuard.autoSetTenantId(data, 'tenant-123', 'accounts');
      }).not.toThrow();
    });
  });
  
  describe('verifyUpdateTenant', () => {
    it('should allow update within same tenant', () => {
      const previousData = { id: 1, name: 'Old Name', tenant_id: 'tenant-123' };
      const updateData = { name: 'New Name' };
      
      expect(() => {
        guard.verifyUpdateTenant(previousData, updateData, 'tenant-123', 'accounts');
      }).not.toThrow();
    });
    
    it('should throw on cross-tenant update', () => {
      const previousData = { id: 1, name: 'Name', tenant_id: 'tenant-456' };
      const updateData = { name: 'New Name' };
      
      expect(() => {
        guard.verifyUpdateTenant(previousData, updateData, 'tenant-123', 'accounts');
      }).toThrow(TenantIsolationError);
    });
    
    it('should prevent tenant reassignment', () => {
      const previousData = { id: 1, name: 'Name', tenant_id: 'tenant-123' };
      const updateData = { tenant_id: 'tenant-456' };
      
      expect(() => {
        guard.verifyUpdateTenant(previousData, updateData, 'tenant-123', 'accounts');
      }).toThrow(TenantIsolationError);
    });
    
    it('should allow update with matching tenant_id in data', () => {
      const previousData = { id: 1, name: 'Name', tenant_id: 'tenant-123' };
      const updateData = { name: 'New Name', tenant_id: 'tenant-123' };
      
      expect(() => {
        guard.verifyUpdateTenant(previousData, updateData, 'tenant-123', 'accounts');
      }).not.toThrow();
    });
    
    it('should skip verification in non-strict mode', () => {
      const nonStrictGuard = new MutationGuard('tenant_id', false, logger);
      const previousData = { id: 1, tenant_id: 'tenant-456' };
      const updateData = { name: 'New' };
      
      expect(() => {
        nonStrictGuard.verifyUpdateTenant(previousData, updateData, 'tenant-123', 'accounts');
      }).not.toThrow();
    });
  });
  
  describe('verifyDeleteTenant', () => {
    it('should allow delete within same tenant', () => {
      const previousData = { id: 1, tenant_id: 'tenant-123' };
      
      expect(() => {
        guard.verifyDeleteTenant(previousData, 'tenant-123', 'accounts');
      }).not.toThrow();
    });
    
    it('should throw on cross-tenant delete', () => {
      const previousData = { id: 1, tenant_id: 'tenant-456' };
      
      expect(() => {
        guard.verifyDeleteTenant(previousData, 'tenant-123', 'accounts');
      }).toThrow(TenantIsolationError);
    });
    
    it('should skip verification in non-strict mode', () => {
      const nonStrictGuard = new MutationGuard('tenant_id', false, logger);
      const previousData = { id: 1, tenant_id: 'tenant-456' };
      
      expect(() => {
        nonStrictGuard.verifyDeleteTenant(previousData, 'tenant-123', 'accounts');
      }).not.toThrow();
    });
  });
  
  describe('shouldIsolate', () => {
    it('should return true for non-exempt objects', () => {
      const result = guard.shouldIsolate('accounts', []);
      expect(result).toBe(true);
    });
    
    it('should return false for exempt objects', () => {
      const result = guard.shouldIsolate('users', ['users', 'tenants']);
      expect(result).toBe(false);
    });
    
    it('should handle empty exempt list', () => {
      const result = guard.shouldIsolate('accounts', []);
      expect(result).toBe(true);
    });
  });
});
