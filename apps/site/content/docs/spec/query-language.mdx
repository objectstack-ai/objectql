
# ObjectQL Query Protocol (JSON-DSL)

**Version:** 1.0.0

## 1. Overview

The **Unified Query Protocol (JSON-DSL)** is the internal Abstract Syntax Tree (AST) used for all data operations within ObjectQL. It serves as an Intermediate Representation (IR) that decouples the client application and business logic from the underlying storage engine.

It is designed to be:

1. **JSON-Serializable:** Can be easily sent over HTTP or stored in logs.
2. **Database Agnostic:** The same query works on MongoDB, PostgreSQL, and SQLite.
3. **AI-Friendly:** The rigid structure prevents hallucination when generating queries via LLMs.
4. **Intent-Driven:** Queries can include natural language intent for explainability.

> **💡 Looking for performance tips and best practices?**  
> See the [Query Best Practices Guide](../guide/query-best-practices.md) for optimization strategies, performance benchmarks, and recommendations for choosing between JSON-DSL, REST, and GraphQL.

### 1.1 AI-Enhanced Queries (Optional)

Queries can include an `ai_context` block to make them more understandable and maintainable:

```json
{
  "object": "orders",
  
  "ai_context": {
    "intent": "Find high-value paid orders from this quarter",
    "natural_language": "Show me paid orders over $1000 from Q1 2024",
    "use_case": "Monthly sales reporting dashboard"
  },
  
  "fields": ["order_no", "amount", "customer.name"],
  "filters": [
    ["status", "=", "paid"],
    "and",
    ["amount", ">", 1000],
    "and",
    ["created_at", ">=", "2024-01-01"]
  ]
}
```

Benefits:
- **Explainability**: AI can explain query back to users
- **Documentation**: Queries self-document their purpose
- **Optimization**: AI can suggest better query structures
- **Testing**: Generate realistic test queries from intent

## 2. Type Definitions (TypeScript)

### 2.1 Operators

The protocol supports a strict set of operators to ensure security and translatability.

```typescript
export type Operator = 
  // Comparison
  | '=' | '!=' 
  | '>' | '>=' | '<' | '<=' 
  // Set
  | 'in' | 'not in' 
  // String Matching
  | 'like' | 'not like'         // SQL '%' wildcard style
  | 'startswith' | 'endswith'   // Optimized prefix/suffix search
  | 'contains'                  // String substring or Array element check
  // Range
  | 'between';                  // Inclusive range

```

### 2.2 The Query Interface

```typescript
export interface UnifiedQuery {
  // === 1. Target ===
  object: string;
  
  // === 2. Projection (SELECT) ===
  // If omitted, returns all fields (not recommended for production)
  fields?: string[]; 
  
  // === 3. Selection (WHERE) ===
  // Recursive AST array structure
  filters?: Array<any>; // See Section 3 for detailed syntax
  
  // === 4. Ordering & Pagination ===
  // Format: [['created_at', 'desc'], ['name', 'asc']]
  sort?: Array<[string, 'asc' | 'desc']>;
  top?: number;  // LIMIT
  skip?: number; // OFFSET

  // === 5. Aggregation ===
  groupBy?: string[];
  aggregate?: Array<{ func: 'sum' | 'count' | 'avg' | 'min' | 'max', field: string, alias?: string }>;
}
```

## 3. Filter Syntax (The AST)

The `filters` property is a recursive array structure that eliminates the need for SQL strings.

### 3.1 Single Criterion
A criterion is a tuple of `[Field, Operator, Value]`.

```json
["status", "=", "open"]
```

### 3.2 Basic Logic (AND/OR)
Combine criteria using boolean operators (`and`, `or`).

```json
[
  ["status", "=", "open"],
  "and",
  ["priority", ">", 3]
]
```

### 3.3 Nested Logic (Groups)
Create complex logic by nesting arrays. This mimics parentheses `(...)` in SQL.

**SQL:** `WHERE status = 'open' AND (owner = 'me' OR priority = 'critical')`

