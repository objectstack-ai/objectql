# @objectql/server-metadata

Metadata API adapter for ObjectQL - Object and field metadata endpoints.

## Overview

This package provides metadata API adapters for ObjectQL, extracted from the monolithic `@objectql/server` package as part of the plugin-based architecture subdivision.

## Installation

```bash
pnpm add @objectql/server-metadata
```

## Features

- **Object Metadata** - List and retrieve object definitions
- **Field Metadata** - Access field configurations
- **Action Metadata** - Discover available actions
- **Welcome Page** - HTML landing page for API discovery

## Usage

### With Express

```typescript
import express from 'express';
import { createMetadataHandler } from '@objectql/server-metadata';
import { app } from './objectql';

const server = express();
const metadataHandler = createMetadataHandler(app);

server.all('/api/metadata*', metadataHandler);
server.listen(3000);
```

## Endpoints

- `GET /api/metadata/object` - List all objects
- `GET /api/metadata/object/:name` - Get object definition
- `GET /api/metadata/object/:name/actions` - List object actions

## Response Format

```json
{
  "items": [
    {
      "name": "users",
      "label": "Users",
      "fields": {
        "name": { "type": "text", "label": "Name" },
        "email": { "type": "email", "label": "Email" }
      }
    }
  ]
}
```

## Architecture

This package is part of the ObjectQL micro-kernel architecture, which follows the principle of separating concerns into focused, independently versioned packages.

### Related Packages

- `@objectql/server` - Core server types and utilities
- `@objectql/server-rest` - REST adapter
- `@objectql/server-graphql` - GraphQL adapter
- `@objectql/server-storage` - File storage adapter

## License

MIT
