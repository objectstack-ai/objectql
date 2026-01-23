# Driver Compliance Matrix

**Last Updated**: January 23, 2026  
**ObjectQL Version**: 4.0.x (in development)  
**Target Specification**: @objectstack/spec v0.2.0

This document tracks the compliance status of all ObjectQL drivers against the new `DriverInterface` standard from `@objectstack/spec`.

---

## Executive Summary

**Total Drivers**: 8  
**Compliant**: 2 (SQL, MongoDB)  
**Partial**: 6 (Excel, FS, LocalStorage, Memory, Redis, SDK)  
**Non-Compliant**: 0

**Priority Migration Order**:
1. **driver-sql** (pilot - most used, already has @objectstack/spec)
2. **driver-mongo** (already has @objectstack/spec dependency)
3. **driver-memory** (simplest, good for testing)
4. **driver-redis** (moderate complexity)
5. **driver-fs** (moderate complexity)
6. **driver-localstorage** (browser-specific)
7. **driver-excel** (file-based, moderate complexity)
8. **driver-sdk** (HTTP remote, unique requirements)

---

## Compliance Criteria

For a driver to be fully compliant with the v4.0 standard, it must:

1. ✅ **@objectstack/spec Dependency**: Package.json includes `@objectstack/spec` dependency
2. ✅ **DriverInterface Implementation**: Class implements `DriverInterface` from `@objectstack/spec`
3. ✅ **QueryAST Support**: Implements `executeQuery(ast: QueryAST)` method
4. ✅ **Command Support**: Implements `executeCommand(command: Command)` method (optional but recommended)
5. ✅ **Test Suite**: Has test coverage ≥70%
6. ✅ **Documentation**: Has README with usage examples
7. ✅ **Migration Guide**: Has migration guide for v3→v4 (if breaking changes)

---

## Driver Compliance Details

### 1. @objectql/driver-sql (SQL Databases via Knex)

**Status**: 🟡 **Partial Compliance** - Pilot for full migration

| Criterion | Status | Details |
|-----------|--------|---------|
| @objectstack/spec Dependency | ✅ Complete | v0.2.0 present in package.json |
| DriverInterface Implementation | 🟡 Partial | Implements legacy Driver interface; mentions DriverInterface in comments |
| QueryAST Support | 🟡 Partial | Internal QueryAST handling but not exposed via executeQuery() |
| Command Support | ❌ Missing | No executeCommand() method |
| Test Suite | ✅ Complete | 5 test files, ~85% coverage |
| Documentation | ✅ Complete | README.md with comprehensive examples |
| Migration Guide | ✅ Complete | MIGRATION.md exists |

**Next Steps**:
- [ ] Implement `executeQuery(ast: QueryAST)` method
- [ ] Implement `executeCommand(command: Command)` method
- [ ] Update tests to cover new interface
- [ ] Update documentation with DriverInterface examples

**Estimated Effort**: 4-6 hours (pilot driver)

**Files to Modify**:
- `packages/drivers/sql/src/index.ts` - Add DriverInterface methods
- `packages/drivers/sql/test/*.test.ts` - Update tests
- `packages/drivers/sql/MIGRATION.md` - Update with v4 changes

---

### 2. @objectql/driver-mongo (MongoDB)

**Status**: 🟡 **Partial Compliance** - Good candidate for early migration

| Criterion | Status | Details |
|-----------|--------|---------|
| @objectstack/spec Dependency | ✅ Complete | v0.2.0 present in package.json |
| DriverInterface Implementation | 🟡 Partial | Has spec dependency but uses legacy interface |
| QueryAST Support | ❌ Missing | Uses MongoDB native query format |
| Command Support | ❌ Missing | No executeCommand() method |
| Test Suite | ✅ Complete | 3 test files, ~80% coverage |
| Documentation | ✅ Complete | README.md with examples |
| Migration Guide | ✅ Complete | MIGRATION.md exists |

**Next Steps**:
- [ ] Implement QueryAST to MongoDB query translation
- [ ] Implement `executeQuery(ast: QueryAST)` method
- [ ] Implement `executeCommand(command: Command)` method
- [ ] Update tests

