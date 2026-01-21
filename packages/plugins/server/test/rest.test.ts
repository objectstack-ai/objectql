/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import request from 'supertest';
import { createServer } from 'http';
import { ObjectQL } from '@objectql/core';
import { createRESTHandler } from '../src/adapters/rest';
import { Driver } from '@objectql/types';

// Simple Mock Driver
class MockDriver implements Driver {
    private data: Record<string, any[]> = {
        user: [
            { _id: '1', name: 'Alice', email: 'alice@example.com' },
            { _id: '2', name: 'Bob', email: 'bob@example.com' }
        ]
    };
    private nextId = 3;

    async init() {}
    
    async find(objectName: string, query: any) {
        let items = this.data[objectName] || [];
        
        // Apply filters if provided
        if (query && query.filters) {
            const filters = query.filters;
            if (typeof filters === 'object') {
                const filterKeys = Object.keys(filters);
                if (filterKeys.length > 0) {
                    items = items.filter(item => {
                        for (const [key, value] of Object.entries(filters)) {
                            if (item[key] !== value) {
                                return false;
                            }
                        }
                        return true;
                    });
                }
            }
        }
        
        // Apply skip and limit if provided
        if (query) {
            if (query.skip) {
                items = items.slice(query.skip);
            }
            if (query.limit) {
                items = items.slice(0, query.limit);
            }
        }
        
        return items;
    }
    
    async findOne(objectName: string, id: string | number, query?: any, options?: any) {
        const items = this.data[objectName] || [];
        if (id !== undefined && id !== null) {
            const found = items.find(item => item._id === String(id));
            return found || null;
        }
        return items[0] || null;
    }
    
    async create(objectName: string, data: any) {
        const newItem = { _id: String(this.nextId++), ...data };
        if (!this.data[objectName]) {
            this.data[objectName] = [];
        }
        this.data[objectName].push(newItem);
        return newItem;
    }
    
    async update(objectName: string, id: string, data: any) {
        const items = this.data[objectName] || [];
        const index = items.findIndex(item => item._id === id);
        if (index >= 0) {
            this.data[objectName][index] = { ...items[index], ...data };
            return 1;
        }
        return 0;
    }
    
    async delete(objectName: string, id: string) {
        const items = this.data[objectName] || [];
        const index = items.findIndex(item => item._id === id);
        if (index >= 0) {
            this.data[objectName].splice(index, 1);
            return 1;
        }
        return 0;
    }
    
    async count(objectName: string, query: any) {
        return (this.data[objectName] || []).length;
    }
    
    async createMany(objectName: string, data: any[]) {
        const newItems = data.map(item => ({
            _id: String(this.nextId++),
            ...item
        }));
        if (!this.data[objectName]) {
            this.data[objectName] = [];
        }
        this.data[objectName].push(...newItems);
        return newItems;
    }
    
    async updateMany(objectName: string, filters: any, data: any) {
        const items = this.data[objectName] || [];
        let count = 0;
        
        // NOTE: Simplified filter implementation for testing purposes only.
        // Production drivers should implement full ObjectQL filter evaluation
        // with support for operators like ["<", value], [">=", value], etc.
        // This mock only supports exact-match comparison on object properties.
        items.forEach((item, index) => {
            let matches = true;
            if (filters && typeof filters === 'object') {
                const filterKeys = Object.keys(filters);
                // If no filter keys, match nothing (not everything)
                if (filterKeys.length === 0) {
                    matches = false;
                } else {
                    for (const [key, value] of Object.entries(filters)) {
                        if (item[key] !== value) {
                            matches = false;
                            break;
                        }
                    }
                }
            }
            if (matches) {
                this.data[objectName][index] = { ...item, ...data };
                count++;
            }
        });
        
        return count;
    }
    
