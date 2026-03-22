/**
 * ObjectQL Plugin Analytics — ObjectQLStrategy
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { AnalyticsResult } from '@objectql/types';
import type { AnalyticsStrategy, LogicalPlan } from './types';

/**
 * ObjectQLStrategy
 *
 * Delegates analytics execution to the driver's generic aggregate() method.
 * This strategy is used when the driver reports `queryAggregations: true`
 * but is not a SQL driver (e.g. MongoDB with native $group pipeline support).
 */
export class ObjectQLStrategy implements AnalyticsStrategy {
    readonly name = 'objectql-aggregate';

    async execute(plan: LogicalPlan, driver: unknown): Promise<AnalyticsResult> {
        const d = driver as any;

        if (typeof d.aggregate !== 'function') {
            throw new Error(
                'ObjectQLStrategy requires a driver that implements aggregate(). ' +
                'Use MemoryFallbackStrategy for drivers without aggregation support.',
            );
        }

        // Build a query object compatible with the driver's aggregate interface
        const query = this.buildAggregateQuery(plan);
        const rows: Record<string, unknown>[] = await d.aggregate(plan.objectName, query);

        return {
            rows: this.renameToAliases(rows, plan),
            fields: this.buildFields(plan),
        };
    }

    // -------------------------------------------------------------------
    // Query construction
    // -------------------------------------------------------------------

    private buildAggregateQuery(plan: LogicalPlan): Record<string, unknown> {
        const query: Record<string, unknown> = {};

        // Aggregations
        query.aggregations = plan.measures.map(m => ({
            function: m.aggregation === 'countDistinct' ? 'count' : m.aggregation,
            field: m.field === '*' ? '_id' : m.field,
            alias: m.alias,
        }));

        // GroupBy
        if (plan.dimensions.length > 0) {
            query.groupBy = plan.dimensions.map(d => d.field);
        }

        // Where
        if (plan.filters.length > 0) {
            query.where = this.buildWhere(plan);
        }

        // Limit / offset
        if (plan.limit != null) query.limit = plan.limit;
        if (plan.offset != null) query.offset = plan.offset;

        return query;
    }

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
                case 'notIn':
                    where[f.field] = { $nin: values };
                    break;
                case 'contains':
                    where[f.field] = { $regex: values[0] };
                    break;
                default:
                    if (values.length === 1) {
                        where[f.field] = values[0];
                    }
            }
        }
        return where;
    }

    private renameToAliases(
        rows: Record<string, unknown>[],
        plan: LogicalPlan,
    ): Record<string, unknown>[] {
        // Build rename map: field → alias
        const renameMap = new Map<string, string>();
        for (const dim of plan.dimensions) {
            if (dim.field !== dim.alias) renameMap.set(dim.field, dim.alias);
        }
        for (const m of plan.measures) {
            if (m.alias !== m.field) renameMap.set(m.alias, m.alias); // keep alias if already present
        }

        if (renameMap.size === 0) return rows;

        return rows.map(row => {
            const out: Record<string, unknown> = {};
            for (const [key, val] of Object.entries(row)) {
                const alias = renameMap.get(key);
                out[alias || key] = val;
            }
            return out;
        });
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
