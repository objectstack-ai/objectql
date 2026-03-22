/**
 * ObjectQL Plugin Analytics — Integration Tests
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CubeRegistry } from '../src/cube-registry';
import { SemanticCompiler } from '../src/semantic-compiler';
import { NativeSQLStrategy } from '../src/strategy-sql';
import { ObjectQLStrategy } from '../src/strategy-objectql';
import { MemoryFallbackStrategy } from '../src/strategy-memory';
import { AnalyticsService } from '../src/analytics-service';
import { AnalyticsPlugin } from '../src/plugin';
import type { CubeDefinition, AnalyticsQuery, LogicalPlan } from '../src/types';

// ============================================================================
// Fixtures
// ============================================================================

const ordersCube: CubeDefinition = {
    name: 'orders',
    title: 'Orders',
    objectName: 'orders',
    measures: [
        { name: 'count', type: 'count', field: '*' },
        { name: 'totalAmount', type: 'sum', field: 'amount' },
        { name: 'avgAmount', type: 'avg', field: 'amount' },
    ],
    dimensions: [
        { name: 'status', type: 'string', field: 'status' },
        { name: 'region', type: 'string', field: 'region' },
        { name: 'createdAt', type: 'time', field: 'created_at' },
    ],
};

const sampleRows = [
    { _id: '1', status: 'active', region: 'US', amount: 100, created_at: '2025-01-01' },
    { _id: '2', status: 'active', region: 'US', amount: 200, created_at: '2025-01-02' },
    { _id: '3', status: 'cancelled', region: 'EU', amount: 50, created_at: '2025-01-03' },
    { _id: '4', status: 'active', region: 'EU', amount: 150, created_at: '2025-01-04' },
    { _id: '5', status: 'cancelled', region: 'US', amount: 75, created_at: '2025-01-05' },
];

/** Mock driver with find() only — simulates a basic driver */
function createMockFindDriver(rows: Record<string, unknown>[] = sampleRows) {
    return {
        name: 'mock-find',
        supports: { queryAggregations: false },
        find: async (_objectName: string, _query: any) => [...rows],
    };
}

/** Mock driver with aggregate() — simulates a MongoDB-like driver */
function createMockAggregateDriver(rows: Record<string, unknown>[] = sampleRows) {
    return {
        name: 'mock-aggregate',
        supports: { queryAggregations: true },
        aggregate: async (_objectName: string, query: any) => {
            // Simple in-JS aggregation for test verification
            const groupBy = query.groupBy as string[] | undefined;
            const aggregations = query.aggregations as Array<{ function: string; field: string; alias: string }>;

            if (!groupBy || groupBy.length === 0) {
                const result: Record<string, unknown> = {};
                for (const agg of aggregations) {
                    if (agg.function === 'count') {
                        result[agg.alias] = rows.length;
                    } else if (agg.function === 'sum') {
                        result[agg.alias] = rows.reduce((s, r) => s + (r[agg.field] as number || 0), 0);
                    } else if (agg.function === 'avg') {
                        const vals = rows.map(r => r[agg.field] as number).filter(v => typeof v === 'number');
                        result[agg.alias] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
                    }
                }
                return [result];
            }

            // Group
            const groups = new Map<string, Record<string, unknown>[]>();
            for (const row of rows) {
                const key = groupBy.map(g => String(row[g])).join('|||');
                if (!groups.has(key)) groups.set(key, []);
                groups.get(key)!.push(row);
            }

            const results: Record<string, unknown>[] = [];
            for (const [, groupRows] of groups) {
                const result: Record<string, unknown> = {};
                for (const g of groupBy) {
                    result[g] = groupRows[0][g];
                }
                for (const agg of aggregations) {
                    if (agg.function === 'count') {
                        result[agg.alias] = groupRows.length;
                    } else if (agg.function === 'sum') {
                        result[agg.alias] = groupRows.reduce((s, r) => s + (r[agg.field] as number || 0), 0);
                    } else if (agg.function === 'avg') {
                        const vals = groupRows.map(r => r[agg.field] as number).filter(v => typeof v === 'number');
                        result[agg.alias] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
                    }
                }
                results.push(result);
            }
            return results;
        },
        find: async () => [...rows],
    };
}

// ============================================================================
// CubeRegistry Tests
// ============================================================================

