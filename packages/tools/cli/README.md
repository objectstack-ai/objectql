# @objectql/cli

Command Line Interface for ObjectQL.

## Installation

```bash
npm install -g @objectql/cli
# OR
pnpm add -D @objectql/cli
```

## Commands

### `generate` (alias: `g`)

Generate TypeScript interfaces from your `object.yml` definitions.

```bash
objectql generate -s src -o src/generated
```

### `serve` (alias: `s`)

Start a lightweight development server with an in-memory database. Perfect for rapid prototyping without setting up a backend project.

```bash
# Start server in current directory (port 3000)
objectql serve

# Specify options
objectql serve --dir ./src/schema --port 8080
```

The server exposes:
*   **Web Console (Swagger UI)**: `http://localhost:<port>/swagger` (GET) - Interactive API explorer.
*   **JSON API Endpoint**: `http://localhost:<port>/` (POST)
*   **OpenAPI Spec**: `http://localhost:<port>/openapi.json` (GET)

### `repl` (alias: `r`)

Start an interactive shell to query your data.

```bash
objectql repl
```
