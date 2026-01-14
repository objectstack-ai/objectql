# ObjectQL API Reference

**Version:** 1.0.0

This document provides a comprehensive reference for all ObjectQL API interfaces. Given the extensive metadata capabilities of ObjectQL, we provide multiple API styles to suit different use cases.

## Table of Contents

1. [API Overview](#api-overview)
2. [JSON-RPC Style API](#json-rpc-style-api)
3. [REST-Style API](#rest-style-api)
4. [GraphQL API](./graphql.md)
5. [Metadata API](#metadata-api)
6. [File & Attachment API](#file--attachment-api)
7. [WebSocket API](#websocket-api)
8. [Authentication & Authorization](#authentication--authorization)
9. [Error Handling](#error-handling)
10. [Rate Limiting](#rate-limiting)
11. [Examples](#examples)

---

## API Overview

ObjectQL provides a **unified query protocol** that can be exposed through multiple API styles:

| API Style | Use Case | Endpoint Pattern |
|-----------|----------|------------------|
| **JSON-RPC** | Universal client, AI agents, microservices | `POST /api/objectql` |
| **REST** | Traditional web apps, mobile apps | `GET/POST/PUT/DELETE /api/data/:object` |
| **Metadata** | Admin interfaces, schema discovery, runtime config | `GET /api/metadata/*` |
| **GraphQL** | Modern frontends with complex data requirements | `POST /api/graphql` |
| **WebSocket** | Real-time apps, live updates | `ws://host/api/realtime` *(Planned)* |

### Design Principles

1. **Protocol-First**: All APIs accept/return structured JSON, never raw SQL
2. **Type-Safe**: Full TypeScript definitions for all requests/responses
3. **AI-Friendly**: Queries include optional `ai_context` for explainability
4. **Secure**: Built-in validation, permission checks, SQL injection prevention
5. **Universal**: Same query works across MongoDB, PostgreSQL, SQLite

### Unified ID Field

ObjectQL uses a **unified `id` field** as the primary key across all database drivers:

- **Consistent Naming**: Always use `id` in API requests and responses
- **Database Agnostic**: Works seamlessly with both MongoDB (which uses `_id` internally) and SQL databases
- **Automatic Mapping**: MongoDB driver transparently converts between `id` (API) and `_id` (database)

**Example:**
```json
// Create with custom ID - works with any driver
{
  "op": "create",
  "object": "users",
  "args": {
    "id": "user-123",
    "name": "Alice"
  }
}

// Query by ID - works with any driver
{
  "op": "find",
  "object": "users",
  "args": {
    "filters": [["id", "=", "user-123"]]
  }
}

// Response always uses 'id'
{
  "data": [
    {
      "id": "user-123",
      "name": "Alice"
    }
  ]
}
```

See the [Driver Documentation](../guide/drivers/index.md) for more details.

---

## JSON-RPC Style API

The **primary ObjectQL API** is a JSON-RPC style protocol where all operations are sent to a single endpoint.

### Base Endpoint

```
POST /api/objectql
Content-Type: application/json
```

### Request Format

```typescript
interface ObjectQLRequest {
  // Authentication context (optional, can also come from headers)
  user?: {
    id: string;
    roles: string[];
    [key: string]: any;
  };
  
  // The operation to perform
  op: 'find' | 'findOne' | 'create' | 'update' | 'delete' | 'count' | 'action' | 'createMany' | 'updateMany' | 'deleteMany';
  
  // The target object/table
  object: string;
  
  // Operation-specific arguments
  args: any;
}
```

### Response Format

```typescript
interface ObjectQLResponse {
  // For list operations (find)
  items?: any[];
  
  // Pagination metadata (for list operations)
  meta?: {
    total: number;      // Total number of records
    page?: number;      // Current page number (1-indexed)
    size?: number;      // Number of items per page
    pages?: number;     // Total number of pages
    has_next?: boolean; // Whether there is a next page
  };
  
  // For single item operations, the response is the object itself with '@type' field
  // Examples: findOne, create, update return { id: '...', name: '...', '@type': 'users' }
  '@type'?: string;    // Object type identifier
  
  // Error information
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  
  // Other fields from the actual data object (for single item responses)
  [key: string]: any;
}
```

### Operations

#### 1. `find` - Query Records

Retrieve multiple records with filtering, sorting, pagination, and joins.

**Request:**
```json
{
  "op": "find",
  "object": "orders",
  "args": {
    "fields": ["order_no", "amount", "status", "created_at"],
    "filters": [
      ["status", "=", "paid"],
      "and",
      ["amount", ">", 1000]
    ],
    "sort": [["created_at", "desc"]],
    "top": 20,
    "skip": 0,
    "expand": {
      "customer": {
        "fields": ["name", "email"]
      }
    }
  }
}
```

**Response:**
```json
{
  "items": [
    {
      "order_no": "ORD-001",
      "amount": 1500,
      "status": "paid",
      "created_at": "2024-01-15T10:30:00Z",
      "customer": {
        "name": "Acme Corp",
        "email": "contact@acme.com"
      }
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "size": 20,
    "pages": 8,
    "has_next": true
  }
}
```

#### 2. `findOne` - Get Single Record

Retrieve a single record by ID or query.

**Request (by ID):**
```json
{
  "op": "findOne",
  "object": "users",
  "args": "user_123"
}
```

**Request (by query):**
```json
{
  "op": "findOne",
  "object": "users",
  "args": {
    "filters": [["email", "=", "alice@example.com"]]
  }
}
```

**Response:**
```json
{
  "id": "user_123",
  "name": "Alice",
  "email": "alice@example.com",
  "@type": "users"
}
```

#### 3. `create` - Create Record

Insert a new record.

**Request:**
```json
{
  "op": "create",
  "object": "tasks",
  "args": {
    "name": "Review PR",
    "priority": "high",
    "assignee_id": "user_123",
    "due_date": "2024-01-20"
  }
}
```

**Response:**
```json
{
  "id": "task_456",
  "name": "Review PR",
  "priority": "high",
  "assignee_id": "user_123",
  "due_date": "2024-01-20",
  "created_at": "2024-01-15T10:30:00Z",
  "@type": "tasks"
}
```

#### 4. `update` - Update Record

Modify an existing record.

**Request:**
```json
{
  "op": "update",
  "object": "tasks",
  "args": {
    "id": "task_456",
    "data": {
      "status": "completed",
      "completed_at": "2024-01-16T14:00:00Z"
    }
  }
}
```

**Response:**
```json
{
  "id": "task_456",
  "status": "completed",
  "completed_at": "2024-01-16T14:00:00Z",
  "@type": "tasks"
}
```

#### 5. `delete` - Delete Record

Remove a record by ID.

**Request:**
```json
{
  "op": "delete",
  "object": "tasks",
  "args": {
    "id": "task_456"
  }
}
```

**Response:**
```json
{
  "id": "task_456",
  "deleted": true,
  "@type": "tasks"
}
```

#### 6. `count` - Count Records

Get the count of records matching a filter.

**Request:**
```json
{
  "op": "count",
  "object": "orders",
  "args": {
    "filters": [
      ["status", "=", "pending"]
    ]
  }
}
```

**Response:**
```json
{
  "count": 42,
  "@type": "orders"
}
```

#### 7. `action` - Execute Custom Action

Execute a custom server-side action (RPC-style operation).

**Request:**
```json
{
  "op": "action",
  "object": "orders",
  "args": {
    "action": "approve",
    "id": "order_789",
    "input": {
      "approved_by": "manager_123",
      "notes": "Approved for expedited shipping"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order approved successfully",
  "order": {
    "id": "order_789",
    "status": "approved",
    "approved_at": "2024-01-15T10:30:00Z"
  },
  "@type": "orders"
}
```

### Bulk Operations

ObjectQL supports efficient bulk operations for creating, updating, and deleting multiple records in a single request.

**Important Notes:**
- **Validation & Hooks**: Bulk operations process each record individually to ensure validation rules and hooks (beforeCreate, afterCreate, etc.) are properly executed, maintaining data integrity
- **Atomicity**: Operations are not atomic by default - if one record fails, others may have already been processed
- **Performance**: While bulk operations are more efficient than separate API calls, they may be slower than driver-level bulk operations due to individual validation/hook execution
- **Use Cases**: Use bulk operations when you need consistent validation and business logic enforcement. For high-performance batch imports where validation is already handled, consider using driver-level operations directly

#### 8. `createMany` - Create Multiple Records

Insert multiple records in a single operation.

**Request:**
```json
{
  "op": "createMany",
  "object": "tasks",
  "args": [
    {
      "name": "Task 1",
      "priority": "high",
      "assignee_id": "user_123"
    },
    {
      "name": "Task 2",
      "priority": "medium",
      "assignee_id": "user_456"
    },
    {
      "name": "Task 3",
      "priority": "low",
      "assignee_id": "user_789"
    }
  ]
}
```

**Response:**
```json
{
  "items": [
    {
      "id": "task_101",
      "name": "Task 1",
      "priority": "high",
      "assignee_id": "user_123",
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "task_102",
      "name": "Task 2",
      "priority": "medium",
      "assignee_id": "user_456",
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "task_103",
      "name": "Task 3",
      "priority": "low",
      "assignee_id": "user_789",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 3,
  "@type": "tasks"
}
```

#### 9. `updateMany` - Update Multiple Records

Update all records matching a filter.

**Request:**
```json
{
  "op": "updateMany",
  "object": "tasks",
  "args": {
    "filters": {
      "status": "pending",
      "priority": "low"
    },
    "data": {
      "status": "cancelled",
      "cancelled_at": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Response:**
```json
{
  "count": 15,
  "@type": "tasks"
}
```

#### 10. `deleteMany` - Delete Multiple Records

Delete all records matching a filter.

**Request:**
```json
{
  "op": "deleteMany",
  "object": "tasks",
  "args": {
    "filters": {
      "status": "completed",
      "completed_at": ["<", "2023-01-01"]
    }
  }
}
```

**Response:**
```json
{
  "count": 42,
  "@type": "tasks"
}
```

**Error Handling Example:**
```json
// If a record fails validation during bulk operation
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "fields": {
        "priority": "Invalid priority value"
      }
    }
  }
}
```

### Advanced Query Features

#### AI Context (Optional)

Add semantic information to queries for better logging, debugging, and AI processing:

```json
{
  "op": "find",
  "object": "projects",
  "ai_context": {
    "intent": "Find at-risk projects requiring immediate attention",
    "natural_language": "Show active projects that are overdue or over budget",
    "use_case": "Project manager dashboard"
  },
  "args": {
    "filters": [
      ["status", "=", "active"],
      "and",
      [
        ["end_date", "<", "$today"],
        "or",
        ["actual_cost", ">", "budget"]
      ]
    ]
  }
}
```

#### Aggregation Queries

Perform GROUP BY operations:

```json
{
  "op": "find",
  "object": "orders",
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
        "alias": "order_count"
      }
    ],
    "filters": [["status", "=", "paid"]],
    "sort": [["total_sales", "desc"]]
  }
}
```

---

## REST-Style API

For traditional REST clients, ObjectQL can expose a REST-style interface.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/data/:object` | List records |
| `GET` | `/api/data/:object/:id` | Get single record |
| `POST` | `/api/data/:object` | Create record (or create many if body is an array) |
| `POST` | `/api/data/:object/bulk-update` | Update many records |
| `POST` | `/api/data/:object/bulk-delete` | Delete many records |
| `PUT` | `/api/data/:object/:id` | Update record |
| `DELETE` | `/api/data/:object/:id` | Delete record |

### List Records

```bash
GET /api/data/users?filter={"status":"active"}&sort=created_at&limit=20
```

**Response:**
```json
{
  "items": [...],
  "meta": {
    "total": 150,
    "page": 1,
    "size": 20,
    "pages": 8,
    "has_next": true
  }
}
```

### Get Single Record

```bash
GET /api/data/users/user_123
```

**Response:**
```json
{
  "id": "user_123",
  "name": "Alice",
  "email": "alice@example.com",
  "@type": "users"
}
```

### Create Record

```bash
POST /api/data/users
Content-Type: application/json

{
  "name": "Bob",
  "email": "bob@example.com",
  "role": "admin"
}
```

**Response:**
```json
{
  "id": "user_456",
  "name": "Bob",
  "email": "bob@example.com",
  "role": "admin",
  "created_at": "2024-01-15T10:30:00Z",
  "@type": "users"
}
```

### Update Record

```bash
PUT /api/data/users/user_456
Content-Type: application/json

{
  "role": "user"
}
```

**Response:**
```json
{
  "id": "user_456",
  "role": "user",
  "updated_at": "2024-01-15T11:00:00Z",
  "@type": "users"
}
```

### Delete Record

```bash
DELETE /api/data/users/user_456
```

**Response:**
```json
{
  "id": "user_456",
  "deleted": true,
  "@type": "users"
}
```

### Bulk Operations (REST)

#### Create Many Records

Send an array in the POST body to create multiple records at once.

```bash
POST /api/data/users
Content-Type: application/json

[
  {
    "name": "User1",
    "email": "user1@example.com",
    "role": "user"
  },
  {
    "name": "User2",
    "email": "user2@example.com",
    "role": "user"
  },
  {
    "name": "User3",
    "email": "user3@example.com",
    "role": "admin"
  }
]
```

**Response:**
```json
{
  "items": [
    {
      "id": "user_101",
      "name": "User1",
      "email": "user1@example.com",
      "role": "user",
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "user_102",
      "name": "User2",
      "email": "user2@example.com",
      "role": "user",
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "user_103",
      "name": "User3",
      "email": "user3@example.com",
      "role": "admin",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 3,
  "@type": "users"
}
```

#### Update Many Records

Update all records matching the provided filters.

```bash
POST /api/data/users/bulk-update
Content-Type: application/json

{
  "filters": {
    "role": "user",
    "status": "inactive"
  },
  "data": {
    "status": "archived",
    "archived_at": "2024-01-15T10:30:00Z"
  }
}
```

**Response:**
```json
{
  "count": 15,
  "@type": "users"
}
```

#### Delete Many Records

Delete all records matching the provided filters.

```bash
POST /api/data/users/bulk-delete
Content-Type: application/json

{
  "filters": {
    "status": "archived",
    "archived_at": ["<", "2023-01-01"]
  }
}
```

**Response:**
```json
{
  "count": 42,
  "@type": "users"
}
```

---

## Metadata API

The Metadata API provides runtime access to schema information, object definitions, and configuration.

### Base Endpoint

```
/api/metadata
```

### Endpoints

#### 1. List All Objects

Get a list of all registered objects/tables.

```bash
GET /api/metadata/objects
```

**Response:**
```json
{
  "objects": [
    {
      "name": "users",
      "label": "Users",
      "icon": "user",
      "description": "System users and authentication",
      "fields": {...}
    },
    {
      "name": "orders",
      "label": "Orders",
      "icon": "shopping-cart",
      "description": "Customer orders",
      "fields": {...}
    }
  ]
}
```

#### 2. Get Object Schema

Get detailed schema for a specific object.

```bash
GET /api/metadata/objects/users
```

**Response:**
```json
{
  "name": "users",
  "label": "Users",
  "icon": "user",
  "description": "System users and authentication",
  "fields": [
    {
      "name": "email",
      "type": "email",
      "label": "Email Address",
      "required": true,
      "unique": true
    },
    {
      "name": "role",
      "type": "select",
      "label": "Role",
      "options": ["admin", "user", "guest"],
      "defaultValue": "user"
    }
  ],
  "actions": [
    {
      "name": "reset_password",
      "type": "record",
      "label": "Reset Password"
    }
  ],
  "hooks": [
    {
      "event": "afterCreate",
      "description": "Send welcome email"
    }
  ]
}
```

#### 3. Update Metadata (Admin)

Dynamically update object configuration at runtime.

```bash
PUT /api/metadata/object/users
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "label": "System Users",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "success": true
}
```

#### 4. Get Field Metadata

Get detailed information about a specific field.

```bash
GET /api/metadata/objects/users/fields/email
```

**Response:**
```json
{
  "name": "email",
  "type": "email",
  "label": "Email Address",
  "required": true,
  "unique": true,
  "validations": [
    {
      "type": "email_format",
      "message": "Must be a valid email address"
    }
  ]
}
```

#### 5. List Actions

Get all custom actions for an object.

```bash
GET /api/metadata/objects/orders/actions
```

**Response:**
```json
{
  "actions": [
    {
      "name": "approve",
      "type": "record",
      "label": "Approve Order",
      "params": {
        "notes": {
          "type": "textarea",
          "label": "Approval Notes"
        }
      }
    },
    {
      "name": "bulk_import",
      "type": "global",
      "label": "Bulk Import Orders"
    }
  ]
}
```

---

## File & Attachment API

ObjectQL provides comprehensive support for file uploads and attachments. The system handles files using a metadata-driven approach where file metadata (URL, size, type) is stored in the database while actual file content is stored in a configurable storage backend.

### Supported Field Types

- **`file`**: General file attachments (documents, PDFs, archives)
- **`image`**: Image files with image-specific metadata (including avatars, photos, galleries)

### Upload Endpoint

```
POST /api/files/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

**Request (using cURL):**

```bash
curl -X POST https://api.example.com/api/files/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/invoice.pdf" \
  -F "object=expense" \
  -F "field=receipt"
```

**Response:**

```json
{
  "id": "file_abc123",
  "name": "invoice.pdf",
  "url": "https://cdn.example.com/files/invoice.pdf",
  "size": 245760,
  "type": "application/pdf",
  "uploaded_at": "2024-01-15T10:30:00Z",
  "uploaded_by": "user_xyz",
  "@type": "files"
}
```

### Creating Records with Attachments

**Step 1: Upload the file**

```javascript
const formData = new FormData();
formData.append('file', file);
formData.append('object', 'expense');
formData.append('field', 'receipt');

const uploadResponse = await fetch('/api/files/upload', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + token },
  body: formData
});

const uploadedFile = await uploadResponse.json();
```

**Step 2: Create record with file metadata**

```javascript
const createResponse = await fetch('/api/objectql', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    op: 'create',
    object: 'expense',
    args: {
      expense_number: 'EXP-2024-001',
      amount: 125.50,
      description: 'Office supplies',
      receipt: uploadedFile  // File metadata from upload
    }
  })
});
```

### Attachment Data Format

**Single File:**

```json
{
  "id": "file_abc123",
  "name": "receipt.pdf",
  "url": "https://cdn.example.com/files/receipt.pdf",
  "size": 245760,
  "type": "application/pdf"
}
```

**Multiple Files (when `multiple: true`):**

```json
[
  {
    "id": "img_001",
    "name": "product_front.jpg",
    "url": "https://cdn.example.com/images/product_front.jpg",
    "size": 156789,
    "type": "image/jpeg"
  },
  {
    "id": "img_002",
    "name": "product_back.jpg",
    "url": "https://cdn.example.com/images/product_back.jpg",
    "size": 142356,
    "type": "image/jpeg"
  }
]
```

### Image-Specific Metadata

Images can include additional metadata like dimensions and thumbnails:

```json
{
  "id": "img_abc123",
  "name": "product_hero.jpg",
  "url": "https://cdn.example.com/images/product_hero.jpg",
  "size": 523400,
  "type": "image/jpeg",
  "width": 1920,
  "height": 1080,
  "thumbnail_url": "https://cdn.example.com/images/product_hero_thumb.jpg"
}
```

### Complete Documentation

For comprehensive documentation on file uploads, image handling, batch uploads, validation, and more examples, see:

**[Attachment API Specification](./attachments.md)**

---

## WebSocket API

*(Planned Feature)*

For real-time updates and live data synchronization.

### Connection

```javascript
const ws = new WebSocket('ws://localhost:3000/api/realtime');

