import { ObjectQL } from '@objectql/core';
import { SqlDriver } from '@objectql/driver-sql';
import { ObjectLoader } from '@objectql/platform-node';
import * as path from 'path';

async function main() {
    console.log("🚀 Starting Project Tracker Showcase...");

    const app = new ObjectQL({
        datasources: {
            default: new SqlDriver({
                client: 'sqlite3',
                connection: { filename: ':memory:' },
                useNullAsDefault: true
            })
        }
    });

    const loader = new ObjectLoader(app.metadata);
    await loader.load(path.join(__dirname));

    await app.init();
    console.log("✅ Schema loaded from filesystem");

    const ctx = app.createContext({ isSystem: true });
    
    console.log("Creating Project...");
    const project = await ctx.object('projects').create({
        name: 'Website Redesign',
        status: 'planning',
        start_date: new Date()
    });
    
    console.log("Creating Task...");
    const projectId = project._id || project.id; 

    await ctx.object('tasks').create({
        name: 'Design Mockups',
        project: projectId,
        completed: false
    });

    console.log("Querying Tasks...");
    const tasks = await ctx.object('tasks').find({
        filters: [['project', '=', projectId]]
    });

    console.log("📊 Project Report:", JSON.stringify({ project, tasks }, null, 2));
}

if (require.main === module) {
    main().catch(console.error);
}

export * from './types';
