# REST API Reference

The `@objectql/api` package provides a ready-to-use REST API middleware that exposes your ObjectQL resources over HTTP.

## Installation

```bash
yarn add @objectql/api
```

## Setup

Integrate the API router into your Express application.

```typescript
import express from 'express';
import { createObjectQLRouter } from '@objectql/api';
import { objectql } from './my-objectql-instance';

const app = express();

// Mount the API at /api
app.use('/api', createObjectQLRouter({
    objectql,
    // (Optional) Inject user context from Request
    getContext: (req, res) => {
        return objectql.createContext({
            userId: req.headers['x-user-id'], // Example
            roles: ['user']
        });
    }
}));

app.listen(3000);
```

## Standard Endpoints

All endpoints are relative to the mounted path (e.g. `/api`).

### 1. List Records
Retrieve a list of records for a specific object.

**request**
`GET /:objectName`

**Parameters**

| Name | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `fields` | *string* | Comma-separated list of fields to return. | `name,status` |
| `filters` | *json* | JSON array representing the filter conditions. | `[["status","=","open"]]` |
| `sort` | *string* | Sort format `field:order`. | `created_at:desc` |
| `expand` | *string* | Comma-separated references to expand. | `owner,files` |
| `top` / `limit` | *number* | Max number of records to return. | `10` |
| `skip` / `offset` | *number* | Number of records to skip. | `0` |

**Example**
```bash
curl "http://localhost:3000/api/projects?filters=[[\"status\",\"=\",\"active\"]]"
```

---

### 2. Get Record
Retrieve a single record by ID.

**request**
`GET /:objectName/:id`

**Parameters**
- `expand`: Comma-separated list of reference fields to expand to full objects.

**Example**
```bash
curl http://localhost:3000/api/projects/659d...
```

---

### 3. Create Record
Create a new record.

**request**
`POST /:objectName`

**Body**
JSON object representing the new record.

**Example**
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "New Project", "status": "planned"}'
```

---

### 4. Update Record
Update an existing record.

**request**
`PUT /:objectName/:id`

**Body**
JSON object with fields to update.

**Example**
```bash
curl -X PUT http://localhost:3000/api/projects/659d... \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress"}'
```

---

### 5. Delete Record
Delete a record by ID.

**request**
`DELETE /:objectName/:id`

---

## Advanced Endpoints

### 6. Count Records
Get the total number of records matching a filter.

**request**
`GET /:objectName/count`

**Parameters**
- `filters`: JSON array of filter conditions.

**Response**
```json
{ "count": 42 }
```

---

### 7. Aggregate
Perform database aggregation pipeline operations (e.g., MongoDB Aggregation).

**request**
`POST /:objectName/aggregate`

**Body**
Array representing the aggregation pipeline.

**Example**
```bash
curl -X POST http://localhost:3000/api/projects/aggregate \
  -H "Content-Type: application/json" \
  -d '[{"$group": {"_id": "$status", "count": {"$sum": 1}}}]'
```

---

### 8. Bulk Operations

#### Bulk Create
Send an **array** of objects to the Create endpoint.

**request**
`POST /:objectName` (Body is Array)

```json
[
  {"name": "Task 1"},
  {"name": "Task 2"}
]
```

#### Bulk Delete
Delete multiple records by filter.

**request**
`DELETE /:objectName`

**Parameters**
- `filters` (Required): JSON array defining which records to delete.

---

### 9. Custom Actions
Trigger a defined action on a record.

**request**
`POST /:objectName/:id/:actionName`

**Body**
Parameters for the action.