ws.onopen = () => {
  // Authenticate
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your_jwt_token'
  }));
  
  // Subscribe to changes
  ws.send(JSON.stringify({
    type: 'subscribe',
    object: 'orders',
    filters: [["status", "=", "pending"]]
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'change') {
    console.log('Record changed:', data.record);
  }
};
```

---

## Authentication & Authorization

### Authentication Methods

ObjectQL supports multiple authentication strategies:

#### 1. JWT Tokens (Recommended)

```bash
POST /api/objectql
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

#### 2. API Keys

```bash
POST /api/objectql
X-API-Key: your_api_key_here
Content-Type: application/json
```

#### 3. Session Cookies

```bash
POST /api/objectql
Cookie: session_id=abc123...
Content-Type: application/json
```

#### 4. User Context in Request (Development Only)

For testing and development, you can pass user context directly in the request:

```json
{
  "user": {
    "id": "user_123",
    "roles": ["admin"]
  },
  "op": "find",
  "object": "users",
  "args": {}
}
```

⚠️ **Warning**: In production, always authenticate via headers, not request body.

### Permission System

ObjectQL enforces permissions at multiple levels:

1. **Object-Level**: Can the user access this object at all?
2. **Operation-Level**: Can they perform this operation (read/create/update/delete)?
3. **Field-Level**: Which fields can they see/edit?
4. **Record-Level**: Which specific records can they access?

**Permission Check Flow:**
```
Request → Authentication → Object Permission → Field Permission → Record Permission → Execute
```

**Example Permission Config:**
```yaml
# user.object.yml
permissions:
  - profile: admin
    allow_read: true
    allow_create: true
    allow_edit: true
    allow_delete: true
    
  - profile: user
    allow_read: true
    allow_create: false
    allow_edit: true
    allow_delete: false
    record_filters:
      - ["owner", "=", "$current_user"]
```

---

## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "email",
      "reason": "Email already exists"
    }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_REQUEST` | 400 | Malformed request body |
| `VALIDATION_ERROR` | 400 | Data validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Object or record not found |
| `CONFLICT` | 409 | Unique constraint violation |
| `INTERNAL_ERROR` | 500 | Server error |
| `DATABASE_ERROR` | 500 | Database operation failed |

### Example Error Responses

**Validation Error:**
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

**Permission Error:**
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to access this resource",
    "details": {
      "required_permission": "users:delete",
      "user_roles": ["user"]
    }
  }
}
```

