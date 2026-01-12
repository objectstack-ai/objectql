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
        if (app) {
            await app.close();
        }
    });

    describe('Core Objects', () => {
        it('should load User core object', () => {
            const userConfig = app.getObject('User');
            
            expect(userConfig).toBeDefined();
            expect(userConfig.name).toBe('User');
        });

        it('should load Organization core object', () => {
            const orgConfig = app.getObject('Organization');
            
            expect(orgConfig).toBeDefined();
            expect(orgConfig.name).toBe('Organization');
        });

        it('should load Attachment core object', () => {
            const attachmentConfig = app.getObject('Attachment');
            
            expect(attachmentConfig).toBeDefined();
            expect(attachmentConfig.name).toBe('Attachment');
        });
    });

    describe('CRM Module Objects', () => {
        it('should load CRM Account object', () => {
            const accountConfig = app.getObject('CRM_Account');
            
            expect(accountConfig).toBeDefined();
            expect(accountConfig.name).toBe('CRM_Account');
        });

        it('should load CRM Contact object', () => {
            const contactConfig = app.getObject('CRM_Contact');
            
            expect(contactConfig).toBeDefined();
            expect(contactConfig.name).toBe('CRM_Contact');
        });

        it('should load CRM Lead object', () => {
            const leadConfig = app.getObject('CRM_Lead');
            
            expect(leadConfig).toBeDefined();
            expect(leadConfig.name).toBe('CRM_Lead');
        });

        it('should load CRM Opportunity object', () => {
            const opportunityConfig = app.getObject('CRM_Opportunity');
            
            expect(opportunityConfig).toBeDefined();
            expect(opportunityConfig.name).toBe('CRM_Opportunity');
        });
    });

    describe('HR Module Objects', () => {
        it('should load HR Employee object', () => {
            const employeeConfig = app.getObject('HR_Employee');
            
            expect(employeeConfig).toBeDefined();
            expect(employeeConfig.name).toBe('HR_Employee');
        });

        it('should load HR Department object', () => {
            const deptConfig = app.getObject('HR_Department');
            
            expect(deptConfig).toBeDefined();
            expect(deptConfig.name).toBe('HR_Department');
        });

        it('should load HR Position object', () => {
            const posConfig = app.getObject('HR_Position');
            
            expect(posConfig).toBeDefined();
            expect(posConfig.name).toBe('HR_Position');
        });

        it('should load HR Timesheet object', () => {
            const timesheetConfig = app.getObject('HR_Timesheet');
            
            expect(timesheetConfig).toBeDefined();
            expect(timesheetConfig.name).toBe('HR_Timesheet');
        });
    });

    describe('Project Module Objects', () => {
        it('should load Project Project object', () => {
            const projectConfig = app.getObject('Project_Project');
            
            expect(projectConfig).toBeDefined();
            expect(projectConfig.name).toBe('Project_Project');
        });

        it('should load Project Task object', () => {
            const taskConfig = app.getObject('Project_Task');
            
            expect(taskConfig).toBeDefined();
            expect(taskConfig.name).toBe('Project_Task');
        });

        it('should load Project Milestone object', () => {
            const milestoneConfig = app.getObject('Project_Milestone');
            
            expect(milestoneConfig).toBeDefined();
            expect(milestoneConfig.name).toBe('Project_Milestone');
        });

        it('should load Project Timesheet Entry object', () => {
            const entryConfig = app.getObject('Project_Timesheet_Entry');
            
            expect(entryConfig).toBeDefined();
            expect(entryConfig.name).toBe('Project_Timesheet_Entry');
        });
    });

    describe('Finance Module Objects', () => {
        it('should load Finance Invoice object', () => {
            const invoiceConfig = app.getObject('Finance_Invoice');
            
            expect(invoiceConfig).toBeDefined();
            expect(invoiceConfig.name).toBe('Finance_Invoice');
        });

        it('should load Finance Payment object', () => {
            const paymentConfig = app.getObject('Finance_Payment');
            
            expect(paymentConfig).toBeDefined();
            expect(paymentConfig.name).toBe('Finance_Payment');
        });

        it('should load Finance Expense object', () => {
            const expenseConfig = app.getObject('Finance_Expense');
            
            expect(expenseConfig).toBeDefined();
            expect(expenseConfig.name).toBe('Finance_Expense');
        });
    });

    describe('Module-based Organization', () => {
        it('should load objects from multiple modules', () => {
            const configs = app.getConfigs();
            const objectNames = Object.keys(configs);
            
            // Should have objects from different modules
            const hasCRM = objectNames.some(name => name.startsWith('CRM_'));
            const hasHR = objectNames.some(name => name.startsWith('HR_'));
            const hasProject = objectNames.some(name => name.startsWith('Project_'));
            const hasFinance = objectNames.some(name => name.startsWith('Finance_'));
            
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
            const userMeta = app.metadata.get('object', 'User');
            const accountMeta = app.metadata.get('object', 'CRM_Account');
            
            expect(userMeta).toBeDefined();
            expect(accountMeta).toBeDefined();
        });
    });
});
