import { SecurityEngine } from '../src/security';
import { PolicyConfig, RoleConfig } from '../src/metadata';
import { ObjectQLContext } from '../src/types';

describe('SecurityEngine', () => {
    let security: SecurityEngine;

    beforeEach(() => {
        security = new SecurityEngine();
    });

    it('should deny access if no roles provided', () => {
        const ctx: any = { roles: [], object: {} as any, transaction: {} as any, sudo: () => ctx };
        const result = security.check(ctx, 'project', 'read');
        expect(result.allowed).toBe(false);
    });

    it('should deny access if role has no permission', () => {
        const role: RoleConfig = { name: 'guest', permissions: {} };
        security.registerRole(role);

        const ctx: any = { roles: ['guest'], object: {} as any, transaction: {} as any, sudo: () => ctx };
        const result = security.check(ctx, 'project', 'read');
        expect(result.allowed).toBe(false);
    });

    it('should allow access via inline policy', () => {
        const role: RoleConfig = {
            name: 'admin',
            permissions: {
                project: { actions: ['read'] }
            }
        };
        security.registerRole(role);

        const ctx: any = { roles: ['admin'], object: {} as any, transaction: {} as any, sudo: () => ctx };
        const result = security.check(ctx, 'project', 'read');
        expect(result.allowed).toBe(true);
    });

    it('should allow access via managed policy', () => {
        const policy: PolicyConfig = {
            name: 'read_access',
            permissions: {
                project: { actions: ['read'] }
            }
        };
        const role: RoleConfig = {
            name: 'viewer',
            policies: ['read_access']
        };
        security.registerPolicy(policy);
        security.registerRole(role);

        const ctx: any = { roles: ['viewer'], object: {} as any, transaction: {} as any, sudo: () => ctx };
        const result = security.check(ctx, 'project', 'read');
        expect(result.allowed).toBe(true);
    });

    it('should return RLS filters', () => {
        const policy: PolicyConfig = {
            name: 'owner_only',
            permissions: {
                project: {
                    actions: ['read'],
                    filters: [['owner', '=', '$user.id']]
                }
            }
        };
        const role: RoleConfig = {
            name: 'user',
            policies: ['owner_only']
        };
        security.registerPolicy(policy);
        security.registerRole(role);

        const ctx: any = { roles: ['user'], object: {} as any, transaction: {} as any, sudo: () => ctx };
        const result = security.check(ctx, 'project', 'read');
        
        expect(result.allowed).toBe(true);
        expect(result.filters).toEqual([['owner', '=', '$user.id']]);
    });

    it('should merge RLS filters from multiple policies with OR', () => {
        // Policy 1: Own projects
        const p1: PolicyConfig = {
            name: 'own_projects',
            permissions: {
                project: { actions: ['read'], filters: [['owner', '=', 'me']] }
            }
        };
        // Policy 2: Public projects
        const p2: PolicyConfig = {
            name: 'public_projects',
            permissions: {
                project: { actions: ['read'], filters: [['public', '=', true]] }
            }
        };
        
        const role: RoleConfig = {
            name: 'hybrid',
            policies: ['own_projects', 'public_projects']
        };

        security.registerPolicy(p1);
        security.registerPolicy(p2);
        security.registerRole(role);

        const ctx: any = { roles: ['hybrid'], object: {} as any, transaction: {} as any, sudo: () => ctx };
        const result = security.check(ctx, 'project', 'read');

        
        expect(result.allowed).toBe(true);
        // Expecting ['or', filter1, filter2]
        // Note: The order depends on iteration order, which is insertion order in Maps generally.
        expect(result.filters).toHaveLength(3);
        expect(result.filters![0]).toBe('or');
    });

    it('should support role inheritance', () => {
        const mgrPolicy: PolicyConfig = {
            name: 'mgr_policy',
            permissions: {
                project: { actions: ['delete'] }
            }
        };
        const empRole: RoleConfig = {
            name: 'employee',
            permissions: {
                project: { actions: ['read'] }
            }
        };
        const mgrRole: RoleConfig = {
            name: 'manager',
            inherits: ['employee'],
            policies: ['mgr_policy']
        };
        
        security.registerPolicy(mgrPolicy);
        security.registerRole(empRole);
        security.registerRole(mgrRole);

        const ctx: any = { roles: ['manager'], object: {} as any };
        
        // Should have employee permission
        const readCheck = security.check(ctx, 'project', 'read');
        expect(readCheck.allowed).toBe(true);

        // Should have manager permission
        const deleteCheck = security.check(ctx, 'project', 'delete');
        expect(deleteCheck.allowed).toBe(true);
    });

    it('should support field level security whitelist', () => {
        const role: RoleConfig = {
            name: 'limited_user',
            permissions: {
                project: { 
                    actions: ['read'],
                    fields: ['name', 'status'] // strict whitelist
                }
            }
        };
        security.registerRole(role);
        
        const ctx: any = { roles: ['limited_user'], object: {} as any };
        const result = security.check(ctx, 'project', 'read');
        
        expect(result.allowed).toBe(true);
        expect(result.fields).toEqual(expect.arrayContaining(['name', 'status']));
        expect(result.fields).not.toContain('budget');
    });

    it('should combine fields from multiple roles (union)', () => {
        // Role A: sees Name
        const roleA: RoleConfig = {
            name: 'role_a',
            permissions: { project: { actions: ['read'], fields: ['name'] } }
        };
        // Role B: sees Budget
        const roleB: RoleConfig = {
            name: 'role_b',
            permissions: { project: { actions: ['read'], fields: ['budget'] } }
        };
        
        security.registerRole(roleA);
        security.registerRole(roleB);
        
        const ctx: any = { roles: ['role_a', 'role_b'], object: {} as any };
        const result = security.check(ctx, 'project', 'read');
        
        expect(result.fields).toContain('name');
        expect(result.fields).toContain('budget');
    });
});
