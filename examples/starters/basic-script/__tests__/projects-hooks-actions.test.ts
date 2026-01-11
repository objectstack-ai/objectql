/**
 * Comprehensive Test Suite for Project Hooks and Actions
 * 
 * This test file demonstrates and validates:
 * 1. All hook types (beforeCreate, afterCreate, beforeUpdate, etc.)
 * 2. All action types (record actions and global actions)
 * 3. Business logic patterns from the specification
 */

import { ObjectQL } from '@objectql/core';
import hooks from '../src/projects.hook';
import * as actions from '../src/projects.action';

describe('Project Hooks - Comprehensive Examples', () => {
    let app: ObjectQL;

    beforeEach(async () => {
        // Use in-memory driver for testing
        app = new ObjectQL({
            datasources: {
                default: {
                    find: jest.fn().mockResolvedValue([]),
                    findOne: jest.fn().mockResolvedValue(null),
                    create: jest.fn((obj, data) => ({ ...data, _id: 'test-id' })),
                    update: jest.fn((obj, id, data) => data),
                    delete: jest.fn().mockResolvedValue(true),
                    count: jest.fn().mockResolvedValue(0)
                } as any
            },
            objects: {
                'projects': {
                    name: 'projects',
                    fields: {
                        name: { type: 'text' },
                        status: { type: 'text' },
                        budget: { type: 'number' },
                        owner: { type: 'text' }
                    }
                }
            }
        });
        await app.init();

        // Register hooks
        if (hooks.beforeCreate) app.on('beforeCreate', 'projects', hooks.beforeCreate);
        if (hooks.afterCreate) app.on('afterCreate', 'projects', hooks.afterCreate);
        if (hooks.beforeFind) app.on('beforeFind', 'projects', hooks.beforeFind);
        if (hooks.afterFind) app.on('afterFind', 'projects', hooks.afterFind);
        if (hooks.beforeUpdate) app.on('beforeUpdate', 'projects', hooks.beforeUpdate);
        if (hooks.afterUpdate) app.on('afterUpdate', 'projects', hooks.afterUpdate);
        if (hooks.beforeDelete) app.on('beforeDelete', 'projects', hooks.beforeDelete);
        if (hooks.afterDelete) app.on('afterDelete', 'projects', hooks.afterDelete);
    });

    describe('beforeCreate Hook', () => {
        it('should auto-assign owner from user context', async () => {
            const repo = app.createContext({ userId: 'user123' }).object('projects');
            
            await repo.create({ name: 'Test Project' });
            
            const driver = app.datasource('default');
            expect(driver.create).toHaveBeenCalledWith(
                'projects',
                expect.objectContaining({
                    name: 'Test Project',
                    owner: 'user123'
                }),
                expect.any(Object)
            );
        });

        it('should set default status to planned', async () => {
            const repo = app.createContext({}).object('projects');
            
            await repo.create({ name: 'Test Project' });
            
            const driver = app.datasource('default');
            expect(driver.create).toHaveBeenCalledWith(
                'projects',
                expect.objectContaining({
                    status: 'planned'
                }),
                expect.any(Object)
            );
        });

        it('should validate project name is required', async () => {
            const repo = app.createContext({}).object('projects');
            
            await expect(repo.create({ name: '' }))
                .rejects
                .toThrow('Project name is required');
        });

        it('should validate project name length', async () => {
            const repo = app.createContext({}).object('projects');
            const longName = 'a'.repeat(101);
            
            await expect(repo.create({ name: longName }))
                .rejects
                .toThrow('Project name must be 100 characters or less');
        });

        it('should set default budget to 0', async () => {
            const repo = app.createContext({}).object('projects');
            
            await repo.create({ name: 'Test Project' });
            
            const driver = app.datasource('default');
            expect(driver.create).toHaveBeenCalledWith(
                'projects',
                expect.objectContaining({
                    budget: 0
                }),
                expect.any(Object)
            );
        });
    });

    describe('beforeUpdate Hook', () => {
        it('should validate budget is not negative', async () => {
            const repo = app.createContext({}).object('projects');
            const driver = app.datasource('default');
            
            // Mock existing project
            (driver.findOne as jest.Mock).mockResolvedValueOnce({
                _id: '1',
                name: 'Test',
                status: 'planned',
                budget: 1000
            });
            
            await expect(repo.update('1', { budget: -100 }))
                .rejects
                .toThrow('Budget cannot be negative');
        });

        it('should prevent invalid status transitions', async () => {
            const repo = app.createContext({}).object('projects');
            const driver = app.datasource('default');
            
            // Mock completed project
            (driver.findOne as jest.Mock).mockResolvedValueOnce({
                _id: '1',
                name: 'Test',
                status: 'completed',
                budget: 1000
            });
            
            await expect(repo.update('1', { status: 'planned' }))
                .rejects
                .toThrow('Invalid status transition');
        });

        it('should allow valid status transition from planned to in_progress', async () => {
            const repo = app.createContext({}).object('projects');
            const driver = app.datasource('default');
            
            (driver.findOne as jest.Mock).mockResolvedValueOnce({
                _id: '1',
                name: 'Test',
                status: 'planned',
                budget: 1000
            });
            
            await repo.update('1', { status: 'in_progress' });
            
            expect(driver.update).toHaveBeenCalled();
        });

        it('should require end_date when marking as completed', async () => {
            const repo = app.createContext({}).object('projects');
            const driver = app.datasource('default');
            
            (driver.findOne as jest.Mock).mockResolvedValueOnce({
                _id: '1',
                name: 'Test',
                status: 'in_progress',
                budget: 1000
            });
            
            await expect(repo.update('1', { status: 'completed' }))
                .rejects
                .toThrow('End date is required when completing a project');
        });
    });

    describe('beforeDelete Hook', () => {
        it('should prevent deletion of completed projects', async () => {
            const repo = app.createContext({}).object('projects');
            const driver = app.datasource('default');
            
            (driver.findOne as jest.Mock).mockResolvedValueOnce({
                _id: '1',
                name: 'Test',
                status: 'completed'
            });
            
            await expect(repo.delete('1'))
                .rejects
                .toThrow('Cannot delete completed projects');
        });
    });

    describe('afterFind Hook', () => {
        it('should add computed progress field', async () => {
            const repo = app.createContext({}).object('projects');
            const driver = app.datasource('default');
            
            (driver.find as jest.Mock).mockResolvedValueOnce([
                { name: 'Project 1', status: 'planned' },
                { name: 'Project 2', status: 'in_progress' },
                { name: 'Project 3', status: 'completed' }
            ]);
            
            const results = await repo.find({});
            
            expect(results[0].progress).toBe(0);
            expect(results[1].progress).toBe(50);
            expect(results[2].progress).toBe(100);
        });
    });
});

