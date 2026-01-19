# Query Best Practices

This guide provides best practices, performance optimization strategies, and recommendations for querying data in ObjectQL across different query interfaces (JSON-DSL, REST, GraphQL).

---

## 1. Overview of Query Approaches

ObjectQL provides **three distinct query interfaces**, each optimized for different scenarios:

| Approach | Best For | Complexity | Performance | AI-Friendly |
|----------|---------|------------|-------------|-------------|
| **JSON-DSL (Core)** | Server-side logic, AI agents | Medium | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **REST API** | Simple CRUD, mobile apps | Low | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **GraphQL** | Complex data graphs, modern SPAs | High | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

*Rating scale: ⭐ = lowest, ⭐⭐⭐⭐⭐ = highest*

---

## 2. JSON-DSL Query Protocol (Recommended Default)

### What It Is

The **JSON-DSL** is ObjectQL's core query language - a structured JSON representation that serves as an Abstract Syntax Tree (AST) for data operations.

### When to Use

✅ **Perfect for:**
- Server-side business logic and hooks
- AI-generated queries (hallucination-proof)
- Cross-driver compatibility (SQL, MongoDB, Remote)
- Complex filtering with nested logic
- Programmatic query construction

### Basic Syntax

```typescript
const tasks = await app.object('task').find({
  fields: ['name', 'status', 'due_date'],
  filters: [
    ['status', '=', 'active'],
    'and',
    ['priority', '>=', 3]
  ],
  sort: [['due_date', 'asc']],
  skip: 0,
  limit: 20
});
```

### Optimization Strategies

#### ✅ DO: Use Field Projection

**Bad:**
```typescript
// Returns ALL fields (inefficient)
await app.object('user').find({
  filters: [['status', '=', 'active']]
});
```

**Good:**
```typescript
// Returns only needed fields (efficient)
await app.object('user').find({
  fields: ['id', 'name', 'email'],
  filters: [['status', '=', 'active']]
});
```

**Impact:** Reduces payload size by 60-80% for objects with many fields.

#### ✅ DO: Use Indexed Fields in Filters

**Bad:**
```typescript
// Filters on non-indexed field
filters: [['description', 'contains', 'urgent']]
```

**Good:**
```typescript
// Filters on indexed field first, then post-filter if needed
filters: [
  ['status', '=', 'open'],        // Indexed
  'and',
  ['priority', '=', 'high']       // Indexed
]
```

**Impact:** Can improve query speed by 10-100x depending on dataset size.

#### ✅ DO: Limit and Paginate Large Result Sets

**Bad:**
```typescript
// Returns all records (dangerous)
await app.object('order').find({
  filters: [['year', '=', 2024]]
});
```

**Good:**
```typescript
// Paginated results (safe and fast)
await app.object('order').find({
  filters: [['year', '=', 2024]],
  limit: 50,
  skip: page * 50,
  sort: [['created_at', 'desc']]
});
```

**Impact:** Prevents memory exhaustion and ensures consistent response times.

#### ✅ DO: Use Expand Instead of Multiple Queries

**Bad:**
```typescript
// Multiple round trips (N+1 query problem)
const tasks = await app.object('task').find({});
const enrichedTasks = [];
for (const task of tasks) {
  const project = await app.object('project').findOne(task.project_id);
  const assignee = await app.object('user').findOne(task.assignee_id);
  enrichedTasks.push({
    ...task,
    project,
    assignee
  });
}
```

**Good:**
```typescript
// Single query with expansion (JOIN)
const tasks = await app.object('task').find({
  expand: {
    project: { fields: ['name', 'status'] },
    assignee: { fields: ['name', 'email'] }
  }
});
```

**Impact:** Reduces latency by 50-90% by eliminating N+1 query problem.

---

## 3. REST API Interface

### What It Is

A traditional REST-style HTTP API following standard conventions (`GET`, `POST`, `PUT`, `DELETE`).

### When to Use

✅ **Perfect for:**
- Simple CRUD operations
- Mobile apps with limited query needs
- Third-party integrations expecting REST
- Quick prototypes and MVPs
- Developers familiar with REST conventions

### Basic Usage

```bash
# List records with simple filtering
GET /api/data/users?filters={"status":"active"}&limit=20

# Get single record
GET /api/data/users/user_123

# Create record
POST /api/data/users
Content-Type: application/json

{
  "name": "Alice",
  "email": "alice@example.com"
}
```

