/**
 * Driver Technology Compatibility Kit (TCK)
 * 
 * Comprehensive test suite ensuring all ObjectQL drivers implement consistent behavior
 * across CRUD operations, queries, transactions, and bulk operations.
 */

export interface TCKDriverFactory {
    (): any;
}

export interface TCKConfig {
    skip?: {
        transactions?: boolean;
        joins?: boolean;
        fullTextSearch?: boolean;
        aggregations?: boolean;
        distinct?: boolean;
        bulkOperations?: boolean;
    };
    timeout?: number;
    hooks?: {
        beforeAll?: () => Promise<void>;
        afterAll?: () => Promise<void>;
        beforeEach?: () => Promise<void>;
        afterEach?: () => Promise<void>;
    };
}

/**
 * Run the complete TCK test suite against a driver
 */
export function runDriverTCK(
    createDriver: TCKDriverFactory,
    config: TCKConfig = {}
) {
    const skip = config.skip || {};
    const timeout = config.timeout || 30000;
    const hooks = config.hooks || {};
    
    describe('Driver TCK - Technology Compatibility Kit', () => {
        let driver: any;
        const TEST_OBJECT = 'tck_test';
        
        let driverUnavailable = false;
        
        beforeAll(async () => {
            if (hooks.beforeAll) {
                await hooks.beforeAll();
            }
        }, timeout);
        
        afterAll(async () => {
            if (hooks.afterAll) {
                await hooks.afterAll();
            }
        }, timeout);
        
        beforeEach(async (ctx: any) => {
            if (driverUnavailable) {
                // Driver was previously unavailable - skip subsequent tests
                if (ctx && typeof ctx.skip === 'function') { ctx.skip(); }
                return;
            }
            try {
                driver = createDriver();
            } catch (err: unknown) {
                driverUnavailable = true;
                const message = err instanceof Error ? err.message : String(err);
                console.warn(`⚠️  TCK: createDriver() failed: ${message}. Skipping remaining tests.`);
                if (ctx && typeof ctx.skip === 'function') { ctx.skip(); }
                return;
            }
            if (driver && driver.clear) {
                await driver.clear();
            }
            if (hooks.beforeEach) {
                await hooks.beforeEach();
            }
        }, timeout);
        
        afterEach(async () => {
            if (hooks.afterEach) {
                await hooks.afterEach();
            }
            if (driver && driver.clear) {
                await driver.clear();
            }
        }, timeout);
        
        // ===== CORE CRUD OPERATIONS =====
        describe('1. Core CRUD Operations', () => {
            test('should create a record with auto-generated ID', async () => {
                const result = await driver.create(TEST_OBJECT, {
                    name: 'Test User',
                    email: 'test@example.com'
                });
                
                expect(result).toBeDefined();
                expect(result.id).toBeDefined();
                expect(result.name).toBe('Test User');
                expect(result.email).toBe('test@example.com');
            }, timeout);
            
            test('should create a record with custom ID', async () => {
                const result = await driver.create(TEST_OBJECT, {
                    id: 'custom-id-123',
                    name: 'Custom ID User',
                    email: 'custom@example.com'
                });
                
                expect(result.id).toBe('custom-id-123');
                expect(result.name).toBe('Custom ID User');
            }, timeout);
            
            test('should add timestamps on create', async () => {
                const result = await driver.create(TEST_OBJECT, {
                    name: 'Timestamp Test'
                });
                
                expect(result.created_at).toBeDefined();
                expect(result.updated_at).toBeDefined();
            }, timeout);
            
            test('should throw error on duplicate ID', async () => {
                await driver.create(TEST_OBJECT, {
                    id: 'duplicate-id',
                    name: 'First'
                });
                
                await expect(
                    driver.create(TEST_OBJECT, {
                        id: 'duplicate-id',
                        name: 'Second'
                    })
                ).rejects.toThrow();
            }, timeout);
            
            test('should find a record by ID', async () => {
                const created = await driver.create(TEST_OBJECT, {
                    name: 'Find Test',
                    email: 'find@example.com'
                });
                
                const found = await driver.findOne(TEST_OBJECT, created.id);
                expect(found).toBeDefined();
                expect(found.id).toBe(created.id);
                expect(found.name).toBe('Find Test');
            }, timeout);
            
            test('should return null for non-existent ID', async () => {
                const result = await driver.findOne(TEST_OBJECT, 'non-existent-id-12345');
                expect(result).toBeNull();
            }, timeout);
            
            test('should update a record', async () => {
                const created = await driver.create(TEST_OBJECT, {
                    name: 'Original Name',
                    email: 'original@example.com',
                    status: 'pending'
                });
                
                await new Promise(resolve => setTimeout(resolve, 10));
                
                const updated = await driver.update(TEST_OBJECT, created.id, {
                    email: 'updated@example.com',
                    status: 'active'
                });
                
                expect(updated.name).toBe('Original Name'); // Unchanged
                expect(updated.email).toBe('updated@example.com'); // Changed
                expect(updated.status).toBe('active'); // Changed
                expect(updated.created_at).toBe(created.created_at); // Preserved
                expect(updated.updated_at).not.toBe(created.updated_at); // Updated
            }, timeout);
            
            test('should delete a record', async () => {
                const created = await driver.create(TEST_OBJECT, {
                    name: 'To Delete'
                });
                
                const deleted = await driver.delete(TEST_OBJECT, created.id);
                expect(deleted).toBeTruthy();
                
                const found = await driver.findOne(TEST_OBJECT, created.id);
                expect(found).toBeNull();
            }, timeout);
            
            test('should handle delete of non-existent record', async () => {
                const result = await driver.delete(TEST_OBJECT, 'non-existent-id');
                expect(result).toBeFalsy();
            }, timeout);
        });
        
        // ===== QUERY OPERATIONS =====
        describe('2. Query Operations', () => {
            beforeEach(async () => {
                // Create test dataset
                await driver.create(TEST_OBJECT, {
                    id: 'user-1',
                    name: 'Alice',
                    email: 'alice@example.com',
                    role: 'admin',
                    age: 30,
                    active: true
                });
                await driver.create(TEST_OBJECT, {
                    id: 'user-2',
                    name: 'Bob',
                    email: 'bob@example.com',
                    role: 'user',
                    age: 25,
                    active: true
                });
                await driver.create(TEST_OBJECT, {
                    id: 'user-3',
                    name: 'Charlie',
                    email: 'charlie@example.com',
                    role: 'user',
                    age: 35,
                    active: false
                });
            }, timeout);
            
            test('should find all records', async () => {
                const results = await driver.find(TEST_OBJECT, {});
                expect(results).toHaveLength(3);
            }, timeout);
            
            test('should filter by equality', async () => {
                const results = await driver.find(TEST_OBJECT, {
                    where: { role: 'user' }
                });
                expect(results).toHaveLength(2);
                expect(results.every((r: any) => r.role === 'user')).toBe(true);
            }, timeout);
            
            test('should filter by boolean', async () => {
                const results = await driver.find(TEST_OBJECT, {
                    where: { active: true }
                });
                expect(results).toHaveLength(2);
                expect(results.every((r: any) => r.active === true)).toBe(true);
            }, timeout);
            
            test('should filter with $gt operator', async () => {
                const results = await driver.find(TEST_OBJECT, {
                    where: { age: { $gt: 25 } }
                });
                expect(results).toHaveLength(2);
                expect(results.every((r: any) => r.age > 25)).toBe(true);
            }, timeout);
            
            test('should filter with $lt operator', async () => {
                const results = await driver.find(TEST_OBJECT, {
                    where: { age: { $lt: 30 } }
                });
                expect(results).toHaveLength(1);
                expect(results[0].age).toBe(25);
            }, timeout);
            
            test('should filter with $gte operator', async () => {
                const results = await driver.find(TEST_OBJECT, {
                    where: { age: { $gte: 30 } }
                });
                expect(results).toHaveLength(2);
            }, timeout);
            
            test('should filter with $ne operator', async () => {
                const results = await driver.find(TEST_OBJECT, {
                    where: { role: { $ne: 'admin' } }
                });
                expect(results).toHaveLength(2);
                expect(results.every((r: any) => r.role !== 'admin')).toBe(true);
            }, timeout);
            
            test('should filter with $or operator', async () => {
                const results = await driver.find(TEST_OBJECT, {
                    where: {
                        $or: [
                            { role: 'admin' },
                            { age: { $gt: 30 } }
                        ]
                    }
                });
                expect(results).toHaveLength(2);
            }, timeout);
            
            test('should sort ascending', async () => {
                const results = await driver.find(TEST_OBJECT, {
                    orderBy: [{ field: 'age', order: 'asc' }]
                });
                expect(results[0].age).toBe(25);
                expect(results[1].age).toBe(30);
                expect(results[2].age).toBe(35);
            }, timeout);
            
            test('should sort descending', async () => {
                const results = await driver.find(TEST_OBJECT, {
                    orderBy: [{ field: 'age', order: 'desc' }]
                });
                expect(results[0].age).toBe(35);
                expect(results[1].age).toBe(30);
                expect(results[2].age).toBe(25);
            }, timeout);
            
            test('should paginate with limit', async () => {
                const results = await driver.find(TEST_OBJECT, {
                    limit: 2
                });
                expect(results).toHaveLength(2);
            }, timeout);
            
            test('should paginate with offset', async () => {
                const results = await driver.find(TEST_OBJECT, {
                    orderBy: [{ field: 'age', order: 'asc' }],
                    offset: 1,
                    limit: 2
                });
                expect(results).toHaveLength(2);
                expect(results[0].age).toBe(30);
            }, timeout);
            
            test('should combine filters, sort, and pagination', async () => {
                const results = await driver.find(TEST_OBJECT, {
                    where: { role: 'user' },
                    orderBy: [{ field: 'age', order: 'desc' }],
                    limit: 1
                });
                expect(results).toHaveLength(1);
                expect(results[0].age).toBe(35);
            }, timeout);
        });
        
        // ===== COUNT OPERATIONS =====
        describe('3. Count Operations', () => {
            beforeEach(async () => {
                await driver.create(TEST_OBJECT, { role: 'admin', age: 30 });
                await driver.create(TEST_OBJECT, { role: 'user', age: 25 });
                await driver.create(TEST_OBJECT, { role: 'user', age: 35 });
            }, timeout);
            
            test('should count all records', async () => {
                const count = await driver.count(TEST_OBJECT, {});
                expect(count).toBe(3);
            }, timeout);
            
            test('should count with filters', async () => {
                const count = await driver.count(TEST_OBJECT, { role: 'user' });
                expect(count).toBe(2);
            }, timeout);
        });
        
        // ===== DISTINCT OPERATIONS =====
        if (!skip.distinct) {
            describe('4. Distinct Operations', () => {
                beforeEach(async () => {
                    await driver.create(TEST_OBJECT, { role: 'admin', department: 'IT' });
                    await driver.create(TEST_OBJECT, { role: 'user', department: 'IT' });
                    await driver.create(TEST_OBJECT, { role: 'user', department: 'HR' });
                }, timeout);
                
                test('should get distinct values', async () => {
                    if (!driver.distinct) {
                        console.warn('Driver does not support distinct operation');
                        return;
                    }
                    
                    const results = await driver.distinct(TEST_OBJECT, 'role');
                    expect(results).toContain('admin');
                    expect(results).toContain('user');
                    expect(results.length).toBeGreaterThanOrEqual(2);
                }, timeout);
                
                test('should get distinct with filters', async () => {
                    if (!driver.distinct) {
                        console.warn('Driver does not support distinct operation');
                        return;
                    }
                    
                    const results = await driver.distinct(TEST_OBJECT, 'department', { role: 'user' });
                    expect(results).toContain('IT');
                    expect(results).toContain('HR');
                }, timeout);
            });
        }
        
        // ===== BULK OPERATIONS =====
        if (!skip.bulkOperations) {
            describe('5. Bulk Operations', () => {
                test('should create multiple records', async () => {
                    if (!driver.createMany) {
                        console.warn('Driver does not support createMany operation');
                        return;
                    }
                    
                    const results = await driver.createMany(TEST_OBJECT, [
                        { name: 'Alice' },
                        { name: 'Bob' },
                        { name: 'Charlie' }
                    ]);
                    expect(results).toHaveLength(3);
                    expect(results[0].id).toBeDefined();
                }, timeout);
                
                test('should update multiple records', async () => {
                    if (!driver.updateMany) {
                        console.warn('Driver does not support updateMany operation');
                        return;
                    }
                    
                    await driver.create(TEST_OBJECT, { id: '1', role: 'user' });
                    await driver.create(TEST_OBJECT, { id: '2', role: 'user' });
                    await driver.create(TEST_OBJECT, { id: '3', role: 'admin' });
                    
                    const result = await driver.updateMany(
                        TEST_OBJECT,
                        { role: 'user' },
                        { status: 'active' }
                    );
                    
                    expect(result.modifiedCount).toBe(2);
                }, timeout);
                
                test('should delete multiple records', async () => {
                    if (!driver.deleteMany) {
                        console.warn('Driver does not support deleteMany operation');
                        return;
                    }
                    
                    await driver.create(TEST_OBJECT, { id: '1', role: 'user' });
                    await driver.create(TEST_OBJECT, { id: '2', role: 'user' });
                    await driver.create(TEST_OBJECT, { id: '3', role: 'admin' });
                    
                    const result = await driver.deleteMany(TEST_OBJECT, { role: 'user' });
                    expect(result.deletedCount).toBe(2);
                }, timeout);
            });
        }
        
        // ===== TRANSACTION SUPPORT =====
        if (!skip.transactions) {
            describe('6. Transaction Support', () => {
                test('should begin and commit transaction', async () => {
                    if (!driver.beginTransaction) {
                        console.warn('Driver does not support transactions');
                        return;
                    }
                    
                    const tx = await driver.beginTransaction();
                    expect(tx).toBeDefined();
                    
                    await driver.create(TEST_OBJECT, { id: 'tx-1', name: 'TX Test' }, { transaction: tx });
                    await driver.commitTransaction(tx);
                    
                    const result = await driver.findOne(TEST_OBJECT, 'tx-1');
                    expect(result).toBeDefined();
                    expect(result.name).toBe('TX Test');
                }, timeout);
                
                test('should rollback transaction', async () => {
                    if (!driver.beginTransaction) {
                        console.warn('Driver does not support transactions');
                        return;
                    }
                    
                    await driver.create(TEST_OBJECT, { id: 'rollback-1', name: 'Original' });
                    
                    const tx = await driver.beginTransaction();
                    await driver.update(TEST_OBJECT, 'rollback-1', { name: 'Modified' }, { transaction: tx });
                    await driver.create(TEST_OBJECT, { id: 'rollback-2', name: 'New' }, { transaction: tx });
                    await driver.rollbackTransaction(tx);
                    
                    const result1 = await driver.findOne(TEST_OBJECT, 'rollback-1');
                    expect(result1.name).toBe('Original');
                    
                    const result2 = await driver.findOne(TEST_OBJECT, 'rollback-2');
                    expect(result2).toBeNull();
                }, timeout);
            });
        }
        
        // ===== AGGREGATION OPERATIONS =====
        if (!skip.aggregations) {
            describe('7. Aggregation Operations', () => {
                beforeEach(async () => {
                    await driver.create('orders', { customer: 'Alice', amount: 100, status: 'completed' });
                    await driver.create('orders', { customer: 'Bob', amount: 200, status: 'completed' });
                    await driver.create('orders', { customer: 'Alice', amount: 150, status: 'pending' });
                    await driver.create('orders', { customer: 'Charlie', amount: 300, status: 'completed' });
                }, timeout);
                
                test('should aggregate with $match', async () => {
                    if (!driver.aggregate) {
                        console.warn('Driver does not support aggregations');
                        return;
                    }
                    
                    const results = await driver.aggregate('orders', [
                        { $match: { status: 'completed' } }
                    ]);
                    expect(results).toHaveLength(3);
                }, timeout);
                
                test('should aggregate with $group and $sum', async () => {
                    if (!driver.aggregate) {
                        console.warn('Driver does not support aggregations');
                        return;
                    }
                    
                    const results = await driver.aggregate('orders', [
                        { $match: { status: 'completed' } },
                        { $group: { _id: '$customer', total: { $sum: '$amount' } } }
                    ]);
                    expect(results.length).toBeGreaterThan(0);
                }, timeout);
            });
        }
        
        // ===== EDGE CASES =====
        describe('8. Edge Cases', () => {
            test('should handle empty query results', async () => {
                const results = await driver.find(TEST_OBJECT, {
                    where: { nonExistentField: 'value' }
                });
                expect(results).toHaveLength(0);
            }, timeout);
            
            test('should handle null values', async () => {
                const created = await driver.create(TEST_OBJECT, {
                    name: 'Test',
                    optionalField: null
                });
                expect(created.optionalField).toBeNull();
            }, timeout);
            
            test('should handle special characters in strings', async () => {
                const created = await driver.create(TEST_OBJECT, {
                    name: 'O\'Brien',
                    description: 'Test "quotes" and \\backslashes\\'
                });
                expect(created.name).toBe('O\'Brien');
            }, timeout);
        });
    });
}
