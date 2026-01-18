/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ObjectQL } from '../src/index';
import { MockDriver } from './mock-driver';
import { ObjectConfig, ValidationError } from '@objectql/types';

const userObject: ObjectConfig = {
    name: 'user',
    fields: {
        name: { 
            type: 'text',
            required: true,
            validation: {
                min_length: 3,
                max_length: 50,
            }
        },
        email: { 
            type: 'email',
            required: true,
            validation: {
                format: 'email',
            }
        },
        age: {
            type: 'number',
            validation: {
                min: 0,
                max: 150,
            }
        }
    }
};

const projectObject: ObjectConfig = {
    name: 'project',
    fields: {
        name: { 
            type: 'text',
            required: true,
        },
        status: {
            type: 'select',
            defaultValue: 'planning',
        },
        start_date: {
            type: 'date',
        },
        end_date: {
            type: 'date',
        },
    },
    validation: {
        rules: [
            {
                name: 'valid_date_range',
                type: 'cross_field',
                rule: {
                    field: 'end_date',
                    operator: '>=',
                    compare_to: 'start_date',
                },
                message: 'End date must be on or after start date',
                error_code: 'INVALID_DATE_RANGE',
            },
            {
                name: 'status_transition',
                type: 'state_machine',
                field: 'status',
                transitions: {
                    planning: {
                        allowed_next: ['active', 'cancelled'],
                    },
                    active: {
                        allowed_next: ['on_hold', 'completed', 'cancelled'],
                    },
                    completed: {
                        allowed_next: [],
                        is_terminal: true,
                    },
                },
                message: 'Invalid status transition from {{old_status}} to {{new_status}}',
                error_code: 'INVALID_STATE_TRANSITION',
            }
        ]
    }
};