### Optimization Strategies

#### ✅ DO: Use Query String Compression for Complex Filters

**Standard:**
```bash
GET /api/data/orders?filters={"status":"paid","amount":[">=",1000],"created_at":[">","2024-01-01"]}&limit=50
```

**Optimized (URL-encoded JSON):**
```bash
# Encode complex queries as Base64 to avoid URL length limits
GET /api/data/orders?q=eyJmaWx0ZXJzIjp7InN0YXR1cyI6InBhaWQifX0=
```

#### ✅ DO: Leverage HTTP Caching

```bash
# Enable cache headers for static/read-heavy data
GET /api/data/products?status=active
Cache-Control: public, max-age=300

# Use ETags for conditional requests
If-None-Match: "abc123"
```

**Impact:** Can eliminate 70-90% of repeated queries for read-heavy endpoints.

#### ❌ DON'T: Over-fetch Data

**Bad:**
```bash
# Returns full objects with all relationships
GET /api/data/users
```

**Good:**
```bash
# Select only needed fields
GET /api/data/users?fields=id,name,email
```

---

## 4. GraphQL Interface

### What It Is

A **flexible query language** that allows clients to request exactly the data they need, including nested relationships, in a single request.

### When to Use

✅ **Perfect for:**
- Modern SPAs with complex data requirements
- Multi-table data fetching in one request
- Real-time applications (with subscriptions)
- Developer tools with introspection needs
- Mobile apps with bandwidth constraints

### Basic Usage

```graphql
query GetTasksWithDetails {
  taskList(
    filters: { status: "active", priority: { gte: 3 } }
    limit: 20
    sort: { due_date: ASC }
  ) {
    items {
      id
      name
      status
      priority
      project {
        name
        owner {
          name
          email
        }
      }
      assignee {
        name
        avatar_url
      }
    }
    meta {
      total
      page
      has_next
    }
  }
}
```

### Optimization Strategies

#### ✅ DO: Request Only Needed Fields

**Bad:**
```graphql
query {
  userList {
    items {
      id
      name
      email
      phone
      address
      created_at
      updated_at
      profile_picture
      bio
      settings
      preferences
      # ... 20+ more fields
    }
  }
}
```

**Good:**
```graphql
query {
  userList {
    items {
      id
      name
      email
    }
  }
}
```

**Impact:** Reduces payload size by 70-90% for wide tables.

#### ✅ DO: Use Fragments for Reusable Field Sets

**Bad (Repetitive):**
```graphql
query {
  task(id: "123") {
    id
    name
    assignee {
      id
      name
      email
      avatar_url
    }
  }
  taskList {
    items {
      id
      name
      assignee {
        id
        name
        email
        avatar_url
      }
    }
  }
}
```

**Good (DRY):**
```graphql
fragment UserBasic on User {
  id
  name
  email
  avatar_url
}

query {
  task(id: "123") {
    id
    name
    assignee {
      ...UserBasic
    }
  }
  taskList {
    items {
      id
      name
      assignee {
        ...UserBasic
      }
    }
  }
}
```

**Impact:** Improves maintainability and reduces duplication.

#### ✅ DO: Batch Multiple Queries

**Bad (Multiple HTTP Requests):**
```javascript
const user = await graphql(`query { user(id: "123") { name } }`);
const tasks = await graphql(`query { taskList { items { name } } }`);
const projects = await graphql(`query { projectList { items { name } } }`);
```

**Good (Single Request):**
```graphql
query GetDashboardData {
  user(id: "123") {
    name
    email
  }
  taskList(filters: { assignee_id: "123" }) {
    items {
      name
      status
    }
  }
  projectList(filters: { owner_id: "123" }) {
    items {
      name
      progress
    }
  }
}
```

**Impact:** Reduces latency by 60-80% by eliminating round trips.

#### ✅ DO: Implement DataLoader for Batch Resolution

When building custom resolvers, use DataLoader pattern to batch database queries:

```typescript
// Bad: N+1 queries (inefficient)
const tasks = await taskRepo.find();
const tasksWithAssignee = await Promise.all(
  tasks.map(async (task) => ({
    ...task,
    assignee: await userRepo.findOne(task.assignee_id),
  })),
);

// Good: Batched loading (1+1 queries)
const tasks = await taskRepo.find();
const userIds = tasks.map(t => t.assignee_id);
const users = await userRepo.find({
  filters: [['id', 'in', userIds]]
});
const userMap = new Map(users.map(u => [u.id, u]));
const tasksWithAssigneeBatched = tasks.map((task) => ({
  ...task,
  assignee: userMap.get(task.assignee_id),
}));
```

