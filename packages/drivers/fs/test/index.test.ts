import * as fs from 'fs';
import * as path from 'path';
import { FileSystemDriver } from '../src/index';

describe('FileSystemDriver', () => {
    const testDataDir = path.join(__dirname, '.test-data');
    let driver: FileSystemDriver;

    beforeEach(() => {
        // Clean up test directory
        if (fs.existsSync(testDataDir)) {
            fs.rmSync(testDataDir, { recursive: true });
        }
        
        driver = new FileSystemDriver({
            dataDir: testDataDir,
            prettyPrint: true,
            enableBackup: true
        });
    });

    afterEach(async () => {
        await driver.disconnect();
        
        // Clean up test directory
        if (fs.existsSync(testDataDir)) {
            fs.rmSync(testDataDir, { recursive: true });
        }
    });

    describe('Basic CRUD Operations', () => {
        test('should create a record', async () => {
            const result = await driver.create('users', {
                name: 'Alice',
                email: 'alice@example.com'
            });

            expect(result).toHaveProperty('id');
            expect(result.name).toBe('Alice');
            expect(result.email).toBe('alice@example.com');
            expect(result).toHaveProperty('created_at');
            expect(result).toHaveProperty('updated_at');
        });

        test('should create a file for the object', async () => {
            await driver.create('users', { name: 'Bob' });

            const filePath = path.join(testDataDir, 'users.json');
            expect(fs.existsSync(filePath)).toBe(true);

            const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            expect(Array.isArray(content)).toBe(true);
            expect(content.length).toBe(1);
        });

        test('should find all records', async () => {
            await driver.create('users', { name: 'Alice' });
            await driver.create('users', { name: 'Bob' });

            const results = await driver.find('users', {});
            expect(results.length).toBe(2);
        });

        test('should find a single record by ID', async () => {
            const created = await driver.create('users', { name: 'Charlie' });
            const found = await driver.findOne('users', created.id);

            expect(found).not.toBeNull();
            expect(found.name).toBe('Charlie');
            expect(found.id).toBe(created.id);
        });

        test('should update a record', async () => {
            const created = await driver.create('users', { name: 'David', age: 25 });
            
            // Add small delay to ensure different timestamp
            await new Promise(resolve => setTimeout(resolve, 10));
            
            const updated = await driver.update('users', created.id, { age: 26 });

            expect(updated.age).toBe(26);
            expect(updated.name).toBe('David');
            expect(updated.id).toBe(created.id);
            expect(updated.updated_at).not.toBe(created.updated_at);
        });

        test('should delete a record', async () => {
            const created = await driver.create('users', { name: 'Eve' });
            const deleted = await driver.delete('users', created.id);

            expect(deleted).toBe(true);

            const found = await driver.findOne('users', created.id);
            expect(found).toBeNull();
        });

        test('should throw error on duplicate ID', async () => {
            await driver.create('users', { id: 'user-1', name: 'Alice' });

            await expect(
                driver.create('users', { id: 'user-1', name: 'Bob' })
            ).rejects.toThrow();
        });
    });

    describe('Query Operations', () => {
        beforeEach(async () => {
            await driver.create('products', { id: 'p1', name: 'Laptop', price: 1000, category: 'electronics' });
            await driver.create('products', { id: 'p2', name: 'Mouse', price: 25, category: 'electronics' });
            await driver.create('products', { id: 'p3', name: 'Desk', price: 300, category: 'furniture' });
            await driver.create('products', { id: 'p4', name: 'Chair', price: 150, category: 'furniture' });
        });

        test('should filter records with equality', async () => {
            const results = await driver.find('products', {
                filters: [['category', '=', 'electronics']]
            });

            expect(results.length).toBe(2);
            expect(results.every(r => r.category === 'electronics')).toBe(true);
        });

        test('should filter records with comparison operators', async () => {
            const results = await driver.find('products', {
                filters: [['price', '>', 100]]
            });

            expect(results.length).toBe(3);
            expect(results.every(r => r.price > 100)).toBe(true);
        });

        test('should filter with IN operator', async () => {
            const results = await driver.find('products', {
                filters: [['id', 'in', ['p1', 'p3']]]
            });

            expect(results.length).toBe(2);
            expect(results.map(r => r.id).sort()).toEqual(['p1', 'p3']);
        });

        test('should filter with LIKE operator', async () => {
            const results = await driver.find('products', {
                filters: [['name', 'like', 'a']]
            });

            expect(results.length).toBe(2); // Laptop, Chair
        });

        test('should sort records', async () => {
            const results = await driver.find('products', {
                sort: [['price', 'asc']]
            });

            expect(results[0].name).toBe('Mouse');
            expect(results[3].name).toBe('Laptop');
        });

        test('should paginate records', async () => {
            const page1 = await driver.find('products', {
                sort: [['price', 'asc']],
                limit: 2
            });

            expect(page1.length).toBe(2);
            expect(page1[0].name).toBe('Mouse');

            const page2 = await driver.find('products', {
                sort: [['price', 'asc']],
                skip: 2,
                limit: 2
            });

            expect(page2.length).toBe(2);
            expect(page2[0].name).toBe('Desk');
        });

        test('should project specific fields', async () => {
            const results = await driver.find('products', {
                fields: ['name', 'price']
            });

            expect(results.length).toBe(4);
            expect(results[0]).toHaveProperty('name');
            expect(results[0]).toHaveProperty('price');
            expect(results[0]).not.toHaveProperty('category');
        });

        test('should count all records', async () => {
            const count = await driver.count('products', {});
            expect(count).toBe(4);
        });

        test('should count filtered records', async () => {
            const count = await driver.count('products', {
                filters: [['category', '=', 'electronics']]
            });
            expect(count).toBe(2);
        });

        test('should get distinct values', async () => {
            const categories = await driver.distinct('products', 'category');
            expect(categories.sort()).toEqual(['electronics', 'furniture']);
        });
    });

    describe('Bulk Operations', () => {
        test('should create many records', async () => {
            const data = [
                { name: 'User 1' },
                { name: 'User 2' },
                { name: 'User 3' }
            ];

            const results = await driver.createMany('users', data);
            expect(results.length).toBe(3);

            const all = await driver.find('users', {});
            expect(all.length).toBe(3);
        });

        test('should update many records', async () => {
            await driver.create('tasks', { id: 't1', status: 'pending', priority: 'high' });
            await driver.create('tasks', { id: 't2', status: 'pending', priority: 'low' });
            await driver.create('tasks', { id: 't3', status: 'completed', priority: 'high' });

            const result = await driver.updateMany(
                'tasks',
                [['status', '=', 'pending']],
                { status: 'in_progress' }
            );

            expect(result.modifiedCount).toBe(2);

            const updated = await driver.find('tasks', {
                filters: [['status', '=', 'in_progress']]
            });
            expect(updated.length).toBe(2);
        });

        test('should delete many records', async () => {
            await driver.create('logs', { id: 'l1', level: 'info' });
            await driver.create('logs', { id: 'l2', level: 'debug' });
            await driver.create('logs', { id: 'l3', level: 'error' });

            const result = await driver.deleteMany(
                'logs',
                [['level', 'in', ['info', 'debug']]]
            );

            expect(result.deletedCount).toBe(2);

            const remaining = await driver.find('logs', {});
            expect(remaining.length).toBe(1);
            expect(remaining[0].level).toBe('error');
        });
    });

    describe('File System Operations', () => {
        test('should create backup file on update', async () => {
            const created = await driver.create('configs', { key: 'theme', value: 'dark' });
            
            // First update - creates backup
            await driver.update('configs', created.id, { value: 'light' });

            const backupPath = path.join(testDataDir, 'configs.json.bak');
            expect(fs.existsSync(backupPath)).toBe(true);
        });

        test('should handle missing file gracefully', async () => {
            const results = await driver.find('nonexistent', {});
            expect(results).toEqual([]);
        });

        test('should write pretty-printed JSON', async () => {
            await driver.create('settings', { key: 'test', value: 'data' });

            const filePath = path.join(testDataDir, 'settings.json');
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Pretty-printed JSON should have newlines
            expect(content).toContain('\n');
        });

        test('should handle concurrent writes', async () => {
            // Create multiple records concurrently
            await Promise.all([
                driver.create('concurrent', { name: 'Item 1' }),
                driver.create('concurrent', { name: 'Item 2' }),
                driver.create('concurrent', { name: 'Item 3' })
            ]);

            const results = await driver.find('concurrent', {});
            expect(results.length).toBe(3);
        });
    });

    describe('Edge Cases', () => {
        test('should handle empty object name', async () => {
            await expect(
                driver.create('', { name: 'test' })
            ).rejects.toThrow();
        });

        test('should preserve custom ID', async () => {
            const result = await driver.create('items', {
                id: 'custom-id-123',
                name: 'Custom Item'
            });

            expect(result.id).toBe('custom-id-123');
        });

        test('should handle _id field', async () => {
            const result = await driver.create('docs', {
                _id: 'mongo-style-id',
                title: 'Document'
            });

            const found = await driver.findOne('docs', 'mongo-style-id');
            expect(found).not.toBeNull();
            expect(found.title).toBe('Document');
        });

        test('should return null for non-existent record', async () => {
            const found = await driver.findOne('users', 'non-existent-id');
            expect(found).toBeNull();
        });

        test('should handle update of non-existent record', async () => {
            const result = await driver.update('users', 'non-existent', { name: 'Test' });
            expect(result).toBeNull();
        });
    });

    describe('New Features', () => {
        test('should load initial data', async () => {
            const newDriver = new FileSystemDriver({
                dataDir: path.join(testDataDir, 'initial'),
                initialData: {
                    products: [
                        { id: 'p1', name: 'Product 1', price: 100 },
                        { id: 'p2', name: 'Product 2', price: 200 }
                    ]
                }
            });

            const results = await newDriver.find('products', {});
            expect(results.length).toBe(2);
            expect(results[0].name).toBe('Product 1');
            
            await newDriver.disconnect();
        });

        test('should clear specific object data', async () => {
            await driver.create('temp', { name: 'Test' });
            
            const before = await driver.find('temp', {});
            expect(before.length).toBe(1);

            await driver.clear('temp');

            const after = await driver.find('temp', {});
            expect(after.length).toBe(0);
        });

        test('should clear all data', async () => {
            await driver.create('obj1', { name: 'Test 1' });
            await driver.create('obj2', { name: 'Test 2' });

            await driver.clearAll();

            const obj1 = await driver.find('obj1', {});
            const obj2 = await driver.find('obj2', {});
            
            expect(obj1.length).toBe(0);
            expect(obj2.length).toBe(0);
        });

        test('should invalidate cache', async () => {
            await driver.create('cache_test', { name: 'Test' });
            
            // Verify cache is populated
            expect(driver.getCacheSize()).toBeGreaterThan(0);

            driver.invalidateCache('cache_test');

            // Cache should reload on next access
            const results = await driver.find('cache_test', {});
            expect(results.length).toBe(1);
        });

        test('should get cache size', async () => {
            await driver.create('size1', { name: 'Test 1' });
            await driver.create('size2', { name: 'Test 2' });

            const size = driver.getCacheSize();
            expect(size).toBeGreaterThanOrEqual(2);
        });

        test('should handle empty JSON file', async () => {
            const filePath = path.join(testDataDir, 'empty.json');
            fs.writeFileSync(filePath, '', 'utf8');

            const results = await driver.find('empty', {});
            expect(results).toEqual([]);
        });

        test('should handle invalid JSON file', async () => {
            const filePath = path.join(testDataDir, 'invalid.json');
            fs.writeFileSync(filePath, '{invalid json}', 'utf8');

            try {
                await driver.find('invalid', {});
                fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.code).toBe('INVALID_JSON_FORMAT');
                expect(error.message).toContain('invalid JSON');
            }
        });
    });
});