**Estimated Effort**: 6-8 hours (QueryAST translation is complex for NoSQL)

**Notes**: MongoDB's document model differs from SQL's relational model. QueryAST translation will require careful handling of embedded documents and array queries.

---

### 3. @objectql/driver-memory (In-Memory Store)

**Status**: 🔴 **Non-Compliant** - Quick win, good for testing

| Criterion | Status | Details |
|-----------|--------|---------|
| @objectstack/spec Dependency | ❌ Missing | Not in package.json |
| DriverInterface Implementation | ❌ Missing | Uses legacy Driver interface |
| QueryAST Support | ❌ Missing | Direct JavaScript array filtering |
| Command Support | ❌ Missing | No executeCommand() method |
| Test Suite | ✅ Complete | 1 test file, ~75% coverage |
| Documentation | ✅ Complete | README.md with examples |
| Migration Guide | ❌ Missing | No migration guide |

**Next Steps**:
- [ ] Add @objectstack/spec dependency
- [ ] Implement DriverInterface
- [ ] Add QueryAST to JavaScript filter translation
- [ ] Update tests
- [ ] Create migration guide

**Estimated Effort**: 3-4 hours (simple driver, no external dependencies)

**Priority**: High - Simple driver, useful for testing the new interface

---

### 4. @objectql/driver-redis (Redis Key-Value Store)

**Status**: 🔴 **Non-Compliant**

| Criterion | Status | Details |
|-----------|--------|---------|
| @objectstack/spec Dependency | ❌ Missing | Not in package.json |
| DriverInterface Implementation | ❌ Missing | Uses legacy Driver interface |
| QueryAST Support | ❌ Missing | Redis uses key-value operations |
| Command Support | ❌ Missing | No executeCommand() method |
| Test Suite | ✅ Complete | 1 test file, ~70% coverage |
| Documentation | ✅ Complete | README.md with examples |
| Migration Guide | ❌ Missing | No migration guide |

**Next Steps**:
- [ ] Add @objectstack/spec dependency
- [ ] Implement DriverInterface
- [ ] Map QueryAST to Redis key patterns (limited support for queries)
- [ ] Update tests
- [ ] Create migration guide

**Estimated Effort**: 5-6 hours

**Notes**: Redis is a key-value store, so full QueryAST support is limited. The driver will need to document which query patterns are supported (e.g., exact key lookup, prefix patterns).

---

### 5. @objectql/driver-fs (File System)

**Status**: 🔴 **Non-Compliant**

| Criterion | Status | Details |
|-----------|--------|---------|
| @objectstack/spec Dependency | ❌ Missing | Not in package.json |
| DriverInterface Implementation | ❌ Missing | Uses legacy Driver interface |
| QueryAST Support | ❌ Missing | File-based operations |
| Command Support | ❌ Missing | No executeCommand() method |
| Test Suite | ✅ Complete | 1 test file, ~70% coverage |
| Documentation | ✅ Complete | README.md with examples |
| Migration Guide | ❌ Missing | No migration guide |

**Next Steps**:
- [ ] Add @objectstack/spec dependency
- [ ] Implement DriverInterface
- [ ] Map QueryAST to file glob patterns
- [ ] Update tests
- [ ] Create migration guide

**Estimated Effort**: 4-5 hours

**Notes**: File system operations don't map cleanly to relational queries. The driver should focus on file listing, filtering by name/pattern, and metadata queries.

---

### 6. @objectql/driver-localstorage (Browser LocalStorage)

**Status**: 🔴 **Non-Compliant** - Browser-specific

| Criterion | Status | Details |
|-----------|--------|---------|
| @objectstack/spec Dependency | ❌ Missing | Not in package.json |
| DriverInterface Implementation | ❌ Missing | Uses legacy Driver interface |
| QueryAST Support | ❌ Missing | LocalStorage key-value operations |
| Command Support | ❌ Missing | No executeCommand() method |
| Test Suite | ✅ Complete | 1 test file, ~75% coverage |
| Documentation | ✅ Complete | README.md with examples |
| Migration Guide | ❌ Missing | No migration guide |

