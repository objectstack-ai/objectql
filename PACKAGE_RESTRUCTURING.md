# Package Restructuring Plan for @objectstack/runtime Migration

## Overview

This document outlines the detailed package restructuring plan to transform ObjectQL from a standalone framework into a plugin-based architecture built on @objectstack/runtime.

## Current Package Structure

```
packages/
├── foundation/
│   ├── types/          # TypeScript type definitions
│   ├── core/           # Core ObjectQL engine
│   └── platform-node/  # Node.js platform utilities
├── drivers/
│   ├── sql/            # SQL driver (Knex)
│   ├── mongo/          # MongoDB driver
│   ├── memory/         # In-memory driver
│   ├── localstorage/   # Browser LocalStorage driver
│   ├── fs/             # File system driver
│   ├── excel/          # Excel file driver
│   ├── redis/          # Redis driver
│   └── sdk/            # HTTP Remote driver
├── runtime/
│   └── server/         # HTTP server adapter
└── tools/
    ├── cli/            # Command-line interface
    ├── create/         # Project scaffolding
    └── vscode-objectql/ # VS Code extension
```

## Target Package Structure (v4.0.0)

```
packages/
├── plugins/
│   ├── query-validation/      # Query validation plugin
│   ├── query-optimizer/       # Query optimization plugin
│   ├── query-cache/          # Query caching plugin
│   ├── advanced-repository/  # Enhanced repository plugin
│   ├── formula-engine/       # Formula evaluation plugin
│   └── ai-query-generator/   # AI query generation plugin
├── drivers/
│   ├── sql/                  # SQL driver plugin
│   ├── mongo/                # MongoDB driver plugin
│   ├── memory/               # Memory driver plugin
│   ├── localstorage/         # LocalStorage driver plugin
│   ├── fs/                   # File system driver plugin
│   ├── excel/                # Excel driver plugin
│   ├── redis/                # Redis driver plugin
│   └── sdk/                  # SDK driver plugin
├── core/
│   └── types/                # Query-specific types (minimal)
├── integrations/
│   └── server/               # HTTP server plugin
└── tools/
    ├── cli/                  # CLI (runtime-aware)
    ├── create/               # Scaffolding (runtime-based)
    └── vscode-objectql/      # VS Code extension
```

## Package-by-Package Migration Plan

### 1. Foundation Layer → Core Types

#### @objectql/types (v3.0.1 → v4.0.0)

**Current Responsibilities:**
- All TypeScript interfaces
- Driver interface (being replaced by @objectstack/spec)
- Core types, query types, metadata types

**Target Responsibilities:**
- Query-specific types only
- Plugin interfaces for ObjectQL plugins
- Thin type re-exports from @objectstack/spec

**Changes:**
- ❌ Remove: Driver interface (use @objectstack/spec)
- ❌ Remove: MetadataRegistry types (use @objectstack/runtime)
- ❌ Remove: Context types (use @objectstack/runtime)
- ❌ Remove: Hook types (use @objectstack/runtime)
- ❌ Remove: Action types (use @objectstack/runtime)
- ✅ Add: QueryPlugin interface
- ✅ Add: RepositoryPlugin interface
- ✅ Add: Plugin-specific types
- ✅ Keep: Query-specific helper types

**Migration Steps:**
1. Create `/packages/core/types/` (new location)
2. Move query-specific types
3. Update imports to use @objectstack packages
4. Remove deprecated types
5. Update dependent packages

**Package.json Changes:**
```json
{
  "name": "@objectql/types",
  "version": "4.0.0",
  "dependencies": {
    "@objectstack/spec": "^0.2.0",
    "@objectstack/runtime": "^0.2.0"
  }
}
```

#### @objectql/core (v3.0.1 → DEPRECATED)

**Current Responsibilities:**
- Full ObjectQL engine
- Metadata registry
- Driver management
- Hooks, actions, validation
- Repository pattern
- Formula engine
- AI agent integration

**Target:** **DEPRECATED** - Split into multiple plugins

