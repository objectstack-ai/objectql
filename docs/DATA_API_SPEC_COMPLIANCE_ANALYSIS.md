# Data API Spec Compliance Analysis

## Document Information
- **Created**: 2026-02-03
- **Version**: 1.0
- **Spec Reference**: @objectstack/spec v0.9.0
- **Analysis Scope**: Data API Protocol & Driver Implementation

## Executive Summary

This document provides a comprehensive analysis of the ObjectQL codebase compliance with the `@objectstack/spec` zod protocol requirements for Data API operations. The analysis covers all protocol implementations (REST, GraphQL, OData v4, JSON-RPC) and all driver implementations (SQL, MongoDB, Redis, Memory-based drivers, SDK).

### Key Findings

✅ **Strengths:**
- All drivers implement full QueryAST and FilterCondition support
- All protocols provide CRUD operations
- Strong separation of concerns (protocols → engine → drivers)
- Good test coverage across drivers

❌ **Critical Gaps:**
- **No zod schema validation** at protocol boundaries
- Missing operations: GraphQL count, OData $count, GraphQL aggregations
- Incomplete batch operation implementations
- No formal spec compliance validation

---

## 1. Protocol Layer Analysis

### 1.1 REST Protocol (`packages/protocols/rest`)

**Current Implementation:**
```typescript
// Generic JSON-RPC style API
POST /api
{
  "op": "find | findOne | create | update | delete | count",
  "object": "objectName",
  "args": { /* operation arguments */ },
  "user": { /* user context */ }
}
```

**Operations Supported:**
- ✅ CRUD: `find`, `findOne`, `create`, `update`, `delete`
- ✅ Count: `count`
- ✅ Batch: `createMany`, `updateMany`, `deleteMany`
- ✅ Actions: `action` (custom operations)
- ✅ Metadata: OpenAPI 3.0 spec generation

**Response Format:**
```typescript
{
  "items": [],      // For list operations
  "meta": {},       // Pagination metadata
  "data": {},       // For single item operations
  "error": {},      // Error information
  "@type": ""       // Type identifier
}
```

**Spec Compliance Issues:**

| Requirement | Status | Notes |
|-------------|--------|-------|
| Zod schema validation | ❌ | No @objectstack/spec import |
| Request validation | ⚠️ | TypeScript types only, no runtime validation |
| Response validation | ❌ | Duck-typed responses |
| Error codes per spec | ⚠️ | Custom error handling (ValidationError, PermissionError, ConflictError) |
| Batch operations per spec | ⚠️ | Implemented but not validated against spec |

**Recommendations:**
1. Import `@objectstack/spec/api` for REST server schemas
2. Add zod validation middleware using `RestApiConfigSchema`
3. Validate request/response using `Api.RestServer.*` schemas
4. Align error codes with `Api.Errors.*` from spec

---

### 1.2 GraphQL Protocol (`packages/protocols/graphql`)

**Current Implementation:**
- Apollo Server 4 with automatic schema generation
- Type-safe queries, mutations, subscriptions
- DataLoader for N+1 prevention
- Federation support

**Operations Supported:**
- ✅ Queries: `find*`, `getObject*` with filters, pagination
- ✅ Mutations: `create*`, `update*`, `delete*`
- ✅ Subscriptions: `*Created`, `*Updated`, `*Deleted` (WebSocket)
- ❌ Count queries: Not implemented
- ❌ Aggregate functions: No sum/avg/min/max

**Spec Compliance Issues:**

| Requirement | Status | Notes |
|-------------|--------|-------|
| Zod schema validation | ⚠️ | Has @objectstack/spec ^0.9.0 but not using zod |
| Count operations | ❌ | Missing `count*` queries |
| Aggregations | ❌ | No aggregate functions exposed |
| Batch queries | ❌ | No batch query support |
| Federation metadata | ✅ | Federation subgraph support exists |

**Missing Operations:**
```graphql
# Should implement:
type Query {
  countAccounts(where: FilterCondition): Int!
  aggregateOrders(
    groupBy: [String!]
    aggregations: [AggregationNode!]
  ): [AggregateResult!]!
}
```

