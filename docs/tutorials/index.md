# ObjectQL Tutorials

Welcome to the ObjectQL learning path. These tutorials are designed to take you from a complete beginner to an advanced architect.

## 👶 Beginner

### [Build Your First App: Task Manager](./task-manager.md)
**Time**: 15 mins
**Goal**: Create a simple schema, run the server, and manage data via the Studio.
- Define `Task` object
- Use `npm run studio`
- Query data via JSON

## 🧑‍💻 Intermediate

### [Building a Micro-CRM](./crm-system.md)
**Time**: 30 mins
**Goal**: Learn relationships, permissions, and business logic.
- Define `Account` and `Contact` with 1:N relationships
- Add `Validation` (e.g., "Email is required")
- Write a `beforeCreate` hook to normalize data

## 🏗 Advanced

### [Federated Data Graph](./federation.md)
**Time**: 45 mins
**Goal**: Connect multiple databases into one graph.
- Setup Mongo for `Logs`
- Setup Postgres for `Transactional Data`
- Query across them transparently
