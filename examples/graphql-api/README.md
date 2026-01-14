# GraphQL API Example

This example demonstrates how to use ObjectQL's GraphQL interface.

## Quick Start

```typescript
import { ObjectQL } from '@objectql/core';
import { createGraphQLHandler } from '@objectql/server';
import { createServer } from 'http';

const app = new ObjectQL({ /* config */ });

// Create GraphQL handler
const graphqlHandler = createGraphQLHandler(app);

// Create HTTP server
const server = createServer((req, res) => {
  if (req.url?.startsWith('/api/graphql')) {
    return graphqlHandler(req, res);
  }
});

server.listen(3000);
```

## Example Queries

### Query Users

```graphql
query {
  userList(limit: 10) {
    id
    name
    email
  }
}
```

### Create User

```graphql
mutation {
  createUser(input: {
    name: "Alice"
    email: "alice@example.com"
  }) {
    id
    name
  }
}
```

## Documentation

See the complete [GraphQL API Documentation](../../docs/api/graphql.md) for:
- Full API reference
- Schema generation
- Type mapping
- Client integration examples
- Best practices
