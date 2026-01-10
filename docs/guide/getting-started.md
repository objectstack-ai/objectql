# Getting Started with ObjectQL

**ObjectQL** is a universal, metadata-driven ORM designed for building dynamic business applications. Unlike traditional ORMs where you define schema in class files (like TypeORM entities), ObjectQL uses a **Metadata-First** approach.

## Why ObjectQL?

1.  **Metadata-Driven**: Define your data models in JSON or YAML. Perfect for low-code platforms where schema changes at runtime.
2.  **Universal Protocol**: The query language is a JSON AST, making it easy for frontends or AI agents to generate queries.
3.  **Action & Hook System**: Built-in support for "Button Actions" (RPC) and "Triggers" (Hooks), allowing you to model **Behavior** alongside **Data**.

## Installation

Install the core package and a driver (e.g., PostgreSQL or MongoDB).

```bash
npm install @objectql/core @objectql/driver-knex knex pg
# or
npm install @objectql/core @objectql/driver-mongo mongodb
```

## Quick Start: The "Hello World"

Let's build a simple **To-Do List** backend.

### 1. Define Your Object

In ObjectQL, everything is an "Object" (like a Table or Collection).

```yaml
# todo.object.yml
name: todo
label: To-Do Item
fields:
  title:
    type: text
    label: Task Name
  completed:
    type: boolean
    default: false
```

### 2. Initialize the Engine

```typescript
import { ObjectQL } from '@objectql/core';
import { KnexDriver } from '@objectql/driver-knex';

async function main() {
    // 1. Configure the engine
    const app = new ObjectQL({
        datasources: {
            default: new KnexDriver({
                client: 'pg',
                connection: 'postgres://user:pass@localhost:5432/mydb'
            })
        },
        objects: {
            // In a real app, you can load these from a directory using app.loadFromDirectory()
            todo: {
                name: 'todo',
                fields: {
                    title: { type: 'text' },
                    completed: { type: 'boolean' }
                }
            }
        }
    });

    await app.init();

    // 2. Create Data (CRUD)
    // Create a context (representing a user request)
    const ctx = app.createContext({}); 
    const todoRepo = ctx.object('todo');

    const newTask = await todoRepo.create({
        title: 'Learn ObjectQL',
        completed: false
    });
    console.log('Created:', newTask);

    // 3. Query Data
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

*   **[Data Modeling](./data-modeling.md)**: Learn about all field types (Select, Lookup, Date, etc.)
*   **[SDK Reference](./sdk-reference.md)**: Explore the full API.
*   **[Hooks](./logic-hooks.md)**: Deep dive into the event system.