**ObjectQL:**
```json
[
  ["status", "=", "open"],
  "and",
  [
    ["owner", "=", "me"],
    "or",
    ["priority", "=", "critical"]
  ]
]
```

  // === 5. Graph Resolution (JOIN / $lookup) ===
  expand?: Record<string, {
    fields?: string[];
    filters?: UnifiedQuery['filters']; // Filter on the related entity
    sort?: UnifiedQuery['sort'];
    top?: number;
  }>;

  // === 6. Analytics (GROUP BY) ===
  groupBy?: string[];
  // Key: field name, Value: aggregation function
  aggregate?: Record<string, 'sum' | 'avg' | 'min' | 'max' | 'count'>;
  
  // === 7. Search ===
  // Global text search (implementation depends on driver capabilities)
  search?: string;
}

```

## 3. Filter AST Structure

The `filters` property uses an array-based AST (S-Expression style) to explicitly define logical precedence without ambiguity.

### 3.1 Leaf Node (Criterion)

A simple condition is an array of 3 elements: `[Field, Operator, Value]`.

```javascript
["status", "=", "paid"]
["amount", ">", 100]

```

### 3.2 Branch Node (Logic)

Conditions are combined using `'and'` or `'or'` strings within an array.

**A AND B:**

```javascript
[
  ["status", "=", "paid"], 
  "and", 
  ["amount", ">", 100]
]

```

**Nested Logic: (A OR B) AND C:**

```javascript
[
  // Group 1: (A OR B)
  [
    ["status", "=", "paid"], 
    "or", 
    ["status", "=", "pending"]
  ],
  "and", 
  // Condition C
  ["created_at", ">", "2023-01-01"]
]

```

## 4. Full Examples

### 4.1 Standard Relational Query with AI Context

Fetching orders with complex filtering and related customer data:

```javascript
{
  // AI context for explainability
  "ai_context": {
    "intent": "Find recent high-value orders from active customers",
    "natural_language": "Show me paid or pending orders over $100 from the last 3 months, include customer details",
    "use_case": "Sales dashboard - active opportunities",
    "expected_result_size": {
      "estimate": "50-100 records",
      "min": 50,
      "max": 100
    }
  },
  
  "object": "orders",
  "fields": ["order_no", "amount", "status", "created_at"],
  
  // Logic: (Paid OR Pending) AND Amount > 100 AND Recent
  "filters": [
    [
      ["status", "=", "paid"], 
      "or", 
      ["status", "=", "pending"]
    ],
    "and",
    ["amount", ">", 100],
    "and",
    ["created_at", ">", "2024-01-01"]
  ],
  
  "sort": [["created_at", "desc"]],
  "top": 20,
  "skip": 0,

  // JOIN customers ON orders.customer_id = customers.id
  "expand": {
    "customer": { 
      "fields": ["name", "email", "vip_level"],
      // Nested filter on the related table
      "filters": [["is_active", "=", true]],
      
      "ai_context": {
        "intent": "Include customer details for contact and VIP status"
      }
    },
    "order_items": {
      "fields": ["product_name", "qty", "price"],
      "sort": [["price", "desc"]],
      
      "ai_context": {
        "intent": "Show line items sorted by value"
      }
    }
  }
}
```

### 4.2 Aggregation Query with Business Context

Data analysis query with clear business intent:

```javascript
{
  "object": "orders",
  
  "ai_context": {
    "intent": "Calculate total sales and order count by product category",
    "natural_language": "Sum up sales by category for paid orders this year",
    "use_case": "Quarterly business review - product performance",
    "output_purpose": "Executive dashboard"
  },
  
  "groupBy": ["category"],
  
  "aggregate": [
    { 
      "func": "sum", 
      "field": "amount", 
      "alias": "total_sales",
      "ai_context": {
        "intent": "Total revenue per category",
        "format": "currency_usd"
      }
    },
    { 
      "func": "count", 
      "field": "id", 
      "alias": "order_count",
      "ai_context": {
        "intent": "Number of orders per category"
      }
    },
    {
      "func": "avg",
      "field": "amount",
      "alias": "avg_order_value",
      "ai_context": {
        "intent": "Average order size per category",
        "format": "currency_usd"
      }
    }
  ],
  
  // Filter is applied BEFORE aggregation
  "filters": [
    ["status", "=", "paid"],
    "and",
    ["created_at", ">=", "2024-01-01"]
  ],
  
  // Sort results by total sales (descending)
  "sort": [["total_sales", "desc"]]
}
```

**SQL Equivalent:**
```sql
SELECT 
  category, 
  SUM(amount) as total_sales, 
  COUNT(id) as order_count,
  AVG(amount) as avg_order_value
