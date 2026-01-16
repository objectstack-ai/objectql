# API Documentation

Welcome to the ObjectQL API Reference.

ObjectQL provides a **unified query protocol** that can be exposed through multiple API styles. All styles share the same underlying metadata, validation rules, and permissions system.

## Design Principles

1. **Protocol-First**: All APIs accept/return structured JSON, never raw SQL.
2. **Type-Safe**: Full TypeScript definitions for all requests/responses.
3. **AI-Friendly**: Queries include optional `ai_context` for explainability, designed for LLM generation.
4. **Secure**: Built-in validation, permission checks, SQL injection prevention.
5. **Universal**: Same query works across MongoDB, PostgreSQL, SQLite.

## Unified ID Field

ObjectQL uses a **unified `id` field** as the primary key across all database drivers:

- **Consistent Naming**: Always use `id` in API requests and responses.
- **Database Agnostic**: The driver handles mapping (e.g. to `_id` in Mongo) automatically.
- **String Based**: IDs are always strings to ensure JSON compatibility.

## API Styles Overview

| API Style | Use Case | Endpoint Pattern | Docs |
|-----------|----------|------------------|------|
| **JSON-RPC** | Universal client, AI agents, microservices | `POST /api/objectql` | [Read Guide](./json-rpc.md) |
| **REST** | Traditional web apps, mobile apps | `/api/data/:object` | [Read Guide](./rest.md) |
| **GraphQL** | Modern frontends with complex data requirements | `POST /api/graphql` | [Read Guide](./graphql.md) |
| **Metadata** | Admin interfaces, schema discovery | `/api/metadata/*` | [Read Guide](./metadata.md) |

> **🚀 Want to optimize your queries?**  
> Check out the [Query Best Practices Guide](../guide/query-best-practices.md) for performance optimization strategies, detailed comparisons, and recommendations to help you choose the best approach for your use case.

## Quick Links

### Core Concepts
- [Custom API Routes](./custom-routes.md) ⭐ **NEW**
- [Authentication & Security](./authentication.md)
- [Error Handling](./error-handling.md)
- [Rate Limiting](./rate-limiting.md)
- [Unified API Response Format](./error-handling.md#response-format)

### Advanced Features
- [File & Attachments API](./attachments.md)
- [Realtime / WebSocket API](./websocket.md)
- [Examples Collection](./examples.md)

---

## Quick Start

### Basic Query (JSON-RPC)

```bash
curl -X POST http://localhost:3000/api/objectql \
  -H "Content-Type: application/json" \
  -d '{
    "op": "find",
    "object": "users",
    "args": {
      "fields": ["id", "name", "email"],
      "filters": [["is_active", "=", true]],
      "top": 10
    }
  }'
```

### Create Record

```bash
curl -X POST http://localhost:3000/api/objectql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "op": "create",
    "object": "tasks",
    "args": {
      "name": "Complete documentation",
      "priority": "high",
      "due_date": "2024-01-20"
    }
  }'
```

### Auto-Generated Specs

For automated tool ingestion, use the following endpoints:
- **OpenAPI / Swagger**: `/openapi.json` (Used by `/docs` UI)
- **GraphQL Schema**: `/api/graphql/schema`
