# @objectql/plugin-security - Architecture Documentation

## Overview

The ObjectQL Security Plugin implements comprehensive security for the ObjectQL framework following the @objectstack/spec protocol. It provides Role-Based Access Control (RBAC), Field-Level Security (FLS), and Row-Level Security (RLS) with minimal performance impact.

## Design Philosophy

### 1. Aspect-Oriented Programming (AOP)
Security is a cross-cutting concern, not business logic. The plugin uses hooks to inject security checks without modifying business code.

### 2. Protocol-Driven
Implements the @objectstack/spec permission protocol, ensuring compatibility with the specification and enabling declarative security configuration.

### 3. Zero-Intrusion
Can be enabled or disabled via configuration without code changes. When disabled, there's zero performance impact.

### 4. Performance-First
- **Pre-compilation**: Converts permission rules to bitmasks and lookup maps at startup
- **AST-Level Modifications**: Modifies queries before SQL generation
- **Caching**: Stores permission check results in memory

## Architecture Components

### Component Diagram

```
┌─────────────────────────────────────────────────┐
│         ObjectQLSecurityPlugin                   │
│         (Main Plugin Entry)                      │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────────┐  ┌───────────────────┐   │
│  │ PermissionLoader │  │ PermissionGuard   │   │
│  │                  │  │                   │   │
│  │ - Load configs   │  │ - Check perms     │   │
│  │ - Pre-compile    │  │ - Cache results   │   │
│  │ - Bitmasks       │  │ - Audit logs      │   │
│  └──────────────────┘  └───────────────────┘   │
│                                                  │
│  ┌──────────────────┐  ┌───────────────────┐   │
│  │  QueryTrimmer    │  │   FieldMasker     │   │
│  │                  │  │                   │   │
│  │ - RLS filtering  │  │ - FLS masking     │   │
│  │ - AST mods       │  │ - Field removal   │   │
│  │ - Row isolation  │  │ - Value masking   │   │
│  └──────────────────┘  └───────────────────┘   │
│                                                  │
└─────────────────────────────────────────────────┘
         ▲                    ▲
         │                    │
    beforeQuery          afterQuery
    beforeMutation
```

## Component Details

### 1. PermissionLoader

**Responsibilities:**
- Load permission configurations from various sources (memory, Redis, database, custom)
- Pre-compile permission rules into optimized data structures
- Provide fast access to compiled rules

**Pre-compilation Process:**

```typescript
// Original Permission Rule
{
  name: "owner_can_edit",
  condition: {
    field: "owner_id",
    operator: "=",
    value: "$current_user.id"
  },
  permissions: {
    read: true,
    update: true,
    delete: true
  }
}

// Compiled to:
{
  ruleName: "owner_can_edit",
  permissionBitmask: 0b111,  // read | update | delete
  roleLookup: new Map(),
  evaluator: (context) => context.record.owner_id === context.user.id,
  priority: 10
}
```

**Key Features:**
- Supports multiple storage backends (memory, Redis, database, custom)
- Converts conditions to executable JavaScript functions
- Builds bitmasks for O(1) permission checks
- Handles complex conditions with AND/OR logic

### 2. PermissionGuard

**Responsibilities:**
- Execute permission checks for CRUD operations
- Cache permission check results
- Log audit trails

**Permission Check Flow:**

```
1. Check cache for existing result
   ├─ Hit → Return cached result
   └─ Miss → Continue

2. Load permission configuration
   └─ No config → Grant access

3. Check object-level permissions
   ├─ Has role → Continue
   └─ No role → Deny

4. Check field-level permissions (if applicable)
   ├─ Has role → Continue
   └─ No role → Deny

5. Check record-level rules (if applicable)
   ├─ Rule matches → Grant/Deny based on rule
   └─ No match → Continue

6. Check row-level security
   ├─ Has bypass → Grant
   └─ Apply filters → Grant (with filters)

7. Cache result and return
```

**Caching Strategy:**
- Cache key: `{userId}:{objectName}:{operation}:{recordId}:{field}`
- TTL: Configurable (default: 60 seconds)
- Auto-invalidation on permission config reload

### 3. QueryTrimmer

**Responsibilities:**
- Apply row-level security to queries
- Convert permission conditions to query filters
- Optimize impossible queries

**Query Modification Process:**

```typescript
// Original Query
{
  filters: { status: 'active' }
}

// After RLS (for non-admin user)
{
  filters: {
    $and: [
      { status: 'active' },
      { owner_id: currentUser.id }  // Added by RLS
    ]
  }
}

// Generated SQL (example)
SELECT * FROM projects
WHERE status = 'active'
  AND owner_id = '123'  -- RLS filter
```

**Key Features:**
- Works at AST level before SQL generation
- Zero runtime overhead (filtering at database level)
- Supports complex conditions (AND/OR)
- Detects impossible queries for early termination

### 4. FieldMasker

**Responsibilities:**
- Remove unauthorized fields from results
- Mask sensitive field values
- Support various masking formats

**Masking Formats:**

| Format | Example Input | Example Output | Use Case |
|--------|---------------|----------------|----------|
| `****` | "secret123" | "********" | General masking |
| `{last4}` | "1234567890123456" | "************3456" | Credit cards |
| `{first1}***` | "John" | "J***" | Names |
| `***@***.***` | "user@example.com" | "u**@e******.com" | Emails |

