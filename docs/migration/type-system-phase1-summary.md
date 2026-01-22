# Type System Migration - Phase 1 Summary

## Overview
This document tracks the migration of `@objectql/types` to delegate general types to `@objectstack/spec` and `@objectstack/runtime` packages.

## Version Changes
- **@objectql/types**: `3.0.1` → `4.0.0-beta.1`
- **Dependency Model**: Changed from `dependencies` to `peerDependencies` + `devDependencies` (workspace)

## Type Mapping

### Types Delegated to @objectstack/spec

| Type Name | Source (Before) | Source (After) | Re-exported | Deprecated |
|-----------|----------------|----------------|-------------|------------|
| `Field` | Local definition | `@objectstack/spec` | Yes (as `SpecField`) | Yes |
| `FieldType` | Local definition | `@objectstack/spec` | Yes (as `ProtocolFieldType`) | Yes |
| `SelectOption` | Local definition | `@objectstack/spec` | Yes (as `SpecSelectOption`) | Yes |
| `ServiceObject` | Local definition | `@objectstack/spec` | Yes (as `SpecObject`) | Yes |
| `IndexSchema` | Local definition | `@objectstack/spec` | Yes | Yes |
| `Action` | Local definition | `@objectstack/spec` | Yes (as `SpecAction`) | Yes |
| `FilterCondition` | Local definition | `@objectstack/spec` | Direct import | No |
| `QueryAST` | N/A | `@objectstack/spec` | Via imports | No |
| `FilterNode` | N/A | `@objectstack/spec` | Via imports | No |
| `SortNode` | N/A | `@objectstack/spec` | Via imports | No |

### Types Delegated to @objectstack/runtime

| Type Name | Source (Before) | Source (After) | Re-exported | Deprecated |
|-----------|----------------|----------------|-------------|------------|
| `RuntimePlugin` | N/A | `@objectstack/runtime` | Direct import | No |
| `RuntimeContext` | N/A | `@objectstack/runtime` | Direct import | No |
| `ObjectStackKernel` | N/A | `@objectstack/runtime` | Direct import | No |
| `ObjectStackRuntimeProtocol` | N/A | `@objectstack/runtime` | Direct import | No |

### ObjectQL-Specific Types (Retained)

The following types remain fully defined in `@objectql/types` as they are ObjectQL-specific extensions:

#### Field Extensions (`src/field.ts`)
- `FieldConfig` - Extends protocol Field with runtime properties
- `FieldType` - Extends protocol FieldType with runtime types (`vector`, `grid`, `location`, `object`)
- `FieldOption` - Extends SelectOption to allow number values
- `AttachmentData` - File metadata structure
- `ImageAttachmentData` - Image-specific metadata

#### Object Extensions (`src/object.ts`)
- `ObjectConfig` - Extends ServiceObject with runtime properties
- `IndexConfig` - Simplified alias for IndexSchema
- `AiSearchConfig` - AI/semantic search configuration
- `ObjectAiConfig` - Object-level AI configuration
- `ObjectDoc` - Document instance interface

#### Query Types (`src/query.ts`)
- `UnifiedQuery` - ObjectQL's unified query interface
- `AggregateFunction` - Aggregation function types
- `AggregateOption` - Aggregation configuration

#### Runtime Types
- `ObjectQLContext` (`src/context.ts`) - ObjectQL execution context
- `ObjectQLContextOptions` (`src/context.ts`) - Context options
- `Driver` (`src/driver.ts`) - ObjectQL driver interface
- `IntrospectedColumn`, `IntrospectedTable`, `IntrospectedSchema` (`src/driver.ts`) - Schema introspection

## Workspace Structure Changes

### New Packages Created
```
packages/objectstack/
├── spec/                    # @objectstack/spec stub
│   ├── src/index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
└── runtime/                 # @objectstack/runtime stub
    ├── src/index.ts
    ├── package.json
    ├── tsconfig.json
    └── README.md
```

### Workspace Configuration
Updated `pnpm-workspace.yaml` to include:
```yaml
packages:
  - packages/objectstack/*
```

## Breaking Changes

### For Consumers
- No breaking changes for typical usage (backward compatible re-exports)
- Advanced users importing protocol types should prefer importing directly from `@objectstack/spec`
- All re-exported types are marked `@deprecated` with migration hints

### Package Dependencies
- `@objectstack/spec` and `@objectstack/runtime` are now **peerDependencies**
- Consumers must ensure these packages are available in their project

## Migration Guide for Consumers

### Before (v3.x)
```typescript
import { Field, FieldType, ServiceObject } from '@objectql/types';
```

### After (v4.0)
```typescript
// Option 1: Continue using re-exports (deprecated but works)
import { SpecField, ProtocolFieldType, SpecObject } from '@objectql/types';

// Option 2: Import directly from protocol (recommended)
import { Field, FieldType, ServiceObject } from '@objectstack/spec';

// Option 3: Use ObjectQL runtime extensions
import { FieldConfig, ObjectConfig } from '@objectql/types';
```

## Build Status

### ✅ Successfully Building
- `@objectstack/spec` - All protocol types compile
- `@objectstack/runtime` - All runtime types compile
- `@objectql/types` - All types compile, 32 tests passing

### ⚠️ Known Issues
- External package `@objectstack/objectql@0.2.0` in node_modules has compatibility issues
- Some type mismatches in `@objectql/core` repository.ts (FilterNode usage)
- These are expected during migration and will be resolved in subsequent phases

## Next Steps

1. **Phase 2**: Update `@objectql/core` to properly use new type structure
2. **Phase 3**: Update driver packages to use delegated types
3. **Phase 4**: Publish updated packages with proper semver
4. **Phase 5**: Update documentation and migration guides

## Notes

- This is a **preparation phase** for the full ObjectStack v4.0 migration
- Stub packages created in workspace will be replaced by published npm packages
- All changes maintain backward compatibility through re-exports
- Types are properly marked with deprecation notices
