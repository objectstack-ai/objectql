/**
 * Data API Tests for Express API Starter
 * 
 * Tests CRUD operations through the Data API
 */

import request from 'supertest';
import { createServer } from 'http';
import express from 'express';
import { ObjectQL } from '@objectql/core';
import { SqlDriver } from '@objectql/driver-sql';
import { ObjectLoader } from '@objectql/platform-node';
import { createNodeHandler, createRESTHandler } from '@objectql/server';
import * as path from 'path';

describe('Data API', () => {
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

        // Setup Express server with handlers
        const objectQLHandler = createNodeHandler(app);
        const restHandler = createRESTHandler(app);

        expressApp = express();
        expressApp.all('/api/objectql*', objectQLHandler);
        expressApp.all('/api/data/*', restHandler);

        server = createServer(expressApp);
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    describe('JSON-RPC API (/api/objectql)', () => {
        describe('User CRUD Operations', () => {
            let createdUserId: string;

            it('should create a new user', async () => {
                const response = await request(server)
                    .post('/api/objectql')
                    .send({
                        op: 'create',
                        object: 'User',
                        args: {
                            data: {
                                name: 'John Doe',
                                email: 'john@example.com',
                                age: 30,
                                status: 'active'
                            }
                        }
                    })
                    .set('Accept', 'application/json');

                expect(response.status).toBe(200);
                expect(response.body.data).toBeDefined();
                expect(response.body.data.name).toBe('John Doe');
                expect(response.body.data.email).toBe('john@example.com');
                expect(response.body.data._id).toBeDefined();
                
                createdUserId = response.body.data._id;
            });

            it('should find all users', async () => {
                const response = await request(server)
                    .post('/api/objectql')
                    .send({
                        op: 'find',
                        object: 'User',
                        args: {}
                    })
                    .set('Accept', 'application/json');

                expect(response.status).toBe(200);
                expect(response.body.data).toBeDefined();
                expect(Array.isArray(response.body.data)).toBe(true);
                expect(response.body.data.length).toBeGreaterThanOrEqual(1);
            });

            it('should find a user by id', async () => {
                const response = await request(server)
                    .post('/api/objectql')
                    .send({
                        op: 'findOne',
                        object: 'User',
                        args: {
                            id: createdUserId
                        }
                    })
                    .set('Accept', 'application/json');

                expect(response.status).toBe(200);
                expect(response.body.data).toBeDefined();
                expect(response.body.data._id).toBe(createdUserId);
                expect(response.body.data.name).toBe('John Doe');
            });

            it('should update a user', async () => {
                const response = await request(server)
                    .post('/api/objectql')
                    .send({
                        op: 'update',
                        object: 'User',
                        args: {
                            id: createdUserId,
                            data: {
                                age: 31
                            }
                        }
                    })
                    .set('Accept', 'application/json');

                expect(response.status).toBe(200);
                expect(response.body.data).toBeDefined();
            });

            it('should count users', async () => {
                const response = await request(server)
                    .post('/api/objectql')
                    .send({
                        op: 'count',
                        object: 'User',
                        args: {}
                    })
                    .set('Accept', 'application/json');

                expect(response.status).toBe(200);
                expect(response.body.data).toBeDefined();
                expect(typeof response.body.data).toBe('number');
                expect(response.body.data).toBeGreaterThanOrEqual(1);
            });

            it('should delete a user', async () => {
                const response = await request(server)
                    .post('/api/objectql')
                    .send({
                        op: 'delete',
                        object: 'User',
                        args: {
                            id: createdUserId
                        }
                    })
                    .set('Accept', 'application/json');

                expect(response.status).toBe(200);
                expect(response.body.data).toBeDefined();
            });
        });

        describe('Task CRUD Operations', () => {
            let createdTaskId: string;

            it('should create a new task', async () => {
                const response = await request(server)
                    .post('/api/objectql')
                    .send({
                        op: 'create',
                        object: 'Task',
                        args: {
                            data: {
                                title: 'Test Task',
                                description: 'This is a test task',
                                status: 'pending',
                                priority: 'high',
                                completed: false
                            }
                        }
                    })
                    .set('Accept', 'application/json');

                expect(response.status).toBe(200);
                expect(response.body.data).toBeDefined();
                expect(response.body.data.title).toBe('Test Task');
                expect(response.body.data._id).toBeDefined();
                
                createdTaskId = response.body.data._id;
            });

            it('should find tasks with filters', async () => {
                const response = await request(server)
                    .post('/api/objectql')
                    .send({
                        op: 'find',
                        object: 'Task',
                        args: {
                            filters: {
                                status: 'pending'
                            }
                        }
                    })
                    .set('Accept', 'application/json');

                expect(response.status).toBe(200);
                expect(response.body.data).toBeDefined();
                expect(Array.isArray(response.body.data)).toBe(true);
            });

            it('should update task status', async () => {
                const response = await request(server)
                    .post('/api/objectql')
                    .send({
                        op: 'update',
                        object: 'Task',
                        args: {
                            id: createdTaskId,
                            data: {
                                status: 'in-progress',
                                completed: false
                            }
                        }
                    })
                    .set('Accept', 'application/json');

                expect(response.status).toBe(200);
                expect(response.body.data).toBeDefined();
            });

            it('should delete task', async () => {
                const response = await request(server)
                    .post('/api/objectql')
                    .send({
                        op: 'delete',
                        object: 'Task',
                        args: {
                            id: createdTaskId
                        }
                    })
                    .set('Accept', 'application/json');

                expect(response.status).toBe(200);
            });
        });
    });

    describe('REST API (/api/data)', () => {
        describe('User Operations', () => {
            let userId: string;

            it('should create user via POST /api/data/User', async () => {
                const response = await request(server)
                    .post('/api/data/User')
                    .send({
                        name: 'Jane Smith',
                        email: 'jane@example.com',
                        age: 28,
                        status: 'active'
                    })
                    .set('Accept', 'application/json');

                expect(response.status).toBe(201);
                expect(response.body._id).toBeDefined();
                expect(response.body.name).toBe('Jane Smith');
                
                userId = response.body._id;
            });

            it('should list users via GET /api/data/User', async () => {
                const response = await request(server)
                    .get('/api/data/User')
                    .set('Accept', 'application/json');

                expect(response.status).toBe(200);
                expect(Array.isArray(response.body)).toBe(true);
                expect(response.body.length).toBeGreaterThanOrEqual(1);
            });

            it('should get user by id via GET /api/data/User/:id', async () => {
                const response = await request(server)
                    .get(`/api/data/User/${userId}`)
                    .set('Accept', 'application/json');

                expect(response.status).toBe(200);
                expect(response.body._id).toBe(userId);
                expect(response.body.name).toBe('Jane Smith');
            });

            it('should update user via PUT /api/data/User/:id', async () => {
                const response = await request(server)
                    .put(`/api/data/User/${userId}`)
                    .send({
                        age: 29
                    })
                    .set('Accept', 'application/json');

                expect(response.status).toBe(200);
            });

            it('should delete user via DELETE /api/data/User/:id', async () => {
                const response = await request(server)
                    .delete(`/api/data/User/${userId}`)
                    .set('Accept', 'application/json');

                expect(response.status).toBe(204);
            });
        });

        describe('Task Operations', () => {
            let taskId: string;

            it('should create task via POST /api/data/Task', async () => {
                const response = await request(server)
                    .post('/api/data/Task')
                    .send({
                        title: 'REST API Task',
                        description: 'Created via REST',
                        status: 'pending',
                        priority: 'medium'
                    })
                    .set('Accept', 'application/json');

                expect(response.status).toBe(201);
                expect(response.body.title).toBe('REST API Task');
                
                taskId = response.body._id;
            });

            it('should list tasks via GET /api/data/Task', async () => {
                const response = await request(server)
                    .get('/api/data/Task')
                    .set('Accept', 'application/json');

                expect(response.status).toBe(200);
                expect(Array.isArray(response.body)).toBe(true);
            });

            it('should update task via PUT /api/data/Task/:id', async () => {
                const response = await request(server)
                    .put(`/api/data/Task/${taskId}`)
                    .send({
                        status: 'in-progress'
                    })
                    .set('Accept', 'application/json');

                expect(response.status).toBe(200);
            });

            it('should delete task via DELETE /api/data/Task/:id', async () => {
                const response = await request(server)
                    .delete(`/api/data/Task/${taskId}`)
                    .set('Accept', 'application/json');

                expect(response.status).toBe(204);
            });
        });
    });
});
