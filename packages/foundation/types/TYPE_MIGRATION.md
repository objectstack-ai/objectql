# Type System Migration - @objectql/types v4.0

**Status**: In Progress (Week 2 of Migration)  
**Version**: 4.0.0-alpha.1

## Overview

This document tracks the migration of type definitions from @objectql/types to the appropriate @objectstack packages as part of the v4.0 plugin architecture migration.

## Migration Strategy

### Phase 1: Categorization (Current)

Types are categorized into three groups:

1. **Query-Specific** - Stay in @objectql/types
2. **General Runtime** - To be moved to @objectstack packages
3. **Compatibility** - Re-exported for backward compatibility (v4.x only)

### Phase 2: Re-exports (v4.0)

Add re-exports from @objectstack packages for backward compatibility.

### Phase 3: Deprecation (v4.x)

Mark re-exports as deprecated with clear migration path.

### Phase 4: Removal (v5.0)

Remove re-exports entirely. Users must import from @objectstack directly.

---

## Type Classification

### ✅ Query-Specific Types (Stay in @objectql/types)

These types define ObjectQL's query extension capabilities:

| Type/Interface | File | Purpose | Status |
|----------------|------|---------|--------|
| `UnifiedQuery` | query.ts | Query interface | ✅ Keep |
| `Filter` | query.ts | Query filters | ✅ Keep |
| `AggregateOption` | query.ts | Aggregation | ✅ Keep |
| `IntrospectedTable` | driver.ts | DB introspection | ✅ Keep |
| `IntrospectedColumn` | driver.ts | Column metadata | ✅ Keep |
| `IntrospectedForeignKey` | driver.ts | FK metadata | ✅ Keep |
| `ObjectQLRepository` | repository.ts | Query repository | ✅ Keep |

**Total**: ~7 core query types

---

### 🔄 Types to Re-export from @objectstack (v4.0 Compatibility)

These types will be re-exported for backward compatibility but users should import from @objectstack directly:

| Type/Interface | Current File | Target Package | Migration Status |
|----------------|--------------|----------------|------------------|
| `FilterCondition` | query.ts | @objectstack/spec | ✅ Re-export added |
| `RuntimePlugin` | config.ts | @objectstack/runtime | ✅ Re-export added |
| `DriverInterface` | (none yet) | @objectstack/spec | ✅ Re-export added |
| `RuntimeContext` | (none yet) | @objectstack/runtime | ✅ Re-export added |
| `ObjectStackKernel` | (none yet) | @objectstack/runtime | ✅ Re-export added |
| `ObjectStackRuntimeProtocol` | (none yet) | @objectstack/runtime | ✅ Re-export added |
| `MetadataRegistry` | registry.ts | @objectstack/types | ⏳ When available in @objectstack |
| `ObjectConfig` | object.ts | @objectstack/types | ⏳ When available in @objectstack |
| `FieldConfig` | field.ts | @objectstack/types | ⏳ When available in @objectstack |
| `ObjectQLContext` | context.ts | @objectstack/types | ⏳ When available in @objectstack |
| `HookHandler` | hook.ts | @objectstack/runtime | ⏳ When available in @objectstack |
| `ActionHandler` | action.ts | @objectstack/runtime | ⏳ When available in @objectstack |

**Status**: 6/12 re-exports added (50%)

**Note**: Some types (MetadataRegistry, ObjectConfig, etc.) are still defined in @objectql/types
and will be moved to @objectstack packages in future releases. Re-exports will be added once
the types are available in @objectstack.

---

### ⚠️ Types Under Review (To Be Decided)

These types need evaluation to determine if they stay in ObjectQL or move to @objectstack:

| Type/Interface | File | Question | Decision |
|----------------|------|----------|----------|
| `ValidationRule` | validation.ts | Query-specific or general? | TBD |
| `Permission` | permission.ts | Query-specific or general? | TBD |
| `FormulaDefinition` | formula.ts | Query-specific or general? | TBD |
| `WorkflowDefinition` | workflow.ts | Query-specific or general? | TBD |
| `PageConfig` | page.ts | UI type - belongs in ObjectUI? | TBD |
| `MenuConfig` | menu.ts | UI type - belongs in ObjectUI? | TBD |
| `FormConfig` | form.ts | UI type - belongs in ObjectUI? | TBD |
| `ViewConfig` | view.ts | UI type - belongs in ObjectUI? | TBD |
| `ReportDefinition` | report.ts | Query-specific or general? | TBD |