describe('CubeRegistry', () => {
    let registry: CubeRegistry;

    beforeEach(() => {
        registry = new CubeRegistry();
    });

    it('should register and retrieve a cube by name', () => {
        registry.register(ordersCube);
        expect(registry.get('orders')).toEqual(ordersCube);
    });

    it('should list all registered cubes', () => {
        registry.register(ordersCube);
        registry.register({ ...ordersCube, name: 'products', objectName: 'products' });
        expect(registry.list()).toHaveLength(2);
    });

    it('should convert CubeDefinition to CubeMeta', () => {
        registry.register(ordersCube);
        const meta = registry.getMeta('orders');
        expect(meta).toHaveLength(1);
        expect(meta[0].name).toBe('orders');
        expect(meta[0].measures).toHaveLength(3);
        expect(meta[0].measures[0].name).toBe('orders.count');
        expect(meta[0].dimensions).toHaveLength(3);
        expect(meta[0].dimensions[0].name).toBe('orders.status');
    });

    it('should return empty array for unknown cube in getMeta', () => {
        expect(registry.getMeta('nonexistent')).toEqual([]);
    });

    it('should return all cubes when getMeta is called without a name', () => {
        registry.register(ordersCube);
        registry.register({ ...ordersCube, name: 'products', objectName: 'products' });
        const meta = registry.getMeta();
        expect(meta).toHaveLength(2);
    });

    it('should auto-discover cubes from metadata', () => {
        const metadata = {
            list: (_type: string) => [
                {
                    name: 'invoices',
                    fields: {
                        total: { type: 'number' },
                        status: { type: 'select' },
                        createdAt: { type: 'datetime' },
                    },
                },
            ],
        };
        registry.discoverFromMetadata(metadata as any);
        const cube = registry.get('invoices');
        expect(cube).toBeDefined();
        expect(cube!.measures.length).toBeGreaterThanOrEqual(1); // at least count
        expect(cube!.dimensions.length).toBeGreaterThanOrEqual(1);
    });

    it('should not overwrite manifest cubes during auto-discovery', () => {
        registry.register(ordersCube);
        const metadata = {
            list: () => [{ name: 'orders', fields: { foo: { type: 'string' } } }],
        };
        registry.discoverFromMetadata(metadata as any);
        // Should keep the manifest cube intact
        expect(registry.get('orders')).toEqual(ordersCube);
    });
});

// ============================================================================
// SemanticCompiler Tests
// ============================================================================

describe('SemanticCompiler', () => {
    let registry: CubeRegistry;
    let compiler: SemanticCompiler;

    beforeEach(() => {
        registry = new CubeRegistry();
        registry.register(ordersCube);
        compiler = new SemanticCompiler(registry);
    });

    it('should compile a simple count query', () => {
        const query: AnalyticsQuery = {
            cube: 'orders',
            measures: ['orders.count'],
        };
        const plan = compiler.compile(query);
        expect(plan.objectName).toBe('orders');
        expect(plan.measures).toHaveLength(1);
        expect(plan.measures[0].aggregation).toBe('count');
        expect(plan.measures[0].field).toBe('*');
    });

    it('should compile query with dimensions and group-by', () => {
        const query: AnalyticsQuery = {
            cube: 'orders',
            measures: ['orders.totalAmount'],
            dimensions: ['orders.status'],
        };
        const plan = compiler.compile(query);
        expect(plan.measures[0].aggregation).toBe('sum');
        expect(plan.dimensions).toHaveLength(1);
        expect(plan.dimensions[0].field).toBe('status');
    });

    it('should compile query with filters', () => {
        const query: AnalyticsQuery = {
            cube: 'orders',
            measures: ['orders.count'],
            filters: [
                { member: 'orders.status', operator: 'equals', values: ['active'] },
            ],
        };
        const plan = compiler.compile(query);
        expect(plan.filters).toHaveLength(1);
        expect(plan.filters[0].field).toBe('status');
        expect(plan.filters[0].operator).toBe('equals');
    });

    it('should infer cube name from measure reference', () => {
        const query: AnalyticsQuery = {
            measures: ['orders.count'],
        };
        const plan = compiler.compile(query);
        expect(plan.objectName).toBe('orders');
    });

    it('should throw for unknown cube', () => {
        const query: AnalyticsQuery = {
            cube: 'nonexistent',
            measures: ['nonexistent.count'],
        };
        expect(() => compiler.compile(query)).toThrow(/Cube 'nonexistent' is not registered/);
    });

    it('should throw for unknown measure', () => {
        const query: AnalyticsQuery = {
            cube: 'orders',
            measures: ['orders.unknownMeasure'],
        };
        expect(() => compiler.compile(query)).toThrow(/Measure.*not found/);
    });

    it('should throw for unknown dimension', () => {
        const query: AnalyticsQuery = {
            cube: 'orders',
            measures: ['orders.count'],
            dimensions: ['orders.unknownDim'],
        };
        expect(() => compiler.compile(query)).toThrow(/Dimension.*not found/);
    });

    it('should handle limit, offset, and order', () => {
        const query: AnalyticsQuery = {
            cube: 'orders',
            measures: ['orders.count'],
            limit: 10,
            offset: 5,
            order: { 'orders__count': 'desc' },
        };
        const plan = compiler.compile(query);
        expect(plan.limit).toBe(10);
        expect(plan.offset).toBe(5);
        expect(plan.order).toEqual({ 'orders__count': 'desc' });
    });
});

