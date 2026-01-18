/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createMetadataHandler } from '../src/metadata';
import { ObjectQL } from '@objectql/core';
import { IncomingMessage, ServerResponse } from 'http';
import { EventEmitter } from 'events';

// Mock IncomingMessage
class MockRequest extends EventEmitter {
    url: string;
    method: string;
    headers: Record<string, string> = {};

    constructor(method: string, url: string) {
        super();
        this.method = method;
        this.url = url;
    }

    // Simulate sending data
    sendData(data: string) {
        this.emit('data', Buffer.from(data));
        this.emit('end');
    }

    sendJson(data: any) {
        this.sendData(JSON.stringify(data));
    }
}

// Mock ServerResponse
class MockResponse {
    statusCode: number = 200;
    headers: Record<string, string> = {};
    body: string = '';
    ended: boolean = false;

    setHeader(name: string, value: string) {
        this.headers[name] = value;
    }

    end(data?: string) {
        if (data) this.body = data;
        this.ended = true;
    }

    getBody() {
        return this.body ? JSON.parse(this.body) : null;
    }
}

describe('Metadata Handler', () => {
    let app: ObjectQL;
    let handler: (req: IncomingMessage, res: ServerResponse) => Promise<void>;

    beforeEach(async () => {
        app = new ObjectQL({
            datasources: {},
            objects: {
                user: {
                    name: 'user',
                    label: 'User',
                    icon: 'user-icon',
                    description: 'User object',
                    fields: {
                        name: { type: 'text', required: true },
                        email: { type: 'text', required: true }
                    }
                },
                task: {
                    name: 'task',
                    label: 'Task',
                    fields: {
                        title: { type: 'text' },
                        completed: { type: 'boolean' }
                    }
                }
            }
        });
        await app.init();
        handler = createMetadataHandler(app);
    });

    describe('OPTIONS Requests', () => {
        it('should handle OPTIONS request for CORS', async () => {
            const req = new MockRequest('OPTIONS', '/api/metadata');
            const res = new MockResponse();

            await handler(req as any, res as any);

            expect(res.statusCode).toBe(200);
            expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
            expect(res.headers['Access-Control-Allow-Methods']).toBe('GET, POST, PUT, OPTIONS');
            expect(res.ended).toBe(true);
        });
    });

    describe('GET /api/metadata', () => {
        it('should list all objects (root endpoint)', async () => {
            const req = new MockRequest('GET', '/api/metadata');
            const res = new MockResponse();

            req.sendData('');
            await handler(req as any, res as any);

            const body = res.getBody();
            expect(body.items).toBeDefined();
            expect(body.items).toHaveLength(2);
            expect(body.items.find((o: any) => o.name === 'user')).toBeDefined();
            expect(body.items.find((o: any) => o.name === 'task')).toBeDefined();
        });

        it('should include object metadata', async () => {
            const req = new MockRequest('GET', '/api/metadata');
            const res = new MockResponse();

            req.sendData('');
            await handler(req as any, res as any);

            const body = res.getBody();
            const user = body.items.find((o: any) => o.name === 'user');
            
            expect(user.name).toBe('user');
            expect(user.label).toBe('User');
            expect(user.icon).toBe('user-icon');
            expect(user.description).toBe('User object');
            expect(user.fields).toBeDefined();
            expect(user.fields.name).toBeDefined();
            expect(user.fields.email).toBeDefined();
        });
    });

    describe('GET /api/metadata/:type', () => {
        it('should list objects with /api/metadata/object', async () => {
            const req = new MockRequest('GET', '/api/metadata/object');
            const res = new MockResponse();

            req.sendData('');
            await handler(req as any, res as any);

            const body = res.getBody();
            expect(body.items).toBeDefined();
            expect(body.items).toHaveLength(2);
        });

        it('should list objects with /api/metadata/objects (alias)', async () => {
            const req = new MockRequest('GET', '/api/metadata/objects');
            const res = new MockResponse();

            req.sendData('');
            await handler(req as any, res as any);

            const body = res.getBody();
            expect(body.items).toBeDefined();
            expect(body.items).toHaveLength(2);
        });

        it('should list custom metadata types', async () => {
            // Register custom metadata
            app.metadata.register('action', {
                type: 'action',
                id: 'sendEmail',
                content: { name: 'sendEmail', handler: 'email.handler' }
            });

            const req = new MockRequest('GET', '/api/metadata/action');
            const res = new MockResponse();

            req.sendData('');
            await handler(req as any, res as any);

            const body = res.getBody();
            expect(body.items).toBeDefined();
            expect(body.items).toHaveLength(1);
            expect(body.items[0].name).toBe('sendEmail');
        });

        it('should return empty array for non-existent type', async () => {
            const req = new MockRequest('GET', '/api/metadata/nonexistent');
            const res = new MockResponse();

            req.sendData('');
            await handler(req as any, res as any);

            const body = res.getBody();
            expect(body.items).toEqual([]);
        });
    });

    describe('GET /api/metadata/:type/:id', () => {
        it('should get specific object by name', async () => {
            const req = new MockRequest('GET', '/api/metadata/object/user');
            const res = new MockResponse();

            req.sendData('');
            await handler(req as any, res as any);

            const body = res.getBody();
            expect(body.name).toBe('user');
            expect(body.label).toBe('User');
            expect(body.fields).toBeDefined();
        });

        it('should return 404 for non-existent object', async () => {
            const req = new MockRequest('GET', '/api/metadata/object/nonexistent');
            const res = new MockResponse();

            req.sendData('');
            await handler(req as any, res as any);

            expect(res.statusCode).toBe(404);
            const body = res.getBody();
            expect(body.error).toBeDefined();
            expect(body.error.code).toBe('NOT_FOUND');
        });

        it('should get custom metadata by id', async () => {
            app.metadata.register('action', {
                type: 'action',
                id: 'sendEmail',
                content: { name: 'sendEmail', description: 'Send email action' }
            });

            const req = new MockRequest('GET', '/api/metadata/action/sendEmail');
            const res = new MockResponse();

            req.sendData('');
            await handler(req as any, res as any);

            const body = res.getBody();
            expect(body.name).toBe('sendEmail');
            expect(body.description).toBe('Send email action');
        });
    });

    describe('CORS Headers', () => {
        it('should include CORS headers on all responses', async () => {
            const req = new MockRequest('GET', '/api/metadata');
            const res = new MockResponse();

            req.sendData('');
            await handler(req as any, res as any);

            expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
            expect(res.headers['Access-Control-Allow-Methods']).toBeDefined();
            expect(res.headers['Access-Control-Allow-Headers']).toBeDefined();
        });
    });

    describe('Content-Type Header', () => {
        it('should set Content-Type to application/json', async () => {
            const req = new MockRequest('GET', '/api/metadata');
            const res = new MockResponse();

            req.sendData('');
            await handler(req as any, res as any);

            expect(res.headers['Content-Type']).toBe('application/json');
        });
    });
});
