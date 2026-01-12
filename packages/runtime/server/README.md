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