// ============================================================================
// MemoryFallbackStrategy Tests
// ============================================================================

describe('MemoryFallbackStrategy', () => {
    let strategy: MemoryFallbackStrategy;

    beforeEach(() => {
        strategy = new MemoryFallbackStrategy();
    });

    it('should compute count(*)', async () => {
        const plan: LogicalPlan = {
            objectName: 'orders',
            datasource: 'default',
            measures: [{ cube: 'orders', measure: 'count', aggregation: 'count', field: '*', alias: 'orders__count' }],
            dimensions: [],
            filters: [],
            timeDimensions: [],
        };
        const driver = createMockFindDriver();
        const result = await strategy.execute(plan, driver);
        expect(result.rows).toHaveLength(1);
        expect(result.rows[0]['orders__count']).toBe(5);
    });

    it('should compute sum grouped by dimension', async () => {
        const plan: LogicalPlan = {
            objectName: 'orders',
            datasource: 'default',
            measures: [{ cube: 'orders', measure: 'totalAmount', aggregation: 'sum', field: 'amount', alias: 'orders__totalAmount' }],
            dimensions: [{ cube: 'orders', dimension: 'status', field: 'status', alias: 'orders__status' }],
            filters: [],
            timeDimensions: [],
        };
        const driver = createMockFindDriver();
        const result = await strategy.execute(plan, driver);
        expect(result.rows).toHaveLength(2); // active + cancelled

        const active = result.rows.find(r => r['orders__status'] === 'active');
        const cancelled = result.rows.find(r => r['orders__status'] === 'cancelled');
        expect(active).toBeDefined();
        expect(cancelled).toBeDefined();
        expect(active!['orders__totalAmount']).toBe(450); // 100+200+150
        expect(cancelled!['orders__totalAmount']).toBe(125); // 50+75
    });

    it('should compute avg', async () => {
        const plan: LogicalPlan = {
            objectName: 'orders',
            datasource: 'default',
            measures: [{ cube: 'orders', measure: 'avgAmount', aggregation: 'avg', field: 'amount', alias: 'orders__avgAmount' }],
            dimensions: [],
            filters: [],
            timeDimensions: [],
        };
        const driver = createMockFindDriver();
        const result = await strategy.execute(plan, driver);
        expect(result.rows[0]['orders__avgAmount']).toBe(115); // (100+200+50+150+75)/5
    });

    it('should compute min and max', async () => {
        const plan: LogicalPlan = {
            objectName: 'orders',
            datasource: 'default',
            measures: [
                { cube: 'orders', measure: 'minAmt', aggregation: 'min', field: 'amount', alias: 'orders__minAmt' },
                { cube: 'orders', measure: 'maxAmt', aggregation: 'max', field: 'amount', alias: 'orders__maxAmt' },
            ],
            dimensions: [],
            filters: [],
            timeDimensions: [],
        };
        const driver = createMockFindDriver();
        const result = await strategy.execute(plan, driver);
        expect(result.rows[0]['orders__minAmt']).toBe(50);
        expect(result.rows[0]['orders__maxAmt']).toBe(200);
    });

    it('should respect limit and offset', async () => {
        const plan: LogicalPlan = {
            objectName: 'orders',
            datasource: 'default',
            measures: [{ cube: 'orders', measure: 'count', aggregation: 'count', field: '*', alias: 'orders__count' }],
            dimensions: [{ cube: 'orders', dimension: 'status', field: 'status', alias: 'orders__status' }],
            filters: [],
            timeDimensions: [],
            limit: 1,
            offset: 0,
        };
        const driver = createMockFindDriver();
        const result = await strategy.execute(plan, driver);
        expect(result.rows).toHaveLength(1);
    });

    it('should return correct field metadata', async () => {
        const plan: LogicalPlan = {
            objectName: 'orders',
            datasource: 'default',
            measures: [{ cube: 'orders', measure: 'count', aggregation: 'count', field: '*', alias: 'orders__count' }],
            dimensions: [{ cube: 'orders', dimension: 'status', field: 'status', alias: 'orders__status' }],
            filters: [],
            timeDimensions: [],
        };
        const driver = createMockFindDriver();
        const result = await strategy.execute(plan, driver);
        expect(result.fields).toEqual([
            { name: 'orders__status', type: 'string' },
            { name: 'orders__count', type: 'number' },
        ]);
    });
});

