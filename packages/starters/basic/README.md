# Basic Script Example

This is a minimal example demonstrating how to use ObjectQL as a library in a simple Node.js/TypeScript script.

It demonstrates:
1. How to initialize ObjectQL (`new ObjectQL(...)`)
2. How to connect to a SQLite database
3. How to define objects (`projects.object.yml`)
4. How to perform CRUD operations in a script

## Run

```bash
pnpm install
pnpm run build
node dist/index.js
```

## AI Assistant Support

This starter includes a `.cursorrules` file that configures Cursor and other AI coding assistants to understand ObjectQL's metadata-driven architecture. The AI will help you:

- Generate object definitions in the correct YAML format
- Write queries using the context-based API pattern
- Create hooks and actions following ObjectQL conventions
- Ensure proper error handling with `ObjectQLError`

For other IDEs, see the [AI Coding Assistant Guide](https://objectql.org/ai/coding-assistant).
