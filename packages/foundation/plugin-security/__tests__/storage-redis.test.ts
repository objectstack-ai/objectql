/**
 * ObjectQL Security Plugin - Redis Storage Backend Tests
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RedisPermissionStorage, type RedisClient } from '../src/storage-redis';
import type { PermissionConfig } from '@objectql/types';
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

/** In-memory Redis mock */
function createMockRedisClient(): RedisClient {
  const store = new Map<string, string>();
  const sets = new Map<string, Set<string>>();

  return {
    async get(key: string) {
      return store.get(key) ?? null;
    },
    async set(key: string, value: string) {
      store.set(key, value);
      return 'OK';
    },
    async del(key: string | string[]) {
      const keys = Array.isArray(key) ? key : [key];
      let count = 0;
      for (const k of keys) {
        if (store.delete(k)) count++;
      }
      return count;
    },
    async keys(pattern: string) {
      const prefix = pattern.replace('*', '');
      return [...store.keys()].filter(k => k.startsWith(prefix));
    },
    async sadd(key: string, ...members: string[]) {
      if (!sets.has(key)) sets.set(key, new Set());
      const s = sets.get(key)!;
      let added = 0;
      for (const m of members) {
        if (!s.has(m)) { s.add(m); added++; }
      }
      return added;
    },
    async smembers(key: string) {
      return [...(sets.get(key) ?? [])];
    },
    async srem(key: string, ...members: string[]) {
      const s = sets.get(key);
      if (!s) return 0;
      let removed = 0;
      for (const m of members) {
        if (s.delete(m)) removed++;
      }
      return removed;
    },
  };
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
    storageType: 'redis',
    redisUrl: 'redis://localhost:6379',
    permissions: [],
    ...overrides,
  } as SecurityPluginConfig;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('RedisPermissionStorage', () => {
  let mockClient: RedisClient;
  const clientFactory = (url: string) => {
    expect(url).toBe('redis://localhost:6379');
    return mockClient;
  };

  beforeEach(() => {
    mockClient = createMockRedisClient();
  });

  // ── Construction ────────────────────────────────────────────────────────

  describe('construction', () => {
    it('should throw if redisUrl is missing', () => {
      expect(() => new RedisPermissionStorage(
        makeConfig({ redisUrl: undefined }),
        clientFactory,
      )).toThrow('redisUrl is required');
    });

    it('should construct successfully with valid config', () => {
      const storage = new RedisPermissionStorage(
        makeConfig({ redisUrl: 'redis://localhost:6379' }),
        clientFactory,
      );
      expect(storage).toBeDefined();
    });
  });

  // ── Seeding ─────────────────────────────────────────────────────────────

  describe('initial seeding', () => {
    it('should seed initial permissions on first access when index is empty', async () => {
      const storage = new RedisPermissionStorage(
        makeConfig({ permissions: [SAMPLE_PERM, SAMPLE_PERM_2] }),
        clientFactory,
      );

      const result = await storage.loadAll();
      expect(result.size).toBe(2);
      expect(result.get('accounts')).toEqual(SAMPLE_PERM);
      expect(result.get('contacts')).toEqual(SAMPLE_PERM_2);
    });

    it('should NOT re-seed if index already has entries', async () => {
      // Pre-populate the mock with different data
      await mockClient.sadd('objectql:permissions:__index__', 'existing');
      await mockClient.set('objectql:permissions:existing', JSON.stringify({
        name: 'existing_perms',
        object: 'existing',
      }));

      const storage = new RedisPermissionStorage(
        makeConfig({ permissions: [SAMPLE_PERM] }),
        clientFactory,
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
      const storage = new RedisPermissionStorage(makeConfig(), clientFactory);
      const result = await storage.load('nonexistent');
      expect(result).toBeUndefined();
    });

    it('should return permission config for existing object', async () => {
      const storage = new RedisPermissionStorage(
        makeConfig({ permissions: [SAMPLE_PERM] }),
        clientFactory,
      );

      const result = await storage.load('accounts');
      expect(result).toEqual(SAMPLE_PERM);
    });
  });

  describe('loadAll', () => {
    it('should return empty map when no permissions exist', async () => {
      const storage = new RedisPermissionStorage(makeConfig(), clientFactory);
      const result = await storage.loadAll();
      expect(result.size).toBe(0);
    });

    it('should return all seeded permissions', async () => {
      const storage = new RedisPermissionStorage(
        makeConfig({ permissions: [SAMPLE_PERM, SAMPLE_PERM_2] }),
        clientFactory,
      );

      const result = await storage.loadAll();
      expect(result.size).toBe(2);
    });
  });

  describe('save', () => {
    it('should store a new permission config', async () => {
      const storage = new RedisPermissionStorage(makeConfig(), clientFactory);

      await storage.save(SAMPLE_PERM);

      const loaded = await storage.load('accounts');
      expect(loaded).toEqual(SAMPLE_PERM);
    });

    it('should overwrite an existing permission config', async () => {
      const storage = new RedisPermissionStorage(
        makeConfig({ permissions: [SAMPLE_PERM] }),
        clientFactory,
      );

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
      const storage = new RedisPermissionStorage(
        makeConfig({ permissions: [SAMPLE_PERM] }),
        clientFactory,
      );

      await storage.remove('accounts');

      const loaded = await storage.load('accounts');
      expect(loaded).toBeUndefined();
    });

    it('should be a no-op for non-existent object', async () => {
      const storage = new RedisPermissionStorage(makeConfig(), clientFactory);
      await expect(storage.remove('nonexistent')).resolves.not.toThrow();
    });
  });

  describe('reload', () => {
    it('should clear all and re-seed from initial permissions', async () => {
      const storage = new RedisPermissionStorage(
        makeConfig({ permissions: [SAMPLE_PERM] }),
        clientFactory,
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
