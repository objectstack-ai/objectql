import request from 'supertest';
import { createServer } from 'http';
import { ObjectQL } from '@objectql/core';
import { createNodeHandler } from '../src/adapters/node';
import { IObjectQL, Driver } from '@objectql/types';

// Simple Mock Driver
class MockDriver implements Driver {
    async init() {}
    async find(objectName: string) {
        if (objectName === 'user') {
            return [{ id: 1, name: 'Alice' }];
        }
        return [];
    }
    async findOne() { return null; }
    async create() { return { id: 2, name: 'Bob' }; }
    async update() { return 1; }
    async delete() { return 1; }
    async count() { return 0; }
    async execute() {}
}

describe('Node Adapter', () => {
    let app: ObjectQL;
    let server: any;

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
                    name: { type: 'string' }
                }
            }
        });
    });

    it('should handle find request', async () => {
        const handler = createNodeHandler(app);
        server = createServer(handler);

        const response = await request(server)
            .post('/')
            .send({
                op: 'find',
                object: 'user',
                args: {}
            })
            .set('Accept', 'application/json');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            items: [{ id: 1, name: 'Alice' }]
        });
    });

    it('should handle create request', async () => {
        const handler = createNodeHandler(app);
        server = createServer(handler);

        const response = await request(server)
            .post('/')
            .send({
                op: 'create',
                object: 'user',
                args: { data: { name: 'Bob' } }
            });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            id: 2,
            name: 'Bob',
            '@type': 'user'
        });
    });

    it('should return 200 with welcome page for GET root', async () => {
        const handler = createNodeHandler(app);
        server = createServer(handler);

        const response = await request(server).get('/');
        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toContain('text/html');
        expect(response.text).toContain('ObjectQL Server');
    });
});
