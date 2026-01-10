import { ObjectQLContext } from './types';
import { PolicyConfig, RoleConfig, PolicyStatement } from './metadata';
import { UnifiedQuery, FilterCriterion } from './query';

export class SecurityEngine {
    private policies: Map<string, PolicyConfig> = new Map();
    private roles: Map<string, RoleConfig> = new Map();

    constructor() {}

    registerPolicy(policy: PolicyConfig) {
        this.policies.set(policy.name, policy);
    }

    registerRole(role: RoleConfig) {
        this.roles.set(role.name, role);
    }

    /**
     * Resolves all permissions for a specific user role set.
     * Merges policies from all roles (Union).
     */
    getPermissions(userRoles: string[], objectName: string): ResolvedPermission {
        if (!userRoles || userRoles.length === 0) {
            return { allowed: false };
        }

        const effectiveStatements: PolicyStatement[] = [];
        const processedRoles = new Set<string>();

        // Recursive function to gather statements from roles and their parents
        const collectRolePermissions = (roleNames: string[]) => {
            for (const roleName of roleNames) {
                if (processedRoles.has(roleName)) continue;
                processedRoles.add(roleName);

                const role = this.roles.get(roleName);
                if (!role) continue;

                // 1. Inherited Roles
                if (role.inherits) {
                    collectRolePermissions(role.inherits);
                }

                // 2. Managed Policies
                if (role.policies) {
                    for (const policyName of role.policies) {
                        const policy = this.policies.get(policyName);
                        if (policy && policy.permissions) {
                            if (policy.permissions[objectName]) {
                                effectiveStatements.push(policy.permissions[objectName]);
                            }
                            if (policy.permissions['*']) {
                                effectiveStatements.push(policy.permissions['*']);
                            }
                        }
                    }
                }

                // 3. Inline Policies
                if (role.permissions) {
                    if (role.permissions[objectName]) {
                        effectiveStatements.push(role.permissions[objectName]);
                    }
                    if (role.permissions['*']) {
                        effectiveStatements.push(role.permissions['*']);
                    }
                }
            }
        };

        collectRolePermissions(userRoles);

        // 2. Resolve (Union)
        // If no statements found -> Deny
        if (effectiveStatements.length === 0) {
            return { allowed: false };
        }

        const resolved: ResolvedPermission = {
            allowed: false,
            actions: new Set(),
            filters: [],
            fields: new Set(),
            readonly_fields: new Set()
        };

        let hasRestrictedFields = false;

        for (const stmt of effectiveStatements) {
            // Merge Actions
            for (const action of stmt.actions) {
                resolved.actions!.add(action);
            }

            // Merge Filters (OR logic)
            if (stmt.filters && stmt.filters.length > 0) {
                 resolved.filters!.push(stmt.filters);
            }
            
            // Merge FLS
            if (stmt.fields) {
                hasRestrictedFields = true;
                for (const f of stmt.fields) resolved.fields!.add(f);
            } else {
                // If one policy allows ALL fields (undefined/empty), does it override others?
                // Union strategy usually means: (Policy A restricts to [x]) OR (Policy B allows All) = Allows All.
                // We'll mark a flag. If we encounter a statement with NO field restriction, user gets all fields.
                // However, implementing "All" in a Set is tricky. 
                // Let's assume if 'stmt.fields' is missing, it means FULL ACCESS to all fields for THAT action.
            }
            
            if (stmt.readonly_fields) {
                for (const f of stmt.readonly_fields) resolved.readonly_fields!.add(f);
            }
        }
        
        // If any statement granted permission but didn't list specific fields, it implies ALL fields are allowed.
        // In that case, we should clear restrictions (or handle it in repository).
        // For simplicity: If ANY statement has `fields` undefined, we consider all fields allowed.
        const allowAllFields = effectiveStatements.some(s => !s.fields || s.fields.includes('*'));
        if (allowAllFields) {
            resolved.fields = undefined; // Undefined means ALL
        }
        
        if (resolved.actions!.size > 0) {
            resolved.allowed = true;
        }

        return resolved;
    }

    /**
     * Resolves variables in filters like $user.id
     */
    private resolveFilters(filters: any[], user: any): any[] {
        if (!filters || !Array.isArray(filters)) return filters;
        
        return filters.map(item => {
            if (Array.isArray(item)) {
                return this.resolveFilters(item, user);
            }
            
            if (typeof item === 'string' && item.startsWith('$user.')) {
                const prop = item.substring(6); // remove '$user.'
                return user ? user[prop] : null;
            }
            
            return item;
        });
    }

    /**
     * Checks if the operation is allowed and returns the RLS filters to apply.
     */
    check(ctx: ObjectQLContext, objectName: string, action: 'read' | 'create' | 'update' | 'delete'): { allowed: boolean, filters?: any[], fields?: string[] } {
        // System bypass
        if (ctx.isSystem) return { allowed: true };
        
        // No roles -> Deny
        if (!ctx.roles || ctx.roles.length === 0) return { allowed: false };

        const perm = this.getPermissions(ctx.roles, objectName);

        if (!perm.allowed) return { allowed: false };

        const hasWildcard = perm.actions!.has('*');
        const hasAction = perm.actions!.has(action);

        if (!hasWildcard && !hasAction) return { allowed: false };

        // Construct final RLS filter
        let finalFilter = undefined;
        if (perm.filters && perm.filters.length > 0) {
            // Variable Substitution
            // Context only has userId, but variable substitution might need more info?
            // Usually we only subst {userId} or {spaceId}
            const contextData = {
                id: ctx.userId,
                spaceId: ctx.spaceId
            };
            const resolved = this.resolveFilters(perm.filters, contextData);

            if (resolved.length === 1) {
                finalFilter = resolved[0];
            } else {
                finalFilter = ['or', ...resolved];
            }
        }
        
        // Calculate allowed fields
        // If fields is undefined, it means ALL. 
        let allowedFields: string[] | undefined = perm.fields ? Array.from(perm.fields) : undefined;
        
        return { allowed: true, filters: finalFilter, fields: allowedFields };
    }
}

interface ResolvedPermission {
    allowed: boolean;
    actions?: Set<string>;
    filters?: any[][]; // Array of filter groups (which are arrays)
    fields?: Set<string>;
    readonly_fields?: Set<string>;
}
