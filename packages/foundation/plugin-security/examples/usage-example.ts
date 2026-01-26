/**
 * ObjectQL Security Plugin - Usage Example
 * 
 * This example demonstrates how to use the security plugin with ObjectQL
 */

import { ObjectQLSecurityPlugin, PermissionConfig } from '../src';

// Example 1: Define permission configuration for a "Project" object
const projectPermissions: PermissionConfig = {
  name: 'project_permissions',
  object: 'project',
  description: 'Security rules for project management',
  
  // Define roles used in this configuration
  roles: ['admin', 'manager', 'developer', 'viewer'],
  
  // Object-level permissions - who can perform CRUD operations
  object_permissions: {
    create: ['admin', 'manager'],
    read: ['admin', 'manager', 'developer', 'viewer'],
    update: ['admin', 'manager', 'developer'],
    delete: ['admin'],
    view_all: ['admin'],
    modify_all: ['admin']
  }
};

// Example 2: Initialize the security plugin
const securityPlugin = new ObjectQLSecurityPlugin({
  enabled: true,
  storageType: 'memory',
  permissions: [projectPermissions],
  exemptObjects: ['system_config'],
  precompileRules: true,
  enableCache: true,
  cacheTTL: 60000
});

export { projectPermissions, securityPlugin };
