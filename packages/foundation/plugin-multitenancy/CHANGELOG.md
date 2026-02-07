# @objectql/plugin-multitenancy

## 4.2.0 (2026-02-08)

### Features

- **Initial Release**: Multi-tenancy plugin for automatic tenant isolation
- **Query Filtering**: Auto-inject `tenant_id` filters on all queries via `beforeFind` hook
- **Auto-set Tenant ID**: Automatically set `tenant_id` on new records via `beforeCreate` hook
- **Cross-tenant Protection**: Verify `tenant_id` on updates and deletes via `beforeUpdate` and `beforeDelete` hooks
- **Strict Mode**: Prevent cross-tenant data access with configurable error handling
- **Custom Tenant Resolver**: Support custom functions to extract tenant ID from context
- **Schema Isolation**: Support for shared tables, table-prefix, and separate-schema modes
- **Exempt Objects**: Configure objects that should not be tenant-isolated
- **Audit Logging**: Track all tenant-related operations with in-memory audit log
- **Comprehensive Tests**: Unit and integration tests with Memory driver
- **TypeScript Support**: Full type definitions with Zod schema validation

### Architecture

- Plugin-based implementation (not core modification)
- Hook-based filter injection (operates at Hook layer, above SQL generation)
- Zero changes to core query compilation pipeline
- Compatible with `@objectql/plugin-security` for tenant-scoped RBAC

### Components

- `MultiTenancyPlugin`: Main plugin class implementing `RuntimePlugin` interface
- `TenantResolver`: Extracts tenant ID from request context
- `QueryFilterInjector`: Injects tenant filters into queries
- `MutationGuard`: Verifies tenant isolation on mutations
- `TenantIsolationError`: Custom error for tenant violations

### Configuration

All configuration options are validated via Zod schema:
- `enabled`: Enable/disable plugin (default: true)
- `tenantField`: Field name for tenant ID (default: 'tenant_id')
- `strictMode`: Prevent cross-tenant access (default: true)
- `tenantResolver`: Custom tenant extraction function
- `schemaIsolation`: Isolation mode (default: 'none')
- `exemptObjects`: Objects exempt from isolation (default: [])
- `autoAddTenantField`: Auto-create tenant_id field (default: true)
- `validateTenantContext`: Validate tenant presence (default: true)
- `throwOnMissingTenant`: Error on missing tenant (default: true)
- `enableAudit`: Enable audit logging (default: true)

### Documentation

- README with comprehensive usage examples
- JSDoc comments on all public APIs
- Integration examples with plugin-security
