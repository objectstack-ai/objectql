import { ObjectLoader } from '../src/loader';
import { MetadataRegistry } from '@objectql/types';
import { applyNamespace, removeNamespace, extractNamespace, hasNamespace } from '@objectql/core';
import * as path from 'path';

describe('Namespace Functionality', () => {
    describe('Namespace Utility Functions', () => {
        it('should apply namespace to object name', () => {
            expect(applyNamespace('note', 'audit')).toBe('audit__note');
            expect(applyNamespace('user', 'crm')).toBe('crm__user');
        });

        it('should not double-prefix namespace', () => {
            expect(applyNamespace('audit__note', 'audit')).toBe('audit__note');
        });

        it('should remove namespace from object name', () => {
            expect(removeNamespace('audit__note', 'audit')).toBe('note');
            expect(removeNamespace('crm__user', 'crm')).toBe('user');
        });

        it('should extract namespace from object name', () => {
            expect(extractNamespace('audit__note')).toBe('audit');
            expect(extractNamespace('crm__user')).toBe('crm');
            expect(extractNamespace('note')).toBeUndefined();
        });

        it('should detect if object has namespace', () => {
            expect(hasNamespace('audit__note')).toBe(true);
            expect(hasNamespace('note')).toBe(false);
        });
    });

    describe('Object Loader with Namespace', () => {
        it('should load objects with namespace prefix', () => {
            const registry = new MetadataRegistry();
            const loader = new ObjectLoader(registry);
            const fixturesDir = path.join(__dirname, 'fixtures', 'namespace-test');

            loader.load(fixturesDir, 'test-package', 'audit');

            const note = registry.get('object', 'audit__note');
            const user = registry.get('object', 'audit__user');

            expect(note).toBeDefined();
            expect(note.name).toBe('audit__note');
            expect(note.label).toBe('Note'); // Label should not be namespaced
            expect(note.namespace).toBe('audit');

            expect(user).toBeDefined();
            expect(user.name).toBe('audit__user');
            expect(user.label).toBe('User');
            expect(user.namespace).toBe('audit');
        });

        it('should apply namespace to reference_to fields', () => {
            const registry = new MetadataRegistry();
            const loader = new ObjectLoader(registry);
            const fixturesDir = path.join(__dirname, 'fixtures', 'namespace-test');

            loader.load(fixturesDir, 'test-package', 'audit');

            const note = registry.get('object', 'audit__note');
            expect(note.fields.author.reference_to).toBe('audit__user');
        });

        it('should load objects without namespace when not specified', () => {
            const registry = new MetadataRegistry();
            const loader = new ObjectLoader(registry);
            const fixturesDir = path.join(__dirname, 'fixtures', 'namespace-test');

            loader.load(fixturesDir);

            const note = registry.get('object', 'note');
            const user = registry.get('object', 'user');

            expect(note).toBeDefined();
            expect(note.name).toBe('note');
            expect(note.namespace).toBeUndefined();

            expect(user).toBeDefined();
            expect(user.name).toBe('user');
        });

        it('should use configured namespace from packageNamespaces', () => {
            const registry = new MetadataRegistry();
            const packageNamespaces = {
                'test-package': 'test_ns'
            };
            const loader = new ObjectLoader(registry, packageNamespaces);
            const fixturesDir = path.join(__dirname, 'fixtures', 'namespace-test');

            loader.load(fixturesDir, 'test-package');

            const note = registry.get('object', 'test_ns__note');
            expect(note).toBeDefined();
            expect(note.name).toBe('test_ns__note');
            expect(note.namespace).toBe('test_ns');
        });
    });
});
