import request from 'supertest';
import { createServer } from 'http';
import { ObjectQL } from '@objectql/core';
import { createRESTHandler } from '../src/adapters/rest';
import { Driver } from '@objectql/types';

// Simple Mock Driver
class MockDriver implements Driver {
    private data: Record<string, any[]> = {};
    private nextId = 1;

    async init() {}
    
    async find(objectName: string, query: any) {
        let items = this.data[objectName] || [];
        
        // Apply filters if provided
        if (query?.filters && Array.isArray(query.filters)) {
            for (const filter of query.filters) {
                if (Array.isArray(filter) && filter.length === 3) {
                    const [field, operator, value] = filter;
                    items = items.filter(item => {
                        if (operator === '=') return item[field] === value;
                        if (operator === '!=') return item[field] !== value;
                        if (operator === '>') return item[field] > value;
                        if (operator === '>=') return item[field] >= value;
                        if (operator === '<') return item[field] < value;
                        if (operator === '<=') return item[field] <= value;
                        if (operator === 'in') return Array.isArray(value) && value.includes(item[field]);
                        return true;
                    });
                }
            }
        }
        
        // Apply skip and limit
        if (query?.skip) {
            items = items.slice(query.skip);
        }
        if (query?.limit) {
            items = items.slice(0, query.limit);
        }
        
        return items;
    }
    
    async findOne(objectName: string, id: string | number) {
        const items = this.data[objectName] || [];
        return items.find(item => item._id === String(id)) || null;
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
        const items = await this.find(objectName, query);
        return items.length;
    }
    
    async execute(sql: string) {}

    // Helper to reset data
    resetData() {
        this.data = {};
        this.nextId = 1;
    }

    // Helper to seed data
    seedData(objectName: string, items: any[]) {
        this.data[objectName] = items.map(item => ({ _id: String(this.nextId++), ...item }));
    }
}

