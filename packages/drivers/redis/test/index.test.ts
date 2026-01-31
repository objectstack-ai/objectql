/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Redis Driver Tests
 * 
 * These tests demonstrate the expected behavior of the Redis driver.
 * They require a running Redis instance to execute.
 */

import { RedisDriver } from '../src';

describe('RedisDriver', () => {
    let driver: RedisDriver;
    const TEST_OBJECT = 'test_users';

    beforeAll(async () => {
        let d: RedisDriver | undefined;
        // Suppress console.error solely for the connection probe to avoid noise
        // when Redis is intentionaly missing (e.g. in some local envs)
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        // Skip tests if Redis is not available
        try {
            d = new RedisDriver({ 
                url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
            });
            
            // Verify connection by attempting a simple operation
            await d.count('_test_connection', []);
            driver = d;
        } catch (error) {
            console.warn('Redis not available, skipping tests');
            if (d) {
                try {
                    await d.disconnect();
                } catch (e) {
                    // Ignore disconnect error
                }
            }
        } finally {
            // Restore console.error
            consoleErrorSpy.mockRestore();
        }
    });

    afterAll(async () => {
        if (driver) {
            // Clean up test data
            try {
                const results = await driver.find(TEST_OBJECT, {});
                for (const record of results) {
                    await driver.delete(TEST_OBJECT, record.id);
                }
            } catch (error) {
                // Ignore cleanup errors
            }
            
            await driver.disconnect();
        }
    });

    afterEach(async () => {
        if (driver) {
            // Clean up after each test
            try {
                const results = await driver.find(TEST_OBJECT, {});
                for (const record of results) {
                    await driver.delete(TEST_OBJECT, record.id);
                }
            } catch (error) {
                // Ignore cleanup errors
            }
        }
    });

    describe('Connection', () => {
        it('should connect to Redis', () => {
            expect(driver).toBeDefined();
        });
    });

    describe('CRUD Operations', () => {
        it('should create a record', async () => {
            if (!driver) {
                console.log('Skipping test: Redis not available');
                return;
            }

            const result = await driver.create(TEST_OBJECT, {
                name: 'Alice',
                email: 'alice@example.com',
                role: 'admin'
            });

            expect(result).toHaveProperty('id');
            expect(result.name).toBe('Alice');
            expect(result.email).toBe('alice@example.com');
            expect(result).toHaveProperty('created_at');
            expect(result).toHaveProperty('updated_at');
        });

        it('should create a record with custom ID', async () => {
            if (!driver) return;

            const result = await driver.create(TEST_OBJECT, {
                id: 'custom-123',
                name: 'Bob'
            });

            expect(result.id).toBe('custom-123');
            expect(result.name).toBe('Bob');
        });

        it('should find all records', async () => {
            if (!driver) return;

            await driver.create(TEST_OBJECT, { name: 'Alice' });
            await driver.create(TEST_OBJECT, { name: 'Bob' });

            const results = await driver.find(TEST_OBJECT, {});

            expect(results).toHaveLength(2);
        });

        it('should findOne by ID', async () => {
            if (!driver) return;

            const created = await driver.create(TEST_OBJECT, { name: 'Alice' });
            const found = await driver.findOne(TEST_OBJECT, created.id);

            expect(found).toBeDefined();
            expect(found.id).toBe(created.id);
            expect(found.name).toBe('Alice');
        });

        it('should return null for non-existent ID', async () => {
            if (!driver) return;

            const found = await driver.findOne(TEST_OBJECT, 'non-existent-id');

            expect(found).toBeNull();
        });

        it('should update a record', async () => {
            if (!driver) return;

            const created = await driver.create(TEST_OBJECT, { 
                name: 'Alice',
                email: 'alice@example.com'
            });

            // Wait a bit to ensure updated_at is different
            await new Promise(resolve => setTimeout(resolve, 10));

            const updated = await driver.update(TEST_OBJECT, created.id, {
                email: 'alice.new@example.com'
            });

            expect(updated.id).toBe(created.id);
            expect(updated.name).toBe('Alice');
            expect(updated.email).toBe('alice.new@example.com');
            expect(updated.created_at).toBe(created.created_at);
            expect(updated.updated_at).not.toBe(created.updated_at);
        });

        it('should delete a record', async () => {
            if (!driver) return;

            const created = await driver.create(TEST_OBJECT, { name: 'Alice' });
            const deleted = await driver.delete(TEST_OBJECT, created.id);

            expect(deleted).toBe(true);

            const found = await driver.findOne(TEST_OBJECT, created.id);
            expect(found).toBeNull();
        });

        it('should count records', async () => {
            if (!driver) return;

            await driver.create(TEST_OBJECT, { name: 'Alice' });
            await driver.create(TEST_OBJECT, { name: 'Bob' });

            const count = await driver.count(TEST_OBJECT, []);

            expect(count).toBe(2);
        });
    });

    describe('Query Filtering', () => {
        beforeEach(async () => {
            if (!driver) return;

            await driver.create(TEST_OBJECT, { name: 'Alice', age: 30, role: 'admin' });
            await driver.create(TEST_OBJECT, { name: 'Bob', age: 25, role: 'user' });
            await driver.create(TEST_OBJECT, { name: 'Charlie', age: 35, role: 'user' });
        });

        it('should filter by equality', async () => {
            if (!driver) return;

            const results = await driver.find(TEST_OBJECT, {
                where: {
                    type: 'comparison',
                    field: 'role',
                    operator: '=',
                    value: 'user'
                }
            });

            expect(results).toHaveLength(2);
            expect(results.every((r: any) => r.role === 'user')).toBe(true);
        });

        it('should filter by greater than', async () => {
            if (!driver) return;

            const results = await driver.find(TEST_OBJECT, {
                where: {
                    type: 'comparison',
                    field: 'age',
                    operator: '>',
                    value: 25
                }
            });

            expect(results).toHaveLength(2);
        });

        it('should filter with OR operator', async () => {
            if (!driver) return;

            const results = await driver.find(TEST_OBJECT, {
                where: {
                    type: 'or',
                    children: [
                        {
                            type: 'comparison',
                            field: 'name',
                            operator: '=',
                            value: 'Alice'
                        },
                        {
                            type: 'comparison',
                            field: 'name',
                            operator: '=',
                            value: 'Bob'
                        }
                    ]
                }
            });

            expect(results).toHaveLength(2);
        });

        it('should filter with contains', async () => {
            if (!driver) return;

            const results = await driver.find(TEST_OBJECT, {
                where: {
                    type: 'comparison',
                    field: 'name',
                    operator: 'contains',
                    value: 'li'
                }
            });

            expect(results).toHaveLength(2); // Alice and Charlie
        });

        it('should count with filters', async () => {
            if (!driver) return;

            const count = await driver.count(TEST_OBJECT, {
                type: 'comparison',
                field: 'role',
                operator: '=',
                value: 'user'
            });

            expect(count).toBe(2);
        });
    });

    describe('Query Options', () => {
        beforeEach(async () => {
            if (!driver) return;

            await driver.create(TEST_OBJECT, { name: 'Alice', age: 30 });
            await driver.create(TEST_OBJECT, { name: 'Bob', age: 25 });
            await driver.create(TEST_OBJECT, { name: 'Charlie', age: 35 });
        });

        it('should sort ascending', async () => {
            if (!driver) return;

            const results = await driver.find(TEST_OBJECT, {
                orderBy: [{ field: 'age', order: 'asc' }]
            });

            expect(results[0].name).toBe('Bob');
            expect(results[1].name).toBe('Alice');
            expect(results[2].name).toBe('Charlie');
        });

        it('should sort descending', async () => {
            if (!driver) return;

            const results = await driver.find(TEST_OBJECT, {
                orderBy: [{ field: 'age', order: 'desc' }]
            });

            expect(results[0].name).toBe('Charlie');
            expect(results[1].name).toBe('Alice');
            expect(results[2].name).toBe('Bob');
        });

        it('should limit results', async () => {
            if (!driver) return;

            const results = await driver.find(TEST_OBJECT, {
                limit: 2
            });

            expect(results).toHaveLength(2);
        });

        it('should skip results', async () => {
            if (!driver) return;

            const results = await driver.find(TEST_OBJECT, {
                orderBy: [{ field: 'age', order: 'asc' }],
                offset: 1
            });

            expect(results).toHaveLength(2);
            expect(results[0].name).toBe('Alice');
        });

        it('should project fields', async () => {
            if (!driver) return;

            const results = await driver.find(TEST_OBJECT, {
                fields: ['name']
            });

            expect(results[0]).toHaveProperty('name');
            expect(results[0]).not.toHaveProperty('age');
        });
    });

    describe('DriverInterface v4.0 - executeQuery', () => {
        beforeEach(async () => {
            if (!driver) return;

            await driver.create(TEST_OBJECT, { name: 'Alice', age: 30, role: 'admin' });
            await driver.create(TEST_OBJECT, { name: 'Bob', age: 25, role: 'user' });
            await driver.create(TEST_OBJECT, { name: 'Charlie', age: 35, role: 'user' });
        });

        it('should execute a basic query with QueryAST', async () => {
            if (!driver) return;

            const result = await driver.executeQuery({
                object: TEST_OBJECT,
                fields: ['name', 'age']
            });

            expect(result.value).toHaveLength(3);
            expect(result.count).toBe(3);
            expect(result.value[0]).toHaveProperty('name');
            expect(result.value[0]).toHaveProperty('age');
        });

        it('should execute query with filter', async () => {
            if (!driver) return;

            const result = await driver.executeQuery({
                object: TEST_OBJECT,
                where: {
                    type: 'comparison',
                    field: 'role',
                    operator: '=',
                    value: 'user'
                }
            });

            expect(result.value).toHaveLength(2);
            expect(result.value.every((r: any) => r.role === 'user')).toBe(true);
        });

        it('should execute query with sort', async () => {
            if (!driver) return;

            const result = await driver.executeQuery({
                object: TEST_OBJECT,
                orderBy: [{ field: 'age', order: 'asc' }]
            });

            expect(result.value).toHaveLength(3);
            expect(result.value[0].name).toBe('Bob');
            expect(result.value[1].name).toBe('Alice');
            expect(result.value[2].name).toBe('Charlie');
        });

        it('should execute query with pagination', async () => {
            if (!driver) return;

            const result = await driver.executeQuery({
                object: TEST_OBJECT,
                orderBy: [{ field: 'age', order: 'asc' }],
                offset: 1,
                limit: 1
            });

            expect(result.value).toHaveLength(1);
            expect(result.value[0].name).toBe('Alice');
        });

        it('should execute query with AND filters', async () => {
            if (!driver) return;

            const result = await driver.executeQuery({
                object: TEST_OBJECT,
                where: {
                    type: 'and',
                    children: [
                        {
                            type: 'comparison',
                            field: 'role',
                            operator: '=',
                            value: 'user'
                        },
                        {
                            type: 'comparison',
                            field: 'age',
                            operator: '>',
                            value: 30
                        }
                    ]
                }
            });

            expect(result.value).toHaveLength(1);
            expect(result.value[0].name).toBe('Charlie');
        });

        it('should execute query with OR filters', async () => {
            if (!driver) return;

            const result = await driver.executeQuery({
                object: TEST_OBJECT,
                where: {
                    type: 'or',
                    children: [
                        {
                            type: 'comparison',
                            field: 'name',
                            operator: '=',
                            value: 'Alice'
                        },
                        {
                            type: 'comparison',
                            field: 'name',
                            operator: '=',
                            value: 'Bob'
                        }
                    ]
                }
            });

            expect(result.value).toHaveLength(2);
        });
    });

    describe('DriverInterface v4.0 - executeCommand', () => {
        it('should execute create command', async () => {
            if (!driver) return;

            const result = await driver.executeCommand({
                type: 'create',
                object: TEST_OBJECT,
                data: { name: 'David', email: 'david@example.com' }
            });

            expect(result.success).toBe(true);
            expect(result.affected).toBe(1);
            expect(result.data).toHaveProperty('id');
            expect(result.data.name).toBe('David');
        });

        it('should execute update command', async () => {
            if (!driver) return;

            const created = await driver.create(TEST_OBJECT, { name: 'Eve', email: 'eve@example.com' });

            const result = await driver.executeCommand({
                type: 'update',
                object: TEST_OBJECT,
                id: created.id,
                data: { email: 'eve.new@example.com' }
            });

            expect(result.success).toBe(true);
            expect(result.affected).toBe(1);
            expect(result.data.email).toBe('eve.new@example.com');
            expect(result.data.name).toBe('Eve');
        });

        it('should execute delete command', async () => {
            if (!driver) return;

            const created = await driver.create(TEST_OBJECT, { name: 'Frank' });

            const result = await driver.executeCommand({
                type: 'delete',
                object: TEST_OBJECT,
                id: created.id
            });

            expect(result.success).toBe(true);
            expect(result.affected).toBe(1);

            const found = await driver.findOne(TEST_OBJECT, created.id);
            expect(found).toBeNull();
        });

        it('should execute bulkCreate command', async () => {
            if (!driver) return;

            const result = await driver.executeCommand({
                type: 'bulkCreate',
                object: TEST_OBJECT,
                records: [
                    { name: 'Grace', age: 28 },
                    { name: 'Henry', age: 32 },
                    { name: 'Iris', age: 29 }
                ]
            });

            expect(result.success).toBe(true);
            expect(result.affected).toBe(3);
            expect(result.data).toHaveLength(3);
            expect(result.data[0]).toHaveProperty('id');

            const all = await driver.find(TEST_OBJECT, {});
            expect(all).toHaveLength(3);
        });

        it('should execute bulkUpdate command', async () => {
            if (!driver) return;

            const created1 = await driver.create(TEST_OBJECT, { name: 'Jack', age: 30 });
            const created2 = await driver.create(TEST_OBJECT, { name: 'Kate', age: 25 });

            const result = await driver.executeCommand({
                type: 'bulkUpdate',
                object: TEST_OBJECT,
                updates: [
                    { id: created1.id, data: { age: 31 } },
                    { id: created2.id, data: { age: 26 } }
                ]
            });

            expect(result.success).toBe(true);
            expect(result.affected).toBe(2);
            expect(result.data).toHaveLength(2);

            const updated1 = await driver.findOne(TEST_OBJECT, created1.id);
            const updated2 = await driver.findOne(TEST_OBJECT, created2.id);
            expect(updated1.age).toBe(31);
            expect(updated2.age).toBe(26);
        });

        it('should execute bulkDelete command', async () => {
            if (!driver) return;

            const created1 = await driver.create(TEST_OBJECT, { name: 'Liam' });
            const created2 = await driver.create(TEST_OBJECT, { name: 'Mia' });
            const created3 = await driver.create(TEST_OBJECT, { name: 'Noah' });

            const result = await driver.executeCommand({
                type: 'bulkDelete',
                object: TEST_OBJECT,
                ids: [created1.id, created2.id, created3.id]
            });

            expect(result.success).toBe(true);
            expect(result.affected).toBe(3);

            const all = await driver.find(TEST_OBJECT, {});
            expect(all).toHaveLength(0);
        });

        it('should handle command errors gracefully', async () => {
            if (!driver) return;

            const result = await driver.executeCommand({
                type: 'create',
                object: TEST_OBJECT,
                data: undefined // Missing data
            } as any);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.affected).toBe(0);
        });
    });

    describe('Distinct Operations', () => {
        beforeEach(async () => {
            if (!driver) return;

            // Create test data with various roles and departments
            await driver.create(TEST_OBJECT, { name: 'Alice', role: 'admin', department: 'IT', age: 30 });
            await driver.create(TEST_OBJECT, { name: 'Bob', role: 'user', department: 'HR', age: 25 });
            await driver.create(TEST_OBJECT, { name: 'Charlie', role: 'admin', department: 'IT', age: 35 });
            await driver.create(TEST_OBJECT, { name: 'David', role: 'user', department: 'Sales', age: 28 });
            await driver.create(TEST_OBJECT, { name: 'Eve', role: 'user', department: 'IT', age: 32 });
        });

        it('should get distinct values for a field', async () => {
            if (!driver) return;

            const roles = await driver.distinct(TEST_OBJECT, 'role');

            expect(roles).toHaveLength(2);
            expect(roles).toContain('admin');
            expect(roles).toContain('user');
        });

        it('should get distinct values with filters', async () => {
            if (!driver) return;

            const departments = await driver.distinct(TEST_OBJECT, 'department', {
                type: 'comparison',
                field: 'role',
                operator: '=',
                value: 'user'
            });

            // Eve (user, IT), Bob (user, HR), David (user, Sales)
            expect(departments).toHaveLength(3);
            expect(departments).toContain('HR');
            expect(departments).toContain('Sales');
            expect(departments).toContain('IT'); // Eve is a user in IT
        });

        it('should handle distinct on numeric fields', async () => {
            if (!driver) return;

            const ages = await driver.distinct(TEST_OBJECT, 'age');

            expect(ages).toHaveLength(5);
            expect(ages).toContain(25);
            expect(ages).toContain(28);
            expect(ages).toContain(30);
            expect(ages).toContain(32);
            expect(ages).toContain(35);
        });

        it('should ignore null and undefined values', async () => {
            if (!driver) return;

            await driver.create(TEST_OBJECT, { name: 'Frank', role: 'guest' }); // No department
            await driver.create(TEST_OBJECT, { name: 'Grace', role: null as any, department: 'Finance' }); // Null role

            const departments = await driver.distinct(TEST_OBJECT, 'department');

            // Should only include defined values
            expect(departments).not.toContain(null);
            expect(departments).not.toContain(undefined);
        });

        it('should handle empty results', async () => {
            if (!driver) return;

            // Clear all records
            const allRecords = await driver.find(TEST_OBJECT, {});
            for (const record of allRecords) {
                await driver.delete(TEST_OBJECT, record.id);
            }

            const roles = await driver.distinct(TEST_OBJECT, 'role');

            expect(roles).toHaveLength(0);
        });
    });

    describe('Aggregation Operations', () => {
        beforeEach(async () => {
            if (!driver) return;

            // Create test data for aggregations
            await driver.create(TEST_OBJECT, { name: 'Alice', department: 'IT', salary: 80000, age: 30 });
            await driver.create(TEST_OBJECT, { name: 'Bob', department: 'HR', salary: 60000, age: 25 });
            await driver.create(TEST_OBJECT, { name: 'Charlie', department: 'IT', salary: 90000, age: 35 });
            await driver.create(TEST_OBJECT, { name: 'David', department: 'Sales', salary: 70000, age: 28 });
            await driver.create(TEST_OBJECT, { name: 'Eve', department: 'IT', salary: 75000, age: 32 });
        });

        it('should count records by group', async () => {
            if (!driver) return;

            const results = await driver.aggregate(TEST_OBJECT, [
                { $group: { _id: '$department', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]);

            expect(results).toHaveLength(3);
            expect(results[0]._id).toBe('IT');
            expect(results[0].count).toBe(3);
            expect(results[1].count).toBe(1); // HR or Sales
        });

        it('should calculate average by group', async () => {
            if (!driver) return;

            const results = await driver.aggregate(TEST_OBJECT, [
                { $group: { _id: '$department', avgSalary: { $avg: '$salary' } } },
                { $sort: { avgSalary: -1 } }
            ]);

            expect(results).toHaveLength(3);
            
            const itResult = results.find(r => r._id === 'IT');
            expect(itResult).toBeDefined();
            expect(itResult?.avgSalary).toBeCloseTo(81666.67, 0); // (80000 + 90000 + 75000) / 3
        });

        it('should calculate min and max', async () => {
            if (!driver) return;

            const results = await driver.aggregate(TEST_OBJECT, [
                { $group: { 
                    _id: null, 
                    minSalary: { $min: '$salary' },
                    maxSalary: { $max: '$salary' }
                }}
            ]);

            expect(results).toHaveLength(1);
            expect(results[0].minSalary).toBe(60000);
            expect(results[0].maxSalary).toBe(90000);
        });

        it('should support $match stage', async () => {
            if (!driver) return;

            const results = await driver.aggregate(TEST_OBJECT, [
                { $match: { department: 'IT' } },
                { $group: { _id: null, avgAge: { $avg: '$age' } } }
            ]);

            expect(results).toHaveLength(1);
            expect(results[0].avgAge).toBeCloseTo(32.33, 1); // (30 + 35 + 32) / 3
        });

        it('should support $project stage', async () => {
            if (!driver) return;

            const results = await driver.aggregate(TEST_OBJECT, [
                { $match: { department: 'IT' } },
                { $project: { name: 1, salary: 1 } },
                { $limit: 2 }
            ]);

            expect(results).toHaveLength(2);
            expect(results[0]).toHaveProperty('name');
            expect(results[0]).toHaveProperty('salary');
            expect(results[0]).not.toHaveProperty('department');
        });

        it('should support $limit and $skip stages', async () => {
            if (!driver) return;

            const results = await driver.aggregate(TEST_OBJECT, [
                { $sort: { salary: 1 } },
                { $skip: 1 },
                { $limit: 2 }
            ]);

            expect(results).toHaveLength(2);
            // Should skip Bob (60000) and return David (70000) and Eve (75000)
            expect(results[0].salary).toBeGreaterThan(60000);
        });

        it('should support $first and $last accumulators', async () => {
            if (!driver) return;

            const results = await driver.aggregate(TEST_OBJECT, [
                { $sort: { salary: 1 } },
                { $group: { 
                    _id: '$department',
                    lowestPaid: { $first: '$name' },
                    highestPaid: { $last: '$name' }
                }}
            ]);

            const itResult = results.find(r => r._id === 'IT');
            expect(itResult).toBeDefined();
            expect(itResult?.lowestPaid).toBeDefined();
            expect(itResult?.highestPaid).toBeDefined();
        });

        it('should support $push accumulator', async () => {
            if (!driver) return;

            const results = await driver.aggregate(TEST_OBJECT, [
                { $group: { 
                    _id: '$department',
                    employees: { $push: '$name' }
                }}
            ]);

            const itResult = results.find(r => r._id === 'IT');
            expect(itResult).toBeDefined();
            expect(Array.isArray(itResult?.employees)).toBe(true);
            expect(itResult?.employees).toHaveLength(3);
            expect(itResult?.employees).toContain('Alice');
            expect(itResult?.employees).toContain('Charlie');
            expect(itResult?.employees).toContain('Eve');
        });

        it('should support $addToSet accumulator', async () => {
            if (!driver) return;

            // Add duplicate departments
            await driver.create(TEST_OBJECT, { name: 'Frank', department: 'IT', salary: 85000, age: 29 });

            const results = await driver.aggregate(TEST_OBJECT, [
                { $group: { 
                    _id: null,
                    uniqueDepts: { $addToSet: '$department' }
                }}
            ]);

            expect(results).toHaveLength(1);
            expect(results[0].uniqueDepts).toHaveLength(3); // IT, HR, Sales
            expect(results[0].uniqueDepts).toContain('IT');
            expect(results[0].uniqueDepts).toContain('HR');
            expect(results[0].uniqueDepts).toContain('Sales');
        });

        it('should handle complex aggregation pipelines', async () => {
            if (!driver) return;

            const results = await driver.aggregate(TEST_OBJECT, [
                { $match: { salary: { $gte: 70000 } } },
                { $group: { 
                    _id: '$department',
                    avgSalary: { $avg: '$salary' },
                    count: { $sum: 1 }
                }},
                { $match: { count: { $gt: 1 } } },
                { $sort: { avgSalary: -1 } },
                { $project: { 
                    department: '$_id',
                    avgSalary: 1,
                    count: 1
                }}
            ]);

            // Should only include IT (has 3 people with salary >= 70000)
            expect(results.length).toBeGreaterThan(0);
            const result = results.find(r => r.department === 'IT' || r._id === 'IT');
            expect(result).toBeDefined();
        });

        it('should handle empty aggregation results', async () => {
            if (!driver) return;

            const results = await driver.aggregate(TEST_OBJECT, [
                { $match: { salary: { $gt: 1000000 } } } // No one earns this much
            ]);

            expect(results).toHaveLength(0);
        });
    });
});
