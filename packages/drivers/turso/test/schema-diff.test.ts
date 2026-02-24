/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect } from 'vitest';
import { diffSchema, generateMigration, type ObjectSchema } from '../src/schema-diff';
import type { IntrospectedSchema } from '@objectql/types';

// ============================================================================
// Helper: Build an introspected schema from simple declarations
// ============================================================================

function introspected(tables: Record<string, string[]>): IntrospectedSchema {
    const result: IntrospectedSchema = { tables: {} };
    for (const [name, cols] of Object.entries(tables)) {
        result.tables[name] = {
            name,
            columns: cols.map(c => ({
                name: c,
                type: c === 'id' ? 'TEXT' : 'TEXT',
                nullable: c !== 'id',
                isPrimary: c === 'id',
            })),
            foreignKeys: [],
            primaryKeys: ['id'],
        };
    }
    return result;
}

// ============================================================================
// diffSchema Tests
// ============================================================================

describe('diffSchema', () => {
    it('should detect a new table', () => {
        const desired: ObjectSchema[] = [{
            name: 'users',
            fields: { email: { type: 'text' }, age: { type: 'integer' } },
        }];
        const live = introspected({});

        const diff = diffSchema(desired, live);
        expect(diff.actions).toHaveLength(1);
        expect(diff.actions[0].type).toBe('create_table');
        if (diff.actions[0].type === 'create_table') {
            expect(diff.actions[0].table).toBe('users');
            expect(diff.actions[0].columns).toHaveLength(3); // id + email + age
        }
    });

    it('should detect new columns in existing table', () => {
        const desired: ObjectSchema[] = [{
            name: 'users',
            fields: { email: { type: 'text' }, age: { type: 'integer' } },
        }];
        const live = introspected({ users: ['id', 'email'] }); // age is missing

        const diff = diffSchema(desired, live);
        expect(diff.actions).toHaveLength(1);
        expect(diff.actions[0].type).toBe('add_column');
        if (diff.actions[0].type === 'add_column') {
            expect(diff.actions[0].table).toBe('users');
            expect(diff.actions[0].column.name).toBe('age');
            expect(diff.actions[0].column.sqlType).toBe('INTEGER');
        }
    });

    it('should detect dropped tables (in live but not in desired)', () => {
        const desired: ObjectSchema[] = [];
        const live = introspected({ old_table: ['id', 'data'] });

        const diff = diffSchema(desired, live);
        expect(diff.actions).toHaveLength(1);
        expect(diff.actions[0].type).toBe('drop_table');
        if (diff.actions[0].type === 'drop_table') {
            expect(diff.actions[0].table).toBe('old_table');
        }
    });

    it('should produce no actions when schema is in sync', () => {
        const desired: ObjectSchema[] = [{
            name: 'users',
            fields: { email: { type: 'text' } },
        }];
        const live = introspected({ users: ['id', 'email'] });

        const diff = diffSchema(desired, live);
        expect(diff.actions).toHaveLength(0);
        expect(diff.summary[0]).toContain('up to date');
    });

    it('should handle multiple tables and changes', () => {
        const desired: ObjectSchema[] = [
            {
                name: 'users',
                fields: { email: { type: 'text' }, phone: { type: 'text' } },
            },
            {
                name: 'tasks',
                fields: { title: { type: 'text' }, done: { type: 'boolean' } },
            },
        ];
        const live = introspected({
            users: ['id', 'email'], // phone is missing
            legacy: ['id', 'data'], // not in desired
        });

        const diff = diffSchema(desired, live);
        // Expected: add_column (phone), create_table (tasks), drop_table (legacy)
        expect(diff.actions).toHaveLength(3);

        const types = diff.actions.map(a => a.type);
        expect(types).toContain('add_column');
        expect(types).toContain('create_table');
        expect(types).toContain('drop_table');
    });

    it('should skip id field when comparing columns', () => {
        const desired: ObjectSchema[] = [{
            name: 'users',
            fields: { id: { type: 'text' }, email: { type: 'text' } },
        }];
        const live = introspected({ users: ['id', 'email'] });

        const diff = diffSchema(desired, live);
        expect(diff.actions).toHaveLength(0);
    });

    it('should handle fields with required and defaultValue', () => {
        const desired: ObjectSchema[] = [{
            name: 'settings',
            fields: {
                theme: { type: 'text', required: true, defaultValue: 'light' },
            },
        }];
        const live = introspected({});

        const diff = diffSchema(desired, live);
        expect(diff.actions).toHaveLength(1);
        if (diff.actions[0].type === 'create_table') {
            const themeCol = diff.actions[0].columns.find(c => c.name === 'theme');
            expect(themeCol).toBeDefined();
            expect(themeCol!.notNull).toBe(true);
            expect(themeCol!.defaultValue).toBe('light');
        }
    });
});

