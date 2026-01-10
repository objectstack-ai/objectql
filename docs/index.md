---
layout: home

hero:
  name: ObjectQL
  text: The Data Layer for the AI Era
  tagline: A universal, protocol-first ORM. Write logic once in JSON, run anywhere. Designed for LLMs, Agents, and Low-Code.
  image:
    src: /logo.svg
    alt: ObjectQL Logo
  actions:
    - theme: brand
      text: Quick Start
      link: /guide/getting-started
    - theme: alt
      text: AI Integration
      link: /guide/ai

features:
  - icon: 🤖
    title: AI-Native Protocol
    details: Queries are defined as strict JSON ASTs, not strings. This eliminates SQL injection and makes it trivial for LLMs to generate correct, hallucination-free queries.
  - icon: 🚀
    title: Write Once, Run Anywhere
    details: Define your business objects in YAML/JSON. Run seamlessly on MongoDB for flexibility or PostgreSQL for strict consistency without changing a line of code.
  - icon: 🧩
    title: Logic as Data
    details: Actions (RPC) and Hooks (Triggers) are first-class citizens of the protocol, allowing you to model not just data, but behavior and state transitions.
  - icon: ⚡
    title: Enterprise Ready
    details: Built-in support for Multi-tenancy, Row Level Security (RLS), and RBAC. Strict TypeScript typings ensuring reliability from day one.
---

## Why ObjectQL?

We are moving from an era of **Hand-written Code** to **AI-Generated Logic**. 

Traditional ORMs (Sequelize, TypeORM, Prisma) were designed for humans to write code in IDEs. They rely on complex class inheritance, string template interpolation, and language-specific DSLs.

**ObjectQL is designed for Agents.**

### The Difference

| | Traditional ORM | ObjectQL |
| :--- | :--- | :--- |
| **Schema Definition** | TypeScript/Python Classes | **JSON / YAML Metadata** |
| **Query Format** | Method Chaining (`.where(...)`) | **JSON AST** (`{ filters: [...] }`) |
| **AI Compatibility** | Hard (requires parsing code) | **Native** (LLMs speak JSON) |
| **Portability** | Language Bound (Node/Python) | **Universal Protocol** |

## Get Started

*   **[Installation & Hello World](/guide/getting-started)**: Build your first API in 5 minutes.
*   **[Building AI Apps](/guide/ai)**: Learn how to connect GPT-4 to your database safely.
*   **[Core Concepts](/guide/data-modeling)**: Define Objects, Fields, and Relationships.
