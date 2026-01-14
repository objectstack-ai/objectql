import request from 'supertest';
import { createServer } from 'http';
import { ObjectQL } from '@objectql/core';
import { createGraphQLHandler } from '../src/adapters/graphql';
import { Driver } from '@objectql/types';

// Simple Mock Driver
class MockDriver implements Driver {
    private initialData: Record<string, any[]> = {
        user: [
            { _id: '1', name: 'Alice', email: 'alice@example.com', age: 30 },
            { _id: '2', name: 'Bob', email: 'bob@example.com', age: 25 }
        ],
        task: [
            { _id: 'task1', title: 'Task 1', status: 'open', priority: 'high' },
            { _id: 'task2', title: 'Task 2', status: 'closed', priority: 'low' }
        ]
    };
    private data: Record<string, any[]>;
    private nextId = 3;

    constructor() {
        // Create a deep copy of initialData
        this.data = JSON.parse(JSON.stringify(this.initialData));
    }

    reset() {
        // Reset data to initial state
        this.data = JSON.parse(JSON.stringify(this.initialData));
        this.nextId = 3;
    }

    async init() {}
    
    async find(objectName: string, query: any) {
        let items = this.data[objectName] || [];
        
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
    
    // Note: update() returns the updated object to match the behavior of the SQL driver,
    // which returns { id, ...data }. This is different from the affected row count pattern.
    async update(objectName: string, id: string, data: any) {
        const items = this.data[objectName] || [];
        const index = items.findIndex(item => item._id === id);
        if (index >= 0) {
            this.data[objectName][index] = { ...items[index], ...data };
            return this.data[objectName][index];
        }
        return null;
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

describe('GraphQL API Adapter', () => {
    let app: ObjectQL;
    let server: any;
    let handler: any;
    let mockDriver: MockDriver;

    beforeAll(async () => {
        mockDriver = new MockDriver();
        app = new ObjectQL({
            datasources: {
                default: mockDriver
            }
        });
        
        // Register user object schema
        app.metadata.register('object', {
            type: 'object',
            id: 'user',
            content: {
                name: 'user',
                label: 'User',
                fields: {
                    name: { type: 'text', label: 'Name' },
                    email: { type: 'email', label: 'Email' },
                    age: { type: 'number', label: 'Age' }
                }
            }
        });

        // Register task object schema
        app.metadata.register('object', {
            type: 'object',
            id: 'task',
            content: {
                name: 'task',
                label: 'Task',
                fields: {
                    title: { type: 'text', label: 'Title', required: true },
                    status: { type: 'select', label: 'Status', options: ['open', 'closed'] },
                    priority: { type: 'select', label: 'Priority', options: ['low', 'medium', 'high'] }
                }
            }
        });

        // Create handler and server once for all tests
        handler = createGraphQLHandler(app);
        server = createServer(handler);
    });

    beforeEach(() => {
        // Reset mock data before each test
        mockDriver.reset();
    });

    describe('Queries', () => {
        it('should query a single user by ID', async () => {
            const query = `
                query {
                    user(id: "1") {
                        id
                        name
                        email
                    }
                }
            `;

            const response = await request(server)
                .post('/api/graphql')
                .send({ query })
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.user).toEqual({
                id: '1',
                name: 'Alice',
                email: 'alice@example.com'
            });
        });

        it('should query list of users', async () => {
            const query = `
                query {
                    userList {
                        id
                        name
                        email
                    }
                }
            `;

            const response = await request(server)
                .post('/api/graphql')
                .send({ query })
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.userList).toHaveLength(2);
            expect(response.body.data.userList[0].name).toBe('Alice');
        });

        it('should support pagination with limit and skip', async () => {
            const query = `
                query {
                    userList(limit: 1, skip: 1) {
                        id
                        name
                    }
                }
            `;

            const response = await request(server)
                .post('/api/graphql')
                .send({ query })
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body.data.userList).toHaveLength(1);
            expect(response.body.data.userList[0].name).toBe('Bob');
        });

        it('should support field selection', async () => {
            const query = `
                query {
                    userList(fields: ["name"]) {
                        id
                        name
                    }
                }
            `;

            const response = await request(server)
                .post('/api/graphql')
                .send({ query })
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body.data.userList).toBeDefined();
        });

        it('should query tasks', async () => {
            const query = `
                query {
                    taskList {
                        id
                        title
                        status
                        priority
                    }
                }
            `;

            const response = await request(server)
                .post('/api/graphql')
                .send({ query })
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body.data.taskList).toHaveLength(2);
            expect(response.body.data.taskList[0].title).toBe('Task 1');
        });

        it('should support GET requests with query parameter', async () => {
            const query = encodeURIComponent('{ user(id: "1") { id name } }');

            const response = await request(server)
                .get(`/api/graphql?query=${query}`)
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body.data.user.name).toBe('Alice');
        });
    });

    describe('Mutations', () => {
        it('should create a new user', async () => {
            const mutation = `
                mutation {
                    createUser(input: { name: "Charlie", email: "charlie@example.com", age: 35 }) {
                        id
                        name
                        email
                        age
                    }
                }
            `;

            const response = await request(server)
                .post('/api/graphql')
                .send({ query: mutation })
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.createUser.name).toBe('Charlie');
            expect(response.body.data.createUser.email).toBe('charlie@example.com');
            expect(response.body.data.createUser.id).toBeDefined();
        });

        it('should update an existing user', async () => {
            const mutation = `
                mutation {
                    updateUser(id: "1", input: { name: "Alice Updated" }) {
                        id
                        name
                    }
                }
            `;

            const response = await request(server)
                .post('/api/graphql')
                .send({ query: mutation })
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.updateUser.name).toBe('Alice Updated');
        });

        it('should delete a user', async () => {
            const mutation = `
                mutation {
                    deleteUser(id: "2") {
                        id
                        deleted
                    }
                }
            `;

            const response = await request(server)
                .post('/api/graphql')
                .send({ query: mutation })
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.deleteUser.id).toBe('2');
            expect(response.body.data.deleteUser.deleted).toBe(true);
        });

        it('should create a task', async () => {
            const mutation = `
                mutation {
                    createTask(input: { title: "New Task", status: "open", priority: "medium" }) {
                        id
                        title
                        status
                    }
                }
            `;

            const response = await request(server)
                .post('/api/graphql')
                .send({ query: mutation })
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body.data.createTask.title).toBe('New Task');
        });
    });

    describe('Error Handling', () => {
        it('should return error for invalid query', async () => {
            const query = `query { invalid }`;

            const response = await request(server)
                .post('/api/graphql')
                .send({ query })
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body.errors).toBeDefined();
        });

        it('should return error when query is missing', async () => {
            const response = await request(server)
                .post('/api/graphql')
                .send({})
                .set('Accept', 'application/json');

            expect(response.status).toBe(400);
            expect(response.body.errors).toBeDefined();
            expect(response.body.errors[0].message).toContain('query');
        });

        it('should reject non-POST/GET methods', async () => {
            const response = await request(server)
                .put('/api/graphql')
                .send({ query: '{ userList { id } }' })
                .set('Accept', 'application/json');

            expect(response.status).toBe(405);
        });
    });

    describe('Variables', () => {
        it('should support GraphQL variables', async () => {
            const query = `
                query GetUser($userId: String!) {
                    user(id: $userId) {
                        id
                        name
                    }
                }
            `;

            const response = await request(server)
                .post('/api/graphql')
                .send({
                    query,
                    variables: { userId: '1' }
                })
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body.data.user.name).toBe('Alice');
        });

        it('should support variables in GET requests', async () => {
            const query = encodeURIComponent('query GetUser($id: String!) { user(id: $id) { name } }');
            const variables = encodeURIComponent(JSON.stringify({ id: '1' }));

            const response = await request(server)
                .get(`/api/graphql?query=${query}&variables=${variables}`)
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body.data.user.name).toBe('Alice');
        });
    });

    describe('CORS', () => {
        it('should handle OPTIONS preflight request', async () => {
            const response = await request(server)
                .options('/api/graphql');

            expect(response.status).toBe(200);
            expect(response.headers['access-control-allow-methods']).toContain('POST');
        });
    });
});
