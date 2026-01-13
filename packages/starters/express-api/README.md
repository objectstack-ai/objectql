# Express API Example

This example demonstrates how to integrate ObjectQL with an Express.js server to expose a REST API.

It demonstrates:
1. Using `createNodeHandler` to mount ObjectQL as Express middleware
2. Starting an HTTP server to handle ObjectQL requests
3. Accessing data via the HTTP interface

## Run

```bash
pnpm install
pnpm start
```

Access API:
`POST http://localhost:3004/api/objectql`

## AI Assistant Support

This starter includes a `.cursorrules` file that configures Cursor and other AI coding assistants to understand ObjectQL's metadata-driven architecture. The AI will help you:

- Generate object definitions in the correct YAML format
- Write queries using the context-based API pattern
- Create hooks and actions following ObjectQL conventions
- Ensure proper error handling with `ObjectQLError`

For other IDEs, see the [AI Coding Assistant Guide](https://objectql.org/ai/coding-assistant).
