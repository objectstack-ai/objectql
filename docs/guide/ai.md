# Building AI-Native Apps

ObjectQL is designed from the ground up to be the ideal data layer for AI agents and LLM-powered applications. Unlike traditional ORMs that rely on string-based SQL generation (prone to hallucination and injection), ObjectQL uses a **strict JSON Protocol**.

## Why ObjectQL for AI?

| Feature | SQL / Traditional ORM | ObjectQL (JSON AST) |
| :--- | :--- | :--- |
| **Output Format** | Unstructured Strings | **Structured JSON** |
| **Hallucinations** | High (Syntax errors, non-existent tables) | **Low** (constrained by schema) |
| **Safety** | Injection vulnerable (requires sanitization) | **Injection Proof** (by design) |
| **Context Window** | Heavy (DDL dumps) | **Lightweight** (JSON Schema) |

### The "JSON Advantage"

LLMs are exceptionally good at generating JSON. By asking the LLM to output a JSON object instead of a SQL query, you drastically reduce error rates.

**User Prompt:** "Find high priority tasks for John."

**LLM Output (ObjectQL Query):**
```json
{
  "entity": "tasks",
  "filters": [
    ["priority", "=", "High"],
    "and",
    ["assignee", "=", "John"]
  ]
}
```

## Quick Start

### 1. Install Dependencies

You'll need the core package. We assume you are using OpenAI or a similar provider.

```bash
npm install @objectql/core openai
```

### 2. The Pattern: RAG for Schema

To let the AI generate correct queries, you must first provide it with the relevant *Context* (your Schema), but only the parts it needs.

```typescript
// 1. Get Schema Context (Simplified)
const schemaContext = {
    entities: {
        todo: {
            description: "Task items",
            fields: ["title", "status", "priority"]
        }
    }
};

// 2. Prompt the AI
const prompt = `
You are a database assistant.
Context: ${JSON.stringify(schemaContext)}

User Request: "Show me all high priority tasks."

Output: strictly valid ObjectQL JSON.
`;

// 3. Call LLM (Pseudo-code)
const response = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }]
});
const query = JSON.parse(response.choices[0].message.content);
```

## AI Patterns

### Pattern A: Natural Language Search (NL2Q)
Directly converting user questions into database queries.

*   **Best for:** Reporting, Dashboards, Search bars.
*   **Tip:** Use the `description` field in your ObjectQL definitions to give the AI hints about what an object represents.

### Pattern B: Intelligent Form Generation
Since ObjectQL schemas are just JSON, AI can easily generate new object definitions on the fly.

```typescript
// AI Output for "Create a Customer schema"
const newSchema = {
    name: "customer",
    fields: {
        name: { type: "text" },
        email: { type: "email" },
        status: { type: "select", options: ["active", "lead"] }
    }
};

// Apply it immediately
await app.metadata.registerObject(newSchema);
```

## Safety Guidelines (Critical)

Allowing an AI to generate database queries introduces risks. You must follow these principles:

### 1. Never Trust AI Output
Always validate the structure and content of the generated JSON *before* execution.

```typescript
import { z } from 'zod';

// Define a safe schema for the query
const QuerySchema = z.object({
    entity: z.string(),
    filters: z.array(z.any()).optional()
});

const rawQuery = JSON.parse(aiOutput);

// 1. Structural Validation
const safeQuery = QuerySchema.parse(rawQuery);

// 2. Permission Check (Kernel Level)
// Even if the query is valid, ObjectQL's internal security layer 
// will still enforce RLS (Row Level Security).
const result = await db.find(safeQuery);
```

### 2. Least Privilege
The database user used by the AI agent should have **read-only** permissions where possible, or be scoped strictly to the objects it needs to modify.

### 3. Complexity Limits
AI models can sometimes generate deeply nested or inefficient queries. Implement a "Complexity Cost" check before executing:
- Limit the number of joins (lookups).
- Limit the result set size.
