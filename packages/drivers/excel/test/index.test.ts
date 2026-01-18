/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Excel Driver Tests
 * 
 * Comprehensive test suite for the Excel ObjectQL driver.
 */

import { ExcelDriver } from '../src';
import * as fs from 'fs';
import * as path from 'path';

describe('ExcelDriver', () => {
    const TEST_DIR = path.join(__dirname, 'test-files');
    const TEST_FILE = path.join(TEST_DIR, 'test-data.xlsx');
    const TEST_OBJECT = 'test_users';
    let driver: ExcelDriver;

    beforeAll(() => {
        // Create test directory
        if (!fs.existsSync(TEST_DIR)) {
            fs.mkdirSync(TEST_DIR, { recursive: true });
        }
    });

    beforeEach(async () => {
        // Clean up test file
        if (fs.existsSync(TEST_FILE)) {
            fs.unlinkSync(TEST_FILE);
        }
        
        // Create new driver using factory method
        driver = await ExcelDriver.create({
            filePath: TEST_FILE,
            createIfMissing: true,
            autoSave: true
        });
    });

    afterEach(async () => {
        await driver.disconnect();
    });

    afterAll(() => {
        // Clean up test directory
        if (fs.existsSync(TEST_DIR)) {
            fs.rmSync(TEST_DIR, { recursive: true, force: true });
        }
    });

    describe('Initialization', () => {
        it('should create a new Excel file if it does not exist', () => {
            expect(fs.existsSync(TEST_FILE)).toBe(true);
        });

        it('should load an existing Excel file', async () => {
            // Create some data
            await driver.create(TEST_OBJECT, {
                name: 'Alice',
                email: 'alice@example.com'
            });
            
            // Create new driver instance with same file
            const driver2 = await ExcelDriver.create({
                filePath: TEST_FILE,
                createIfMissing: false
            });
            
            const results = await driver2.find(TEST_OBJECT);
            expect(results.length).toBe(1);
            expect(results[0].name).toBe('Alice');
            
            await driver2.disconnect();
        });

        it('should throw error if file does not exist and createIfMissing is false', async () => {
            const nonExistentFile = path.join(TEST_DIR, 'non-existent.xlsx');
            
            await expect(
                ExcelDriver.create({
                    filePath: nonExistentFile,
                    createIfMissing: false
                })
            ).rejects.toThrow('Excel file not found');
        });

        it('should support strict mode', async () => {
            const strictDriver = await ExcelDriver.create({
                filePath: path.join(TEST_DIR, 'strict-test.xlsx'),
                strictMode: true,
                createIfMissing: true
            });
            
            await expect(
                strictDriver.update(TEST_OBJECT, 'non-existent', { name: 'Test' })
            ).rejects.toThrow('Record with id \'non-existent\' not found');
            
            await strictDriver.disconnect();
        });
    });

    describe('CRUD Operations', () => {
        it('should create a record', async () => {
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
            const result = await driver.create(TEST_OBJECT, {
                id: 'custom-123',
                name: 'Bob',
                email: 'bob@example.com'
            });

            expect(result.id).toBe('custom-123');
            expect(result.name).toBe('Bob');
        });

        it('should throw error on duplicate ID', async () => {
            await driver.create(TEST_OBJECT, {
                id: 'test-1',
                name: 'Alice'
            });

            await expect(
                driver.create(TEST_OBJECT, {
                    id: 'test-1',
                    name: 'Bob'
                })
            ).rejects.toThrow('Record with id \'test-1\' already exists');
        });

        it('should find a record by ID', async () => {
            const created = await driver.create(TEST_OBJECT, {
                name: 'Alice',
                email: 'alice@example.com'
            });

            const found = await driver.findOne(TEST_OBJECT, created.id);
            expect(found).toBeDefined();
            expect(found.name).toBe('Alice');
            expect(found.email).toBe('alice@example.com');
        });

        it('should return null for non-existent ID', async () => {
            const result = await driver.findOne(TEST_OBJECT, 'non-existent-id');
            expect(result).toBeNull();
        });

        it('should update a record', async () => {
            const created = await driver.create(TEST_OBJECT, {
                name: 'Alice',
                email: 'alice@example.com'
            });

            // Small delay to ensure updated_at timestamp differs from created_at
            // Note: Using real setTimeout here is intentional to test actual timestamp behavior
            await new Promise(resolve => setTimeout(resolve, 10));

            const updated = await driver.update(TEST_OBJECT, created.id, {
                email: 'alice.new@example.com'
            });

            expect(updated.email).toBe('alice.new@example.com');
            expect(updated.name).toBe('Alice'); // Unchanged
            expect(updated.created_at).toBe(created.created_at); // Preserved
            expect(updated.updated_at).not.toBe(created.updated_at); // Changed
        });

        it('should delete a record', async () => {
            const created = await driver.create(TEST_OBJECT, {
                name: 'Alice'
            });

            const deleted = await driver.delete(TEST_OBJECT, created.id);
            expect(deleted).toBe(true);

            const found = await driver.findOne(TEST_OBJECT, created.id);
            expect(found).toBeNull();
        });

        it('should return false when deleting non-existent record', async () => {
            const deleted = await driver.delete(TEST_OBJECT, 'non-existent');
            expect(deleted).toBe(false);
        });
    });

    describe('Query Operations', () => {
        beforeEach(async () => {
            // Create test data
            await driver.create(TEST_OBJECT, {
                id: '1',
                name: 'Alice',
                email: 'alice@example.com',
                role: 'admin',
                age: 30
            });
            await driver.create(TEST_OBJECT, {
                id: '2',
                name: 'Bob',
                email: 'bob@example.com',
                role: 'user',
                age: 25
            });
            await driver.create(TEST_OBJECT, {
                id: '3',
                name: 'Charlie',
                email: 'charlie@example.com',
                role: 'user',
                age: 35
            });
        });

        it('should find all records', async () => {
            const results = await driver.find(TEST_OBJECT);
            expect(results.length).toBe(3);
        });

        it('should filter records with equality operator', async () => {
            const results = await driver.find(TEST_OBJECT, {
                filters: [['role', '=', 'user']]
            });
            expect(results.length).toBe(2);
            expect(results.every(r => r.role === 'user')).toBe(true);
        });

        it('should filter records with greater than operator', async () => {
            const results = await driver.find(TEST_OBJECT, {
                filters: [['age', '>', 25]]
            });
            expect(results.length).toBe(2);
            expect(results.every(r => r.age > 25)).toBe(true);
        });

        it('should filter records with contains operator', async () => {
            const results = await driver.find(TEST_OBJECT, {
                filters: [['name', 'contains', 'li']]
            });
            expect(results.length).toBe(2); // Alice and Charlie
        });

        it('should support OR filters', async () => {
            const results = await driver.find(TEST_OBJECT, {
                filters: [
                    ['name', '=', 'Alice'],
                    'or',
                    ['name', '=', 'Bob']
                ]
            });
            expect(results.length).toBe(2);
        });

        it('should sort records ascending', async () => {
            const results = await driver.find(TEST_OBJECT, {
                sort: [['age', 'asc']]
            });
            expect(results[0].age).toBe(25);
            expect(results[1].age).toBe(30);
            expect(results[2].age).toBe(35);
        });

        it('should sort records descending', async () => {
            const results = await driver.find(TEST_OBJECT, {
                sort: [['age', 'desc']]
            });
            expect(results[0].age).toBe(35);
            expect(results[1].age).toBe(30);
            expect(results[2].age).toBe(25);
        });

        it('should support pagination with limit', async () => {
            const results = await driver.find(TEST_OBJECT, {
                limit: 2
            });
            expect(results.length).toBe(2);
        });

        it('should support pagination with skip', async () => {
            const results = await driver.find(TEST_OBJECT, {
                skip: 1,
                limit: 2
            });
            expect(results.length).toBe(2);
        });

        it('should project specific fields', async () => {
            const results = await driver.find(TEST_OBJECT, {
                fields: ['name', 'email']
            });
            expect(results[0]).toHaveProperty('name');
            expect(results[0]).toHaveProperty('email');
            expect(results[0]).not.toHaveProperty('role');
            expect(results[0]).not.toHaveProperty('age');
        });

        it('should count all records', async () => {
            const count = await driver.count(TEST_OBJECT, {});
            expect(count).toBe(3);
        });

        it('should count filtered records', async () => {
            const count = await driver.count(TEST_OBJECT, {
                filters: [['role', '=', 'user']]
            });
            expect(count).toBe(2);
        });

        it('should get distinct values', async () => {
            const roles = await driver.distinct(TEST_OBJECT, 'role');
            expect(roles).toHaveLength(2);
            expect(roles).toContain('admin');
            expect(roles).toContain('user');
        });
    });

    describe('Bulk Operations', () => {
        it('should create multiple records', async () => {
            const results = await driver.createMany(TEST_OBJECT, [
                { name: 'Alice', email: 'alice@example.com' },
                { name: 'Bob', email: 'bob@example.com' }
            ]);
            
            expect(results).toHaveLength(2);
            expect(results[0].name).toBe('Alice');
            expect(results[1].name).toBe('Bob');
        });

        it('should update multiple records', async () => {
            await driver.create(TEST_OBJECT, { id: '1', name: 'Alice', role: 'user' });
            await driver.create(TEST_OBJECT, { id: '2', name: 'Bob', role: 'user' });
            await driver.create(TEST_OBJECT, { id: '3', name: 'Charlie', role: 'admin' });

            const result = await driver.updateMany(
                TEST_OBJECT,
                [['role', '=', 'user']],
                { role: 'member' }
            );

            expect(result.modifiedCount).toBe(2);
            
            const users = await driver.find(TEST_OBJECT, {
                filters: [['role', '=', 'member']]
            });
            expect(users).toHaveLength(2);
        });

        it('should delete multiple records', async () => {
            await driver.create(TEST_OBJECT, { id: '1', name: 'Alice', role: 'user' });
            await driver.create(TEST_OBJECT, { id: '2', name: 'Bob', role: 'user' });
            await driver.create(TEST_OBJECT, { id: '3', name: 'Charlie', role: 'admin' });

            const result = await driver.deleteMany(
                TEST_OBJECT,
                [['role', '=', 'user']]
            );

            expect(result.deletedCount).toBe(2);
            
            const remaining = await driver.find(TEST_OBJECT);
            expect(remaining).toHaveLength(1);
            expect(remaining[0].role).toBe('admin');
        });
    });

    describe('File Persistence', () => {
        it('should persist data to file', async () => {
            await driver.create(TEST_OBJECT, {
                name: 'Alice',
                email: 'alice@example.com'
            });
            
            // Disconnect to ensure flush
            await driver.disconnect();
            
            // Verify file exists and has content
            expect(fs.existsSync(TEST_FILE)).toBe(true);
            const stats = fs.statSync(TEST_FILE);
            expect(stats.size).toBeGreaterThan(0);
        });

        it('should load persisted data from file', async () => {
            // Create and save data
            await driver.create(TEST_OBJECT, {
                id: 'persist-1',
                name: 'Alice',
                email: 'alice@example.com'
            });
            await driver.save();
            
            // Create new driver instance
            const driver2 = await ExcelDriver.create({
                filePath: TEST_FILE,
                createIfMissing: false
            });
            
            const found = await driver2.findOne(TEST_OBJECT, 'persist-1');
            expect(found).toBeDefined();
            expect(found.name).toBe('Alice');
            expect(found.email).toBe('alice@example.com');
            
            await driver2.disconnect();
        });

        it('should support multiple worksheets (object types)', async () => {
            await driver.create('users', { name: 'Alice' });
            await driver.create('products', { name: 'Product A' });
            
            const users = await driver.find('users');
            const products = await driver.find('products');
            
            expect(users).toHaveLength(1);
            expect(products).toHaveLength(1);
            expect(users[0].name).toBe('Alice');
            expect(products[0].name).toBe('Product A');
        });

        it('should handle autoSave disabled', async () => {
            const manualDriver = await ExcelDriver.create({
                filePath: path.join(TEST_DIR, 'manual-save.xlsx'),
                autoSave: false,
                createIfMissing: true
            });
            
            await manualDriver.create(TEST_OBJECT, {
                name: 'Alice'
            });
            
            // Manually save
            await manualDriver.save();
            
            // Verify persistence
            const driver2 = await ExcelDriver.create({
                filePath: path.join(TEST_DIR, 'manual-save.xlsx'),
                createIfMissing: false
            });
            
            const results = await driver2.find(TEST_OBJECT);
            expect(results).toHaveLength(1);
            
            await manualDriver.disconnect();
            await driver2.disconnect();
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty result sets', async () => {
            const results = await driver.find('non_existent_object');
            expect(results).toEqual([]);
        });

        it('should handle filters on empty data', async () => {
            const results = await driver.find(TEST_OBJECT, {
                filters: [['name', '=', 'Alice']]
            });
            expect(results).toEqual([]);
        });

        it('should handle null and undefined values', async () => {
            const result = await driver.create(TEST_OBJECT, {
                name: 'Alice',
                optional_field: null
            });
            
            expect(result.optional_field).toBeNull();
        });

        it('should handle special characters in data', async () => {
            const result = await driver.create(TEST_OBJECT, {
                name: 'O\'Brien',
                description: 'Test "quotes" & special <chars>'
            });
            
            const found = await driver.findOne(TEST_OBJECT, result.id);
            expect(found.name).toBe('O\'Brien');
            expect(found.description).toBe('Test "quotes" & special <chars>');
        });
    });

    describe('File Per Object Mode', () => {
        const FILE_PER_OBJECT_DIR = path.join(TEST_DIR, 'file-per-object');
        let filePerObjectDriver: ExcelDriver;

        beforeEach(async () => {
            // Clean up directory
            if (fs.existsSync(FILE_PER_OBJECT_DIR)) {
                fs.rmSync(FILE_PER_OBJECT_DIR, { recursive: true, force: true });
            }
            
            // Create driver in file-per-object mode
            filePerObjectDriver = await ExcelDriver.create({
                filePath: FILE_PER_OBJECT_DIR,
                fileStorageMode: 'file-per-object',
                createIfMissing: true,
                autoSave: true
            });
        });

        afterEach(async () => {
            if (filePerObjectDriver) {
                await filePerObjectDriver.disconnect();
            }
        });

        it('should create separate files for each object type', async () => {
            await filePerObjectDriver.create('users', { name: 'Alice' });
            await filePerObjectDriver.create('products', { name: 'Product A' });
            
            // Check that separate files exist
            expect(fs.existsSync(path.join(FILE_PER_OBJECT_DIR, 'users.xlsx'))).toBe(true);
            expect(fs.existsSync(path.join(FILE_PER_OBJECT_DIR, 'products.xlsx'))).toBe(true);
        });

        it('should load data from separate files', async () => {
            await filePerObjectDriver.create('users', { id: 'user-1', name: 'Alice' });
            await filePerObjectDriver.create('products', { id: 'prod-1', name: 'Product A' });
            await filePerObjectDriver.save();
            
            // Create new driver instance and load from files
            const driver2 = await ExcelDriver.create({
                filePath: FILE_PER_OBJECT_DIR,
                fileStorageMode: 'file-per-object',
                createIfMissing: false
            });
            
            const users = await driver2.find('users');
            const products = await driver2.find('products');
            
            expect(users).toHaveLength(1);
            expect(products).toHaveLength(1);
            expect(users[0].name).toBe('Alice');
            expect(products[0].name).toBe('Product A');
            
            await driver2.disconnect();
        });

        it('should support all CRUD operations in file-per-object mode', async () => {
            // Create
            const user = await filePerObjectDriver.create('users', {
                name: 'Bob',
                email: 'bob@example.com'
            });
            expect(user.name).toBe('Bob');
            
            // Read
            const found = await filePerObjectDriver.findOne('users', user.id);
            expect(found.name).toBe('Bob');
            
            // Update
            await filePerObjectDriver.update('users', user.id, { email: 'bob.new@example.com' });
            const updated = await filePerObjectDriver.findOne('users', user.id);
            expect(updated.email).toBe('bob.new@example.com');
            
            // Delete
            await filePerObjectDriver.delete('users', user.id);
            const deleted = await filePerObjectDriver.findOne('users', user.id);
            expect(deleted).toBeNull();
        });
    });
});
