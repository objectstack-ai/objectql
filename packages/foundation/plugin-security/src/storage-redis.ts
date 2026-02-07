/**
 * ObjectQL Security Plugin - Redis Permission Storage Backend
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Stores and retrieves RBAC permission configurations from a Redis instance.
 * Uses a hash-per-object pattern for efficient lookups.
 *
 * Key layout:
 *   objectql:permissions:<objectName>  →  JSON(PermissionConfig)
 *   objectql:permissions:__index__     →  Set of all object names
 */

import { ApiErrorCode, ObjectQLError, type PermissionConfig } from '@objectql/types';
import type { IPermissionStorage, SecurityPluginConfig } from './types';

/**
 * Minimal Redis client interface
 *
 * Accepts any client that implements these methods (e.g. `ioredis`, `redis`, `@upstash/redis`).
 * This keeps the plugin free of hard Redis driver dependencies.
 */
export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<unknown>;
  del(key: string | string[]): Promise<unknown>;
  keys(pattern: string): Promise<string[]>;
  sadd(key: string, ...members: string[]): Promise<unknown>;
  smembers(key: string): Promise<string[]>;
  srem(key: string, ...members: string[]): Promise<unknown>;
}

/**
 * Factory function type for creating a Redis client from a connection URL.
 * Users must provide this because the security plugin does NOT bundle a Redis driver.
 */
export type RedisClientFactory = (url: string) => RedisClient | Promise<RedisClient>;

const KEY_PREFIX = 'objectql:permissions:';
const INDEX_KEY = `${KEY_PREFIX}__index__`;

/**
 * Redis-backed permission storage
 *
 * @example
 * ```ts
 * import Redis from 'ioredis';
 * const storage = new RedisPermissionStorage({
 *   storageType: 'redis',
 *   redisUrl: 'redis://localhost:6379',
 * }, (url) => new Redis(url));
 * ```
 */
export class RedisPermissionStorage implements IPermissionStorage {
  private client: RedisClient | undefined;
  private readonly redisUrl: string;
  private readonly clientFactory: RedisClientFactory;
  private readonly initialPermissions: PermissionConfig[];

  constructor(config: SecurityPluginConfig, clientFactory: RedisClientFactory) {
    if (!config.redisUrl) {
      throw new ObjectQLError({
        code: ApiErrorCode.INVALID_REQUEST,
        message: 'redisUrl is required for Redis permission storage',
      });
    }
    this.redisUrl = config.redisUrl;
    this.clientFactory = clientFactory;
    this.initialPermissions = config.permissions ?? [];
  }

  /**
   * Lazily connect to Redis on first access
   */
  private async getClient(): Promise<RedisClient> {
    if (!this.client) {
      this.client = await this.clientFactory(this.redisUrl);
      // Seed initial permissions if the index is empty
      const existing = await this.client.smembers(INDEX_KEY);
      if (existing.length === 0 && this.initialPermissions.length > 0) {
        for (const perm of this.initialPermissions) {
          await this.client.set(`${KEY_PREFIX}${perm.object}`, JSON.stringify(perm));
          await this.client.sadd(INDEX_KEY, perm.object);
        }
      }
    }
    return this.client;
  }

  async load(objectName: string): Promise<PermissionConfig | undefined> {
    const client = await this.getClient();
    const raw = await client.get(`${KEY_PREFIX}${objectName}`);
    if (!raw) return undefined;
    return JSON.parse(raw) as PermissionConfig;
  }

  async loadAll(): Promise<Map<string, PermissionConfig>> {
    const client = await this.getClient();
    const names = await client.smembers(INDEX_KEY);
    const result = new Map<string, PermissionConfig>();
    for (const name of names) {
      const raw = await client.get(`${KEY_PREFIX}${name}`);
      if (raw) {
        result.set(name, JSON.parse(raw) as PermissionConfig);
      }
    }
    return result;
  }

  async reload(): Promise<void> {
    // Re-seed from initial permissions (full overwrite)
    const client = await this.getClient();
    const existing = await client.smembers(INDEX_KEY);
    // Clear existing keys
    if (existing.length > 0) {
      const keys = existing.map(n => `${KEY_PREFIX}${n}`);
      await client.del(keys);
      for (const name of existing) {
        await client.srem(INDEX_KEY, name);
      }
    }
    // Re-seed
    for (const perm of this.initialPermissions) {
      await client.set(`${KEY_PREFIX}${perm.object}`, JSON.stringify(perm));
      await client.sadd(INDEX_KEY, perm.object);
    }
  }

  // --- Write helpers (for runtime management) ---

  /**
   * Store or update a permission configuration
   */
  async save(config: PermissionConfig): Promise<void> {
    const client = await this.getClient();
    await client.set(`${KEY_PREFIX}${config.object}`, JSON.stringify(config));
    await client.sadd(INDEX_KEY, config.object);
  }

  /**
   * Remove a permission configuration
   */
  async remove(objectName: string): Promise<void> {
    const client = await this.getClient();
    await client.del(`${KEY_PREFIX}${objectName}`);
    await client.srem(INDEX_KEY, objectName);
  }
}
