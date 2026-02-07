/**
 * ObjectQL Security Plugin - Database Storage Backend Tests
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DatabasePermissionStorage } from '../src/storage-database';
import type { PermissionConfig, Driver } from '@objectql/types';
import type { SecurityPluginConfig } from '../src/types';

// Mock @objectstack/core
vi.mock('@objectstack/core', () => ({
  createLogger: vi.fn(() => ({
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
  })),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Simple in-memory mock Driver for testing */
function createMockDriver(): Driver & { _store: Map<string, any[]> } {
  const store = new Map<string, any[]>();
  let idCounter = 0;

  return {
    _store: store,

    async init(objects: any[]) {
      // Create "tables" for each object
      for (const obj of objects) {
        if (!store.has(obj.name)) {
          store.set(obj.name, []);
        }
      }
    },

    async create(objectName: string, doc: any, _options: any) {
      if (!store.has(objectName)) store.set(objectName, []);
      const record = { _id: String(++idCounter), ...doc };
      store.get(objectName)!.push(record);
      return record;
    },

    async update(objectName: string, id: any, doc: any, _options: any) {
      const rows = store.get(objectName) ?? [];
      const idx = rows.findIndex(r => r._id === id);
      if (idx >= 0) {
        rows[idx] = { ...rows[idx], ...doc };
        return rows[idx];
      }
      return null;
    },

    async delete(objectName: string, id: any, _options: any) {
      const rows = store.get(objectName) ?? [];
      const idx = rows.findIndex(r => r._id === id);
      if (idx >= 0) {
        rows.splice(idx, 1);
        return true;
      }
      return false;
    },

    async find(objectName: string, query: any) {
      let rows = store.get(objectName) ?? [];
      // Simple filter support for [field, op, value] arrays
      if (query?.filters && Array.isArray(query.filters)) {
        for (const f of query.filters) {
          if (Array.isArray(f) && f.length === 3) {
            const [field, op, value] = f;
            if (op === '=') {
              rows = rows.filter(r => r[field] === value);
            }
          }
        }
      }
      if (query?.top) {
        rows = rows.slice(0, query.top);
      }
      return rows;
    },

    async findOne(objectName: string, id: any) {
      const rows = store.get(objectName) ?? [];
      return rows.find(r => r._id === id) ?? null;
    },

    async count(objectName: string, _query: any, _options: any) {
      return (store.get(objectName) ?? []).length;
    },
  } as any;
}

const SAMPLE_PERM: PermissionConfig = {
  name: 'accounts_perms',
  object: 'accounts',
  object_permissions: {
    read: ['member', 'admin'],
    create: ['admin'],
    update: ['admin'],
    delete: ['admin'],
  },
};

const SAMPLE_PERM_2: PermissionConfig = {
  name: 'contacts_perms',
  object: 'contacts',
  object_permissions: {
    read: ['member'],
    create: ['member', 'admin'],
  },
};