// ============================================================================
// ObjectQLStrategy Tests
// ============================================================================

describe('ObjectQLStrategy', () => {
    let strategy: ObjectQLStrategy;

    beforeEach(() => {
        strategy = new ObjectQLStrategy();
    });

    it('should execute aggregate via driver.aggregate()', async () => {
        const plan: LogicalPlan = {
            objectName: 'orders',
            datasource: 'default',
            measures: [{ cube: 'orders', measure: 'count', aggregation: 'count', field: '*', alias: 'orders__count' }],
            dimensions: [],
            filters: [],
            timeDimensions: [],
        };
        const driver = createMockAggregateDriver();
        const result = await strategy.execute(plan, driver);
        expect(result.rows).toHaveLength(1);
        expect(result.rows[0]['orders__count']).toBe(5);
    });

    it('should group by dimension via driver.aggregate()', async () => {
        const plan: LogicalPlan = {
            objectName: 'orders',
            datasource: 'default',
            measures: [{ cube: 'orders', measure: 'totalAmount', aggregation: 'sum', field: 'amount', alias: 'orders__totalAmount' }],
            dimensions: [{ cube: 'orders', dimension: 'status', field: 'status', alias: 'orders__status' }],
            filters: [],
            timeDimensions: [],
        };
        const driver = createMockAggregateDriver();
        const result = await strategy.execute(plan, driver);
        expect(result.rows.length).toBeGreaterThanOrEqual(2);
    });

    it('should throw when driver lacks aggregate()', async () => {
        const plan: LogicalPlan = {
            objectName: 'orders',
            datasource: 'default',
            measures: [{ cube: 'orders', measure: 'count', aggregation: 'count', field: '*', alias: 'orders__count' }],
            dimensions: [],
            filters: [],
            timeDimensions: [],
        };
        const driver = { find: async () => [] }; // no aggregate
        await expect(strategy.execute(plan, driver)).rejects.toThrow(/aggregate/);
    });
});

// ============================================================================
// NativeSQLStrategy Tests (generateSql dry-run)
// ============================================================================