---

## 5. Query Approach Comparison

### Scenario 1: Simple CRUD Operation

**Use Case:** Create a new user account

**Recommendation:** REST API

**Why:** Simplest approach, standard conventions, no overhead.

```bash
POST /api/data/users
Content-Type: application/json

{
  "name": "Alice",
  "email": "alice@example.com",
  "role": "user"
}
```

---

### Scenario 2: Complex Dashboard with Multiple Data Sources

**Use Case:** Dashboard showing tasks, projects, and team members with relationships

**Recommendation:** GraphQL

**Why:** Single request, precise field selection, handles nested data elegantly.

```graphql
query Dashboard {
  me {
    name
    tasks(status: "active") {
      name
      project {
        name
      }
    }
  }
  projectList(limit: 5) {
    items {
      name
      task_count
      owner {
        name
      }
    }
  }
  teamList {
    items {
      name
      active_task_count
    }
  }
}
```

---

### Scenario 3: Server-Side Business Logic

**Use Case:** Automated workflow to assign tasks based on workload

**Recommendation:** JSON-DSL

**Why:** Type-safe, driver-agnostic, programmatic composition.

```typescript
// Hook: Automatically assign to least-busy team member
async function autoAssign(task: any) {
  const members = await app.object('user').aggregate({
    filters: [['team_id', '=', task.team_id]],
    groupBy: ['id', 'name'],
    aggregate: [
      { func: 'count', field: 'tasks.id', alias: 'task_count' }
    ]
  });
  
  const leastBusy = members.sort((a, b) => 
    a.task_count - b.task_count
  )[0];
  
  await app.object('task').update(task.id, {
    assignee_id: leastBusy.id
  });
}
```

---

### Scenario 4: AI-Generated Query

**Use Case:** LLM generates query from natural language: "Show me overdue high-priority tasks"

**Recommendation:** JSON-DSL

**Why:** Structured format prevents hallucination, validates automatically.

```typescript
// AI-generated (safe, validated)
{
  "object": "tasks",
  "ai_context": {
    "intent": "Find overdue high-priority tasks",
    "natural_language": "Show me overdue high-priority tasks"
  },
  "filters": [
    ["due_date", "<", "$today"],
    "and",
    ["priority", "=", "high"],
    "and",
    ["status", "!=", "completed"]
  ],
  "sort": [["due_date", "asc"]]
}
```

**Why NOT SQL strings:**

*Example of AI hallucination:*
```sql
-- AI might hallucinate invalid syntax
SELECT * FROM tasks WHERE due_date < NOW() 
AND priority = 'high' AND invalid_function(status);
-- ❌ Error: invalid_function does not exist
```

---

## 6. Advanced Optimization Techniques

### 6.1 Use Aggregation for Analytics

**Bad (Application-level aggregation):**
```typescript
const orders = await app.object('order').find({
  filters: [['status', '=', 'paid']]
});

// Slow: Iterating in application code
let totalRevenue = 0;
for (const order of orders) {
  totalRevenue += order.amount;
}
```

**Good (Database-level aggregation):**
```typescript
const stats = await app.object('order').aggregate({
  filters: [['status', '=', 'paid']],
  groupBy: ['customer_id'],
  aggregate: [
    { func: 'sum', field: 'amount', alias: 'total_revenue' },
    { func: 'count', field: 'id', alias: 'order_count' }
  ]
});
```

**Impact:** 100-1000x faster for large datasets.

---

### 6.2 Use Distinct for Unique Values

**Bad:**
```typescript
const orders = await app.object('order').find({
  fields: ['customer_id']
});
const uniqueCustomers = [...new Set(orders.map(o => o.customer_id))];
```

**Good:**
```typescript
const uniqueCustomers = await app.object('order').distinct('customer_id', {
  filters: [['year', '=', 2024]]
});
```

**Impact:** Reduces data transfer by 90%+ for high-duplication fields.

---

### 6.3 Use Proper Indexing

