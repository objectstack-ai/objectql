/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Tests for Custom API Route Configuration
 * 
 * Validates that API routes can be configured at initialization time
 * instead of being hardcoded.
 */

import request from 'supertest';
import { createServer } from 'http';
import { ObjectQL } from '@objectql/core';
import { createNodeHandler, createRESTHandler, createMetadataHandler } from '../src';
import { Driver } from '@objectql/types';

// Simple Mock Driver for testing
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
    
    async count(objectName: string) {
        return (this.data[objectName] || []).length;
    }
    
    async createMany(objectName: string, data: any[]) {
        const results = [];
        for (const item of data) {
            results.push(await this.create(objectName, item));
        }
        return results;
    }
    
    async updateMany(objectName: string, filters: any, data: any) {
        return 0;
    }
    
    async deleteMany(objectName: string, filters: any) {
        return 0;
    }
}

describe('Custom API Routes', () => {
    let app: ObjectQL;
    
    beforeEach(async () => {
        app = new ObjectQL({
            datasources: {
                default: new MockDriver()
            }
        });
        
        app.registerObject({
            name: 'user',
            label: 'User',
            fields: {
                name: { type: 'text', label: 'Name' },
                email: { type: 'email', label: 'Email' }
            }
        });
        
        await app.init();
    });

    describe('REST Handler with Custom Routes', () => {
        it('should work with custom data path /v1/resources', async () => {
            const customRoutes = {
                data: '/v1/resources'
            };
            
            const handler = createRESTHandler(app, { routes: customRoutes });
            const server = createServer(handler);
            
            const res = await request(server)
                .get('/v1/resources/user')
                .expect(200);
                
            expect(res.body.items).toBeDefined();
            expect(res.body.items.length).toBe(2);
        });

        it('should not respond to default path when custom path is set', async () => {
            const customRoutes = {
                data: '/v1/resources'
            };
            
            const handler = createRESTHandler(app, { routes: customRoutes });
            const server = createServer(handler);
            
            await request(server)
                .get('/api/data/user')
                .expect(404);
        });

        it('should support multiple custom paths', async () => {
            const customRoutes = {
                data: '/api/v2/data',
                metadata: '/api/v2/metadata'
            };
            
            const restHandler = createRESTHandler(app, { routes: customRoutes });
            const restServer = createServer(restHandler);
            
            const metadataHandler = createMetadataHandler(app, { routes: customRoutes });
            const metadataServer = createServer(metadataHandler);
            
            // Test REST API with custom path
            const restRes = await request(restServer)
                .get('/api/v2/data/user')
                .expect(200);
            expect(restRes.body.items).toBeDefined();
            
            // Test Metadata API with custom path
            const metadataRes = await request(metadataServer)
                .get('/api/v2/metadata/objects')
                .expect(200);
            expect(metadataRes.body.items).toBeDefined();
        });
    });

    describe('Node Handler with Custom Routes', () => {
        it('should work with custom RPC path /v1/rpc', async () => {
            const customRoutes = {
                rpc: '/v1/rpc',
                data: '/v1/data'
            };
            
            const handler = createNodeHandler(app, { routes: customRoutes });
            const server = createServer(handler);
            
            // Test custom RPC endpoint
            const res = await request(server)
                .post('/v1/rpc')
                .send({
                    op: 'find',
                    object: 'user',
                    args: {}
                })
                .expect(200);
                
            // NodeHandler returns the full ObjectQLResponse
            expect(res.body.items || res.body.data).toBeDefined();
        });

        it('should work with custom data path for REST operations', async () => {
            const customRoutes = {
                rpc: '/v1/rpc',
                data: '/v1/data'
            };
            
            const handler = createNodeHandler(app, { routes: customRoutes });
            const server = createServer(handler);
            
            // Test custom REST endpoint
            const res = await request(server)
                .get('/v1/data/user')
                .expect(200);
                
            expect(res.body.items).toBeDefined();
        });

        it('should work with custom files path', async () => {
            const customRoutes = {
                rpc: '/v1/rpc',
                data: '/v1/data',
                files: '/v1/storage'
            };
            
            const handler = createNodeHandler(app, { routes: customRoutes });
            const server = createServer(handler);
            
            // Test that file upload path is recognized (will fail without multipart body, but path is recognized)
            const res = await request(server)
                .post('/v1/storage/upload');
                
            // Should not be 404 (not found), but may be 400 (bad request) or 500 (server error)
            expect(res.status).not.toBe(404);
        });
    });

    describe('Metadata Handler with Custom Routes', () => {
        it('should work with custom metadata path /v1/schema', async () => {
            const customRoutes = {
                metadata: '/v1/schema'
            };
            
            const handler = createMetadataHandler(app, { routes: customRoutes });
            const server = createServer(handler);
            
            const res = await request(server)
                .get('/v1/schema/objects')
                .expect(200);
                
            expect(res.body.items).toBeDefined();
            expect(res.body.items.length).toBeGreaterThan(0);
        });

        it('should support object detail endpoint with custom path', async () => {
            const customRoutes = {
                metadata: '/v1/schema'
            };
            
            const handler = createMetadataHandler(app, { routes: customRoutes });
            const server = createServer(handler);
            
            const res = await request(server)
                .get('/v1/schema/object/user')
                .expect(200);
                
            expect(res.body.name).toBe('user');
            expect(res.body.fields).toBeDefined();
        });
    });

    describe('Default Routes (Backward Compatibility)', () => {
        it('should use default routes when no custom routes provided', async () => {
            const handler = createRESTHandler(app);
            const server = createServer(handler);
            
            const res = await request(server)
                .get('/api/data/user')
                .expect(200);
                
            expect(res.body.items).toBeDefined();
        });

        it('should use default RPC route when no custom routes provided', async () => {
            const handler = createNodeHandler(app);
            const server = createServer(handler);
            
            const res = await request(server)
                .post('/api/objectql')
                .send({
                    op: 'find',
                    object: 'user',
                    args: {}
                })
                .expect(200);
                
            // NodeHandler returns the full ObjectQLResponse
            expect(res.body.items || res.body.data).toBeDefined();
        });

        it('should use default metadata route when no custom routes provided', async () => {
            const handler = createMetadataHandler(app);
            const server = createServer(handler);
            
            const res = await request(server)
                .get('/api/metadata/objects')
                .expect(200);
                
            expect(res.body.items).toBeDefined();
        });
    });
});
