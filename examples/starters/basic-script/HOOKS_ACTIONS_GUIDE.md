# Project Hooks and Actions - Comprehensive Examples

This directory contains comprehensive, production-ready examples of ObjectQL hooks and actions that follow the specification in `/docs/spec/hook.md` and `/docs/spec/action.md`.

## Files

- `projects.hook.ts` - Comprehensive hook implementations demonstrating all 8 hook types
- `projects.action.ts` - Comprehensive action implementations (record and global actions)
- `projects.object.yml` - Updated object definition with all action declarations
- `__tests__/projects-hooks-actions.test.ts` - Complete test suite validating all patterns

## Hook Examples Covered

### 1. beforeCreate
- ✅ Auto-assign owner from user context
- ✅ Set default values (status, budget)
- ✅ Validate required fields
- ✅ Validate field constraints (length, format)
- ✅ Check for duplicates using API
- ✅ Business rule validation

### 2. afterCreate
- ✅ Logging and audit trails
- ✅ Creating related records
- ✅ Sending notifications
- ✅ Trigger external workflows

### 3. beforeFind
- ✅ Row-level security (multi-tenancy filtering)
- ✅ Query modification
- ✅ Default sort application
- ✅ Access control based on user roles

### 4. afterFind
- ✅ Adding computed fields
- ✅ Data transformation
- ✅ Enriching results
- ✅ Masking sensitive data

### 5. beforeUpdate
- ✅ State machine validation
- ✅ State transition rules
- ✅ Budget constraint checking
- ✅ Permission validation
- ✅ Using isModified() helper
- ✅ State sharing with afterUpdate

### 6. afterUpdate
- ✅ Change-based notifications
- ✅ Updating related records
- ✅ Logging significant changes
- ✅ Accessing state from beforeUpdate

### 7. beforeDelete
- ✅ Dependency checking
- ✅ Preventing deletion based on status
- ✅ Permission validation
- ✅ Business rule enforcement

### 8. afterDelete
- ✅ Cascade deletion of related records
- ✅ Cleanup of external resources
- ✅ Audit logging
- ✅ Notifications

## Action Examples Covered

### Record Actions (operate on specific records)

#### 1. complete
- ✅ Fetch and validate current state
- ✅ Perform atomic updates
- ✅ Use input parameters
- ✅ Return structured results
- ✅ Error handling

#### 2. approve
- ✅ State transition validation
- ✅ Required input validation
- ✅ Business logic (budget thresholds)
- ✅ User permission checks

#### 3. clone
- ✅ Create records based on existing ones
- ✅ Copy selected fields
- ✅ Reset certain fields (status, ownership)
- ✅ Optional related data copying

### Global Actions (operate on collections)

#### 4. import_projects
- ✅ Batch creation
- ✅ Data validation
- ✅ Error collection
- ✅ Progress reporting
- ✅ Multiple data sources

#### 5. bulk_update_status
- ✅ Batch updates
- ✅ Per-record validation
- ✅ Error collection
- ✅ Skip invalid records

#### 6. generate_report
- ✅ Data aggregation
- ✅ Statistical analysis
- ✅ Grouping and counting
- ✅ Computed metrics

## Key Patterns Demonstrated

### Hook Patterns
1. **Validation Before Mutation**: beforeCreate/beforeUpdate validate data before DB operations
2. **Side Effects After Mutation**: afterCreate/afterUpdate perform notifications and related updates
3. **Query Modification**: beforeFind adds security filters and default sorting
4. **Result Transformation**: afterFind enriches data with computed fields
5. **State Sharing**: Using ctx.state to pass data between before/after hooks
6. **Change Tracking**: Using isModified() to detect field changes
7. **Previous Data**: Accessing previousData in update/delete hooks

### Action Patterns
1. **Input Validation**: Check required fields and constraints
2. **State Validation**: Fetch current record and validate state
3. **Atomic Operations**: Use api methods for safe updates
4. **Error Handling**: Throw meaningful errors with context
5. **Structured Returns**: Return consistent result objects
6. **Batch Processing**: Handle multiple records with error collection
7. **Progress Reporting**: Track success/failure counts

## Usage

### Running Tests

```bash
cd examples/starters/basic-script
npm test __tests__/projects-hooks-actions.test.ts
```

### Using in Your Project

Copy the patterns from these files and adapt them to your needs:

```typescript
import { ObjectHookDefinition } from '@objectql/types';

const hooks: ObjectHookDefinition<YourType> = {
    beforeCreate: async ({ data, user, api }) => {
        // Your validation logic
        if (!data.field) {
            throw new Error('Field is required');
        }
        
        // Set defaults
        data.owner = user?.id;
    },
    
    afterCreate: async ({ result, api }) => {
        // Your side effects
        await api.create('notifications', {
            message: `New record created: ${result.name}`
        });
    }
};

export default hooks;
```

## Best Practices

1. **Keep hooks focused**: Each hook should have a single responsibility
2. **Use beforeHooks for validation**: Don't let invalid data reach the database
3. **Use afterHooks for side effects**: Notifications, related updates, etc.
4. **Always validate input**: Check user input in beforeCreate and beforeUpdate
5. **Use isModified()**: Only react to actual changes in beforeUpdate/afterUpdate
6. **Share state wisely**: Use ctx.state to pass data between before/after pairs
7. **Handle errors gracefully**: Throw clear, actionable error messages
8. **Test thoroughly**: Cover happy paths and error cases
9. **Document business rules**: Add comments explaining why rules exist
10. **Keep actions idempotent**: Actions should be safe to retry

## Security Considerations

1. **Row-Level Security**: Use beforeFind to filter data by user/tenant
2. **Permission Checks**: Validate user permissions in before hooks
3. **Input Sanitization**: Validate and sanitize all user input
4. **Prevent Privilege Escalation**: Don't allow users to set admin-only fields
5. **Audit Logging**: Log security-sensitive operations in after hooks

## Performance Tips

1. **Minimize API calls**: Batch operations when possible
2. **Cache computed values**: Don't recalculate on every read
3. **Use indexes**: Ensure filtered fields are indexed
4. **Avoid N+1 queries**: Fetch related data efficiently
5. **Paginate large results**: Don't load thousands of records at once

## Related Documentation

- [Hook Specification](/docs/spec/hook.md)
- [Action Specification](/docs/spec/action.md)
- [Object Metadata Standard](/docs/spec/metadata-standard.md)
- [Core Test Examples](/packages/core/test/hook.test.ts)
