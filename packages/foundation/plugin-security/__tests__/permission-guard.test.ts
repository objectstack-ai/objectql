/**
 * ObjectQL Security Plugin - Permission Guard Tests
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PermissionGuard } from '../src/permission-guard';
import type { PermissionLoader } from '../src/permission-loader';
import type { SecurityContext } from '../src/types';
import type { PermissionConfig } from '@objectql/types';

function createMockLoader(configs: Record<string, PermissionConfig> = {}): PermissionLoader {
  return {
    load: jest.fn(async (objectName: string) => configs[objectName]),
    loadAll: jest.fn(),
    reload: jest.fn(),
    getCompiledRules: jest.fn(() => []),
  } as any;
}

function ctx(overrides: Partial<SecurityContext> = {}): SecurityContext {
  return {
    user: { id: 'user1', roles: ['member'] },
    objectName: 'accounts',
    operation: 'read',
    ...overrides,
  };
}

describe('PermissionGuard', () => {
  // ----------------------------------------------------------
  // Basic behaviour
  // ----------------------------------------------------------
  describe('Basic permission checks', () => {
    it('should grant access when no config exists', async () => {
      const guard = new PermissionGuard(createMockLoader());
      const result = await guard.checkPermission(ctx());
      expect(result.granted).toBe(true);
      expect(result.reason).toContain('No permission configuration');
    });

    it('should deny access when no user context is provided', async () => {
      const config: PermissionConfig = {
        name: 'accounts_perms',
        object: 'accounts',
        object_permissions: { read: ['member'] },
      };
      const guard = new PermissionGuard(createMockLoader({ accounts: config }));
      const result = await guard.checkPermission(ctx({ user: undefined }));
      expect(result.granted).toBe(false);
      expect(result.reason).toContain('No user context');
    });

    it('should grant access when no restrictions match', async () => {
      // Config exists but has no object_permissions / record_rules / RLS
      const config: PermissionConfig = {
        name: 'accounts_perms',
        object: 'accounts',
      };
      const guard = new PermissionGuard(createMockLoader({ accounts: config }));
      const result = await guard.checkPermission(ctx());
      expect(result.granted).toBe(true);
      expect(result.reason).toContain('No restrictions');
    });
  });

  // ----------------------------------------------------------
  // Object-level permissions
  // ----------------------------------------------------------
  describe('Object-level permissions', () => {
    const config: PermissionConfig = {
      name: 'accounts_perms',
      object: 'accounts',
      object_permissions: {
        read: ['member', 'admin'],
        create: ['admin'],
        update: ['admin'],
        delete: ['admin'],
      },
    };

    it('should grant when user role is in allowed list', async () => {
      const guard = new PermissionGuard(createMockLoader({ accounts: config }));
      const result = await guard.checkObjectPermission(ctx(), 'read');
      expect(result.granted).toBe(true);
    });

    it('should deny when user role is NOT in allowed list', async () => {
      const guard = new PermissionGuard(createMockLoader({ accounts: config }));
      const result = await guard.checkObjectPermission(ctx(), 'create');
      expect(result.granted).toBe(false);
      expect(result.reason).toContain('not authorized');
    });

    it('should grant admin for all operations', async () => {
      const guard = new PermissionGuard(createMockLoader({ accounts: config }));
      const c = ctx({ user: { id: 'admin1', roles: ['admin'] } });

      for (const op of ['read', 'create', 'update', 'delete'] as const) {
        const result = await guard.checkObjectPermission(c, op);
        expect(result.granted).toBe(true);
      }
    });

    it('should deny when allowedRoles is not an array', async () => {
      const badConfig: PermissionConfig = {
        name: 'accounts_perms',
        object: 'accounts',
        object_permissions: {
          read: 'admin' as any, // wrong type
        },
      };
      const guard = new PermissionGuard(createMockLoader({ accounts: badConfig }));
      const result = await guard.checkObjectPermission(ctx(), 'read');
      expect(result.granted).toBe(false);
      expect(result.reason).toContain('No roles configured');
    });

    it('should deny when operation has no configured roles', async () => {
      const partialConfig: PermissionConfig = {
        name: 'accounts_perms',
        object: 'accounts',
        object_permissions: {
          read: ['member'],
          // 'update' is not configured
        },
      };
      const guard = new PermissionGuard(createMockLoader({ accounts: partialConfig }));
      const result = await guard.checkObjectPermission(ctx(), 'update');
      expect(result.granted).toBe(false);
    });
  });

  // ----------------------------------------------------------
  // Field-level permissions
  // ----------------------------------------------------------
  describe('Field-level permissions', () => {
    const config: PermissionConfig = {
      name: 'accounts_perms',
      object: 'accounts',
      field_permissions: {
        salary: { read: ['hr', 'admin'], update: ['admin'] },
        name: { read: ['member', 'admin'], update: ['admin'] },
      },
    };

    it('should grant field read when user has role', async () => {
      const guard = new PermissionGuard(createMockLoader({ accounts: config }));
      const c = ctx({ user: { id: 'hr1', roles: ['hr'] } });
      const result = await guard.checkFieldPermission(c, 'salary', 'read');
      expect(result.granted).toBe(true);
    });

    it('should deny field read when user lacks role', async () => {
      const guard = new PermissionGuard(createMockLoader({ accounts: config }));
      const result = await guard.checkFieldPermission(ctx(), 'salary', 'read');
      expect(result.granted).toBe(false);
      expect(result.reason).toContain('not authorized');
    });

    it('should grant when field has no restrictions', async () => {
      const guard = new PermissionGuard(createMockLoader({ accounts: config }));
      const result = await guard.checkFieldPermission(ctx(), 'email', 'read');
      expect(result.granted).toBe(true);
    });

    it('should deny field update for read-only roles', async () => {
      const guard = new PermissionGuard(createMockLoader({ accounts: config }));
      const c = ctx({ user: { id: 'hr1', roles: ['hr'] } });
      const result = await guard.checkFieldPermission(c, 'salary', 'update');
      expect(result.granted).toBe(false);
    });

    it('should deny when field operation has no configured roles', async () => {
      const noUpdateConfig: PermissionConfig = {
        name: 'accounts_perms',
        object: 'accounts',
        field_permissions: {
          salary: { read: ['hr'] },
          // update not configured for salary
        },
      };
      const guard = new PermissionGuard(createMockLoader({ accounts: noUpdateConfig }));
      const c = ctx({ user: { id: 'hr1', roles: ['hr'] } });
      const result = await guard.checkFieldPermission(c, 'salary', 'update');
      expect(result.granted).toBe(false);
    });
  });

  // ----------------------------------------------------------
  // Record-level permissions
  // ----------------------------------------------------------
  describe('Record-level permissions', () => {
    it('should grant when compiled rule evaluator matches and bitmask allows', async () => {
      const config: PermissionConfig = {
        name: 'accounts_perms',
        object: 'accounts',
        record_rules: [
          {
            name: 'owner_rule',
            condition: { type: 'simple', field: 'owner', operator: '=', value: 'user1' },
            permissions: { read: true, update: true, delete: false },
          },
        ],
      };

      const mockLoader = createMockLoader({ accounts: config });
      // Simulate compiled rules
      (mockLoader.getCompiledRules as jest.Mock).mockReturnValue([
        {
          ruleName: 'owner_rule',
          permissionBitmask: 0b011, // read + update
          roleLookup: new Map(),
          evaluator: (ctx: any) => ctx.record?.owner === 'user1',
          priority: 0,
        },
      ]);

      const guard = new PermissionGuard(mockLoader);
      const result = await guard.checkPermission(
        ctx({ record: { owner: 'user1' } })
      );
      expect(result.granted).toBe(true);
      expect(result.rule).toBe('owner_rule');
    });

    it('should deny when evaluator matches but bitmask does not grant the operation', async () => {
      const config: PermissionConfig = {
        name: 'accounts_perms',
        object: 'accounts',
        record_rules: [
          {
            name: 'viewer_rule',
            condition: { type: 'simple', field: 'team', operator: '=', value: 'engineering' },
            permissions: { read: true, update: false, delete: false },
          },
        ],
      };

      const mockLoader = createMockLoader({ accounts: config });
      (mockLoader.getCompiledRules as jest.Mock).mockReturnValue([
        {
          ruleName: 'viewer_rule',
          permissionBitmask: 0b001, // read only
          roleLookup: new Map(),
          evaluator: () => true,
          priority: 0,
        },
      ]);

      const guard = new PermissionGuard(mockLoader);
      // Try to delete — should fail
      const result = await guard.checkPermission(
        ctx({ operation: 'delete', record: { team: 'engineering' } })
      );
      expect(result.granted).toBe(false);
      expect(result.reason).toContain('No record rules matched');
    });

    it('should deny when no compiled rules match', async () => {
      const config: PermissionConfig = {
        name: 'accounts_perms',
        object: 'accounts',
        record_rules: [
          {
            name: 'owner_rule',
            condition: { type: 'simple', field: 'owner', operator: '=', value: 'someone_else' },
            permissions: { read: true, update: true, delete: false },
          },
        ],
      };

      const mockLoader = createMockLoader({ accounts: config });
      (mockLoader.getCompiledRules as jest.Mock).mockReturnValue([
        {
          ruleName: 'owner_rule',
          permissionBitmask: 0b011,
          roleLookup: new Map(),
          evaluator: (ctx: any) => ctx.record?.owner === 'someone_else',
          priority: 0,
        },
      ]);

      const guard = new PermissionGuard(mockLoader);
      const result = await guard.checkPermission(
        ctx({ record: { owner: 'user1' } })
      );
      expect(result.granted).toBe(false);
    });

    it('should fall back when no compiled rules exist', async () => {
      const config: PermissionConfig = {
        name: 'accounts_perms',
        object: 'accounts',
        record_rules: [
          {
            name: 'fallback_rule',
            condition: {},
            permissions: { read: true, update: false, delete: false },
          },
        ],
      };

      const mockLoader = createMockLoader({ accounts: config });
      // No compiled rules
      (mockLoader.getCompiledRules as jest.Mock).mockReturnValue([]);

      const guard = new PermissionGuard(mockLoader);
      const result = await guard.checkPermission(
        ctx({ record: { status: 'active' } })
      );
      // Fallback path — no rule evaluators → deny
      expect(result.granted).toBe(false);
    });
  });

  // ----------------------------------------------------------
  // Row-level security
  // ----------------------------------------------------------
  describe('Row-level security', () => {
    it('should grant when RLS is disabled', async () => {
      const config: PermissionConfig = {
        name: 'accounts_perms',
        object: 'accounts',
        row_level_security: { enabled: false },
      };
      const guard = new PermissionGuard(createMockLoader({ accounts: config }));
      const result = await guard.checkPermission(ctx());
      expect(result.granted).toBe(true);
    });

    it('should grant when user has bypass exception', async () => {
      const config: PermissionConfig = {
        name: 'accounts_perms',
        object: 'accounts',
        row_level_security: {
          enabled: true,
          exceptions: [{ role: 'admin', bypass: true }],
        },
      };
      const guard = new PermissionGuard(createMockLoader({ accounts: config }));
      const c = ctx({ user: { id: 'admin1', roles: ['admin'] } });
      const result = await guard.checkPermission(c);
      expect(result.granted).toBe(true);
      expect(result.reason).toContain('bypasses RLS');
    });

    it('should grant (delegate to query trimmer) when no bypass', async () => {
      const config: PermissionConfig = {
        name: 'accounts_perms',
        object: 'accounts',
        row_level_security: { enabled: true },
      };
      const guard = new PermissionGuard(createMockLoader({ accounts: config }));
      const result = await guard.checkPermission(ctx());
      // RLS with no bypass → grant (query trimmer will handle filtering)
      expect(result.granted).toBe(true);
    });
  });

  // ----------------------------------------------------------
  // Cache
  // ----------------------------------------------------------
  describe('Caching', () => {
    it('should cache and return cached results', async () => {
      const config: PermissionConfig = {
        name: 'accounts_perms',
        object: 'accounts',
        object_permissions: { read: ['member'] },
      };
      const loader = createMockLoader({ accounts: config });
      const guard = new PermissionGuard(loader, true, 60000);

      const c = ctx();
      const r1 = await guard.checkPermission(c);
      const r2 = await guard.checkPermission(c);

      expect(r1.granted).toBe(true);
      expect(r2.granted).toBe(true);
      // loader.load should only be called once (second call hits cache)
      expect(loader.load).toHaveBeenCalledTimes(1);
    });

    it('should not cache when caching is disabled', async () => {
      const config: PermissionConfig = {
        name: 'accounts_perms',
        object: 'accounts',
        object_permissions: { read: ['member'] },
      };
      const loader = createMockLoader({ accounts: config });
      const guard = new PermissionGuard(loader, false);

      const c = ctx();
      await guard.checkPermission(c);
      await guard.checkPermission(c);

      expect(loader.load).toHaveBeenCalledTimes(2);
    });

    it('should expire cached entries after TTL', async () => {
      const config: PermissionConfig = {
        name: 'accounts_perms',
        object: 'accounts',
        object_permissions: { read: ['member'] },
      };
      const loader = createMockLoader({ accounts: config });
      const guard = new PermissionGuard(loader, true, 50); // 50ms TTL

      const c = ctx();
      await guard.checkPermission(c);

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 60));

      await guard.checkPermission(c);
      expect(loader.load).toHaveBeenCalledTimes(2);
    });

    it('should clear all cached entries', async () => {
      const config: PermissionConfig = {
        name: 'accounts_perms',
        object: 'accounts',
        object_permissions: { read: ['member'] },
      };
      const loader = createMockLoader({ accounts: config });
      const guard = new PermissionGuard(loader, true, 60000);

      await guard.checkPermission(ctx());
      guard.clearCache();
      await guard.checkPermission(ctx());

      expect(loader.load).toHaveBeenCalledTimes(2);
    });

    it('should generate unique cache keys for different contexts', async () => {
      const config: PermissionConfig = {
        name: 'accounts_perms',
        object: 'accounts',
        object_permissions: { read: ['member'] },
      };
      const loader = createMockLoader({ accounts: config });
      const guard = new PermissionGuard(loader, true, 60000);

      // Two different users — should not hit cache
      await guard.checkPermission(ctx({ user: { id: 'u1', roles: ['member'] } }));
      await guard.checkPermission(ctx({ user: { id: 'u2', roles: ['member'] } }));

      expect(loader.load).toHaveBeenCalledTimes(2);
    });
  });

  // ----------------------------------------------------------
  // Bitmask
  // ----------------------------------------------------------
  describe('Bitmask operations', () => {
    it('should correctly check read/update/delete bitmask bits', async () => {
      const config: PermissionConfig = {
        name: 'accounts_perms',
        object: 'accounts',
        record_rules: [
          {
            name: 'full_rule',
            condition: {},
            permissions: { read: true, update: true, delete: true },
          },
        ],
      };

      const mockLoader = createMockLoader({ accounts: config });

      // Bitmask 0b111 = read(bit0) + update(bit1) + delete(bit2) = 7
      (mockLoader.getCompiledRules as jest.Mock).mockReturnValue([
        {
          ruleName: 'full_rule',
          permissionBitmask: 0b111,
          roleLookup: new Map(),
          evaluator: () => true,
          priority: 0,
        },
      ]);

      const guard = new PermissionGuard(mockLoader);

      for (const op of ['read', 'update', 'delete']) {
        const result = await guard.checkPermission(
          ctx({ operation: op, record: {} })
        );
        expect(result.granted).toBe(true);
      }
    });

    it('should deny unknown operations via bitmask', async () => {
      const config: PermissionConfig = {
        name: 'accounts_perms',
        object: 'accounts',
        record_rules: [
          {
            name: 'some_rule',
            condition: {},
            permissions: { read: true, update: false, delete: false },
          },
        ],
      };

      const mockLoader = createMockLoader({ accounts: config });
      (mockLoader.getCompiledRules as jest.Mock).mockReturnValue([
        {
          ruleName: 'some_rule',
          permissionBitmask: 0b001,
          roleLookup: new Map(),
          evaluator: () => true,
          priority: 0,
        },
      ]);

      const guard = new PermissionGuard(mockLoader);
      // 'export' is not a known operation
      const result = await guard.checkPermission(
        ctx({ operation: 'export', record: {} })
      );
      expect(result.granted).toBe(false);
    });
  });
});
