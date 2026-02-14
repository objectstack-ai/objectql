/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Metadata Loading Tests for Enterprise Starter
 * 
 * Tests that the enterprise-scale metadata organization is correctly loaded
 */

import { ObjectQL } from '@objectql/core';
import { SqlDriver } from '@objectql/driver-sql';
import { ObjectLoader } from '@objectql/platform-node';
import * as path from 'path';

describe('Enterprise Metadata Loading', () => {
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

        // Load metadata from src directory (modular structure)
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

    describe('Core Objects', () => {
        it('should load User core object', () => {
            const userConfig = app.getObject('user');
            
            expect(userConfig).toBeDefined();
            expect(userConfig.name).toBe('user');
        });

        it('should load Organization core object', () => {
            const orgConfig = app.getObject('organization');
            
            expect(orgConfig).toBeDefined();
            expect(orgConfig.name).toBe('organization');
        });

        it('should load Attachment core object', () => {
            const attachmentConfig = app.getObject('attachment');
            
            expect(attachmentConfig).toBeDefined();
            expect(attachmentConfig.name).toBe('attachment');
        });
    });

    describe('CRM Module Objects', () => {
        it('should load CRM Account object', () => {
            const accountConfig = app.getObject('crm_account');
            
            expect(accountConfig).toBeDefined();
            expect(accountConfig.name).toBe('crm_account');
        });

        it('should load CRM Contact object', () => {
            const contactConfig = app.getObject('crm_contact');
            
            expect(contactConfig).toBeDefined();
            expect(contactConfig.name).toBe('crm_contact');
        });

        it('should load CRM Lead object', () => {
            const leadConfig = app.getObject('crm_lead');
            
            expect(leadConfig).toBeDefined();
            expect(leadConfig.name).toBe('crm_lead');
        });

        it('should load CRM Opportunity object', () => {
            const opportunityConfig = app.getObject('crm_opportunity');
            
            expect(opportunityConfig).toBeDefined();
            expect(opportunityConfig.name).toBe('crm_opportunity');
        });
    });

    describe('HR Module Objects', () => {
        it('should load HR Employee object', () => {
            const employeeConfig = app.getObject('hr_employee');
            
            expect(employeeConfig).toBeDefined();
            expect(employeeConfig.name).toBe('hr_employee');
        });

        it('should load HR Department object', () => {
            const deptConfig = app.getObject('hr_department');
            
            expect(deptConfig).toBeDefined();
            expect(deptConfig.name).toBe('hr_department');
        });

        it('should load HR Position object', () => {
            const posConfig = app.getObject('hr_position');
            
            expect(posConfig).toBeDefined();
            expect(posConfig.name).toBe('hr_position');
        });

        it('should load HR Timesheet object', () => {
            const timesheetConfig = app.getObject('hr_timesheet');
            
            expect(timesheetConfig).toBeDefined();
            expect(timesheetConfig.name).toBe('hr_timesheet');
        });
    });

    describe('Project Module Objects', () => {
        it('should load Project Project object', () => {
            const projectConfig = app.getObject('project_project');
            
            expect(projectConfig).toBeDefined();
            expect(projectConfig.name).toBe('project_project');
        });

        it('should load Project Task object', () => {
            const taskConfig = app.getObject('project_task');
            
            expect(taskConfig).toBeDefined();
            expect(taskConfig.name).toBe('project_task');
        });

        it('should load Project Milestone object', () => {
            const milestoneConfig = app.getObject('project_milestone');
            
            expect(milestoneConfig).toBeDefined();
            expect(milestoneConfig.name).toBe('project_milestone');
        });

        it('should load Project Timesheet Entry object', () => {
            const entryConfig = app.getObject('project_timesheet_entry');
            
            expect(entryConfig).toBeDefined();
            expect(entryConfig.name).toBe('project_timesheet_entry');
        });
    });

    describe('Finance Module Objects', () => {
        it('should load Finance Invoice object', () => {
            const invoiceConfig = app.getObject('finance_invoice');
            
            expect(invoiceConfig).toBeDefined();
            expect(invoiceConfig.name).toBe('finance_invoice');
        });

        it('should load Finance Payment object', () => {
            const paymentConfig = app.getObject('finance_payment');
            
            expect(paymentConfig).toBeDefined();
            expect(paymentConfig.name).toBe('finance_payment');
        });

        it('should load Finance Expense object', () => {
            const expenseConfig = app.getObject('finance_expense');
            
            expect(expenseConfig).toBeDefined();
            expect(expenseConfig.name).toBe('finance_expense');
        });
    });

    describe('Module-based Organization', () => {
        it('should load objects from multiple modules', () => {
            const configs = app.getConfigs();
            const objectNames = Object.keys(configs);
            
            // Should have objects from different modules
            const hasCRM = objectNames.some(name => name.startsWith('crm_'));
            const hasHR = objectNames.some(name => name.startsWith('hr_'));
            const hasProject = objectNames.some(name => name.startsWith('project_'));
            const hasFinance = objectNames.some(name => name.startsWith('finance_'));
            
            expect(hasCRM).toBe(true);
            expect(hasHR).toBe(true);
            expect(hasProject).toBe(true);
            expect(hasFinance).toBe(true);
        });

        it('should have significant number of objects loaded', () => {
            const configs = app.getConfigs();
            const objectCount = Object.keys(configs).length;
            
            // Enterprise starter should have at least 15 objects
            expect(objectCount).toBeGreaterThanOrEqual(15);
        });
    });

    describe('Extensions and Apps', () => {
        it('should load User extension if present', () => {
            const extensions = app.metadata.list('extension');
            
            if (extensions && extensions.length > 0) {
                expect(extensions.length).toBeGreaterThanOrEqual(1);
            }
        });

        it('should load ERP app metadata if present', () => {
            const apps = app.metadata.list('app');
            
            if (apps && apps.length > 0) {
                expect(apps.length).toBeGreaterThanOrEqual(1);
            }
        });

        it('should load menu metadata if present', () => {
            const menus = app.metadata.list('menu');
            
            if (menus && menus.length > 0) {
                expect(menus.length).toBeGreaterThanOrEqual(1);
            }
        });
    });

    describe('Metadata Registry', () => {
        it('should support listing all objects', () => {
            const objects = app.metadata.list('object');
            
            expect(objects).toBeDefined();
            expect(objects.length).toBeGreaterThanOrEqual(15);
        });

        it('should support getting specific objects', () => {
            const userMeta = app.metadata.get('object', 'user');
            const accountMeta = app.metadata.get('object', 'crm_account');
            
            expect(userMeta).toBeDefined();
            expect(accountMeta).toBeDefined();
        });
    });
});
