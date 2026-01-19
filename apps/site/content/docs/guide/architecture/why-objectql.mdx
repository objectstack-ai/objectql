# Why ObjectQL?

In the era of AI automation, the requirements for backend infrastructure have shifted. We are no longer just building for human users on web forms; we are building systems that **AI Agents** need to read, understand, and manipulate.

## The Problem with Traditional ORMs

Tools like TypeORM, Prisma, or Sequelize are fantastic for human developers. They rely heavily on:
1.  **Complex TypeScript Types**: Great for IDE autocomplete, but invisible to an LLM running in a production execution environment.
2.  **Chained Method Calls**: `db.users.where(...).include(...)`. This requires the AI to synthesize valid executable code, which is prone to syntax errors and hallucinations.
3.  **Code-First Schema**: The schema is buried in class definitions, making it hard to extract a simple "map" of the data for the AI context window.

## The ObjectQL Solution: Protocol-First

ObjectQL treats **Logic as Data**.

### 1. Schema is JSON (The Context)
Instead of parsing TypeScript files, an AI Agent can simply read a JSON definition. This is the native tongue of LLMs.

```json
{
  "name": "contact",
  "fields": { "email": { "type": "text", "required": true } }
}
```

This compact format fits perfectly in RAG (Retrieval-Augmented Generation) contexts.

### 2. Queries are ASTs (The Action)
To fetch data, the AI doesn't need to write SQL or function code. It generates a JSON object (Abstract Syntax Tree).

```json
{
  "op": "find",
  "from": "contact",
  "filters": [["email", "contains", "@gmail.com"]]
}
```
*   **Safe**: No SQL Injection possible. The Driver handles escaping.
*   **Deterministic**: It either parses or it fails. No subtle logic bugs from misplaced parentheses in code.
*   **Portability**: The same JSON runs on Mongo, Postgres, or a REST API.

## Comparison

| Feature | Traditional ORM | ObjectQL |
| :--- | :--- | :--- |
| **Schema Definition** | TypeScript Classes / Migration Files | JSON / YAML Metadata |
| **Query Language** | Fluent API / Raw SQL | JSON AST |
| **Runtime** | Node.js / Python Runtime | Universal Protocol (Any Language) |
| **AI Friendliness** | Low (Requires Code Gen) | High (Requires JSON Gen) |
| **Dynamic Fields** | Hard (Migration required) | Native (Metadata-driven) |

## Conclusion

If you are building a Copilot, an Autonomous Agent, or a Low-Code platform, ObjectQL provides the structured, safe, and descriptive layer that connects your LLM to your database.