describe('ObjectQL Repository Validation Integration', () => {
    let app: ObjectQL;
    let driver: MockDriver;

    beforeEach(async () => {
        driver = new MockDriver();
        app = new ObjectQL({
            datasources: {
                default: driver
            },
            objects: {
                user: userObject,
                project: projectObject,
            }
        });
        await app.init();
    });

    describe('Field-level validation on create', () => {
        it('should reject creation with missing required field', async () => {
            const ctx = app.createContext({ userId: 'u1', isSystem: true });
            const repo = ctx.object('user');

            await expect(
                repo.create({ email: 'test@example.com' })
            ).rejects.toThrow(ValidationError);
        });

        it('should reject creation with invalid email format', async () => {
            const ctx = app.createContext({ userId: 'u1', isSystem: true });
            const repo = ctx.object('user');

            await expect(
                repo.create({ name: 'John Doe', email: 'invalid-email' })
            ).rejects.toThrow(ValidationError);
        });

        it('should reject creation with value below minimum', async () => {
            const ctx = app.createContext({ userId: 'u1', isSystem: true });
            const repo = ctx.object('user');

            await expect(
                repo.create({ name: 'John Doe', email: 'test@example.com', age: -5 })
            ).rejects.toThrow(ValidationError);
        });

        it('should reject creation with value above maximum', async () => {
            const ctx = app.createContext({ userId: 'u1', isSystem: true });
            const repo = ctx.object('user');

            await expect(
                repo.create({ name: 'John Doe', email: 'test@example.com', age: 200 })
            ).rejects.toThrow(ValidationError);
        });

        it('should reject creation with string too short', async () => {
            const ctx = app.createContext({ userId: 'u1', isSystem: true });
            const repo = ctx.object('user');

            await expect(
                repo.create({ name: 'Jo', email: 'test@example.com' })
            ).rejects.toThrow(ValidationError);
        });

        it('should accept valid creation', async () => {
            const ctx = app.createContext({ userId: 'u1', isSystem: true });
            const repo = ctx.object('user');

            const created = await repo.create({ 
                name: 'John Doe', 
                email: 'john@example.com',
                age: 30
            });

            expect(created.name).toBe('John Doe');
            expect(created.email).toBe('john@example.com');
            expect(created.age).toBe(30);
        });
    });

    describe('Field-level validation on update', () => {
        it('should reject update with invalid email format', async () => {
            const ctx = app.createContext({ userId: 'u1', isSystem: true });
            const repo = ctx.object('user');

            const created = await repo.create({ 
                name: 'John Doe', 
                email: 'john@example.com'
            });

            await expect(
                repo.update(created._id, { email: 'invalid-email' })
            ).rejects.toThrow(ValidationError);
        });

        it('should reject update with value below minimum', async () => {
            const ctx = app.createContext({ userId: 'u1', isSystem: true });
            const repo = ctx.object('user');

            const created = await repo.create({ 
                name: 'John Doe', 
                email: 'john@example.com',
                age: 30
            });

            await expect(
                repo.update(created._id, { age: -10 })
            ).rejects.toThrow(ValidationError);
        });

        it('should accept valid update', async () => {
            const ctx = app.createContext({ userId: 'u1', isSystem: true });
            const repo = ctx.object('user');

            const created = await repo.create({ 
                name: 'John Doe', 
                email: 'john@example.com',
                age: 30
            });

            const updated = await repo.update(created._id, { age: 35 });
            expect(updated.age).toBe(35);
        });

        it('should allow partial update without validating unmodified required fields', async () => {
            const ctx = app.createContext({ userId: 'u1', isSystem: true });
            const repo = ctx.object('user');

            const created = await repo.create({ 
                name: 'John Doe', 
                email: 'john@example.com',
                age: 30
            });

            // Update only age - should not require name and email to be in the update payload
            const updated = await repo.update(created._id, { age: 35 });
            expect(updated.age).toBe(35);
            expect(updated.name).toBe('John Doe');
            expect(updated.email).toBe('john@example.com');
        });
    });

    describe('Object-level validation rules', () => {
        it('should reject cross-field validation failure on create', async () => {
            const ctx = app.createContext({ userId: 'u1', isSystem: true });
            const repo = ctx.object('project');

            await expect(
                repo.create({ 
                    name: 'Test Project',
                    start_date: '2024-12-31',
                    end_date: '2024-01-01', // Before start_date
                })
            ).rejects.toThrow(ValidationError);
        });

        it('should accept valid cross-field validation on create', async () => {
            const ctx = app.createContext({ userId: 'u1', isSystem: true });
            const repo = ctx.object('project');

            const created = await repo.create({ 
                name: 'Test Project',
                start_date: '2024-01-01',
                end_date: '2024-12-31',
            });

            expect(created.name).toBe('Test Project');
        });

        it('should reject invalid state transition on update', async () => {
            const ctx = app.createContext({ userId: 'u1', isSystem: true });
            const repo = ctx.object('project');

            const created = await repo.create({ 
                name: 'Test Project',
                status: 'completed',
                start_date: '2024-01-01',
                end_date: '2024-12-31',
            });

            await expect(
                repo.update(created._id, { status: 'active' })
            ).rejects.toThrow(ValidationError);
        });

        it('should accept valid state transition on update', async () => {
            const ctx = app.createContext({ userId: 'u1', isSystem: true });
            const repo = ctx.object('project');

            const created = await repo.create({ 
                name: 'Test Project',
                status: 'planning',
                start_date: '2024-01-01',
                end_date: '2024-12-31',
            });

            const updated = await repo.update(created._id, { status: 'active' });
            expect(updated.status).toBe('active');
        });

        it('should allow same state (no transition)', async () => {
            const ctx = app.createContext({ userId: 'u1', isSystem: true });
            const repo = ctx.object('project');

            const created = await repo.create({ 
                name: 'Test Project',
                status: 'completed',
                start_date: '2024-01-01',
                end_date: '2024-12-31',
            });

            const updated = await repo.update(created._id, { name: 'Updated Project' });
            expect(updated.name).toBe('Updated Project');
            expect(updated.status).toBe('completed');
        });

        it('should validate cross-field rules when updating unrelated fields', async () => {
            const ctx = app.createContext({ userId: 'u1', isSystem: true });
            const repo = ctx.object('project');

            // Create a project with valid date range
            const created = await repo.create({ 
                name: 'Test Project',
                start_date: '2024-01-01',
                end_date: '2024-12-31',
            });

            // Update only the name - should still pass cross-field validation
            // because the merged record has valid dates
            const updated = await repo.update(created._id, { name: 'Updated Project' });
            expect(updated.name).toBe('Updated Project');
            expect(updated.start_date).toBe('2024-01-01');
            expect(updated.end_date).toBe('2024-12-31');
        });
    });

    describe('ValidationError structure', () => {
        it('should throw ValidationError with proper structure', async () => {
            const ctx = app.createContext({ userId: 'u1', isSystem: true });
            const repo = ctx.object('user');

            await expect(async () => {
                await repo.create({ name: 'Jo', email: 'invalid' });
            }).rejects.toThrow(ValidationError);

            // Additional validation of error structure
            try {
                await repo.create({ name: 'Jo', email: 'invalid' });
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
                expect((error as ValidationError).results).toBeDefined();
                expect((error as ValidationError).results.length).toBeGreaterThan(0);
                expect((error as ValidationError).message).toContain('characters');
            }
        });
    });
});
