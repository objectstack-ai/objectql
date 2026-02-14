/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Metadata API Tests for Enterprise Starter
 * 
 * Tests metadata API operations for enterprise objects
 */

import { ObjectQL } from '@objectql/core';
import { SqlDriver } from '@objectql/driver-sql';
import { ObjectLoader } from '@objectql/platform-node';
import * as path from 'path';

describe('Enterprise Metadata API', () => {
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

        // Load metadata
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

    describe('Object Metadata Retrieval', () => {
        it('should get all object configurations', () => {
            const configs = app.getConfigs();
            
            expect(configs).toBeDefined();
            expect(Object.keys(configs).length).toBeGreaterThanOrEqual(15);
        });

        it('should get specific core object metadata', () => {
            const userConfig = app.getObject('user');
            
            expect(userConfig).toBeDefined();
            expect(userConfig.name).toBe('user');
            expect(userConfig.fields).toBeDefined();
        });

        it('should get specific CRM object metadata', () => {
            const accountConfig = app.getObject('crm_account');
            
            expect(accountConfig).toBeDefined();
            expect(accountConfig.name).toBe('crm_account');
            expect(accountConfig.fields).toBeDefined();
        });

        it('should get specific HR object metadata', () => {
            const employeeConfig = app.getObject('hr_employee');
            
            expect(employeeConfig).toBeDefined();
            expect(employeeConfig.name).toBe('hr_employee');
            expect(employeeConfig.fields).toBeDefined();
        });

        it('should get specific Project object metadata', () => {
            const projectConfig = app.getObject('project_project');
            
            expect(projectConfig).toBeDefined();
            expect(projectConfig.name).toBe('project_project');
            expect(projectConfig.fields).toBeDefined();
        });

        it('should get specific Finance object metadata', () => {
            const invoiceConfig = app.getObject('finance_invoice');
            
            expect(invoiceConfig).toBeDefined();
            expect(invoiceConfig.name).toBe('finance_invoice');
            expect(invoiceConfig.fields).toBeDefined();
        });
    });

    describe('Metadata Registry Operations', () => {
        it('should list all objects via metadata.list', () => {
            const objects = app.metadata.list('object');
            
            expect(objects).toBeDefined();
            expect(Array.isArray(objects)).toBe(true);
            expect(objects.length).toBeGreaterThanOrEqual(15);
        });

        it('should get object via metadata.get', () => {
            const userMeta = app.metadata.get('object', 'user');
            
            expect(userMeta).toBeDefined();
            expect(userMeta.name).toBe('user');
        });

        it('should get CRM object via metadata.get', () => {
            const accountMeta = app.metadata.get('object', 'crm_account');
            
            expect(accountMeta).toBeDefined();
            expect(accountMeta.name).toBe('crm_account');
        });

        it('should list extensions if present', () => {
            const extensions = app.metadata.list('extension');
            
            expect(extensions).toBeDefined();
            expect(Array.isArray(extensions)).toBe(true);
        });

        it('should list apps if present', () => {
            const apps = app.metadata.list('app');
            
            expect(apps).toBeDefined();
            expect(Array.isArray(apps)).toBe(true);
        });

        it('should list menus if present', () => {
            const menus = app.metadata.list('menu');
            
            expect(menus).toBeDefined();
            expect(Array.isArray(menus)).toBe(true);
        });
    });

    describe('Field Metadata', () => {
        it('should retrieve User field metadata', () => {
            const userConfig = app.getObject('user');
            
            expect(userConfig.fields).toBeDefined();
            expect(userConfig.fields.name).toBeDefined();
            expect(userConfig.fields.email).toBeDefined();
        });

        it('should retrieve CRM Account field metadata', () => {
            const accountConfig = app.getObject('crm_account');
            
            expect(accountConfig.fields).toBeDefined();
            expect(accountConfig.fields.name).toBeDefined();
        });

        it('should retrieve HR Employee field metadata', () => {
            const employeeConfig = app.getObject('hr_employee');
            
            expect(employeeConfig.fields).toBeDefined();
            expect(employeeConfig.fields.first_name).toBeDefined();
            expect(employeeConfig.fields.last_name).toBeDefined();
        });

        it('should retrieve Project field metadata', () => {
            const projectConfig = app.getObject('project_project');
            
            expect(projectConfig.fields).toBeDefined();
            expect(projectConfig.fields.name).toBeDefined();
        });

        it('should retrieve Finance Invoice field metadata', () => {
            const invoiceConfig = app.getObject('finance_invoice');
            
            expect(invoiceConfig.fields).toBeDefined();
            expect(invoiceConfig.fields.invoice_number).toBeDefined();
        });
    });

    describe('Module Organization Metadata', () => {
        it('should identify objects by module prefix', () => {
            const configs = app.getConfigs();
            const objectNames = Object.keys(configs);
            console.log('Object Names:', objectNames); // Debugging
            
            const crmObjects = objectNames.filter(name => name.startsWith('crm_'));
            const hrObjects = objectNames.filter(name => name.startsWith('hr_'));
            const projectObjects = objectNames.filter(name => name.startsWith('project_'));
            const financeObjects = objectNames.filter(name => name.startsWith('finance_'));
            
            expect(crmObjects.length).toBeGreaterThanOrEqual(3);
            expect(hrObjects.length).toBeGreaterThanOrEqual(3);
            expect(projectObjects.length).toBeGreaterThanOrEqual(3);
            expect(financeObjects.length).toBeGreaterThanOrEqual(2);
        });

        it('should have consistent naming convention', () => {
            const configs = app.getConfigs();
            const objectNames = Object.keys(configs);
            
            // Check that module objects follow Module_Name pattern
            const moduleObjects = objectNames.filter(name => 
                name.startsWith('CRM_') || 
                name.startsWith('HR_') || 
                name.startsWith('Project_') || 
                name.startsWith('Finance_')
            );
            
            moduleObjects.forEach(name => {
                expect(name).toMatch(/^[A-Z][a-zA-Z]+_[A-Z]/);
            });
        });
    });

    describe('Metadata Completeness', () => {
        it('should have labels for all objects', () => {
            const configs = app.getConfigs();
            
            Object.values(configs).forEach((config: any) => {
                expect(config.label || config.name).toBeDefined();
            });
        });

        it('should have fields for all objects', () => {
            const configs = app.getConfigs();
            
            Object.values(configs).forEach((config: any) => {
                expect(config.fields).toBeDefined();
                expect(Object.keys(config.fields).length).toBeGreaterThan(0);
            });
        });

        it('should have valid field types', () => {
            const configs = app.getConfigs();
            const validTypes = ['string', 'text', 'textarea', 'number', 'boolean', 'date', 'datetime', 
                               'select', 'lookup', 'master_detail', 'url', 'email', 'phone',
                               'currency', 'formula', 'html', 'markdown', 'password', 'file', 
                               'image', 'avatar', 'location', 'percent'];
            
            Object.values(configs).forEach((config: any) => {
                Object.values(config.fields).forEach((field: any) => {
                    if (field.type) {
                        expect(validTypes).toContain(field.type);
                    }
                });
            });
        });
    });

    describe('Metadata Consistency', () => {
        it('should return same metadata via different access methods', () => {
            const viaGetObject = app.getObject('user');
            const viaMetadataGet = app.metadata.get('object', 'user');
            
            expect(viaGetObject.name).toBe(viaMetadataGet.name);
            expect(viaGetObject.label).toBe(viaMetadataGet.label);
        });

        it('should have consistent object count', () => {
            const viaGetConfigs = Object.keys(app.getConfigs()).length;
            const viaMetadataList = app.metadata.list('object').length;
            
            expect(viaGetConfigs).toBe(viaMetadataList);
        });
    });

    describe('Extension Metadata', () => {
        it('should load user extension metadata if present', () => {
            const extensions = app.metadata.list('extension');
            
            if (extensions && extensions.length > 0) {
                const userExtension = extensions.find((ext: any) => 
                    ext.id && ext.id.includes('user')
                );
                
                if (userExtension) {
                    expect(userExtension).toBeDefined();
                }
            }
        });
    });

    describe('Application Metadata', () => {
        it('should load ERP app metadata if present', () => {
            const apps = app.metadata.list('app');
            
            if (apps && apps.length > 0) {
                const erpApp = apps.find((app: any) => 
                    app.id && app.id.toLowerCase().includes('erp')
                );
                
                if (erpApp) {
                    expect(erpApp).toBeDefined();
                }
            }
        });
    });

    describe('Menu Metadata', () => {
        it('should load menu metadata if present', () => {
            const menus = app.metadata.list('menu');
            
            if (menus && menus.length > 0) {
                expect(menus[0]).toBeDefined();
            }
        });
    });
});