FROM orders
WHERE status = 'paid' AND created_at >= '2024-01-01' 
GROUP BY category
ORDER BY total_sales DESC
```

### 4.3 Complex Multi-Criteria Query

Advanced filtering with AI-understandable intent:

```javascript
{
  "object": "projects",
  
  "ai_context": {
    "intent": "Find at-risk projects requiring immediate attention",
    "natural_language": "Show active projects that are either: overdue, over budget, or flagged as high-risk",
    "use_case": "Project manager daily standup dashboard",
    "urgency": "high"
  },
  
  "fields": [
    "name",
    "status",
    "end_date",
    "budget",
    "actual_cost",
    "risk_level",
    "owner.name"
  ],
  
  // Complex logic: Active AND (Overdue OR Over Budget OR High Risk)
  "filters": [
    ["status", "=", "active"],
    "and",
    [
      // Overdue
      ["end_date", "<", "$today"],
      "or",
      // Over budget
      ["actual_cost", ">", "budget"],
      "or",
      // High risk flag
      ["risk_level", "=", "high"]
    ]
  ],
  
  "expand": {
    "owner": {
      "fields": ["name", "email"],
      "ai_context": {
        "intent": "Need owner contact for escalation"
      }
    }
  },
  
  // Prioritize by how overdue
  "sort": [["end_date", "asc"]]
}
```

### 4.4 Search Query with Semantic Context

Combining traditional filters with search:

```javascript
{
  "object": "customers",
  
  "ai_context": {
    "intent": "Find customers matching search term with high lifetime value",
    "natural_language": "Search for 'Acme' among VIP customers",
    "search_type": "keyword_and_filter"
  },
  
  // Traditional filters
  "filters": [
    ["vip_level", ">=", "gold"],
    "and",
    ["is_active", "=", true]
  ],
  
  // Text search across multiple fields
  "search": "Acme",
  
  "fields": ["name", "email", "vip_level", "lifetime_value"],
  
  "sort": [["lifetime_value", "desc"]],
  "top": 50
}
```

## 5. AI-Powered Query Features

### 5.1 Natural Language to Query

With AI context, systems can:

```javascript
// User says: "Show me my overdue tasks"
// AI generates:
{
  "object": "tasks",
  "ai_context": {
    "natural_language": "Show me my overdue tasks",
    "generated_by": "ai_assistant",
    "confidence": 0.95
  },
  "filters": [
    ["assignee_id", "=", "$current_user"],
    "and",
    ["due_date", "<", "$today"],
    "and",
    ["status", "!=", "completed"]
  ],
  "sort": [["due_date", "asc"]]
}
```

### 5.2 Query Optimization Hints

AI context can suggest optimizations:

```javascript
{
  "object": "large_table",
  
  "ai_context": {
    "expected_result_size": "small",  // < 100 records
    "suggest_index": ["status", "created_at"],  // AI recommends this index
    "performance_note": "Frequently accessed query - consider caching"
  },
  
  "filters": [
    ["status", "=", "active"],
    "and",
    ["created_at", ">", "2024-01-01"]
  ]
}
```

## 6. Pagination and Data Fetching

Pagination is essential for managing large result sets efficiently. ObjectQL supports multiple pagination strategies.

### 6.1 Offset-Based Pagination

The traditional approach using `top` (LIMIT) and `skip` (OFFSET).

**Basic Example:**

```javascript
{
  "object": "products",
  "fields": ["name", "price", "stock"],
  "sort": [["name", "asc"]],
  
  // Page 1: First 20 records
  "top": 20,
  "skip": 0
}
```

**Page 2:**

```javascript
{
  "object": "products",
  "fields": ["name", "price", "stock"],
  "sort": [["name", "asc"]],
  
  // Page 2: Next 20 records
  "top": 20,
  "skip": 20  // Skip first page
}
```

**Page 3:**

```javascript
{
  "object": "products",
  "fields": ["name", "price", "stock"],
  "sort": [["name", "asc"]],
  
  // Page 3
  "top": 20,
  "skip": 40  // Skip first two pages
}
```

**Calculating Skip:**
```javascript
// skip = (page - 1) * pageSize
const page = 3;
const pageSize = 20;
const skip = (page - 1) * pageSize;  // 40

