/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { MetadataRegistry, Metadata } from '../src/registry';

describe('MetadataRegistry', () => {
    let registry: MetadataRegistry;

    beforeEach(() => {
        registry = new MetadataRegistry();
    });

    describe('register', () => {
        it('should register a metadata entry', () => {
            const metadata: Metadata = {
                type: 'object',
                id: 'user',
                content: { name: 'user', fields: {} }
            };

            registry.register('object', metadata);

            const retrieved = registry.get('object', 'user');
            expect(retrieved).toEqual({ name: 'user', fields: {} });
        });

        it('should register multiple entries of same type', () => {
            registry.register('object', {
                type: 'object',
                id: 'user',
                content: { name: 'user' }
            });

            registry.register('object', {
                type: 'object',
                id: 'task',
                content: { name: 'task' }
            });

            expect(registry.get('object', 'user')).toEqual({ name: 'user' });
            expect(registry.get('object', 'task')).toEqual({ name: 'task' });
        });

        it('should register entries of different types', () => {
            registry.register('object', {
                type: 'object',
                id: 'user',
                content: { name: 'user' }
            });

            registry.register('action', {
                type: 'action',
                id: 'sendEmail',
                content: { name: 'sendEmail' }
            });

            expect(registry.get('object', 'user')).toBeDefined();
            expect(registry.get('action', 'sendEmail')).toBeDefined();
        });

        it('should overwrite existing entry with same type and id', () => {
            registry.register('object', {
                type: 'object',
                id: 'user',
                content: { name: 'user', version: 1 }
            });

            registry.register('object', {
                type: 'object',
                id: 'user',
                content: { name: 'user', version: 2 }
            });

            expect(registry.get('object', 'user')).toEqual({ name: 'user', version: 2 });
        });

        it('should store metadata with package info', () => {
            registry.register('object', {
                type: 'object',
                id: 'user',
                package: 'my-package',
                content: { name: 'user' }
            });

            const entry = registry.getEntry('object', 'user');
            expect(entry?.package).toBe('my-package');
        });

        it('should store metadata with path info', () => {
            registry.register('object', {
                type: 'object',
                id: 'user',
                path: '/path/to/user.yml',
                content: { name: 'user' }
            });

            const entry = registry.getEntry('object', 'user');
            expect(entry?.path).toBe('/path/to/user.yml');
        });
    });

    describe('unregister', () => {
        beforeEach(() => {
            registry.register('object', {
                type: 'object',
                id: 'user',
                content: { name: 'user' }
            });
        });

        it('should unregister an entry', () => {
            registry.unregister('object', 'user');

            expect(registry.get('object', 'user')).toBeUndefined();
        });

        it('should not affect other entries', () => {
            registry.register('object', {
                type: 'object',
                id: 'task',
                content: { name: 'task' }
            });

            registry.unregister('object', 'user');

            expect(registry.get('object', 'task')).toBeDefined();
        });

        it('should not throw error when unregistering non-existent entry', () => {
            expect(() => {
                registry.unregister('object', 'nonexistent');
            }).not.toThrow();
        });

        it('should not throw error when unregistering from non-existent type', () => {
            expect(() => {
                registry.unregister('nonexistent-type', 'user');
            }).not.toThrow();
        });
    });

    describe('unregisterPackage', () => {
        beforeEach(() => {
            registry.register('object', {
                type: 'object',
                id: 'user',
                package: 'package-a',
                content: { name: 'user' }
            });

            registry.register('object', {
                type: 'object',
                id: 'task',
                package: 'package-a',
                content: { name: 'task' }
            });

            registry.register('object', {
                type: 'object',
                id: 'project',
                package: 'package-b',
                content: { name: 'project' }
            });

            registry.register('action', {
                type: 'action',
                id: 'sendEmail',
                package: 'package-a',
                content: { name: 'sendEmail' }
            });
        });

        it('should unregister all entries from a package', () => {
            registry.unregisterPackage('package-a');

            expect(registry.get('object', 'user')).toBeUndefined();
            expect(registry.get('object', 'task')).toBeUndefined();
            expect(registry.get('action', 'sendEmail')).toBeUndefined();
        });

        it('should not affect entries from other packages', () => {
            registry.unregisterPackage('package-a');

            expect(registry.get('object', 'project')).toBeDefined();
        });

        it('should work across multiple types', () => {
            registry.unregisterPackage('package-a');

            const objects = registry.list('object');
            const actions = registry.list('action');

            expect(objects).toHaveLength(1); // only project from package-b
            expect(actions).toHaveLength(0); // sendEmail from package-a removed
        });

        it('should not throw error when package does not exist', () => {
            expect(() => {
                registry.unregisterPackage('nonexistent-package');
            }).not.toThrow();
        });

        it('should handle entries without package property', () => {
            registry.register('object', {
                type: 'object',
                id: 'orphan',
                content: { name: 'orphan' }
            });

            registry.unregisterPackage('package-a');

            expect(registry.get('object', 'orphan')).toBeDefined();
        });
    });

    describe('get', () => {
        beforeEach(() => {
            registry.register('object', {
                type: 'object',
                id: 'user',
                content: { name: 'user', fields: { email: { type: 'text' } } }
            });
        });

        it('should get content by type and id', () => {
            const content = registry.get('object', 'user');

            expect(content).toEqual({ name: 'user', fields: { email: { type: 'text' } } });
        });

        it('should return undefined for non-existent entry', () => {
            const content = registry.get('object', 'nonexistent');

            expect(content).toBeUndefined();
        });

        it('should return undefined for non-existent type', () => {
            const content = registry.get('nonexistent-type', 'user');

            expect(content).toBeUndefined();
        });

        it('should support generic type parameter', () => {
            interface User {
                name: string;
                fields: Record<string, any>;
            }

            const content = registry.get<User>('object', 'user');

            expect(content?.name).toBe('user');
            expect(content?.fields).toBeDefined();
        });
    });

    describe('list', () => {
        beforeEach(() => {
            registry.register('object', {
                type: 'object',
                id: 'user',
                content: { name: 'user' }
            });

            registry.register('object', {
                type: 'object',
                id: 'task',
                content: { name: 'task' }
            });

            registry.register('action', {
                type: 'action',
                id: 'sendEmail',
                content: { name: 'sendEmail' }
            });
        });

        it('should list all entries of a type', () => {
            const objects = registry.list('object');

            expect(objects).toHaveLength(2);
            expect(objects.find(o => o.name === 'user')).toBeDefined();
            expect(objects.find(o => o.name === 'task')).toBeDefined();
        });

        it('should return empty array for non-existent type', () => {
            const items = registry.list('nonexistent-type');

            expect(items).toEqual([]);
        });

        it('should return only content, not metadata wrapper', () => {
            const objects = registry.list('object');

            expect(objects[0]).not.toHaveProperty('type');
            expect(objects[0]).not.toHaveProperty('id');
            expect(objects[0]).toHaveProperty('name');
        });

        it('should support generic type parameter', () => {
            interface ObjectConfig {
                name: string;
            }

            const objects = registry.list<ObjectConfig>('object');

            expect(objects[0].name).toBeDefined();
        });

        it('should return empty array after all entries unregistered', () => {
            registry.unregister('object', 'user');
            registry.unregister('object', 'task');

            const objects = registry.list('object');

            expect(objects).toEqual([]);
        });
    });

    describe('getEntry', () => {
        beforeEach(() => {
            registry.register('object', {
                type: 'object',
                id: 'user',
                package: 'my-package',
                path: '/path/to/user.yml',
                content: { name: 'user' }
            });
        });

        it('should get full metadata entry', () => {
            const entry = registry.getEntry('object', 'user');

            expect(entry).toBeDefined();
            expect(entry?.type).toBe('object');
            expect(entry?.id).toBe('user');
            expect(entry?.package).toBe('my-package');
            expect(entry?.path).toBe('/path/to/user.yml');
            expect(entry?.content).toEqual({ name: 'user' });
        });

        it('should return undefined for non-existent entry', () => {
            const entry = registry.getEntry('object', 'nonexistent');

            expect(entry).toBeUndefined();
        });

        it('should return undefined for non-existent type', () => {
            const entry = registry.getEntry('nonexistent-type', 'user');

            expect(entry).toBeUndefined();
        });

        it('should include all metadata properties', () => {
            const entry = registry.getEntry('object', 'user');

            expect(entry).toHaveProperty('type');
            expect(entry).toHaveProperty('id');
            expect(entry).toHaveProperty('content');
            expect(entry).toHaveProperty('package');
            expect(entry).toHaveProperty('path');
        });
    });

    describe('Complex Scenarios', () => {
        it('should handle multiple types with same id', () => {
            registry.register('object', {
                type: 'object',
                id: 'user',
                content: { type: 'object-user' }
            });

            registry.register('action', {
                type: 'action',
                id: 'user',
                content: { type: 'action-user' }
            });

            expect(registry.get('object', 'user')).toEqual({ type: 'object-user' });
            expect(registry.get('action', 'user')).toEqual({ type: 'action-user' });
        });

        it('should handle register, unregister, re-register cycle', () => {
            registry.register('object', {
                type: 'object',
                id: 'user',
                content: { version: 1 }
            });

            registry.unregister('object', 'user');

            registry.register('object', {
                type: 'object',
                id: 'user',
                content: { version: 2 }
            });

            expect(registry.get('object', 'user')).toEqual({ version: 2 });
        });

        it('should handle large number of entries', () => {
            for (let i = 0; i < 1000; i++) {
                registry.register('object', {
                    type: 'object',
                    id: `obj-${i}`,
                    content: { index: i }
                });
            }

            const objects = registry.list('object');
            expect(objects).toHaveLength(1000);
            expect(registry.get('object', 'obj-500')).toEqual({ index: 500 });
        });

        it('should handle package unregistration with many entries', () => {
            for (let i = 0; i < 100; i++) {
                registry.register('object', {
                    type: 'object',
                    id: `obj-${i}`,
                    package: i % 2 === 0 ? 'even-package' : 'odd-package',
                    content: { index: i }
                });
            }

            registry.unregisterPackage('even-package');

            const objects = registry.list('object');
            expect(objects).toHaveLength(50);
            expect(objects.every(o => o.index % 2 === 1)).toBe(true);
        });
    });
});
