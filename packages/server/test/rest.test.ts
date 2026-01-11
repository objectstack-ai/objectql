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
        return this.data[objectName] || [];
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
        expect(response.body.data).toHaveLength(2);
        expect(response.body.data[0].name).toBe('Alice');
    });

    it('should handle GET /api/data/:object/:id - Get single record', async () => {
        const response = await request(server)
            .get('/api/data/user/1')
            .set('Accept', 'application/json');

        expect(response.status).toBe(200);
        expect(response.body.data.name).toBe('Alice');
    });

    it('should handle POST /api/data/:object - Create record', async () => {
        const response = await request(server)
            .post('/api/data/user')
            .send({ name: 'Charlie', email: 'charlie@example.com' })
            .set('Accept', 'application/json');

        expect(response.status).toBe(201);
        expect(response.body.data.name).toBe('Charlie');
        expect(response.body.data._id).toBeDefined();
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
        expect(response.body.data.deleted).toBe(true);
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
});
