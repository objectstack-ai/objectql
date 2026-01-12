import { ObjectQL } from '@objectql/core';
import { ObjectQLServer } from '@objectql/server';
import { SqlDriver } from '@objectql/driver-sql';
import { MongoDriver } from '@objectql/driver-mongo';

async function bootstrap() {
    console.log("Starting Federated Server...");
    console.log("Note: Requires a running local MongoDB.");

    const app = new ObjectQL({
        datasources: {
            // 'default' is used for objects without explicit 'datasource' property
            default: new SqlDriver({
                client: 'sqlite3',
                connection: { filename: './federation.db' },
                useNullAsDefault: true
            }),
            
            // 'archive' is used by access_log.object.yml
            archive: new MongoDriver({
                url: process.env.MONGO_URL || 'mongodb://localhost:27017/my_app_logs'
            })
        }
    });

    await app.init();
    
    const server = new ObjectQLServer(app);
    server.listen(3002);
    console.log('Federation Server running at http://localhost:3002');
}

bootstrap();
