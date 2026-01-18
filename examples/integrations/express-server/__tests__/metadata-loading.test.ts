/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Metadata Loading Tests for Express API Starter
 * 
 * Tests that metadata files are correctly loaded and registered
 */

import { ObjectQL } from '@objectql/core';
import { SqlDriver } from '@objectql/driver-sql';
import { ObjectLoader } from '@objectql/platform-node';
import * as path from 'path';

describe('Metadata Loading', () => {
    let app: ObjectQL;

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

        // Load metadata from src directory
        const srcDir = path.resolve(__dirname, '../src');
        const loader = new ObjectLoader(app.metadata);
        loader.load(srcDir);

        await app.init();
    });

    afterAll(async () => {
        if (app && (app as any).datasources?.default) {
            const driver = (app as any).datasources.default;
            if (driver.knex) {
                await driver.knex.destroy();
            }
        }
    });

    describe('Object Metadata', () => {
        it('should load User object metadata', () => {
            const userConfig = app.getObject('user');
            
            expect(userConfig).toBeDefined();
            expect(userConfig.name).toBe('user');
            expect(userConfig.label).toBe('Users');
        });

        it('should load Task object metadata', () => {
            const taskConfig = app.getObject('task');
            
            expect(taskConfig).toBeDefined();
            expect(taskConfig.name).toBe('task');
            expect(taskConfig.label).toBe('Tasks');
        });

        it('should load User fields correctly', () => {
            const userConfig = app.getObject('user');
            
            expect(userConfig.fields).toBeDefined();
            expect(userConfig.fields.name).toEqual(expect.objectContaining({
                type: 'string',
                label: 'Full Name',
                required: true
            }));
            expect(userConfig.fields.email).toEqual(expect.objectContaining({
                type: 'string',
                label: 'Email Address',
                required: true
            }));
            expect(userConfig.fields.status).toEqual(expect.objectContaining({
                type: 'string',
                label: 'Status',
                defaultValue: 'active'
            }));
            expect(userConfig.fields.age).toEqual(expect.objectContaining({
                type: 'number',
                label: 'Age'
            }));
        });

        it('should load Task fields correctly', () => {
            const taskConfig = app.getObject('task');
            
            expect(taskConfig.fields).toBeDefined();
            expect(taskConfig.fields.title).toEqual(expect.objectContaining({
                type: 'string',
                label: 'Title',
                required: true
            }));
            expect(taskConfig.fields.description).toEqual(expect.objectContaining({
                type: 'text',
                label: 'Description'
            }));
            expect(taskConfig.fields.status).toEqual(expect.objectContaining({
                type: 'string',
                label: 'Status',
                defaultValue: 'pending'
            }));
            expect(taskConfig.fields.priority).toEqual(expect.objectContaining({
                type: 'string',
                label: 'Priority',
                defaultValue: 'medium'
            }));
            expect(taskConfig.fields.completed).toEqual(expect.objectContaining({
                type: 'boolean',
                label: 'Completed',
                defaultValue: false
            }));
        });
    });

    describe('Metadata Registry', () => {
        it('should return list of loaded objects', () => {
            const configs = app.getConfigs();
            const objectNames = Object.keys(configs);
            
            expect(objectNames).toContain('user');
            expect(objectNames).toContain('task');
            expect(objectNames.length).toBeGreaterThanOrEqual(2);
        });

        it('should support metadata.get for objects', () => {
            const userMetadata = app.metadata.get('object', 'user');
            
            expect(userMetadata).toBeDefined();
            expect(userMetadata.name).toBe('user');
        });
    });
});
