# Swagger UI Demo Example

This example demonstrates how to use the Swagger UI plugin to provide interactive API documentation for your ObjectQL application.

## Features Demonstrated

- ✅ REST API with ObjectQL
- ✅ Swagger UI integration for API documentation
- ✅ OpenAPI 3.0 specification generation
- ✅ Interactive API testing interface
- ✅ Sample CRM data models (Accounts, Contacts, Leads, Opportunities)

## Quick Start

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Run the example**:
   ```bash
   pnpm start
   ```

3. **Open Swagger UI**:
   Navigate to [http://localhost:3000/api-docs](http://localhost:3000/api-docs) in your browser

## Available Endpoints

| Endpoint | Description |
|----------|-------------|
| `http://localhost:3000/api` | REST API base path |
| `http://localhost:3000/api/openapi.json` | OpenAPI 3.0 specification (JSON) |
| `http://localhost:3000/api-docs` | Swagger UI interface |

## Testing the API

### Using Swagger UI

1. Open [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
2. Browse available endpoints organized by object type
3. Click "Try it out" on any endpoint
4. Fill in the parameters and click "Execute"
5. View the response

### Using curl

**List all accounts:**
```bash
curl http://localhost:3000/api/accounts
```

**Create a new account:**
```bash
curl -X POST http://localhost:3000/api/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "name": "Tech Startup Inc",
      "industry": "Technology",
      "revenue": 1000000,
      "employees": 25
    }
  }'
```

**Get a specific account:**
```bash
curl http://localhost:3000/api/accounts/{id}
```

**Update an account:**
```bash
curl -X PATCH http://localhost:3000/api/accounts/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "revenue": 1500000
    }
  }'
```

**Delete an account:**
```bash
curl -X DELETE http://localhost:3000/api/accounts/{id}
```

## Project Structure

```
swagger-demo/
├── src/
│   └── index.ts          # Main application file
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## Key Components

### Plugins Used

1. **ObjectQLPlugin** - Core ObjectQL functionality
2. **MemoryDriver** - In-memory database (for demo)
3. **HonoServerPlugin** - HTTP server
4. **RestPlugin** - REST API protocol
5. **SwaggerUIPlugin** - API documentation UI

### Data Models

- **Accounts** - Companies and organizations
- **Contacts** - People associated with accounts
- **Leads** - Potential sales opportunities
- **Opportunities** - Active sales deals

## Customization

### Change the Port

Edit the `HonoServerPlugin` configuration in `src/index.ts`:

```typescript
new HonoServerPlugin({ 
  port: 8080,  // Change to your desired port
  staticRoot: './public'
})
```

### Customize Swagger UI

Edit the `SwaggerUIPlugin` configuration:

```typescript
new SwaggerUIPlugin({ 
  basePath: '/docs',           // Change the UI path
  title: 'My Custom API Docs', // Change the page title
  swaggerOptions: {
    // Add Swagger UI options
    displayOperationId: true,
    filter: true,
    deepLinking: true
  }
})
```

### Add More Objects

Add new object definitions to the `crmApp.objects` configuration:

```typescript
const crmApp = {
  // ...
  objects: {
    // ... existing objects
    tasks: {
      name: 'tasks',
      label: 'Tasks',
      fields: {
        title: { type: 'text', required: true },
        status: { 
          type: 'select', 
          options: ['Todo', 'In Progress', 'Done'] 
        },
        dueDate: { type: 'date' }
      }
    }
  }
};
```

## Learn More

- [Swagger UI Plugin Documentation](../../packages/protocols/swagger-ui/README.md)
- [REST Protocol Plugin Documentation](../../packages/protocols/rest/README.md)
- [ObjectQL Documentation](https://objectstack.ai)

## License

MIT © 2026-present ObjectStack Inc.
