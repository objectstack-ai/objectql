# @objectql/server-rest

REST API adapter for ObjectQL - Express/NestJS compatible with OpenAPI support.

## Overview

This package provides REST API adapters for ObjectQL, extracted from the monolithic `@objectql/server` package as part of the plugin-based architecture subdivision.

## Installation

```bash
pnpm add @objectql/server-rest
```

## Features

- **REST Handler** - REST API endpoints for CRUD operations
- **Node.js Adapter** - Native Node.js HTTP server integration
- **OpenAPI Generation** - Automatic OpenAPI 3.0 specification generation
- **Express/Next.js Compatible** - Works with popular Node.js frameworks

## Usage

### With Express

```typescript
import express from 'express';
import { createRESTHandler, createNodeHandler } from '@objectql/server-rest';
import { app } from './objectql';

const server = express();
const restHandler = createRESTHandler(app);

server.all('/api/data/*', restHandler);
server.listen(3000);
```

### With Next.js

```typescript
// pages/api/data/[...path].ts
import { createRESTHandler } from '@objectql/server-rest';
import { app } from '../../../lib/objectql';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default createRESTHandler(app);
```

## Endpoints

- `GET /api/data/:object` - List records
- `GET /api/data/:object/:id` - Get single record
- `POST /api/data/:object` - Create record
- `PUT /api/data/:object/:id` - Update record
- `DELETE /api/data/:object/:id` - Delete record

## Architecture

This package is part of the ObjectQL micro-kernel architecture, which follows the principle of separating concerns into focused, independently versioned packages.

### Related Packages

- `@objectql/server` - Core server types and utilities
- `@objectql/server-graphql` - GraphQL adapter
- `@objectql/server-metadata` - Metadata API adapter
- `@objectql/server-storage` - File storage adapter

## License

MIT
