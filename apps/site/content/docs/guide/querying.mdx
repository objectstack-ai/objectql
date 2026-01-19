# Querying Data

ObjectQL uses a **JSON-based Protocol** for all data operations. Unlike SQL (strings) or Query Builders (chained methods), ObjectQL queries are **Data Structures**.

This design makes it strictly typed, easy to serialise/transport over HTTP, and safe from injection—perfect for both human developers and AI Agents.

> **📖 Looking for query best practices and optimization strategies?**  
> Check out the [Query Best Practices Guide](./query-best-practices.md) for a comprehensive guide on choosing the right approach (JSON-DSL, REST, GraphQL) and performance optimization techniques.

## The `find()` Operation

The `find` method recovers a list of records matching specific criteria.

```typescript
const products = await app.object('product').find({
    filters: [
        ['category', '=', 'electronics'],
        ['price', '>', 500]
    ],
    fields: ['name', 'price', 'category'],
    sort: ['-price'], // Descending
    skip: 0,
    limit: 10
});
```

### Filters

Filters are defined as a 2D array: `[[ field, operator, value ]]`.

**Implicit AND**:
```typescript
filters: [
    ['status', '=', 'active'],
    ['stock', '>', 0]
]
// SQL: WHERE status = 'active' AND stock > 0
```

**Explicit OR**:
Use the `_or` special operator in complex filters (see advanced docs).

### Sorting

*   `field`: Ascending.
*   `-field`: Descending.

## CRUD Operations

### Create (Insert)

```typescript
const id = await app.object('user').insert({
    name: "Alice",
    email: "alice@example.com",
    role: "admin"
});
```

### Update

Updates are always bulk operations targeted by `filters`. To update a single record, filter by ID.

```typescript
// Update specific record
await app.object('user').update(
    { filters: [['_id', '=', '123']] }, // Target
    { doc: { status: 'active' } }       // Change
);

// Bulk update
await app.object('product').update(
    { filters: [['stock', '=', 0]] },
    { doc: { status: 'out_of_stock' } }
);
```

### Delete

```typescript
// Delete specific record
await app.object('user').delete({
    filters: [['_id', '=', '123']]
});
```

## Relationships (Joins & Expand)

ObjectQL handles relationships distinctively. Instead of SQL `JOIN` keywords, we use the `expand` property to hydrate related records. This ensures compatibility across SQL and NoSQL drivers (where joins might be separate queries).

### 1. The `expand` Syntax

To get related data, define the relationship in `expand`.

```typescript
// Fetch tasks and include project details
const tasks = await app.object('task').find({
    fields: ['name', 'status', 'project'], // 'project' key returns the ID
    expand: {
        project: {
            fields: ['name', 'start_date', 'owner']
        }
    }
});
/* Result:
{
    name: "Fix Bug",
    project: {
        name: "Q1 Web App",
        owner: "Alice"
    }
}
*/
```

### 2. Nested Expansion

You can nest expansions arbitrarily deep.

```typescript
expand: {
    project: {
        fields: ['name'],
        expand: {
            // Expand the 'manager' field on the 'project' object
            manager: {
                fields: ['name', 'email']
            }
        }
    }
}
```

### 3. Filtering on Related Records

There are two ways to filter based on relationships:

**A. Filter the Root (Dot Notation)**
Find tasks where the *project's status* is active.
*(Note: Requires a driver that supports SQL Joins)*
```typescript
filters: [
    ['project.status', '=', 'active']
]
```

**B. Filter the Expanded List**
Find projects, but only include *completed* tasks in the expansion.
```typescript
app.object('project').find({
    expand: {
        tasks: {
            filters: [['status', '=', 'completed']]
        }
    }
})
```

## Aggregation

ObjectQL supports SQL-like aggregation via the `aggregate()` method on the repository.

```typescript
const stats = await app.object('order').aggregate({
    // 1. Filter first
    filters: [['status', '=', 'paid']],
    
    // 2. Group by specific fields
    groupBy: ['customer_id'],
    
    // 3. Define aggregate functions
    aggregate: [
        { func: 'sum', field: 'total', alias: 'total_revenue' },
        { func: 'count', field: 'id', alias: 'order_count' },
        { func: 'max', field: 'created_at', alias: 'last_order_date' }
    ]
});

/* Result:
[
    { customer_id: "101", total_revenue: 5000, order_count: 3, last_order_date: "2023-12-01..." },
    { customer_id: "102", total_revenue: 1200, order_count: 1, last_order_date: "2023-11-15..." }
]
*/
```

### Supported Functions
*   `count`
*   `sum`
*   `avg`
*   `min`
*   `max`

## Why JSON?

1.  **Transportable**: The query IS the HTTP request body. No translation needed.
2.  **Secure**: Impossible to inject SQL syntax.
3.  **Generatable**: LLMs produce perfect JSON structures naturally.
