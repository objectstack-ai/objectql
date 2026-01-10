# @objectql/studio

Web-based admin studio for ObjectQL database management.

## Features

- **Object Browser**: View all registered objects/tables in your database
- **Data Grid**: Browse and search records with pagination
- **CRUD Operations**: Create, read, update, and delete records
- **Schema Inspector**: View object definitions and field metadata
- **Modern UI**: Clean, responsive design with intuitive navigation

## Usage

The console is typically served alongside your ObjectQL server:

```typescript
import express from 'express';
import { ObjectQL } from '@objectql/core';
import { createNodeHandler, createStudioHandler } from '@objectql/server';

const app = new ObjectQL({ /* ... */ });
const server = express();

// ... setup objectql ...

// Serve the Studio
server.get('/studio*', createStudioHandler());
```

// API endpoints
server.all('/api/objectql', createNodeHandler(app));

// Serve console UI
server.use('/console', serveConsole());

server.listen(3004);
```

Then visit `http://localhost:3004/console` in your browser.

## Development

```bash
pnpm install
pnpm run dev
```
