/**
 * ObjectQL Multi-Tenancy Plugin - Query Filter Injector Tests
 * Copyright (c) 2026-present ObjectStack Inc.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConsoleLogger } from '@objectql/types';
import { QueryFilterInjector } from '../src/query-filter-injector';
import { TenantIsolationError } from '../src/types';

describe('QueryFilterInjector', () => {
  let injector: QueryFilterInjector;
  let logger: ConsoleLogger;
  
  beforeEach(() => {
    logger = new ConsoleLogger({ name: 'test', level: 'silent' });
    injector = new QueryFilterInjector('tenant_id', true, logger);
  });
  
  describe('injectTenantFilter', () => {
    it('should inject into plain object query', () => {
      const query = { status: 'active' };
      injector.injectTenantFilter(query, 'tenant-123', 'accounts');
      
      expect(query).toEqual({
        status: 'active',
        tenant_id: 'tenant-123',
      });
    });
    
    it('should inject into filters array', () => {
      const query = {
        filters: [{ field: 'status', operator: 'eq', value: 'active' }],
      };
      
      injector.injectTenantFilter(query, 'tenant-123', 'accounts');
      
      expect(query.filters).toHaveLength(2);
      expect(query.filters[1]).toEqual({
        field: 'tenant_id',
        operator: 'eq',
        value: 'tenant-123',
      });
    });
    
    it('should inject into where clause', () => {
      const query = {
        where: { status: 'active' },
      };
      
      injector.injectTenantFilter(query, 'tenant-123', 'accounts');
      
      expect(query.where).toEqual({
        status: 'active',
        tenant_id: 'tenant-123',
      });
    });
    
    it('should throw on cross-tenant query in strict mode', () => {
      const query = { tenant_id: 'tenant-456' };
      
      expect(() => {
        injector.injectTenantFilter(query, 'tenant-123', 'accounts');
      }).toThrow(TenantIsolationError);
    });
    
    it('should allow same tenant in existing query', () => {
      const query = { tenant_id: 'tenant-123' };
      
      expect(() => {
        injector.injectTenantFilter(query, 'tenant-123', 'accounts');
      }).not.toThrow();
      
      expect(query.tenant_id).toBe('tenant-123');
    });
    
    it('should not throw in non-strict mode', () => {
      const nonStrictInjector = new QueryFilterInjector('tenant_id', false, logger);
      const query = { tenant_id: 'tenant-456' };
      
      expect(() => {
        nonStrictInjector.injectTenantFilter(query, 'tenant-123', 'accounts');
      }).not.toThrow();
    });
  });
  
  describe('verifyTenantFilter', () => {
    it('should pass when no tenant_id in query', () => {
      const query = { status: 'active' };
      
      expect(() => {
        injector.verifyTenantFilter(query, 'tenant-123', 'accounts');
      }).not.toThrow();
    });
    
    it('should pass when tenant_id matches', () => {
      const query = { tenant_id: 'tenant-123' };
      
      expect(() => {
        injector.verifyTenantFilter(query, 'tenant-123', 'accounts');
      }).not.toThrow();
    });
    
    it('should throw when tenant_id does not match', () => {
      const query = { tenant_id: 'tenant-456' };
      
      expect(() => {
        injector.verifyTenantFilter(query, 'tenant-123', 'accounts');
      }).toThrow(TenantIsolationError);
    });
    
    it('should verify filters array', () => {
      const query = {
        filters: [
          { field: 'tenant_id', operator: 'eq', value: 'tenant-456' },
        ],
      };
      
      expect(() => {
        injector.verifyTenantFilter(query, 'tenant-123', 'accounts');
      }).toThrow(TenantIsolationError);
    });
    
    it('should verify where clause', () => {
      const query = {
        where: { tenant_id: 'tenant-456' },
      };
      
      expect(() => {
        injector.verifyTenantFilter(query, 'tenant-123', 'accounts');
      }).toThrow(TenantIsolationError);
    });
    
    it('should skip verification in non-strict mode', () => {
      const nonStrictInjector = new QueryFilterInjector('tenant_id', false, logger);
      const query = { tenant_id: 'tenant-456' };
      
      expect(() => {
        nonStrictInjector.verifyTenantFilter(query, 'tenant-123', 'accounts');
      }).not.toThrow();
    });
  });
});
