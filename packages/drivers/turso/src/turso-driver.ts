/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Client, InValue, Transaction } from '@libsql/client';
import { createClient } from '@libsql/client';
import { Driver, DriverCapabilities, IntrospectedSchema, IntrospectedTable, IntrospectedColumn, IntrospectedForeignKey, ObjectQLError } from '@objectql/types';
import { nanoid } from 'nanoid';
import { compileFilter, compileSelect, parseSort, quoteIdentifier, type CompiledQuery } from './query-compiler';
import { fieldTypeToSqlite, isJsonFieldType, isBooleanFieldType } from './type-mapper';
import { mapRow, mapRows, serializeRecord } from './result-mapper';

/**
 * Default ID length for auto-generated IDs
 */
const DEFAULT_ID_LENGTH = 16;

// ============================================================================
// Configuration
// ============================================================================

/**
 * Turso driver configuration.
 *
 * Supports three connection modes:
 * 1. Remote (Cloud): `url: 'libsql://my-db-orgname.turso.io'`
 * 2. Local (Embedded): `url: 'file:./data/local.db'` or `url: ':memory:'`
 * 3. Embedded Replica (Hybrid): `url` + `syncUrl`
 */
export interface TursoDriverConfig {
    /** Database URL (`libsql://`, `https://`, `file:`, `:memory:`) */
    url: string;
    /** JWT auth token for remote database */
    authToken?: string;
    /** AES-256 encryption key for local files */
    encryptionKey?: string;
    /** Maximum concurrent requests. Default: 20 */
    concurrency?: number;
    /** Remote sync URL for embedded replica mode */
    syncUrl?: string;
    /** Sync configuration for embedded replica mode */
    sync?: {
        /** Periodic sync interval in seconds (0 = manual only). Default: 60 */
        intervalSeconds?: number;
        /** Sync immediately on connect. Default: true */
        onConnect?: boolean;
    };
    /** Operation timeout in milliseconds */
    timeout?: number;
}

// ============================================================================
// TursoDriver
// ============================================================================

/**
 * Turso/libSQL Driver for ObjectQL
 *
 * Implements the Driver interface from @objectql/types using the
 * `@libsql/client` SDK. Supports remote Turso cloud, local SQLite files,
 * and embedded replicas with sync.
 *
 * @version 4.2.2
 */
export class TursoDriver implements Driver {
    public readonly name = 'TursoDriver';
    public readonly version = '4.2.2';
    public readonly supports: DriverCapabilities = {
        create: true,
        read: true,
        update: true,
        delete: true,
        bulkCreate: true,
        bulkUpdate: true,
        bulkDelete: true,
        transactions: true,
        savepoints: true,
        queryFilters: true,
        queryAggregations: true,
        querySorting: true,
        queryPagination: true,
        queryWindowFunctions: true,
        querySubqueries: true,
        queryCTE: true,
        joins: true,
        fullTextSearch: true,  // FTS5
        jsonQuery: true,       // JSON1
        jsonFields: true,
        arrayFields: false,
        vectorSearch: true,    // libSQL native vectors
        streaming: false,      // cursor-based pagination instead
        schemaSync: true,
        migrations: true,
        indexes: true,
        connectionPooling: false, // concurrency limit instead
        preparedStatements: true,
        queryCache: false
    };

    private config: TursoDriverConfig;
    private client: Client | null = null;
    private jsonFields: Record<string, Set<string>> = {};
    private booleanFields: Record<string, Set<string>> = {};
    private syncIntervalId: ReturnType<typeof setInterval> | null = null;

    constructor(config: TursoDriverConfig) {
        if (!config.url) {
            throw new ObjectQLError({
                code: 'CONFIG_ERROR',
                message: 'Turso driver requires a "url" in configuration.'
            });
        }
        this.config = config;
    }

    // ========================================================================
    // Lifecycle
    // ========================================================================

