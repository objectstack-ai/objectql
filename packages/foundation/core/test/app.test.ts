/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ObjectQL } from '../src/app';
import { MockDriver } from './mock-driver';
import { ObjectConfig, ObjectQLPlugin, HookContext, ActionContext, Metadata } from '@objectql/types';

const todoObject: ObjectConfig = {
    name: 'todo',
    fields: {
        title: { type: 'text', required: true },
        completed: { type: 'boolean', defaultValue: false }
    }
};

const projectObject: ObjectConfig = {
    name: 'project',
    fields: {
        name: { type: 'text', required: true },
        status: { type: 'select', options: ['active', 'completed'] }
    }
};

describe('ObjectQL App', () => {
    describe('Constructor', () => {
        it('should create instance with minimal config', () => {
            const app = new ObjectQL({ datasources: {} });
            expect(app).toBeDefined();
            expect(app.metadata).toBeDefined();
        });

        it('should accept datasources configuration', () => {
            const driver = new MockDriver();
            const app = new ObjectQL({
                datasources: {
                    default: driver,
                    secondary: driver
                }
            });
            expect(app.datasource('default')).toBe(driver);
            expect(app.datasource('secondary')).toBe(driver);
        });

        it('should throw error for connection string', () => {
            expect(() => {
                new ObjectQL({
                    datasources: {},
                    connection: 'sqlite://memory'
                } as any);
            }).toThrow('Connection strings are not supported in core');
        });

        it('should throw error for string plugins', () => {
            expect(() => {
                new ObjectQL({
                    datasources: {},
                    plugins: ['some-plugin'] as any
                });
            }).toThrow('String plugins are not supported in core');
        });

        it('should accept plugin instances', () => {
            const mockPlugin: ObjectQLPlugin = {
                name: 'test-plugin',
                setup: jest.fn()
            };
            const app = new ObjectQL({
                datasources: {},
                plugins: [mockPlugin]
            });
            expect(app).toBeDefined();
        });
    });

    describe('Object Registration', () => {
        let app: ObjectQL;

        beforeEach(() => {
            app = new ObjectQL({ datasources: {} });
        });

        it('should register an object', () => {
            app.registerObject(todoObject);
            const retrieved = app.getObject('todo');
            expect(retrieved).toBeDefined();
            expect(retrieved?.name).toBe('todo');
        });

        it('should unregister an object', () => {
            app.registerObject(todoObject);
            app.unregisterObject('todo');
            const retrieved = app.getObject('todo');
            expect(retrieved).toBeUndefined();
        });

        it('should get all configs', () => {
            app.registerObject(todoObject);
            app.registerObject(projectObject);
            const configs = app.getConfigs();
            expect(Object.keys(configs)).toHaveLength(2);
            expect(configs.todo).toBeDefined();
            expect(configs.project).toBeDefined();
        });

        it('should return undefined for non-existent object', () => {
            const retrieved = app.getObject('nonexistent');
            expect(retrieved).toBeUndefined();
        });
    });

    describe('Datasource Management', () => {
        it('should get datasource by name', () => {
            const driver = new MockDriver();
            const app = new ObjectQL({
                datasources: { default: driver }
            });
            expect(app.datasource('default')).toBe(driver);
        });

        it('should throw error for non-existent datasource', () => {
            const app = new ObjectQL({ datasources: {} });
            expect(() => app.datasource('nonexistent')).toThrow(
                "Datasource 'nonexistent' not found"
            );
        });
    });

    describe('Context Creation', () => {
        let app: ObjectQL;

        beforeEach(() => {
            app = new ObjectQL({ datasources: {} });
        });

        it('should create context with userId', () => {
            const ctx = app.createContext({ userId: 'user1' });
            expect(ctx.userId).toBe('user1');
            expect(ctx.isSystem).toBeFalsy();
        });

        it('should create system context', () => {
            const ctx = app.createContext({ userId: 'user1', isSystem: true });
            expect(ctx.isSystem).toBe(true);
        });

        it('should create context with roles', () => {
            const ctx = app.createContext({ 
                userId: 'user1', 
                roles: ['admin', 'user'] 
            });
            expect(ctx.roles).toEqual(['admin', 'user']);
        });

        it('should create context with spaceId', () => {
            const ctx = app.createContext({ 
                userId: 'user1', 
                spaceId: 'space1' 
            });
            expect(ctx.spaceId).toBe('space1');
        });

        it('should provide object repository through context', () => {
            app.registerObject(todoObject);
            const ctx = app.createContext({ userId: 'user1', isSystem: true });
            const repo = ctx.object('todo');
            expect(repo).toBeDefined();
        });

        it('should provide sudo method to elevate privileges', () => {
            const ctx = app.createContext({ userId: 'user1', isSystem: false });
            expect(ctx.isSystem).toBe(false);
            
            const sudoCtx = ctx.sudo();
            expect(sudoCtx.isSystem).toBe(true);
            expect(sudoCtx.userId).toBe('user1');
        });
    });

    describe('Hook Management', () => {
        let app: ObjectQL;

        beforeEach(() => {
            app = new ObjectQL({ datasources: {} });
            app.registerObject(todoObject);
        });

        it('should register a hook', () => {
            const handler = jest.fn();
            app.on('beforeCreate', 'todo', handler);
            expect(handler).not.toHaveBeenCalled();
        });

        it('should trigger registered hook', async () => {
            const handler = jest.fn();
            app.on('beforeCreate', 'todo', handler);
            
            const hookCtx: HookContext = {
                objectName: 'todo',
                data: { title: 'Test' },
                userId: 'user1',
                isSystem: false
            };
            
            await app.triggerHook('beforeCreate', 'todo', hookCtx);
            expect(handler).toHaveBeenCalledWith(hookCtx);
        });

        it('should register hook with package name', () => {
            const handler = jest.fn();
            app.on('beforeCreate', 'todo', handler, 'test-package');
            expect(handler).not.toHaveBeenCalled();
        });
    });

    describe('Action Management', () => {
        let app: ObjectQL;

        beforeEach(() => {
            app = new ObjectQL({ datasources: {} });
            app.registerObject(todoObject);
        });

        it('should register an action', () => {
            const handler = jest.fn().mockResolvedValue({ success: true });
            app.registerAction('todo', 'complete', handler);
            expect(handler).not.toHaveBeenCalled();
        });

        it('should execute registered action', async () => {
            const handler = jest.fn().mockResolvedValue({ success: true });
            app.registerAction('todo', 'complete', handler);
            
            const actionCtx: ActionContext = {
                objectName: 'todo',
                input: { id: '1' },
                userId: 'user1',
                isSystem: false
            };
            
            const result = await app.executeAction('todo', 'complete', actionCtx);
            expect(handler).toHaveBeenCalledWith(actionCtx);
            expect(result).toEqual({ success: true });
        });

        it('should register action with package name', () => {
            const handler = jest.fn().mockResolvedValue({ success: true });
            app.registerAction('todo', 'complete', handler, 'test-package');
            expect(handler).not.toHaveBeenCalled();
        });
    });

    describe('Package Management', () => {
        let app: ObjectQL;

        beforeEach(() => {
            app = new ObjectQL({ datasources: {} });
        });

        it('should remove package and its metadata', () => {
            // Register object with package name
            const obj: ObjectConfig = { ...todoObject };
            const entry: Metadata = {
                type: 'object',
                id: 'todo',
                package: 'test-package',
                content: obj
            };
            app.metadata.register('object', entry);

            // Register hook
            app.on('beforeCreate', 'todo', jest.fn(), 'test-package');

            // Register action
            app.registerAction('todo', 'complete', jest.fn(), 'test-package');

            // Verify object is registered
            expect(app.getObject('todo')).toBeDefined();

            // Remove package
            app.removePackage('test-package');

            // Verify removal
            expect(app.getObject('todo')).toBeUndefined();
        });
    });

    describe('Plugin System', () => {
        it('should initialize plugins on init', async () => {
            const setupFn = jest.fn();
            const mockPlugin: ObjectQLPlugin = {
                name: 'test-plugin',
                setup: setupFn
            };

            const app = new ObjectQL({
                datasources: {},
                plugins: [mockPlugin]
            });

            await app.init();
            expect(setupFn).toHaveBeenCalledWith(app);
        });

        it('should use plugin method', () => {
            const mockPlugin: ObjectQLPlugin = {
                name: 'test-plugin',
                setup: jest.fn()
            };

            const app = new ObjectQL({ datasources: {} });
            app.use(mockPlugin);
            expect(app).toBeDefined();
        });

        it('should provide package-scoped proxy for plugins', async () => {
            let capturedApp: any;
            const mockPlugin: ObjectQLPlugin = {
                name: 'test-plugin',
                setup: async (app) => {
                    capturedApp = app;
                }
            };
            (mockPlugin as any)._packageName = 'test-package';

            const app = new ObjectQL({
                datasources: {},
                plugins: [mockPlugin]
            });
            app.registerObject(todoObject);

            await app.init();

            // Test proxied methods
            const handler = jest.fn();
            capturedApp.on('beforeCreate', 'todo', handler);
            capturedApp.registerAction('todo', 'test', handler);
        });
    });

    describe('Initialization', () => {
        it('should initialize with objects config', async () => {
            const app = new ObjectQL({
                datasources: {},
                objects: {
                    todo: todoObject,
                    project: projectObject
                }
            });

            await app.init();

            expect(app.getObject('todo')).toBeDefined();
            expect(app.getObject('project')).toBeDefined();
        });

        it('should initialize datasources', async () => {
            const driver = new MockDriver();
            driver.init = jest.fn().mockResolvedValue(undefined);

            const app = new ObjectQL({
                datasources: { default: driver },
                objects: { todo: todoObject }
            });

            await app.init();
            expect(driver.init).toHaveBeenCalled();
        });

        it('should process initial data', async () => {
            const driver = new MockDriver();
            const app = new ObjectQL({
                datasources: { default: driver },
                objects: { todo: todoObject }
            });

            // Register initial data
            app.metadata.register('data', {
                type: 'data',
                id: 'todo-data',
                content: {
                    object: 'todo',
                    records: [
                        { title: 'Initial Task 1' },
                        { title: 'Initial Task 2' }
                    ]
                }
            });

            await app.init();

            // Verify data was created by checking the driver's internal data store
            const todoData = (driver as any).getData('todo');
            expect(todoData.length).toBe(2);
        });

        it('should handle array format initial data', async () => {
            const driver = new MockDriver();
            const app = new ObjectQL({
                datasources: { default: driver },
                objects: { todo: todoObject }
            });

            // Register initial data in array format
            const dataArray = [
                { title: 'Task 1' },
                { title: 'Task 2' }
            ];
            (dataArray as any).name = 'todo';

            app.metadata.register('data', {
                type: 'data',
                id: 'todo-data',
                content: dataArray
            });

            await app.init();

            // Verify data was created by checking the driver's internal data store
            const todoData = (driver as any).getData('todo');
            expect(todoData.length).toBe(2);
        });

        it('should skip invalid data entries', async () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
            const driver = new MockDriver();
            const app = new ObjectQL({
                datasources: { default: driver }
            });

            app.metadata.register('data', {
                type: 'data',
                id: 'invalid-data',
                content: { invalid: true }
            });

            await app.init();

            expect(consoleWarnSpy).toHaveBeenCalled();
            consoleWarnSpy.mockRestore();
        });
    });

    describe('Transaction Support', () => {
        it('should execute callback in transaction', async () => {
            const driver = new MockDriver();
            driver.beginTransaction = jest.fn().mockResolvedValue('trx-handle');
            driver.commitTransaction = jest.fn().mockResolvedValue(undefined);

            const app = new ObjectQL({
                datasources: { default: driver }
            });

            const ctx = app.createContext({ userId: 'user1', isSystem: true });
            
            let trxCtx: any;
            await ctx.transaction(async (txCtx) => {
                trxCtx = txCtx;
                expect(txCtx.transactionHandle).toBe('trx-handle');
            });

            expect(driver.beginTransaction).toHaveBeenCalled();
            expect(driver.commitTransaction).toHaveBeenCalledWith('trx-handle');
        });

        it('should rollback transaction on error', async () => {
            const driver = new MockDriver();
            driver.beginTransaction = jest.fn().mockResolvedValue('trx-handle');
            driver.rollbackTransaction = jest.fn().mockResolvedValue(undefined);

            const app = new ObjectQL({
                datasources: { default: driver }
            });

            const ctx = app.createContext({ userId: 'user1', isSystem: true });
            
            await expect(
                ctx.transaction(async () => {
                    throw new Error('Test error');
                })
            ).rejects.toThrow('Test error');

            expect(driver.beginTransaction).toHaveBeenCalled();
            expect(driver.rollbackTransaction).toHaveBeenCalledWith('trx-handle');
        });

        it('should handle no transaction support', async () => {
            const driver = new MockDriver();
            // MockDriver has transaction support by default, so we create one without it
            const noTrxDriver: any = {
                ...driver,
                beginTransaction: undefined,
                commitTransaction: undefined,
                rollbackTransaction: undefined
            };
            
            const app = new ObjectQL({
                datasources: { default: noTrxDriver }
            });

            const ctx = app.createContext({ userId: 'user1', isSystem: true });
            
            let called = false;
            let capturedCtx: any;
            await ctx.transaction(async (txCtx) => {
                called = true;
                capturedCtx = txCtx;
            });

            expect(called).toBe(true);
            expect(capturedCtx.transactionHandle).toBeUndefined();
        });
    });

    describe('Schema Introspection', () => {
        it('should introspect and register objects', async () => {
            const driver = new MockDriver();
            driver.introspectSchema = jest.fn().mockResolvedValue({
                tables: {
                    users: {
                        columns: [
                            { name: 'id', type: 'INTEGER', nullable: false, isUnique: true },
                            { name: 'name', type: 'VARCHAR', nullable: false, isUnique: false },
                            { name: 'email', type: 'VARCHAR', nullable: false, isUnique: true }
                        ],
                        foreignKeys: []
                    }
                }
            });

            const app = new ObjectQL({
                datasources: { default: driver }
            });

            const objects = await app.introspectAndRegister('default');

            expect(objects).toHaveLength(1);
            expect(objects[0].name).toBe('users');
            expect(app.getObject('users')).toBeDefined();
        });

        it('should throw error if driver does not support introspection', async () => {
            const driver = new MockDriver();
            const app = new ObjectQL({
                datasources: { default: driver }
            });

            await expect(app.introspectAndRegister('default')).rejects.toThrow(
                'does not support schema introspection'
            );
        });

        it('should throw error for non-existent datasource', async () => {
            const app = new ObjectQL({ datasources: {} });

            await expect(app.introspectAndRegister('nonexistent')).rejects.toThrow(
                "Datasource 'nonexistent' not found"
            );
        });
    });

    describe('Close', () => {
        it('should disconnect all datasources', async () => {
            const driver1 = new MockDriver();
            const driver2 = new MockDriver();
            driver1.disconnect = jest.fn().mockResolvedValue(undefined);
            driver2.disconnect = jest.fn().mockResolvedValue(undefined);

            const app = new ObjectQL({
                datasources: {
                    default: driver1,
                    secondary: driver2
                }
            });

            await app.close();

            expect(driver1.disconnect).toHaveBeenCalled();
            expect(driver2.disconnect).toHaveBeenCalled();
        });

        it('should handle datasources without disconnect method', async () => {
            const driver = new MockDriver();
            const app = new ObjectQL({
                datasources: { default: driver }
            });

            await expect(app.close()).resolves.not.toThrow();
        });
    });
});
