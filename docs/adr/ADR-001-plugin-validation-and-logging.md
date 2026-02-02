# ADR-001: Plugin Configuration Validation and Structured Logging

**Status:** Accepted

**Date:** 2026-02-02

**Context:** Phase 1 Core Alignment with @objectstack/spec v0.9.0

## Decision

We have decided to:

1. **Implement Zod validation for all plugin configurations**
2. **Replace console-based logging with structured logging**
3. **Align role definitions with @objectstack/spec/auth**

## Context

ObjectQL has evolved from a standalone validation engine to a comprehensive data platform. As the ecosystem grows, we need to ensure:

- Type safety at runtime, not just compile time
- Consistent logging across all components
- Alignment with the ObjectStack specification

### Problems Being Addressed

1. **Configuration Errors**: Plugins accepted invalid configurations at runtime, leading to runtime errors later
2. **Logging Inconsistency**: Different plugins used different logging patterns (console.log, custom loggers)
3. **Spec Divergence**: ObjectQL types were diverging from @objectstack/spec definitions
4. **Observability**: Console-based logging doesn't integrate well with modern observability tools

## Decision Details

### 1. Zod Validation for Plugin Configurations

**Rationale:**
- Runtime validation catches configuration errors immediately
- Better developer experience with clear error messages
- Type inference from schemas reduces duplication
- Standard validation library reduces maintenance burden

**Implementation:**
```typescript
// Each plugin now has a config.schema.ts file
export const SecurityPluginConfigSchema = z.object({
  enabled: z.boolean().optional().default(true),
  storageType: PermissionStorageTypeSchema.optional().default('memory'),
  // ... other fields
});

export type SecurityPluginConfig = z.infer<typeof SecurityPluginConfigSchema>;
```

**Benefits:**
- Early error detection
- Self-documenting configuration
- Automatic default values
- Consistent validation across all plugins

### 2. Structured Logging

**Rationale:**
- Modern applications require structured logs for analysis
- Integration with observability platforms (DataDog, Splunk, etc.)
- Consistent log format across the ecosystem
- Supports metadata and context enrichment

**Implementation:**
```typescript
import type { Logger } from '@objectstack/spec/contracts';
import { createLogger } from '@objectstack/core';

class Plugin {
  private logger: Logger;
  
  constructor() {
    this.logger = createLogger({
      name: '@objectql/plugin-security',
      level: 'info',
      format: 'pretty'
    });
  }
  
  async install() {
    this.logger.info('Installing plugin', { 
      config: { enabled: true } 
    });
  }
}
```

**Benefits:**
- JSON structured logs in production
- Pretty-printed logs in development
- Automatic log levels filtering
- Context propagation
- Distributed tracing support

### 3. Spec Alignment

**Rationale:**
- Consistency across the ObjectStack ecosystem
- Reduce duplication of type definitions
- Benefit from spec improvements automatically
- Security best practices (role naming conventions)

**Implementation:**
```typescript
// Use types from @objectstack/spec
import type { Role } from '@objectstack/spec/auth';

// Re-export for convenience
export type { Role };
```

**Benefits:**
- Single source of truth for types
- Automatic updates when spec evolves
- Cross-platform compatibility
- Security through naming conventions

## Consequences

### Positive

1. **Better Developer Experience**
   - Clear error messages for invalid configurations
   - IntelliSense support from Zod schemas
   - Self-documenting code

2. **Improved Observability**
   - Structured logs for analysis
   - Integration with APM tools
   - Better debugging capabilities

3. **Type Safety**
   - Runtime validation prevents silent failures
   - Zod schemas serve as runtime types
   - Reduced production bugs

4. **Ecosystem Consistency**
   - All plugins follow the same patterns
   - Aligned with @objectstack/spec
   - Easier to maintain

### Negative

1. **Breaking Changes**
   - Existing code needs updates
   - Migration effort required
   - Version bump needed

2. **Additional Dependencies**
   - Added zod dependency (~50KB)
   - Added @objectstack/spec dependency
   - Slightly larger bundle size

3. **Learning Curve**
   - Developers need to understand Zod
   - New logging API
   - Schema definition overhead

### Mitigation

- **Migration Guide**: Comprehensive documentation for upgrading
- **Backward Compatibility**: Where possible, maintain API compatibility
- **Examples**: Updated examples showing new patterns
- **Testing**: Extensive test coverage for validation

## Implementation Plan

### Phase 1: Core Plugins ✅ (Completed)

- [x] @objectql/plugin-security
- [x] @objectql/plugin-validator
- [x] @objectql/plugin-formula

### Phase 2: Documentation (Current)

- [x] Migration guide
- [x] Architecture Decision Record
- [ ] Update plugin README files
- [ ] Update API documentation

### Phase 3: Testing & Validation

- [x] Unit tests for all plugins
- [ ] Integration tests
- [ ] Breaking change validation
- [ ] Security scan

## Alternatives Considered

### 1. JSON Schema Instead of Zod

**Pros:**
- More widely adopted
- JSON-based, language agnostic
- Tooling support

**Cons:**
- No TypeScript type inference
- Less ergonomic API
- Runtime validation less intuitive

**Decision:** Rejected - Zod provides better TypeScript integration

### 2. Custom Logger Implementation

**Pros:**
- Full control over logging
- No external dependencies
- Tailored to our needs

**Cons:**
- Reinventing the wheel
- More maintenance burden
- Less feature-rich

**Decision:** Rejected - Use @objectstack/core logger for consistency

### 3. Keep Console-based Logging

**Pros:**
- No changes needed
- Simple and familiar
- No dependencies

**Cons:**
- Poor observability
- No structure
- Hard to filter/analyze

**Decision:** Rejected - Doesn't meet modern observability requirements

## References

- [@objectstack/spec v0.9.0](https://github.com/objectstack-ai/spec)
- [Zod Documentation](https://zod.dev)
- [Pino Structured Logging](https://getpino.io)
- [ObjectQL Security Plugin](../../packages/foundation/plugin-security)

## Related ADRs

- ADR-002: Plugin Architecture (Future)
- ADR-003: Security Model (Future)

---

**Approved by:** Core Team
**Implementation by:** GitHub Copilot
**Review Status:** Pending Code Review