**Not Found:**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Object 'xyz' not found"
  }
}
```

---

## Rate Limiting

ObjectQL supports configurable rate limiting to prevent abuse.

### Default Limits

| Tier | Requests/Minute | Requests/Hour |
|------|-----------------|---------------|
| Anonymous | 20 | 100 |
| Authenticated | 100 | 1000 |
| Premium | 500 | 10000 |

### Rate Limit Headers

All responses include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642258800
```

### Rate Limit Exceeded

When rate limit is exceeded:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "retry_after": 60
    }
  }
}
```

**HTTP Status**: `429 Too Many Requests`

---

## Examples

### Example 1: User Registration Flow

```javascript
// 1. Create user
const response = await fetch('/api/objectql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    op: 'create',
    object: 'users',
    args: {
      email: 'alice@example.com',
      name: 'Alice',
      password_hash: 'hashed_password'
    }
  })
});

const user = await response.json();
// { id: 'user_123', email: 'alice@example.com', '@type': 'users', ... }

// 2. Send verification email (triggered by hook)
// 3. User verifies email via action
await fetch('/api/objectql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    op: 'action',
    object: 'users',
    args: {
      action: 'verify_email',
      id: user.id,
      input: {
        token: 'verification_token_xyz'
      }
    }
  })
});
```

### Example 2: Dashboard Analytics

```javascript
// Get sales metrics for dashboard
const response = await fetch('/api/objectql', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + jwt_token
  },
  body: JSON.stringify({
    op: 'find',
    object: 'orders',
    ai_context: {
      intent: "Calculate monthly sales by category",
      use_case: "Executive dashboard"
    },
    args: {
      groupBy: ['category', 'month'],
      aggregate: [
        { func: 'sum', field: 'amount', alias: 'revenue' },
        { func: 'count', field: 'id', alias: 'order_count' },
        { func: 'avg', field: 'amount', alias: 'avg_order_value' }
      ],
      filters: [
        ['status', '=', 'paid'],
        'and',
        ['created_at', '>=', '2024-01-01']
      ],
      sort: [['month', 'asc'], ['revenue', 'desc']]
    }
  })
});

