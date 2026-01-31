# External Dependencies Documentation

**Generated**: 2026-01-31  
**ObjectQL Version**: 4.0.x

## Overview

This document explains the external `@objectstack/*` dependencies used by ObjectQL packages and their purpose in the architecture.

## Purpose of @objectstack/* Packages

The `@objectstack/*` namespace represents the **ObjectStack Protocol Suite** - a set of standardized specifications and runtime interfaces that define the universal data protocol layer. These packages are separate from `@objectql/*` (the implementation) to maintain clear separation between:

1. **Protocol Definition** (`@objectstack/*`) - The "what" and "why"
2. **Protocol Implementation** (`@objectql/*`) - The "how"

This separation enables:
- Multiple implementations of the same protocol
- Version independence between spec and implementation
- Clear contract definitions for AI code generation
- Cross-platform compatibility guarantees

---

## Package Descriptions

### @objectstack/spec (v0.6.1)

**Purpose**: Core type definitions and schema specifications for the ObjectStack protocol.

**What it provides**:
- TypeScript type definitions for metadata structures
- JSON Schema definitions for validation
- Data type specifications (Field, Object, Relation, etc.)
- System event and action definitions
- UI component specifications
- AI agent interface contracts

**Used by**: 14 packages (all drivers, protocols, and core packages)

**Why we depend on it**:
- Provides the foundation type system that ensures type safety across the entire stack
- Defines the wire protocol for data exchange
- Acts as the "Constitution" for the ObjectQL ecosystem
- Enables AI agents to generate hallucination-free code by providing strict type contracts

**Example**:
```typescript
import type { ObjectMetadata, FieldMetadata } from '@objectstack/spec/data';
```

---

### @objectstack/core (v0.6.1)

**Purpose**: Core runtime interfaces and plugin contracts for the ObjectStack microkernel architecture.

**What it provides**:
- `PluginContext` interface for plugin development
- Kernel lifecycle hooks (onLoad, onStart, onStop)
- Plugin registration and discovery mechanisms
- Inter-plugin communication protocols
- Runtime service abstractions

**Used by**: 4 packages
- `@objectql/core` - Implements the ObjectQL plugin for the kernel
- `@objectql/plugin-formula` - Registers as a formula evaluation plugin
- `@objectql/plugin-security` - Registers as a security enforcement plugin
- `@objectql/plugin-validator` - Registers as a validation plugin

**Why we depend on it**:
- Provides standardized plugin interfaces
- Enables loose coupling between plugins
- Allows plugins to be loaded/unloaded dynamically
- Defines lifecycle management contracts

**Example**:
```typescript
import { type PluginContext } from '@objectstack/core';

export class ValidatorPlugin {
  async onLoad(context: PluginContext) {
    // Register validator services
  }
}
```

---

### @objectstack/runtime (v0.6.1)

**Purpose**: Runtime kernel interfaces and execution environment contracts.

**What it provides**:
- `ObjectKernel` interface - The main runtime container
- Service registry and dependency injection
- Event bus for inter-component communication
- Configuration management
- Runtime metadata access

**Used by**: 1 package
- `@objectql/core` - Extends the kernel with ObjectQL-specific services

**Why we depend on it**:
- Defines the contract for the microkernel runtime
- Provides kernel extension points
- Enables service composition
- Supports runtime introspection

**Example**:
```typescript
import type { ObjectKernel } from '@objectstack/runtime';

interface ExtendedKernel extends ObjectKernel {
  // ObjectQL-specific extensions
  metadata?: MetadataRegistry;
  queryService?: QueryService;
}
```

---

### @objectstack/objectql (v0.6.1)

**Purpose**: ObjectQL protocol specifications and shared utilities.

**What it provides**:
- ObjectQL query language specifications
- Filter, sort, and pagination schemas
- Aggregation and grouping definitions
- Transaction protocol specifications
- Security and permission models

**Used by**: 2 packages
- `@objectql/types` - Imports base protocol types
- `@objectql/core` - Implements protocol specifications

**Why we depend on it**:
- Defines the ObjectQL query protocol
- Ensures consistency across implementations
- Provides canonical examples and test cases
- Documents expected behavior

---

