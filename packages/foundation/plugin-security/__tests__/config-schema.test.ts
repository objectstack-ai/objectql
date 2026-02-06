/**
 * ObjectQL Security Plugin - Config Schema Tests
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  SecurityPluginConfigSchema,
  PermissionStorageTypeSchema,
  DatabaseConfigSchema,
} from '../src/config.schema';

describe('SecurityPluginConfigSchema', () => {
  // ----------------------------------------------------------
  // Defaults
  // ----------------------------------------------------------
  describe('Defaults', () => {
    it('should provide all defaults for an empty object', () => {
      const result = SecurityPluginConfigSchema.parse({});
      expect(result.enabled).toBe(true);
      expect(result.storageType).toBe('memory');
      expect(result.permissions).toEqual([]);
      expect(result.exemptObjects).toEqual([]);
      expect(result.enableRowLevelSecurity).toBe(true);
      expect(result.enableFieldLevelSecurity).toBe(true);
      expect(result.precompileRules).toBe(true);
      expect(result.enableCache).toBe(true);
      expect(result.cacheTTL).toBe(60000);
      expect(result.throwOnDenied).toBe(true);
      expect(result.enableAudit).toBe(false);
    });
  });

  // ----------------------------------------------------------
  // Field validation
  // ----------------------------------------------------------
  describe('Field validation', () => {
    it('should accept valid configuration', () => {
      const config = SecurityPluginConfigSchema.parse({
        enabled: false,
        storageType: 'custom',
        cacheTTL: 30000,
        throwOnDenied: false,
        enableAudit: true,
        exemptObjects: ['audit_logs'],
      });
      expect(config.enabled).toBe(false);
      expect(config.storageType).toBe('custom');
      expect(config.cacheTTL).toBe(30000);
      expect(config.throwOnDenied).toBe(false);
      expect(config.enableAudit).toBe(true);
      expect(config.exemptObjects).toEqual(['audit_logs']);
    });

    it('should reject non-positive cacheTTL', () => {
      expect(() =>
        SecurityPluginConfigSchema.parse({ cacheTTL: 0 })
      ).toThrow();

      expect(() =>
        SecurityPluginConfigSchema.parse({ cacheTTL: -100 })
      ).toThrow();
    });

    it('should accept database config', () => {
      const config = SecurityPluginConfigSchema.parse({
        storageType: 'database',
        databaseConfig: {
          datasource: 'postgres',
          table: 'permissions',
        },
      });
      expect(config.databaseConfig?.datasource).toBe('postgres');
    });
  });

  // ----------------------------------------------------------
  // PermissionStorageTypeSchema
  // ----------------------------------------------------------
  describe('PermissionStorageTypeSchema', () => {
    it('should accept valid storage types', () => {
      for (const type of ['memory', 'redis', 'database', 'custom']) {
        expect(PermissionStorageTypeSchema.parse(type)).toBe(type);
      }
    });

    it('should reject invalid storage types', () => {
      expect(() => PermissionStorageTypeSchema.parse('ftp')).toThrow();
    });
  });

  // ----------------------------------------------------------
  // DatabaseConfigSchema
  // ----------------------------------------------------------
  describe('DatabaseConfigSchema', () => {
    it('should accept valid database config', () => {
      const result = DatabaseConfigSchema.parse({
        datasource: 'postgres',
        table: 'permissions',
      });
      expect(result.datasource).toBe('postgres');
      expect(result.table).toBe('permissions');
    });

    it('should accept config without optional table', () => {
      const result = DatabaseConfigSchema.parse({ datasource: 'mysql' });
      expect(result.datasource).toBe('mysql');
      expect(result.table).toBeUndefined();
    });

    it('should reject config without datasource', () => {
      expect(() => DatabaseConfigSchema.parse({})).toThrow();
    });
  });
});
