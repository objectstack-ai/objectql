/**
 * Example: Custom API Routes
 * 
 * This example demonstrates how to configure custom API route paths
 * instead of using the default hardcoded paths.
 * 
 * Default paths:
 * - /api/objectql (JSON-RPC)
 * - /api/data (REST API)
 * - /api/metadata (Metadata API)
 * - /api/files (File upload/download)
 * 
 * This example uses custom paths:
 * - /v1/rpc (JSON-RPC)
 * - /v1/resources (REST API)
 * - /v1/schema (Metadata API)
 * - /v1/storage (File upload/download)
 */

import express from 'express';
import { ObjectQL } from '@objectql/core';
import { SqlDriver } from '@objectql/driver-sql';
import { ObjectLoader } from '@objectql/platform-node';
import { createNodeHandler, createMetadataHandler, createRESTHandler } from '@objectql/server';
import * as path from 'path';

async function main() {
    // 1. Initialize ObjectQL
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
    const rootDir = path.resolve(__dirname, '../packages/starters/express-api');
    const loader = new ObjectLoader(app.metadata);
    loader.load(rootDir);

    // 3. Initialize
    await app.init();

    // 4. Define custom API routes
    const customRoutes = {
        rpc: '/v1/rpc',
        data: '/v1/resources',
        metadata: '/v1/schema',
        files: '/v1/storage'
    };

    // 5. Create handlers with custom routes
    const nodeHandler = createNodeHandler(app, { routes: customRoutes });
    const restHandler = createRESTHandler(app, { routes: customRoutes });
    const metadataHandler = createMetadataHandler(app, { routes: customRoutes });

    // 6. Setup Express
    const server = express();
    const port = 3005;

    // Enable CORS for development
    server.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        if (req.method === 'OPTIONS') {
            res.sendStatus(200);
        } else {
            next();
        }
    });

    // 7. Mount handlers using custom paths
    server.all('/v1/rpc*', nodeHandler);
    server.all('/v1/resources/*', restHandler);
    server.all('/v1/schema*', metadataHandler);

    // 8. Create some sample data
    const ctx = app.createContext({ isSystem: true });
    await ctx.object('User').create({ 
        name: 'Alice', 
        email: 'alice@example.com', 
        age: 28, 
        status: 'active' 
    });
    await ctx.object('User').create({ 
        name: 'Bob', 
        email: 'bob@example.com', 
        age: 35, 
        status: 'active' 
    });

    await ctx.object('Task').create({ 
        title: 'Complete project', 
        description: 'Finish the ObjectQL implementation', 
        status: 'in-progress', 
        priority: 'high' 
    });

    // 9. Start server
    server.listen(port, () => {
        console.log(`\n🚀 ObjectQL Server with Custom Routes running on http://localhost:${port}`);
        console.log(`\n🔌 Custom API Endpoints:`);
        console.log(`  - JSON-RPC:  http://localhost:${port}${customRoutes.rpc}`);
        console.log(`  - REST:      http://localhost:${port}${customRoutes.data}`);
        console.log(`  - Metadata:  http://localhost:${port}${customRoutes.metadata}`);
        console.log(`  - Files:     http://localhost:${port}${customRoutes.files}`);
        console.log(`\n📝 Test Examples:`);
        console.log(`\nJSON-RPC (Custom Path):`);
        console.log(`curl -X POST http://localhost:${port}${customRoutes.rpc} -H "Content-Type: application/json" -d '{"op": "find", "object": "User", "args": {}}'`);
        console.log(`\nREST API (Custom Path):`);
        console.log(`curl http://localhost:${port}${customRoutes.data}/User`);
        console.log(`\nMetadata API (Custom Path):`);
        console.log(`curl http://localhost:${port}${customRoutes.metadata}/object`);
        console.log(`\n💡 Note: All API routes are now fully configurable!`);
    });
}

main().catch(console.error);