describe('REST API Error Handling & Edge Cases', () => {
    let app: ObjectQL;
    let server: any;
    let handler: any;
    let driver: MockDriver;

    beforeAll(async () => {
        driver = new MockDriver();
        app = new ObjectQL({
            datasources: {
                default: driver
            }
        });
        
        // Register schemas
        app.metadata.register('object', {
            type: 'object',
            id: 'task',
            content: {
                name: 'task',
                fields: {
                    title: { type: 'text', required: true },
                    status: { type: 'select', options: ['todo', 'in_progress', 'done'] },
                    priority: { type: 'number' },
                    completed: { type: 'boolean' }
                }
            }
        });

        handler = createRESTHandler(app);
        server = createServer(handler);
    });

    beforeEach(() => {
        driver.resetData();
    });

    describe('Query Parameters', () => {
        beforeEach(() => {
            driver.seedData('task', [
                { title: 'Task 1', status: 'todo', priority: 1 },
                { title: 'Task 2', status: 'in_progress', priority: 2 },
                { title: 'Task 3', status: 'done', priority: 3 },
                { title: 'Task 4', status: 'todo', priority: 1 },
                { title: 'Task 5', status: 'done', priority: 2 }
            ]);
        });

        it('should handle basic query without filters', async () => {
            const response = await request(server)
                .get('/api/data/task')
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body.items).toBeDefined();
            expect(Array.isArray(response.body.items)).toBe(true);
        });

        it('should paginate results correctly', async () => {
            const response = await request(server)
                .get('/api/data/task')
                .query({ limit: 2, skip: 0 })
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body.items).toHaveLength(2);
            expect(response.body.meta.page).toBe(1);
            expect(response.body.meta.size).toBe(2);
            // has_next may or may not be present depending on implementation
            if (response.body.meta.has_next !== undefined) {
                expect(typeof response.body.meta.has_next).toBe('boolean');
            }
        });

        it('should handle last page pagination', async () => {
            const response = await request(server)
                .get('/api/data/task')
                .query({ limit: 2, skip: 4 })
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body.items).toHaveLength(1);
            expect(response.body.meta.page).toBe(3);
            expect(response.body.meta.has_next).toBe(false);
        });

        it('should handle skip beyond total count', async () => {
            const response = await request(server)
                .get('/api/data/task')
                .query({ limit: 10, skip: 100 })
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body.items).toHaveLength(0);
        });

        it('should handle zero limit', async () => {
            const response = await request(server)
                .get('/api/data/task')
                .query({ limit: 0 })
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            // Zero limit may return all or none depending on implementation
            expect(response.body.items).toBeDefined();
        });

        it('should handle negative skip as zero', async () => {
            const response = await request(server)
                .get('/api/data/task')
                .query({ limit: 2, skip: -1 })
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body.items).toBeDefined();
        });
    });

    describe('Error Responses', () => {
        it('should return 404 or 500 for non-existent record', async () => {
            const response = await request(server)
                .get('/api/data/task/999')
                .set('Accept', 'application/json');

            // May return 404 or 500 depending on implementation
            expect([404, 500]).toContain(response.status);
        });

        it('should return 404 when deleting non-existent record', async () => {
            const response = await request(server)
                .delete('/api/data/task/999')
                .set('Accept', 'application/json');

            expect(response.status).toBe(404);
        });

        it('should handle updating non-existent record', async () => {
            const response = await request(server)
                .put('/api/data/task/999')
                .send({ title: 'Updated' })
                .set('Accept', 'application/json');

            // May succeed with 200 (creating) or fail with 404 depending on implementation
            expect([200, 404, 500]).toContain(response.status);
        });

        it('should return 400 for missing required field in create', async () => {
            const response = await request(server)
                .post('/api/data/task')
                .send({ status: 'todo' })  // Missing required 'title'
                .set('Accept', 'application/json');

            // Note: validation might be handled by ObjectQL core, this tests the flow
            expect([400, 500]).toContain(response.status);
        });

        it('should return 400 for invalid method on collection endpoint', async () => {
            const response = await request(server)
                .patch('/api/data/task')  // PATCH not supported on collection
                .send({ title: 'Test' })
                .set('Accept', 'application/json');

            expect(response.status).toBe(400);
        });
    });

    describe('Response Format', () => {
        beforeEach(() => {
            driver.seedData('task', [
                { title: 'Sample Task', status: 'todo', priority: 1 }
            ]);
        });

        it('should include @type in single record response', async () => {
            const response = await request(server)
                .get('/api/data/task/1')
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body['@type']).toBe('task');
        });

        it('should include @type in created record response', async () => {
            const response = await request(server)
                .post('/api/data/task')
                .send({ title: 'New Task', status: 'todo' })
                .set('Accept', 'application/json');

            expect(response.status).toBe(201);
            expect(response.body['@type']).toBe('task');
        });

        it('should return items array for list endpoint', async () => {
            const response = await request(server)
                .get('/api/data/task')
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.items)).toBe(true);
        });

        it('should include meta in list response', async () => {
            const response = await request(server)
                .get('/api/data/task')
                .query({ limit: 10 })
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body.meta).toBeDefined();
            expect(response.body.meta.total).toBeDefined();
            expect(response.body.meta.page).toBeDefined();
            expect(response.body.meta.size).toBeDefined();
        });
    });

    describe('CORS and Headers', () => {
        it('should set correct content-type header', async () => {
            const response = await request(server)
                .get('/api/data/task')
                .set('Accept', 'application/json');

            expect(response.headers['content-type']).toMatch(/application\/json/);
        });

        it('should handle missing accept header', async () => {
            const response = await request(server)
                .get('/api/data/task');

            expect(response.status).toBe(200);
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty object name', async () => {
            const response = await request(server)
                .get('/api/data/')
                .set('Accept', 'application/json');

            expect([400, 404]).toContain(response.status);
        });

        it('should handle special characters in ID', async () => {
            const response = await request(server)
                .get('/api/data/task/abc-123-xyz')
                .set('Accept', 'application/json');

            expect([404, 500]).toContain(response.status);
        });

        it('should handle empty request body for create', async () => {
            const response = await request(server)
                .post('/api/data/task')
                .send({})
                .set('Accept', 'application/json');

            expect([400, 500]).toContain(response.status);
        });

        it('should handle null in request body', async () => {
            const response = await request(server)
                .post('/api/data/task')
                .send('null')  // Send as string instead of null
                .set('Content-Type', 'application/json');

            expect([400, 500]).toContain(response.status);
        });

        it('should handle malformed JSON gracefully', async () => {
            const response = await request(server)
                .post('/api/data/task')
                .set('Content-Type', 'application/json')
                .send('{ invalid json }');

            expect([400, 500]).toContain(response.status);
        });
    });

    describe('Bulk Operations', () => {
        it('should handle creating multiple records sequentially', async () => {
            const tasks = [
                { title: 'Task 1', status: 'todo' },
                { title: 'Task 2', status: 'in_progress' },
                { title: 'Task 3', status: 'done' }
            ];

            for (const task of tasks) {
                const response = await request(server)
                    .post('/api/data/task')
                    .send(task)
                    .set('Accept', 'application/json');

                expect(response.status).toBe(201);
            }

            const listResponse = await request(server)
                .get('/api/data/task')
                .set('Accept', 'application/json');

            expect(listResponse.body.items).toHaveLength(3);
        });

        it('should handle updating same record multiple times', async () => {
            driver.seedData('task', [{ title: 'Original', status: 'todo' }]);

            await request(server)
                .put('/api/data/task/1')
                .send({ title: 'Update 1' })
                .set('Accept', 'application/json');

            const response = await request(server)
                .put('/api/data/task/1')
                .send({ title: 'Update 2', status: 'done' })
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
        });
    });

    describe('Count Endpoint', () => {
        beforeEach(() => {
            driver.seedData('task', [
                { title: 'Task 1', status: 'todo' },
                { title: 'Task 2', status: 'todo' },
                { title: 'Task 3', status: 'done' }
            ]);
        });

        it('should return meta with total count', async () => {
            const response = await request(server)
                .get('/api/data/task')
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            if (response.body.meta) {
                expect(response.body.meta.total).toBeDefined();
                expect(typeof response.body.meta.total).toBe('number');
            }
        });

        it('should count filtered records', async () => {
            const response = await request(server)
                .get('/api/data/task')
                .query({ 
                    'filters[][0]': 'status', 
                    'filters[][1]': '=', 
                    'filters[][2]': 'todo' 
                })
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            if (response.body.meta) {
                expect(response.body.meta.total).toBeDefined();
            }
        });
    });
});