describe('NativeSQLStrategy', () => {
    let strategy: NativeSQLStrategy;

    beforeEach(() => {
        strategy = new NativeSQLStrategy();
    });

    it('should generate SQL for a simple count query', () => {
        const plan: LogicalPlan = {
            objectName: 'orders',
            datasource: 'default',
            measures: [{ cube: 'orders', measure: 'count', aggregation: 'count', field: '*', alias: 'orders__count' }],
            dimensions: [],
            filters: [],
            timeDimensions: [],
        };
        const { sql } = strategy.generateSql(plan);
        expect(sql).toContain('SELECT');
        expect(sql).toContain('count(*)');
        expect(sql).toContain('"orders"');
    });

    it('should generate SQL with GROUP BY', () => {
        const plan: LogicalPlan = {
            objectName: 'orders',
            datasource: 'default',
            measures: [{ cube: 'orders', measure: 'totalAmount', aggregation: 'sum', field: 'amount', alias: 'orders__totalAmount' }],
            dimensions: [{ cube: 'orders', dimension: 'status', field: 'status', alias: 'orders__status' }],
            filters: [],
            timeDimensions: [],
        };
        const { sql } = strategy.generateSql(plan);
        expect(sql).toContain('GROUP BY');
        expect(sql).toContain('sum("amount")');
        expect(sql).toContain('"status"');
    });

    it('should generate SQL with WHERE clause', () => {
        const plan: LogicalPlan = {
            objectName: 'orders',
            datasource: 'default',
            measures: [{ cube: 'orders', measure: 'count', aggregation: 'count', field: '*', alias: 'orders__count' }],
            dimensions: [],
            filters: [{ field: 'status', operator: 'equals', values: ['active'] }],
            timeDimensions: [],
        };
        const { sql, params } = strategy.generateSql(plan);
        expect(sql).toContain('WHERE');
        expect(params).toContain('active');
    });

    it('should generate SQL with LIMIT and OFFSET', () => {
        const plan: LogicalPlan = {
            objectName: 'orders',
            datasource: 'default',
            measures: [{ cube: 'orders', measure: 'count', aggregation: 'count', field: '*', alias: 'orders__count' }],
            dimensions: [],
            filters: [],
            timeDimensions: [],
            limit: 10,
            offset: 20,
        };
        const { sql } = strategy.generateSql(plan);
        expect(sql).toContain('LIMIT 10');
        expect(sql).toContain('OFFSET 20');
    });

    it('should generate SQL with ORDER BY', () => {
        const plan: LogicalPlan = {
            objectName: 'orders',
            datasource: 'default',
            measures: [{ cube: 'orders', measure: 'count', aggregation: 'count', field: '*', alias: 'orders__count' }],
            dimensions: [],
            filters: [],
            timeDimensions: [],
            order: { 'orders__count': 'desc' },
        };
        const { sql } = strategy.generateSql(plan);
        expect(sql).toContain('ORDER BY');
        expect(sql).toContain('desc');
    });

    it('should handle IN filter with multiple values', () => {
        const plan: LogicalPlan = {
            objectName: 'orders',
            datasource: 'default',
            measures: [{ cube: 'orders', measure: 'count', aggregation: 'count', field: '*', alias: 'orders__count' }],
            dimensions: [],
            filters: [{ field: 'status', operator: 'in', values: ['active', 'cancelled'] }],
            timeDimensions: [],
        };
        const { sql, params } = strategy.generateSql(plan);
        expect(sql).toContain('IN');
        expect(params).toContain('active');
        expect(params).toContain('cancelled');
    });

    it('should generate countDistinct SQL', () => {
        const plan: LogicalPlan = {
            objectName: 'orders',
            datasource: 'default',
            measures: [{ cube: 'orders', measure: 'uniqueStatus', aggregation: 'countDistinct', field: 'status', alias: 'orders__uniqueStatus' }],
            dimensions: [],
            filters: [],
            timeDimensions: [],
        };
        const { sql } = strategy.generateSql(plan);
        expect(sql).toContain('count(distinct "status")');
    });
});

// ============================================================================
// AnalyticsService Tests
// ============================================================================