```yaml
# task.object.yml
name: task
fields:
  status:
    type: select
    options: [open, in_progress, completed]
  assignee_id:
    type: lookup
    reference_to: users
  due_date:
    type: date

indexes:
  # Composite index for common query
  - fields: [status, assignee_id, due_date]
    name: idx_task_active_query
  
  # Index for sorting
  - fields: [created_at]
    name: idx_task_created
```

**Impact:** Queries with indexed filters are 10-100x faster.

---

### 6.4 Avoid OR Filters When Possible

**Bad (OR requires multiple index scans):**
```typescript
filters: [
  ['status', '=', 'pending'],
  'or',
  ['status', '=', 'active']
]
```

**Good (IN uses single index scan):**
```typescript
filters: [
  ['status', 'in', ['pending', 'active']]
]
```

**Impact:** 2-5x faster for large tables.

---

### 6.5 Use Cursor-Based Pagination for Large Datasets

**Bad (Offset pagination gets slower with large offsets):**
```typescript
// Page 1000 requires skipping 50,000 records
await app.object('order').find({
  skip: 50000,
  limit: 50
});
```

**Good (Cursor pagination using last ID):**
```typescript
await app.object('order').find({
  filters: [['id', '>', lastSeenId]],
  limit: 50,
  sort: [['id', 'asc']]
});
```

**Impact:** Consistent performance regardless of dataset size.

---

## 7. Performance Best Practices Summary

| Practice | Impact | Difficulty |
|----------|---------|-----------|
| Use field projection | High | Easy |
| Add indexes to filtered/sorted fields | Very High | Medium |
| Use aggregation for analytics | Very High | Easy |
| Eliminate N+1 queries with expand | Very High | Easy |
| Implement pagination | High | Easy |
| Use cursor-based pagination for large sets | High | Medium |
| Use `in` operator instead of multiple `or` | Medium | Easy |
| Batch queries in GraphQL | High | Easy |
| Use `distinct` for unique values | High | Easy |
| Enable HTTP caching for REST | High | Medium |

---

## 8. Choosing the Right Approach: Decision Tree

```
Start
│
├─ Is this server-side logic or AI-generated?
│  └─ YES → Use JSON-DSL ✅
│
├─ Do you need complex nested data in one request?
│  └─ YES → Use GraphQL ✅
│
├─ Is this a simple CRUD operation?
│  └─ YES → Use REST ✅
│
└─ Need maximum flexibility?
   └─ Use JSON-DSL ✅ (Most universal)
```

---

## 9. Migration Path

If you're currently using one approach and want to switch:

### REST → JSON-DSL

**Before:**
```bash
GET /api/data/tasks?status=active&limit=20
```

**After:**
```typescript
await app.object('task').find({
  filters: [['status', '=', 'active']],
  limit: 20
});
```

### JSON-DSL → GraphQL

**Before:**
```typescript
const tasks = await app.object('task').find({
  filters: [['status', '=', 'active']],
  expand: {
    assignee: { fields: ['name', 'email'] }
  }
});
```

**After:**
```graphql
query {
  taskList(filters: { status: "active" }) {
    items {
      name
      status
      assignee {
        name
        email
      }
    }
  }
}
```

---

## 10. Conclusion

**Key Takeaways:**

1. **JSON-DSL** is the universal core - use it for server-side logic, AI integration, and cross-driver compatibility.

2. **GraphQL** excels at complex data requirements with nested relationships and is ideal for modern frontends.

3. **REST** is perfect for simple CRUD operations and third-party integrations.

4. **Optimization matters more than the interface** - focus on indexing, field projection, and pagination regardless of which approach you use.

5. **You can mix approaches** - use GraphQL for the frontend dashboard and JSON-DSL for backend workflows.

**Recommended Default Stack:**
- **Server-side:** JSON-DSL (type-safe, driver-agnostic)
- **Client-side (complex):** GraphQL (efficient, flexible)
- **Client-side (simple):** REST (fast, familiar)
- **AI Integration:** JSON-DSL (hallucination-proof)

---

## 11. Further Reading

- [Query Language Specification](../spec/query-language.md) - Complete JSON-DSL reference
- [Querying Guide](./querying.md) - Step-by-step query examples
- [GraphQL API Documentation](../api/graphql.md) - GraphQL setup and usage
- [REST API Documentation](../api/rest.md) - REST endpoint reference

---

**Need Help?**

- 📖 [Documentation](../index.md)
- 💬 [Community Discord](https://discord.gg/objectql)
- 🐛 [Report Issues](https://github.com/objectstack-ai/objectql/issues)