**Migration Path:**
```
@objectql/core (v3.x)
├── app.ts              → @objectstack/runtime (lifecycle)
├── repository.ts       → @objectql/advanced-repository (plugin)
├── validator.ts        → @objectql/query-validation (plugin)
├── formula-engine.ts   → @objectql/formula-engine (plugin)
├── ai-agent.ts         → @objectql/ai-query-generator (plugin)
├── hook.ts             → @objectstack/runtime (events)
├── action.ts           → @objectstack/runtime (commands)
├── object.ts           → @objectstack/runtime (metadata)
└── util.ts             → @objectql/types (utilities)
```

**Package Status:**
- v4.0.0: Compatibility wrapper (re-exports from plugins)
- v4.1.0: Deprecation warnings
- v5.0.0: Removed (use plugins directly)

#### @objectql/platform-node (v3.0.1 → MIGRATE)

**Current Responsibilities:**
- Node.js file system utilities
- YAML loading
- Plugin loading
- Environment detection

**Target:** Most functionality moves to @objectstack/platform-node

**Remaining Responsibilities:**
- ObjectQL-specific Node.js utilities
- Query file loading helpers

**Migration Steps:**
1. Identify ObjectQL-specific vs. general utilities
2. Contribute general utilities to @objectstack/platform-node
3. Keep only query-specific helpers
4. Update to use @objectstack/platform-node

**Package.json Changes:**
```json
{
  "name": "@objectql/platform-node",
  "version": "4.0.0",
  "dependencies": {
    "@objectstack/platform-node": "^0.2.0",
    "@objectql/types": "workspace:*"
  }
}
```

### 2. Drivers Layer → Driver Plugins

**All drivers follow the same pattern:**

#### Template: @objectql/driver-* (v3.0.1 → v4.0.0)

**Changes:**
```diff
- Implement Driver interface from @objectql/types
+ Implement DriverInterface from @objectstack/spec
+ Export as RuntimePlugin
+ Add plugin setup/teardown
```

**Example: @objectql/driver-sql**

**Before (v3.x):**
```typescript
import { Driver } from '@objectql/types';

export class SQLDriver implements Driver {
  async connect() { }
  async find(object, query) { }
  // ...
}
```

**After (v4.x):**
```typescript
import { DriverInterface } from '@objectstack/spec';
import { RuntimePlugin } from '@objectstack/runtime';

export class SQLDriver implements DriverInterface {
  name = 'sql';
  version = '4.0.0';
  
  async connect() { }
  async disconnect() { }
  async find(object, query, options) { }
  async create(object, data, options) { }
  async update(object, id, data, options) { }
  async delete(object, id, options) { }
}

export function sqlDriverPlugin(config): RuntimePlugin {
  const driver = new SQLDriver(config);
  return {
    name: '@objectql/driver-sql',
    version: '4.0.0',
    type: 'driver',
    async setup(runtime) {
      await driver.connect();
      runtime.registerDriver(driver);
    },
    async teardown(runtime) {
      await driver.disconnect();
    }
  };
}
```

**Migration Checklist for Each Driver:**
- [ ] Update to DriverInterface from @objectstack/spec
- [ ] Add plugin wrapper function
- [ ] Add setup/teardown lifecycle
- [ ] Update tests to use Runtime
- [ ] Update documentation
- [ ] Update examples

**Drivers to Migrate:**
1. @objectql/driver-sql (P0 - Critical)
2. @objectql/driver-memory (P0 - Critical for testing)
3. @objectql/driver-mongo (P0 - Popular)
4. @objectql/driver-sdk (P0 - Remote API)
5. @objectql/driver-localstorage (P1 - Browser)
6. @objectql/driver-fs (P1 - Development)
7. @objectql/driver-excel (P2 - Niche)
8. @objectql/driver-redis (P2 - Template/Example)

### 3. Query Plugins (NEW)

#### @objectql/query-validation (NEW)

**Location:** `/packages/plugins/query-validation/`

**Source:**
- Extracted from `@objectql/core/validator.ts`
- Extracted from `@objectql/core/object.ts` (field validation)

**Responsibilities:**
- Query AST validation
- Field existence checking
- Type validation
- Cross-field validation
- Custom validators

