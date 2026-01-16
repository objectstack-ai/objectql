# Getting Started with ObjectQL

**ObjectQL** is a universal, metadata-driven ORM designed for building dynamic business applications. Unlike traditional ORMs where you define schema in class files (like TypeORM entities), ObjectQL uses a **Metadata-First** approach.

## Why ObjectQL?

1.  **Metadata-Driven**: Define your data models in JSON or YAML. Perfect for low-code platforms where schema changes at runtime.
2.  **Universal Protocol**: The query language is a JSON AST, making it easy for frontends or AI agents to generate queries.
3.  **Action & Hook System**: Built-in support for "Button Actions" (RPC) and "Triggers" (Hooks), allowing you to model **Behavior** alongside **Data**.

## Quick Start

The fastest way to get started is using the CLI to scaffold a project.

### 1. Create a New Project

The easiest way to start is using the generator.

```bash
# Standard Setup (Recommended) - Full Project Tracker Demo
npm create @objectql@latest my-app -- --template starter

# Minimal Setup - Single File
npm create @objectql@latest my-app -- --template hello-world
```

This will create a new project with all necessary dependencies.

### 2. Standard Setup (Project Tracker)

For building real applications, use the `showcase` template. This sets up a proper folder structure with YAML metadata, TypeScript logic hooks, and relationship management.

```bash
npm create @objectql@latest project-tracker -- --template showcase
```

This structure follows our **Best Practices**:
*   **`src/objects/*.object.yml`**: Data definitions.
*   **`src/hooks/*.hook.ts`**: Business logic.
*   **`src/index.ts`**: Application entry point.

## Manual Setup (The Hard Way)

If you prefer to set up manually or add ObjectQL to an existing project:

```typescript
import { ObjectQL } from '@objectql/core';
import { SqlDriver } from '@objectql/driver-sql';

async function main() {
  // 1. Initialize Driver (In-Memory SQLite)
  const driver = new SqlDriver({
    client: 'sqlite3',
    connection: { filename: ':memory:' }, 
    useNullAsDefault: true
  });

  // 2. Initialize Engine
  const app = new ObjectQL({
    datasources: { default: driver }
  });

  // 3. Define Metadata Inline (Code as Configuration)
  app.registerObject({
    name: 'todo',
    fields: {
      title: { type: 'text', required: true },
      completed: { type: 'boolean', defaultValue: false }
    }
  });

  await app.init();

  // 4. Run Business Logic
  // We use a system context here for simplicity
  const ctx = app.createContext({ isSystem: true });
  const repo = ctx.object('todo');

  await repo.create({ title: 'Build the Future' });
  
  const results = await repo.find();
  console.log('Todos:', results);
}

main();
```

## Scaling Up: The Metadata Approach

Once you are comfortable with the core, you should move your definitions to YAML files.

```typescript
import { ObjectQL } from '@objectql/core';
import * as path from 'path';

async function main() {
    const db = new ObjectQL({
        // 1. Connection String (Protocol://Path)
        // Detects 'sqlite', 'postgres', 'mongodb' automatically
        connection: 'sqlite://data.db', 
        
        // 2. Load Modules
        // Load schema from local directories OR npm packages
        modules: [
            'src/objects',           // Local Module
            '@objectql/module-auth'  // External Module (NPM)
        ]
    });

    await db.init();
    
    // ...
    
    // 3. Create Data (CRUD)
    // Create a context (representing a user request)
    const ctx = db.createContext({}); 
    const todoRepo = ctx.object('todo');

    const newTask = await todoRepo.create({
        title: 'Learn ObjectQL',
        completed: false
    });
    console.log('Created:', newTask);

    // 4. Query Data
    const tasks = await todoRepo.find({
        filters: [['completed', '=', false]]
    });
    console.log('Pending Tasks:', tasks);
}

main();
```

## Adding Business Logic

ObjectQL shines when you need to add logic.

### Adding a Hook

Triggers logic automatically when data changes.

```typescript
app.on('beforeCreate', 'todo', async (ctx) => {
    if (ctx.doc.title === 'Sleep') {
        throw new Error("Cannot sleep yet!");
    }
    // Auto-tagging
    ctx.doc.title = `[Task] ${ctx.doc.title}`;
});
```

### Adding an Action

Defines a custom operation (RPC) that frontends can call.

```typescript
// Define protocol
app.registerAction('todo', 'mark_done', async (ctx) => {
    const { id } = ctx;
    await ctx.object('todo').update(id, { completed: true });
    return { message: 'Good job!' };
});

// Invocation
await ctx.object('todo').execute('mark_done', 'id_123', {});
```

## Next Steps

*   **[Database Drivers](./drivers/index.md)**: Connect to PostgreSQL, MongoDB, etc.
*   **[Data Modeling](./data-modeling.md)**: Learn about all field types (Select, Lookup, Date, etc.)
*   **[SDK Reference](./sdk-reference.md)**: Explore the full API.
*   **[Hooks](./logic-hooks.md)**: Deep dive into the event system.