## Dependency Analysis

### Is There a Circular Dependency Risk?

**Short Answer**: ❌ **No circular dependency exists**

**Analysis**:

The dependency chain is:
```
@objectql/core → @objectql/plugin-* → @objectstack/core
```

Key facts:
1. `@objectstack/core` is an **external npm package** (not part of this monorepo)
2. `@objectstack/core` does **NOT** import from `@objectql/*` packages
3. `@objectstack/core` only provides **interfaces and types** (no implementation)
4. The dependency is **one-way**: @objectql packages depend on @objectstack, never the reverse

**Verification**:
```bash
# Check if @objectstack/core imports @objectql/*
npm list @objectql/core
# Result: (empty) - No dependency found
```

The `@objectstack/*` packages serve as **protocol definitions only** - they are similar to DOM types in TypeScript (`lib.dom.d.ts`) which define browser APIs but don't import browser implementations.

---

## Version Consistency

### Current Status

All `@objectstack/*` dependencies use version `^0.6.1`:

| Package | Version | Status |
|---------|---------|--------|
| @objectstack/spec | ^0.6.1 | ✅ Consistent |
| @objectstack/core | ^0.6.1 | ✅ Consistent |
| @objectstack/runtime | ^0.6.1 | ✅ Consistent |
| @objectstack/objectql | ^0.6.1 | ✅ Consistent |

**Recommendation**: ✅ No changes needed. All packages use consistent versions.

---

## Architecture Benefits

This separation provides several architectural benefits:

### 1. Clean Contracts
- Interfaces defined independently of implementation
- Multiple implementations can coexist
- Easy to write tests against interfaces

### 2. AI-Friendly
- Type definitions serve as prompts for AI code generation
- Reduces hallucinations by providing strict contracts
- Enables automated code validation

### 3. Cross-Platform
- Protocol definitions work in Node.js, Browser, Edge, Deno
- Implementation can be platform-specific
- Type safety maintained across all platforms

### 4. Versioning
- Protocol versions can evolve independently
- Backward compatibility easier to maintain
- Breaking changes clearly visible

### 5. Plugin Ecosystem
- Third-party plugins can implement standard interfaces
- No need to depend on implementation packages
- Reduces coupling and dependency bloat

---

## Recommendations

### Short Term
1. ✅ **No action needed** - Dependency structure is clean
2. ✅ **No circular dependencies** - Architecture is sound
3. ✅ **Versions are consistent** - All use ^0.6.1

### Medium Term
1. **Consider**: Document @objectstack/* package source/repository
2. **Consider**: Add link to ObjectStack protocol documentation
3. **Consider**: Create changelog for protocol version updates

### Long Term
1. **Consider**: Publish protocol documentation website
2. **Consider**: Create protocol compliance test suite
3. **Consider**: Version protocol and implementation independently

---

## FAQ

### Q: Should @objectstack/* packages be part of this monorepo?

**A**: No. They should remain separate because:
- They define protocols, not implementations
- Multiple implementations may exist
- Protocol stability is more important than implementation changes
- Versioning should be independent

### Q: Are we locked into @objectstack/* packages?

**A**: No. These are interfaces. If needed, you can:
- Fork the packages
- Create alternative protocol definitions
- Implement compatible interfaces
- Maintain backward compatibility

### Q: How do we update @objectstack/* versions?

**A**: 
1. Review changelog for breaking changes
2. Update all packages simultaneously (use `pnpm update @objectstack/*`)
3. Run full test suite
4. Verify no type errors
5. Test cross-package compatibility

### Q: Can we use different versions of @objectstack/* in different packages?

**A**: Not recommended because:
- Type incompatibilities may occur
- Plugin interfaces may not match
- Runtime errors from version mismatches
- Better to update all at once

---

## Conclusion

The `@objectstack/*` dependencies are **well-architected external protocol definitions** that:
- ✅ Provide clear contracts for implementation
- ✅ Enable plugin ecosystem development
- ✅ Maintain type safety across the stack
- ✅ Support AI-driven code generation
- ✅ Have no circular dependency risks
- ✅ Use consistent versions across all packages

**Status**: ✅ **Architecture is sound, no changes required**