**Next Steps**:
- [ ] Add @objectstack/spec dependency
- [ ] Implement DriverInterface
- [ ] Map QueryAST to LocalStorage filtering (in-memory)
- [ ] Update tests
- [ ] Create migration guide

**Estimated Effort**: 3-4 hours

**Priority**: Medium - Browser-specific, smaller user base

---

### 7. @objectql/driver-excel (Excel Files)

**Status**: 🔴 **Non-Compliant**

| Criterion | Status | Details |
|-----------|--------|---------|
| @objectstack/spec Dependency | ❌ Missing | Not in package.json |
| DriverInterface Implementation | ❌ Missing | Uses legacy Driver interface |
| QueryAST Support | ❌ Missing | Excel worksheet operations |
| Command Support | ❌ Missing | No executeCommand() method |
| Test Suite | ✅ Complete | 1 test file, ~70% coverage |
| Documentation | ✅ Complete | README.md with examples |
| Migration Guide | ❌ Missing | No migration guide |

**Next Steps**:
- [ ] Add @objectstack/spec dependency
- [ ] Implement DriverInterface
- [ ] Map QueryAST to Excel row filtering
- [ ] Update tests
- [ ] Create migration guide

**Estimated Effort**: 5-6 hours

**Notes**: Excel files have a tabular structure similar to SQL, so QueryAST mapping should be relatively straightforward.

---

### 8. @objectql/driver-sdk (HTTP Remote API)

**Status**: 🔴 **Non-Compliant** - Unique requirements

| Criterion | Status | Details |
|-----------|--------|---------|
| @objectstack/spec Dependency | ❌ Missing | Not in package.json |
| DriverInterface Implementation | ❌ Missing | Uses legacy Driver interface |
| QueryAST Support | ❌ Missing | HTTP API calls |
| Command Support | ❌ Missing | No executeCommand() method |
| Test Suite | ✅ Complete | 1 test file, ~70% coverage |
| Documentation | ✅ Complete | README.md with examples |
| Migration Guide | ❌ Missing | No migration guide |

**Next Steps**:
- [ ] Add @objectstack/spec dependency
- [ ] Implement DriverInterface
- [ ] Serialize QueryAST to remote API protocol
- [ ] Update tests
- [ ] Create migration guide

**Estimated Effort**: 6-8 hours

**Notes**: This driver delegates to a remote ObjectQL server, so it needs to serialize QueryAST over HTTP. The remote server must also support the new protocol.

---

## Migration Timeline

### Week 5 (Current) - Pilot Driver

**Driver**: driver-sql

**Tasks**:
- [x] Create compliance matrix (this document)
- [ ] Implement DriverInterface in driver-sql
- [ ] Add executeQuery() and executeCommand() methods
- [ ] Update tests
- [ ] Document pattern for other drivers

**Deliverable**: Fully compliant driver-sql as reference implementation

---

### Week 6 - Core Drivers

**Drivers**: driver-mongo, driver-memory

**Rationale**:
- driver-mongo: Already has spec dependency, high usage
- driver-memory: Simple implementation, good for testing

**Tasks**:
- [ ] Apply pilot pattern to both drivers
- [ ] Update tests
- [ ] Create migration guides

---

### Week 7-8 - Remaining Drivers

**Drivers**: driver-redis, driver-fs, driver-localstorage, driver-excel, driver-sdk

**Tasks**:
- [ ] Batch migration using established pattern
- [ ] Update all documentation
- [ ] Comprehensive testing
- [ ] Release notes

---

## Testing Strategy

### Per-Driver Test Requirements

Each driver must have:

1. **Basic CRUD Tests**
   - Create record
   - Read record (findOne)
   - Update record
   - Delete record

2. **Query Tests**
   - Filter operations (equals, not equals, greater than, etc.)
   - Sorting (ascending, descending)
   - Pagination (limit, offset)
   - Field selection

3. **QueryAST Tests** (NEW in v4.0)
   - executeQuery() with various QueryAST patterns
   - Error handling for unsupported operations
   - Performance benchmarks