describe('Project Actions - Comprehensive Examples', () => {
    let mockApi: any;
    let mockUser: any;

    beforeEach(() => {
        mockUser = { id: 'user123', isAdmin: false };
        mockApi = {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn()
        };
    });

    describe('complete - Record Action', () => {
        it('should complete a project successfully', async () => {
            const mockProject = {
                _id: 'proj1',
                name: 'Test Project',
                status: 'in_progress',
                description: 'Original description'
            };
            
            mockApi.findOne.mockResolvedValue(mockProject);
            mockApi.update.mockResolvedValue({ ...mockProject, status: 'completed' });
            
            const result = await actions.complete.handler({
                objectName: 'projects',
                actionName: 'complete',
                id: 'proj1',
                input: { comment: 'All tasks done' },
                api: mockApi,
                user: mockUser
            });
            
            expect(result.success).toBe(true);
            expect(result.message).toContain('completed successfully');
            expect(mockApi.update).toHaveBeenCalledWith(
                'projects',
                'proj1',
                expect.objectContaining({
                    status: 'completed'
                })
            );
        });

        it('should reject if project is already completed', async () => {
            mockApi.findOne.mockResolvedValue({
                _id: 'proj1',
                status: 'completed'
            });
            
            await expect(actions.complete.handler({
                objectName: 'projects',
                actionName: 'complete',
                id: 'proj1',
                input: {},
                api: mockApi,
                user: mockUser
            })).rejects.toThrow('already completed');
        });
    });

    describe('approve - Record Action', () => {
        it('should approve a planned project', async () => {
            mockApi.findOne.mockResolvedValue({
                _id: 'proj1',
                name: 'Test Project',
                status: 'planned',
                budget: 50000
            });
            
            const result = await actions.approve.handler({
                objectName: 'projects',
                actionName: 'approve',
                id: 'proj1',
                input: { comment: 'Looks good' },
                api: mockApi,
                user: mockUser
            });
            
            expect(result.success).toBe(true);
            expect(result.new_status).toBe('in_progress');
            expect(mockApi.update).toHaveBeenCalledWith(
                'projects',
                'proj1',
                expect.objectContaining({
                    status: 'in_progress',
                    approved_by: 'user123'
                })
            );
        });

        it('should require approval comment', async () => {
            await expect(actions.approve.handler({
                objectName: 'projects',
                actionName: 'approve',
                id: 'proj1',
                input: { comment: '' },
                api: mockApi,
                user: mockUser
            })).rejects.toThrow('Approval comment is required');
        });
    });

    describe('clone - Record Action', () => {
        it('should clone a project with new name', async () => {
            const sourceProject = {
                _id: 'proj1',
                name: 'Original Project',
                description: 'Original description',
                status: 'in_progress',
                priority: 'high',
                budget: 10000,
                owner: 'owner123'
            };
            
            mockApi.findOne.mockResolvedValue(sourceProject);
            mockApi.create.mockResolvedValue({ _id: 'proj2', name: 'Cloned Project' });
            
            const result = await actions.clone.handler({
                objectName: 'projects',
                actionName: 'clone',
                id: 'proj1',
                input: { new_name: 'Cloned Project', copy_tasks: false },
                api: mockApi,
                user: mockUser
            });
            
            expect(result.success).toBe(true);
            expect(result.new_project_id).toBe('proj2');
            expect(mockApi.create).toHaveBeenCalledWith(
                'projects',
                expect.objectContaining({
                    name: 'Cloned Project',
                    status: 'planned',  // Reset to planned
                    priority: 'high',
                    budget: 10000,
                    owner: 'user123'  // Assigned to current user
                })
            );
        });
    });

    describe('import_projects - Global Action', () => {
        it('should import multiple projects successfully', async () => {
            const projectsData = [
                { name: 'Project 1', description: 'Desc 1' },
                { name: 'Project 2', description: 'Desc 2', status: 'in_progress' }
            ];
            
            mockApi.create.mockResolvedValue({ _id: 'new-id' });
            
            const result = await actions.import_projects.handler({
                objectName: 'projects',
                actionName: 'import_projects',
                input: { source: 'json', data: projectsData },
                api: mockApi,
                user: mockUser
            });
            
            expect(result.success).toBe(true);
            expect(result.successCount).toBe(2);
            expect(mockApi.create).toHaveBeenCalledTimes(2);
        });

        it('should collect errors for invalid projects', async () => {
            const projectsData = [
                { name: 'Valid Project' },
                { description: 'Missing name' },  // Invalid - no name
                { name: 'Another Valid' }
            ];
            
            mockApi.create.mockResolvedValue({ _id: 'new-id' });
            
            const result = await actions.import_projects.handler({
                objectName: 'projects',
                actionName: 'import_projects',
                input: { source: 'json', data: projectsData },
                api: mockApi,
                user: mockUser
            });
            
            expect(result.failed).toBe(1);
            expect(result.errors).toHaveLength(1);
        });
    });

    describe('bulk_update_status - Global Action', () => {
        it('should update multiple projects status', async () => {
            mockApi.findOne.mockImplementation((obj: string, id: string) => ({
                _id: id,
                name: `Project ${id}`,
                status: 'planned'
            }));
            
            const result = await actions.bulk_update_status.handler({
                objectName: 'projects',
                actionName: 'bulk_update_status',
                input: { 
                    project_ids: ['proj1', 'proj2', 'proj3'],
                    new_status: 'in_progress'
                },
                api: mockApi,
                user: mockUser
            });
            
            expect(result.updated).toBe(3);
            expect(mockApi.update).toHaveBeenCalledTimes(3);
        });

        it('should skip completed projects', async () => {
            mockApi.findOne.mockImplementation((obj: string, id: string) => {
                if (id === 'proj2') {
                    return { _id: id, name: 'Completed Project', status: 'completed' };
                }
                return { _id: id, name: 'Project', status: 'planned' };
            });
            
            const result = await actions.bulk_update_status.handler({
                objectName: 'projects',
                actionName: 'bulk_update_status',
                input: { 
                    project_ids: ['proj1', 'proj2', 'proj3'],
                    new_status: 'planned'
                },
                api: mockApi,
                user: mockUser
            });
            
            expect(result.updated).toBe(2);
            expect(result.skipped).toBe(1);
        });
    });

    describe('generate_report - Global Action', () => {
        it('should generate statistical report', async () => {
            const mockProjects = [
                { name: 'P1', status: 'planned', priority: 'high', budget: 10000 },
                { name: 'P2', status: 'in_progress', priority: 'normal', budget: 20000 },
                { name: 'P3', status: 'completed', priority: 'low', budget: 15000 },
                { name: 'P4', status: 'planned', priority: 'normal', budget: 5000 }
            ];
            
            mockApi.find.mockResolvedValue(mockProjects);
            
            const result = await actions.generate_report.handler({
                objectName: 'projects',
                actionName: 'generate_report',
                input: {},
                api: mockApi,
                user: mockUser
            });
            
            expect(result.success).toBe(true);
            expect(result.report.total_projects).toBe(4);
            expect(result.report.by_status.planned).toBe(2);
            expect(result.report.by_status.in_progress).toBe(1);
            expect(result.report.by_status.completed).toBe(1);
            expect(result.report.total_budget).toBe(50000);
            expect(result.report.average_budget).toBe(12500);
        });
    });
});
