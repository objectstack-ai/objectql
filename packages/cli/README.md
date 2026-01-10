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
*   **JSON API Endpoint**: `http://localhost:<port>/` (POST)
*   **OpenAPI Spec**: `http://localhost:<port>/openapi.json` (GET) - Import this into Postman or Swagger UI.

### `repl` (alias: `r`)

Start an interactive shell to query your data.

```bash
objectql repl
```

### `console` (alias: `c`)

Start a visual terminal-based UI to browse and manage database tables. Provides an intuitive alternative to the REPL.

```bash
objectql console

# With custom config
objectql console --config ./my-config.ts
```

**Features:**
- Split-pane interface (object list + data table)
- Pagination support (20 records per page)
- Record detail view
- Keyboard navigation (↑↓, Tab, Enter, n/p for pagination)
- Built-in help (press `?`)

**Keyboard Shortcuts:**
- `↑/↓` or `j/k` - Navigate
- `Tab` - Switch panels
- `Enter` - View detail
- `n/p` - Next/Previous page
- `r` - Refresh
- `q` - Quit
- `?` - Help
