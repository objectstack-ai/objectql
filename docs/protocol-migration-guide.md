# Protocol Migration Guide

Complete guide for migrating between ObjectQL protocol implementations.

**Version:** 4.0.5  
**Last Updated:** February 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Migration Scenarios](#migration-scenarios)
3. [REST to GraphQL](#rest-to-graphql)
4. [REST to OData V4](#rest-to-odata-v4)
5. [GraphQL to REST](#graphql-to-rest)
6. [OData to REST](#odata-to-rest)
7. [Any Protocol to JSON-RPC](#any-protocol-to-json-rpc)
8. [Multi-Protocol Strategy](#multi-protocol-strategy)
9. [Migration Checklist](#migration-checklist)
10. [Troubleshooting](#troubleshooting)

---

## Overview

ObjectQL's architecture allows you to run **multiple protocols simultaneously** on the same data model, making migration painless. You don't need to choose one protocol exclusively—you can support multiple protocols during transition periods.

### Migration Principles

1. **Zero Downtime**: Add new protocols without disrupting existing services
2. **Gradual Transition**: Migrate clients incrementally
3. **Feature Parity**: All protocols access the same data and business logic
4. **Backward Compatibility**: Keep old protocols active during migration

---

## Migration Scenarios

### Common Migration Paths

```
REST API → GraphQL      (For modern web/mobile apps)
REST API → OData V4     (For enterprise integration)
Custom API → JSON-RPC   (For microservices)
Legacy → Multi-Protocol (Support all clients)
```

### Decision Matrix

| Current State | Target Protocol | Effort | Timeline | Recommendation |
|---------------|----------------|--------|----------|----------------|
| Custom REST | GraphQL | Medium | 2-4 weeks | ⭐ High Value |
| Custom REST | OData V4 | Low | 1-2 weeks | ⭐ Enterprise |
| GraphQL | REST | Low | 1 week | Backwards compat |
| No API | Multi-Protocol | Medium | 2-3 weeks | ⭐⭐ Best Start |

---

## REST to GraphQL

### Why Migrate?

✅ **Benefits:**
- Eliminate over-fetching and under-fetching
- Single endpoint for all operations
- Strongly typed schema
- Real-time subscriptions
- Better developer experience

⚠️ **Considerations:**
- Client libraries need updating
- Caching requires custom solution
- Learning curve for team

### Step-by-Step Migration

#### 1. Add GraphQL Protocol (Parallel Running)

```typescript
// objectql.config.ts
import { ObjectKernel } from '@objectstack/core';
import { RESTPlugin } from '@objectql/protocol-rest';
import { GraphQLPlugin } from '@objectql/protocol-graphql';

const kernel = new ObjectKernel([
  // Keep existing REST API
  new RESTPlugin({
    basePath: '/api',
    port: 3000
  }),
  
  // Add GraphQL protocol
  new GraphQLPlugin({
    port: 4000,
    introspection: true,
    playground: true
  })
]);

await kernel.start();
```

Now both protocols run simultaneously:
- REST: `http://localhost:3000/api/*`
- GraphQL: `http://localhost:4000/`

#### 2. Map REST Endpoints to GraphQL

| REST Endpoint | GraphQL Query/Mutation |
|---------------|------------------------|
| `GET /api/users` | `query { usersList { ... } }` |
| `GET /api/users/:id` | `query { users(id: "...") { ... } }` |
| `POST /api/users` | `mutation { createUsers(data: {...}) { ... } }` |
| `PATCH /api/users/:id` | `mutation { updateUsers(id: "...", data: {...}) { ... } }` |
| `DELETE /api/users/:id` | `mutation { deleteUsers(id: "...") }` |

#### 3. Update Client Code

**Before (REST):**
```javascript
// Fetch user with projects (2 requests)
const user = await fetch('/api/users/123').then(r => r.json());
const projects = await fetch(`/api/projects?user_id=${user.id}`).then(r => r.json());
```

**After (GraphQL):**
```javascript
// Single request with exact fields needed
const query = `
  query {
    users(id: "123") {
      id
      name
      email
      projects {
        id
        name
        status
      }
    }
  }
`;

const response = await fetch('http://localhost:4000/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query })
});

const { data } = await response.json();
```

#### 4. Gradual Client Migration

**Strategy A: Feature Flags**
```javascript
const USE_GRAPHQL = process.env.FEATURE_GRAPHQL === 'true';

const fetchUser = USE_GRAPHQL 
  ? fetchUserGraphQL 
  : fetchUserREST;
```

**Strategy B: New Clients First**
- Mobile app v2.0 → GraphQL
- Web app v3.0 → GraphQL  
- Legacy clients → Keep REST

#### 5. Monitor & Validate

Track usage metrics:
```javascript
// Monitor API usage
const metrics = {
  rest: { requests: 1000, users: 50 },
  graphql: { requests: 5000, users: 200 }
};

// When REST traffic drops to <5%, consider deprecation
```

#### 6. Deprecate REST (Optional)

After 90% migration:
```typescript
// Remove REST plugin
const kernel = new ObjectKernel([
  new GraphQLPlugin({ port: 4000 })
]);
```

### Field Mapping Reference

| REST Pattern | GraphQL Equivalent |
|--------------|-------------------|
| `?fields=name,email` | Field selection in query |
| `?limit=10&skip=20` | `usersList(first: 10, after: "cursor")` |
| `?sort=-created_at` | `orderBy: { created_at: DESC }` |
| `?active=true` | `where: { active: true }` |
| `?expand=projects` | Nested field selection |

---

## REST to OData V4

### Why Migrate?

✅ **Benefits:**
- Rich query capabilities ($filter, $expand, $search)
- Industry standard (OASIS)
- Excellent enterprise tool support
- Built-in metadata ($metadata)
- Batch operations with transactions

⚠️ **Considerations:**
- Complex query syntax
- Steeper learning curve
- Requires OData-aware clients

### Step-by-Step Migration

#### 1. Add OData Protocol

```typescript
import { ODataV4Plugin } from '@objectql/protocol-odata-v4';

const kernel = new ObjectKernel([
  // Keep REST
  new RESTPlugin({ basePath: '/api', port: 3000 }),
  
  // Add OData
  new ODataV4Plugin({
    basePath: '/odata',
    port: 3001,
    namespace: 'MyApp'
  })
]);
```

Endpoints:
- REST: `http://localhost:3000/api/*`
- OData: `http://localhost:3001/odata/*`

#### 2. Entity Mapping

In OData, REST "resources" become "EntitySets":

| REST | OData V4 |
|------|----------|
| `/api/users` | `/odata/Users` |
| `/api/users/123` | `/odata/Users('123')` |
| `/api/projects` | `/odata/Projects` |

#### 3. Query Translation

**REST Query:**
```
GET /api/users?active=true&sort=-created_at&limit=10&skip=20
```

**OData Query:**
```
GET /odata/Users?$filter=active eq true&$orderby=created_at desc&$top=10&$skip=20
```

**REST Expand:**
```
GET /api/users/123?expand=projects
```

**OData Expand:**
```
GET /odata/Users('123')?$expand=projects($select=name,status)
```

#### 4. Update Client Libraries

**Option A: JavaScript Client**
```javascript
// Using o-data client library
import ODataClient from 'o-data';

const client = ODataClient('http://localhost:3001/odata');

// Query users
const users = await client
  .entitySet('Users')
  .filter({ active: true })
  .orderBy('created_at', 'desc')
  .top(10)
  .get();
```

**Option B: C# / .NET**
```csharp
// OData Client for .NET
var context = new Container(new Uri("http://localhost:3001/odata"));

var users = await context.Users
    .Where(u => u.Active == true)
    .OrderByDescending(u => u.CreatedAt)
    .Take(10)
    .ToListAsync();
```

#### 5. Leverage OData Features

**Batch Operations:**
```http
POST /odata/$batch
Content-Type: multipart/mixed; boundary=batch_boundary

--batch_boundary
Content-Type: multipart/mixed; boundary=changeset_boundary

--changeset_boundary
Content-Type: application/http
Content-Transfer-Encoding: binary

POST Users HTTP/1.1
Content-Type: application/json

{"name": "Alice", "email": "alice@example.com"}

--changeset_boundary
Content-Type: application/http
Content-Transfer-Encoding: binary

POST Projects HTTP/1.1
Content-Type: application/json

{"name": "Project A", "owner": "Alice"}

--changeset_boundary--
--batch_boundary--
```

**Full-Text Search:**
```
GET /odata/Users?$search=alice
```

**Metadata Discovery:**
```
GET /odata/$metadata
```

---

## GraphQL to REST

### Why Migrate?

Sometimes you need to go back to REST for:
- Better HTTP caching
- Simpler client requirements
- Legacy system integration
- Public API compatibility

### Migration Steps

#### 1. Add REST Protocol

```typescript
const kernel = new ObjectKernel([
  new GraphQLPlugin({ port: 4000 }),  // Keep GraphQL
  new RESTPlugin({ basePath: '/api', port: 3000 })  // Add REST
]);
```

#### 2. Map GraphQL to REST

| GraphQL | REST |
|---------|------|
| `query { users { ... } }` | `GET /api/users` |
| `query { users(id: "123") { ... } }` | `GET /api/users/123` |
| `mutation { createUsers(...) { ... } }` | `POST /api/users` |
| `mutation { updateUsers(...) { ... } }` | `PATCH /api/users/:id` |

#### 3. Handle Over-fetching

GraphQL allows precise field selection; REST returns all fields by default.

**GraphQL:**
```graphql
query {
  users {
    id
    name
  }
}
```

**REST Equivalent:**
```
GET /api/users?fields=id,name
```

#### 4. Handle Nested Data

**GraphQL (Single Request):**
```graphql
query {
  users(id: "123") {
    name
    projects {
      name
      tasks {
        title
      }
    }
  }
}
```

**REST (Multiple Requests or Expand):**
```bash
# Option 1: Multiple requests
GET /api/users/123
GET /api/projects?user_id=123
GET /api/tasks?project_id=...

# Option 2: Use expand parameter
GET /api/users/123?expand=projects,projects.tasks
```

---

## Any Protocol to JSON-RPC

### Why JSON-RPC?

✅ **Benefits:**
- Simple, predictable API
- Native batch support
- 100% JSON-RPC 2.0 compliant
- SSE progress notifications
- Perfect for microservices

### Universal Migration

JSON-RPC works as a universal translation layer:

```typescript
const kernel = new ObjectKernel([
  new JSONRPCPlugin({
    basePath: '/rpc',
    enableProgress: true,
    enableChaining: true
  })
]);
```

#### Operation Mapping

| Operation | JSON-RPC Method |
|-----------|----------------|
| Create | `object.create` |
| Read | `object.findOne` |
| Update | `object.update` |
| Delete | `object.delete` |
| Query | `object.find` |
| Count | `object.count` |

#### Example Conversions

**REST to JSON-RPC:**
```javascript
// REST
POST /api/users
{"name": "Alice"}

// JSON-RPC
{
  "jsonrpc": "2.0",
  "method": "object.create",
  "params": ["users", {"name": "Alice"}],
  "id": 1
}
```

**GraphQL to JSON-RPC:**
```javascript
// GraphQL
mutation {
  createUsers(data: {name: "Alice"}) {
    id name
  }
}

// JSON-RPC
{
  "jsonrpc": "2.0",
  "method": "object.create",
  "params": ["users", {"name": "Alice"}],
  "id": 1
}
```

#### Batch Operations

JSON-RPC has first-class batch support:

```javascript
[
  {
    "jsonrpc": "2.0",
    "method": "object.create",
    "params": ["projects", {"name": "Project A"}],
    "id": 1
  },
  {
    "jsonrpc": "2.0",
    "method": "object.create",
    "params": ["tasks", {
      "project": "$1.result._id",  // Reference previous result
      "name": "Task 1"
    }],
    "id": 2
  }
]
```

---

## Multi-Protocol Strategy

### Running All Protocols Simultaneously

The recommended approach for maximum flexibility:

```typescript
import { ObjectKernel } from '@objectstack/core';
import { RESTPlugin } from '@objectql/protocol-rest';
import { GraphQLPlugin } from '@objectql/protocol-graphql';
import { ODataV4Plugin } from '@objectql/protocol-odata-v4';
import { JSONRPCPlugin } from '@objectql/protocol-json-rpc';

const kernel = new ObjectKernel([
  // REST for public API
  new RESTPlugin({
    basePath: '/api',
    enableOpenAPI: true
  }),
  
  // GraphQL for web/mobile apps
  new GraphQLPlugin({
    port: 4000,
    introspection: true,
    playground: true
  }),
  
  // OData for enterprise integration
  new ODataV4Plugin({
    basePath: '/odata',
    namespace: 'MyApp'
  }),
  
  // JSON-RPC for microservices
  new JSONRPCPlugin({
    basePath: '/rpc',
    enableProgress: true
  })
]);

await kernel.start();
```

### Endpoint Layout

```
http://localhost:3000/api/*         → REST
http://localhost:4000/              → GraphQL
http://localhost:3000/odata/*       → OData V4
http://localhost:3000/rpc           → JSON-RPC
```

### Use Case Routing

Route different clients to optimal protocols:

| Client Type | Protocol | Reason |
|-------------|----------|--------|
| Web App | GraphQL | Efficient querying |
| Mobile App | GraphQL | Bandwidth optimization |
| Public API | REST | Universal compatibility |
| Enterprise Systems | OData V4 | Standard compliance |
| Internal Services | JSON-RPC | Simple RPC |
| Legacy Systems | REST | Compatibility |

---

## Migration Checklist

### Pre-Migration

- [ ] Audit current API usage and traffic patterns
- [ ] Identify critical endpoints and consumers
- [ ] Choose target protocol(s)
- [ ] Set up staging environment
- [ ] Create rollback plan

### During Migration

- [ ] Install and configure target protocol
- [ ] Test protocol functionality
- [ ] Map all endpoints/operations
- [ ] Update client SDKs
- [ ] Create migration documentation
- [ ] Train development team
- [ ] Set up monitoring

### Post-Migration

- [ ] Monitor error rates
- [ ] Track performance metrics
- [ ] Collect user feedback
- [ ] Fix issues promptly
- [ ] Update API documentation
- [ ] Deprecate old protocol (if applicable)

### Testing Checklist

- [ ] All CRUD operations work
- [ ] Filtering/querying works correctly
- [ ] Pagination works
- [ ] Sorting works
- [ ] Batch operations work (if applicable)
- [ ] Error handling is correct
- [ ] Authentication/authorization works
- [ ] Performance is acceptable
- [ ] Load testing passed

---

## Troubleshooting

### Common Issues

#### Issue: Protocol not accessible

**Symptom:** Cannot connect to new protocol endpoint

**Solution:**
```typescript
// Check port conflicts
const kernel = new ObjectKernel([
  new GraphQLPlugin({ port: 4000 })  // Ensure port is available
]);

// Check base paths
new RESTPlugin({ basePath: '/api' })     // Not '/api/'
new ODataV4Plugin({ basePath: '/odata' })
```

#### Issue: Data not syncing between protocols

**Symptom:** Create in REST, doesn't show in GraphQL

**Solution:** Both protocols access the same core engine—this shouldn't happen. Check:
```typescript
// Ensure same kernel instance
const kernel = new ObjectKernel([...allProtocols]);
await kernel.start();  // Start once
```

#### Issue: Authentication not working

**Symptom:** 401/403 errors after migration

**Solution:** Authentication is protocol-agnostic. Check header forwarding:
```typescript
// All protocols support same auth mechanisms
new RESTPlugin({ /* auth handled by kernel */ })
new GraphQLPlugin({ /* auth handled by kernel */ })
```

#### Issue: Performance regression

**Symptom:** New protocol slower than old

**Solution:**
- Check query complexity
- Enable protocol-specific optimizations
- Review N+1 query patterns
- Use batch operations

#### Issue: Client compatibility

**Symptom:** Old clients break after migration

**Solution:**
```typescript
// Keep both protocols during transition
const kernel = new ObjectKernel([
  new RESTPlugin({ basePath: '/api' }),      // Old clients
  new GraphQLPlugin({ port: 4000 })          // New clients
]);
```

---

## Performance Considerations

### Protocol Performance Characteristics

| Protocol | Best For | Typical Latency | Throughput |
|----------|----------|----------------|------------|
| REST | Simple CRUD | ~25-35ms | High |
| GraphQL | Complex queries | ~30-50ms | Medium |
| OData V4 | Enterprise queries | ~35-60ms | Medium |
| JSON-RPC | RPC calls | ~20-30ms | Very High |

### Optimization Tips

**REST:**
- Enable HTTP caching
- Use compression (gzip/brotli)
- Implement pagination
- Use field selection

**GraphQL:**
- Limit query depth
- Implement DataLoader for N+1 prevention
- Use persisted queries
- Enable query caching

**OData V4:**
- Use $select to limit fields
- Batch related operations
- Enable compression
- Index filterable fields

**JSON-RPC:**
- Use batch requests
- Enable SSE for progress
- Implement connection pooling
- Use binary encoding (optional)

---

## Support & Resources

### Documentation
- [Protocol Compliance Matrix](./protocol-compliance-matrix.md)
- [REST API Reference](../content/docs/reference/api/rest.mdx)
- [GraphQL API Reference](../content/docs/reference/api/graphql.mdx)
- [OData V4 API Reference](../content/docs/reference/api/odata-v4.mdx)
- [JSON-RPC API Reference](../content/docs/reference/api/json-rpc.mdx)

### Testing
- [Protocol TCK Guide](../content/docs/extending/protocol-tck.mdx)

### Community
- GitHub Discussions
- Discord Server
- Stack Overflow (tag: objectql)

---

**Last Updated:** February 2026  
**Maintained by:** ObjectStack Team  
**License:** MIT
