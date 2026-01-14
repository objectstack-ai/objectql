# Architecture & Concepts

ObjectQL is built with a modular architecture that separates the data definition (Metadata) from the execution engine (Driver). This design allows applications to run on different database stacks (SQL vs NoSQL) without changing the business logic.

## High-Level Overview

An ObjectQL application consists of three main layers:

1.  **Metadata Layer**: JSON/YAML files that define the shape of your data (`.object.yml`) and operations.
2.  **Core Engine**: The `ObjectQL` class that loads metadata, validates requests, and orchestrates execution.
3.  **Driver Layer**: Adapters that translate ObjectQL requests into database-specific queries (SQL, Mongo Protocol, etc.).

## Dependency Graph

The project is structured as a monorepo with strict dependency rules to ensure scalability and maintainability.

*   **`@objectql/types`**: The shared contract. Contains all interfaces (`ObjectConfig`, `ObjectQLDriver`). Has **zero dependencies**.
*   **`@objectql/core`**: The main runtime. It depends on `types`.
*   **`@objectql/driver-*`**: Database adapters. They implement interfaces from `types` but do **not** depend on `core` (avoiding circular dependencies).

## Core Concepts

### 1. Metadata-First
In traditional ORMs (like TypeORM or Prisma), you define classes/schema in code. In ObjectQL, the schema is data itself. This allows:
*   Dynamic schema generation at runtime.
*   Building "No-Code" table designers.
*   Hot-reloading of data structure without recompiling.

### 2. Universal Protocol
ObjectQL uses a unified JSON-based query language (AST). This allows frontends, AI agents, or external systems to send complex queries (`filters`, `expand`, `aggregates`) in a safe, serializable format.

### 3. Logic: Actions & Hooks
*   **Hooks**: Intercept standard CRUD operations (e.g., "Before Create", "After Update") to enforce business rules.
*   **Actions**: Define custom RPC methods (e.g., "Approve Invoice") exposed via the API.
