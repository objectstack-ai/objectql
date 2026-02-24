/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IntrospectedSchema, IntrospectedTable, IntrospectedColumn } from '@objectql/types';
import { fieldTypeToSqlite } from './type-mapper';
import { quoteIdentifier } from './query-compiler';

// ============================================================================
// Schema Diff Types
// ============================================================================

/**
 * A single atomic change detected between the desired schema and the live
 * database schema.
 */
export type SchemaDiffAction =
    | { type: 'create_table'; table: string; columns: ColumnDef[] }
    | { type: 'add_column'; table: string; column: ColumnDef }
    | { type: 'drop_table'; table: string };

/**
 * Column definition used in diff actions.
 */
export interface ColumnDef {
    name: string;
    sqlType: string;
    notNull?: boolean;
    defaultValue?: string | number;
    isPrimary?: boolean;
}

/**
 * Complete schema diff result.
 */
export interface SchemaDiff {
    /** Ordered list of diff actions to bring the database in sync with desired schema. */
    actions: SchemaDiffAction[];
    /** Human-readable summary of changes. */
    summary: string[];
}

/**
 * Generated migration containing SQL statements.
 */
export interface SchemaMigration {
    /** Forward migration statements (apply changes). */
    up: string[];
    /** Reverse migration statements (rollback). Empty if irreversible. */
    down: string[];
    /** Human-readable summary. */
    summary: string[];
}

// ============================================================================
// Object Schema (input shape from ObjectQL metadata)
// ============================================================================

/**
 * Lightweight object schema shape accepted by the diff engine.
 * Matches the shape used by `TursoDriver.init()`.
 */
export interface ObjectSchema {
    name: string;
    fields: Record<string, FieldDef>;
}

export interface FieldDef {
    type?: string;
    required?: boolean;
    defaultValue?: string | number;
}

// ============================================================================
// diffSchema — Core diff algorithm
// ============================================================================

/**
 * Compare desired ObjectQL object definitions against the live introspected
 * database schema and produce a list of diff actions.
 *
 * SQLite limitations respected:
 * - No DROP COLUMN (before 3.35.0, but libSQL supports it)
 * - No ALTER COLUMN type change
 * - Only ADD COLUMN is safe across all versions
 *
 * @param desired - The ObjectQL object definitions (source of truth)
 * @param live - The introspected database schema
 * @returns SchemaDiff with ordered actions
 */
export function diffSchema(desired: readonly ObjectSchema[], live: IntrospectedSchema): SchemaDiff {
    const actions: SchemaDiffAction[] = [];
    const summary: string[] = [];

    const liveTables = new Set(Object.keys(live.tables));
    const desiredNames = new Set(desired.map(o => o.name));

    // 1. Detect new tables or new columns in existing tables
    for (const obj of desired) {
        const liveTable: IntrospectedTable | undefined = live.tables[obj.name];

        if (!liveTable) {
            // Table does not exist — create it
            const columns = buildColumnDefs(obj);
            actions.push({ type: 'create_table', table: obj.name, columns });
            summary.push(`CREATE TABLE "${obj.name}" (${columns.length} columns)`);
            continue;
        }

        // Table exists — check for missing columns
        const liveColumns = new Set(liveTable.columns.map((c: IntrospectedColumn) => c.name));

        for (const [fieldName, fieldDef] of Object.entries(obj.fields)) {
            if (fieldName === 'id') continue; // Primary key is always present
            if (liveColumns.has(fieldName)) continue; // Column exists

            const sqlType = fieldTypeToSqlite(fieldDef.type ?? 'text');
            const colDef: ColumnDef = {
                name: fieldName,
                sqlType,
                notNull: fieldDef.required ?? false,
                defaultValue: fieldDef.defaultValue,
            };
            actions.push({ type: 'add_column', table: obj.name, column: colDef });
            summary.push(`ADD COLUMN "${obj.name}"."${fieldName}" ${sqlType}`);
        }
    }

    // 2. Detect tables that exist in DB but not in desired (candidates for drop)
    for (const tableName of liveTables) {
        if (!desiredNames.has(tableName)) {
            actions.push({ type: 'drop_table', table: tableName });
            summary.push(`DROP TABLE "${tableName}"`);
        }
    }

    if (summary.length === 0) {
        summary.push('Schema is up to date — no changes needed.');
    }

    return { actions, summary };
}

// ============================================================================
// generateMigration — SQL statement generation from diff
// ============================================================================

/**
 * Generate SQLite-compatible DDL migration statements from a schema diff.
 *
 * @param diff - The schema diff result from `diffSchema()`
 * @returns Migration with up/down SQL statements
 */
export function generateMigration(diff: SchemaDiff): SchemaMigration {
    const up: string[] = [];
    const down: string[] = [];

    for (const action of diff.actions) {
        switch (action.type) {
            case 'create_table': {
                const colDefs = action.columns.map(c => formatColumnDef(c)).join(', ');
                up.push(`CREATE TABLE IF NOT EXISTS ${quoteIdentifier(action.table)} (${colDefs});`);
                down.push(`DROP TABLE IF EXISTS ${quoteIdentifier(action.table)};`);
                break;
            }

            case 'add_column': {
                const colSql = formatColumnDef(action.column);
                up.push(`ALTER TABLE ${quoteIdentifier(action.table)} ADD COLUMN ${colSql};`);
                // SQLite does not support DROP COLUMN universally, but libSQL does
                down.push(`ALTER TABLE ${quoteIdentifier(action.table)} DROP COLUMN ${quoteIdentifier(action.column.name)};`);
                break;
            }

            case 'drop_table': {
                up.push(`DROP TABLE IF EXISTS ${quoteIdentifier(action.table)};`);
                // Reverse: we cannot perfectly recreate, but we note it
                down.push(`-- Cannot auto-recreate dropped table "${action.table}"; manual intervention required.`);
                break;
            }
        }
    }

    return { up, down, summary: diff.summary };
}

// ============================================================================
// Helpers
// ============================================================================

function buildColumnDefs(obj: ObjectSchema): ColumnDef[] {
    const columns: ColumnDef[] = [
        { name: 'id', sqlType: 'TEXT', isPrimary: true },
    ];

    for (const [fieldName, fieldDef] of Object.entries(obj.fields)) {
        if (fieldName === 'id') continue;

        columns.push({
            name: fieldName,
            sqlType: fieldTypeToSqlite(fieldDef.type ?? 'text'),
            notNull: fieldDef.required ?? false,
            defaultValue: fieldDef.defaultValue,
        });
    }

    return columns;
}

function formatColumnDef(col: ColumnDef): string {
    let sql = `${quoteIdentifier(col.name)} ${col.sqlType}`;
    if (col.isPrimary) sql += ' PRIMARY KEY';
    if (col.notNull && !col.isPrimary) sql += ' NOT NULL';
    if (col.defaultValue !== undefined) {
        if (typeof col.defaultValue === 'string') {
            sql += ` DEFAULT '${col.defaultValue}'`;
        } else {
            sql += ` DEFAULT ${col.defaultValue}`;
        }
    }
    return sql;
}
