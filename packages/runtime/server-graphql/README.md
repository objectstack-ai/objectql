# @objectql/server-graphql

GraphQL adapter for ObjectQL - Express/NestJS compatible with automatic schema generation.

## Overview

This package provides GraphQL adapters for ObjectQL, extracted from the monolithic `@objectql/server` package as part of the plugin-based architecture subdivision.

## Installation

```bash
pnpm add @objectql/server-graphql
```

## Features

- **Automatic Schema Generation** - Generates GraphQL schema from ObjectQL metadata
- **Type Mapping** - Maps ObjectQL field types to GraphQL types
- **CRUD Operations** - Query and mutation support for all objects
- **Apollo Sandbox** - Built-in GraphQL playground

## Usage

### With Express

```typescript
import express from 'express';
import { createGraphQLHandler } from '@objectql/server-graphql';
import { app } from './objectql';

const server = express();
const graphqlHandler = createGraphQLHandler(app);

server.all('/graphql', graphqlHandler);
server.listen(3000);
```

### With Node.js HTTP Server

```typescript
import { createServer } from 'http';
import { createGraphQLHandler } from '@objectql/server-graphql';
import { app } from './objectql';

const handler = createGraphQLHandler(app);
const server = createServer(handler);
server.listen(3000);
```

## Schema Generation

The adapter automatically generates a GraphQL schema from your ObjectQL objects:

```graphql
type User {
  id: ID!
  name: String
  email: String
  age: Int
  createdAt: String
}

type Query {
  users(limit: Int, skip: Int): [User]
  user(id: ID!): User
}

type Mutation {
  createUser(input: UserInput!): User
  updateUser(id: ID!, input: UserInput!): User
  deleteUser(id: ID!): Boolean
}
```

## Architecture

This package is part of the ObjectQL micro-kernel architecture, which follows the principle of separating concerns into focused, independently versioned packages.

### Related Packages

- `@objectql/server` - Core server types and utilities
- `@objectql/server-rest` - REST adapter
- `@objectql/server-metadata` - Metadata API adapter
- `@objectql/server-storage` - File storage adapter

## License

MIT
