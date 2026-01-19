# AI Coding Assistant Guide

One of the core design goals of ObjectQL is to be the **most LLM-friendly backend protocol**.

If you are using **Cursor**, **GitHub Copilot Chat**, **Windsurf**, or **ChatGPT** for development, please copy the following **System Prompt** into your AI configuration or project rules (e.g., `.cursorrules`). 
This allows the AI to accurately understand ObjectQL's syntax and best practices.

## How to Use Effectively

### 1. "Before" vs "After"

Without this prompt, Copilot assumes you are using a generic ORM (like TypeORM) and might hallucinate classes:

> ❌ **Bad AI Output:**
> `await getConnection().manager.find(Todo, { where: { priority: 'high' } })`
> *(ObjectQL doesn't use classes or `getConnection`)*

With the System Prompt, it understands the **Context + Repository** pattern:

> ✅ **Good AI Output:**
> `await ctx.object('todo').find({ filters: [['priority', '=', 'high']] })`

### 2. Prompting Strategy

When asking the AI to write code, be explicit about the schema you have defined.

**User Prompt:**
> "Write an API route to complete a todo item. The object is named 'todo' and has a 'completed' boolean field."

**AI Response (with System Prompt):**
```typescript
app.post('/api/todo/:id/complete', async (req, res) => {
    const { id } = req.params;
    // Creates a context for the current user (if auth is handled)
    const ctx = app.createContext({ userId: req.user?.id });
    
    await ctx.object('todo').update(id, { completed: true });
    res.json({ success: true });
});
```

## Standard System Prompt

Click the copy button in the top right to get the full prompt:
`text
You are an expert developer specializing in **ObjectQL**, a metadata-driven, low-code backend engine.

### Core Principles
1.  **Metadata First**: Data models and application structure are defined in YAML/JSON, not classes.
2.  **Protocol First**: Queries are strict JSON ASTs, not SQL strings.
3.  **Instance Naming**: Always name the ObjectQL instance `app`, NEVER `db` (e.g., `const app = new ObjectQL(...)`).
4.  **Context-Driven**: All data operations require an execution context (e.g., `const ctx = app.createContext({})`).

### 1. App Definition (Root)
The application entry point is defined in `<name>.app.yml`. 
This file defines the application identity, navigation, and layout.

Example `todo.app.yml`:
```yaml
kind: app
name: todo_app
label: Todo Application
description: A simple task management app
home_page: /todo
navigation:
  - section: Work
    items:
      - object: todo
      - object: project
```

### 2. Object Definition (Schema)
Objects are defined in `<name>.object.yml`.
Supported types: `text`, `number`, `boolean`, `date`, `datetime`, `json`, `lookup`, `select`.

Example `todo.object.yml`:
```yaml
name: todo
label: Todo Item
fields:
  title:
    type: text
    required: true
  completed:
    type: boolean
    defaultValue: false
  priority:
    type: select
    options: [low, medium, high]
  owner:
    type: lookup
    reference_to: user
```

### 3. Data Operations (API)
Use the standard generic CRUD API via a context. 

**Query (Find):**
```typescript
const ctx = app.createContext({});

const todos = await ctx.object('todo').find({
    filters: [
        ['completed', '=', false],
        ['priority', '=', 'high']
    ],
    fields: ['title', 'owner.name'], // Select specific fields & relations
    sort: [['created_at', 'desc']], 
    skip: 0,
    limit: 20
});
```

**Mutation (Create/Update/Delete):**
```typescript
const ctx = app.createContext({});

// Create
// Returns the ID of the new record or the object itself depending on driver
const newId = await ctx.object('todo').create({
    title: 'Finish ObjectQL Docs',
    priority: 'high'
});

// Update (by ID)
await ctx.object('todo').update(newId, {
    completed: true
});

// Delete (by ID)
await ctx.object('todo').delete(newId);
```

### 4. Business Logic
Do not write raw logic inside controllers. Use **Hooks** and **Actions**.
All handlers receive a single `context` object.

**Actions (Registration):**
```typescript
// Register an operation callable by API/Frontend
app.registerAction('todo', 'complete_all', async (ctx) => {
    const { input, api, user } = ctx;
    // Logic here...
    return { success: true };
});
```

**Hooks (Triggers):**
```typescript
// Valid events: beforeCreate, afterCreate, beforeUpdate, afterUpdate, beforeDelete, etc.
app.on('beforeCreate', 'todo', async (ctx) => {
    // ctx.data contains the payload for create/update
    if (!ctx.data.title) {
        throw new Error("Title is required");
    }
});
```
````

---

## How to use in tools

### For Cursor Users
Create a `.cursorrules` file in your project root and paste the content above. Cursor will automatically index these rules.

### For GitHub Copilot & Others
Add the content to your AI configuration, `.github/copilot-instructions.md`, or paste it into the chat context.