    async connect(): Promise<void> {
        if (this.client) return;

        this.client = createClient({
            url: this.config.url,
            authToken: this.config.authToken,
            encryptionKey: this.config.encryptionKey,
            syncUrl: this.config.syncUrl,
            concurrency: this.config.concurrency,
        });

        // Sync on connect if configured
        if (this.config.syncUrl && this.config.sync?.onConnect !== false) {
            await this.sync();
        }

        // Start periodic sync if configured
        const interval = this.config.sync?.intervalSeconds;
        if (this.config.syncUrl && interval && interval > 0) {
            this.syncIntervalId = setInterval(() => {
                this.sync().catch(() => { /* background sync failure is non-fatal */ });
            }, interval * 1000);
        }
    }

    async disconnect(): Promise<void> {
        if (this.syncIntervalId) {
            clearInterval(this.syncIntervalId);
            this.syncIntervalId = null;
        }
        if (this.client) {
            this.client.close();
            this.client = null;
        }
    }

    async checkHealth(): Promise<boolean> {
        try {
            await this.ensureClient();
            await this.client!.execute('SELECT 1');
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Trigger manual sync of embedded replica with the remote primary.
     */
    async sync(): Promise<void> {
        if (!this.client) return;
        if (this.config.syncUrl) {
            await this.client.sync();
        }
    }

    // ========================================================================
    // Core CRUD
    // ========================================================================

    async find(objectName: string, query: object, options?: Record<string, unknown>): Promise<Record<string, unknown>[]> {
        await this.ensureClient();

        const q = query as Record<string, unknown>;
        const filters = q.filters || q.where || q.filter;
        const sort = q.sort || q.orderBy;
        const fields = q.fields as string[] | undefined;

        // Pagination: support both old (skip/limit/top) and new (offset/limit)
        const limit = (q.limit ?? q.top ?? q.pageSize) as number | undefined;
        const offset = (q.offset ?? q.skip) as number | undefined;

        const where = compileFilter(filters);
        const orderBy = parseSort(sort);

        const compiled = compileSelect({
            objectName,
            fields,
            where,
            orderBy,
            limit,
            offset
        });

        const result = await this.client!.execute({ sql: compiled.sql, args: compiled.args });
        return mapRows(
            result.rows as unknown as Record<string, unknown>[],
            this.jsonFields[objectName],
            this.booleanFields[objectName]
        );
    }

    async findOne(objectName: string, id: string | number, _query?: object, _options?: Record<string, unknown>): Promise<Record<string, unknown> | null> {
        await this.ensureClient();

        const table = quoteIdentifier(objectName);
        const result = await this.client!.execute({
            sql: `SELECT * FROM ${table} WHERE "id" = ? LIMIT 1`,
            args: [id as InValue]
        });

        if (result.rows.length === 0) return null;
        return mapRow(
            result.rows[0] as unknown as Record<string, unknown>,
            this.jsonFields[objectName],
            this.booleanFields[objectName]
        );
    }

    async create(objectName: string, data: Record<string, unknown>, _options?: Record<string, unknown>): Promise<Record<string, unknown>> {
        await this.ensureClient();

        const record = { ...data };
        if (!record.id) {
            record.id = nanoid(DEFAULT_ID_LENGTH);
        }

        const serialized = serializeRecord(record, this.jsonFields[objectName], this.booleanFields[objectName]);
        const columns = Object.keys(serialized);
        const table = quoteIdentifier(objectName);
        const colList = columns.map(c => quoteIdentifier(c)).join(', ');
        const placeholders = columns.map(() => '?').join(', ');
        const values = columns.map(c => serialized[c] as InValue);

        await this.client!.execute({
            sql: `INSERT INTO ${table} (${colList}) VALUES (${placeholders})`,
            args: values
        });

        // Return the created record (re-fetch to get server defaults)
        return (await this.findOne(objectName, record.id as string | number)) ?? record;
    }

    async update(objectName: string, id: string | number, data: Record<string, unknown>, _options?: Record<string, unknown>): Promise<Record<string, unknown>> {
        await this.ensureClient();

        const serialized = serializeRecord(data, this.jsonFields[objectName], this.booleanFields[objectName]);
        const columns = Object.keys(serialized);
        if (columns.length === 0) {
            const existing = await this.findOne(objectName, id);
            if (!existing) {
                throw new ObjectQLError({ code: 'NOT_FOUND', message: `Record ${id} not found in ${objectName}` });
            }
            return existing;
        }

        const table = quoteIdentifier(objectName);
        const setClauses = columns.map(c => `${quoteIdentifier(c)} = ?`).join(', ');
        const values = columns.map(c => serialized[c] as InValue);
        values.push(id as InValue);

        await this.client!.execute({
            sql: `UPDATE ${table} SET ${setClauses} WHERE "id" = ?`,
            args: values
        });

        return (await this.findOne(objectName, id)) ?? { id, ...data };
    }

    async delete(objectName: string, id: string | number, _options?: Record<string, unknown>): Promise<unknown> {
        await this.ensureClient();

        const table = quoteIdentifier(objectName);
        const result = await this.client!.execute({
            sql: `DELETE FROM ${table} WHERE "id" = ?`,
            args: [id as InValue]
        });

        return { deleted: result.rowsAffected > 0 };
    }

    async count(objectName: string, filters: object, _options?: Record<string, unknown>): Promise<number> {
        await this.ensureClient();

        const table = quoteIdentifier(objectName);
        const where = compileFilter(filters);
        let sql = `SELECT COUNT(*) as "count" FROM ${table}`;
        const args: InValue[] = [];

        if (where.sql) {
            sql += ` WHERE ${where.sql}`;
            args.push(...where.args);
        }

        const result = await this.client!.execute({ sql, args });
        const row = result.rows[0] as unknown as Record<string, unknown>;
        return Number(row?.count ?? 0);
    }

    // ========================================================================
    // Upsert
    // ========================================================================

    async upsert(objectName: string, data: Record<string, unknown>, _options?: Record<string, unknown>): Promise<Record<string, unknown>> {
        await this.ensureClient();

        const record = { ...data };
        if (!record.id) {
            record.id = nanoid(DEFAULT_ID_LENGTH);
        }

        const serialized = serializeRecord(record, this.jsonFields[objectName], this.booleanFields[objectName]);
        const columns = Object.keys(serialized);
        const table = quoteIdentifier(objectName);
        const colList = columns.map(c => quoteIdentifier(c)).join(', ');
        const placeholders = columns.map(() => '?').join(', ');
        const values = columns.map(c => serialized[c] as InValue);

        // Build ON CONFLICT DO UPDATE clause (exclude id)
        const updateCols = columns.filter(c => c !== 'id');
        const updateClauses = updateCols.map(c => `${quoteIdentifier(c)} = excluded.${quoteIdentifier(c)}`).join(', ');

        const sql = updateClauses
            ? `INSERT INTO ${table} (${colList}) VALUES (${placeholders}) ON CONFLICT("id") DO UPDATE SET ${updateClauses}`
            : `INSERT INTO ${table} (${colList}) VALUES (${placeholders}) ON CONFLICT("id") DO NOTHING`;

        await this.client!.execute({ sql, args: values });

        return (await this.findOne(objectName, record.id as string | number)) ?? record;
    }

    // ========================================================================
    // Bulk Operations
    // ========================================================================

    async bulkCreate(objectName: string, data: Record<string, unknown>[], _options?: Record<string, unknown>): Promise<unknown> {
        await this.ensureClient();

        if (data.length === 0) return [];

        const stmts = data.map(item => {
            const record = { ...item };
            if (!record.id) {
                record.id = nanoid(DEFAULT_ID_LENGTH);
            }
            const serialized = serializeRecord(record, this.jsonFields[objectName], this.booleanFields[objectName]);
            const columns = Object.keys(serialized);
            const table = quoteIdentifier(objectName);
            const colList = columns.map(c => quoteIdentifier(c)).join(', ');
            const placeholders = columns.map(() => '?').join(', ');
            const values = columns.map(c => serialized[c] as InValue);

            return { sql: `INSERT INTO ${table} (${colList}) VALUES (${placeholders})`, args: values };
        });

        await this.client!.batch(stmts, 'write');
        return data.length;
    }

    async bulkUpdate(objectName: string, updates: Array<{ id: string | number; data: Record<string, unknown> }>, _options?: Record<string, unknown>): Promise<unknown> {
        await this.ensureClient();

        if (updates.length === 0) return [];

        const stmts = updates.map(({ id, data }) => {
            const serialized = serializeRecord(data, this.jsonFields[objectName], this.booleanFields[objectName]);
            const columns = Object.keys(serialized);
            const table = quoteIdentifier(objectName);
            const setClauses = columns.map(c => `${quoteIdentifier(c)} = ?`).join(', ');
            const values = [...columns.map(c => serialized[c] as InValue), id as InValue];

            return { sql: `UPDATE ${table} SET ${setClauses} WHERE "id" = ?`, args: values };
        });

        await this.client!.batch(stmts, 'write');
        return updates.length;
    }

    async bulkDelete(objectName: string, ids: Array<string | number>, _options?: Record<string, unknown>): Promise<unknown> {
        await this.ensureClient();

        if (ids.length === 0) return [];

        const stmts = ids.map(id => {
            const table = quoteIdentifier(objectName);
            return { sql: `DELETE FROM ${table} WHERE "id" = ?`, args: [id as InValue] };
        });

        await this.client!.batch(stmts, 'write');
        return ids.length;
    }

    // ========================================================================
    // updateMany / deleteMany
    // ========================================================================

    async updateMany(objectName: string, filters: object, data: Record<string, unknown>, _options?: Record<string, unknown>): Promise<unknown> {
        await this.ensureClient();

        const serialized = serializeRecord(data, this.jsonFields[objectName], this.booleanFields[objectName]);
        const columns = Object.keys(serialized);
        if (columns.length === 0) return { affected: 0 };

        const table = quoteIdentifier(objectName);
        const setClauses = columns.map(c => `${quoteIdentifier(c)} = ?`).join(', ');
        const values = columns.map(c => serialized[c] as InValue);
        const where = compileFilter(filters);

        let sql = `UPDATE ${table} SET ${setClauses}`;
        if (where.sql) {
            sql += ` WHERE ${where.sql}`;
            values.push(...where.args);
        }

        const result = await this.client!.execute({ sql, args: values });
        return { affected: result.rowsAffected };
    }

    async deleteMany(objectName: string, filters: object, _options?: Record<string, unknown>): Promise<unknown> {
        await this.ensureClient();

        const table = quoteIdentifier(objectName);
        const where = compileFilter(filters);
        const args: InValue[] = [];

        let sql = `DELETE FROM ${table}`;
        if (where.sql) {
            sql += ` WHERE ${where.sql}`;
            args.push(...where.args);
        }

        const result = await this.client!.execute({ sql, args });
        return { affected: result.rowsAffected };
    }

    // ========================================================================
    // Transactions
    // ========================================================================

    async beginTransaction(): Promise<unknown> {
        await this.ensureClient();
        return this.client!.transaction('write');
    }

    async commit(transaction: unknown): Promise<void> {
        await (transaction as Transaction).commit();
    }

    async rollback(transaction: unknown): Promise<void> {
        await (transaction as Transaction).rollback();
    }

    // Deprecated aliases
    async commitTransaction(transaction: unknown): Promise<void> {
        return this.commit(transaction);
    }

    async rollbackTransaction(transaction: unknown): Promise<void> {
        return this.rollback(transaction);
    }

    // ========================================================================
    // Query Extensions
    // ========================================================================

    async distinct(objectName: string, field: string, filters?: object, _options?: Record<string, unknown>): Promise<unknown[]> {
        await this.ensureClient();

        const table = quoteIdentifier(objectName);
        const col = quoteIdentifier(field);
        const where = compileFilter(filters);
        const args: InValue[] = [];

        let sql = `SELECT DISTINCT ${col} FROM ${table}`;
        if (where.sql) {
            sql += ` WHERE ${where.sql}`;
            args.push(...where.args);
        }

        const result = await this.client!.execute({ sql, args });
        return (result.rows as unknown as Record<string, unknown>[]).map(r => r[field]);
    }

    async aggregate(objectName: string, query: object, _options?: Record<string, unknown>): Promise<Record<string, unknown>[]> {
        await this.ensureClient();

        const q = query as Record<string, unknown>;
        const pipeline = q.pipeline as Array<Record<string, unknown>> | undefined;

        if (pipeline) {
            return this.executeAggregationPipeline(objectName, pipeline);
        }

        // Simple aggregation: { groupBy, aggregates, filters }
        const table = quoteIdentifier(objectName);
        const groupBy = q.groupBy as string[] | undefined;
        const aggregates = q.aggregates as Record<string, string> | undefined;
        const filters = q.filters || q.where;

        const selectParts: string[] = [];
        if (groupBy?.length) {
            groupBy.forEach(g => selectParts.push(quoteIdentifier(g)));
        }
        if (aggregates) {
            for (const [alias, expr] of Object.entries(aggregates)) {
                selectParts.push(`${expr} AS ${quoteIdentifier(alias)}`);
            }
        }

        const columns = selectParts.length > 0 ? selectParts.join(', ') : '*';
        let sql = `SELECT ${columns} FROM ${table}`;
        const args: InValue[] = [];

        const where = compileFilter(filters);
        if (where.sql) {
            sql += ` WHERE ${where.sql}`;
            args.push(...where.args);
        }

        if (groupBy?.length) {
            sql += ` GROUP BY ${groupBy.map(g => quoteIdentifier(g)).join(', ')}`;
        }

        const result = await this.client!.execute({ sql, args });
        return result.rows as unknown as Record<string, unknown>[];
    }

    // ========================================================================
    // Schema Management
    // ========================================================================

    async init(objects: object[]): Promise<void> {
        await this.ensureClient();

        const objs = objects as Array<{ name: string; fields: Record<string, Record<string, unknown>> }>;

        for (const obj of objs) {
            const table = quoteIdentifier(obj.name);
            const columnDefs: string[] = ['"id" TEXT PRIMARY KEY'];

            this.jsonFields[obj.name] = new Set<string>();
            this.booleanFields[obj.name] = new Set<string>();

            if (obj.fields) {
                for (const [fieldName, fieldDef] of Object.entries(obj.fields)) {
                    if (fieldName === 'id') continue; // Already defined as primary key

                    const fieldType = (fieldDef.type as string) || 'text';
                    const sqlType = fieldTypeToSqlite(fieldType);
                    let colDef = `${quoteIdentifier(fieldName)} ${sqlType}`;

                    if (fieldDef.required) colDef += ' NOT NULL';
                    if (fieldDef.defaultValue !== undefined) {
                        if (typeof fieldDef.defaultValue === 'string') {
                            colDef += ` DEFAULT '${fieldDef.defaultValue}'`;
                        } else {
                            colDef += ` DEFAULT ${fieldDef.defaultValue}`;
                        }
                    }

                    columnDefs.push(colDef);

                    // Track JSON and boolean fields for serialization
                    if (isJsonFieldType(fieldType)) {
                        this.jsonFields[obj.name].add(fieldName);
                    }
                    if (isBooleanFieldType(fieldType)) {
                        this.booleanFields[obj.name].add(fieldName);
                    }
                }
            }

            await this.client!.execute(`CREATE TABLE IF NOT EXISTS ${table} (${columnDefs.join(', ')})`);
        }
    }

    async syncSchema(objects: object[], _options?: Record<string, unknown>): Promise<void> {
        return this.init(objects);
    }

    async dropTable(objectName: string, _options?: Record<string, unknown>): Promise<void> {
        await this.ensureClient();
        const table = quoteIdentifier(objectName);
        await this.client!.execute(`DROP TABLE IF EXISTS ${table}`);
    }

    async introspectSchema(): Promise<IntrospectedSchema> {
        await this.ensureClient();

        const tables: Record<string, IntrospectedTable> = {};

        // Get all tables
        const tablesResult = await this.client!.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        );

        for (const tableRow of tablesResult.rows) {
            const tableName = (tableRow as unknown as Record<string, unknown>).name as string;
            const columns: IntrospectedColumn[] = [];
            const foreignKeys: IntrospectedForeignKey[] = [];
            const primaryKeys: string[] = [];

            // Get columns
            const columnsResult = await this.client!.execute(`PRAGMA table_info(${quoteIdentifier(tableName)})`);
            for (const col of columnsResult.rows) {
                const c = col as unknown as Record<string, unknown>;
                const isPK = c.pk === 1;
                if (isPK) primaryKeys.push(c.name as string);

                columns.push({
                    name: c.name as string,
                    type: c.type as string,
                    nullable: c.notnull !== 1,
                    defaultValue: c.dflt_value ?? undefined,
                    isPrimary: isPK,
                });
            }

            // Get foreign keys
            const fkResult = await this.client!.execute(`PRAGMA foreign_key_list(${quoteIdentifier(tableName)})`);
            for (const fk of fkResult.rows) {
                const f = fk as unknown as Record<string, unknown>;
                foreignKeys.push({
                    columnName: f.from as string,
                    referencedTable: f.table as string,
                    referencedColumn: f.to as string,
                });
            }

            tables[tableName] = { name: tableName, columns, foreignKeys, primaryKeys };
        }

        return { tables };
    }

    // ========================================================================
    // Explain
    // ========================================================================

    async explain(objectName: string, query: object, _options?: Record<string, unknown>): Promise<unknown> {
        await this.ensureClient();

        const q = query as Record<string, unknown>;
        const filters = q.filters || q.where || q.filter;
        const where = compileFilter(filters);

        const table = quoteIdentifier(objectName);
        let sql = `EXPLAIN QUERY PLAN SELECT * FROM ${table}`;
        const args: InValue[] = [];
        if (where.sql) {
            sql += ` WHERE ${where.sql}`;
            args.push(...where.args);
        }

        const result = await this.client!.execute({ sql, args });
        return result.rows;
    }

    // ========================================================================
    // Raw SQL execution
    // ========================================================================

    async execute(command: object, parameters?: unknown[], _options?: Record<string, unknown>): Promise<unknown> {
        await this.ensureClient();

        // command can be a string (raw SQL) or { sql, args }
        if (typeof command === 'string') {
            return this.client!.execute({
                sql: command as unknown as string,
                args: (parameters || []) as InValue[]
            });
        }

        const cmd = command as { sql: string; args?: InValue[] };
        return this.client!.execute({ sql: cmd.sql, args: cmd.args || [] });
    }

    // ========================================================================
    // DriverInterface v4.0 methods
    // ========================================================================

    async executeQuery(ast: object, _options?: Record<string, unknown>): Promise<{ value: Record<string, unknown>[]; count?: number }> {
        await this.ensureClient();

        const q = ast as Record<string, unknown>;
        const objectName = q.object as string || q.from as string;
        if (!objectName) {
            throw new ObjectQLError({ code: 'QUERY_ERROR', message: 'executeQuery requires an "object" or "from" field in the AST.' });
        }

        const results = await this.find(objectName, q);
        return { value: results };
    }

    async executeCommand(command: object, _options?: Record<string, unknown>): Promise<{ success: boolean; data?: unknown; affected: number }> {
        await this.ensureClient();

        const cmd = command as Record<string, unknown>;
        const type = cmd.type as string;
        const objectName = cmd.object as string;

        try {
            switch (type) {
                case 'create': {
                    const data = await this.create(objectName, cmd.data as Record<string, unknown>);
                    return { success: true, data, affected: 1 };
                }
                case 'update': {
                    const data = await this.update(objectName, cmd.id as string | number, cmd.data as Record<string, unknown>);
                    return { success: true, data, affected: 1 };
                }
                case 'delete': {
                    await this.delete(objectName, cmd.id as string | number);
                    return { success: true, affected: 1 };
                }
                case 'bulkCreate': {
                    const count = await this.bulkCreate(objectName, cmd.records as Record<string, unknown>[]);
                    return { success: true, affected: count as number };
                }
                case 'bulkUpdate': {
                    const count = await this.bulkUpdate(objectName, cmd.updates as Array<{ id: string | number; data: Record<string, unknown> }>);
                    return { success: true, affected: count as number };
                }
                case 'bulkDelete': {
                    const count = await this.bulkDelete(objectName, cmd.ids as Array<string | number>);
                    return { success: true, affected: count as number };
                }
                default:
                    return { success: false, affected: 0 };
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            return { success: false, affected: 0, data: message };
        }
    }

    // ========================================================================
    // Pool Stats (concurrency tracking, not traditional pool)
    // ========================================================================

    getPoolStats(): { total: number; idle: number; active: number; waiting: number } | undefined {
        return undefined; // libSQL uses concurrency limits, not connection pools
    }

    // ========================================================================
    // Private Helpers
    // ========================================================================

    private async ensureClient(): Promise<void> {
        if (!this.client) {
            await this.connect();
        }
    }

    private async executeAggregationPipeline(objectName: string, pipeline: Array<Record<string, unknown>>): Promise<Record<string, unknown>[]> {
        // Simple pipeline-style aggregation (MongoDB-inspired)
        const table = quoteIdentifier(objectName);
        const args: InValue[] = [];
        let selectParts = ['*'];
        let whereClause = '';
        let groupByClause = '';
        let havingClause = '';
        let orderByClause = '';
        let limitClause = '';

        for (const stage of pipeline) {
            if (stage.$match) {
                const where = compileFilter(stage.$match);
                if (where.sql) {
                    whereClause = ` WHERE ${where.sql}`;
                    args.push(...where.args);
                }
            }
            if (stage.$group) {
                const group = stage.$group as Record<string, unknown>;
                const groupFields: string[] = [];
                const selects: string[] = [];

                for (const [key, value] of Object.entries(group)) {
                    if (key === '_id') {
                        if (typeof value === 'string') {
                            const fieldName = value.startsWith('$') ? value.slice(1) : value;
                            groupFields.push(quoteIdentifier(fieldName));
                            selects.push(`${quoteIdentifier(fieldName)} AS "_id"`);
                        }
                    } else {
                        const agg = value as Record<string, unknown>;
                        for (const [aggOp, aggField] of Object.entries(agg)) {
                            const field = typeof aggField === 'string' && aggField.startsWith('$')
                                ? quoteIdentifier(aggField.slice(1))
                                : '*';
                            switch (aggOp) {
                                case '$sum': selects.push(`SUM(${field}) AS ${quoteIdentifier(key)}`); break;
                                case '$avg': selects.push(`AVG(${field}) AS ${quoteIdentifier(key)}`); break;
                                case '$min': selects.push(`MIN(${field}) AS ${quoteIdentifier(key)}`); break;
                                case '$max': selects.push(`MAX(${field}) AS ${quoteIdentifier(key)}`); break;
                                case '$count': selects.push(`COUNT(${field}) AS ${quoteIdentifier(key)}`); break;
                            }
                        }
                    }
                }

                if (selects.length > 0) selectParts = selects;
                if (groupFields.length > 0) groupByClause = ` GROUP BY ${groupFields.join(', ')}`;
            }
            if (stage.$sort) {
                const sorts = parseSort(stage.$sort);
                if (sorts.length > 0) {
                    orderByClause = ` ORDER BY ${sorts.map(s => `${quoteIdentifier(s.field)} ${s.direction.toUpperCase()}`).join(', ')}`;
                }
            }
            if (stage.$limit !== undefined) {
                limitClause = ` LIMIT ?`;
                args.push(stage.$limit as InValue);
            }
        }

        const sql = `SELECT ${selectParts.join(', ')} FROM ${table}${whereClause}${groupByClause}${havingClause}${orderByClause}${limitClause}`;
        const result = await this.client!.execute({ sql, args });
        return result.rows as unknown as Record<string, unknown>[];
    }
}
