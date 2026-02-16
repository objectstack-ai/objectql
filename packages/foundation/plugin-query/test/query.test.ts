/**
 * @objectql/plugin-query — Core Module Tests
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { FilterTranslator } from '../src/filter-translator';
import { QueryBuilder } from '../src/query-builder';
import { QueryService } from '../src/query-service';
import { QueryAnalyzer } from '../src/query-analyzer';
import { ObjectQLError } from '@objectql/types';

// ---------------------------------------------------------------------------
// FilterTranslator
// ---------------------------------------------------------------------------
describe('FilterTranslator', () => {
    let translator: FilterTranslator;

    beforeEach(() => {
        translator = new FilterTranslator();
    });

    it('should return undefined for undefined input', () => {
        expect(translator.translate(undefined)).toBeUndefined();
    });

    it('should return undefined for empty object', () => {
        expect(translator.translate({})).toBeUndefined();
    });

    it('should pass through simple filters unchanged', () => {
        const filter = { status: 'active' };
        expect(translator.translate(filter)).toEqual({ status: 'active' });
    });

    it('should pass through complex filters unchanged', () => {
        const filter = {
            age: { $gte: 18 },
            $or: [{ status: 'active' }, { role: 'admin' }],
        };
        expect(translator.translate(filter)).toEqual(filter);
    });

    it('should pass through nested $and/$or filters', () => {
        const filter = {
            $and: [
                { name: 'test' },
                { $or: [{ x: 1 }, { y: 2 }] },
            ],
        };
        expect(translator.translate(filter)).toEqual(filter);
    });
});

// ---------------------------------------------------------------------------
// QueryBuilder
// ---------------------------------------------------------------------------
describe('QueryBuilder', () => {
    let builder: QueryBuilder;

    beforeEach(() => {
        builder = new QueryBuilder();
    });

    it('should build AST with only the object name for empty query', () => {
        const ast = builder.build('accounts', {});
        expect(ast).toEqual({ object: 'accounts' });
    });

    it('should map fields', () => {
        const ast = builder.build('accounts', { fields: ['name', 'email'] });
        expect(ast.fields).toEqual(['name', 'email']);
        expect(ast.object).toBe('accounts');
    });

    it('should map where through FilterTranslator', () => {
        const ast = builder.build('accounts', { where: { status: 'active' } });
        expect(ast.where).toEqual({ status: 'active' });
    });

    it('should return undefined where for empty filter', () => {
        const ast = builder.build('accounts', { where: {} });
        expect(ast.where).toBeUndefined();
    });

    it('should map orderBy', () => {
        const orderBy = [{ field: 'name', direction: 'asc' as const }];
        const ast = builder.build('accounts', { orderBy });
        expect(ast.orderBy).toEqual(orderBy);
    });

    it('should map offset', () => {
        const ast = builder.build('accounts', { offset: 20 });
        expect(ast.offset).toBe(20);
    });

    it('should map limit to top', () => {
        const ast = builder.build('accounts', { limit: 50 });
        expect(ast.top).toBe(50);
    });

    it('should map expand', () => {
        const expand = { contacts: { fields: ['name'] } };
        const ast = builder.build('accounts', { expand });
        expect(ast.expand).toEqual(expand);
    });

    it('should map groupBy', () => {
        const ast = builder.build('accounts', { groupBy: ['status'] });
        expect(ast.groupBy).toEqual(['status']);
    });

    it('should map aggregations', () => {
        const aggregations = [{ func: 'count' as const, field: '*', alias: 'total' }];
        const ast = builder.build('accounts', { aggregations });
        expect(ast.aggregations).toEqual(aggregations);
    });

    it('should map having', () => {
        const having = { total: { $gt: 5 } };
        const ast = builder.build('accounts', { having });
        expect(ast.having).toEqual(having);
    });

    it('should map distinct', () => {
        const ast = builder.build('accounts', { distinct: true });
        expect(ast.distinct).toBe(true);
    });

    it('should only include present properties', () => {
        const ast = builder.build('accounts', { fields: ['name'] });
        expect(ast).toEqual({ object: 'accounts', fields: ['name'] });
        expect(ast).not.toHaveProperty('where');
        expect(ast).not.toHaveProperty('orderBy');
        expect(ast).not.toHaveProperty('top');
        expect(ast).not.toHaveProperty('offset');
    });

    it('should handle all properties together', () => {
        const query = {
            fields: ['name'],
            where: { status: 'active' },
            orderBy: [{ field: 'name', direction: 'asc' as const }],
            offset: 10,
            limit: 25,
            distinct: true,
        };
        const ast = builder.build('accounts', query);
        expect(ast.object).toBe('accounts');
        expect(ast.fields).toEqual(['name']);
        expect(ast.where).toEqual({ status: 'active' });
        expect(ast.orderBy).toEqual(query.orderBy);
        expect(ast.offset).toBe(10);
        expect(ast.top).toBe(25);
        expect(ast.distinct).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// QueryService
// ---------------------------------------------------------------------------
describe('QueryService', () => {
    let service: QueryService;
    let mockDriver: any;
    let mockMetadata: any;

    const accountSchema = {
        name: 'accounts',
        fields: { name: { type: 'text' }, status: { type: 'text' } },
        datasource: 'default',
    };

    beforeEach(() => {
        mockDriver = {
            find: jest.fn().mockResolvedValue([{ id: '1', name: 'Acme' }]),
            findOne: jest.fn().mockResolvedValue({ id: '1', name: 'Acme' }),
            count: jest.fn().mockResolvedValue(42),
            aggregate: jest.fn().mockResolvedValue([{ total: 100 }]),
            directQuery: jest.fn().mockResolvedValue([{ id: '1' }]),
            executeQuery: jest.fn().mockResolvedValue({ value: [{ id: '1' }], count: 1 }),
            get: jest.fn().mockResolvedValue({ id: '1', name: 'Acme' }),
            query: jest.fn().mockResolvedValue([{ id: '1' }]),
        };

        mockMetadata = {
            get: jest.fn().mockImplementation((_type: string, name: string) => {
                if (name === 'accounts') return accountSchema;
                return undefined;
            }),
        };

        service = new QueryService({ default: mockDriver }, mockMetadata);
    });

    // -- find ---------------------------------------------------------------
    describe('find', () => {
        it('should execute a basic find query', async () => {
            const result = await service.find('accounts', {});
            expect(result.value).toEqual([{ id: '1', name: 'Acme' }]);
            expect(mockDriver.find).toHaveBeenCalledWith('accounts', {}, expect.any(Object));
        });

        it('should handle driver returning array directly', async () => {
            mockDriver.find.mockResolvedValue([{ id: '2' }]);
            const result = await service.find('accounts');
            expect(result.value).toEqual([{ id: '2' }]);
        });

        it('should handle driver returning { value, count } object', async () => {
            mockDriver.find.mockResolvedValue({ value: [{ id: '3' }], count: 10 });
            const result = await service.find('accounts');
            expect(result.value).toEqual([{ id: '3' }]);
            expect(result.count).toBe(10);
        });

        it('should include profiling data when profile option is true', async () => {
            const result = await service.find('accounts', {}, { profile: true });
            expect(result.profile).toBeDefined();
            expect(result.profile!.executionTime).toBeGreaterThanOrEqual(0);
            expect(result.profile!.ast).toBeDefined();
        });

        it('should not include profiling data when profile is false', async () => {
            const result = await service.find('accounts', {}, { profile: false });
            expect(result.profile).toBeUndefined();
        });

        it('should fallback to executeQuery when find is missing', async () => {
            delete mockDriver.find;
            const result = await service.find('accounts', {});
            expect(result.value).toEqual([{ id: '1' }]);
            expect(mockDriver.executeQuery).toHaveBeenCalled();
        });

        it('should throw when driver has no find or executeQuery', async () => {
            delete mockDriver.find;
            delete mockDriver.executeQuery;
            await expect(service.find('accounts')).rejects.toThrow(ObjectQLError);
        });

        it('should pass transaction and driverOptions', async () => {
            await service.find('accounts', {}, { transaction: 'tx1', driverOptions: { timeout: 5000 } });
            expect(mockDriver.find).toHaveBeenCalledWith(
                'accounts',
                {},
                expect.objectContaining({ transaction: 'tx1', timeout: 5000 }),
            );
        });
    });

    // -- findOne -------------------------------------------------------------
    describe('findOne', () => {
        it('should find a single record by id', async () => {
            const result = await service.findOne('accounts', '1');
            expect(result.value).toEqual({ id: '1', name: 'Acme' });
            expect(mockDriver.findOne).toHaveBeenCalledWith('accounts', '1', expect.any(Object));
        });

        it('should fallback to get when findOne is missing', async () => {
            delete mockDriver.findOne;
            const result = await service.findOne('accounts', '1');
            expect(result.value).toEqual({ id: '1', name: 'Acme' });
            expect(mockDriver.get).toHaveBeenCalledWith('accounts', '1', expect.any(Object));
        });

        it('should fallback to executeQuery when findOne and get are missing', async () => {
            delete mockDriver.findOne;
            delete mockDriver.get;
            const result = await service.findOne('accounts', '1');
            expect(result.value).toEqual({ id: '1' });
            expect(mockDriver.executeQuery).toHaveBeenCalled();
        });

        it('should throw when driver has no findOne/get/executeQuery', async () => {
            delete mockDriver.findOne;
            delete mockDriver.get;
            delete mockDriver.executeQuery;
            await expect(service.findOne('accounts', '1')).rejects.toThrow(ObjectQLError);
        });

        it('should include profiling data when profile option is true', async () => {
            const result = await service.findOne('accounts', '1', { profile: true });
            expect(result.profile).toBeDefined();
            expect(result.profile!.executionTime).toBeGreaterThanOrEqual(0);
            expect(result.profile!.rowsScanned).toBe(1);
        });

        it('should report rowsScanned 0 when record not found', async () => {
            mockDriver.findOne.mockResolvedValue(null);
            const result = await service.findOne('accounts', '999', { profile: true });
            expect(result.value).toBeNull();
            expect(result.profile!.rowsScanned).toBe(0);
        });
    });

    // -- count --------------------------------------------------------------
    describe('count', () => {
        it('should count records without filter', async () => {
            const result = await service.count('accounts');
            expect(result.value).toBe(42);
            expect(mockDriver.count).toHaveBeenCalledWith('accounts', {}, expect.any(Object));
        });

        it('should count records with filter', async () => {
            const where = { status: 'active' };
            await service.count('accounts', where);
            expect(mockDriver.count).toHaveBeenCalledWith('accounts', where, expect.any(Object));
        });

        it('should fallback to executeQuery when count is missing', async () => {
            delete mockDriver.count;
            mockDriver.executeQuery.mockResolvedValue({ value: [{ id: '1' }, { id: '2' }], count: 5 });
            const result = await service.count('accounts');
            expect(result.value).toBe(5);
        });

        it('should fallback to value.length when executeQuery has no count', async () => {
            delete mockDriver.count;
            mockDriver.executeQuery.mockResolvedValue({ value: [{ id: '1' }, { id: '2' }] });
            const result = await service.count('accounts');
            expect(result.value).toBe(2);
        });

        it('should throw when driver has no count or executeQuery', async () => {
            delete mockDriver.count;
            delete mockDriver.executeQuery;
            await expect(service.count('accounts')).rejects.toThrow(ObjectQLError);
        });

        it('should include profiling data when profile option is true', async () => {
            const result = await service.count('accounts', undefined, { profile: true });
            expect(result.profile).toBeDefined();
            expect(result.profile!.ast).toBeDefined();
        });
    });

    // -- aggregate ----------------------------------------------------------
    describe('aggregate', () => {
        it('should execute an aggregate query', async () => {
            const query = { aggregations: [{ func: 'sum' as const, field: 'amount', alias: 'total' }] };
            const result = await service.aggregate('accounts', query);
            expect(result.value).toEqual([{ total: 100 }]);
            expect(mockDriver.aggregate).toHaveBeenCalledWith('accounts', query, expect.any(Object));
        });

        it('should throw when driver does not support aggregate', async () => {
            delete mockDriver.aggregate;
            await expect(service.aggregate('accounts', {})).rejects.toThrow(ObjectQLError);
            await expect(service.aggregate('accounts', {})).rejects.toThrow(/aggregate/i);
        });

        it('should include profiling data when profile option is true', async () => {
            const result = await service.aggregate('accounts', {}, { profile: true });
            expect(result.profile).toBeDefined();
            expect(result.profile!.executionTime).toBeGreaterThanOrEqual(0);
        });
    });

    // -- directQuery --------------------------------------------------------
    describe('directQuery', () => {
        it('should execute a direct query via directQuery', async () => {
            const result = await service.directQuery('accounts', 'SELECT * FROM accounts', ['p1']);
            expect(result.value).toEqual([{ id: '1' }]);
            expect(mockDriver.directQuery).toHaveBeenCalledWith('SELECT * FROM accounts', ['p1']);
        });

        it('should fallback to query when directQuery is missing', async () => {
            delete mockDriver.directQuery;
            const result = await service.directQuery('accounts', 'SELECT 1');
            expect(result.value).toEqual([{ id: '1' }]);
            expect(mockDriver.query).toHaveBeenCalledWith('SELECT 1', undefined);
        });

        it('should throw when driver has no directQuery or query', async () => {
            delete mockDriver.directQuery;
            delete mockDriver.query;
            await expect(service.directQuery('accounts', 'SELECT 1')).rejects.toThrow(ObjectQLError);
        });

        it('should include profiling data when profile option is true', async () => {
            const result = await service.directQuery('accounts', 'SELECT 1', [], { profile: true });
            expect(result.profile).toBeDefined();
            expect(result.profile!.executionTime).toBeGreaterThanOrEqual(0);
        });
    });

    // -- error handling -----------------------------------------------------
    describe('error handling', () => {
        it('should throw ObjectQLError when object is not found', async () => {
            await expect(service.find('unknown_object')).rejects.toThrow(ObjectQLError);
            await expect(service.find('unknown_object')).rejects.toThrow(/not found/i);
        });

        it('should throw ObjectQLError when datasource is not found', async () => {
            mockMetadata.get.mockReturnValue({ name: 'custom', fields: {}, datasource: 'pg' });
            await expect(service.find('custom')).rejects.toThrow(ObjectQLError);
            await expect(service.find('custom')).rejects.toThrow(/datasource/i);
        });

        it('should use default datasource when none specified', async () => {
            mockMetadata.get.mockReturnValue({ name: 'tasks', fields: {} });
            await service.find('tasks');
            expect(mockDriver.find).toHaveBeenCalled();
        });
    });
});

// ---------------------------------------------------------------------------
// QueryAnalyzer
// ---------------------------------------------------------------------------
describe('QueryAnalyzer', () => {
    let analyzer: QueryAnalyzer;
    let mockQueryService: any;
    let mockMetadata: any;

    const accountSchema = {
        name: 'accounts',
        fields: {
            name: { type: 'text' },
            email: { type: 'text' },
            status: { type: 'text' },
            age: { type: 'number' },
            city: { type: 'text' },
            country: { type: 'text' },
            department: { type: 'text' },
            role: { type: 'text' },
            createdAt: { type: 'datetime' },
            updatedAt: { type: 'datetime' },
            score: { type: 'number' },
        },
        indexes: [
            { name: 'idx_status', fields: ['status'] },
            { name: 'idx_email', fields: ['email'] },
            { name: 'idx_name_status', fields: ['name', 'status'] },
        ],
    };

    beforeEach(() => {
        mockQueryService = {
            find: jest.fn().mockResolvedValue({
                value: [{ id: '1' }, { id: '2' }],
                profile: { executionTime: 15, rowsScanned: 2 },
            }),
        };

        mockMetadata = {
            get: jest.fn().mockImplementation((_type: string, name: string) => {
                if (name === 'accounts') return accountSchema;
                return undefined;
            }),
        };

        analyzer = new QueryAnalyzer(mockQueryService, mockMetadata);
    });

    // -- explain ------------------------------------------------------------
    describe('explain', () => {
        it('should generate an execution plan', async () => {
            const plan = await analyzer.explain('accounts', { where: { status: 'active' } });
            expect(plan.ast).toBeDefined();
            expect(plan.ast.object).toBe('accounts');
            expect(plan.complexity).toBeGreaterThanOrEqual(0);
            expect(plan.complexity).toBeLessThanOrEqual(100);
        });

        it('should detect applicable indexes', async () => {
            const plan = await analyzer.explain('accounts', { where: { status: 'active' } });
            expect(plan.indexes).toContain('idx_status');
        });

        it('should detect composite index by first field', async () => {
            const plan = await analyzer.explain('accounts', { where: { name: 'Acme' } });
            expect(plan.indexes).toContain('idx_name_status');
        });

        it('should return no indexes when filter has no matching index', async () => {
            const plan = await analyzer.explain('accounts', { where: { age: { $gt: 18 } } });
            expect(plan.indexes).toEqual([]);
        });

        it('should return no indexes when there is no filter', async () => {
            const plan = await analyzer.explain('accounts', {});
            expect(plan.indexes).toEqual([]);
        });

        it('should throw for unknown object', async () => {
            await expect(analyzer.explain('unknown', {})).rejects.toThrow(ObjectQLError);
        });
    });

    // -- complexity ---------------------------------------------------------
    describe('complexity scoring', () => {
        it('should have base complexity of 10 for empty query', async () => {
            // Base = 10, no limit => no reduction, but also 0 filters => no penalty beyond base
            const plan = await analyzer.explain('accounts', {});
            expect(plan.complexity).toBe(10);
        });

        it('should increase complexity with filters', async () => {
            const plan = await analyzer.explain('accounts', {
                where: { status: 'active', name: 'Acme' },
            });
            // base(10) + 2 filters * 5 = 20
            expect(plan.complexity).toBe(20);
        });

        it('should increase complexity with logical operators', async () => {
            const plan = await analyzer.explain('accounts', {
                where: { $or: [{ status: 'active' }], name: 'test' },
            });
            // base(10) + 2 keys * 5 = 20 + logical(15) = 35
            expect(plan.complexity).toBe(35);
        });

        it('should decrease complexity with field selection and limit', async () => {
            const plan = await analyzer.explain('accounts', {
                fields: ['name'],
                limit: 10,
            });
            // base(10) - fields(5) - limit(5) = 0
            expect(plan.complexity).toBe(0);
        });

        it('should increase complexity with orderBy', async () => {
            const plan = await analyzer.explain('accounts', {
                orderBy: [{ field: 'name', direction: 'asc' as const }],
            });
            // base(10) + 1 sort * 3 = 13
            expect(plan.complexity).toBe(13);
        });

        it('should cap complexity at 100', async () => {
            const manyFilters: Record<string, unknown> = {};
            for (let i = 0; i < 25; i++) manyFilters[`field_${i}`] = i;
            manyFilters.$or = [{ a: 1 }];
            const plan = await analyzer.explain('accounts', { where: manyFilters as any });
            expect(plan.complexity).toBeLessThanOrEqual(100);
        });
    });

    // -- warnings -----------------------------------------------------------
    describe('warnings', () => {
        it('should warn about no filters', async () => {
            const plan = await analyzer.explain('accounts', {});
            expect(plan.warnings).toContain('No filters specified - this will scan all records');
        });

        it('should warn about no limit', async () => {
            const plan = await analyzer.explain('accounts', {});
            expect(plan.warnings).toContain('No limit specified - consider adding pagination');
        });

        it('should warn about selecting all fields on large schemas', async () => {
            const plan = await analyzer.explain('accounts', {});
            expect(plan.warnings.some(w => w.includes('Selecting all'))).toBe(true);
        });

        it('should not warn about all fields when fields are specified', async () => {
            const plan = await analyzer.explain('accounts', { fields: ['name'] });
            expect(plan.warnings.some(w => w.includes('Selecting all'))).toBe(false);
        });

        it('should warn about complex filters without indexes', async () => {
            const where: Record<string, unknown> = {};
            for (let i = 0; i < 6; i++) where[`noindex_${i}`] = i;
            const plan = await analyzer.explain('accounts', { where: where as any });
            expect(plan.warnings.some(w => w.includes('Complex filters'))).toBe(true);
        });
    });

    // -- suggestions --------------------------------------------------------
    describe('suggestions', () => {
        it('should suggest adding limit', async () => {
            const plan = await analyzer.explain('accounts', {});
            expect(plan.suggestions.some(s => s.includes('limit'))).toBe(true);
        });

        it('should suggest adding indexes for filtered fields', async () => {
            const plan = await analyzer.explain('accounts', { where: { age: { $gt: 18 } } });
            expect(plan.suggestions.some(s => s.includes('index') && s.includes('age'))).toBe(true);
        });

        it('should suggest field selection', async () => {
            const plan = await analyzer.explain('accounts', {});
            expect(plan.suggestions.some(s => s.includes('Select only required fields'))).toBe(true);
        });

        it('should suggest composite index for multiple filter fields', async () => {
            const plan = await analyzer.explain('accounts', {
                where: { age: { $gt: 18 }, city: 'NYC' },
            });
            expect(plan.suggestions.some(s => s.includes('composite index'))).toBe(true);
        });
    });

    // -- estimateRows -------------------------------------------------------
    describe('row estimation', () => {
        it('should return -1 for queries without filters', async () => {
            const plan = await analyzer.explain('accounts', {});
            expect(plan.estimatedRows).toBe(-1);
        });

        it('should estimate fewer rows with more filters', async () => {
            const plan1 = await analyzer.explain('accounts', { where: { status: 'active' } });
            const plan2 = await analyzer.explain('accounts', { where: { status: 'active', name: 'A' } });
            expect(plan2.estimatedRows!).toBeLessThan(plan1.estimatedRows!);
        });

        it('should cap estimation at the limit value', async () => {
            const plan = await analyzer.explain('accounts', { where: { status: 'a' }, limit: 5 });
            expect(plan.estimatedRows!).toBeLessThanOrEqual(5);
        });
    });

    // -- profile ------------------------------------------------------------
    describe('profile', () => {
        it('should profile a query execution', async () => {
            const result = await analyzer.profile('accounts', { where: { status: 'active' } });
            expect(result.executionTime).toBeGreaterThanOrEqual(0);
            expect(result.rowsReturned).toBe(2);
            expect(result.rowsScanned).toBeGreaterThanOrEqual(0);
            expect(result.plan).toBeDefined();
            expect(result.efficiency).toBeDefined();
        });

        it('should call queryService.find with profile enabled', async () => {
            await analyzer.profile('accounts', {});
            expect(mockQueryService.find).toHaveBeenCalledWith(
                'accounts',
                {},
                expect.objectContaining({ profile: true }),
            );
        });

        it('should calculate efficiency ratio', async () => {
            mockQueryService.find.mockResolvedValue({
                value: [{ id: '1' }],
                profile: { executionTime: 5, rowsScanned: 10 },
            });
            const result = await analyzer.profile('accounts', {});
            expect(result.efficiency).toBe(1 / 10);
        });

        it('should handle zero rowsScanned', async () => {
            mockQueryService.find.mockResolvedValue({
                value: [],
                profile: { executionTime: 1, rowsScanned: 0 },
            });
            const result = await analyzer.profile('accounts', {});
            expect(result.efficiency).toBe(0);
        });

        it('should determine indexUsed based on indexes and efficiency', async () => {
            // Has index (status) and good efficiency
            mockQueryService.find.mockResolvedValue({
                value: [{ id: '1' }],
                profile: { executionTime: 2, rowsScanned: 1 },
            });
            const result = await analyzer.profile('accounts', { where: { status: 'active' } });
            expect(result.indexUsed).toBe(true);
        });

        it('should report indexUsed false when no indexes match', async () => {
            mockQueryService.find.mockResolvedValue({
                value: [{ id: '1' }],
                profile: { executionTime: 2, rowsScanned: 1 },
            });
            const result = await analyzer.profile('accounts', { where: { age: { $gt: 0 } } });
            expect(result.indexUsed).toBe(false);
        });
    });

    // -- statistics ---------------------------------------------------------
    describe('statistics', () => {
        it('should start with empty statistics', () => {
            const stats = analyzer.getStatistics();
            expect(stats.totalQueries).toBe(0);
            expect(stats.avgExecutionTime).toBe(0);
            expect(stats.slowestQuery).toBe(0);
            expect(stats.fastestQuery).toBe(Number.MAX_VALUE);
            expect(stats.byObject).toEqual({});
            expect(stats.slowQueries).toEqual([]);
        });

        it('should track statistics after profile execution', async () => {
            await analyzer.profile('accounts', { where: { status: 'active' } });
            const stats = analyzer.getStatistics();
            expect(stats.totalQueries).toBe(1);
            expect(stats.byObject['accounts']).toBeDefined();
            expect(stats.byObject['accounts'].count).toBe(1);
        });

        it('should update avg/max/min across multiple profile calls', async () => {
            mockQueryService.find
                .mockResolvedValueOnce({ value: [], profile: { executionTime: 10, rowsScanned: 0 } })
                .mockResolvedValueOnce({ value: [], profile: { executionTime: 30, rowsScanned: 0 } });

            await analyzer.profile('accounts', {});
            await analyzer.profile('accounts', {});

            const stats = analyzer.getStatistics();
            expect(stats.totalQueries).toBe(2);
            expect(stats.avgExecutionTime).toBe(20);
            expect(stats.slowestQuery).toBe(30);
            expect(stats.fastestQuery).toBe(10);
        });

        it('should track slow queries sorted by execution time', async () => {
            mockQueryService.find
                .mockResolvedValueOnce({ value: [], profile: { executionTime: 100, rowsScanned: 0 } })
                .mockResolvedValueOnce({ value: [], profile: { executionTime: 50, rowsScanned: 0 } });

            await analyzer.profile('accounts', { where: { a: 1 } });
            await analyzer.profile('accounts', { where: { b: 2 } });

            const stats = analyzer.getStatistics();
            expect(stats.slowQueries.length).toBe(2);
            expect(stats.slowQueries[0].executionTime).toBe(100);
            expect(stats.slowQueries[1].executionTime).toBe(50);
        });

        it('should resetStatistics', async () => {
            await analyzer.profile('accounts', {});
            analyzer.resetStatistics();
            const stats = analyzer.getStatistics();
            expect(stats.totalQueries).toBe(0);
            expect(stats.slowQueries).toEqual([]);
        });

        it('should return a copy of statistics (not a reference)', () => {
            const stats1 = analyzer.getStatistics();
            stats1.totalQueries = 999;
            const stats2 = analyzer.getStatistics();
            expect(stats2.totalQueries).toBe(0);
        });
    });
});
