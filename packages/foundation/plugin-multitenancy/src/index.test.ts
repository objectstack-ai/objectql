/**
 * @objectql/plugin-multitenancy - Comprehensive Test Suite
 *
 * Tests for multi-tenancy isolation: TenantResolver, QueryFilterInjector,
 * MutationGuard, and the MultiTenancyPlugin runtime wrapper.
 *
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TenantResolver, defaultTenantResolver } from './tenant-resolver.js';
import { QueryFilterInjector } from './query-filter-injector.js';
import { MutationGuard } from './mutation-guard.js';
import { MultiTenancyPlugin } from './plugin.js';
import { TenantIsolationError } from './types.js';

// ============================================================================
// Shared Mocks & Helpers
// ============================================================================

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

function createContext(overrides: Record<string, unknown> = {}) {
  return {
    user: { id: 'user-1' },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// TenantResolver
// ============================================================================

describe('TenantResolver', () => {
  describe('resolveTenantId()', () => {
    it('priority 1: extracts tenantId directly from context.tenantId', async () => {
      const resolver = new TenantResolver();
      const ctx = createContext({ tenantId: 'tenant-direct' });

      const result = await resolver.resolveTenantId(ctx);

      expect(result).toBe('tenant-direct');
    });

    it('priority 2: extracts tenantId from context.user.tenantId', async () => {
      const resolver = new TenantResolver();
      const ctx = createContext({
        user: { id: 'user-1', tenantId: 'tenant-from-user' },
      });

      const result = await resolver.resolveTenantId(ctx);

      expect(result).toBe('tenant-from-user');
    });

    it('priority 3: extracts tenantId from context.user.tenant_id', async () => {
      const resolver = new TenantResolver();
      const ctx = createContext({
        user: { id: 'user-1', tenant_id: 'tenant-underscore' },
      });

      const result = await resolver.resolveTenantId(ctx);

      expect(result).toBe('tenant-underscore');
    });

    it('respects priority order: context.tenantId wins over user.tenantId', async () => {
      const resolver = new TenantResolver();
      const ctx = createContext({
        tenantId: 'top-level',
        user: { id: 'user-1', tenantId: 'user-level', tenant_id: 'underscore-level' },
      });

      const result = await resolver.resolveTenantId(ctx);

      expect(result).toBe('top-level');
    });

    it('respects priority order: user.tenantId wins over user.tenant_id', async () => {
      const resolver = new TenantResolver();
      const ctx = createContext({
        user: { id: 'user-1', tenantId: 'camel-case', tenant_id: 'snake-case' },
      });

      const result = await resolver.resolveTenantId(ctx);

      expect(result).toBe('camel-case');
    });

    it('throws TenantIsolationError when tenant is missing and throwOnMissingTenant=true', async () => {
      const resolver = new TenantResolver(undefined, true, true);
      const ctx = createContext();

      await expect(resolver.resolveTenantId(ctx)).rejects.toThrow(TenantIsolationError);
    });

    it('returns null when tenant is missing and throwOnMissingTenant=false', async () => {
      const resolver = new TenantResolver(undefined, true, false);
      const ctx = createContext();

      const result = await resolver.resolveTenantId(ctx);

      expect(result).toBeNull();
    });

    it('uses custom resolver function when provided', async () => {
      const customResolver = vi.fn().mockReturnValue('custom-tenant-42');
      const resolver = new TenantResolver(customResolver);
      const ctx = createContext({ tenantId: 'ignored' });

      const result = await resolver.resolveTenantId(ctx);

      expect(result).toBe('custom-tenant-42');
      expect(customResolver).toHaveBeenCalledWith(ctx);
    });
  });

  describe('defaultTenantResolver()', () => {
    it('resolves from context.tenantId', () => {
      const ctx = createContext({ tenantId: 'default-resolver-test' });

      const result = defaultTenantResolver(ctx);

      expect(result).toBe('default-resolver-test');
    });

    it('throws TenantIsolationError when no tenant info is present', () => {
      const ctx = createContext();

      expect(() => defaultTenantResolver(ctx)).toThrow(TenantIsolationError);
    });
  });

  describe('extractTenantContext()', () => {
    it('returns full TenantContext object with tenantId and metadata', async () => {
      const resolver = new TenantResolver();
      const ctx = createContext({ tenantId: 'ctx-tenant' });

      const tenantCtx = await resolver.extractTenantContext(ctx);

      expect(tenantCtx).toBeDefined();
      expect(tenantCtx!.tenantId).toBe('ctx-tenant');
      expect(tenantCtx!.requestContext).toBe(ctx);
      expect(tenantCtx!.user).toBe(ctx.user);
    });

    it('returns null when tenant is missing and throwOnMissingTenant=false', async () => {
      const resolver = new TenantResolver(undefined, true, false);
      const ctx = createContext();

      const tenantCtx = await resolver.extractTenantContext(ctx);

      expect(tenantCtx).toBeNull();
    });
  });

  describe('validateTenant()', () => {
    it('throws TenantIsolationError when tenantId is null', () => {
      const resolver = new TenantResolver();

      expect(() => resolver.validateTenant(null, 'projects', 'find')).toThrow(
        TenantIsolationError,
      );
    });

    it('throws TenantIsolationError when tenantId is undefined', () => {
      const resolver = new TenantResolver();

      expect(() =>
        resolver.validateTenant(undefined as unknown as string | null, 'projects', 'find'),
      ).toThrow(TenantIsolationError);
    });

    it('does not throw when tenantId is a valid string', () => {
      const resolver = new TenantResolver();

      expect(() => resolver.validateTenant('valid-tenant', 'projects', 'find')).not.toThrow();
    });
  });
});

// ============================================================================
// QueryFilterInjector
// ============================================================================

describe('QueryFilterInjector', () => {
  const tenantField = 'tenant_id';

  describe('injectTenantFilter()', () => {
    it('injects tenant filter into a filters array format', () => {
      const injector = new QueryFilterInjector(tenantField, true, mockLogger as any);
      const query = {
        filters: [{ field: 'status', operator: 'eq', value: 'active' }],
      };

      injector.injectTenantFilter(query, 'tenant-abc', 'projects');

      expect(query.filters).toContainEqual(
        expect.objectContaining({ field: 'tenant_id', value: 'tenant-abc' }),
      );
    });

    it('injects tenant filter into a where clause format', () => {
      const injector = new QueryFilterInjector(tenantField, true, mockLogger as any);
      const query = {
        where: { status: 'active' } as Record<string, unknown>,
      };

      injector.injectTenantFilter(query, 'tenant-xyz', 'projects');

      expect(query.where.tenant_id).toBe('tenant-xyz');
    });

    it('injects tenant filter into a plain object format', () => {
      const injector = new QueryFilterInjector(tenantField, false, mockLogger as any);
      const query: Record<string, unknown> = { status: 'active' };

      injector.injectTenantFilter(query, 'tenant-plain', 'projects');

      expect(query.tenant_id).toBe('tenant-plain');
    });

    it('detects cross-tenant query and throws in strict mode', () => {
      const injector = new QueryFilterInjector(tenantField, true, mockLogger as any);
      const query = {
        where: { tenant_id: 'tenant-other' },
      };

      expect(() => injector.injectTenantFilter(query, 'tenant-mine', 'projects')).toThrow(
        TenantIsolationError,
      );
    });

    it('allows cross-tenant query when strict mode is disabled', () => {
      const injector = new QueryFilterInjector(tenantField, false, mockLogger as any);
      const query = {
        where: { tenant_id: 'tenant-other' } as Record<string, unknown>,
      };

      expect(() =>
        injector.injectTenantFilter(query, 'tenant-mine', 'projects'),
      ).not.toThrow();
      // Overwrites with the current tenant in non-strict mode
      expect(query.where.tenant_id).toBe('tenant-mine');
    });

    it('does nothing when query is null', () => {
      const injector = new QueryFilterInjector(tenantField, true, mockLogger as any);

      expect(() =>
        injector.injectTenantFilter(null, 'tenant-any', 'projects'),
      ).not.toThrow();
    });
  });

  describe('verifyTenantFilter()', () => {
    it('does not throw for matching tenant in filters array', () => {
      const injector = new QueryFilterInjector(tenantField, true, mockLogger as any);
      const query = {
        filters: [{ field: 'tenant_id', operator: 'eq', value: 'tenant-ok' }],
      };

      expect(() =>
        injector.verifyTenantFilter(query, 'tenant-ok', 'projects'),
      ).not.toThrow();
    });

    it('throws for mismatched tenant in filters array', () => {
      const injector = new QueryFilterInjector(tenantField, true, mockLogger as any);
      const query = {
        filters: [{ field: 'tenant_id', operator: 'eq', value: 'tenant-wrong' }],
      };

      expect(() =>
        injector.verifyTenantFilter(query, 'tenant-correct', 'projects'),
      ).toThrow(TenantIsolationError);
    });

    it('throws for mismatched tenant in where clause', () => {
      const injector = new QueryFilterInjector(tenantField, true, mockLogger as any);
      const query = {
        where: { tenant_id: 'tenant-foreign' },
      };

      expect(() =>
        injector.verifyTenantFilter(query, 'tenant-mine', 'projects'),
      ).toThrow(TenantIsolationError);
    });

    it('throws for mismatched tenant in plain object', () => {
      const injector = new QueryFilterInjector(tenantField, true, mockLogger as any);
      const query = { tenant_id: 'tenant-other' };

      expect(() =>
        injector.verifyTenantFilter(query, 'tenant-mine', 'projects'),
      ).toThrow(TenantIsolationError);
    });

    it('does nothing when strict mode is disabled', () => {
      const injector = new QueryFilterInjector(tenantField, false, mockLogger as any);
      const query = { tenant_id: 'tenant-mismatch' };

      expect(() =>
        injector.verifyTenantFilter(query, 'tenant-mine', 'projects'),
      ).not.toThrow();
    });

    it('does nothing when query is null', () => {
      const injector = new QueryFilterInjector(tenantField, true, mockLogger as any);

      expect(() =>
        injector.verifyTenantFilter(null, 'tenant-any', 'projects'),
      ).not.toThrow();
    });
  });
});

// ============================================================================
// MutationGuard
// ============================================================================

describe('MutationGuard', () => {
  const tenantField = 'tenant_id';

  describe('autoSetTenantId()', () => {
    it('auto-sets tenant_id on data when not present', () => {
      const guard = new MutationGuard(tenantField, true, mockLogger as any);
      const data: Record<string, unknown> = { name: 'Project Alpha' };

      guard.autoSetTenantId(data, 'tenant-auto', 'projects');

      expect(data.tenant_id).toBe('tenant-auto');
    });

    it('accepts matching existing tenant_id without error', () => {
      const guard = new MutationGuard(tenantField, true, mockLogger as any);
      const data = { name: 'Project Beta', tenant_id: 'tenant-match' };

      expect(() => guard.autoSetTenantId(data, 'tenant-match', 'projects')).not.toThrow();
      expect(data.tenant_id).toBe('tenant-match');
    });

    it('throws TenantIsolationError on cross-tenant create in strict mode', () => {
      const guard = new MutationGuard(tenantField, true, mockLogger as any);
      const data = { name: 'Project Gamma', tenant_id: 'tenant-foreign' };

      expect(() => guard.autoSetTenantId(data, 'tenant-mine', 'projects')).toThrow(
        TenantIsolationError,
      );
    });

    it('does nothing when data is null', () => {
      const guard = new MutationGuard(tenantField, true, mockLogger as any);

      expect(() => guard.autoSetTenantId(null, 'tenant-any', 'projects')).not.toThrow();
    });
  });

  describe('verifyUpdateTenant()', () => {
    it('passes for matching tenant_id on existing record', () => {
      const guard = new MutationGuard(tenantField, true, mockLogger as any);
      const previousData = { id: 'rec-1', tenant_id: 'tenant-owner' };
      const updateData = { name: 'Updated Name' };

      expect(() =>
        guard.verifyUpdateTenant(previousData, updateData, 'tenant-owner', 'projects'),
      ).not.toThrow();
    });

    it('throws TenantIsolationError on cross-tenant update', () => {
      const guard = new MutationGuard(tenantField, true, mockLogger as any);
      const previousData = { id: 'rec-2', tenant_id: 'tenant-a' };
      const updateData = { name: 'Hijack' };

      expect(() =>
        guard.verifyUpdateTenant(previousData, updateData, 'tenant-b', 'projects'),
      ).toThrow(TenantIsolationError);
    });

    it('throws TenantIsolationError on tenant reassignment attempt', () => {
      const guard = new MutationGuard(tenantField, true, mockLogger as any);
      const previousData = { id: 'rec-3', tenant_id: 'tenant-original' };
      const updateData = { tenant_id: 'tenant-new' };

      expect(() =>
        guard.verifyUpdateTenant(previousData, updateData, 'tenant-original', 'projects'),
      ).toThrow(TenantIsolationError);
    });

    it('skips verification when strict mode is disabled', () => {
      const guard = new MutationGuard(tenantField, false, mockLogger as any);
      const previousData = { id: 'rec-4', tenant_id: 'tenant-a' };
      const updateData = { tenant_id: 'tenant-b' };

      expect(() =>
        guard.verifyUpdateTenant(previousData, updateData, 'tenant-c', 'projects'),
      ).not.toThrow();
    });
  });

  describe('verifyDeleteTenant()', () => {
    it('passes for matching tenant_id on record to be deleted', () => {
      const guard = new MutationGuard(tenantField, true, mockLogger as any);
      const previousData = { id: 'rec-4', tenant_id: 'tenant-deleter' };

      expect(() =>
        guard.verifyDeleteTenant(previousData, 'tenant-deleter', 'projects'),
      ).not.toThrow();
    });

    it('throws TenantIsolationError on cross-tenant delete', () => {
      const guard = new MutationGuard(tenantField, true, mockLogger as any);
      const previousData = { id: 'rec-5', tenant_id: 'tenant-owner' };

      expect(() =>
        guard.verifyDeleteTenant(previousData, 'tenant-attacker', 'projects'),
      ).toThrow(TenantIsolationError);
    });

    it('skips verification when strict mode is disabled', () => {
      const guard = new MutationGuard(tenantField, false, mockLogger as any);
      const previousData = { id: 'rec-6', tenant_id: 'tenant-a' };

      expect(() =>
        guard.verifyDeleteTenant(previousData, 'tenant-b', 'projects'),
      ).not.toThrow();
    });
  });

  describe('shouldIsolate()', () => {
    it('returns false for exempt objects', () => {
      const guard = new MutationGuard(tenantField, true, mockLogger as any);
      const exemptObjects = ['system_config', 'audit_log'];

      expect(guard.shouldIsolate('system_config', exemptObjects)).toBe(false);
      expect(guard.shouldIsolate('audit_log', exemptObjects)).toBe(false);
    });

    it('returns true for non-exempt objects', () => {
      const guard = new MutationGuard(tenantField, true, mockLogger as any);
      const exemptObjects = ['system_config'];

      expect(guard.shouldIsolate('projects', exemptObjects)).toBe(true);
      expect(guard.shouldIsolate('tasks', exemptObjects)).toBe(true);
    });

    it('returns true when exempt list is empty', () => {
      const guard = new MutationGuard(tenantField, true, mockLogger as any);

      expect(guard.shouldIsolate('anything', [])).toBe(true);
    });
  });
});

// ============================================================================
// MultiTenancyPlugin
// ============================================================================

describe('MultiTenancyPlugin', () => {
  describe('constructor', () => {
    it('creates plugin with default config', () => {
      const plugin = new MultiTenancyPlugin();

      expect(plugin).toBeDefined();
      expect(plugin.name).toBe('@objectql/plugin-multitenancy');
      expect(plugin.version).toBe('4.2.0');
    });

    it('creates plugin with custom config', () => {
      const plugin = new MultiTenancyPlugin({
        tenantField: 'org_id',
        strictMode: true,
        exemptObjects: ['migrations'],
      });

      expect(plugin).toBeDefined();
    });
  });

  describe('install()', () => {
    function createMockKernel() {
      const hooks: Array<{ name: string; handler: any }> = [];
      return {
        hooks,
        hook: vi.fn((name: string, handler: any) => {
          hooks.push({ name, handler });
        }),
        engine: {
          multitenancy: undefined as any,
        },
        getKernel: vi.fn(),
      };
    }

    it('registers all 5 hooks on the engine', async () => {
      const plugin = new MultiTenancyPlugin();
      const mockCtx = createMockKernel();

      await plugin.install(mockCtx);

      expect(mockCtx.hook).toHaveBeenCalledTimes(5);
    });

    it('registers hooks for beforeFind, beforeCount, beforeCreate, beforeUpdate, and beforeDelete', async () => {
      const plugin = new MultiTenancyPlugin();
      const mockCtx = createMockKernel();

      await plugin.install(mockCtx);

      const registeredNames = mockCtx.hooks.map((h) => h.name);
      expect(registeredNames).toContain('beforeFind');
      expect(registeredNames).toContain('beforeCount');
      expect(registeredNames).toContain('beforeCreate');
      expect(registeredNames).toContain('beforeUpdate');
      expect(registeredNames).toContain('beforeDelete');
    });

    it('skips installation when plugin is disabled', async () => {
      const plugin = new MultiTenancyPlugin({ enabled: false });
      const mockCtx = createMockKernel();

      await plugin.install(mockCtx);

      expect(mockCtx.hook).not.toHaveBeenCalled();
    });

    it('sets multitenancy property on the kernel', async () => {
      const plugin = new MultiTenancyPlugin();
      const mockCtx = createMockKernel();

      await plugin.install(mockCtx);

      expect(mockCtx.engine.multitenancy).toBeDefined();
      expect(mockCtx.engine.multitenancy.config).toBeDefined();
      expect(mockCtx.engine.multitenancy.resolver).toBeInstanceOf(TenantResolver);
      expect(mockCtx.engine.multitenancy.injector).toBeInstanceOf(QueryFilterInjector);
      expect(mockCtx.engine.multitenancy.guard).toBeInstanceOf(MutationGuard);
    });
  });

  describe('audit logging', () => {
    it('getAuditLogs() returns an empty array initially', () => {
      const plugin = new MultiTenancyPlugin({ enableAudit: true });

      const logs = plugin.getAuditLogs();

      expect(logs).toBeDefined();
      expect(Array.isArray(logs)).toBe(true);
      expect(logs).toHaveLength(0);
    });

    it('clearAuditLogs() empties the audit log buffer', () => {
      const plugin = new MultiTenancyPlugin({ enableAudit: true });

      plugin.clearAuditLogs();
      const logs = plugin.getAuditLogs();

      expect(logs).toHaveLength(0);
    });
  });
});

// ============================================================================
// TenantIsolationError
// ============================================================================

describe('TenantIsolationError', () => {
  it('is an instance of Error', () => {
    const error = new TenantIsolationError('cross-tenant access');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(TenantIsolationError);
  });

  it('carries the correct error message', () => {
    const error = new TenantIsolationError('Tenant mismatch detected');

    expect(error.message).toBe('Tenant mismatch detected');
  });

  it('has the correct error name', () => {
    const error = new TenantIsolationError('test');

    expect(error.name).toBe('TenantIsolationError');
  });

  it('has the correct error code', () => {
    const error = new TenantIsolationError('test');

    expect(error.code).toBe('TENANT_ISOLATION_ERROR');
  });

  it('carries optional details', () => {
    const error = new TenantIsolationError('test', {
      tenantId: 'tenant-1',
      objectName: 'projects',
      operation: 'find',
      reason: 'CROSS_TENANT_QUERY',
    });

    expect(error.details).toBeDefined();
    expect(error.details!.tenantId).toBe('tenant-1');
    expect(error.details!.objectName).toBe('projects');
    expect(error.details!.operation).toBe('find');
    expect(error.details!.reason).toBe('CROSS_TENANT_QUERY');
  });
});

