---
layout: home

hero:
  name: ObjectQL
  text: The Standard Protocol for AI Software Generation
  tagline: A universal, metadata-driven ORM and protocol designed to empower LLMs to generate enterprise apps without hallucinations.
  image:
    src: /logo.svg
    alt: ObjectQL Logo
  actions:
    - theme: brand
      text: 📖 Read the Guide
      link: /guide/getting-started
    - theme: alt
      text: 🤖 AI-Native Development
      link: /ai/
    - theme: alt
      text: 🔌 API Reference
      link: /api/

features:
  - icon: 🛡️
    title: No Hallucinations
    details: Schema-first architecture ensures LLMs generate valid queries against a strict contract, eliminating phantom columns and tables.
  - icon: 📉
    title: Token Efficient
    details: Compact YAML/JSON metadata and declarative logic reduce context window usage compared to verbose ORM code generation.
  - icon: 🧩
    title: Metadata-Driven
    details: All logic (Schema, Validation, Permissions) is defined in declarative files. Perfect for RAG and Long-term Agent Memory.
  - icon: 🌍
    title: Universal Runtime
    details: Write once, run anywhere. The core protocol abstracts PostgreSQL, MongoDB, and SQLite, running in Node.js, Browser, or Edge.
---

## The Protocol in Action

ObjectQL bridges the gap between AI generation and reliable execution.

### 1. Declarative Modeling

Define your data model in simple, human and machine-readable YAML.

::: code-group

```yaml [account.object.yml]
name: account
label: Account
fields:
  name: { type: text, required: true }
  industry: 
    type: select
    options: [tech, finance, retail]
  revenue: currency
  status: { type: select, options: [active, vip] }
```

```yaml [account.validation.yml]
# Cross-field logic without writing code
rules:
  vip_revenue_check:
    when: "status == 'vip'"
    expect: "revenue > 1000000"
    message: "VIP accounts require >1M revenue"
```

:::

### 2. Hallucination-Free Querying

LLMs generate structured JSON queries instead of error-prone SQL strings.

::: code-group

```json [Request (JSON Protocol)]
{
  "fields": ["name", "revenue", "owner.name"],
  "filters": [
    ["industry", "=", "tech"], 
    "and", 
    ["revenue", ">", 500000]
  ]
}
```

```sql [Generated SQL (Postgres)]
SELECT t1.name, t1.revenue, t2.name 
FROM account AS t1
LEFT JOIN users AS t2 ON t1.owner = t2.id
WHERE t1.industry = 'tech' 
  AND t1.revenue > 500000
```
:::

## The Shift to AI Programming

We believe the future of software development isn't about humans writing better code—it's about **Humans architecting systems that AI can implement**.

To achieve this, we need a backend technology that speaks the same language as the AI.

### Why not just use TypeORM/Prisma?

Traditional ORMs are designed for *human ergonomics*. They use complex fluent APIs, generic types, and string templates. For an LLM, these are "fuzzy" targets that lead to:
*   **Hallucinations**: Inventing methods that don't exist.
*   **Context Window Bloat**: Needing huge type definition files to understand the schema.
*   **Injection Risks**: Generating unsafe raw SQL strings.

### The ObjectQL Advantage

ObjectQL abstracts the entire backend into a **Standardized Protocol**:

1.  **Schema is Data**: `user.object.yml` is easier for AI to read/write than `class User extends Entity`.
2.  **Logic is Data**: Queries are ASTs like `{ op: 'find', filters: [['age', '>', 18]] }`. 100% deterministic.
3.  **Self-Describing**: The runtime can introspect any ObjectQL endpoint and explain it to an Agent instantly.

## Next Steps

*   **[🤖 Configure your AI Assistant](./ai/coding-assistant.md)**: Get the System Prompts to turn Cursor/Copilot into an ObjectQL expert.
*   **[🚀 Start a Tutorial](./tutorials/index.md)**: Build a Task Manager or CRM in minutes to understand the flow.
*   **[🔌 Building AI Agents](./ai/building-apps.md)**: Learn how to use ObjectQL as the tool interface for autonomous agents.
*   **[📚 Developer Guide](./guide/getting-started.md)**: The classic manual for human developers.
