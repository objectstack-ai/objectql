# Phase 2 Implementation Plan

**Project**: ObjectStack Protocol Compliance Development  
**Phase**: Phase 2 - Advanced Protocol Features (P1)  
**Duration**: 4-6 weeks  
**Priority**: High  
**Status**: 🔄 READY TO START

---

## Overview

Phase 2 focuses on implementing advanced protocol features that will bring ObjectStack to 95%+ protocol compliance. This phase includes GraphQL subscriptions, OData batch operations, and system-wide improvements.

---

## Objectives

1. ✅ Implement GraphQL subscriptions with WebSocket support
2. ✅ Add OData V4 $batch operations
3. ✅ Remove legacy query format support
4. ✅ Create comprehensive protocol integration tests
5. ✅ Achieve 95%+ overall protocol compliance

---

## Detailed Implementation Plan

### 2.1 GraphQL Subscriptions (2 weeks)

**Priority**: P1 - High  
**Estimated Time**: 2 weeks  
**Complexity**: High

#### Week 1: WebSocket Infrastructure

**Tasks**:
- [ ] Set up WebSocket server using `graphql-ws`
- [ ] Implement connection management
  - [ ] Connection lifecycle (connect, subscribe, unsubscribe, disconnect)
  - [ ] Authentication and authorization
  - [ ] Connection heartbeat/ping-pong
- [ ] Implement PubSub engine
  - [ ] In-memory PubSub for development
  - [ ] Redis PubSub for production
  - [ ] Event routing and filtering
- [ ] Add error handling and recovery

**Deliverables**:
- WebSocket server running on configurable port
- Connection manager with authentication
- PubSub engine with Redis backend option

**Files to Create/Modify**:
- `packages/protocols/graphql/src/subscriptions/server.ts`
- `packages/protocols/graphql/src/subscriptions/pubsub.ts`
- `packages/protocols/graphql/src/subscriptions/connection.ts`

#### Week 2: Subscription Resolvers

**Tasks**:
- [ ] Generate Subscription type in schema
- [ ] Implement subscription resolvers
  - [ ] `objectCreated(objectName: String!)`
  - [ ] `objectUpdated(objectName: String!, where: FilterInput)`
  - [ ] `objectDeleted(objectName: String!)`
- [ ] Integrate with ObjectQL hooks
  - [ ] afterCreate → publish create event
  - [ ] afterUpdate → publish update event
  - [ ] afterDelete → publish delete event
- [ ] Implement subscription filtering
- [ ] Add subscription tests

**Example Subscription**:
```graphql
subscription {
  userCreated {
    _id
    name
    email
    createdAt
  }
}

subscription {
  userUpdated(where: { status: "active" }) {
    _id
    name
    status
    updatedAt
  }
}
```

**Deliverables**:
- Subscription resolvers for all objects
- Hook integration for real-time events
- Comprehensive subscription tests

**Files to Create/Modify**:
- `packages/protocols/graphql/src/subscriptions/resolvers.ts`
- `packages/protocols/graphql/src/subscriptions/hooks.ts`
- `packages/protocols/graphql/src/subscriptions/index.test.ts`

**Test Coverage Target**: 90%+

---

### 2.2 OData V4 $batch Operations (1 week)

**Priority**: P1 - High  
**Estimated Time**: 1 week  
**Complexity**: Medium

**Tasks**:
- [ ] Implement multipart/mixed parser
  - [ ] Parse batch request headers
  - [ ] Extract individual requests
  - [ ] Support changeset boundaries
- [ ] Implement batch request handler
  - [ ] Execute requests sequentially
  - [ ] Support changesets (transactions)
  - [ ] Handle dependencies between requests
- [ ] Implement multipart/mixed response builder
  - [ ] Generate batch response
  - [ ] Include individual response statuses
  - [ ] Handle partial failures
- [ ] Add error handling
  - [ ] Validate batch structure
  - [ ] Handle individual request errors
  - [ ] Transaction rollback on changeset failure
- [ ] Add batch operation tests

**Example Batch Request**:
```http
POST /odata/$batch
Content-Type: multipart/mixed; boundary=batch_123

--batch_123
Content-Type: application/http

GET /odata/users('1') HTTP/1.1

--batch_123
Content-Type: multipart/mixed; boundary=changeset_456

--changeset_456
Content-Type: application/http

POST /odata/users HTTP/1.1
Content-Type: application/json

{"name": "John"}

--changeset_456--
--batch_123--
```

**Deliverables**:
- $batch endpoint implementation
- Changeset transaction support
- Error handling and rollback
- Comprehensive tests

**Files to Create/Modify**:
- `packages/protocols/odata-v4/src/batch-parser.ts`
- `packages/protocols/odata-v4/src/batch-handler.ts`
- `packages/protocols/odata-v4/src/batch-response.ts`
- `packages/protocols/odata-v4/src/batch.test.ts`

**Test Coverage Target**: 85%+

---

### 2.3 Legacy Query Format Removal (1 week)

**Priority**: P1 - High  
**Estimated Time**: 1 week  
**Complexity**: Low

**Affected Drivers**:
- Excel driver
- FS driver

**Tasks**:
- [ ] **Week 1: Audit and Documentation**
  - [ ] Audit all legacy format usage
  - [ ] Document migration path
  - [ ] Create migration guide
  - [ ] Add deprecation warnings
  
- [ ] **Excel Driver Cleanup**:
  - [ ] Remove legacy query format support
  - [ ] Update tests to use QueryAST only
  - [ ] Update documentation
  