**Field Removal Process:**

```typescript
// Original Record
{
  id: "1",
  name: "Project A",
  budget: 100000,          // Restricted to admin
  owner_id: "123",
  internal_notes: "Secret" // Restricted to admin
}

// After FLS (for non-admin user)
{
  id: "1",
  name: "Project A",
  owner_id: "123"
  // budget and internal_notes removed
}
```

## Hook Integration

### beforeQuery Hook

**Purpose:** Apply row-level security before database query

**Flow:**
1. Extract user context and object name
2. Check if object is exempt
3. Apply RLS filters to query
4. Apply record rule filters
5. Check if query is impossible → skip database call

### beforeMutation Hook

**Purpose:** Check permissions before create/update/delete

**Flow:**
1. Extract user context and operation
2. Check if object is exempt
3. Check object-level permissions
4. Check field-level permissions (for updates)
5. Grant or deny operation
6. Log audit entry

### afterQuery Hook

**Purpose:** Apply field-level security to results

**Flow:**
1. Extract user context
2. Check if object is exempt
3. Remove unauthorized fields
4. Mask sensitive values
5. Return cleaned results

## Performance Optimization

### 1. Pre-compilation

**At Startup:**
```typescript
// Convert all permission rules to optimized structures
await loader.loadAll();  // Pre-compiles all rules

// Result: Bitmasks and compiled evaluators ready
// Permission checks become O(1) lookups instead of rule parsing
```

### 2. Caching

**Cache Structure:**
```typescript
Map<string, PermissionCacheEntry> {
  "user123:project:read::": {
    result: { granted: true },
    timestamp: 1642345678000
  }
}
```

**Cache Hit Rate Optimization:**
- Common operations cached longest
- Cache warming at startup
- Automatic invalidation on config reload

### 3. AST-Level Query Modification

**Why AST Level?**
- Filters applied by database engine
- No post-query filtering needed
- Database can use indexes efficiently
- Memory usage stays constant

**Example:**
```sql
-- Without AST modification (slow)
SELECT * FROM projects;  -- 1 million rows
-- Filter in application: 999,999 rows discarded

-- With AST modification (fast)
SELECT * FROM projects WHERE owner_id = '123';  -- 100 rows
-- Database uses index, returns only needed rows
```

## Security Best Practices

### 1. Role Definition
```typescript
// ✓ Good: Explicit roles
roles: ['admin', 'manager', 'developer', 'viewer']

// ✗ Bad: Generic or missing roles
roles: ['user']  // Too broad
```

### 2. Least Privilege
```typescript
// ✓ Good: Minimal necessary permissions
{
  read: ['admin', 'manager', 'developer'],
  update: ['admin', 'manager'],
  delete: ['admin']
}

// ✗ Bad: Over-permissive
{
  read: ['admin', 'manager', 'developer', 'viewer', 'guest'],
  update: ['admin', 'manager', 'developer'],
  delete: ['admin', 'manager']
}
```

### 3. Row-Level Security
```typescript
// ✓ Good: Default deny with explicit exceptions
row_level_security: {
  enabled: true,
  default_rule: {
    field: 'owner_id',
    operator: '=',
    value: '$current_user.id'
  },
  exceptions: [
    { role: 'admin', bypass: true }
  ]
}

// ✗ Bad: Default allow
row_level_security: {
  enabled: false  // Everyone sees everything
}
```

### 4. Audit Logging
```typescript
// ✓ Good: Enable for sensitive operations
{
  enableAudit: true,
  audit: {
    events: ['access_denied', 'sensitive_field_access'],
    retention_days: 90
  }
}
```

## Testing Strategy

### 1. Unit Tests
- Test each component in isolation
- Mock dependencies
- Cover edge cases

### 2. Integration Tests
- Test plugin integration with ObjectQL
- Test hook execution
- Test end-to-end permission flows

### 3. Performance Tests
- Measure pre-compilation time
- Measure permission check latency
- Measure cache hit rate

### 4. Security Tests
- Test privilege escalation attempts
- Test SQL injection in conditions
- Test cache poisoning

## Troubleshooting

### Common Issues

**1. Permission Denied Unexpectedly**
- Check user roles in context
- Verify permission configuration is loaded
- Check cache TTL (might be using stale permissions)

**2. Slow Permission Checks**
- Enable pre-compilation
- Enable caching
- Check cache hit rate

**3. Fields Not Being Masked**
- Check field names match exactly
- Verify user roles
- Ensure afterQuery hook is registered

**4. Row-Level Security Not Working**
- Verify RLS is enabled in config
- Check default rule syntax
- Ensure beforeQuery hook is registered

## Future Enhancements

1. **Redis Storage** - Implement Redis-backed permission storage
2. **Database Storage** - Implement database-backed permission storage
3. **Permission Inheritance** - Support role inheritance
4. **Dynamic Permissions** - Support time-based permissions
5. **Permission UI** - Admin UI for managing permissions
6. **Performance Monitoring** - Built-in metrics and dashboards

## References

- [@objectstack/spec Permission Protocol](https://protocol.objectstack.ai/permissions)
- [ObjectQL Plugin Architecture](../../../docs/architecture/plugins.md)
- [Security Best Practices](../../../docs/security/best-practices.md)