**Status**: 9 types pending review

---

## Implementation Checklist

### Week 2 Tasks

- [x] Create TYPE_MIGRATION.md
- [x] Update index.ts with migration comments
- [x] Add re-exports for FilterCondition and RuntimePlugin
- [ ] Add deprecation warnings to re-exported types
- [ ] Update package.json dependencies
- [ ] Create type compatibility test suite
- [ ] Document migration path in README

### Week 3-4 Tasks

- [ ] Add remaining re-exports from @objectstack
- [ ] Mark all re-exports as @deprecated
- [ ] Update all internal imports to use @objectstack
- [ ] Add JSDoc migration guides
- [ ] Create automated migration tool

### Week 5+ Tasks

- [ ] Monitor usage of deprecated types
- [ ] Community feedback on migration
- [ ] Plan v5.0 removal timeline

---

## Migration Examples

### Before (v3.x)

```typescript
import { FilterCondition, ObjectConfig, MetadataRegistry } from '@objectql/types';

const filter: FilterCondition = { field: 'status', operator: '=', value: 'active' };
```

### After (v4.0 - Recommended)

```typescript
// Import from @objectstack for general types
import { FilterCondition } from '@objectstack/spec';
import { ObjectConfig, MetadataRegistry } from '@objectstack/types';

// Import from @objectql only for query-specific types
import { UnifiedQuery, AggregateOption } from '@objectql/types';

const filter: FilterCondition = { field: 'status', operator: '=', value: 'active' };
```

### After (v4.0 - Backward Compatible)

```typescript
// This still works in v4.0 but will be removed in v5.0
import { FilterCondition, ObjectConfig, MetadataRegistry } from '@objectql/types';

const filter: FilterCondition = { field: 'status', operator: '=', value: 'active' };
```

---

## Deprecation Warnings

Example deprecation notice to add to re-exported types:

```typescript
/**
 * @deprecated Import from @objectstack/spec directly instead.
 * This re-export will be removed in v5.0.0.
 * 
 * @example
 * // Old (deprecated)
 * import { FilterCondition } from '@objectql/types';
 * 
 * // New (recommended)
 * import { FilterCondition } from '@objectstack/spec';
 */
export type { FilterCondition } from '@objectstack/spec';
```

---

## Package Size Impact

### Current State (v3.x)
- @objectql/types: ~150KB
- Includes all types (query + general + UI)

### Target State (v4.0)
- @objectql/types: ~50KB (67% reduction)
- Only query-specific types
- Re-exports for compatibility

### Future State (v5.0)
- @objectql/types: ~30KB (80% reduction)
- Only query-specific types
- No re-exports

---

## Testing Strategy

### Type Compatibility Tests

Create tests to ensure type compatibility across versions:

```typescript
// type-compat.test.ts
import { FilterCondition as FC1 } from '@objectql/types';
import { FilterCondition as FC2 } from '@objectstack/spec';

// Ensure types are compatible
const test1: FC1 = { field: 'test', operator: '=', value: 1 };
const test2: FC2 = test1; // Should compile without error
```

### Migration Tests

Test that both old and new imports work in v4.0:

```typescript
// Both should work in v4.0
import { FilterCondition } from '@objectql/types'; // v3 style
import { FilterCondition } from '@objectstack/spec'; // v4 style
```

---

## Communication Plan

### Documentation Updates

- [ ] Update README.md with migration guide
- [ ] Update API documentation
- [ ] Create migration examples
- [ ] Update TypeScript typings

### Community Communication

- [ ] Blog post about type system migration
- [ ] Migration guide in docs
- [ ] Deprecation warnings in TypeScript
- [ ] Community Q&A session

---

## Related Documents

- [MIGRATION_TO_OBJECTSTACK_RUNTIME.md](../../../MIGRATION_TO_OBJECTSTACK_RUNTIME.md)
- [docs/migration-decision-matrix.md](../../../docs/migration-decision-matrix.md)
- [docs/objectstack-plugin-architecture.md](../../../docs/objectstack-plugin-architecture.md)

---

**Last Updated**: 2026-01-22  
**Next Review**: Weekly during migration
