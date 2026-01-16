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
