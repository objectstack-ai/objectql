# @objectql/server

Generic HTTP Server Adapter for ObjectQL.
Allows running ObjectQL on Node.js, Express, Next.js, etc.

## Installation

```bash
pnpm add @objectql/server
```

## Usage

### Node.js (Raw HTTP)

```typescript
import { createNodeHandler } from '@objectql/server';
import { app } from './objectql'; // Your initialized ObjectQL instance
import { createServer } from 'http';

const handler = createNodeHandler(app);
const server = createServer(handler);
server.listen(3000);
```

### Express

```typescript
import express from 'express';
import { createNodeHandler } from '@objectql/server';
import { app } from './objectql';

const server = express();

// Optional: Mount express.json() if you want, but ObjectQL handles parsing too.
// server.use(express.json());

// Mount the handler
server.all('/api/objectql', createNodeHandler(app));

server.listen(3000);
```

### Next.js (API Routes)

```typescript
// pages/api/objectql.ts
import { createNodeHandler } from '@objectql/server';
import { app } from '../../lib/objectql';

export const config = {
  api: {
    bodyParser: false, // ObjectQL handles body parsing
  },
};

export default createNodeHandler(app);
```

## API Response Format

ObjectQL uses a standardized response format for all operations:

### List Operations (find)

List operations return data in an `items` array with optional pagination metadata:

```json
{
  "items": [
    {
      "id": "1001",
      "name": "Contract A",
      "amount": 5000
    },
    {
      "id": "1002",
      "name": "Contract B",
      "amount": 3000
    }
  ],
  "meta": {
    "total": 105,       // Total number of records
    "page": 1,          // Current page number (1-indexed)
    "size": 20,         // Number of items per page
    "pages": 6,         // Total number of pages
    "has_next": true    // Whether there is a next page
  }
}
```

**Note:** The `meta` object is only included when pagination parameters (`limit` and/or `skip`) are used.

### Single Item Operations (findOne, create, update, delete)

Single item operations return data in a `data` field:

```json
{
  "data": {
    "id": "1001",
    "name": "Contract A",
    "amount": 5000
  }
}
```

### Error Responses

All errors follow a consistent format:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Record not found",
    "details": {
      "field": "id",
      "reason": "No record found with the given ID"
    }
  }
}
```

## REST API Endpoints

The server exposes the following REST endpoints:

- `GET /api/data/:object` - List records (supports `?limit=10&skip=0` for pagination)
- `GET /api/data/:object/:id` - Get single record
- `POST /api/data/:object` - Create record
- `PUT /api/data/:object/:id` - Update record
- `DELETE /api/data/:object/:id` - Delete record

### Pagination Example

```bash
# Get first page (10 items)
GET /api/data/contracts?limit=10&skip=0

# Get second page (10 items)
GET /api/data/contracts?limit=10&skip=10
```

## Metadata API Endpoints

- `GET /api/metadata/object` - List all objects
- `GET /api/metadata/object/:name` - Get object definition
- `GET /api/metadata/object/:name/actions` - List object actions

All metadata list endpoints return data in the standardized `items` format.
