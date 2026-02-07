# @objectql/plugin-multitenancy

Multi-tenancy plugin for ObjectQL - Automatic tenant isolation with query filtering and schema separation.

## Features

- **Automatic Query Filtering**: Auto-inject `tenant_id` filters on all queries
- **Auto-set Tenant ID**: Automatically set `tenant_id` on new records
- **Cross-tenant Protection**: Prevent unauthorized access to other tenants' data
- **Flexible Configuration**: Support multiple tenant isolation strategies
- **Audit Logging**: Track all tenant-related operations
- **Schema Isolation**: Optional table-prefix or separate-schema modes
- **Security by Default**: Strict mode enabled by default

## Installation

```bash
pnpm add @objectql/plugin-multitenancy
```

## Quick Start

```typescript
import { MultiTenancyPlugin } from '@objectql/plugin-multitenancy';
import { ObjectStackKernel } from '@objectstack/core';

const kernel = new ObjectStackKernel([
  new MultiTenancyPlugin({
    tenantField: 'tenant_id',
    strictMode: true,
    exemptObjects: ['users', 'tenants'],
  }),
]);

await kernel.start();
```

## Configuration

```typescript
interface MultiTenancyPluginConfig {
  /** Enable/disable the plugin. Default: true */
  enabled?: boolean;
  
  /** Field name for tenant identification. Default: 'tenant_id' */
  tenantField?: string;
  
  /** Strict mode prevents cross-tenant queries. Default: true */
  strictMode?: boolean;
  
  /** Tenant resolver function to get current tenant from context */
  tenantResolver?: (context: any) => string | Promise<string>;
  
  /** Schema isolation mode: 'none', 'table-prefix', 'separate-schema'. Default: 'none' */
  schemaIsolation?: 'none' | 'table-prefix' | 'separate-schema';
  
  /** Objects exempt from tenant isolation. Default: [] */
  exemptObjects?: string[];
  
  /** Auto-create tenant_id field on objects. Default: true */
  autoAddTenantField?: boolean;
  
  /** Enable tenant context validation. Default: true */
  validateTenantContext?: boolean;
  
  /** Throw error when tenant context is missing. Default: true */
  throwOnMissingTenant?: boolean;
  
  /** Enable audit logging for cross-tenant access attempts. Default: true */
  enableAudit?: boolean;
}
```

## How It Works

### 1. Query Filtering (beforeFind)

The plugin automatically injects tenant filters into all queries:

```typescript
// User query
const accounts = await objectql.find('accounts', { status: 'active' });

// Transformed query (tenant_id auto-injected)
// SELECT * FROM accounts WHERE status = 'active' AND tenant_id = 'tenant-123'
```

### 2. Auto-set Tenant ID (beforeCreate)

New records automatically get the current tenant's ID:

```typescript
// User code
await objectql.create('accounts', { name: 'Acme Corp' });

// Stored data
// { name: 'Acme Corp', tenant_id: 'tenant-123' }
```

### 3. Cross-tenant Protection (beforeUpdate/beforeDelete)

Updates and deletes are verified to match the current tenant:

```typescript
// Attempting to update another tenant's record throws error
await objectql.update('accounts', recordId, { name: 'New Name' });
// TenantIsolationError: Cross-tenant update denied
```

## Tenant Context Resolution

The plugin resolves the tenant ID from the request context in this order:

1. `context.tenantId` (explicit)
2. `context.user.tenantId` (from user object)
3. `context.user.tenant_id` (alternative naming)

### Custom Tenant Resolver

```typescript
new MultiTenancyPlugin({
  tenantResolver: async (context) => {
    // Custom logic to extract tenant ID
    const token = context.headers.authorization;
    const decoded = await verifyToken(token);
    return decoded.organizationId;
  },
});
```

## Exempt Objects

Some objects may need to be accessible across tenants (e.g., users, tenants):

```typescript
new MultiTenancyPlugin({
  exemptObjects: ['users', 'tenants', 'global_settings'],
});
```

## Schema Isolation Modes

### None (Default)

All tenants share the same table with `tenant_id` column:

```sql
CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  INDEX idx_tenant (tenant_id)
);
```

### Table Prefix

Each tenant gets separate tables with a prefix:

```sql
CREATE TABLE accounts_tenant_1 (...);
CREATE TABLE accounts_tenant_2 (...);
```

### Separate Schema

Each tenant gets a separate database schema:

```sql
CREATE SCHEMA tenant_1;
CREATE TABLE tenant_1.accounts (...);

CREATE SCHEMA tenant_2;
CREATE TABLE tenant_2.accounts (...);
```

## Audit Logging

Access the audit logs to track tenant operations:

```typescript
const plugin = new MultiTenancyPlugin({ enableAudit: true });

// After operations
const logs = plugin.getAuditLogs(100); // Get last 100 entries

logs.forEach(log => {
  console.log(`${log.operation} on ${log.objectName} by tenant ${log.tenantId}`);
});
```

## Integration with Plugin-Security

Multi-tenancy works alongside the security plugin for tenant-scoped RBAC:

```typescript
const kernel = new ObjectStackKernel([
  new MultiTenancyPlugin({
    tenantField: 'tenant_id',
  }),
  new SecurityPlugin({
    enableRowLevelSecurity: true,
  }),
]);
```

## Error Handling

```typescript
import { TenantIsolationError } from '@objectql/plugin-multitenancy';

try {
  await objectql.update('accounts', recordId, data);
} catch (error) {
  if (error instanceof TenantIsolationError) {
    console.error('Tenant isolation violation:', error.details);
    // {
    //   tenantId: 'tenant-123',
    //   objectName: 'accounts',
    //   operation: 'update',
    //   reason: 'CROSS_TENANT_UPDATE'
    // }
  }
}
```

## Best Practices

1. **Always set tenant context**: Ensure every request has tenant information
2. **Use exempt objects sparingly**: Only exempt truly global objects
3. **Enable strict mode in production**: Catch cross-tenant bugs early
4. **Monitor audit logs**: Track potential security issues
5. **Test tenant isolation**: Write tests to verify data separation

## Architecture

The plugin operates at the Hook layer and does NOT affect SQL generation:

```
┌─────────────────────────────┐
│  plugin-multitenancy        │  ← beforeFind/Create/Update/Delete hooks
│  (Tenant Filter Injection)  │
├─────────────────────────────┤
│  plugin-security            │  ← RBAC enforcement
├─────────────────────────────┤
│  QueryService → QueryAST    │  ← Core: abstract query building
├─────────────────────────────┤
│  Driver → Knex → SQL        │  ← Driver: SQL generation (UNTOUCHED)
└─────────────────────────────┘
```

## License

MIT

## Contributing

See the [ObjectQL Contributing Guide](../../../CONTRIBUTING.md).