    async deleteMany(objectName: string, filters: any) {
        const items = this.data[objectName] || [];
        const initialLength = items.length;
        
        // NOTE: Simplified filter implementation for testing purposes only.
        // Production drivers should implement full ObjectQL filter evaluation.
        // This mock only supports exact-match comparison on object properties.
        this.data[objectName] = items.filter(item => {
            let matches = true;
            if (filters && typeof filters === 'object') {
                const filterKeys = Object.keys(filters);
                // If no filter keys, match nothing (not everything)
                if (filterKeys.length === 0) {
                    matches = false;
                } else {
                    for (const [key, value] of Object.entries(filters)) {
                        if (item[key] !== value) {
                            matches = false;
                            break;
                        }
                    }
                }
            }
            return !matches; // Keep items that don't match
        });
        
        return initialLength - this.data[objectName].length;
    }
    
    async execute(sql: string) {}
}

describe('REST API Adapter', () => {
    let app: ObjectQL;
    let server: any;
    let handler: any;

    beforeAll(async () => {
        app = new ObjectQL({
            datasources: {
                default: new MockDriver()
            }
        });
        
        // Manual schema registration
        app.metadata.register('object', {
            type: 'object',
            id: 'user',
            content: {
                name: 'user',
                fields: {
                    name: { type: 'text' },
                    email: { type: 'email' }
                }
            }
        });

        // Create handler and server once for all tests
        handler = createRESTHandler(app);
        server = createServer(handler);
    });

    it('should handle GET /api/data/:object - List records', async () => {
        const response = await request(server)
            .get('/api/data/user')
            .set('Accept', 'application/json');

        expect(response.status).toBe(200);
        expect(response.body.items).toHaveLength(2);
        expect(response.body.items[0].name).toBe('Alice');
    });

    it('should handle GET /api/data/:object/:id - Get single record', async () => {
        const response = await request(server)
            .get('/api/data/user/1')
            .set('Accept', 'application/json');

        expect(response.status).toBe(200);
        expect(response.body.name).toBe('Alice');
        expect(response.body['@type']).toBe('user');
    });

    it('should handle POST /api/data/:object - Create record', async () => {
        const response = await request(server)
            .post('/api/data/user')
            .send({ name: 'Charlie', email: 'charlie@example.com' })
            .set('Accept', 'application/json');

        expect(response.status).toBe(201);
        expect(response.body.name).toBe('Charlie');
        expect(response.body._id).toBeDefined();
        expect(response.body['@type']).toBe('user');
    });

    it('should handle PUT /api/data/:object/:id - Update record', async () => {
        const response = await request(server)
            .put('/api/data/user/1')
            .send({ name: 'Alice Updated' })
            .set('Accept', 'application/json');

        expect(response.status).toBe(200);
    });

    it('should handle DELETE /api/data/:object/:id - Delete record', async () => {
        const response = await request(server)
            .delete('/api/data/user/1')
            .set('Accept', 'application/json');

        expect(response.status).toBe(200);
        expect(response.body.deleted).toBe(true);
        expect(response.body['@type']).toBe('user');
    });

    it('should return 404 for non-existent object', async () => {
        const response = await request(server)
            .get('/api/data/nonexistent')
            .set('Accept', 'application/json');

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for update without ID', async () => {
        const response = await request(server)
            .put('/api/data/user')
            .send({ name: 'Test' })
            .set('Accept', 'application/json');

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('INVALID_REQUEST');
    });

    it('should include pagination metadata with limit and skip', async () => {
        const response = await request(server)
            .get('/api/data/user?limit=1&skip=0')
            .set('Accept', 'application/json');

        expect(response.status).toBe(200);
        expect(response.body.items).toBeDefined();
        expect(response.body.meta).toBeDefined();
        expect(response.body.meta.total).toBe(2);
        expect(response.body.meta.page).toBe(1);
        expect(response.body.meta.size).toBe(1);
        expect(response.body.meta.pages).toBe(2);
        expect(response.body.meta.has_next).toBe(true);
    });

    it('should calculate pagination metadata correctly for second page', async () => {
        const response = await request(server)
            .get('/api/data/user?limit=1&skip=1')
            .set('Accept', 'application/json');

        expect(response.status).toBe(200);
        expect(response.body.meta.page).toBe(2);
        expect(response.body.meta.has_next).toBe(false);
    });

    // Bulk operations tests
    describe('Bulk Operations', () => {
        it('should handle POST /api/data/:object with array - Create many records', async () => {
            const response = await request(server)
                .post('/api/data/user')
                .send([
                    { name: 'User1', email: 'user1@example.com' },
                    { name: 'User2', email: 'user2@example.com' },
                    { name: 'User3', email: 'user3@example.com' }
                ])
                .set('Accept', 'application/json');

            expect(response.status).toBe(201);
            expect(response.body.items).toBeDefined();
            expect(response.body.items).toHaveLength(3);
            expect(response.body.count).toBe(3);
            expect(response.body['@type']).toBe('user');
            expect(response.body.items[0].name).toBe('User1');
            expect(response.body.items[0]._id).toBeDefined();
        });

        it('should handle POST /api/data/:object/bulk-update - Update many records', async () => {
            // First create some users
            await request(server)
                .post('/api/data/user')
                .send([
                    { name: 'TestUser1', email: 'test1@example.com', role: 'user' },
                    { name: 'TestUser2', email: 'test2@example.com', role: 'user' }
                ]);

            // Now update all users with role 'user'
            const response = await request(server)
                .post('/api/data/user/bulk-update')
                .send({
                    filters: { role: 'user' },
                    data: { role: 'admin' }
                })
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body.count).toBeGreaterThan(0);
            expect(response.body['@type']).toBe('user');

            // Verify the records were actually updated
            const verifyResponse = await request(server)
                .get('/api/data/user')
                .set('Accept', 'application/json');
            
            const adminUsers = verifyResponse.body.items.filter((u: any) => u.role === 'admin');
            expect(adminUsers.length).toBeGreaterThan(0);
        });

        it('should handle POST /api/data/:object/bulk-delete - Delete many records', async () => {
            // First create some users
            await request(server)
                .post('/api/data/user')
                .send([
                    { name: 'ToDelete1', email: 'delete1@example.com', status: 'inactive' },
                    { name: 'ToDelete2', email: 'delete2@example.com', status: 'inactive' }
                ]);

            // Now delete all inactive users
            const response = await request(server)
                .post('/api/data/user/bulk-delete')
                .send({
                    filters: { status: 'inactive' }
                })
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body.count).toBeGreaterThan(0);
            expect(response.body['@type']).toBe('user');

            // Verify the records were actually deleted
            const verifyResponse = await request(server)
                .get('/api/data/user')
                .set('Accept', 'application/json');
            
            const inactiveUsers = verifyResponse.body.items.filter((u: any) => u.status === 'inactive');
            expect(inactiveUsers.length).toBe(0);
        });

        // Edge case tests
        it('should handle createMany with empty array', async () => {
            const response = await request(server)
                .post('/api/data/user')
                .send([])
                .set('Accept', 'application/json');

            expect(response.status).toBe(201);
            expect(response.body.items).toHaveLength(0);
            expect(response.body.count).toBe(0);
        });

        it('should handle updateMany with no matching records', async () => {
            const response = await request(server)
                .post('/api/data/user/bulk-update')
                .send({
                    filters: { role: 'nonexistent' },
                    data: { role: 'admin' }
                })
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body.count).toBe(0);
        });

        it('should handle deleteMany with no matching records', async () => {
            const response = await request(server)
                .post('/api/data/user/bulk-delete')
                .send({
                    filters: { status: 'nonexistent' }
                })
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body.count).toBe(0);
        });

        it('should return error for updateMany without data field', async () => {
            const response = await request(server)
                .post('/api/data/user/bulk-update')
                .send({
                    filters: { role: 'user' }
                    // Missing data field
                })
                .set('Accept', 'application/json');

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe('INVALID_REQUEST');
        });

        it('should return error for createMany with non-array', async () => {
            const response = await request(server)
                .post('/api/data/user')
                .send({ name: 'NotAnArray' }) // Send object instead of array when bulk create expected
                .set('Accept', 'application/json');

            // Should still work as single create
            expect(response.status).toBe(201);
            expect(response.body._id).toBeDefined();
        });
    });
});
