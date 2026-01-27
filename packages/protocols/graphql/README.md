# @objectql/protocol-graphql

GraphQL Protocol Plugin for ObjectStack

## Overview

This plugin provides GraphQL protocol support for ObjectStack applications using Apollo Server. It automatically generates GraphQL schemas from ObjectStack metadata and provides query and mutation resolvers.

**Based on reference implementation by @hotlong**

## Features

- ✅ **Automatic Schema Generation** - Generate GraphQL types from ObjectStack metadata
- ✅ **Query Resolvers** - Query individual records and lists
- ✅ **Mutation Resolvers** - Create, update, and delete operations
- ✅ **Apollo Server Integration** - Full Apollo Server 4.x support
- ✅ **Introspection** - GraphQL schema introspection
- ✅ **GraphQL Playground** - Interactive GraphQL IDE
- ✅ **No Direct DB Access** - All operations through ObjectStackRuntimeProtocol

## Installation

```bash
pnpm add @objectql/protocol-graphql @apollo/server graphql
```

## Usage

### Basic Setup

```typescript
import { ObjectStackKernel } from '@objectql/runtime';
import { GraphQLPlugin } from '@objectql/protocol-graphql';

const kernel = new ObjectStackKernel([
  new GraphQLPlugin({
    port: 4000,
    introspection: true,
    playground: true
  })
]);

await kernel.start();

// GraphQL endpoint: http://localhost:4000/
```

### Configuration Options

```typescript
interface GraphQLPluginConfig {
  /** Port to listen on (default: 4000) */
  port?: number;
  
  /** Enable introspection (default: true) */
  introspection?: boolean;
  
  /** Enable GraphQL Playground (default: true) */
  playground?: boolean;
  
  /** Custom type definitions (optional) */
  typeDefs?: string;
}
```

## Auto-Generated Schema

The plugin automatically generates a GraphQL schema from your ObjectStack metadata.

### Example Metadata

```typescript
kernel.metadata.register('object', 'users', {
  name: 'users',
  fields: {
    name: { type: 'text', required: true },
    email: { type: 'email', required: true },
    active: { type: 'boolean', default: true }
  }
});
```

### Generated GraphQL Schema

```graphql
type Query {
  # Get single user by ID
  users(id: String!): Users
  
  # Get list of users
  usersList(limit: Int, offset: Int): [Users!]!
  
  # Get object metadata
  getObjectMetadata(name: String!): String
  
  # List all objects
  listObjects: [String!]!
}

type Mutation {
  # Create user
  createUsers(input: String!): Users
  
  # Update user
  updateUsers(id: String!, input: String!): Users
  
  # Delete user
  deleteUsers(id: String!): Boolean
}

type Users {
  id: String!
  name: String!
  email: String!
  active: Boolean
}
```

## GraphQL Operations

### Query Single Record

```graphql
query {
  users(id: "123") {
    id
    name
    email
    active
  }
}
```

### Query List

```graphql
query {
  usersList(limit: 10, offset: 0) {
    id
    name
    email
  }
}
```

### Create Record

```graphql
mutation {
  createUsers(input: "{\"name\":\"Alice\",\"email\":\"alice@example.com\"}") {
    id
    name
    email
  }
}
```

### Update Record

```graphql
mutation {
  updateUsers(
    id: "123"
    input: "{\"name\":\"Alice Updated\"}"
  ) {
    id
    name
    email
  }
}
```

### Delete Record

```graphql
mutation {
  deleteUsers(id: "123")
}
```

### Introspection Queries

```graphql
query {
  # Get metadata for users object
  getObjectMetadata(name: "users")
  
  # List all registered objects
  listObjects
}
```

## Type Mapping

ObjectQL field types are automatically mapped to GraphQL types:

| ObjectQL Type | GraphQL Type |
|---------------|--------------|
| text, email, url, etc. | String |
| number, currency, percent | Float |
| autonumber | Int |
| boolean | Boolean |
| date, datetime, time | String (ISO 8601) |
| select | String |
| lookup, master_detail | String (ID reference) |

## Using with GraphQL Clients

### Apollo Client

```typescript
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

const client = new ApolloClient({
  uri: 'http://localhost:4000/',
  cache: new InMemoryCache()
});

const { data } = await client.query({
  query: gql`
    query {
      usersList {
        id
        name
        email
      }
    }
  `
});
```

### curl

```bash
curl -X POST http://localhost:4000/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ usersList { id name email } }"
  }'
```

## Architecture

This plugin follows the ObjectStack protocol plugin pattern:

```typescript
export class GraphQLPlugin implements RuntimePlugin {
  private protocol?: ObjectStackRuntimeProtocol;

  async install(ctx: RuntimeContext) {
    // Initialize protocol bridge
    this.protocol = new ObjectStackRuntimeProtocol(ctx.engine);
  }

  async onStart(ctx: RuntimeContext) {
    // Generate schema from metadata
    const typeDefs = this.generateSchema();
    const resolvers = this.generateResolvers();
    
    // Start Apollo Server
    this.server = new ApolloServer({ typeDefs, resolvers });
  }
}
```

All data operations use the protocol bridge:
- `this.protocol.getMetaTypes()` - Get object types
- `this.protocol.getData(objectName, id)` - Get single record
- `this.protocol.findData(objectName, query)` - Query records
- `this.protocol.createData(objectName, data)` - Create record
- `this.protocol.updateData(objectName, id, data)` - Update record
- `this.protocol.deleteData(objectName, id)` - Delete record

## Example: Multi-Protocol Server

Run GraphQL alongside other protocols:

```typescript
import { ObjectStackKernel } from '@objectql/runtime';
import { GraphQLPlugin } from '@objectql/protocol-graphql';
import { ODataV4Plugin } from '@objectql/protocol-odata-v4';
import { JSONRPCPlugin } from '@objectql/protocol-json-rpc';

const kernel = new ObjectStackKernel([
  new GraphQLPlugin({ port: 4000 }),
  new ODataV4Plugin({ port: 8080 }),
  new JSONRPCPlugin({ port: 9000 })
]);

await kernel.start();

// Access same data through different protocols:
// - GraphQL: http://localhost:4000/
// - OData V4: http://localhost:8080/odata
// - JSON-RPC: http://localhost:9000/rpc
```

## Advanced Usage

### Custom Type Definitions

You can extend the auto-generated schema with custom types:

```typescript
new GraphQLPlugin({
  port: 4000,
  typeDefs: `
    type CustomType {
      field1: String
      field2: Int
    }
    
    extend type Query {
      customQuery: CustomType
    }
  `
})
```

### Apollo Server Plugins

The GraphQL plugin uses Apollo Server 4.x, which supports plugins for logging, caching, etc.

## Limitations

- Input types use JSON strings for simplicity (can be enhanced with proper GraphQL input types)
- Relationships are represented as ID strings (can be enhanced with GraphQL field resolvers)
- Filtering and sorting not yet supported in list queries (coming soon)

## See Also

- [Protocol Plugins Overview](../README.md)
- [OData V4 Plugin](../odata-v4/README.md)
- [JSON-RPC Plugin](../json-rpc/README.md)
- [Apollo Server Documentation](https://www.apollographql.com/docs/apollo-server/)

## License

MIT

---

**Reference Implementation**: Based on code example provided by @hotlong
