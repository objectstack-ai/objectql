/**
 * ObjectQL Plugin Analytics — MemoryFallbackStrategy
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { AnalyticsResult } from '@objectql/types';
import type { AnalyticsStrategy, LogicalPlan } from './types';

/**
 * MemoryFallbackStrategy
 *
 * Executes analytics queries entirely in-memory by fetching all rows from
 * the driver via `find()` and performing aggregation in JavaScript.
 *
 * This strategy is intended for dev/test environments and small datasets.
 * It does NOT push computation down to the database.
 */
export class MemoryFallbackStrategy implements AnalyticsStrategy {
    readonly name = 'memory-fallback';

    async execute(plan: LogicalPlan, driver: unknown): Promise<AnalyticsResult> {
        const d = driver as any;
        if (typeof d.find !== 'function') {
            throw new Error('MemoryFallbackStrategy requires a driver with a find() method.');
        }

        // 1. Fetch all matching records
        const findQuery: Record<string, unknown> = {};
        if (plan.filters.length > 0) {
            findQuery.where = this.buildWhere(plan);
        }
        const allRows: Record<string, unknown>[] = await d.find(plan.objectName, findQuery);

        // 2. Group rows by dimensions
        const groups = this.groupRows(allRows, plan);

        // 3. Compute aggregates per group
        const resultRows = this.computeAggregates(groups, plan);

        // 4. Sort
        const sorted = this.sortRows(resultRows, plan);

        // 5. Paginate
        const paginated = this.paginate(sorted, plan);

        return {
            rows: paginated,
            fields: this.buildFields(plan),
        };
    }

    // -------------------------------------------------------------------
    // Grouping
    // -------------------------------------------------------------------

    private groupRows(
        rows: Record<string, unknown>[],
        plan: LogicalPlan,
    ): Map<string, Record<string, unknown>[]> {
        const groups = new Map<string, Record<string, unknown>[]>();

        if (plan.dimensions.length === 0) {
            // Single group — all rows
            groups.set('__all__', rows);
            return groups;
        }

        for (const row of rows) {
            const key = plan.dimensions.map(d => String(row[d.field] ?? '')).join('|||');
            const group = groups.get(key);
            if (group) {
                group.push(row);
            } else {
                groups.set(key, [row]);
            }
        }

        return groups;
    }

    // -------------------------------------------------------------------
    // Aggregation
    // -------------------------------------------------------------------

    private computeAggregates(
        groups: Map<string, Record<string, unknown>[]>,
        plan: LogicalPlan,
    ): Record<string, unknown>[] {
        const results: Record<string, unknown>[] = [];

        for (const [, rows] of groups) {
            const result: Record<string, unknown> = {};

            // Dimension values from first row in group
            for (const dim of plan.dimensions) {
                result[dim.alias] = rows.length > 0 ? rows[0][dim.field] : null;
            }

            // Compute each measure
            for (const m of plan.measures) {
                result[m.alias] = this.computeMeasure(m.aggregation, m.field, rows);
            }

            results.push(result);
        }

        return results;
    }

    private computeMeasure(
        aggregation: string,
        field: string,
        rows: Record<string, unknown>[],
    ): number {
        if (aggregation === 'count') {
            return field === '*' ? rows.length : rows.filter(r => r[field] != null).length;
        }

        const values = rows
            .map(r => r[field])
            .filter((v): v is number => typeof v === 'number');

        if (values.length === 0) return 0;

        switch (aggregation) {
            case 'sum':
                return values.reduce((a, b) => a + b, 0);
            case 'avg':
                return values.reduce((a, b) => a + b, 0) / values.length;
            case 'min':
                return Math.min(...values);
            case 'max':
                return Math.max(...values);
            case 'countDistinct':
                return new Set(values).size;
            default:
                return rows.length;
        }
    }

    // -------------------------------------------------------------------
    // Filtering / Sorting / Pagination
    // -------------------------------------------------------------------

    private buildWhere(plan: LogicalPlan): Record<string, unknown> {
        const where: Record<string, unknown> = {};
        for (const f of plan.filters) {
            const values = f.values || [];
            switch (f.operator) {
                case 'equals':
                    where[f.field] = values[0];
                    break;
                case 'notEquals':
                    where[f.field] = { $ne: values[0] };
                    break;
                case 'gt':
                    where[f.field] = { $gt: values[0] };
                    break;
                case 'gte':
                    where[f.field] = { $gte: values[0] };
                    break;
                case 'lt':
                    where[f.field] = { $lt: values[0] };
                    break;
                case 'lte':
                    where[f.field] = { $lte: values[0] };
                    break;
                case 'in':
                    where[f.field] = { $in: values };
                    break;
                default:
                    if (values.length === 1) {
                        where[f.field] = values[0];
                    }
            }
        }
        return where;
    }

    private sortRows(
        rows: Record<string, unknown>[],
        plan: LogicalPlan,
    ): Record<string, unknown>[] {
        if (!plan.order || Object.keys(plan.order).length === 0) return rows;

        const entries = Object.entries(plan.order);
        return [...rows].sort((a, b) => {
            for (const [key, dir] of entries) {
                const va = a[key];
                const vb = b[key];
                if (va === vb) continue;
                if (va == null) return dir === 'asc' ? -1 : 1;
                if (vb == null) return dir === 'asc' ? 1 : -1;
                const cmp = va < vb ? -1 : 1;
                return dir === 'asc' ? cmp : -cmp;
            }
            return 0;
        });
    }

    private paginate(
        rows: Record<string, unknown>[],
        plan: LogicalPlan,
    ): Record<string, unknown>[] {
        const start = plan.offset ?? 0;
        const end = plan.limit != null ? start + plan.limit : rows.length;
        return rows.slice(start, end);
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
}
