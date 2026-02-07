/**
 * ObjectQL Security Plugin - Database Permission Storage Backend
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Stores and retrieves RBAC permission configurations from a relational
 * (or document) database using the ObjectQL Driver interface.
 *
 * Schema (auto-created via driver.init when supported):
 *   Table: objectql_permissions (configurable)
 *   Columns:
 *     - object_name  TEXT  PRIMARY KEY
 *     - config       TEXT  (JSON-serialized PermissionConfig)
 *     - updated_at   TEXT  (ISO 8601 timestamp)
 */

import { ApiErrorCode, ObjectQLError, type PermissionConfig, type Driver } from '@objectql/types';
import type { IPermissionStorage, SecurityPluginConfig } from './types';

/** Default table name for storing permission metadata */
const DEFAULT_TABLE = 'objectql_permissions';

/**
 * Resolver function that locates a Driver instance by datasource name.
 * Typically wired from the ObjectQL application layer.
 */
export type DatasourceResolver = (name: string) => Driver;

/**
 * Database-backed permission storage
 *
 * Works with any ObjectQL Driver (SQL, Mongo, Memory, etc.).
 * The driver is resolved lazily via a `DatasourceResolver` so that
 * this module has zero coupling to specific driver packages.
 *
 * @example
 * ```ts
 * const storage = new DatabasePermissionStorage(
 *   { storageType: 'database', databaseConfig: { datasource: 'default' } },
 *   (name) => app.datasource(name),
 * );
 * ```
 */
export class DatabasePermissionStorage implements IPermissionStorage {
  private readonly datasourceName: string;
  private readonly tableName: string;
  private readonly resolver: DatasourceResolver;
  private readonly initialPermissions: PermissionConfig[];
  private initialized = false;

  constructor(config: SecurityPluginConfig, resolver: DatasourceResolver) {
    if (!config.databaseConfig?.datasource) {
      throw new ObjectQLError({
        code: ApiErrorCode.INVALID_REQUEST,
        message: 'databaseConfig.datasource is required for database permission storage',
      });
    }
    this.datasourceName = config.databaseConfig.datasource;
    this.tableName = config.databaseConfig.table ?? DEFAULT_TABLE;
    this.resolver = resolver;
    this.initialPermissions = config.permissions ?? [];
  }

  /**
   * Get the driver and ensure the permissions table exists
   */
  private async getDriver(): Promise<Driver> {
    const driver = this.resolver(this.datasourceName);
    if (!this.initialized) {
      await this.ensureTable(driver);
      this.initialized = true;
    }
    return driver;
  }

  /**
   * Bootstrap the permissions table if it doesn't exist.
   * Uses driver.init() with a synthetic object schema when supported.
   */
  private async ensureTable(driver: Driver): Promise<void> {
    // Register a synthetic object schema so the driver can create the table
    if (driver.init) {
      await driver.init([
        {
          name: this.tableName,
          fields: {
            object_name: { name: 'object_name', type: 'text', required: true },
            config: { name: 'config', type: 'text', required: true },
            updated_at: { name: 'updated_at', type: 'text' },
          },
        },
      ]);
    }

    // Seed initial permissions if the table is empty
    try {
      const count = await driver.count(this.tableName, {}, {});
      if (count === 0 && this.initialPermissions.length > 0) {
        for (const perm of this.initialPermissions) {
          await driver.create(this.tableName, {
            object_name: perm.object,
            config: JSON.stringify(perm),
            updated_at: new Date().toISOString(),
          }, {});
        }
      }
    } catch {
      // Table may not exist yet in some drivers — that's fine, we tried
    }
  }

  async load(objectName: string): Promise<PermissionConfig | undefined> {
    const driver = await this.getDriver();
    try {
      const rows = await driver.find(this.tableName, {
        filters: [['object_name', '=', objectName]],
        top: 1,
      });
      const row = Array.isArray(rows) ? rows[0] : undefined;
      if (!row) return undefined;
      return JSON.parse(row.config) as PermissionConfig;
    } catch {
      return undefined;
    }
  }

  async loadAll(): Promise<Map<string, PermissionConfig>> {
    const driver = await this.getDriver();
    const result = new Map<string, PermissionConfig>();
    try {
      const rows = await driver.find(this.tableName, {});
      const items = Array.isArray(rows) ? rows : [];
      for (const row of items) {
        try {
          const config = JSON.parse(row.config) as PermissionConfig;
          result.set(row.object_name, config);
        } catch {
          // Skip rows with corrupt JSON
        }
      }
    } catch {
      // Table may not exist yet
    }
    return result;
  }

  async reload(): Promise<void> {
    const driver = await this.getDriver();
    // Delete all existing rows
    try {
      const rows = await driver.find(this.tableName, {});
      // Create a shallow copy to avoid issues when deleting during iteration
      const items = Array.isArray(rows) ? [...rows] : [];
      for (const row of items) {
        if (row._id || row.id || row.object_name) {
          await driver.delete(this.tableName, row._id ?? row.id ?? row.object_name, {});
        }
      }
    } catch {
      // Best-effort cleanup
    }
    // Re-seed
    for (const perm of this.initialPermissions) {
      await driver.create(this.tableName, {
        object_name: perm.object,
        config: JSON.stringify(perm),
        updated_at: new Date().toISOString(),
      }, {});
    }
  }

  // --- Write helpers (for runtime management) ---

  /**
   * Store or update a permission configuration
   */
  async save(config: PermissionConfig): Promise<void> {
    const driver = await this.getDriver();
    const existing = await this.load(config.object);
    if (existing) {
      // Update existing row — find by object_name
      const rows = await driver.find(this.tableName, {
        filters: [['object_name', '=', config.object]],
        top: 1,
      });
      const row = Array.isArray(rows) ? rows[0] : undefined;
      if (row) {
        const id = row._id ?? row.id ?? row.object_name;
        await driver.update(this.tableName, id, {
          config: JSON.stringify(config),
          updated_at: new Date().toISOString(),
        }, {});
      }
    } else {
      await driver.create(this.tableName, {
        object_name: config.object,
        config: JSON.stringify(config),
        updated_at: new Date().toISOString(),
      }, {});
    }
  }

  /**
   * Remove a permission configuration
   */
  async remove(objectName: string): Promise<void> {
    const driver = await this.getDriver();
    try {
      const rows = await driver.find(this.tableName, {
        filters: [['object_name', '=', objectName]],
        top: 1,
      });
      const row = Array.isArray(rows) ? rows[0] : undefined;
      if (row) {
        const id = row._id ?? row.id ?? row.object_name;
        await driver.delete(this.tableName, id, {});
      }
    } catch {
      // Row may not exist
    }
  }
}