// ============================================================================
// generateMigration Tests
// ============================================================================

describe('generateMigration', () => {
    it('should generate CREATE TABLE SQL for new table', () => {
        const diff = diffSchema(
            [{ name: 'tasks', fields: { title: { type: 'text' }, done: { type: 'boolean' } } }],
            introspected({})
        );
        const migration = generateMigration(diff);

        expect(migration.up).toHaveLength(1);
        expect(migration.up[0]).toContain('CREATE TABLE');
        expect(migration.up[0]).toContain('"tasks"');
        expect(migration.up[0]).toContain('"title"');
        expect(migration.up[0]).toContain('"done"');
        expect(migration.up[0]).toContain('"id" TEXT PRIMARY KEY');

        expect(migration.down).toHaveLength(1);
        expect(migration.down[0]).toContain('DROP TABLE');
    });

    it('should generate ALTER TABLE ADD COLUMN SQL', () => {
        const diff = diffSchema(
            [{ name: 'users', fields: { email: { type: 'text' }, phone: { type: 'text' } } }],
            introspected({ users: ['id', 'email'] })
        );
        const migration = generateMigration(diff);

        expect(migration.up).toHaveLength(1);
        expect(migration.up[0]).toContain('ALTER TABLE');
        expect(migration.up[0]).toContain('ADD COLUMN');
        expect(migration.up[0]).toContain('"phone"');

        expect(migration.down).toHaveLength(1);
        expect(migration.down[0]).toContain('DROP COLUMN');
    });

    it('should generate DROP TABLE SQL for removed tables', () => {
        const diff = diffSchema([], introspected({ old_table: ['id'] }));
        const migration = generateMigration(diff);

        expect(migration.up).toHaveLength(1);
        expect(migration.up[0]).toContain('DROP TABLE');
        expect(migration.up[0]).toContain('"old_table"');
    });

    it('should generate empty migration when no changes', () => {
        const diff = diffSchema(
            [{ name: 'users', fields: { email: { type: 'text' } } }],
            introspected({ users: ['id', 'email'] })
        );
        const migration = generateMigration(diff);

        expect(migration.up).toHaveLength(0);
        expect(migration.down).toHaveLength(0);
    });

    it('should handle NOT NULL and DEFAULT in ADD COLUMN', () => {
        const diff = diffSchema(
            [{ name: 'users', fields: { email: { type: 'text' }, status: { type: 'text', required: true, defaultValue: 'active' } } }],
            introspected({ users: ['id', 'email'] })
        );
        const migration = generateMigration(diff);

        expect(migration.up).toHaveLength(1);
        expect(migration.up[0]).toContain('NOT NULL');
        expect(migration.up[0]).toContain("DEFAULT 'active'");
    });

    it('should include human-readable summary', () => {
        const diff = diffSchema(
            [{ name: 'items', fields: { title: { type: 'text' } } }],
            introspected({})
        );
        const migration = generateMigration(diff);

        expect(migration.summary).toHaveLength(1);
        expect(migration.summary[0]).toContain('CREATE TABLE');
    });
});
