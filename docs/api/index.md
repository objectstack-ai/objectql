# API Documentation

Welcome to the ObjectQL API Reference.

## Quick Links

### Main Documentation
- **[Complete API Reference](./README.md)** - Comprehensive guide to all API endpoints and features

### Authentication & Security
- **[Authentication Guide](./authentication.md)** - JWT, API keys, OAuth2, and more
- [Rate Limiting](./README.md#rate-limiting)
- [Error Handling](./README.md#error-handling)

### File & Attachment Handling
- **[Attachment API Specification](./attachments.md)** - File uploads, image handling, and attachment fields

### API Styles

ObjectQL supports multiple API styles to fit your use case:

#### 1. JSON-RPC API (Primary)
- **Endpoint**: `POST /api/objectql`
- **Use Case**: Universal client, AI agents, microservices
- [Documentation](./README.md#json-rpc-style-api)

**Operations:**
- `find` - Query multiple records
- `findOne` - Get single record
- `create` - Insert new record
- `update` - Modify existing record
- `delete` - Remove record
- `count` - Count records
- `action` - Execute custom server-side operation

#### 2. REST API
- **Endpoints**: `GET/POST/PUT/DELETE /api/data/:object`
- **Use Case**: Traditional web apps, mobile apps
- [Documentation](./README.md#rest-style-api)

#### 3. Metadata API
- **Endpoints**: `GET /api/metadata/*`
- **Use Case**: Admin interfaces, schema discovery, runtime introspection
- [Documentation](./README.md#metadata-api)

**Endpoints:**
- `GET /api/metadata/objects` - List all objects
- `GET /api/metadata/objects/:name` - Get object schema
- `GET /api/metadata/objects/:name/fields/:field` - Get field metadata
- `GET /api/metadata/objects/:name/actions` - List custom actions

#### 4. WebSocket API (Planned)
- **Endpoint**: `ws://host/api/realtime`
- **Use Case**: Real-time apps, live updates
- [Documentation](./README.md#websocket-api)

### Additional Resources

- [OpenAPI/Swagger Spec](./README.md#openapiswagger-specification) - Auto-generated API specification
- [Best Practices](./README.md#best-practices) - Optimization tips
- [Examples](./README.md#examples) - Complete code examples

## Quick Start

### Basic Query Example

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

### Create Record Example

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

### Get Metadata Example

```bash
curl http://localhost:3000/api/metadata/objects/users
```

## Response Format

ObjectQL APIs return consistent JSON responses based on the operation type:

**List Operations (find):**
```json
{
  "items": [
    // Array of records
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "size": 20,
    "pages": 5,
    "has_next": true
  }
}
```

**Single Item Operations (findOne, create, update):**
```json
{
  "id": "record_123",
  "name": "Example",
  "@type": "objectName"
  // ... other record fields
}
```

**Error:**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

## Related Documentation

- [Query Language Specification](../spec/query-language.md) - Deep dive into filter syntax
- [Attachment API Specification](./attachments.md) - File and image handling
- [Actions Guide](../guide/logic-actions.md) - Building custom operations
- [Hooks Guide](../guide/logic-hooks.md) - Event-driven logic
- [Server Integration](../guide/server-integration.md) - Deploying ObjectQL
- [Permissions](../spec/permission.md) - Access control

## Support

- **Issues**: [GitHub Issues](https://github.com/objectql/objectql/issues)
- **Documentation**: [Main Docs](../index.md)
- **Examples**: [Examples Directory](../../examples/)

---

**Last Updated**: January 2024  
**API Version**: 1.0.0