- [ ] **FS Driver Cleanup**:
  - [ ] Remove legacy query format support
  - [ ] Update tests to use QueryAST only
  - [ ] Update documentation

**Migration Guide Contents**:
```markdown
# Migration from Legacy Query Format to QueryAST

## Legacy Format (Deprecated)
{
  filters: [['status', '=', 'active']],
  sort: [['name', 'asc']],
  skip: 10,
  limit: 20
}

## QueryAST Format (Current)
{
  where: {
    status: { $eq: 'active' }
  },
  orderBy: [
    { field: 'name', order: 'ASC' }
  ],
  offset: 10,
  limit: 20
}
```

**Deliverables**:
- Migration guide document
- Updated drivers (Excel, FS)
- Updated tests
- Deprecation warnings in code

**Files to Create/Modify**:
- `docs/migration/legacy-to-queryast.md`
- `packages/drivers/excel/src/index.ts`
- `packages/drivers/fs/src/index.ts`
- Driver test files

---

### 2.4 Protocol Integration Tests (1 week)

**Priority**: P1 - High  
**Estimated Time**: 1 week  
**Complexity**: Medium

**Test Suites**:

1. **Cross-Protocol Scenarios**
   - [ ] Same data, different protocol access
   - [ ] Protocol switching tests
   - [ ] Data consistency across protocols

2. **Security Integration**
   - [ ] RBAC enforcement in all protocols
   - [ ] FLS (Field-Level Security) tests
   - [ ] RLS (Row-Level Security) tests
   - [ ] Permission validation across protocols

3. **Performance Benchmarks**
   - [ ] Load testing for each protocol
   - [ ] Performance comparison
   - [ ] N+1 query detection
   - [ ] Response time benchmarks

**Example Test Structure**:
```typescript
describe('Cross-Protocol Integration', () => {
  it('should maintain data consistency across protocols', async () => {
    // Create via GraphQL
    const user = await graphqlClient.mutate({...});
    
    // Read via OData
    const odataUser = await odataClient.get(`/users('${user.id}')`);
    
    // Read via JSON-RPC
    const rpcUser = await rpcClient.call('object.get', {...});
    
    // All should return same data
    expect(odataUser).toEqual(rpcUser);
  });
});
```

**Deliverables**:
- Cross-protocol test suite
- Security integration tests
- Performance benchmark suite
- Test documentation

**Files to Create**:
- `packages/integration-tests/cross-protocol.test.ts`
- `packages/integration-tests/security.test.ts`
- `packages/integration-tests/performance.test.ts`

**Test Coverage Target**: 90%+

---

## Success Criteria

### Functional Requirements
- [x] GraphQL subscriptions working with WebSocket
- [x] OData $batch operations functional
- [x] Legacy query formats removed
- [x] All integration tests passing

### Performance Requirements
- [x] Subscription latency < 100ms
- [x] Batch operations 50% faster than individual requests
- [x] No N+1 query issues detected

### Quality Requirements
- [x] Test coverage > 90%
- [x] Zero security vulnerabilities
- [x] All linters passing
- [x] Documentation complete

### Compliance Requirements
- [x] GraphQL: 95%+ compliance
- [x] OData V4: 95%+ compliance
- [x] JSON-RPC: 100% compliance
- [x] Overall: 95%+ compliance score

---

## Dependencies

### External Libraries
- `graphql-ws` - GraphQL WebSocket server
- `ws` - WebSocket library
- `graphql-subscriptions` - PubSub utilities
- `redis` (optional) - Production PubSub backend

### Internal Dependencies
- `@objectql/core` - Runtime and hooks
- `@objectql/types` - Type definitions
- `@objectstack/spec` - Protocol specifications

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| WebSocket complexity | Medium | High | Use proven libraries (graphql-ws) |
| $batch transaction handling | Low | Medium | Comprehensive testing |
| Breaking changes in cleanup | Low | High | Deprecation warnings, migration guide |
| Performance degradation | Low | Medium | Benchmark testing |

---

## Timeline

```
Week 1-2: GraphQL Subscriptions
  Week 1: WebSocket infrastructure
  Week 2: Subscription resolvers

Week 3: OData V4 $batch operations

Week 4: Legacy format removal
  Days 1-2: Excel driver
  Days 3-4: FS driver
  Day 5: Documentation

Week 5-6: Integration testing
  Week 5: Cross-protocol and security tests
  Week 6: Performance benchmarks and optimization
```

---

## Deliverables Checklist

### Code
- [ ] GraphQL subscription implementation
- [ ] OData $batch implementation
- [ ] Excel driver cleanup
- [ ] FS driver cleanup
- [ ] Integration test suites

### Documentation
- [ ] GraphQL subscription guide
- [ ] OData $batch documentation
- [ ] Legacy format migration guide
- [ ] Integration test documentation
- [ ] Updated API references

### Testing
- [ ] Subscription unit tests
- [ ] Subscription integration tests
- [ ] Batch operation tests
- [ ] Cross-protocol tests
- [ ] Security integration tests
- [ ] Performance benchmarks

---

## Next Phase Preview

### Phase 3: Federation & Optimization (P2)
- Apollo Federation support
- DataLoader integration
- Advanced OData features ($search, $apply)
- Documentation enhancements

**Estimated Start**: Week 7

---

## Conclusion

Phase 2 will significantly enhance ObjectStack's protocol capabilities, bringing it to 95%+ compliance while maintaining security, performance, and code quality standards.

**Status**: Ready to begin implementation ✅
