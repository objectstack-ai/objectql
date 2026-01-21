/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { ObjectQL } from '@objectql/core';
import { SqlDriver } from '@objectql/driver-sql';
import { ObjectLoader } from '@objectql/platform-node';
import { createHonoAdapter } from '@objectql/plugin-server';
import * as path from 'path';

async function main() {
    // 1. Init ObjectQL
    const app = new ObjectQL({
        datasources: {
            default: new SqlDriver({
                client: 'sqlite3',
                connection: {
                    filename: ':memory:'
                },
                useNullAsDefault: true
            })
        }
    });

    // 2. Load Schema
    const rootDir = path.resolve(__dirname, '..');
    const loader = new ObjectLoader(app.metadata);
    loader.load(rootDir);

    // 3. Init
    await app.init();

    // 4. Create Hono server with ObjectQL adapter
    const server = new Hono();
    const port = 3005;

    // Add CORS middleware
    server.use('*', async (c, next) => {
        c.header('Access-Control-Allow-Origin', '*');
        c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        if (c.req.method === 'OPTIONS') {
            return c.text('', 200);
        }
        
        await next();
    });

    // Mount ObjectQL handler
    const objectqlHandler = createHonoAdapter(app);
    server.all('/api/*', objectqlHandler);

    // Welcome page
    server.get('/', (c) => {
        return c.html(`
<!DOCTYPE html>
<html>
<head>
    <title>ObjectQL Hono Server</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            line-height: 1.6;
        }
        h1 { color: #333; }
        .endpoint { 
            background: #f5f5f5; 
            padding: 10px; 
            margin: 10px 0;
            border-left: 3px solid #007acc;
        }
        code {
            background: #e8e8e8;
            padding: 2px 6px;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <h1>🚀 ObjectQL Hono Server</h1>
    <p>Welcome to the ObjectQL Hono integration example!</p>
    
    <h2>Available APIs</h2>
    <div class="endpoint">
        <strong>JSON-RPC:</strong> <code>POST /api/objectql</code><br>
        Example: <code>{"op": "find", "object": "user", "args": {}}</code>
    </div>
    <div class="endpoint">
        <strong>REST:</strong> <code>GET /api/data/:object</code><br>
        Example: <code>GET /api/data/user</code>
    </div>
    <div class="endpoint">
        <strong>Metadata:</strong> <code>GET /api/metadata/object</code><br>
        Get schema information
    </div>
    
    <h2>Test Commands</h2>
    <pre><code>curl -X POST http://localhost:${port}/api/objectql \\
  -H "Content-Type: application/json" \\
  -d '{"op": "find", "object": "user", "args": {}}'

curl http://localhost:${port}/api/data/user

curl http://localhost:${port}/api/metadata/object</code></pre>
</body>
</html>
        `);
    });

    // Create some sample data
    const ctx = app.createContext({ isSystem: true });
    await ctx.object('user').create({ 
        name: 'Alice', 
        email: 'alice@example.com', 
        age: 28, 
        status: 'active' 
    });
    await ctx.object('user').create({ 
        name: 'Bob', 
        email: 'bob@example.com', 
        age: 35, 
        status: 'active' 
    });
    await ctx.object('user').create({ 
        name: 'Charlie', 
        email: 'charlie@example.com', 
        age: 42, 
        status: 'inactive' 
    });

    await ctx.object('task').create({ 
        title: 'Complete project', 
        description: 'Finish the ObjectQL console', 
        status: 'in-progress', 
        priority: 'high' 
    });
    await ctx.object('task').create({ 
        title: 'Write documentation', 
        description: 'Document the new console feature', 
        status: 'pending', 
        priority: 'medium' 
    });
    await ctx.object('task').create({ 
        title: 'Code review', 
        description: 'Review pull requests', 
        status: 'pending', 
        priority: 'low' 
    });

    // Start Hono server
    console.log(`\n🚀 ObjectQL Hono Server running on http://localhost:${port}`);
    console.log(`\n🔌 APIs:`);
    console.log(`  - JSON-RPC:  http://localhost:${port}/api/objectql`);
    console.log(`  - REST:      http://localhost:${port}/api/data`);
    console.log(`  - Metadata:  http://localhost:${port}/api/metadata`);
    console.log(`  - Web UI:    http://localhost:${port}/`);

    serve({
        fetch: server.fetch,
        port
    });
}

main().catch(console.error);
