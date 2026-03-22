/**
 * ObjectQL Plugin Analytics — NativeSQLStrategy
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { AnalyticsResult } from '@objectql/types';
import type { AnalyticsStrategy, LogicalPlan, LogicalPlanMeasure } from './types';

/**
 * NativeSQLStrategy
 *
 * Pushes the LogicalPlan down to a SQL driver by building a raw SQL query
 * using the driver's Knex instance. Supports SQL aggregate push-down for
 * Postgres, SQLite, MySQL, and other Knex-supported dialects.
 */
export class NativeSQLStrategy implements AnalyticsStrategy {
    readonly name = 'native-sql';

    async execute(plan: LogicalPlan, driver: unknown): Promise<AnalyticsResult> {
        const knex = this.getKnex(driver);
        const { sql, params } = this.buildQuery(plan, knex);
        const rows = await knex.raw(sql, params).then((result: any) => {
            // Knex wraps results differently depending on dialect
            return Array.isArray(result) ? result : (result.rows || result);
        });

        return {
            rows: rows as Record<string, unknown>[],
            fields: this.buildFields(plan),
            sql,
        };
    }

    generateSql(plan: LogicalPlan): { sql: string; params: unknown[] } {
        // Build SQL without a live knex instance — uses placeholder dialect
        return this.buildQueryPlain(plan);
    }

    // -------------------------------------------------------------------
    // SQL Generation
    // -------------------------------------------------------------------

    buildQuery(plan: LogicalPlan, knex: any): { sql: string; params: unknown[] } {
        const builder = knex(plan.objectName);

        // SELECT — dimensions as group-by columns
        for (const dim of plan.dimensions) {
            builder.select(`${dim.field} as ${dim.alias}`);
        }

        // SELECT — aggregate functions
        for (const m of plan.measures) {
            const expr = this.aggregateExpression(m);
            builder.select(knex.raw(`${expr} as ??`, [m.alias]));
        }

        // WHERE
        this.applyFilters(builder, plan);

        // GROUP BY
        if (plan.dimensions.length > 0) {
            builder.groupBy(plan.dimensions.map(d => d.field));
        }

        // ORDER BY
        if (plan.order) {
            for (const [key, dir] of Object.entries(plan.order)) {
                builder.orderBy(key, dir);
            }
        }

        // LIMIT / OFFSET
        if (plan.limit != null) builder.limit(plan.limit);
        if (plan.offset != null) builder.offset(plan.offset);

        const compiled = builder.toSQL();
        return { sql: compiled.sql, params: compiled.bindings };
    }

    /** Generate SQL as a plain string (no live driver). */
    private buildQueryPlain(plan: LogicalPlan): { sql: string; params: unknown[] } {
        const selectParts: string[] = [];
        const params: unknown[] = [];

        for (const dim of plan.dimensions) {
            selectParts.push(`"${dim.field}" as "${dim.alias}"`);
        }
        for (const m of plan.measures) {
            selectParts.push(`${this.aggregateExpression(m)} as "${m.alias}"`);
        }

        let sql = `SELECT ${selectParts.join(', ')} FROM "${plan.objectName}"`;

        // WHERE
        const whereClauses = this.buildWhereClauses(plan, params);
        if (whereClauses.length > 0) {
            sql += ` WHERE ${whereClauses.join(' AND ')}`;
        }

        // GROUP BY
        if (plan.dimensions.length > 0) {
            sql += ` GROUP BY ${plan.dimensions.map(d => `"${d.field}"`).join(', ')}`;
        }

        // ORDER BY
        if (plan.order) {
            const orderParts = Object.entries(plan.order).map(([k, v]) => `"${k}" ${v}`);
            if (orderParts.length > 0) sql += ` ORDER BY ${orderParts.join(', ')}`;
        }

        if (plan.limit != null) sql += ` LIMIT ${plan.limit}`;
        if (plan.offset != null) sql += ` OFFSET ${plan.offset}`;

        return { sql, params };
    }

    // -------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------

    private aggregateExpression(m: LogicalPlanMeasure): string {
        switch (m.aggregation) {
            case 'count':
                return m.field === '*' ? 'count(*)' : `count("${m.field}")`;
            case 'countDistinct':
                return `count(distinct "${m.field}")`;
            case 'sum':
                return `sum("${m.field}")`;
            case 'avg':
                return `avg("${m.field}")`;
            case 'min':
                return `min("${m.field}")`;
            case 'max':
                return `max("${m.field}")`;
            default:
                return `count(*)`;
        }
    }

    private applyFilters(builder: any, plan: LogicalPlan): void {
        for (const f of plan.filters) {
            const values = f.values || [];
            switch (f.operator) {
                case 'equals':
                    builder.where(f.field, values[0]);
                    break;
                case 'notEquals':
                    builder.whereNot(f.field, values[0]);
                    break;
                case 'gt':
                    builder.where(f.field, '>', values[0]);
                    break;
                case 'gte':
                    builder.where(f.field, '>=', values[0]);
                    break;
                case 'lt':
                    builder.where(f.field, '<', values[0]);
                    break;
                case 'lte':
                    builder.where(f.field, '<=', values[0]);
                    break;
                case 'contains':
                    builder.where(f.field, 'like', `%${values[0]}%`);
                    break;
                case 'in':
                    builder.whereIn(f.field, values);
                    break;
                case 'notIn':
                    builder.whereNotIn(f.field, values);
                    break;
                default:
                    if (values.length === 1) {
                        builder.where(f.field, values[0]);
                    }
            }
        }
    }

    private buildWhereClauses(plan: LogicalPlan, params: unknown[]): string[] {
        const clauses: string[] = [];
        for (const f of plan.filters) {
            const values = f.values || [];
            switch (f.operator) {
                case 'equals':
                    clauses.push(`"${f.field}" = ?`);
                    params.push(values[0]);
                    break;
                case 'notEquals':
                    clauses.push(`"${f.field}" != ?`);
                    params.push(values[0]);
                    break;
                case 'gt':
                    clauses.push(`"${f.field}" > ?`);
                    params.push(values[0]);
                    break;
                case 'gte':
                    clauses.push(`"${f.field}" >= ?`);
                    params.push(values[0]);
                    break;
                case 'lt':
                    clauses.push(`"${f.field}" < ?`);
                    params.push(values[0]);
                    break;
                case 'lte':
                    clauses.push(`"${f.field}" <= ?`);
                    params.push(values[0]);
                    break;
                case 'contains':
                    clauses.push(`"${f.field}" LIKE ?`);
                    params.push(`%${values[0]}%`);
                    break;
                case 'in':
                    clauses.push(`"${f.field}" IN (${values.map(() => '?').join(', ')})`);
                    params.push(...values);
                    break;
                default:
                    if (values.length === 1) {
                        clauses.push(`"${f.field}" = ?`);
                        params.push(values[0]);
                    }
            }
        }
        return clauses;
    }

    private buildFields(plan: LogicalPlan): Array<{ name: string; type: string }> {
        const fields: Array<{ name: string; type: string }> = [];
        for (const dim of plan.dimensions) {
            fields.push({ name: dim.alias, type: 'string' });
        }
        for (const m of plan.measures) {
            fields.push({ name: m.alias, type: 'number' });
        }
        return fields;
    }

    private getKnex(driver: unknown): any {
        const d = driver as any;
        if (d.knex) return d.knex;
        if (d.getKnex && typeof d.getKnex === 'function') return d.getKnex();
        if (d.connection) return d.connection;
        throw new Error('NativeSQLStrategy requires a SQL driver with a knex instance.');
    }
}
