# ObjectQL Examples Gallery

Welcome to the ObjectQL examples collection. This directory is organized to help you find the right starting point for your needs, from simple scripts to complex real-world applications.

## 📚 Quick References

| Resource | Description |
| :--- | :--- |
| **[Attachment Upload Demo](./attachment-upload-demo.md)** | Complete guide to uploading files, handling images, creating records with attachments, and implementing file upload components |

## 🌐 Browser Demos
*ObjectQL running directly in web browsers - no backend required!*

| Example | Description | Proficiency |
| :--- | :--- | :--- |
| **[Memory Driver Demo](./browser-demo/)** | Interactive task manager running entirely in the browser with in-memory storage. Perfect for prototyping and understanding ObjectQL's client-side capabilities. | 🌱 Beginner |
| **[LocalStorage Demo](./browser-localstorage-demo/)** | Persistent browser storage that survives page refreshes. Ideal for offline apps, PWAs, and user preferences. | ⚡️ Intermediate |

**Features:**
- 🎨 Beautiful interactive UI with live CRUD operations
- 📊 Real-time statistics dashboard
- 🖥️ Browser console debugging (`window.app`, `window.taskRepo`)
- ✨ Sample data generation
- 🔄 Filter and manage data visually

## 🚀 Starters
*Boilerplates and minimal setups to get you coding in seconds.*

| Example | Description | Proficiency |
| :--- | :--- | :--- |
| **[Basic Script](./starters/basic-script)** | A simple TypeScript script initializing ObjectQL with SQLite. Perfect for testing logic. | 🌱 Beginner |
| **[Express API](./starters/express-api)** | A REST API server using Express.js + ObjectQL. Shows how to mount the server adapter. | ⚡️ Intermediate |

## 🧩 Plugins & Extensions
*Learn how to extend the core capabilities of ObjectQL.*

| Example | Description | Proficiency |
| :--- | :--- | :--- |
| **[Audit Log](./plugins/audit-log)** | A fully functional plugin that tracks changes (`afterCreate`, `afterUpdate`) and stores them. | 🔧 Advanced |

## 🏗 Scenarios & Patterns
*Demonstrations of specific architectural patterns.*

| Example | Description | Proficiency |
| :--- | :--- | :--- |
| **[Enterprise Structure](./scenarios/enterprise-structure)** | **[NEW]** Best practices for organizing metadata in large-scale applications. Shows domain-driven module structure with 20+ objects across CRM, HR, Finance, and Project modules. | 🏢 Advanced |
| **[Preset Usage](./scenarios/preset-usage)** | Shows how to consume pre-packaged business logic (presets) in an application. | 💡 Intermediate |

## 🚧 Coming Soon
We are working on high-fidelity examples:
- **CRM System**: A Salesforce-like CRM with rich permission rules.
- **E-Commerce**: High-performance catalog and order management.
- **Next.js Integration**: Using Server Actions with ObjectQL.
- **AI RAG Demo**: Semantic search connecting to OpenAI.

---
## How to Run

Each example is a self-contained NPM package.

```bash
cd examples/starters/express-api
pnpm install
pnpm start
```

- [ObjectQL Documentation](../docs/)
- [Metadata Specification](../docs/spec/metadata-format.md)
- [Metadata Protection Guide](../docs/spec/metadata-format.md#9-metadata-protection)
