# API Quick Reference

This is a condensed reference for the most common ObjectQL API operations.

## Base Endpoint

```
POST /api/objectql
Content-Type: application/json
Authorization: Bearer <token>  (optional)
```

## Common Operations

### 📋 List Records

```json
{
  "op": "find",
  "object": "users",
  "args": {
    "fields": ["id", "name", "email"],
    "top": 20,
    "skip": 0
  }
}
```

### 🔍 Search Records

```json
{
  "op": "find",
  "object": "products",
  "args": {
    "fields": ["id", "name", "price"],
    "filters": [
      ["category", "=", "electronics"],
      "and",
      ["price", "<", 1000]
    ],
    "sort": [["price", "asc"]]
  }
}
```

### 👤 Get Single Record

```json
{
  "op": "findOne",
  "object": "users",
  "args": "user_123"
}
```

or with filters:

```json
{
  "op": "findOne",
  "object": "users",
  "args": {
    "filters": [["email", "=", "alice@example.com"]]
  }
}
```

### ➕ Create Record

```json
{
  "op": "create",
  "object": "tasks",
  "args": {
    "name": "Complete documentation",
    "priority": "high",
    "due_date": "2024-01-20"
  }
}
```

### ✏️ Update Record

```json
{
  "op": "update",
  "object": "tasks",
  "args": {
    "id": "task_456",
    "data": {
      "status": "completed"
    }
  }
}
```

### ❌ Delete Record

```json
{
  "op": "delete",
  "object": "tasks",
  "args": {
    "id": "task_456"
  }
}
```

### 🔢 Count Records

```json
{
  "op": "count",
  "object": "orders",
  "args": {
    "filters": [["status", "=", "pending"]]
  }
}
```

### ⚡ Execute Action

```json
{
  "op": "action",
  "object": "orders",
  "args": {
    "action": "approve",
    "id": "order_789",
    "input": {
      "notes": "Approved for expedited shipping"
    }
  }
}
```

## Filter Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `=` | Equal | `["status", "=", "active"]` |
| `!=` | Not equal | `["status", "!=", "deleted"]` |
| `>` | Greater than | `["age", ">", 18]` |
| `>=` | Greater or equal | `["price", ">=", 100]` |
| `<` | Less than | `["stock", "<", 10]` |
| `<=` | Less or equal | `["rating", "<=", 3]` |
| `in` | In array | `["status", "in", ["pending", "active"]]` |
| `not in` | Not in array | `["status", "not in", ["deleted", "archived"]]` |
| `like` | SQL LIKE pattern | `["name", "like", "%john%"]` |
| `startswith` | Starts with | `["email", "startswith", "admin"]` |
| `endswith` | Ends with | `["domain", "endswith", ".com"]` |
| `contains` | Contains substring | `["tags", "contains", "urgent"]` |
| `between` | Between range | `["price", "between", [100, 500]]` |

## Combining Filters

### AND Condition

```json
{
  "filters": [
    ["status", "=", "active"],
    "and",
    ["age", ">", 18]
  ]
}
```

### OR Condition

```json
{
  "filters": [
    ["priority", "=", "high"],
    "or",
    ["urgent", "=", true]
  ]
}
```

### Complex Nested Logic

```json
{
  "filters": [
    ["status", "=", "active"],
    "and",
    [
      ["priority", "=", "high"],
      "or",
      ["overdue", "=", true]
    ]
  ]
}
```

## Pagination

```json
{
  "op": "find",
  "object": "posts",
  "args": {
    "top": 20,      // Page size
    "skip": 40,     // Skip first 40 (page 3)
    "sort": [["created_at", "desc"]]
  }
}
```

## Sorting

### Single Field

```json
{
  "sort": [["created_at", "desc"]]
}
```

### Multiple Fields

```json
{
  "sort": [
    ["priority", "desc"],
    ["created_at", "asc"]
  ]
}
```