const query = {
  object: "products",
  top: pageSize,
  skip: skip
};
```

**Response Format:**

```javascript
{
  "data": [...],  // Array of records
  "pagination": {
    "total": 150,      // Total records matching query
    "page": 3,         // Current page (calculated)
    "pageSize": 20,    // Records per page
    "totalPages": 8,   // Math.ceil(total / pageSize)
    "hasMore": true,   // Whether more pages exist
    "skip": 40,        // Current skip value
    "top": 20          // Current limit
  }
}
```

### 6.2 Cursor-Based Pagination

More efficient for large datasets, prevents data inconsistencies when records are added/removed.

**First Request:**

```javascript
{
  "object": "orders",
  "fields": ["id", "order_no", "amount", "created_at"],
  "sort": [["created_at", "desc"], ["id", "asc"]],  // Must include unique field
  "top": 20,
  
  "ai_context": {
    "intent": "First page of recent orders",
    "pagination_strategy": "cursor"
  }
}
```

**Response:**

```javascript
{
  "data": [
    { "id": "100", "order_no": "ORD-100", "amount": 500, "created_at": "2024-01-15" },
    // ... 19 more records
    { "id": "81", "order_no": "ORD-81", "amount": 300, "created_at": "2024-01-14" }
  ],
  "cursor": {
    "next": "eyJjcmVhdGVkX2F0IjoiMjAyNC0wMS0xNCIsImlkIjoiODEifQ==",  // Base64 encoded cursor
    "hasMore": true
  }
}
```

**Next Page Request:**

```javascript
{
  "object": "orders",
  "fields": ["id", "order_no", "amount", "created_at"],
  "sort": [["created_at", "desc"], ["id", "asc"]],
  "top": 20,
  
  // Use cursor from previous response
  "cursor": "eyJjcmVhdGVkX2F0IjoiMjAyNC0wMS0xNCIsImlkIjoiODEifQ==",
  
  "ai_context": {
    "intent": "Next page of orders using cursor",
    "pagination_strategy": "cursor"
  }
}
```

**Cursor Implementation:**

The cursor encodes the last record's sort values:

```javascript
// Cursor contains: { created_at: "2024-01-14", id: "81" }
// Query becomes:
"filters": [
  // Your original filters (if any)
  // ... plus cursor filter:
  "and",
  [
    ["created_at", "<", "2024-01-14"],
    "or",
    [
      ["created_at", "=", "2024-01-14"],
      "and",
      ["id", ">", "81"]
    ]
  ]
]
```

### 6.3 Keyset Pagination (Seek Method)

Similar to cursor but explicitly defined in the query.

```javascript
{
  "object": "customers",
  "fields": ["id", "name", "created_at"],
  "sort": [["created_at", "desc"], ["id", "asc"]],
  "top": 20,
  
  // For page 2+, use seek criteria
  "filters": [
    // Start after the last record from previous page
    [
      ["created_at", "<", "2024-01-10"],
      "or",
      [
        ["created_at", "=", "2024-01-10"],
        "and",
        ["id", ">", "12345"]
      ]
    ]
  ],
  
  "ai_context": {
    "intent": "Efficient keyset pagination",
    "last_seen": { "created_at": "2024-01-10", "id": "12345" }
  }
}
```

### 6.4 Infinite Scroll Pattern

For continuously loading data as user scrolls.

**Initial Load:**

```javascript
{
  "object": "posts",
  "fields": ["id", "title", "content", "created_at"],
  "sort": [["created_at", "desc"]],
  "top": 20,
  
  "ai_context": {
    "intent": "Initial load for infinite scroll feed",
    "ui_pattern": "infinite_scroll"
  }
}
```

**Load More:**

```javascript
{
  "object": "posts",
  "fields": ["id", "title", "content", "created_at"],
  "sort": [["created_at", "desc"]],
  "top": 20,
  "skip": 20,  // Or use cursor
  
  "ai_context": {
    "intent": "Load more posts for infinite scroll",
    "scroll_position": "after_20_items"
  }
}
```

### 6.5 Pagination with Filtering

Pagination parameters work alongside filters.

```javascript
{
  "object": "tasks",
  "fields": ["title", "status", "assignee", "due_date"],
  
  // Filters reduce the total result set
  "filters": [
    ["status", "in", ["pending", "in_progress"]],
    "and",
    ["assignee_id", "=", "$current_user"]
  ],
  
  "sort": [["due_date", "asc"]],
  
  // Pagination applies to filtered results
  "top": 25,
  "skip": 0,
  
  "ai_context": {
    "intent": "Paginate through my active tasks",
    "filtered_pagination": true
  }
}
```

**Response includes filtered totals:**

```javascript
{
  "data": [...],
  "pagination": {
    "total": 67,         // Total matching the filters
    "totalUnfiltered": 1523,  // Total records in table
    "filtered": true,
    "page": 1,
    "pageSize": 25,
    "totalPages": 3
  }
}
```

### 6.6 Pagination Best Practices

#### 6.6.1 Performance Considerations

**DO:**
- Use `top` to limit result size (recommended: 10-100)
- Include specific `fields` to reduce payload size
- Use indexes on sort fields
- Use cursor pagination for large datasets
- Add `ai_context.expected_result_size` for optimization hints

**DON'T:**
- Omit `top` for unbounded queries
- Use large `skip` values (>10,000) with offset pagination
- Request all fields when only a few are needed
- Skip pagination entirely for tables with >1000 records

#### 6.6.2 Choosing Pagination Strategy

| Strategy | Best For | Pros | Cons |
|----------|----------|------|------|
| **Offset** (`top`/`skip`) | Small-medium datasets, simple UIs | Simple, random access to pages | Slow for large offsets, inconsistent with concurrent changes |
| **Cursor** | Large datasets, real-time data | Fast, consistent, efficient | No random page access, more complex |
| **Keyset** | Ordered data, high performance | Very fast, efficient | Requires unique + sortable fields |

#### 6.6.3 Complete Pagination Example

```javascript
{
  "object": "invoices",
  
  "ai_context": {
    "intent": "Paginated list of unpaid invoices",
    "use_case": "Collections dashboard",
    "pagination_strategy": "offset",
    "expected_page_views": 5
  },
  
  "fields": [
    "invoice_no",
    "customer.name",
    "amount",
    "due_date",
    "days_overdue"
  ],
  
  "filters": [
    ["status", "!=", "paid"],
    "and",
    ["due_date", "<", "$today"]
  ],
  
  "sort": [
    ["days_overdue", "desc"],  // Most overdue first
    ["amount", "desc"]         // Then by amount
  ],
  
  // Page 1: 50 records
  "top": 50,
  "skip": 0,
  
  "expand": {
    "customer": {
      "fields": ["name", "email", "phone"]
    }
  }
}
```

**Client-side pagination handler:**

```typescript
interface PaginationState {
  page: number;
  pageSize: number;
  total?: number;
  cursor?: string;
}