**Package.json:**
```json
{
  "name": "@objectql/query-validation",
  "version": "4.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "dependencies": {
    "@objectstack/runtime": "^0.2.0",
    "@objectstack/spec": "^0.2.0",
    "@objectql/types": "workspace:*"
  }
}
```

**Exports:**
```typescript
export { queryValidationPlugin } from './plugin';
export type { ValidationOptions, ValidationError, ValidationResult } from './types';
```

#### @objectql/advanced-repository (NEW)

**Location:** `/packages/plugins/advanced-repository/`

**Source:**
- Extracted from `@objectql/core/repository.ts`
- Enhanced with new capabilities

**Responsibilities:**
- Enhanced CRUD operations
- Batch operations
- Upsert functionality
- Soft delete
- Audit tracking
- Event hooks

**Package.json:**
```json
{
  "name": "@objectql/advanced-repository",
  "version": "4.0.0",
  "dependencies": {
    "@objectstack/runtime": "^0.2.0",
    "@objectstack/spec": "^0.2.0",
    "@objectql/types": "workspace:*"
  }
}
```

#### @objectql/query-optimizer (NEW)

**Location:** `/packages/plugins/query-optimizer/`

**Source:** New implementation

**Responsibilities:**
- Query plan optimization
- Index hint generation
- Join optimization
- Projection pruning
- Filter optimization

**Package.json:**
```json
{
  "name": "@objectql/query-optimizer",
  "version": "4.0.0",
  "dependencies": {
    "@objectstack/runtime": "^0.2.0",
    "@objectstack/spec": "^0.2.0",
    "@objectql/types": "workspace:*"
  }
}
```

#### @objectql/query-cache (NEW)

**Location:** `/packages/plugins/query-cache/`

**Source:** New implementation

**Responsibilities:**
- Query result caching
- Cache key generation
- TTL management
- Cache invalidation
- Memory management

**Package.json:**
```json
{
  "name": "@objectql/query-cache",
  "version": "4.0.0",
  "dependencies": {
    "@objectstack/runtime": "^0.2.0",
    "@objectstack/spec": "^0.2.0",
    "@objectql/types": "workspace:*"
  }
}
```

#### @objectql/formula-engine (NEW)

**Location:** `/packages/plugins/formula-engine/`

**Source:**
- Extracted from `@objectql/core/formula-engine.ts`

**Responsibilities:**
- Formula parsing
- Expression evaluation
- Built-in functions
- Custom function registration

**Package.json:**
```json
{
  "name": "@objectql/formula-engine",
  "version": "4.0.0",
  "dependencies": {
    "@objectstack/runtime": "^0.2.0",
    "@objectql/types": "workspace:*"
  }
}
```

#### @objectql/ai-query-generator (NEW)

**Location:** `/packages/plugins/ai-query-generator/`

**Source:**
- Extracted from `@objectql/core/ai-agent.ts`
- Enhanced with new capabilities

**Responsibilities:**
- Natural language to QueryAST
- Query suggestions
- Semantic understanding
- Context-aware generation

**Package.json:**
```json
{
  "name": "@objectql/ai-query-generator",
  "version": "4.0.0",
  "dependencies": {
    "@objectstack/runtime": "^0.2.0",
    "@objectstack/spec": "^0.2.0",
    "@objectql/types": "workspace:*",
    "openai": "^4.28.0"
  }
}
```

### 4. Server Integration

#### @objectql/server (v3.0.1 → v4.0.0)

**Location:** `/packages/integrations/server/`

**Changes:**
```diff
- Own ObjectQL app initialization
+ Use @objectstack/runtime
+ Provide HTTP API plugin
+ Expose metadata endpoints via runtime
```

**Package.json:**
```json
{
  "name": "@objectql/server",
  "version": "4.0.0",
  "dependencies": {
    "@objectstack/runtime": "^0.2.0",
    "@objectstack/spec": "^0.2.0",
    "@objectql/types": "workspace:*",
    "express": "^4.18.0"
  }
}
```

### 5. Tools

#### @objectql/cli (v3.0.1 → v4.0.0)

