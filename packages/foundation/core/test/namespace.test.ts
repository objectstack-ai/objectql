import { applyNamespace, removeNamespace, extractNamespace, hasNamespace } from '../src/util';

describe('Namespace Utility Functions', () => {
    describe('applyNamespace', () => {
        it('should apply namespace to object name', () => {
            expect(applyNamespace('note', 'audit')).toBe('audit__note');
            expect(applyNamespace('user', 'crm')).toBe('crm__user');
            expect(applyNamespace('project', 'pm')).toBe('pm__project');
        });

        it('should not double-prefix namespace', () => {
            expect(applyNamespace('audit__note', 'audit')).toBe('audit__note');
            expect(applyNamespace('crm__user', 'crm')).toBe('crm__user');
        });

        it('should return original name when namespace is empty', () => {
            expect(applyNamespace('note', '')).toBe('note');
        });

        it('should handle names with underscores', () => {
            expect(applyNamespace('user_profile', 'auth')).toBe('auth__user_profile');
        });
    });

    describe('removeNamespace', () => {
        it('should remove namespace from object name', () => {
            expect(removeNamespace('audit__note', 'audit')).toBe('note');
            expect(removeNamespace('crm__user', 'crm')).toBe('user');
        });

        it('should return original name if namespace does not match', () => {
            expect(removeNamespace('audit__note', 'crm')).toBe('audit__note');
        });

        it('should return original name if no namespace present', () => {
            expect(removeNamespace('note', 'audit')).toBe('note');
        });

        it('should return original name when namespace is empty', () => {
            expect(removeNamespace('audit__note', '')).toBe('audit__note');
        });
    });

    describe('extractNamespace', () => {
        it('should extract namespace from namespaced object name', () => {
            expect(extractNamespace('audit__note')).toBe('audit');
            expect(extractNamespace('crm__user')).toBe('crm');
            expect(extractNamespace('project_mgmt__task')).toBe('project_mgmt');
        });

        it('should return undefined for non-namespaced names', () => {
            expect(extractNamespace('note')).toBeUndefined();
            expect(extractNamespace('user')).toBeUndefined();
        });

        it('should handle multiple underscores in namespace', () => {
            expect(extractNamespace('audit_log__note')).toBe('audit_log');
        });

        it('should only extract first namespace segment', () => {
            expect(extractNamespace('ns1__ns2__object')).toBe('ns1');
        });
    });

    describe('hasNamespace', () => {
        it('should detect namespaced object names', () => {
            expect(hasNamespace('audit__note')).toBe(true);
            expect(hasNamespace('crm__user')).toBe(true);
            expect(hasNamespace('a__b')).toBe(true);
        });

        it('should return false for non-namespaced names', () => {
            expect(hasNamespace('note')).toBe(false);
            expect(hasNamespace('user')).toBe(false);
            expect(hasNamespace('user_profile')).toBe(false);
        });
    });
});
