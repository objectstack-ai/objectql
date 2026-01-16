# ObjectQL Examples

Welcome to the ObjectQL Examples repository. This collection demonstrates everything from "Hello World" scripts to complex, module-driven enterprise architectures.

## 📂 Directory Structure

### 1. 🚀 Starters (Quick Start)
*Standard templates found in `examples/starters/`*

| Example | Description | Proficiency |
| :--- | :--- | :--- |
| **[Hello World](./starters/hello-world)** | **Absolute minimum.** A single TypeScript file using `ObjectQL` programmatically with an in-memory database. No config, no CLI. | 🟢 Basic |
| **[Express API](./starters/express-api)** | **The Standard Server.** Shows how to mount ObjectQL onto an existing Express.js application as a middleware. | 🟢 Basic |
| **[Basic Script](./starters/basic-script)** | A simple TypeScript script initializing ObjectQL with SQLite. Perfect for testing logic without a web server. | 🟢 Basic |

### 2. 🧩 Module Architecture
*Demonstrating the power of the new `modules` system in `objectql.config.ts`. See `examples/scenarios/`.*

| Example | Description | Proficiency |
| :--- | :--- | :--- |
| **[Module Composition](./scenarios/module-composition)** | **[Code](./scenarios/module-composition)** <br> Shows how to mix **Local Modules** (`./src/modules/billing`) with **External NPM Modules** (`@objectql/module-auth`) in a single application. | 💡 Intermediate |
| **[Enterprise Monorepo](./scenarios/enterprise-monorepo)** | **[Code](./scenarios/enterprise-monorepo)** <br> Organizing a large-scale application into domain-specific modules (CRM, HR, Finance). | 🏢 Advanced |

### 3. 📚 Tutorials (Step-by-Step)
*Found in `examples/tutorials/`*

| Example | Description | Proficiency |
| :--- | :--- | :--- |
| **[Task Manager](./tutorials/tutorial-task-manager)** | A simple Todo list app to learn objects, fields, and basic validation. | 🟢 Basic |
| **[CRM System](./tutorials/tutorial-crm-system)** | A relational database example with Customers, Contacts, and Deals. Demonstrates `lookup` fields. | 💡 Intermediate |
| **[AI Agent](./tutorials/tutorial-ai-agent)** | Integrating LLMs to query your data using natural language. | 🧠 AI-Native |
| **[Formulas & Rules](./tutorials/tutorial-formulas)** | Using Excel-like formula syntax for computed fields and validation. | 💡 Intermediate |
| **[Federation](./tutorials/tutorial-federation)** | Connecting multiple ObjectQL services together. | 🏢 Advanced |

### 4. 🌐 Browser Demos
*Run ObjectQL in the browser with no backend.*

| Example | Description | Proficiency |
| :--- | :--- | :--- |
| **[Memory Driver Demo](./browser-demo/)** | Interactive task manager running entirely in the browser. | 🟢 Basic |
| **[LocalStorage Demo](./browser-localstorage-demo/)** | Persistent browser storage. Ideal for offline apps. | 💡 Intermediate |

### 5. 🔌 Plugins & Extensions
*Found in `examples/plugins/`*

| Example | Description | Proficiency |
| :--- | :--- | :--- |
| **[Audit Log](./plugins/audit-log)** | How to write a generic plugin that intercepts `beforeCreate` and `afterUpdate` hooks to log changes. | 💡 Intermediate |

### 6. 🛠 Integration Snippets
*Standalone files in root `examples/`*

| Example | Description |
| :--- | :--- |
| **[Existing Database](./connect-existing-database.ts)** | How to use Introspection to generate ObjectQL schema from an existing SQL database. |
| **[Custom API Routes](./custom-api-routes.ts)** | Adding custom REST endpoints alongside the auto-generated ObjectQL API. |
| **[Schema Migration](./schema-migration-example.ts)** | Programmatic usage of the migration system. |

---

## 🏃‍♀️ How to Run

Most examples can be decoupled and run independently.

**For Starters:**
```bash
cd examples/starters/hello-world
pnpm install
pnpm start
```

**For Modules/Scenarios:**
```bash
# From root
pnpm objectql dev --dir examples/tutorials/tutorial-task-manager
```

