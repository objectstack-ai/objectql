# ObjectQL

  **The Universal Data Protocol & Metadata-Driven ORM.**
  
  Define your data in JSON/YAML. Run anywhere: Node.js, Browser, Edge.

  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![TypeScript](https://img.shields.io/badge/written%20in-TypeScript-3178C6.svg)](https://www.typescriptlang.org/)
  [![NPM](https://img.shields.io/npm/v/@objectql/core.svg)](https://www.npmjs.com/package/@objectql/core)


---

## 🌐 Introduction

**ObjectQL** is a universal data protocol and ORM engine designed for the modern full-stack era. 

Unlike traditional ORMs (TypeORM, Prisma) that compile schema to static code, ObjectQL works dynamically at runtime based on **JSON/YAML Metadata**. This makes it perfect for Low-Code platforms, CMSs, and dynamic applications where the data model might change on the fly.

**Why ObjectQL?**
* **Universal Runtime:** The core engine has **zero dependencies** on Node.js native modules. It runs in Browsers, Cloudflare Workers, and Deno.
* **Declarative Schema:** Define fields, validations, and relationships in simple YAML. No complex Model classes.
* **Driver Agnostic:** Switch between PostgreSQL, MongoDB, SQLite, or even a Remote API without changing your business logic.
* **Hybrid Storage:** Seamlessly combines structured SQL columns with JSONB dynamic fields.

---

## 📦 Architecture

ObjectQL is organized as a Monorepo to ensure modularity and universal compatibility.

| Package | Environment | Description |
| :--- | :--- | :--- |
| **`@objectql/types`** | Universal | **The Contract.** Pure TypeScript interfaces defining the protocol. |
| **`@objectql/core`** | Universal | **The Engine.** The runtime logic, validation, and repository pattern. |
| **`@objectql/driver-sql`** | Node.js | Adapter for SQL databases (Postgres, MySQL, SQLite) via Knex. |
| **`@objectql/driver-mongo`** | Node.js | Adapter for MongoDB. |
| **`@objectql/sdk`** | Universal | **Remote Driver.** Connects to an ObjectQL server via HTTP. |
| **`@objectql/platform-node`**| Node.js | Utilities for loading YAML files from the filesystem. |

---

## ⚡ Quick Start

### 1. Installation

```bash
# Install core and a driver (e.g., Postgres)
npm install @objectql/core @objectql/driver-sql pg

```

### 2. Define Schema (The "Object")

Create a simple definition object (or load it from a `.yml` file).

```typescript
const UserObject = {
  name: "users",
  fields: {
    name: { type: "text", required: true },
    email: { type: "email", unique: true },
    role: { 
      type: "select", 
      options: ["admin", "user"], 
      default: "user" 
    }
  }
};

```

### 3. Initialize & Query

ObjectQL provides a unified API regardless of the underlying database.

```typescript
import { ObjectQL } from '@objectql/core';
import { SqlDriver } from '@objectql/driver-sql';

async function main() {
  // 1. Initialize Engine
  const objectql = new ObjectQL();
  
  // 2. Register Driver
  const driver = new SqlDriver({
    connection: process.env.DATABASE_URL
  });
  objectql.registerDriver(driver);

  // 3. Register Object
  objectql.register(UserObject);

  // 4. Enjoy Type-Safe(ish) CRUD
  const repo = objectql.getRepository('users');

  // Create
  await repo.insert({ name: 'Alice', email: 'alice@example.com' });

  // Find
  const users = await repo.find({
    filters: [['role', '=', 'user']]
  });
  
  console.log(users);
}

main();

```

---

## 🔌 The Driver Ecosystem

ObjectQL isolates the "What" (Query) from the "How" (Execution).

### SQL Driver (`@objectql/driver-sql`)

* Supports PostgreSQL, MySQL, SQLite, SQL Server.
* **Smart Hybrid Mode:** Automatically maps defined fields to SQL columns and undefined fields to a `_jsonb` column. This gives you the speed of SQL with the flexibility of NoSQL.

### Mongo Driver (`@objectql/driver-mongo`)

* Native translation to Aggregation Pipelines.
* High performance for massive datasets.

### SDK / Remote Driver (`@objectql/sdk`)

* **The Magic:** You can run ObjectQL in the **Browser**.
* Instead of connecting to a DB, it connects to an ObjectQL Server API.
* The API usage remains exactly the same (`repo.find(...)`), but it runs over HTTP.

---

## 🛠️ Validation & Logic

ObjectQL includes a powerful validation engine that runs universally.

```yaml
# user.validation.yml
fields:
  age:
    min: 18
    message: "Must be an adult"
  
  # Cross-field validation supported!
  end_date:
    operator: ">"
    compare_to: "start_date"

```

This validation logic runs:

1. **On the Client (Browser):** For immediate UI feedback (via Object UI).
2. **On the Server:** For data integrity security.
*Write once, validate everywhere.*

---

## ⚖️ License

ObjectQL is open-source software licensed under the [MIT License](https://www.google.com/search?q=LICENSE).

You can use it freely in personal, commercial, or open-source projects.

---

<div align="center">
<sub><b>The Foundation of the Object Ecosystem</b></sub>




<sub><b>ObjectQL (Data)</b> • <a href="https://github.com/objectql/objectos">ObjectOS (System)</a> • <a href="https://github.com/objectql/objectui">Object UI (View)</a></sub>
</div>

```