const { items } = await response.json();
// [
//   { category: 'Electronics', month: '2024-01', revenue: 50000, order_count: 120, avg_order_value: 416.67 },
//   { category: 'Clothing', month: '2024-01', revenue: 30000, order_count: 250, avg_order_value: 120.00 },
//   ...
// ]
```

### Example 3: Complex Search with Relations

```javascript
// Find customers with high-value recent orders
const response = await fetch('/api/objectql', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + jwt_token
  },
  body: JSON.stringify({
    op: 'find',
    object: 'customers',
    args: {
      fields: ['name', 'email', 'vip_level', 'total_spent'],
      filters: [
        ['vip_level', '>=', 'gold'],
        'and',
        ['is_active', '=', true]
      ],
      expand: {
        orders: {
          fields: ['order_no', 'amount', 'status'],
          filters: [
            ['created_at', '>', '2024-01-01'],
            'and',
            ['amount', '>', 1000]
          ],
          sort: [['created_at', 'desc']],
          top: 5
        }
      },
      sort: [['total_spent', 'desc']],
      top: 20
    }
  })
});
```

### Example 4: Bulk Operations

```javascript
// Create multiple records in one request
const response = await fetch('/api/objectql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    op: 'action',
    object: 'tasks',
    args: {
      action: 'bulk_create',
      input: {
        items: [
          { name: 'Task 1', priority: 'high' },
          { name: 'Task 2', priority: 'medium' },
          { name: 'Task 3', priority: 'low' }
        ]
      }
    }
  })
});
```

### Example 5: Metadata-Driven Form Generation

```javascript
// 1. Fetch object schema
const schemaResponse = await fetch('/api/metadata/objects/contacts');
const schema = await schemaResponse.json();

