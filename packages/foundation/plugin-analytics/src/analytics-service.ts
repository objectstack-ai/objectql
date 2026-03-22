/**
 * ObjectQL Plugin Analytics — AnalyticsService
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IAnalyticsService, AnalyticsQuery, AnalyticsResult, CubeMeta } from '@objectql/types';
import { ObjectQLError } from '@objectql/types';
import type { AnalyticsStrategy } from './types';
import { CubeRegistry } from './cube-registry';
import { SemanticCompiler } from './semantic-compiler';
import { NativeSQLStrategy } from './strategy-sql';
import { ObjectQLStrategy } from './strategy-objectql';
import { MemoryFallbackStrategy } from './strategy-memory';

/**
 * AnalyticsService
 *
 * Implements IAnalyticsService from @objectstack/spec.
 * Dispatches analytics queries through a strategy pipeline:
 *
 *   1. SemanticCompiler  → LogicalPlan
 *   2. Strategy selection (based on driver capabilities)
 *   3. Strategy.execute  → AnalyticsResult
 *
 * Strategy selection order:
 *   a. NativeSQLStrategy — if driver exposes a `knex` instance (SQL push-down)
 *   b. ObjectQLStrategy  — if driver supports `aggregate()` + `queryAggregations`
 *   c. MemoryFallbackStrategy — fallback for dev/test (fetch all → JS aggregation)
 */
export class AnalyticsService implements IAnalyticsService {
    private readonly compiler: SemanticCompiler;
    private readonly sqlStrategy = new NativeSQLStrategy();
    private readonly objectqlStrategy = new ObjectQLStrategy();
    private readonly memoryStrategy = new MemoryFallbackStrategy();

    constructor(
        readonly registry: CubeRegistry,
        private readonly datasources: Record<string, unknown>,
    ) {
        this.compiler = new SemanticCompiler(registry);
    }

    // -------------------------------------------------------------------
    // IAnalyticsService implementation
    // -------------------------------------------------------------------

    async query(query: AnalyticsQuery): Promise<AnalyticsResult> {
        const plan = this.compiler.compile(query);
        const driver = this.resolveDriver(plan.datasource);
        const strategy = this.selectStrategy(driver);
        return strategy.execute(plan, driver);
    }

    async getMeta(cubeName?: string): Promise<CubeMeta[]> {
        return this.registry.getMeta(cubeName);
    }

    async generateSql(query: AnalyticsQuery): Promise<{ sql: string; params: unknown[] }> {
        const plan = this.compiler.compile(query);
        const driver = this.resolveDriver(plan.datasource);

        // Prefer SQL strategy's generateSql with live knex for accurate dialect
        if (this.isSqlDriver(driver)) {
            return this.sqlStrategy.buildQuery(plan, this.getKnex(driver));
        }

        // Fallback to plain SQL generation
        return this.sqlStrategy.generateSql(plan);
    }

    // -------------------------------------------------------------------
    // Strategy selection
    // -------------------------------------------------------------------

    selectStrategy(driver: unknown): AnalyticsStrategy {
        if (this.isSqlDriver(driver)) {
            return this.sqlStrategy;
        }
        if (this.supportsAggregation(driver)) {
            return this.objectqlStrategy;
        }
        return this.memoryStrategy;
    }

    // -------------------------------------------------------------------
    // Driver helpers
    // -------------------------------------------------------------------

    private resolveDriver(datasource: string): unknown {
        const driver = this.datasources[datasource];
        if (!driver) {
            throw new ObjectQLError({
                code: 'ANALYTICS_DATASOURCE_NOT_FOUND',
                message: `Datasource '${datasource}' not found. Available: ${Object.keys(this.datasources).join(', ') || '(none)'}`,
            });
        }
        return driver;
    }

    private isSqlDriver(driver: unknown): boolean {
        const d = driver as any;
        return !!(d.knex || (typeof d.getKnex === 'function'));
    }

    private supportsAggregation(driver: unknown): boolean {
        const d = driver as any;
        return (
            typeof d.aggregate === 'function' &&
            d.supports?.queryAggregations === true
        );
    }

    private getKnex(driver: unknown): any {
        const d = driver as any;
        return d.knex || d.getKnex?.();
    }
}
