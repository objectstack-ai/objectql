import express from 'express';
import { ObjectQL } from '@objectql/core';
import { KnexDriver } from '@objectql/driver-sql';
import { ObjectLoader } from '@objectql/platform-node';
import { createNodeHandler, createMetadataHandler, createStudioHandler, createRESTHandler } from '@objectql/server';
import * as path from 'path';

async function main() {
    // 1. Init ObjectQL
    const app = new ObjectQL({
        datasources: {
            default: new KnexDriver({
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
app.init().then(async () => {
    const objectQLHandler = createNodeHandler(app);
    const restHandler = createRESTHandler(app);
    const metadataHandler = createMetadataHandler(app);
    const studioHandler = createStudioHandler();

    // 4. Setup Express
    const server = express();
    const port = 3004;

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

    // Mount handlers
    server.all('/api/objectql*', objectQLHandler);
    server.all('/api/data/*', restHandler);
    server.all('/api/metadata*', metadataHandler);
    server.get('/studio*', studioHandler);

    // Create some sample data
    const ctx = app.createContext({ isSystem: true });
    await ctx.object('User').create({ name: 'Alice', email: 'alice@example.com', age: 28, status: 'active' });
    await ctx.object('User').create({ name: 'Bob', email: 'bob@example.com', age: 35, status: 'active' });
    await ctx.object('User').create({ name: 'Charlie', email: 'charlie@example.com', age: 42, status: 'inactive' });
    
    await ctx.object('Task').create({ title: 'Complete project', description: 'Finish the ObjectQL console', status: 'in-progress', priority: 'high' });
    await ctx.object('Task').create({ title: 'Write documentation', description: 'Document the new console feature', status: 'pending', priority: 'medium' });
    await ctx.object('Task').create({ title: 'Code review', description: 'Review pull requests', status: 'pending', priority: 'low' });
    await ctx.object('Task').create({ title: 'Deploy to production', description: 'Release version 1.0', status: 'pending', priority: 'high', completed: false });

    server.listen(port, () => {
        console.log(`\n🚀 ObjectQL Server running on http://localhost:${port}`);
        console.log(`\n📊 Console UI: http://localhost:${port}/console`);
        console.log(`\n🔌 APIs:`);
        console.log(`  - JSON-RPC:  http://localhost:${port}/api/objectql`);
        console.log(`  - REST:      http://localhost:${port}/api/data`);
        console.log(`  - Metadata:  http://localhost:${port}/api/metadata`);
        console.log(`\nTest JSON-RPC:`);
        console.log(`curl -X POST http://localhost:${port}/api/objectql -H "Content-Type: application/json" -d '{"op": "find", "object": "User", "args": {}}'`);
        console.log(`\nTest REST API:`);
        console.log(`curl http://localhost:${port}/api/data/User`);
        console.log(`\nTest Metadata API:`);
        console.log(`curl http://localhost:${port}/api/metadata/objects`);
    });
  });
}

main().catch(console.error);