## Field Selection

### Specific Fields Only

```json
{
  "fields": ["id", "name", "email"]
}
```

### All Fields (Default)

```json
{
  "fields": null  // or omit the fields property
}
```

## Relationships (Expand/Join)

### Basic Expand

```json
{
  "op": "find",
  "object": "orders",
  "args": {
    "fields": ["id", "order_no", "amount"],
    "expand": {
      "customer": {
        "fields": ["name", "email"]
      }
    }
  }
}
```

### Nested Expand

```json
{
  "expand": {
    "customer": {
      "fields": ["name", "email"],
      "expand": {
        "company": {
          "fields": ["name", "industry"]
        }
      }
    }
  }
}
```

### Expand with Filters

```json
{
  "expand": {
    "orders": {
      "fields": ["order_no", "amount"],
      "filters": [["status", "=", "paid"]],
      "sort": [["created_at", "desc"]],
      "top": 5
    }
  }
}
```

## Aggregation

```json
{
  "op": "find",
  "object": "sales",
  "args": {
    "groupBy": ["category"],
    "aggregate": [
      {
        "func": "sum",
        "field": "amount",
        "alias": "total_sales"
      },
      {
        "func": "count",
        "field": "id",
        "alias": "num_orders"
      },
      {
        "func": "avg",
        "field": "amount",
        "alias": "avg_order_value"
      }
    ],
    "sort": [["total_sales", "desc"]]
  }
}
```

### Aggregation Functions

- `count` - Count records
- `sum` - Sum values
- `avg` - Average value
- `min` - Minimum value
- `max` - Maximum value

## Error Handling

### Validation Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "fields": {
        "email": "Invalid email format",
        "age": "Must be greater than 0"
      }
    }
  }
}
```

### Permission Error Response

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to access this resource"
  }
}
```

### Not Found Response

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Record not found"
  }
}
```

## Special Variables

Use these in filters for dynamic values:

| Variable | Description |
|----------|-------------|
| `$current_user` | Current user's ID |
| `$current_user.role` | Current user's role |
| `$today` | Current date |
| `$now` | Current timestamp |

**Example:**
```json
{
  "filters": [
    ["owner", "=", "$current_user"],
    "and",
    ["due_date", "<", "$today"]
  ]
}
```

## REST-Style Endpoints

### List

```bash
GET /api/data/users?top=20&skip=0
```

### Get One

```bash
GET /api/data/users/user_123
```

### Create

```bash
POST /api/data/users
Content-Type: application/json

{"name": "Alice", "email": "alice@example.com"}
```

### Update

```bash
PUT /api/data/users/user_123
Content-Type: application/json

{"role": "admin"}
```

### Delete

```bash
DELETE /api/data/users/user_123
```

## Metadata Endpoints

### List All Objects

```bash
GET /api/metadata/objects
```

### Get Object Schema

```bash
GET /api/metadata/objects/users
```

### Get Field Metadata

```bash
GET /api/metadata/objects/users/fields/email
```

### List Actions

```bash
GET /api/metadata/objects/orders/actions
```

## Tips & Best Practices

### ✅ DO

- Always specify `fields` to reduce payload size
- Use pagination for large datasets
- Add indexes for frequently filtered fields
- Use `expand` instead of multiple requests
- Include authentication tokens

### ❌ DON'T

- Fetch all fields when you only need a few
- Query without pagination on large tables
- Make multiple requests when you can use `expand`
- Expose sensitive fields to unauthorized users
- Use raw SQL (ObjectQL prevents this by design)

## Next Steps

- [Complete API Reference](./README.md)
- [Authentication Guide](./authentication.md)
- [Query Language Spec](../spec/query-language.md)
- [Examples](./README.md#examples)

---

**Quick Tip**: All examples use JSON-RPC format at `POST /api/objectql`. For REST endpoints, adapt to `GET/POST/PUT/DELETE /api/data/:object`.
