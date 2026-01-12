import { ObjectQL } from '@objectql/core';
import { ObjectQLServer } from '@objectql/server';
import { SqlDriver } from '@objectql/driver-sql';

async function bootstrap() {
    const app = new ObjectQL({
        driver: new SqlDriver({
            client: 'sqlite3',
            connection: {
                filename: './crm.db'
            },
            useNullAsDefault: true
        })
    });

    await app.init();

    // Register Hooks
    app.on('before.create', 'contact', async ({ doc }: any) => {
        if (doc) {
            doc.full_name = `${doc.first_name} ${doc.last_name}`;
        }
    });

    app.on('before.update', 'contact', async ({ doc }: any) => {
        if (doc && (doc.first_name || doc.last_name)) {
            // In a real app we might load the existing doc to merge, 
            // but here we assume both are sent or we just update what defines full_name
            const firstName = doc.first_name || ''; // fetching existing would be better
            const lastName = doc.last_name || ''; 
            doc.full_name = `${firstName} ${lastName}`.trim();
        }
    });

    const server = new ObjectQLServer(app);
    server.listen(3001);
    console.log('CRM Server running at http://localhost:3001');
}

bootstrap();