**Recommendations:**
1. Add count query resolvers for all objects
2. Implement aggregate query resolvers
3. Add zod validation for GraphQL input objects
4. Consider DataLoader for batch aggregations

---

### 1.3 OData v4 Protocol (`packages/protocols/odata-v4`)

**Current Implementation:**
- Spec-compliant query options: `$filter`, `$select`, `$orderby`, `$top`, `$skip`, `$expand`
- Service document and $metadata endpoints (EDMX XML)
- $batch endpoint for multi-operation requests

**Operations Supported:**
- ✅ CRUD: GET, POST, PUT, PATCH, DELETE
- ✅ Service Document: `GET /odata/`
- ✅ Metadata: `GET /odata/$metadata`
- ⚠️ Batch: `$batch` with basic changesets
- ❌ Count: No `$count` endpoint
- ⚠️ Search: `$search` mentioned but limited implementation

**Spec Compliance Issues:**

| Requirement | Status | Notes |
|-------------|--------|-------|
| OData v4 spec | ✅ | Follows OData URL conventions |
| $count endpoint | ❌ | Not implemented |
| $batch error handling | ⚠️ | Limited error handling in changesets |
| ETags | ⚠️ | Mentioned in config, implementation unclear |
| Full-text search | ⚠️ | `$search` partial implementation |
| Zod validation | ⚠️ | Has @objectstack/spec ^0.9.0 but limited use |

**Missing Endpoints:**
```
GET /odata/Accounts/$count
GET /odata/Accounts?$count=true
```

**Recommendations:**
1. Implement `$count` endpoint per OData v4 spec
2. Enhance `$batch` error handling with spec-compliant error responses
3. Complete `$search` implementation
4. Add zod validation using `Api.OData.*` schemas from spec

---

### 1.4 JSON-RPC Protocol (`packages/protocols/json-rpc`)

**Current Implementation:**
- JSON-RPC 2.0 compliant
- 13 registered methods
- Batch request support with call chaining

**Registered Methods:**

**Object Operations:**
```
object.find(params)
object.get(params)
object.create(params)
object.update(params)
object.delete(params)
object.count(params)
```

**Metadata Operations:**
```
metadata.list()
metadata.get(params)
metadata.getAll()
```

**Action Operations:**
```
action.execute(params)
action.list(params)
```

**System Operations:**
```
system.listMethods()
system.describe(params)
```

**Session Operations (optional):**
```
session.create(params)
session.get(params)
session.set(params)
session.destroy(params)
```

**Spec Compliance Issues:**

| Requirement | Status | Notes |
|-------------|--------|-------|
| JSON-RPC 2.0 spec | ✅ | Compliant format |
| Batch requests | ✅ | Array-based with call chaining |
| Notifications | ✅ | No-id requests supported |
| Progress/SSE | ⚠️ | Partial implementation (TODO for Hono) |
| Error codes | ✅ | Standard JSON-RPC error codes |
| Zod validation | ⚠️ | Has @objectstack/spec ^0.9.0 but not enforcing |

**Recommendations:**
1. Complete SSE progress notifications for Hono adapter
2. Add zod validation for method parameters
3. Validate against `Api.Protocol.*` schemas from spec
4. Document call chaining syntax (`$1.result.id`)

---

## 2. Driver Layer Analysis

### 2.1 Overview

All drivers implement the base `Driver` interface and support QueryAST with FilterCondition.

| Driver | QueryAST | FilterCondition | Spec Import | Status |
|--------|----------|-----------------|-------------|--------|
| SQL | ✅ Full | ✅ Full | ⚠️ Indirect | Production |
| MongoDB | ✅ Full | ✅ Native | ⚠️ Indirect | Production |
| Redis | ✅ Full | ✅ Full | ⚠️ Indirect | Production |
| Memory | ✅ Mingo | ✅ Mingo | ⚠️ Indirect | Production |
| Excel | ✅ Inherited | ✅ Inherited | ⚠️ Indirect | Production |
| LocalStorage | ✅ Inherited | ✅ Inherited | ⚠️ Indirect | Production |
| FileSystem | ✅ Inherited | ✅ Inherited | ⚠️ Indirect | Production |
| SDK (Remote) | ✅ Full | ✅ Via QueryAST | ⚠️ Indirect | Production |