**Changes:**
```diff
- Generate v3.x ObjectQL projects
+ Generate v4.x runtime-based projects
+ New templates with plugin composition
+ Migration command for v3.x → v4.x
```

**New Commands:**
```bash
# Create new project with runtime
objectql create my-app --runtime

# Migrate v3.x project to v4.x
objectql migrate --from 3.x

# Plugin management
objectql plugin add @objectql/query-cache
objectql plugin list
```

**Package.json:**
```json
{
  "name": "@objectql/cli",
  "version": "4.0.0",
  "dependencies": {
    "@objectstack/runtime": "^0.2.0",
    "@objectql/types": "workspace:*"
  }
}
```

#### @objectql/create (v3.0.1 → v4.0.0)

**Changes:**
```diff
- v3.x templates
+ v4.x runtime-based templates
+ Plugin composition examples
```

**Package.json:**
```json
{
  "name": "@objectql/create",
  "version": "4.0.0",
  "dependencies": {
    "@objectstack/runtime": "^0.2.0"
  }
}
```

#### @objectql/vscode-objectql (v3.0.1 → v4.0.0)

**Changes:**
```diff
- v3.x schema validation
+ v4.x runtime schema validation
+ Plugin configuration IntelliSense
```

## Migration Timeline

### Week 1-2: Foundation
- [ ] Set up new package structure
- [ ] Migrate @objectql/types
- [ ] Create plugin base classes

### Week 3-4: Core Plugins
- [ ] Create @objectql/query-validation
- [ ] Create @objectql/advanced-repository

### Week 5-6: Drivers
- [ ] Migrate @objectql/driver-sql
- [ ] Migrate @objectql/driver-memory
- [ ] Migrate @objectql/driver-mongo
- [ ] Migrate @objectql/driver-sdk

### Week 7-8: Feature Plugins
- [ ] Create @objectql/formula-engine
- [ ] Create @objectql/query-optimizer
- [ ] Create @objectql/query-cache

### Week 9-10: Advanced Plugins
- [ ] Create @objectql/ai-query-generator
- [ ] Migrate remaining drivers

### Week 11-12: Integration & Tools
- [ ] Migrate @objectql/server
- [ ] Update @objectql/cli
- [ ] Update @objectql/create
- [ ] Update @objectql/vscode-objectql

### Week 13-14: Testing & Documentation
- [ ] Update all tests
- [ ] Update all documentation
- [ ] Create migration guides

## Package Publishing Strategy

### Phase 1: Alpha (Week 8)
Publish core plugins and drivers for internal testing:
- @objectql/types@4.0.0-alpha.1
- @objectql/query-validation@4.0.0-alpha.1
- @objectql/advanced-repository@4.0.0-alpha.1
- @objectql/driver-sql@4.0.0-alpha.1
- @objectql/driver-memory@4.0.0-alpha.1

### Phase 2: Beta (Week 12)
Publish all plugins for community testing:
- All packages@4.0.0-beta.1

### Phase 3: RC (Week 16)
Release candidate with docs and examples:
- All packages@4.0.0-rc.1

### Phase 4: GA (Week 20)
Production release:
- All packages@4.0.0

## Backward Compatibility

### Compatibility Package: @objectql/legacy

**Purpose:** Provide v3.x API compatibility

```typescript
// @objectql/legacy
export class ObjectQL {
  constructor(config: ObjectQLConfig) {
    console.warn('Using legacy API. Please migrate to @objectstack/runtime');
    // Wrap runtime with v3.x API
  }
}
```

**Usage:**
```typescript
// Old code continues to work
import { ObjectQL } from '@objectql/legacy';

const app = new ObjectQL({
  datasources: { default: sqlDriver }
});
```

### Deprecation Timeline
- v4.0.0: @objectql/legacy available
- v4.5.0: @objectql/legacy deprecated
- v5.0.0: @objectql/legacy removed

## Next Steps

1. Review this restructuring plan
2. Create new package directories
3. Begin Phase 1 migration
4. Set up CI/CD for new packages
5. Create migration automation scripts

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-01-21  
**Status:** Draft - Pending Review