// 2. Generate form based on field metadata
const form = generateForm(schema.fields);

// 3. Submit form data
const submitResponse = await fetch('/api/objectql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    op: 'create',
    object: 'contacts',
    args: formData
  })
});
```

---

## OpenAPI/Swagger Specification

ObjectQL automatically generates OpenAPI 3.0 specifications from your metadata.

### Access the Spec

```bash
GET /api/objectql/openapi.json
```

This can be imported into:
- **Swagger UI** for interactive API documentation
- **Postman** for testing
- **Code Generators** for client SDKs

### Example Integration

```html
<!-- Swagger UI -->
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/api/objectql/openapi.json',
      dom_id: '#swagger-ui'
    });
  </script>
</body>
</html>
```

---

## Best Practices

### 1. Use Specific Field Projections

❌ **Don't** fetch all fields:
```json
{
  "op": "find",
  "object": "users"
}
```

✅ **Do** specify only needed fields:
```json
{
  "op": "find",
  "object": "users",
  "args": {
    "fields": ["id", "name", "email"]
  }
}
```

### 2. Use Pagination for Large Datasets

```json
{
  "op": "find",
  "object": "orders",
  "args": {
    "top": 50,
    "skip": 0
  }
}
```

### 3. Add Indexes for Filtered Fields

If you frequently filter by a field, add an index:

```yaml
# order.object.yml
indexes:
  - fields: [status, created_at]
