/**
 * Metadata API Tests for Express API Starter
 * 
 * Tests metadata API endpoints
 */

import request from 'supertest';
import { createServer } from 'http';
import express from 'express';
import { ObjectQL } from '@objectql/core';
import { SqlDriver } from '@objectql/driver-sql';
import { ObjectLoader } from '@objectql/platform-node';
import { createMetadataHandler } from '@objectql/server';
import * as path from 'path';

describe('Metadata API', () => {
    let app: ObjectQL;
    let server: any;
    let expressApp: express.Application;

    beforeAll(async () => {
        // Initialize ObjectQL
        app = new ObjectQL({
            datasources: {
                default: new SqlDriver({
                    client: 'sqlite3',
                    connection: {
                        filename: ':memory:'
                    },
                    useNullAsDefault: true
                })
            }
        });

        // Load metadata
        const srcDir = path.resolve(__dirname, '../src');
        const loader = new ObjectLoader(app.metadata);
        loader.load(srcDir);

        await app.init();

        // Setup Express server with metadata handler
        const metadataHandler = createMetadataHandler(app);

        expressApp = express();
        expressApp.all('/api/metadata*', metadataHandler);

        server = createServer(expressApp);
    });

    afterAll(async () => {
        if (app && (app as any).datasources?.default) {
            const driver = (app as any).datasources.default;
            if (driver.knex) {
                await driver.knex.destroy();
            }
        }
    });

    describe('List Objects', () => {
        it('should list all objects via GET /api/metadata', async () => {
            const response = await request(server)
                .get('/api/metadata')
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body.items).toBeDefined();
            expect(Array.isArray(response.body.items)).toBe(true);
            expect(response.body.items.length).toBeGreaterThanOrEqual(2);
            
            const objectNames = response.body.items.map((o: any) => o.name);
            expect(objectNames).toContain('user');
            expect(objectNames).toContain('task');
        });

        it('should list all objects via GET /api/metadata/objects', async () => {
            const response = await request(server)
                .get('/api/metadata/objects')
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body.items).toBeDefined();
            expect(Array.isArray(response.body.items)).toBe(true);
        });

        it('should list objects via GET /api/metadata/object', async () => {
            const response = await request(server)
                .get('/api/metadata/object')
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body.items).toBeDefined();
            expect(Array.isArray(response.body.items)).toBe(true);
        });
    });

    describe('Get Object Details', () => {
        it('should get User object metadata via GET /api/metadata/object/user', async () => {
            const response = await request(server)
                .get('/api/metadata/object/user')
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body.name).toBe('user');
            expect(response.body.label).toBe('Users');
            expect(response.body.fields).toBeDefined();
        });

        it('should get Task object metadata via GET /api/metadata/object/task', async () => {
            const response = await request(server)
                .get('/api/metadata/object/task')
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body.name).toBe('task');
            expect(response.body.label).toBe('Tasks');
            expect(response.body.fields).toBeDefined();
        });

        it('should return 404 for non-existent object', async () => {
            const response = await request(server)
                .get('/api/metadata/object/NonExistent')
                .set('Accept', 'application/json');

            expect(response.status).toBe(404);
            expect(response.body.error).toBeDefined();
        });
    });

    describe('Object Fields', () => {
        it('should include all User fields in object metadata', async () => {
            const response = await request(server)
                .get('/api/metadata/object/user')
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            const fields = response.body.fields;
            
            expect(fields.name).toBeDefined();
            expect(fields.name.type).toBe('string');
            expect(fields.name.label).toBe('Full Name');
            expect(fields.name.required).toBe(true);
            
            expect(fields.email).toBeDefined();
            expect(fields.email.type).toBe('string');
            expect(fields.email.label).toBe('Email Address');
            expect(fields.email.required).toBe(true);
            
            expect(fields.status).toBeDefined();
            expect(fields.status.type).toBe('string');
            expect(fields.status.defaultValue).toBe('active');
            
            expect(fields.age).toBeDefined();
            expect(fields.age.type).toBe('number');
        });

        it('should include all Task fields in object metadata', async () => {
            const response = await request(server)
                .get('/api/metadata/object/task')
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            const fields = response.body.fields;
            
            expect(fields.title).toBeDefined();
            expect(fields.title.type).toBe('string');
            expect(fields.title.required).toBe(true);
            
            expect(fields.description).toBeDefined();
            expect(fields.description.type).toBe('text');
            
            expect(fields.status).toBeDefined();
            expect(fields.status.defaultValue).toBe('pending');
            
            expect(fields.priority).toBeDefined();
            expect(fields.priority.defaultValue).toBe('medium');
            
            expect(fields.completed).toBeDefined();
            expect(fields.completed.type).toBe('boolean');
            expect(fields.completed.defaultValue).toBe(false);
        });

        it('should get specific field metadata via GET /api/metadata/object/user/fields/name', async () => {
            const response = await request(server)
                .get('/api/metadata/object/user/fields/name')
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body.name).toBe('name');
            expect(response.body.type).toBe('string');
            expect(response.body.label).toBe('Full Name');
            expect(response.body.required).toBe(true);
        });

        it('should return 404 for non-existent field', async () => {
            const response = await request(server)
                .get('/api/metadata/object/user/fields/nonexistent')
                .set('Accept', 'application/json');

            expect(response.status).toBe(404);
            expect(response.body.error).toBeDefined();
        });
    });

    describe('Object Actions', () => {
        it('should list object actions via GET /api/metadata/object/user/actions', async () => {
            const response = await request(server)
                .get('/api/metadata/object/user/actions')
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body.items).toBeDefined();
            expect(Array.isArray(response.body.items)).toBe(true);
        });

        it('should list object actions via GET /api/metadata/objects/user/actions (legacy path)', async () => {
            const response = await request(server)
                .get('/api/metadata/objects/user/actions')
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body.items).toBeDefined();
        });

        it('should return 404 for actions of non-existent object', async () => {
            const response = await request(server)
                .get('/api/metadata/object/NonExistent/actions')
                .set('Accept', 'application/json');

            expect(response.status).toBe(404);
        });
    });

    describe('Other Metadata Types', () => {
        it('should list views via GET /api/metadata/view', async () => {
            const response = await request(server)
                .get('/api/metadata/view')
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body.items).toBeDefined();
        });

        it('should handle OPTIONS request for CORS', async () => {
            const response = await request(server)
                .options('/api/metadata/object/user')
                .set('Origin', 'http://localhost:3000');

            expect(response.status).toBe(200);
            expect(response.headers['access-control-allow-origin']).toBe('*');
        });
    });

    describe('Metadata Consistency', () => {
        it('should have consistent object count across endpoints', async () => {
            const response1 = await request(server)
                .get('/api/metadata')
                .set('Accept', 'application/json');

            const response2 = await request(server)
                .get('/api/metadata/object')
                .set('Accept', 'application/json');

            expect(response1.body.items.length).toBe(response2.body.items.length);
        });

        it('should return same object metadata from different endpoints', async () => {
            const response1 = await request(server)
                .get('/api/metadata/object/user')
                .set('Accept', 'application/json');

            const userMeta = app.getObject('user');

            expect(response1.body.name).toBe(userMeta.name);
            expect(response1.body.label).toBe(userMeta.label);
        });
    });
});
