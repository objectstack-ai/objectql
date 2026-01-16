# Federated Data Graph

> **Prerequisites**: [Building a Micro-CRM](./crm-system.md).
> **Requirements**: A running MongoDB instance (or use a cloud provider URI).

In this advanced tutorial, we will demonstrate **Data Federation**. We will connect to two different databases simultaneously:
1. **SQLite**: For structured business data (`account`, `contact`).
2. **MongoDB**: For high-volume audit logs (`access_log`).

ObjectQL handles the routing transparency. You just query `api/data/access_log` or `api/data/account`, and it goes to the right place.

## 1. Install MongoDB Driver

```bash
npm install @objectql/driver-mongo mongodb
```

## 2. Configure Multiple Datasources

Update your `index.ts` to initialize both drivers.

```typescript
import { ObjectQL } from '@objectql/core';
import { ObjectQLServer } from '@objectql/server';
import { SqlDriver } from '@objectql/driver-sql';
import { MongoDriver } from '@objectql/driver-mongo'; // Import Mongo

async function bootstrap() {
    // Define the application with multiple datasources
    const app = new ObjectQL({
        datasources: {
            // 'default' is used when no datasource is specified in the object
            default: new SqlDriver({
                client: 'sqlite3',
                connection: { filename: './tasks.db' },
                useNullAsDefault: true
            }),
            
            // Secondary datasource
            archive: new MongoDriver({
                url: 'mongodb://localhost:27017/my_app_logs'
            })
        }
    });

    await app.init();
    
    // ... start server ...
    const server = new ObjectQLServer(app);
    server.listen(3000);
}

bootstrap();
```

## 3. Define the Objects

Your existing `account.object.yml` stays the same (it uses `default`).

Create a new object file `access_log.object.yml` that points to MongoDB:

```yaml
name: access_log
datasource: archive # <--- Points to the key in 'datasources'
label: Access Log
fields:
  user_id:
    type: text
  action:
    type: text
  ip_address:
    type: text
  metadata:
    type: object # MongoDB handles JSON objects natively
```

## 4. Test Cross-Database Operations

Start the server. You can now interact with both databases via the same API.

**Create a Log (goes to MongoDB):**
```bash
curl -X POST http://localhost:3000/api/data/access_log \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "u1", 
    "action": "login", 
    "metadata": { "browser": "Chrome" }
  }'
```

**Create an Account (goes to SQLite):**
```bash
curl -X POST http://localhost:3000/api/data/account \
  -H "Content-Type: application/json" \
  -d '{"name": "Steedos Inc"}'
```

## 5. Federated Business Logic

You can write hooks that cross database boundaries. For example, log every time an Account is created.

Update `index.ts`:

```typescript
app.on('afterCreate', 'account', async ({ data, api }) => {
    // This runs after data is saved to SQLite
    
    // We write a log entry to MongoDB
    await api.create('access_log', {
        user_id: 'system',
        action: `Created account: ${data.name}`,
        metadata: { source: 'hook' }
    });
    
    console.log('Audit log written to MongoDB');
});
```

## Summary

You have created a **Hybrid Data Graph**.
- **ObjectQL** acts as the unification layer.
- **Business Logic** (Hooks) doesn't care where data is stored.
- **API Clients** see a single, unified schema.
