/**
 * ObjectQL Security Plugin - Permission Loader Tests
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PermissionLoader } from '../src/permission-loader';
import type { SecurityPluginConfig, IPermissionStorage } from '../src/types';
import type { PermissionConfig } from '@objectql/types';

// Minimal config factory
function loaderConfig(overrides: Partial<SecurityPluginConfig> = {}): SecurityPluginConfig {
  return {
    storageType: 'memory',
    permissions: [],
    ...overrides,
  } as SecurityPluginConfig;
}

const ACCOUNTS_PERM: PermissionConfig = {
  name: 'accounts_perms',
  object: 'accounts',
  object_permissions: {
    read: ['member', 'admin'],
    create: ['admin'],
    update: ['admin'],
    delete: ['admin'],
  },
  record_rules: [
    {
      name: 'owner_rule',
      condition: {
        type: 'simple',
        field: 'owner_id',
        operator: '=',
        value: '$current_user.id',
      },
      permissions: { read: true, update: true, delete: false },
      priority: 10,
    },
  ],
};

describe('PermissionLoader', () => {
  // ----------------------------------------------------------
  // Storage initialisation
  // ----------------------------------------------------------
  describe('Storage initialisation', () => {
    it('should use MemoryPermissionStorage by default', async () => {
      const loader = new PermissionLoader(loaderConfig({
        permissions: [ACCOUNTS_PERM],
      }));
      const config = await loader.load('accounts');
      expect(config).toBeDefined();
      expect(config!.object).toBe('accounts');
    });

    it('should use custom storage when storageType is "custom"', async () => {
      const mockStorage: IPermissionStorage = {
        load: jest.fn(async () => ACCOUNTS_PERM),
        loadAll: jest.fn(async () => new Map([['accounts', ACCOUNTS_PERM]])),
        reload: jest.fn(),
      };

      const loader = new PermissionLoader(loaderConfig({
        storageType: 'custom',
        storage: mockStorage,
      }));

      const config = await loader.load('accounts');
      expect(config).toBeDefined();
      expect(mockStorage.load).toHaveBeenCalledWith('accounts');
    });

    it('should throw when custom storage is missing', () => {
      expect(
        () => new PermissionLoader(loaderConfig({ storageType: 'custom' }))
      ).toThrow('Custom storage implementation required');
    });

    it('should throw for redis storage when redisClientFactory missing', () => {
      expect(
        () => new PermissionLoader(loaderConfig({ storageType: 'redis' }))
      ).toThrow('redisClientFactory is required');
    });

    it('should throw for database storage when datasourceResolver missing', () => {
      expect(
        () => new PermissionLoader(loaderConfig({ storageType: 'database' }))
      ).toThrow('datasourceResolver is required');
    });

    it('should throw for unknown storage type', () => {
      expect(
        () => new PermissionLoader(loaderConfig({ storageType: 'ftp' as any }))
      ).toThrow('Unknown storage type');
    });
  });

  // ----------------------------------------------------------
  // Loading
  // ----------------------------------------------------------
  describe('Loading configs', () => {
    it('should return undefined for unknown objects', async () => {
      const loader = new PermissionLoader(loaderConfig());
      const config = await loader.load('nonexistent');
      expect(config).toBeUndefined();
    });

    it('should load all configs', async () => {
      const perm2: PermissionConfig = { name: 'contacts', object: 'contacts' };
      const loader = new PermissionLoader(loaderConfig({
        permissions: [ACCOUNTS_PERM, perm2],
      }));

      const all = await loader.loadAll();
      expect(all.size).toBe(2);
      expect(all.has('accounts')).toBe(true);
      expect(all.has('contacts')).toBe(true);
    });
  });

  // ----------------------------------------------------------
  // Pre-compilation
  // ----------------------------------------------------------
  describe('Pre-compilation', () => {
    it('should pre-compile rules on load when enabled', async () => {
      const loader = new PermissionLoader(loaderConfig({
        permissions: [ACCOUNTS_PERM],
        precompileRules: true,
      }));

      await loader.load('accounts');

      const rules = loader.getCompiledRules('accounts');
      expect(rules.length).toBeGreaterThan(0);
    });

    it('should not pre-compile rules when disabled', async () => {
      const loader = new PermissionLoader(loaderConfig({
        permissions: [ACCOUNTS_PERM],
        precompileRules: false,
      }));

      await loader.load('accounts');

      const rules = loader.getCompiledRules('accounts');
      expect(rules).toEqual([]);
    });

    it('should return empty array for objects without rules', async () => {
      const loader = new PermissionLoader(loaderConfig());
      const rules = loader.getCompiledRules('nonexistent');
      expect(rules).toEqual([]);
    });

    it('should compile object_permissions with bitmask', async () => {
      const loader = new PermissionLoader(loaderConfig({
        permissions: [ACCOUNTS_PERM],
      }));

      await loader.load('accounts');
      const rules = loader.getCompiledRules('accounts');

      const objRule = rules.find(r => r.ruleName === 'object_permissions');
      expect(objRule).toBeDefined();
      expect(objRule!.permissionBitmask).toBeGreaterThan(0);
      expect(objRule!.roleLookup.size).toBeGreaterThan(0);
    });

    it('should compile record_rules with evaluators', async () => {
      const loader = new PermissionLoader(loaderConfig({
        permissions: [ACCOUNTS_PERM],
      }));

      await loader.load('accounts');
      const rules = loader.getCompiledRules('accounts');

      const recordRule = rules.find(r => r.ruleName === 'owner_rule');
      expect(recordRule).toBeDefined();
      expect(recordRule!.evaluator).toBeDefined();
      expect(typeof recordRule!.evaluator).toBe('function');
    });

    it('should sort compiled rules by priority (descending)', async () => {
      const config: PermissionConfig = {
        name: 'test',
        object: 'test_obj',
        record_rules: [
          {
            name: 'low',
            condition: {},
            permissions: { read: true },
            priority: 1,
          },
          {
            name: 'high',
            condition: {},
            permissions: { read: true },
            priority: 100,
          },
          {
            name: 'medium',
            condition: {},
            permissions: { read: true },
            priority: 50,
          },
        ],
      };

      const loader = new PermissionLoader(loaderConfig({ permissions: [config] }));
      await loader.load('test_obj');
      const rules = loader.getCompiledRules('test_obj');

      // Filter out object_permissions if any
      const recordRules = rules.filter(r => r.ruleName !== 'object_permissions');
      expect(recordRules[0].ruleName).toBe('high');
      expect(recordRules[1].ruleName).toBe('medium');
      expect(recordRules[2].ruleName).toBe('low');
    });
  });

  // ----------------------------------------------------------
  // Condition compilation
  // ----------------------------------------------------------
  describe('Condition compilation — evaluators', () => {
    async function getEvaluator(condition: any): Promise<(ctx: any) => boolean> {
      const config: PermissionConfig = {
        name: 'test',
        object: 'test_obj',
        record_rules: [
          {
            name: 'test_rule',
            condition,
            permissions: { read: true },
          },
        ],
      };
      const loader = new PermissionLoader(loaderConfig({ permissions: [config] }));
      await loader.load('test_obj');
      const rules = loader.getCompiledRules('test_obj');
      const rule = rules.find(r => r.ruleName === 'test_rule');
      return rule!.evaluator!;
    }

    it('should handle null/undefined condition — always true', async () => {
      const evaluator = await getEvaluator(null);
      expect(evaluator({})).toBe(true);
    });

    // --- Simple conditions ---
    it('should handle simple "=" condition', async () => {
      const evaluator = await getEvaluator({
        type: 'simple',
        field: 'status',
        operator: '=',
        value: 'active',
      });
      expect(evaluator({ record: { status: 'active' } })).toBe(true);
      expect(evaluator({ record: { status: 'inactive' } })).toBe(false);
    });

    it('should handle simple condition without explicit type', async () => {
      const evaluator = await getEvaluator({
        field: 'status',
        operator: '=',
        value: 'active',
      });
      expect(evaluator({ record: { status: 'active' } })).toBe(true);
    });

    it('should resolve $current_user variables', async () => {
      const evaluator = await getEvaluator({
        type: 'simple',
        field: 'owner_id',
        operator: '=',
        value: '$current_user.id',
      });
      expect(
        evaluator({ record: { owner_id: 'u1' }, user: { id: 'u1' } })
      ).toBe(true);
      expect(
        evaluator({ record: { owner_id: 'u1' }, user: { id: 'u2' } })
      ).toBe(false);
    });

    it('should handle nested field paths', async () => {
      const evaluator = await getEvaluator({
        type: 'simple',
        field: 'meta.status',
        operator: '=',
        value: 'ok',
      });
      expect(evaluator({ record: { meta: { status: 'ok' } } })).toBe(true);
      expect(evaluator({ record: { meta: { status: 'fail' } } })).toBe(false);
      expect(evaluator({ record: {} })).toBe(false);
    });

    // --- Complex conditions ---
    it('should handle complex AND expression', async () => {
      const evaluator = await getEvaluator({
        type: 'complex',
        expression: [
          { field: 'status', operator: '=', value: 'active' },
          { field: 'priority', operator: '>', value: 5 },
          'and',
        ],
      });
      expect(evaluator({ record: { status: 'active', priority: 10 } })).toBe(true);
      expect(evaluator({ record: { status: 'active', priority: 3 } })).toBe(false);
    });

    it('should handle complex OR expression', async () => {
      const evaluator = await getEvaluator({
        type: 'complex',
        expression: [
          { field: 'status', operator: '=', value: 'active' },
          { field: 'status', operator: '=', value: 'pending' },
          'or',
        ],
      });
      expect(evaluator({ record: { status: 'active' } })).toBe(true);
      expect(evaluator({ record: { status: 'pending' } })).toBe(true);
      expect(evaluator({ record: { status: 'closed' } })).toBe(false);
    });

    // --- Formula conditions ---
    it('should handle formula conditions', async () => {
      const evaluator = await getEvaluator({
        type: 'formula',
        formula: 'record.status === "active"',
      });
      expect(evaluator({ record: { status: 'active' }, user: {} })).toBe(true);
      expect(evaluator({ record: { status: 'closed' }, user: {} })).toBe(false);
    });

    it('should handle formula errors gracefully (return false)', async () => {
      const evaluator = await getEvaluator({
        type: 'formula',
        formula: 'this.does.not.exist.at.all()',
      });
      expect(evaluator({ record: {}, user: {} })).toBe(false);
    });

    // --- Unknown condition type ---
    it('should return true for unknown condition types', async () => {
      const evaluator = await getEvaluator({ type: 'unknown_type' });
      expect(evaluator({})).toBe(true);
    });
  });

  // ----------------------------------------------------------
  // evaluateOperator — all 12 operators
  // ----------------------------------------------------------
  describe('evaluateOperator (via compiled evaluators)', () => {
    async function evalOp(
      fieldValue: any,
      operator: string,
      compareValue: any
    ): Promise<boolean> {
      const config: PermissionConfig = {
        name: 'test',
        object: 'test_obj',
        record_rules: [
          {
            name: 'op_rule',
            condition: {
              type: 'simple',
              field: 'f',
              operator,
              value: compareValue,
            },
            permissions: { read: true },
          },
        ],
      };
      const loader = new PermissionLoader(loaderConfig({ permissions: [config] }));
      await loader.load('test_obj');
      const rules = loader.getCompiledRules('test_obj');
      const evaluator = rules.find(r => r.ruleName === 'op_rule')!.evaluator!;
      return evaluator({ record: { f: fieldValue }, user: {} });
    }

    it('= operator', async () => {
      expect(await evalOp('a', '=', 'a')).toBe(true);
      expect(await evalOp('a', '=', 'b')).toBe(false);
    });

    it('!= operator', async () => {
      expect(await evalOp('a', '!=', 'b')).toBe(true);
      expect(await evalOp('a', '!=', 'a')).toBe(false);
    });

    it('> operator', async () => {
      expect(await evalOp(10, '>', 5)).toBe(true);
      expect(await evalOp(5, '>', 10)).toBe(false);
    });

    it('>= operator', async () => {
      expect(await evalOp(5, '>=', 5)).toBe(true);
      expect(await evalOp(4, '>=', 5)).toBe(false);
    });

    it('< operator', async () => {
      expect(await evalOp(3, '<', 5)).toBe(true);
      expect(await evalOp(5, '<', 3)).toBe(false);
    });

    it('<= operator', async () => {
      expect(await evalOp(5, '<=', 5)).toBe(true);
      expect(await evalOp(6, '<=', 5)).toBe(false);
    });

    it('in operator', async () => {
      expect(await evalOp('a', 'in', ['a', 'b', 'c'])).toBe(true);
      expect(await evalOp('d', 'in', ['a', 'b', 'c'])).toBe(false);
    });

    it('not_in operator', async () => {
      expect(await evalOp('d', 'not_in', ['a', 'b'])).toBe(true);
      expect(await evalOp('a', 'not_in', ['a', 'b'])).toBe(false);
    });

    it('contains operator', async () => {
      expect(await evalOp('hello world', 'contains', 'world')).toBe(true);
      expect(await evalOp('hello', 'contains', 'world')).toBe(false);
    });

    it('not_contains operator', async () => {
      expect(await evalOp('hello', 'not_contains', 'world')).toBe(true);
      expect(await evalOp('hello world', 'not_contains', 'world')).toBe(false);
    });

    it('starts_with operator', async () => {
      expect(await evalOp('hello world', 'starts_with', 'hello')).toBe(true);
      expect(await evalOp('hello', 'starts_with', 'world')).toBe(false);
    });

    it('ends_with operator', async () => {
      expect(await evalOp('hello world', 'ends_with', 'world')).toBe(true);
      expect(await evalOp('hello', 'ends_with', 'world')).toBe(false);
    });

    it('unknown operator should return false', async () => {
      expect(await evalOp('a', 'like', 'a')).toBe(false);
    });
  });

  // ----------------------------------------------------------
  // Reload
  // ----------------------------------------------------------
  describe('Reload', () => {
    it('should clear compiled rules and re-compile on reload', async () => {
      const mockStorage: IPermissionStorage = {
        load: jest.fn(async () => ACCOUNTS_PERM),
        loadAll: jest.fn(async () => new Map([['accounts', ACCOUNTS_PERM]])),
        reload: jest.fn(),
      };

      const loader = new PermissionLoader(loaderConfig({
        storageType: 'custom',
        storage: mockStorage,
      }));

      // First load
      await loader.load('accounts');
      expect(loader.getCompiledRules('accounts').length).toBeGreaterThan(0);

      // Reload
      await loader.reload();
      expect(mockStorage.reload).toHaveBeenCalled();
      // After reload, rules should be re-compiled
      expect(loader.getCompiledRules('accounts').length).toBeGreaterThan(0);
    });
  });

  // ----------------------------------------------------------
  // Record rule bitmask compilation
  // ----------------------------------------------------------
  describe('Record rule bitmask', () => {
    it('should set correct bitmask bits for record_rules permissions', async () => {
      const config: PermissionConfig = {
        name: 'test',
        object: 'test_obj',
        record_rules: [
          {
            name: 'read_only',
            condition: {},
            permissions: { read: true, update: false, delete: false },
          },
          {
            name: 'full_access',
            condition: {},
            permissions: { read: true, update: true, delete: true },
          },
        ],
      };

      const loader = new PermissionLoader(loaderConfig({ permissions: [config] }));
      await loader.load('test_obj');
      const rules = loader.getCompiledRules('test_obj');

      const readOnly = rules.find(r => r.ruleName === 'read_only');
      expect(readOnly!.permissionBitmask).toBe(0b001); // Only read

      const fullAccess = rules.find(r => r.ruleName === 'full_access');
      expect(fullAccess!.permissionBitmask).toBe(0b111); // read + update + delete
    });
  });
});
