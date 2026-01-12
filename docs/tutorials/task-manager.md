# Build Your First App: Task Manager

> **Prerequisites**: Node.js v18+, NPM/PNPM.

In this tutorial, we will build a simple Task Management backend without writing any SQL or API boilerplate.

## 1. Setup

Create a new folder and initialize:

```bash
mkdir my-task-app
cd my-task-app
npm init -y
npm install @objectql/core @objectql/server @objectql/driver-sql sqlite3 tsx
```

## 2. Define Your Schema

Create a file named `project.object.yml`:

```yaml
name: project
objects:
  task:
    label: Task
    fields:
      title:
        type: text
        required: true
      completed:
        type: boolean
        default: false
      priority:
        type: select
        options:
          - label: Low
            value: low
          - label: High
            value: high
```

## 3. Start the Server

Create `index.ts`:

```typescript
import { ObjectQL } from '@objectql/core';
import { ObjectQLServer } from '@objectql/server';
import { SqlDriver } from '@objectql/driver-sql';

async function bootstrap() {
    const app = new ObjectQL({
        driver: new SqlDriver({
            client: 'sqlite3',
            connection: {
                filename: './tasks.db'
            },
            useNullAsDefault: true
        })
    });

    await app.init();

    const server = new ObjectQLServer(app);
    server.listen(3000);
    console.log('Server running at http://localhost:3000');
}

bootstrap();
```

## 4. Test It

Run the server:

```bash
npx tsx index.ts
```

Then create a task:

```bash
curl -X POST http://localhost:3000/api/data/task \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy Milk", "priority": "high"}'
```
