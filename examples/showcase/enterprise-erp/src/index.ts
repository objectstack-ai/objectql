import { ObjectQL } from '@objectql/core';
import { SqlDriver } from '@objectql/driver-sql';
import { ObjectLoader } from '@objectql/platform-node';
import * as path from 'path';
import { AuditLogPlugin } from './plugins/audit/audit.plugin';

async function main() {
    console.log("🚀 Starting Enterprise ERP Showcase...");

    const app = new ObjectQL({
        datasources: {
            default: new SqlDriver({
                client: 'sqlite3',
                connection: { filename: ':memory:' },
                useNullAsDefault: true
            })
        }
    });

    // Register Plugin
    app.use(new AuditLogPlugin());

    const loader = new ObjectLoader(app.metadata);
    await loader.load(path.join(__dirname));

    await app.init();
    console.log("✅ Enterprise Engine Booted");

    const ctx = app.createContext({ isSystem: true });

    // Business Logic
    console.log("Creating Employee...");
    const emp = await ctx.object('employees').create({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@corp.com',
        department: 'Engineering'
    });

    console.log(`Created Employee: ${emp.first_name} ${emp.last_name}`);
}

if (require.main === module) {
    main().catch(console.error);
}

export * from './types';