**Note:** All drivers depend on `@objectstack/spec` indirectly through `@objectql/types` but don't directly validate against zod schemas.

---

### 2.2 SQL Driver (`packages/drivers/sql`)

**Engine:** Knex.js (multi-database abstraction)

**Supported Databases:**
- PostgreSQL
- MySQL
- SQLite
- MSSQL
- Oracle

**QueryAST Implementation:**
```typescript
// Converts QueryAST to Knex query builder
function executeQuery(query: UnifiedQuery): Promise<any[]> {
  const knexQuery = knex(query.object);
  
  // WHERE clause (FilterCondition → SQL)
  if (query.where) {
    applyFilters(knexQuery, query.where);
  }
  
  // ORDER BY (SortNode[])
  if (query.orderBy) {
    query.orderBy.forEach(sort => {
      knexQuery.orderBy(sort.field, sort.order);
    });
  }
  
  // LIMIT/OFFSET
  if (query.limit) knexQuery.limit(query.limit);
  if (query.offset) knexQuery.offset(query.offset);
  
  return knexQuery;
}
```

**FilterCondition Support:**
- ✅ Comparison: `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`
- ✅ Set: `$in`, `$nin`
- ✅ String: `$contains`, `$startsWith`, `$endsWith`
- ✅ Logical: `$and`, `$or`
- ✅ Null checks: `$null`
- ✅ Array: `$elemMatch`, `$size`

**Spec Compliance:**
- ⚠️ FilterCondition evaluated manually, not using zod validation
- ⚠️ No formal validation that SQL output matches spec expectations

---

### 2.3 MongoDB Driver (`packages/drivers/mongo`)

**Engine:** Native MongoDB driver with aggregation pipelines

**QueryAST Implementation:**
```typescript
// Converts QueryAST to MongoDB aggregation pipeline
function executeQuery(query: UnifiedQuery): Promise<any[]> {
  const pipeline = [];
  
  // $match stage (FilterCondition → MongoDB filter)
  if (query.where) {
    pipeline.push({ $match: convertFilterCondition(query.where) });
  }
  
  // $sort stage
  if (query.orderBy) {
    const sortObj = {};
    query.orderBy.forEach(s => sortObj[s.field] = s.order === 'asc' ? 1 : -1);
    pipeline.push({ $sort: sortObj });
  }
  
  // $skip/$limit
  if (query.offset) pipeline.push({ $skip: query.offset });
  if (query.limit) pipeline.push({ $limit: query.limit });
  
  return collection.aggregate(pipeline).toArray();
}
```

**FilterCondition Support:**
- ✅ Native MongoDB-style filters (no conversion needed)
- ✅ All operators supported natively
- ✅ Aggregation pipelines for complex queries

**Spec Compliance:**
- ✅ FilterCondition format matches MongoDB native syntax
- ⚠️ No zod validation of filter structure

---

### 2.4 Memory-Based Drivers

**Base:** `MemoryDriver` (packages/drivers/memory)
**Extends:** Excel, LocalStorage, FileSystem drivers

**Query Engine:** Mingo (MongoDB-like query engine for JavaScript)

**QueryAST Implementation:**
```typescript
import mingo from 'mingo';

function executeQuery(query: UnifiedQuery): Promise<any[]> {
  let results = [...this.data];
  
  // WHERE clause (FilterCondition via Mingo)
  if (query.where) {
    const mingoQuery = new mingo.Query(query.where);
    results = results.filter(doc => mingoQuery.test(doc));
  }
  
  // ORDER BY
  if (query.orderBy) {
    const sortSpec = {};
    query.orderBy.forEach(s => sortSpec[s.field] = s.order === 'asc' ? 1 : -1);
    const cursor = mingo.find(results, {}, {});
    results = cursor.sort(sortSpec).all();
  }
  
  // LIMIT/OFFSET
  if (query.offset) results = results.slice(query.offset);
  if (query.limit) results = results.slice(0, query.limit);
  
  return results;
}
```

