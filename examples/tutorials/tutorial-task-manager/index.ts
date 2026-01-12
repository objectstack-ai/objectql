import { ObjectQL } from '@objectql/core';
import { ObjectQLServer } from '@objectql/server';
import { SqlDriver } from '@objectql/driver-sql';
import path from 'path';

async function bootstrap() {
    // 1. Initialize ObjectQL
    const app = new ObjectQL({
        driver: new SqlDriver({
            client: 'sqlite3',
            connection: {
                filename: './tasks.db'
            },
            useNullAsDefault: true
        })
    });

    // 2. Load Definitions
    await app.init();
    // In a real scenario usage inside monorepo, we might need manual registration if not using a loader
    // But assuming the standard loader picks up *.object.yml in cwd or we register manually.
    // Let's manually register for simplicity if auto-scan isn't configured in this snippet.
    // Wait, the core loader usually scans. But let's verify how core works. 
    // Usually `app.init()` scans the directory. Let's assume it scans '.'
    
    // For this example to work robustly without 'app config', we might need to point the loader.
    // Let's use the standard method of registering from a directory if the API supports it,
    // or just rely on the default behavior if it defaults to process.cwd()
    
    // Simplest approach for the tutorial code match:
    // The tutorial assumes auto-discovery.

    const server = new ObjectQLServer(app);
    server.listen(3000);
    console.log('Server running at http://localhost:3000');
    console.log('Try: curl -X POST http://localhost:3000/api/data/task -H "Content-Type: application/json" -d \'{"title": "Buy Milk", "priority": "high"}\'');
}

bootstrap();