describe('AnalyticsService', () => {
    let registry: CubeRegistry;
    let service: AnalyticsService;

    beforeEach(() => {
        registry = new CubeRegistry();
        registry.register(ordersCube);
    });

    it('should dispatch to MemoryFallbackStrategy for basic drivers', async () => {
        const driver = createMockFindDriver();
        service = new AnalyticsService(registry, { default: driver });

        const result = await service.query({
            cube: 'orders',
            measures: ['orders.count'],
        });

        expect(result.rows).toHaveLength(1);
        expect(result.rows[0]['orders__count']).toBe(5);
    });

    it('should dispatch to ObjectQLStrategy for aggregate-capable drivers', async () => {
        const driver = createMockAggregateDriver();
        service = new AnalyticsService(registry, { default: driver });

        const result = await service.query({
            cube: 'orders',
            measures: ['orders.count'],
        });

        expect(result.rows).toHaveLength(1);
        expect(result.rows[0]['orders__count']).toBe(5);
    });

    it('should correctly select strategy based on driver capabilities', () => {
        const findDriver = createMockFindDriver();
        const aggDriver = createMockAggregateDriver();
        const sqlDriver = { knex: {}, find: async () => [], supports: { queryAggregations: true } };

        service = new AnalyticsService(registry, { default: findDriver });
        expect(service.selectStrategy(findDriver).name).toBe('memory-fallback');
        expect(service.selectStrategy(aggDriver).name).toBe('objectql-aggregate');
        expect(service.selectStrategy(sqlDriver).name).toBe('native-sql');
    });

    it('should return getMeta for registered cubes', async () => {
        service = new AnalyticsService(registry, { default: createMockFindDriver() });
        const meta = await service.getMeta();
        expect(meta).toHaveLength(1);
        expect(meta[0].name).toBe('orders');
    });

    it('should return getMeta for specific cube', async () => {
        service = new AnalyticsService(registry, { default: createMockFindDriver() });
        const meta = await service.getMeta('orders');
        expect(meta).toHaveLength(1);
    });

    it('should generate SQL via generateSql()', async () => {
        service = new AnalyticsService(registry, { default: createMockFindDriver() });
        const { sql } = await service.generateSql({
            cube: 'orders',
            measures: ['orders.count'],
        });
        expect(sql).toContain('count(*)');
        expect(sql).toContain('"orders"');
    });

    it('should throw for unknown datasource', async () => {
        const cube: CubeDefinition = {
            ...ordersCube,
            name: 'remote',
            objectName: 'remote',
            datasource: 'remote-db',
        };
        registry.register(cube);
        service = new AnalyticsService(registry, { default: createMockFindDriver() });

        await expect(service.query({
            cube: 'remote',
            measures: ['remote.count'],
        })).rejects.toThrow(/Datasource 'remote-db' not found/);
    });

    it('should support grouped query with filter via MemoryFallback', async () => {
        const driver = createMockFindDriver();
        service = new AnalyticsService(registry, { default: driver });

        const result = await service.query({
            cube: 'orders',
            measures: ['orders.totalAmount'],
            dimensions: ['orders.status'],
        });

        expect(result.rows.length).toBeGreaterThanOrEqual(2);
        expect(result.fields).toEqual(
            expect.arrayContaining([
                { name: 'orders__status', type: 'string' },
                { name: 'orders__totalAmount', type: 'number' },
            ]),
        );
    });
});

// ============================================================================
// AnalyticsPlugin Tests
// ============================================================================

describe('AnalyticsPlugin', () => {
    it('should have correct name and version', () => {
        const plugin = new AnalyticsPlugin();
        expect(plugin.name).toBe('@objectql/plugin-analytics');
        expect(plugin.version).toBe('4.2.2');
    });

    it('should install and register service on kernel', async () => {
        const kernel: any = {
            getAllDrivers: () => [createMockFindDriver()],
            metadata: {
                list: () => [],
            },
        };

        let registeredService: any = null;
        const ctx: any = {
            engine: kernel,
            registerService: (_name: string, svc: any) => {
                registeredService = svc;
            },
        };

        const plugin = new AnalyticsPlugin({ cubes: [ordersCube] });
        await plugin.install(ctx);

        expect(kernel.analyticsService).toBeDefined();
        expect(registeredService).toBeDefined();
    });

    it('should warn when no datasources are available', async () => {
        const kernel: any = { getAllDrivers: () => [] };
        const ctx: any = { engine: kernel };

        const plugin = new AnalyticsPlugin();
        // Should not throw
        await plugin.install(ctx);
        expect(kernel.analyticsService).toBeUndefined();
    });

    it('should auto-discover cubes from metadata', async () => {
        const kernel: any = {
            getAllDrivers: () => [createMockFindDriver()],
            metadata: {
                list: () => [
                    {
                        name: 'products',
                        fields: {
                            price: { type: 'number' },
                            category: { type: 'string' },
                        },
                    },
                ],
            },
        };
        const ctx: any = { engine: kernel, registerService: () => {} };

        const plugin = new AnalyticsPlugin({ autoDiscover: true });
        await plugin.install(ctx);

        expect(kernel.analyticsService).toBeDefined();
        const meta = await kernel.analyticsService.getMeta('products');
        expect(meta).toHaveLength(1);
        expect(meta[0].name).toBe('products');
    });

    it('should support the init() adapter for @objectstack/core', async () => {
        const kernel: any = {
            getAllDrivers: () => [createMockFindDriver()],
            metadata: { list: () => [] },
        };
        const pluginCtx: any = {
            getKernel: () => kernel,
            registerService: () => {},
        };

        const plugin = new AnalyticsPlugin({ cubes: [ordersCube] });
        await plugin.init(pluginCtx);
        expect(kernel.analyticsService).toBeDefined();
    });
});