**FilterCondition Support:**
- ✅ Full MongoDB-style operators via Mingo
- ✅ High performance in-memory evaluation

**Spec Compliance:**
- ✅ FilterCondition matches spec through Mingo compatibility
- ⚠️ No formal validation

---

### 2.5 SDK Driver (Remote HTTP Client)

**Purpose:** HTTP client for remote ObjectQL servers

**API Support:**
- Legacy RPC endpoint
- Modern `executeQuery()` (QueryAST)
- Modern `executeCommand()` (mutations)

**QueryAST Implementation:**
```typescript
async executeQuery(query: UnifiedQuery): Promise<any> {
  const response = await fetch(`${this.baseUrl}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query)
  });
  
  if (!response.ok) {
    throw new Error(`Query failed: ${response.statusText}`);
  }
  
  return response.json();
}
```

**Additional Exports:**
- `DataApiClient` - RESTful Data API client
- `MetadataApiClient` - Metadata API introspection

**Spec Compliance:**
- ⚠️ No zod validation of requests/responses
- ⚠️ Error handling not aligned with spec error schemas

---

## 3. Critical Gaps & Recommendations

### 3.1 Missing Zod Validation

**Current State:**
- All packages depend on `@objectstack/spec` v0.9.0
- No packages use zod schemas for runtime validation
- Validation is duck-typed or handled at engine layer

**Impact:**
- No guarantee that API requests match spec
- No guarantee that driver implementations follow protocol
- Runtime errors instead of validation errors
- Poor developer experience (no clear error messages)

**Recommendation:**
```typescript
// Example: REST protocol should validate like this
import { z } from 'zod';
import { Api } from '@objectstack/spec';

// Validate incoming request
const validatedRequest = Api.RestServer.RequestSchema.parse(req.body);

// Validate outgoing response
const validatedResponse = Api.RestServer.ResponseSchema.parse(response);
```

**Action Items:**
1. ✅ Add zod validation middleware to all protocols
2. ✅ Validate all requests at protocol boundary
3. ✅ Validate all responses before sending
4. ✅ Create comprehensive error messages for validation failures
5. ✅ Add integration tests for schema validation

---

### 3.2 Missing Operations

**GraphQL Protocol:**
```graphql
# Missing count operation
type Query {
  # Current: find*, getObject*
  # Missing:
  countAccounts(where: FilterCondition): Int!
  countOrders(where: FilterCondition): Int!
  # etc. for all objects
}

# Missing aggregations
type Query {
  # Missing:
  aggregateOrders(
    where: FilterCondition
    groupBy: [String!]
    aggregations: [AggregationNode!]!
  ): [AggregateResult!]!
}
```

**OData v4 Protocol:**
```
# Missing $count endpoint
GET /odata/Accounts/$count
GET /odata/Accounts?$count=true

# Should return:
200 OK
Content-Type: text/plain

42
```

**Action Items:**
1. ✅ Implement count resolvers in GraphQL
2. ✅ Implement $count endpoint in OData v4
3. ✅ Implement aggregate resolvers in GraphQL
4. ✅ Add tests for new operations

---

### 3.3 Incomplete Batch Operations

**JSON-RPC:**
- SSE progress notifications marked as "TODO" for Hono adapter
- Call chaining works but needs better documentation

**OData:**
- $batch changesets have limited error handling
- Need transaction rollback on changeset failure

**GraphQL:**
- No batch query support (all queries must be in single request)

**Action Items:**
1. ✅ Complete SSE implementation for JSON-RPC
2. ✅ Enhance OData $batch error handling
3. ⚠️ Consider GraphQL batch queries (low priority, not in spec)
4. ✅ Add integration tests for batch operations

---

### 3.4 Driver Interface Validation

**Current State:**
- Drivers implement interface via TypeScript
- No runtime validation that methods exist
- No validation of method signatures

**Recommendation:**
```typescript
import { z } from 'zod';
import { Data } from '@objectstack/spec';

