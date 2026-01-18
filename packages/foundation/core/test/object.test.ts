/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { registerObjectHelper, getConfigsHelper } from '../src/object';
import { ObjectConfig, MetadataRegistry } from '@objectql/types';

describe('Object Helper Functions', () => {
    let metadata: MetadataRegistry;

    beforeEach(() => {
        metadata = new MetadataRegistry();
    });

    describe('registerObjectHelper', () => {
        it('should register object with normalized fields', () => {
            const object: ObjectConfig = {
                name: 'todo',
                fields: {
                    title: { type: 'text' },
                    completed: { type: 'boolean' }
                }
            };

            registerObjectHelper(metadata, object);

            const registered = metadata.get<ObjectConfig>('object', 'todo');
            expect(registered).toBeDefined();
            expect(registered?.name).toBe('todo');
        });

        it('should add name property to fields', () => {
            const object: ObjectConfig = {
                name: 'todo',
                fields: {
                    title: { type: 'text' },
                    status: { type: 'select', options: ['active', 'done'] }
                }
            };

            registerObjectHelper(metadata, object);

            const registered = metadata.get<ObjectConfig>('object', 'todo');
            expect(registered?.fields?.title.name).toBe('title');
            expect(registered?.fields?.status.name).toBe('status');
        });

        it('should not override existing name property', () => {
            const object: ObjectConfig = {
                name: 'todo',
                fields: {
                    title: { type: 'text', name: 'customTitle' }
                }
            };

            registerObjectHelper(metadata, object);

            const registered = metadata.get<ObjectConfig>('object', 'todo');
            expect(registered?.fields?.title.name).toBe('customTitle');
        });

        it('should handle object without fields', () => {
            const object: ObjectConfig = {
                name: 'empty'
            };

            registerObjectHelper(metadata, object);

            const registered = metadata.get<ObjectConfig>('object', 'empty');
            expect(registered).toBeDefined();
            expect(registered?.name).toBe('empty');
        });

        it('should register object with complex field configurations', () => {
            const object: ObjectConfig = {
                name: 'project',
                fields: {
                    name: { 
                        type: 'text', 
                        required: true, 
                        unique: true,
                        max_length: 100 
                    },
                    owner: { 
                        type: 'lookup', 
                        reference_to: 'users' 
                    },
                    tags: { 
                        type: 'select', 
                        multiple: true, 
                        options: ['urgent', 'important'] 
                    }
                }
            };

            registerObjectHelper(metadata, object);

            const registered = metadata.get<ObjectConfig>('object', 'project');
            expect(registered?.fields?.name.required).toBe(true);
            expect(registered?.fields?.name.unique).toBe(true);
            expect(registered?.fields?.owner.reference_to).toBe('users');
            expect(registered?.fields?.tags.multiple).toBe(true);
        });
    });

    describe('getConfigsHelper', () => {
        it('should return empty object when no objects registered', () => {
            const configs = getConfigsHelper(metadata);
            expect(configs).toEqual({});
        });

        it('should return all registered objects', () => {
            const todo: ObjectConfig = {
                name: 'todo',
                fields: { title: { type: 'text' } }
            };
            const project: ObjectConfig = {
                name: 'project',
                fields: { name: { type: 'text' } }
            };

            registerObjectHelper(metadata, todo);
            registerObjectHelper(metadata, project);

            const configs = getConfigsHelper(metadata);
            expect(Object.keys(configs)).toHaveLength(2);
            expect(configs.todo).toBeDefined();
            expect(configs.project).toBeDefined();
            expect(configs.todo.name).toBe('todo');
            expect(configs.project.name).toBe('project');
        });

        it('should return configs as key-value pairs by object name', () => {
            const objects: ObjectConfig[] = [
                { name: 'users', fields: { name: { type: 'text' } } },
                { name: 'tasks', fields: { title: { type: 'text' } } },
                { name: 'projects', fields: { name: { type: 'text' } } }
            ];

            objects.forEach(obj => registerObjectHelper(metadata, obj));

            const configs = getConfigsHelper(metadata);
            expect(configs.users.name).toBe('users');
            expect(configs.tasks.name).toBe('tasks');
            expect(configs.projects.name).toBe('projects');
        });

        it('should reflect latest state after registration', () => {
            let configs = getConfigsHelper(metadata);
            expect(Object.keys(configs)).toHaveLength(0);

            registerObjectHelper(metadata, {
                name: 'todo',
                fields: { title: { type: 'text' } }
            });

            configs = getConfigsHelper(metadata);
            expect(Object.keys(configs)).toHaveLength(1);

            registerObjectHelper(metadata, {
                name: 'project',
                fields: { name: { type: 'text' } }
            });

            configs = getConfigsHelper(metadata);
            expect(Object.keys(configs)).toHaveLength(2);
        });

        it('should return configs after unregistration', () => {
            registerObjectHelper(metadata, {
                name: 'todo',
                fields: { title: { type: 'text' } }
            });
            registerObjectHelper(metadata, {
                name: 'project',
                fields: { name: { type: 'text' } }
            });

            metadata.unregister('object', 'todo');

            const configs = getConfigsHelper(metadata);
            expect(Object.keys(configs)).toHaveLength(1);
            expect(configs.todo).toBeUndefined();
            expect(configs.project).toBeDefined();
        });
    });
});
