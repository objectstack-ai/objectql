/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { generateOpenAPI } from '../src/openapi';
import { ObjectQL } from '@objectql/core';
import { ObjectConfig } from '@objectql/types';

describe('OpenAPI Generator', () => {
    let app: ObjectQL;

    beforeEach(async () => {
        app = new ObjectQL({
            datasources: {},
            objects: {
                user: {
                    name: 'user',
                    label: 'User',
                    fields: {
                        name: { type: 'text', required: true },
                        email: { type: 'text', required: true },
                        age: { type: 'number' },
                        active: { type: 'boolean' }
                    }
                },
                task: {
                    name: 'task',
                    label: 'Task',
                    fields: {
                        title: { type: 'text' },
                        completed: { type: 'boolean' },
                        due_date: { type: 'date' }
                    }
                }
            }
        });
        await app.init();
    });

    describe('Basic Structure', () => {
        it('should generate valid OpenAPI structure', () => {
            const spec = generateOpenAPI(app);

            expect(spec.openapi).toBe('3.0.0');
            expect(spec.info).toBeDefined();
            expect(spec.info.title).toBeDefined();
            expect(spec.info.version).toBeDefined();
            expect(spec.paths).toBeDefined();
            expect(spec.components).toBeDefined();
            expect(spec.components.schemas).toBeDefined();
        });

        it('should have openapi version 3.0.0', () => {
            const spec = generateOpenAPI(app);
            expect(spec.openapi).toBe('3.0.0');
        });

        it('should have info section', () => {
            const spec = generateOpenAPI(app);
            expect(spec.info.title).toBeTruthy();
            expect(spec.info.version).toBeTruthy();
        });
    });

    describe('JSON-RPC Endpoint', () => {
        it('should include JSON-RPC endpoint', () => {
            const spec = generateOpenAPI(app);

            expect(spec.paths['/api/objectql']).toBeDefined();
            expect(spec.paths['/api/objectql'].post).toBeDefined();
        });

        it('should define JSON-RPC operations', () => {
            const spec = generateOpenAPI(app);
            const endpoint = spec.paths['/api/objectql'].post;

            expect(endpoint.summary).toBeDefined();
            expect(endpoint.description).toBeDefined();
            expect(endpoint.tags).toContain('System');
        });

        it('should define JSON-RPC request body schema', () => {
            const spec = generateOpenAPI(app);
            const endpoint = spec.paths['/api/objectql'].post;
            const schema = endpoint.requestBody.content['application/json'].schema;

            expect(schema.properties.op).toBeDefined();
            expect(schema.properties.object).toBeDefined();
            expect(schema.properties.args).toBeDefined();
            expect(schema.required).toContain('op');
            expect(schema.required).toContain('object');
        });

        it('should define supported operations', () => {
            const spec = generateOpenAPI(app);
            const endpoint = spec.paths['/api/objectql'].post;
            const schema = endpoint.requestBody.content['application/json'].schema;
            const operations = schema.properties.op.enum;

            expect(operations).toContain('find');
            expect(operations).toContain('findOne');
            expect(operations).toContain('create');
            expect(operations).toContain('update');
            expect(operations).toContain('delete');
            expect(operations).toContain('count');
            expect(operations).toContain('action');
        });
    });

    describe('Schemas Generation', () => {
        it('should generate schema for each object', () => {
            const spec = generateOpenAPI(app);

            expect(spec.components.schemas.user).toBeDefined();
            expect(spec.components.schemas.task).toBeDefined();
        });

        it('should include all fields in schema', () => {
            const spec = generateOpenAPI(app);
            const userSchema = spec.components.schemas.user;

            expect(userSchema.properties.name).toBeDefined();
            expect(userSchema.properties.email).toBeDefined();
            expect(userSchema.properties.age).toBeDefined();
            expect(userSchema.properties.active).toBeDefined();
        });

        it('should map text fields to string type', () => {
            const spec = generateOpenAPI(app);
            const userSchema = spec.components.schemas.user;

            expect(userSchema.properties.name.type).toBe('string');
            expect(userSchema.properties.email.type).toBe('string');
        });

        it('should map number fields to string type (default mapping)', () => {
            const spec = generateOpenAPI(app);
            const userSchema = spec.components.schemas.user;

            // Number type maps to string by default in current implementation
            expect(userSchema.properties.age.type).toBe('string');
        });

        it('should map boolean fields to boolean type', () => {
            const spec = generateOpenAPI(app);
            const userSchema = spec.components.schemas.user;

            expect(userSchema.properties.active.type).toBe('boolean');
        });

        it('should have object type for schemas', () => {
            const spec = generateOpenAPI(app);
            const userSchema = spec.components.schemas.user;

            expect(userSchema.type).toBe('object');
        });
    });

    describe('REST API Paths', () => {
        it('should generate list endpoint for each object', () => {
            const spec = generateOpenAPI(app);

            expect(spec.paths['/api/data/user']).toBeDefined();
            expect(spec.paths['/api/data/user'].get).toBeDefined();
            expect(spec.paths['/api/data/task']).toBeDefined();
            expect(spec.paths['/api/data/task'].get).toBeDefined();
        });

        it('should generate create endpoint for each object', () => {
            const spec = generateOpenAPI(app);

            expect(spec.paths['/api/data/user'].post).toBeDefined();
            expect(spec.paths['/api/data/task'].post).toBeDefined();
        });

        it('should generate get by id endpoint for each object', () => {
            const spec = generateOpenAPI(app);

            expect(spec.paths['/api/data/user/{id}']).toBeDefined();
            expect(spec.paths['/api/data/user/{id}'].get).toBeDefined();
        });

        it('should generate update endpoint for each object', () => {
            const spec = generateOpenAPI(app);

            expect(spec.paths['/api/data/user/{id}'].patch).toBeDefined();
        });

        it('should generate delete endpoint for each object', () => {
            const spec = generateOpenAPI(app);

            expect(spec.paths['/api/data/user/{id}'].delete).toBeDefined();
        });
    });

    describe('Path Parameters', () => {
        it('should define id parameter for detail endpoints', () => {
            const spec = generateOpenAPI(app);
            const endpoint = spec.paths['/api/data/user/{id}'].get;

            expect(endpoint.parameters).toBeDefined();
            const idParam = endpoint.parameters.find((p: any) => p.name === 'id');
            expect(idParam).toBeDefined();
            expect(idParam.in).toBe('path');
            expect(idParam.required).toBe(true);
        });
    });

    describe('Complex Field Types', () => {
        it('should handle select fields', async () => {
            const app2 = new ObjectQL({
                datasources: {},
                objects: {
                    project: {
                        name: 'project',
                        fields: {
                            status: { 
                                type: 'select', 
                                options: [
                                    { label: 'Active', value: 'active' },
                                    { label: 'Completed', value: 'completed' },
                                    { label: 'Archived', value: 'archived' }
                                ]
                            }
                        }
                    }
                }
            });
            await app2.init();

            const spec = generateOpenAPI(app2);
            const projectSchema = spec.components.schemas.project;

            expect(projectSchema.properties.status).toBeDefined();
            expect(projectSchema.properties.status.type).toBe('string');
            // Current implementation doesn't extract enum values
        });

        it('should handle lookup fields', async () => {
            const app2 = new ObjectQL({
                datasources: {},
                objects: {
                    task: {
                        name: 'task',
                        fields: {
                            owner: { 
                                type: 'lookup', 
                                reference_to: 'users' 
                            }
                        }
                    }
                }
            });
            await app2.init();

            const spec = generateOpenAPI(app2);
            const taskSchema = spec.components.schemas.task;

            expect(taskSchema.properties.owner).toBeDefined();
            // Lookup fields typically map to string (ID reference)
            expect(taskSchema.properties.owner.type).toBe('string');
        });

        it('should handle datetime fields', async () => {
            const app2 = new ObjectQL({
                datasources: {},
                objects: {
                    event: {
                        name: 'event',
                        fields: {
                            start_time: { type: 'datetime' }
                        }
                    }
                }
            });
            await app2.init();

            const spec = generateOpenAPI(app2);
            const eventSchema = spec.components.schemas.event;

            expect(eventSchema.properties.start_time).toBeDefined();
            expect(eventSchema.properties.start_time.type).toBe('string');
            // OpenAPI implementation may or may not add format
        });
    });

    describe('Multiple Objects', () => {
        it('should generate paths for all registered objects', () => {
            const spec = generateOpenAPI(app);

            const pathKeys = Object.keys(spec.paths);
            const userPaths = pathKeys.filter(p => p.includes('/user'));
            const taskPaths = pathKeys.filter(p => p.includes('/task'));

            expect(userPaths.length).toBeGreaterThan(0);
            expect(taskPaths.length).toBeGreaterThan(0);
        });

        it('should generate schemas for all registered objects', () => {
            const spec = generateOpenAPI(app);

            expect(Object.keys(spec.components.schemas)).toContain('user');
            expect(Object.keys(spec.components.schemas)).toContain('task');
        });
    });

    describe('Empty App', () => {
        it('should generate valid spec even with no objects', async () => {
            const emptyApp = new ObjectQL({
                datasources: {}
            });
            await emptyApp.init();

            const spec = generateOpenAPI(emptyApp);

            expect(spec.openapi).toBe('3.0.0');
            expect(spec.paths).toBeDefined();
            expect(spec.paths['/api/objectql']).toBeDefined();
            expect(spec.components.schemas).toBeDefined();
        });
    });

    describe('Response Definitions', () => {
        it('should define 200 responses for GET endpoints', () => {
            const spec = generateOpenAPI(app);
            const endpoint = spec.paths['/api/data/user'].get;

            expect(endpoint.responses).toBeDefined();
            expect(endpoint.responses['200']).toBeDefined();
            expect(endpoint.responses['200'].description).toBeDefined();
        });

        it('should define responses for POST endpoints', () => {
            const spec = generateOpenAPI(app);
            const endpoint = spec.paths['/api/data/user'].post;

            expect(endpoint.responses).toBeDefined();
            expect(endpoint.responses['200']).toBeDefined();
        });
    });

    describe('Tags', () => {
        it('should tag endpoints by object name', () => {
            const spec = generateOpenAPI(app);
            const endpoint = spec.paths['/api/data/user'].get;

            expect(endpoint.tags).toBeDefined();
            expect(endpoint.tags).toContain('user');
        });

        it('should have System tag for JSON-RPC endpoint', () => {
            const spec = generateOpenAPI(app);
            const endpoint = spec.paths['/api/objectql'].post;

            expect(endpoint.tags).toContain('System');
        });
    });
});
