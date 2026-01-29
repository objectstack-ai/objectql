/**
 * ObjectQL Security Plugin - Query Trimmer Tests
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { QueryTrimmer } from '../src/query-trimmer';
import { PermissionLoader } from '../src/permission-loader';
import type { SecurityContext } from '../src/types';
import type { PermissionConfig } from '@objectql/types';

describe('QueryTrimmer', () => {
    let trimmer: QueryTrimmer;
    let mockLoader: PermissionLoader;

    beforeEach(() => {
        // Create a mock permission loader
        mockLoader = {
            load: jest.fn(),
            loadAll: jest.fn(),
            reload: jest.fn()
        } as any;

        trimmer = new QueryTrimmer(mockLoader);
    });

    describe('Formula-based conditions', () => {
        it('should convert simple formula to filter', async () => {
            const config: PermissionConfig = {
                name: 'projects_rls',
                object: 'projects',
                row_level_security: {
                    enabled: true,
                    default_rule: {
                        type: 'formula',
                        formula: "status == 'active'"
                    } as any
                }
            };

            (mockLoader.load as jest.Mock).mockResolvedValue(config);

            const query: any = {};
            const context: SecurityContext = {
                user: { id: 'user1', roles: [] },
                objectName: 'projects',
                operation: 'read'
            };

            await trimmer.applyRowLevelSecurity('projects', query, context);

            expect(query.filters).toEqual({
                status: 'active'
            });
        });

        it('should convert formula with user context to filter', async () => {
            const config: PermissionConfig = {
                name: 'projects_rls',
                object: 'projects',
                row_level_security: {
                    enabled: true,
                    default_rule: {
                        type: 'formula',
                        formula: "owner == $current_user.id"
                    } as any
                }
            };

            (mockLoader.load as jest.Mock).mockResolvedValue(config);

            const query: any = {};
            const context: SecurityContext = {
                user: { id: 'user123', roles: [] },
                objectName: 'projects',
                operation: 'read'
            };

            await trimmer.applyRowLevelSecurity('projects', query, context);

            expect(query.filters).toEqual({
                owner: 'user123'
            });
        });

        it('should convert formula with AND operator', async () => {
            const config: PermissionConfig = {
                name: 'projects_rls',
                object: 'projects',
                row_level_security: {
                    enabled: true,
                    default_rule: {
                        type: 'formula',
                        formula: "status == 'active' && owner == $current_user.id"
                    } as any
                }
            };

            (mockLoader.load as jest.Mock).mockResolvedValue(config);

            const query: any = {};
            const context: SecurityContext = {
                user: { id: 'user123', roles: [] },
                objectName: 'projects',
                operation: 'read'
            };

            await trimmer.applyRowLevelSecurity('projects', query, context);

            expect(query.filters).toEqual({
                $and: [
                    { status: 'active' },
                    { owner: 'user123' }
                ]
            });
        });

        it('should convert formula with OR operator', async () => {
            const config: PermissionConfig = {
                name: 'projects_rls',
                object: 'projects',
                row_level_security: {
                    enabled: true,
                    default_rule: {
                        type: 'formula',
                        formula: "status == 'active' || status == 'pending'"
                    } as any
                }
            };

            (mockLoader.load as jest.Mock).mockResolvedValue(config);

            const query: any = {};
            const context: SecurityContext = {
                user: { id: 'user123', roles: [] },
                objectName: 'projects',
                operation: 'read'
            };

            await trimmer.applyRowLevelSecurity('projects', query, context);

            expect(query.filters).toEqual({
                $or: [
                    { status: 'active' },
                    { status: 'pending' }
                ]
            });
        });

        it('should handle comparison operators', async () => {
            const config: PermissionConfig = {
                name: 'projects_rls',
                object: 'projects',
                row_level_security: {
                    enabled: true,
                    default_rule: {
                        type: 'formula',
                        formula: "budget > 1000"
                    } as any
                }
            };

            (mockLoader.load as jest.Mock).mockResolvedValue(config);

            const query: any = {};
            const context: SecurityContext = {
                user: { id: 'user123', roles: [] },
                objectName: 'projects',
                operation: 'read'
            };

            await trimmer.applyRowLevelSecurity('projects', query, context);

            expect(query.filters).toEqual({
                budget: { $gt: 1000 }
            });
        });

        it('should handle field existence check', async () => {
            const config: PermissionConfig = {
                name: 'projects_rls',
                object: 'projects',
                row_level_security: {
                    enabled: true,
                    default_rule: {
                        type: 'formula',
                        formula: "owner"
                    } as any
                }
            };

            (mockLoader.load as jest.Mock).mockResolvedValue(config);

            const query: any = {};
            const context: SecurityContext = {
                user: { id: 'user123', roles: [] },
                objectName: 'projects',
                operation: 'read'
            };

            await trimmer.applyRowLevelSecurity('projects', query, context);

            expect(query.filters).toEqual({
                owner: { $ne: null }
            });
        });

        it('should handle negated field check', async () => {
            const config: PermissionConfig = {
                name: 'projects_rls',
                object: 'projects',
                row_level_security: {
                    enabled: true,
                    default_rule: {
                        type: 'formula',
                        formula: "!archived"
                    } as any
                }
            };

            (mockLoader.load as jest.Mock).mockResolvedValue(config);

            const query: any = {};
            const context: SecurityContext = {
                user: { id: 'user123', roles: [] },
                objectName: 'projects',
                operation: 'read'
            };

            await trimmer.applyRowLevelSecurity('projects', query, context);

            expect(query.filters).toEqual({
                archived: { $in: [null, undefined, ''] }
            });
        });
    });

    describe('Lookup-based conditions', () => {
        it('should convert lookup condition to filter', async () => {
            const config: PermissionConfig = {
                name: 'tasks_rls',
                object: 'tasks',
                row_level_security: {
                    enabled: true,
                    default_rule: {
                        type: 'lookup',
                        object: 'projects',
                        via: 'project_id',
                        condition: {
                            type: 'simple',
                            field: 'owner',
                            operator: '=',
                            value: '$current_user.id'
                        }
                    } as any
                }
            };

            (mockLoader.load as jest.Mock).mockResolvedValue(config);

            const query: any = {};
            const context: SecurityContext = {
                user: { id: 'user123', roles: [] },
                objectName: 'tasks',
                operation: 'read'
            };

            await trimmer.applyRowLevelSecurity('tasks', query, context);

            expect(query.filters).toEqual({
                $lookup: {
                    from: 'projects',
                    localField: 'project_id',
                    foreignField: '_id',
                    filter: {
                        owner: 'user123'
                    }
                }
            });
        });

        it('should handle nested lookup conditions', async () => {
            const config: PermissionConfig = {
                name: 'tasks_rls',
                object: 'tasks',
                row_level_security: {
                    enabled: true,
                    default_rule: {
                        type: 'lookup',
                        object: 'projects',
                        via: 'project_id',
                        condition: {
                            type: 'complex',
                            expression: [
                                {
                                    field: 'status',
                                    operator: '=',
                                    value: 'active'
                                },
                                {
                                    field: 'owner',
                                    operator: '=',
                                    value: '$current_user.id'
                                },
                                'and'
                            ]
                        }
                    } as any
                }
            };

            (mockLoader.load as jest.Mock).mockResolvedValue(config);

            const query: any = {};
            const context: SecurityContext = {
                user: { id: 'user123', roles: [] },
                objectName: 'tasks',
                operation: 'read'
            };

            await trimmer.applyRowLevelSecurity('tasks', query, context);

            expect(query.filters).toHaveProperty('$lookup');
            expect(query.filters.$lookup.from).toBe('projects');
            expect(query.filters.$lookup.filter).toHaveProperty('$and');
        });
    });

    describe('Simple and complex conditions (existing functionality)', () => {
        it('should handle simple conditions', async () => {
            const config: PermissionConfig = {
                name: 'projects_rls',
                object: 'projects',
                row_level_security: {
                    enabled: true,
                    default_rule: {
                        type: 'simple',
                        field: 'owner',
                        operator: '=',
                        value: '$current_user.id'
                    }
                }
            };

            (mockLoader.load as jest.Mock).mockResolvedValue(config);

            const query: any = {};
            const context: SecurityContext = {
                user: { id: 'user123', roles: [] },
                objectName: 'projects',
                operation: 'read'
            };

            await trimmer.applyRowLevelSecurity('projects', query, context);

            expect(query.filters).toEqual({
                owner: 'user123'
            });
        });

        it('should handle complex conditions with AND', async () => {
            const config: PermissionConfig = {
                name: 'projects_rls',
                object: 'projects',
                row_level_security: {
                    enabled: true,
                    default_rule: {
                        type: 'complex',
                        expression: [
                            {
                                field: 'status',
                                operator: '=',
                                value: 'active'
                            },
                            {
                                field: 'owner',
                                operator: '=',
                                value: '$current_user.id'
                            },
                            'and'
                        ]
                    } as any
                }
            };

            (mockLoader.load as jest.Mock).mockResolvedValue(config);

            const query: any = {};
            const context: SecurityContext = {
                user: { id: 'user123', roles: [] },
                objectName: 'projects',
                operation: 'read'
            };

            await trimmer.applyRowLevelSecurity('projects', query, context);

            expect(query.filters).toEqual({
                $and: [
                    { status: 'active' },
                    { owner: 'user123' }
                ]
            });
        });
    });

    describe('No user context', () => {
        it('should restrict all access when no user is provided', async () => {
            const config: PermissionConfig = {
                name: 'projects_rls',
                object: 'projects',
                row_level_security: {
                    enabled: true,
                    default_rule: {
                        type: 'simple',
                        field: 'owner',
                        operator: '=',
                        value: '$current_user.id'
                    }
                }
            };

            (mockLoader.load as jest.Mock).mockResolvedValue(config);

            const query: any = {};
            const context: SecurityContext = {
                objectName: 'projects',
                operation: 'read'
            };

            await trimmer.applyRowLevelSecurity('projects', query, context);

            expect(query.filters).toEqual({
                _id: null
            });
        });
    });

    describe('Bypass permissions', () => {
        it('should bypass RLS for admin role', async () => {
            const config: PermissionConfig = {
                name: 'projects_rls',
                object: 'projects',
                row_level_security: {
                    enabled: true,
                    default_rule: {
                        type: 'simple',
                        field: 'owner',
                        operator: '=',
                        value: '$current_user.id'
                    },
                    exceptions: [
                        {
                            role: 'admin',
                            bypass: true
                        }
                    ]
                }
            };

            (mockLoader.load as jest.Mock).mockResolvedValue(config);

            const query: any = {};
            const context: SecurityContext = {
                user: { id: 'user123', roles: ['admin'] },
                objectName: 'projects',
                operation: 'read'
            };

            await trimmer.applyRowLevelSecurity('projects', query, context);

            // Query should not be modified
            expect(query.filters).toBeUndefined();
        });
    });
});
