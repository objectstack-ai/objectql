/**
 * ObjectQL Security Plugin - Field Masker Tests
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { FieldMasker } from '../src/field-masker';
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

function userCtx(roles: string[] = ['member']): SecurityContext {
  return {
    user: { id: 'user1', roles },
    objectName: 'accounts',
    operation: 'read',
  };
}

describe('FieldMasker', () => {
  // ----------------------------------------------------------
  // No configuration
  // ----------------------------------------------------------
  describe('No configuration', () => {
    it('should return records unmodified when no config exists', async () => {
      const masker = new FieldMasker(createMockLoader());
      const records = [{ id: 1, name: 'Acme', salary: 100000 }];
      const result = await masker.applyFieldLevelSecurity('accounts', records, userCtx());
      expect(result).toEqual(records);
    });
  });

  // ----------------------------------------------------------
  // No user context
  // ----------------------------------------------------------
  describe('No user context', () => {
    it('should remove all restricted fields when no user is provided', async () => {
      const config: PermissionConfig = {
        name: 'accounts_perms',
        object: 'accounts',
        field_permissions: {
          salary: { read: ['hr'] },
        },
        field_masking: {
          ssn: { mask_format: '****', visible_to: ['admin'] },
        },
      };

      const masker = new FieldMasker(createMockLoader({ accounts: config }));
      const records = [{ id: 1, name: 'Alice', salary: 100000, ssn: '123-45-6789' }];
      const result = await masker.applyFieldLevelSecurity(
        'accounts',
        records,
        { user: undefined, objectName: 'accounts', operation: 'read' } as any
      );

      expect(result[0]).toEqual({ id: 1, name: 'Alice' });
      expect(result[0]).not.toHaveProperty('salary');
      expect(result[0]).not.toHaveProperty('ssn');
    });
  });

  // ----------------------------------------------------------
  // Field permissions
  // ----------------------------------------------------------
  describe('Field permissions', () => {
    const config: PermissionConfig = {
      name: 'accounts_perms',
      object: 'accounts',
      field_permissions: {
        salary: { read: ['hr', 'admin'], update: ['admin'] },
        ssn: { read: ['admin'] },
      },
    };

    it('should keep fields when user has read access', async () => {
      const masker = new FieldMasker(createMockLoader({ accounts: config }));
      const records = [{ id: 1, salary: 100000, ssn: '123' }];
      const result = await masker.applyFieldLevelSecurity(
        'accounts', records, userCtx(['hr'])
      );
      expect(result[0].salary).toBe(100000);
      expect(result[0]).not.toHaveProperty('ssn'); // hr cannot see ssn
    });

    it('should remove fields when user lacks read access', async () => {
      const masker = new FieldMasker(createMockLoader({ accounts: config }));
      const records = [{ id: 1, salary: 100000, ssn: '123' }];
      const result = await masker.applyFieldLevelSecurity(
        'accounts', records, userCtx(['member'])
      );
      expect(result[0]).not.toHaveProperty('salary');
      expect(result[0]).not.toHaveProperty('ssn');
    });

    it('should admin see all restricted fields', async () => {
      const masker = new FieldMasker(createMockLoader({ accounts: config }));
      const records = [{ id: 1, salary: 100000, ssn: '123' }];
      const result = await masker.applyFieldLevelSecurity(
        'accounts', records, userCtx(['admin'])
      );
      expect(result[0].salary).toBe(100000);
      expect(result[0].ssn).toBe('123');
    });
  });

  // ----------------------------------------------------------
  // Field masking
  // ----------------------------------------------------------
  describe('Field masking', () => {
    it('should mask values for users not in visible_to', async () => {
      const config: PermissionConfig = {
        name: 'accounts_perms',
        object: 'accounts',
        field_masking: {
          ssn: { mask_format: '****', visible_to: ['admin'] },
        },
      };
      const masker = new FieldMasker(createMockLoader({ accounts: config }));
      const records = [{ id: 1, ssn: '123-45-6789' }];
      const result = await masker.applyFieldLevelSecurity(
        'accounts', records, userCtx(['member'])
      );
      // '****' format → replaced with asterisks (max 8)
      expect(result[0].ssn).toMatch(/^\*+$/);
    });

    it('should NOT mask values for users in visible_to', async () => {
      const config: PermissionConfig = {
        name: 'accounts_perms',
        object: 'accounts',
        field_masking: {
          ssn: { mask_format: '****', visible_to: ['admin'] },
        },
      };
      const masker = new FieldMasker(createMockLoader({ accounts: config }));
      const records = [{ id: 1, ssn: '123-45-6789' }];
      const result = await masker.applyFieldLevelSecurity(
        'accounts', records, userCtx(['admin'])
      );
      expect(result[0].ssn).toBe('123-45-6789');
    });

    it('should only mask on read, not on update', async () => {
      const config: PermissionConfig = {
        name: 'accounts_perms',
        object: 'accounts',
        field_masking: {
          ssn: { mask_format: '****', visible_to: ['admin'] },
        },
      };
      const masker = new FieldMasker(createMockLoader({ accounts: config }));
      const records = [{ id: 1, ssn: '123-45-6789' }];
      const result = await masker.applyFieldLevelSecurity(
        'accounts', records, userCtx(['member']), 'update'
      );
      // Masking only applies on read, not update
      expect(result[0].ssn).toBe('123-45-6789');
    });

    it('should skip masking for fields already removed by field_permissions', async () => {
      const config: PermissionConfig = {
        name: 'accounts_perms',
        object: 'accounts',
        field_permissions: {
          ssn: { read: ['admin'] },
        },
        field_masking: {
          ssn: { mask_format: '****', visible_to: ['admin'] },
        },
      };
      const masker = new FieldMasker(createMockLoader({ accounts: config }));
      const records = [{ id: 1, ssn: '123-45-6789' }];
      const result = await masker.applyFieldLevelSecurity(
        'accounts', records, userCtx(['member'])
      );
      // Field removed by permissions, masking skipped
      expect(result[0]).not.toHaveProperty('ssn');
    });
  });

  // ----------------------------------------------------------
  // maskValue formats
  // ----------------------------------------------------------
  describe('Mask value formats', () => {
    // We test masking indirectly through applyFieldLevelSecurity
    function maskTest(
      value: any,
      maskFormat: string
    ): Promise<any> {
      const config: PermissionConfig = {
        name: 'test',
        object: 'test_obj',
        field_masking: {
          field1: { mask_format: maskFormat, visible_to: ['admin'] },
        },
      };
      const masker = new FieldMasker(createMockLoader({ test_obj: config }));
      return masker.applyFieldLevelSecurity(
        'test_obj',
        [{ field1: value }],
        userCtx(['member'])
      ).then(r => r[0].field1);
    }

    it('should handle "****" — full asterisk replacement', async () => {
      const result = await maskTest('sensitive', '****');
      expect(result).toMatch(/^\*+$/);
      expect(result.length).toBeLessThanOrEqual(8); // min(length, 8)
    });

    it('should handle "***" — full asterisk replacement', async () => {
      const result = await maskTest('short', '***');
      expect(result).toMatch(/^\*+$/);
    });

    it('should handle null/undefined gracefully', async () => {
      const r1 = await maskTest(null, '****');
      expect(r1).toBeNull();

      const r2 = await maskTest(undefined, '****');
      expect(r2).toBeUndefined();
    });

    it('should handle {lastN} — show last N characters', async () => {
      const result = await maskTest('1234567890', '{last4}');
      expect(result).toContain('7890');
    });

    it('should handle {firstN} — show first N characters', async () => {
      const result = await maskTest('1234567890', '{first3}');
      expect(result).toContain('123');
    });

    it('should not mask short values for lastN pattern', async () => {
      const result = await maskTest('ab', '{last4}');
      expect(result).toBe('ab'); // Too short → return as-is
    });

    it('should handle email masking format', async () => {
      const result = await maskTest('alice@example.com', '***@***.***');
      // Should mask parts of the email
      expect(result).toContain('@');
      expect(result).not.toBe('alice@example.com');
    });

    it('should handle credit-card dash format', async () => {
      const result = await maskTest('4111111111111234', '****-****-****-{last4}');
      expect(result).toContain('-');
      expect(result).toContain('1234');
    });

    it('should default to first+last char for unrecognized formats', async () => {
      const result = await maskTest('hello', 'unknown_format');
      // Default: first char + asterisks + last char
      expect(result[0]).toBe('h');
      expect(result[result.length - 1]).toBe('o');
      expect(result.length).toBe(5);
    });

    it('should mask very short strings (≤2 chars) with all asterisks by default', async () => {
      const result = await maskTest('ab', 'unknown_format');
      expect(result).toBe('**');
    });
  });

  // ----------------------------------------------------------
  // applyToRecord — single record wrapper
  // ----------------------------------------------------------
  describe('applyToRecord', () => {
    it('should process a single record', async () => {
      const config: PermissionConfig = {
        name: 'test',
        object: 'test_obj',
        field_permissions: {
          secret: { read: ['admin'] },
        },
      };
      const masker = new FieldMasker(createMockLoader({ test_obj: config }));
      const record = { id: 1, name: 'Test', secret: 'hidden' };
      const result = await masker.applyToRecord('test_obj', record, userCtx(['member']));
      expect(result).not.toHaveProperty('secret');
      expect(result.name).toBe('Test');
    });
  });

  // ----------------------------------------------------------
  // getAccessibleFields
  // ----------------------------------------------------------
  describe('getAccessibleFields', () => {
    it('should return empty array when no config', async () => {
      const masker = new FieldMasker(createMockLoader());
      const result = await masker.getAccessibleFields('accounts', ['member']);
      expect(result).toEqual([]);
    });

    it('should return fields accessible to role', async () => {
      const config: PermissionConfig = {
        name: 'test',
        object: 'test_obj',
        field_permissions: {
          salary: { read: ['hr', 'admin'] },
          ssn: { read: ['admin'] },
          name: { read: ['member', 'admin'] },
        },
      };
      const masker = new FieldMasker(createMockLoader({ test_obj: config }));
      const result = await masker.getAccessibleFields('test_obj', ['hr']);
      expect(result).toEqual(['salary']);
    });
  });

  // ----------------------------------------------------------
  // canAccessField
  // ----------------------------------------------------------
  describe('canAccessField', () => {
    const config: PermissionConfig = {
      name: 'test',
      object: 'test_obj',
      field_permissions: {
        salary: { read: ['hr', 'admin'] },
      },
    };

    it('should return true when no config', async () => {
      const masker = new FieldMasker(createMockLoader());
      const result = await masker.canAccessField('test_obj', 'salary', ['member']);
      expect(result).toBe(true);
    });

    it('should return true when field has no restrictions', async () => {
      const masker = new FieldMasker(createMockLoader({ test_obj: config }));
      const result = await masker.canAccessField('test_obj', 'name', ['member']);
      expect(result).toBe(true);
    });

    it('should return true when role matches', async () => {
      const masker = new FieldMasker(createMockLoader({ test_obj: config }));
      const result = await masker.canAccessField('test_obj', 'salary', ['hr']);
      expect(result).toBe(true);
    });

    it('should return false when role does not match', async () => {
      const masker = new FieldMasker(createMockLoader({ test_obj: config }));
      const result = await masker.canAccessField('test_obj', 'salary', ['member']);
      expect(result).toBe(false);
    });
  });

  // ----------------------------------------------------------
  // Multiple records
  // ----------------------------------------------------------
  describe('Multiple records', () => {
    it('should process all records in a batch', async () => {
      const config: PermissionConfig = {
        name: 'test',
        object: 'test_obj',
        field_permissions: {
          secret: { read: ['admin'] },
        },
      };
      const masker = new FieldMasker(createMockLoader({ test_obj: config }));
      const records = [
        { id: 1, name: 'A', secret: 's1' },
        { id: 2, name: 'B', secret: 's2' },
        { id: 3, name: 'C', secret: 's3' },
      ];
      const result = await masker.applyFieldLevelSecurity(
        'test_obj', records, userCtx(['member'])
      );
      expect(result).toHaveLength(3);
      result.forEach(r => {
        expect(r).not.toHaveProperty('secret');
        expect(r).toHaveProperty('name');
      });
    });
  });
});