```

### 4. Use AI Context for Complex Queries

```json
{
  "op": "find",
  "object": "projects",
  "ai_context": {
    "intent": "Find at-risk projects",
    "natural_language": "Active projects that are overdue or over budget"
  },
  "args": {...}
}
```

### 5. Batch Related Requests

Use `expand` instead of multiple requests:

❌ **Don't**:
```javascript
// Multiple requests
const orders = await getOrders();
for (const order of orders) {
  order.customer = await getCustomer(order.customer_id);
}
```

✅ **Do**:
```json
{
  "op": "find",
  "object": "orders",
  "args": {
    "expand": {
      "customer": {
        "fields": ["name", "email"]
      }
    }
  }
}
```

---

## Next Steps

- **[Query Language Specification](../spec/query-language.md)** - Deep dive into filter syntax
- **[Actions Guide](../guide/logic-actions.md)** - Building custom RPC operations
- **[Server Integration](../guide/server-integration.md)** - Deploying ObjectQL APIs
- **[Authentication Guide](./authentication.md)** - Securing your APIs
- **[GraphQL API](./graphql.md)**

---

## Support

- **GitHub Issues**: [objectql/objectql/issues](https://github.com/objectql/objectql/issues)
- **Documentation**: [objectql.org](https://objectql.org)
- **Community**: [Discord](https://discord.gg/objectql)

---

**Last Updated**: January 2024  
**API Version**: 1.0.0