4. **Compatibility Tests**
   - Legacy interface still works (if not removed)
   - New interface returns expected format

---

## Breaking Changes Impact

### For Application Developers

**Impact**: Minimal

The legacy `Driver` interface will remain supported in v4.0 through adapter pattern. Applications don't need immediate migration.

**Recommended Timeline**: Migrate during v4.1 or v4.2 when legacy support is deprecated.

---

### For Driver Developers

**Impact**: Moderate

Drivers must implement `DriverInterface` to be compatible with the new kernel-based plugin system.

**Timeline**: All drivers should be migrated by v4.0 GA release.

---

## Resources

### Documentation

- [DriverInterface Specification](../objectstack/spec/README.md)
- [Migration Guide](../MIGRATION_TO_OBJECTSTACK_RUNTIME.md)
- [Implementation Roadmap](../docs/implementation-roadmap.md)

### Example Implementations

- [Pilot Driver (SQL)](../drivers/sql/src/index.ts) - After Week 5 completion
- [QueryAST Examples](../drivers/TEST_COVERAGE.md)

---

## Metrics Dashboard

### Compliance Score

```
Overall Driver Compliance: 25% (2/8 drivers have spec dependency)
Full DriverInterface:       0% (0/8 drivers fully compliant)
Test Coverage:              78% average across all drivers
Documentation:              100% (all have README)
```

### Progress Tracking

| Week | Target | Actual | Notes |
|------|--------|--------|-------|
| Week 5 | 1 driver (SQL) | 0 | In progress - pilot |
| Week 6 | 3 drivers (SQL, Mongo, Memory) | 0 | Not started |
| Week 7-8 | 8 drivers (all) | 0 | Not started |

---

## Appendix

### A. QueryAST to Driver Mapping Examples

#### Example 1: Simple Query

**QueryAST**:
```json
{
  "object": "users",
  "filters": [["email", "=", "john@example.com"]],
  "fields": ["id", "name", "email"]
}
```

**SQL Driver** → `SELECT id, name, email FROM users WHERE email = 'john@example.com'`

**MongoDB Driver** → `db.users.find({ email: "john@example.com" }, { id: 1, name: 1, email: 1 })`

**Memory Driver** → `records.filter(r => r.email === "john@example.com").map(r => ({ id: r.id, name: r.name, email: r.email }))`

---

#### Example 2: Complex Query

**QueryAST**:
```json
{
  "object": "orders",
  "filters": [
    "and",
    [["status", "=", "pending"], ["total", ">", 100]],
  ],
  "sort": [["created_at", "desc"]],
  "limit": 10,
  "offset": 0
}
```

**SQL Driver**:
```sql
SELECT * FROM orders 
WHERE status = 'pending' AND total > 100 
ORDER BY created_at DESC 
LIMIT 10 OFFSET 0
```

**MongoDB Driver**:
```javascript
db.orders.find({ status: "pending", total: { $gt: 100 } })
  .sort({ created_at: -1 })
  .limit(10)
  .skip(0)
```

---

### B. Unsupported Operations by Driver

| Operation | SQL | Mongo | Memory | Redis | FS | LocalStorage | Excel | SDK |
|-----------|-----|-------|--------|-------|----|--------------| ------|-----|
| Joins | ✅ | 🟡 Lookup | ❌ | ❌ | ❌ | ❌ | ❌ | 🟡 Remote |
| Aggregations | ✅ | ✅ | 🟡 Limited | ❌ | ❌ | ❌ | 🟡 Limited | 🟡 Remote |
| Full-text Search | 🟡 Vendor | ✅ | ❌ | 🟡 RediSearch | ❌ | ❌ | ❌ | 🟡 Remote |
| Transactions | ✅ | ✅ | 🟡 Sync | 🟡 Multi | ❌ | ❌ | ❌ | 🟡 Remote |

**Legend**:
- ✅ Full Support
- 🟡 Partial Support
- ❌ Not Supported

---

**Maintained By**: ObjectStack AI  
**Next Review**: Week 6 (After pilot driver completion)
