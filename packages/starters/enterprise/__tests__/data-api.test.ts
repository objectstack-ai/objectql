/**
 * Data API Tests for Enterprise Starter
 * 
 * Tests CRUD operations for enterprise objects
 */

import { ObjectQL } from '@objectql/core';
import { SqlDriver } from '@objectql/driver-sql';
import { ObjectLoader } from '@objectql/platform-node';
import * as path from 'path';

describe('Enterprise Data API', () => {
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

    describe('Core Object Operations', () => {
        describe('User CRUD', () => {
            let userId: string;

            it('should create a user', async () => {
                const ctx = app.createContext({ isSystem: true });
                const result = await ctx.object('user').create({
                    name: 'John Doe',
                    email: 'john@example.com',
                    username: 'johndoe'
                });

                expect(result).toBeDefined();
                expect(result._id).toBeDefined();
                expect(result.name).toBe('John Doe');
                
                userId = result._id;
            });

            it('should find users', async () => {
                const ctx = app.createContext({ isSystem: true });
                const results = await ctx.object('user').find({});

                expect(results).toBeDefined();
                expect(Array.isArray(results)).toBe(true);
                expect(results.length).toBeGreaterThanOrEqual(1);
            });

            it('should find user by id', async () => {
                const ctx = app.createContext({ isSystem: true });
                const result = await ctx.object('user').findOne(userId);

                expect(result).toBeDefined();
                expect(result._id).toBe(userId);
                expect(result.name).toBe('John Doe');
            });

            it('should update user', async () => {
                const ctx = app.createContext({ isSystem: true });
                await ctx.object('user').update(userId, {
                    email: 'john.doe@example.com'
                });

                const updated = await ctx.object('user').findOne(userId);
                expect(updated.email).toBe('john.doe@example.com');
            });

            it('should delete user', async () => {
                const ctx = app.createContext({ isSystem: true });
                await ctx.object('user').delete(userId);

                const deleted = await ctx.object('user').findOne(userId);
                expect(deleted).toBeNull();
            });
        });

        describe('Organization CRUD', () => {
            let orgId: string;

            it('should create an organization', async () => {
                const ctx = app.createContext({ isSystem: true });
                const result = await ctx.object('organization').create({
                    name: 'Acme Corp',
                    code: 'ACME'
                });

                expect(result).toBeDefined();
                expect(result._id).toBeDefined();
                expect(result.name).toBe('Acme Corp');
                
                orgId = result._id;
            });

            it('should find organizations', async () => {
                const ctx = app.createContext({ isSystem: true });
                const results = await ctx.object('organization').find({});

                expect(results).toBeDefined();
                expect(results.length).toBeGreaterThanOrEqual(1);
            });

            it('should delete organization', async () => {
                const ctx = app.createContext({ isSystem: true });
                await ctx.object('organization').delete(orgId);
            });
        });
    });

    describe('CRM Module Operations', () => {
        describe('Account CRUD', () => {
            let accountId: string;

            it('should create a CRM account', async () => {
                const ctx = app.createContext({ isSystem: true });
                const result = await ctx.object('crm_account').create({
                    name: 'Global Solutions Inc',
                    industry: 'Technology'
                });

                expect(result).toBeDefined();
                expect(result._id).toBeDefined();
                expect(result.name).toBe('Global Solutions Inc');
                
                accountId = result._id;
            });

            it('should find CRM accounts', async () => {
                const ctx = app.createContext({ isSystem: true });
                const results = await ctx.object('crm_account').find({});

                expect(results).toBeDefined();
                expect(results.length).toBeGreaterThanOrEqual(1);
            });

            it('should update CRM account', async () => {
                const ctx = app.createContext({ isSystem: true });
                await ctx.object('crm_account').update(accountId, {
                    industry: 'IT Services'
                });

                const updated = await ctx.object('crm_account').findOne(accountId);
                expect(updated.industry).toBe('IT Services');
            });

            it('should delete CRM account', async () => {
                const ctx = app.createContext({ isSystem: true });
                await ctx.object('crm_account').delete(accountId);
            });
        });

        describe('Contact and Lead CRUD', () => {
            it('should create a CRM contact', async () => {
                const ctx = app.createContext({ isSystem: true });
                const result = await ctx.object('crm_contact').create({
                    first_name: 'Jane',
                    last_name: 'Smith',
                    email: 'jane.smith@example.com'
                });

                expect(result).toBeDefined();
                expect(result._id).toBeDefined();
                expect(result.first_name).toBe('Jane');
            });

            it('should create a CRM lead', async () => {
                const ctx = app.createContext({ isSystem: true });
                const result = await ctx.object('crm_lead').create({
                    first_name: 'Bob',
                    last_name: 'Johnson',
                    company: 'Tech Startup'
                });

                expect(result).toBeDefined();
                expect(result._id).toBeDefined();
                expect(result.company).toBe('Tech Startup');
            });
        });
    });

    describe('HR Module Operations', () => {
        describe('Employee CRUD', () => {
            let employeeId: string;

            it('should create an HR employee', async () => {
                const ctx = app.createContext({ isSystem: true });
                const result = await ctx.object('hr_employee').create({
                    first_name: 'Alice',
                    last_name: 'Brown',
                    employee_number: 'EMP001'
                });

                expect(result).toBeDefined();
                expect(result._id).toBeDefined();
                expect(result.first_name).toBe('Alice');
                
                employeeId = result._id;
            });

            it('should find HR employees', async () => {
                const ctx = app.createContext({ isSystem: true });
                const results = await ctx.object('hr_employee').find({});

                expect(results).toBeDefined();
                expect(results.length).toBeGreaterThanOrEqual(1);
            });

            it('should delete HR employee', async () => {
                const ctx = app.createContext({ isSystem: true });
                await ctx.object('hr_employee').delete(employeeId);
            });
        });

        describe('Department CRUD', () => {
            it('should create an HR department', async () => {
                const ctx = app.createContext({ isSystem: true });
                const result = await ctx.object('hr_department').create({
                    name: 'Engineering',
                    code: 'ENG'
                });

                expect(result).toBeDefined();
                expect(result._id).toBeDefined();
                expect(result.name).toBe('Engineering');
            });
        });
    });

    describe('Project Module Operations', () => {
        describe('Project CRUD', () => {
            let projectId: string;

            it('should create a project', async () => {
                const ctx = app.createContext({ isSystem: true });
                const result = await ctx.object('project_project').create({
                    name: 'Website Redesign',
                    code: 'WEB-001'
                });

                expect(result).toBeDefined();
                expect(result._id).toBeDefined();
                expect(result.name).toBe('Website Redesign');
                
                projectId = result._id;
            });

            it('should find projects', async () => {
                const ctx = app.createContext({ isSystem: true });
                const results = await ctx.object('project_project').find({});

                expect(results).toBeDefined();
                expect(results.length).toBeGreaterThanOrEqual(1);
            });

            it('should delete project', async () => {
                const ctx = app.createContext({ isSystem: true });
                await ctx.object('project_project').delete(projectId);
            });
        });

        describe('Task CRUD', () => {
            it('should create a project task', async () => {
                const ctx = app.createContext({ isSystem: true });
                const result = await ctx.object('project_task').create({
                    name: 'Design mockups',
                    description: 'Create initial design mockups'
                });

                expect(result).toBeDefined();
                expect(result._id).toBeDefined();
                expect(result.name).toBe('Design mockups');
            });
        });
    });

    describe('Finance Module Operations', () => {
        describe('Invoice CRUD', () => {
            it('should create a finance invoice', async () => {
                const ctx = app.createContext({ isSystem: true });
                const result = await ctx.object('finance_invoice').create({
                    invoice_number: 'INV-001',
                    total_amount: 1000
                });

                expect(result).toBeDefined();
                expect(result._id).toBeDefined();
                expect(result.invoice_number).toBe('INV-001');
            });
        });

        describe('Payment CRUD', () => {
            it('should create a finance payment', async () => {
                const ctx = app.createContext({ isSystem: true });
                const result = await ctx.object('finance_payment').create({
                    amount: 500,
                    payment_method: 'Bank Transfer'
                });

                expect(result).toBeDefined();
                expect(result._id).toBeDefined();
                expect(result.amount).toBe(500);
            });
        });
    });

    describe('Cross-Module Operations', () => {
        it('should handle operations across multiple modules', async () => {
            const ctx = app.createContext({ isSystem: true });

            // Create records in different modules
            const account = await ctx.object('crm_account').create({
                name: 'Multi-Module Test'
            });

            const employee = await ctx.object('hr_employee').create({
                first_name: 'Test',
                last_name: 'Employee',
                employee_number: 'TEST001'
            });

            const project = await ctx.object('project_project').create({
                name: 'Cross-Module Project',
                code: 'CROSS-001'
            });

            expect(account._id).toBeDefined();
            expect(employee._id).toBeDefined();
            expect(project._id).toBeDefined();

            // Cleanup
            await ctx.object('crm_account').delete(account._id);
            await ctx.object('hr_employee').delete(employee._id);
            await ctx.object('project_project').delete(project._id);
        });

        it('should count records across modules', async () => {
            const ctx = app.createContext({ isSystem: true });

            const accountCount = await ctx.object('crm_account').count({});
            const employeeCount = await ctx.object('hr_employee').count({});
            const projectCount = await ctx.object('project_project').count({});

            expect(typeof accountCount).toBe('number');
            expect(typeof employeeCount).toBe('number');
            expect(typeof projectCount).toBe('number');
        });
    });
});