async function fetchPage(state: PaginationState) {
  const query = {
    object: "invoices",
    fields: ["invoice_no", "amount", "due_date"],
    filters: [["status", "!=", "paid"]],
    sort: [["due_date", "asc"]],
    
    // Offset-based
    top: state.pageSize,
    skip: (state.page - 1) * state.pageSize,
    
    // Or cursor-based
    // cursor: state.cursor
  };
  
  const response = await objectql.query(query);
  
  return {
    data: response.data,
    total: response.pagination.total,
    hasMore: response.pagination.hasMore
  };
}
```

### 6.7 Pagination Edge Cases

#### 6.7.1 Empty Results

```javascript
{
  "data": [],
  "pagination": {
    "total": 0,
    "page": 1,
    "pageSize": 20,
    "totalPages": 0,
    "hasMore": false
  }
}
```

#### 6.7.2 Single Page

```javascript
{
  "data": [/* 15 records */],
  "pagination": {
    "total": 15,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1,
    "hasMore": false
  }
}
```

#### 6.7.3 Last Page

```javascript
// Requesting page 5 with pageSize 20
{
  "data": [/* 7 records */],
  "pagination": {
    "total": 87,
    "page": 5,
    "pageSize": 20,
    "totalPages": 5,
    "hasMore": false,
    "isLastPage": true
  }
}
```

## 7. See Also

- [Query Best Practices Guide](../guide/query-best-practices.md) - Performance optimization and benchmarks
- [Objects](./object.md) - Data model definitions
- [Views](./view.md) - Saved queries and filters
- [REST API](../api/rest.md) - REST endpoint for queries
- [GraphQL API](../api/graphql.md) - GraphQL alternative