// Validate driver at registration
const validatedDriver = Data.DriverSchema.parse(driver);

// Runtime validation of method calls
const validateFind = Data.Driver.FindMethodSchema.parse({
  object: 'account',
  query: { where: { ... } }
});
```

**Action Items:**
1. ⚠️ Add runtime validation when drivers register (low priority)
2. ⚠️ Validate method signatures at runtime (low priority)
3. ✅ Add driver compliance tests to TCK (Technology Compatibility Kit)

---

## 4. Development Roadmap

### Phase 1: Zod Validation Integration (Priority: HIGH) 🔴

**Timeline:** 2-3 weeks

**Tasks:**
1. **REST Protocol Validation**
   - [ ] Import `@objectstack/spec/api` schemas
   - [ ] Create validation middleware
   - [ ] Validate request body using `RestApiConfigSchema`
   - [ ] Validate responses using spec schemas
   - [ ] Add error mapping for validation failures
   - [ ] Write integration tests

2. **GraphQL Protocol Validation**
   - [ ] Add zod validation for GraphQL inputs
   - [ ] Validate resolver arguments
   - [ ] Map GraphQL errors to spec error codes
   - [ ] Write integration tests

3. **OData v4 Protocol Validation**
   - [ ] Validate query string parameters
   - [ ] Validate request bodies
   - [ ] Validate $batch requests
   - [ ] Write integration tests

4. **JSON-RPC Protocol Validation**
   - [ ] Validate method parameters
   - [ ] Validate batch requests
   - [ ] Validate responses
   - [ ] Write integration tests

**Deliverables:**
- All protocols validate requests/responses with zod
- Comprehensive error messages
- 100% test coverage for validation

---

### Phase 2: Missing Operations (Priority: HIGH) 🔴

**Timeline:** 2-3 weeks

**Tasks:**
1. **GraphQL Count Operations**
   - [ ] Add count query resolvers
   - [ ] Generate count queries for all objects
   - [ ] Add tests

2. **OData $count Endpoint**
   - [ ] Implement `GET /odata/{object}/$count`
   - [ ] Implement `?$count=true` query parameter
   - [ ] Add tests

3. **GraphQL Aggregations**
   - [ ] Design aggregation resolver schema
   - [ ] Implement aggregate resolvers
   - [ ] Support groupBy + aggregations
   - [ ] Add tests

**Deliverables:**
- GraphQL count queries for all objects
- OData $count endpoint
- GraphQL aggregation queries
- Full test coverage

---

### Phase 3: Batch Operations (Priority: MEDIUM) 🟡

**Timeline:** 1-2 weeks

**Tasks:**
1. **JSON-RPC SSE Progress**
   - [ ] Complete SSE implementation for Hono
   - [ ] Add progress callbacks
   - [ ] Document usage
   - [ ] Add tests

2. **OData $batch Enhancement**
   - [ ] Improve changeset error handling
   - [ ] Add transaction rollback
   - [ ] Add atomic batch operations
   - [ ] Add tests

3. **Documentation**
   - [ ] Document batch operation usage
   - [ ] Document call chaining (JSON-RPC)
   - [ ] Add examples

**Deliverables:**
- SSE progress for JSON-RPC
- Enhanced OData $batch
- Comprehensive documentation

---

### Phase 4: Documentation & Testing (Priority: MEDIUM) 🟡

**Timeline:** 1-2 weeks

**Tasks:**
1. **Protocol Compliance Documentation**
   - [ ] Document spec compliance for each protocol
   - [ ] Create comparison matrix
   - [ ] Add migration guide

2. **Integration Tests**
   - [ ] Add TCK tests for protocols
   - [ ] Add TCK tests for drivers
   - [ ] Add end-to-end tests

3. **API Documentation**
   - [ ] Update OpenAPI specs
   - [ ] Update GraphQL schema docs
   - [ ] Update OData metadata

**Deliverables:**
- Comprehensive compliance documentation
- TCK test suite
- Updated API documentation

---

### Phase 5: Type Safety (Priority: LOW) ⚪

**Timeline:** 1 week

**Tasks:**
1. **Driver Validation**
   - [ ] Add runtime driver validation
   - [ ] Validate method signatures
   - [ ] Add type guards

2. **Metadata Validation**
   - [ ] Validate metadata against spec schemas
   - [ ] Add runtime checks for field definitions
   - [ ] Add type guards

**Deliverables:**
- Runtime driver validation
- Metadata validation
- Type guards for all operations

---

## 5. Success Criteria

### Phase 1 Success Criteria
✅ All protocols validate requests/responses with zod schemas  
✅ All validation errors map to spec error codes  
✅ 100% test coverage for validation  
✅ No runtime errors due to invalid data  

### Phase 2 Success Criteria
✅ GraphQL count queries work for all objects  
✅ OData $count endpoint returns correct counts  
✅ GraphQL aggregations support all aggregation functions  
✅ All new operations have tests  

### Phase 3 Success Criteria
✅ JSON-RPC SSE progress works in Hono  
✅ OData $batch handles errors correctly  
✅ All batch operations are documented  
✅ Batch operations have integration tests  

### Phase 4 Success Criteria
✅ All protocols documented for spec compliance  
✅ TCK test suite passes for all protocols/drivers  
✅ API documentation is up to date  

### Phase 5 Success Criteria
✅ Runtime driver validation prevents invalid drivers  
✅ Metadata validation catches schema errors  
✅ Type guards prevent type errors  

---

## 6. Conclusion

The ObjectQL codebase demonstrates strong architectural foundations with comprehensive driver support and multiple protocol implementations. However, there is a significant gap between the current implementation and the formal `@objectstack/spec` zod protocol requirements.

**Key Takeaways:**
1. **High Priority:** Integrate zod validation at all protocol boundaries
2. **High Priority:** Implement missing operations (count, aggregations)
3. **Medium Priority:** Complete batch operation implementations
4. **Medium Priority:** Add comprehensive documentation and testing
5. **Low Priority:** Add runtime type safety improvements

The proposed 5-phase development plan provides a clear path forward to achieve full spec compliance while maintaining backward compatibility and minimizing breaking changes.

---

## Appendix A: Spec Schema Reference

### Key Schemas from @objectstack/spec

**Data Schemas:**
- `Data.QueryASTSchema` - Unified query structure
- `Data.FilterConditionSchema` - Filter conditions
- `Data.SortNodeSchema` - Sort order
- `Data.AggregationNodeSchema` - Aggregation functions

**API Schemas:**
- `Api.RestServer.*` - REST API configuration & endpoints
- `Api.Protocol.*` - JSON-RPC protocol
- `Api.OData.*` - OData v4 protocol
- `Api.GraphQL.*` - GraphQL protocol
- `Api.Batch.*` - Batch operations
- `Api.Errors.*` - Error codes and structures

**Driver Schemas:**
- `Data.DriverSchema` - Driver interface
- `Data.DriverConfigSchema` - Driver configuration

---

## Appendix B: Testing Strategy

### Unit Tests
- Zod schema validation
- FilterCondition evaluation
- QueryAST normalization
- Error mapping

### Integration Tests
- Protocol request/response validation
- Driver QueryAST execution
- Batch operations
- Error handling

### TCK Tests (Technology Compatibility Kit)
- Driver compliance tests
- Protocol compliance tests
- Cross-driver compatibility
- Cross-protocol compatibility

### End-to-End Tests
- Full stack operations
- Multi-protocol scenarios
- Real-world use cases
- Performance benchmarks

---

## Document Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-03 | 1.0 | Initial analysis and roadmap |
