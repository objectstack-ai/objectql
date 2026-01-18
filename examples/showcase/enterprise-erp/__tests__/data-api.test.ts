/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Data API Tests for Enterprise Starter
 * 
 * Tests CRUD operations for enterprise objects
 */

import { ObjectQL } from '@objectql/core';
import { SqlDriver } from '@objectql/driver-sql';
import { ObjectLoader } from '@objectql/platform-node';
import * as path from 'path';
import { nanoid } from 'nanoid';

// Helper to generate IDs since SQL driver doesn't auto-generate them
const generateId = () => nanoid(16);

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
                    id: generateId(), // Provide ID manually
                    name: 'John Doe',
                    email: 'john@example.com',
                    username: 'johndoe'
                });
                

                expect(result).toBeDefined();
                expect(result.id).toBeDefined();
                expect(result.id).not.toBeNull();
                expect(result.name).toBe('John Doe');
                
                userId = result.id;
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
                expect(result.id).toBe(userId);
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
                expect(deleted).toBeFalsy();
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
                expect(result.id).toBeDefined();
                expect(result.name).toBe('Acme Corp');
                
                orgId = result.id;
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
                expect(result.id).toBeDefined();
                expect(result.name).toBe('Global Solutions Inc');
                
                accountId = result.id;
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
                // First create an account (required for contact)
                const account = await ctx.object('crm_account').create({
                    id: generateId(),
                    name: 'Contact Test Company',
                    account_number: 'CTC001'
                });
                
                console.log('CRM Account:', account); // Debugging
                expect(account).toBeDefined();
                expect(account.id).toBeDefined();
                
                const result = await ctx.object('crm_contact').create({
                    first_name: 'Jane',
                    last_name: 'Smith',
                    email: 'jane.smith@example.com',
                    account: account.id // Required field
                });

                expect(result).toBeDefined();
                expect(result.id).toBeDefined();
                expect(result.first_name).toBe('Jane');
            });

            it('should create a CRM lead', async () => {
                const ctx = app.createContext({ isSystem: true });
                const result = await ctx.object('crm_lead').create({
                    first_name: 'Bob',
                    last_name: 'Johnson',
                    company: 'Tech Startup',
                    status: 'new' // Required field
                });

                expect(result).toBeDefined();
                expect(result.id).toBeDefined();
                expect(result.company).toBe('Tech Startup');
            });
        });
    });

    describe('HR Module Operations', () => {
        describe('Employee CRUD', () => {
            let employeeId: string;

            it('should create an HR employee', async () => {
                const ctx = app.createContext({ isSystem: true });
                // Create required department and position first
                const dept = await ctx.object('hr_department').create({
                    id: generateId(),
                    name: 'Engineering Dept',
                    code: 'ENGD'
                });
                
                
                expect(dept).toBeDefined();
                expect(dept.id).toBeDefined();
                expect(dept.id).not.toBeNull();
                
                const pos = await ctx.object('hr_position').create({
                    id: generateId(),
                    title: 'Software Engineer', // Position uses 'title', not 'name'
                    code: 'SWE'
                });
                
                
                expect(pos).toBeDefined();
                expect(pos.id).toBeDefined();
                expect(pos.id).not.toBeNull();
                
                const result = await ctx.object('hr_employee').create({
                    id: generateId(),
                    first_name: 'Alice',
                    last_name: 'Brown',
                    employee_number: 'EMP001',
                    email: 'alice.brown@example.com', // Required
                    department: dept.id, // Required
                    position: pos.id, // Required
                    hire_date: '2024-01-01', // Required
                    status: 'active',
                    employment_type: 'full_time'
                });

                expect(result).toBeDefined();
                expect(result.id).toBeDefined();
                expect(result.id).not.toBeNull();
                expect(result.first_name).toBe('Alice');
                
                employeeId = result.id;
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
                    id: generateId(),
                    name: 'Sales Department',
                    code: 'SALES' // Use unique code
                });

                expect(result).toBeDefined();
                expect(result.id).toBeDefined();
                expect(result.name).toBe('Sales Department');
            });
        });
    });

    describe('Project Module Operations', () => {
        describe('Project CRUD', () => {
            let projectId: string;

            it('should create a project', async () => {
                const ctx = app.createContext({ isSystem: true });
                // Create a user first (required as project owner)
                const user = await ctx.object('user').create({
                    id: generateId(),
                    name: 'Project Manager',
                    email: 'pm@example.com',
                    username: 'pmuser'
                });
                
                console.log('Project User:', user); // Debugging
                expect(user).toBeDefined();
                expect(user.id).toBeDefined();
                
                const result = await ctx.object('project_project').create({
                    id: generateId(),
                    name: 'Website Redesign',
                    code: 'WEB-001',
                    status: 'planning', // Required field
                    owner: user.id, // Required field
                    start_date: '2024-01-01' // Required field
                });

                expect(result).toBeDefined();
                expect(result.id).toBeDefined();
                expect(result.name).toBe('Website Redesign');
                
                projectId = result.id;
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
                // Create a user and project first (required for task)
                const user = await ctx.object('user').create({
                    id: generateId(),
                    name: 'Task Owner',
                    email: 'taskowner@example.com',
                    username: 'taskuser'
                });
                
                expect(user).toBeDefined();
                expect(user.id).toBeDefined();
                
                const project = await ctx.object('project_project').create({
                    id: generateId(),
                    name: 'Test Project',
                    code: 'TEST-001',
                    status: 'planning',
                    owner: user.id, // Required
                    start_date: '2024-01-01' // Required
                });
                
                expect(project).toBeDefined();
                expect(project.id).toBeDefined();
                
                const result = await ctx.object('project_task').create({
                    id: generateId(),
                    name: 'Design mockups',
                    description: 'Create initial design mockups',
                    project: project.id, // Required field
                    status: 'pending' // Required field
                });

                expect(result).toBeDefined();
                expect(result.id).toBeDefined();
                expect(result.name).toBe('Design mockups');
            });
        });
    });

    describe('Finance Module Operations', () => {
        describe('Invoice CRUD', () => {
            it('should create a finance invoice', async () => {
                const ctx = app.createContext({ isSystem: true });
                // Create an account first (required for invoice)
                const account = await ctx.object('crm_account').create({
                    id: generateId(),
                    name: 'Invoice Test Company',
                    account_number: 'ITC001'
                });
                
                expect(account).toBeDefined();
                expect(account.id).toBeDefined();
                
                const result = await ctx.object('finance_invoice').create({
                    id: generateId(),
                    invoice_number: 'INV-001',
                    total_amount: 1000,
                    account: account.id, // Required
                    invoice_date: '2024-01-01', // Required
                    due_date: '2024-01-31', // Required
                    subtotal: 1000, // Required
                    status: 'draft'
                });

                expect(result).toBeDefined();
                expect(result.id).toBeDefined();
                expect(result.invoice_number).toBe('INV-001');
            });
        });

        describe('Payment CRUD', () => {
            it('should create a finance payment', async () => {
                const ctx = app.createContext({ isSystem: true });
                // Create an account first (required for payment)
                const account = await ctx.object('crm_account').create({
                    id: generateId(),
                    name: 'Payment Test Company',
                    account_number: 'PTC001'
                });
                
                expect(account).toBeDefined();
                expect(account.id).toBeDefined();
                
                const result = await ctx.object('finance_payment').create({
                    id: generateId(),
                    payment_number: 'PAY-001', // Required
                    amount: 500,
                    payment_method: 'bank_transfer', // Use underscore format
                    account: account.id, // Required
                    payment_date: '2024-01-01', // Required
                    status: 'completed'
                });

                expect(result).toBeDefined();
                expect(result.id).toBeDefined();
                expect(result.amount).toBe(500);
            });
        });
    });

    describe('Cross-Module Operations', () => {
        it('should handle operations across multiple modules', async () => {
            const ctx = app.createContext({ isSystem: true });

            // Create records in different modules
            const account = await ctx.object('crm_account').create({
                id: generateId(),
                name: 'Multi-Module Test',
                account_number: 'MMT001'
            });
            
            expect(account).toBeDefined();
            expect(account.id).toBeDefined();

            // Create required department and position first
            const dept = await ctx.object('hr_department').create({
                id: generateId(),
                name: 'Cross Test Dept',
                code: 'CTD'
            });
            
            expect(dept).toBeDefined();
            expect(dept.id).toBeDefined();
            
            const pos = await ctx.object('hr_position').create({
                id: generateId(),
                title: 'Cross Test Position', // Position uses 'title', not 'name'
                code: 'CTP'
            });
            
            expect(pos).toBeDefined();
            expect(pos.id).toBeDefined();

            const employee = await ctx.object('hr_employee').create({
                id: generateId(),
                first_name: 'Test',
                last_name: 'Employee',
                employee_number: 'TEST001',
                email: 'test.employee@example.com', // Required
                department: dept.id, // Required
                position: pos.id, // Required
                hire_date: '2024-01-01', // Required
                employment_type: 'full_time',
                status: 'active'
            });
            
            expect(employee).toBeDefined();
            expect(employee.id).toBeDefined();
            
            // Create a user for project owner
            const user = await ctx.object('user').create({
                id: generateId(),
                name: 'Cross Test User',
                email: 'crosstest@example.com',
                username: 'crosstestuser'
            });
            
            expect(user).toBeDefined();
            expect(user.id).toBeDefined();

            const project = await ctx.object('project_project').create({
                id: generateId(),
                name: 'Cross-Module Project',
                code: 'CROSS-001',
                status: 'planning',
                owner: user.id, // Required
                start_date: '2024-01-01' // Required
            });

            expect(account.id).toBeDefined();
            expect(employee.id).toBeDefined();
            expect(project.id).toBeDefined();

            // Cleanup
            await ctx.object('crm_account').delete(account.id);
            await ctx.object('hr_employee').delete(employee.id);
            await ctx.object('project_project').delete(project.id);
        });

        it('should count records across modules', async () => {
            const ctx = app.createContext({ isSystem: true });

            const accountCount = await ctx.object('crm_account').count([]);
            const employeeCount = await ctx.object('hr_employee').count([]);
            const projectCount = await ctx.object('project_project').count([]);

            expect(typeof accountCount).toBe('number');
            expect(typeof employeeCount).toBe('number');
            expect(typeof projectCount).toBe('number');
        });
    });
});