function makeConfig(overrides: Partial<SecurityPluginConfig> = {}): SecurityPluginConfig {
  return {
    storageType: 'database',
    databaseConfig: { datasource: 'default' },
    permissions: [],
    ...overrides,
  } as SecurityPluginConfig;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('DatabasePermissionStorage', () => {
  let mockDriver: ReturnType<typeof createMockDriver>;
  const resolver = (_name: string) => mockDriver as any;

  beforeEach(() => {
    mockDriver = createMockDriver();
  });

  // ── Construction ────────────────────────────────────────────────────────

  describe('construction', () => {
    it('should throw if databaseConfig.datasource is missing', () => {
      expect(() => new DatabasePermissionStorage(
        makeConfig({ databaseConfig: undefined }),
        resolver,
      )).toThrow('databaseConfig.datasource is required');
    });

    it('should construct successfully with valid config', () => {
      const storage = new DatabasePermissionStorage(makeConfig(), resolver);
      expect(storage).toBeDefined();
    });

    it('should use default table name "objectql_permissions"', async () => {
      const storage = new DatabasePermissionStorage(
        makeConfig({ permissions: [SAMPLE_PERM] }),
        resolver,
      );

      await storage.loadAll();
      // The mock driver should have a table named 'objectql_permissions'
      expect(mockDriver._store.has('objectql_permissions')).toBe(true);
    });

    it('should use custom table name when provided', async () => {
      const storage = new DatabasePermissionStorage(
        makeConfig({
          databaseConfig: { datasource: 'default', table: 'custom_perms' },
          permissions: [SAMPLE_PERM],
        }),
        resolver,
      );

      await storage.loadAll();
      expect(mockDriver._store.has('custom_perms')).toBe(true);
    });
  });

  // ── Seeding ─────────────────────────────────────────────────────────────

  describe('initial seeding', () => {
    it('should seed initial permissions on first access', async () => {
      const storage = new DatabasePermissionStorage(
        makeConfig({ permissions: [SAMPLE_PERM, SAMPLE_PERM_2] }),
        resolver,
      );

      const result = await storage.loadAll();
      expect(result.size).toBe(2);
      expect(result.get('accounts')).toEqual(SAMPLE_PERM);
      expect(result.get('contacts')).toEqual(SAMPLE_PERM_2);
    });

    it('should NOT re-seed if table already has entries', async () => {
      // Pre-populate the mock driver
      mockDriver._store.set('objectql_permissions', [
        {
          _id: '999',
          object_name: 'existing',
          config: JSON.stringify({ name: 'existing_perms', object: 'existing' }),
          updated_at: new Date().toISOString(),
        },
      ]);

      const storage = new DatabasePermissionStorage(
        makeConfig({ permissions: [SAMPLE_PERM] }),
        resolver,
      );

      const result = await storage.loadAll();
      expect(result.size).toBe(1);
      expect(result.has('existing')).toBe(true);
      expect(result.has('accounts')).toBe(false);
    });
  });

  // ── CRUD ────────────────────────────────────────────────────────────────

  describe('load', () => {
    it('should return undefined for non-existent object', async () => {
      const storage = new DatabasePermissionStorage(makeConfig(), resolver);
      const result = await storage.load('nonexistent');
      expect(result).toBeUndefined();
    });

    it('should return permission config for existing object', async () => {
      const storage = new DatabasePermissionStorage(
        makeConfig({ permissions: [SAMPLE_PERM] }),
        resolver,
      );

      const result = await storage.load('accounts');
      expect(result).toEqual(SAMPLE_PERM);
    });
  });

  describe('loadAll', () => {
    it('should return empty map when no permissions exist', async () => {
      const storage = new DatabasePermissionStorage(makeConfig(), resolver);
      const result = await storage.loadAll();
      expect(result.size).toBe(0);
    });

    it('should return all seeded permissions', async () => {
      const storage = new DatabasePermissionStorage(
        makeConfig({ permissions: [SAMPLE_PERM, SAMPLE_PERM_2] }),
        resolver,
      );

      const result = await storage.loadAll();
      expect(result.size).toBe(2);
    });

    it('should skip rows with corrupt JSON', async () => {
      const storage = new DatabasePermissionStorage(
        makeConfig({ permissions: [SAMPLE_PERM] }),
        resolver,
      );

      // Force a corrupt row into the table
      await storage.loadAll(); // trigger init
      mockDriver._store.get('objectql_permissions')!.push({
        _id: '999',
        object_name: 'corrupt',
        config: '{invalid json',
        updated_at: new Date().toISOString(),
      });

      const result = await storage.loadAll();
      expect(result.size).toBe(1); // only the valid one
      expect(result.has('accounts')).toBe(true);
      expect(result.has('corrupt')).toBe(false);
    });
  });

  describe('save', () => {
    it('should store a new permission config', async () => {
      const storage = new DatabasePermissionStorage(makeConfig(), resolver);

      await storage.save(SAMPLE_PERM);

      const loaded = await storage.load('accounts');
      expect(loaded).toEqual(SAMPLE_PERM);
    });

    it('should update an existing permission config', async () => {
      const storage = new DatabasePermissionStorage(
        makeConfig({ permissions: [SAMPLE_PERM] }),
        resolver,
      );

      // Trigger initial load
      await storage.load('accounts');

      const updated: PermissionConfig = {
        ...SAMPLE_PERM,
        object_permissions: { read: ['everyone'] },
      };
      await storage.save(updated);

      const loaded = await storage.load('accounts');
      expect(loaded!.object_permissions!.read).toEqual(['everyone']);
    });
  });

  describe('remove', () => {
    it('should remove an existing permission config', async () => {
      const storage = new DatabasePermissionStorage(
        makeConfig({ permissions: [SAMPLE_PERM] }),
        resolver,
      );

      // Trigger initial load
      await storage.load('accounts');

      await storage.remove('accounts');

      const loaded = await storage.load('accounts');
      expect(loaded).toBeUndefined();
    });

    it('should be a no-op for non-existent object', async () => {
      const storage = new DatabasePermissionStorage(makeConfig(), resolver);
      await expect(storage.remove('nonexistent')).resolves.not.toThrow();
    });
  });

  describe('reload', () => {
    it('should clear all and re-seed from initial permissions', async () => {
      const storage = new DatabasePermissionStorage(
        makeConfig({ permissions: [SAMPLE_PERM] }),
        resolver,
      );

      // Save an extra config at runtime
      await storage.save(SAMPLE_PERM_2);
      expect((await storage.loadAll()).size).toBe(2);

      // Reload should restore to initial state
      await storage.reload();
      const result = await storage.loadAll();
      expect(result.size).toBe(1);
      expect(result.has('accounts')).toBe(true);
      expect(result.has('contacts')).toBe(false);
    });
  });
});
