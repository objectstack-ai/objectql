
# ObjectQL Query Protocol (JSON-DSL)

**Version:** 1.0.0

## 1. Overview

The **Unified Query Protocol (JSON-DSL)** is the internal Abstract Syntax Tree (AST) used for all data operations within ObjectQL. It serves as an Intermediate Representation (IR) that decouples the client application and business logic from the underlying storage engine.

It is designed to be:

1. **JSON-Serializable:** Can be easily sent over HTTP or stored in logs.
2. **Database Agnostic:** The same query works on MongoDB, PostgreSQL, and SQLite.
3. **AI-Friendly:** The rigid structure prevents hallucination when generating queries via LLMs.

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
  filters?: Array<
    [string, Operator, any] | // Leaf: Criterion
    'and' | 'or' |            // Branch: Logic Operator
    UnifiedQuery['filters']   // Branch: Nested Group (Recursive)
  >;
  
  // === 4. Ordering & Pagination ===
  // Format: [['created_at', 'desc'], ['name', 'asc']]
  sort?: Array<[string, 'asc' | 'desc']>;
  top?: number;  // LIMIT
  skip?: number; // OFFSET

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

### 4.1 Standard Relational Query

Fetching orders with complex filtering and related customer data.

```javascript
{
  "entity": "orders",
  "fields": ["name", "amount", "created_at"],
  
  // Logic: (Paid OR Pending) AND Amount > 100
  "filters": [
    [["status", "=", "paid"], "or", ["status", "=", "pending"]],
    "and",
    ["amount", ">", 100]
  ],
  
  "sort": [["created_at", "desc"]],
  "top": 20,
  "skip": 0,

  // JOIN customers ON orders.customer = customers.id
  "expand": {
    "customer": { 
      "fields": ["name", "email", "vip_level"],
      // Nested filter on the related table
      "filters": [["is_active", "=", true]] 
    },
    "order_items": {
      "fields": ["product_name", "qty", "price"],
      "sort": [["price", "desc"]]
    }
  }
}

```

### 4.2 Aggregation Query

Calculating sales statistics by category.

```javascript
{
  "entity": "orders",
  "groupBy": ["category"],
  "aggregate": {
    "amount": "sum",    // SUM(amount)
    "id": "count",      // COUNT(id)
    "profit": "avg"     // AVG(profit)
  },
  // Optional: Filter before aggregation
  "filters": [["status", "=", "paid"]]
}

```
