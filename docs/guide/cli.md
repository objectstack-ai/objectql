# CLI Guide

The ObjectQL CLI (`@objectql/cli`) is an essential tool for development, automating tasks like type generation and database migrations.

## 1. Installation

The CLI is typically installed as a dev dependency in your project.

```bash
npm install -D @objectql/cli
```

You can then run it via `npx objectql` or add scripts to your `package.json`.

## 2. Commands

### 2.1 `generate` (Type Generation)

Scans your `*.object.yml` files and generates TypeScript interfaces. This is crucial for maintaining type safety in your Hooks and Actions.

**Usage:**

```bash
npx objectql generate [options]
```

**Options:**

| Option | Alias | Default | Description |
| :--- | :--- | :--- | :--- |
| `--source` | `-s` | `.` | Root directory to search for object files. |
| `--output` | `-o` | `./src/generated` | Directory where `.ts` files will be generated. |

**Example:**

```bash
# Generate types from /src/objects to /src/types
npx objectql generate --source ./src/objects --output ./src/types
```

### 2.2 `repl` (Interactive Shell)

Starts an interactive terminal similar to the MongoDB shell, allowing you to directly query your database using the ObjectQL API.

**Prerequisites:**

You must have an `objectql.config.ts` or `objectql.config.js` file in your project root that exports your configured `ObjectQL` instance (default export or named export `app`).

**Usage:**

```bash
npx objectql repl
```

**Features:**
*   **Auto-injected Objects:** All your registered objects are available as global variables (e.g., `await tasks.find()`).
*   **Context:** The `app` instance is available as `app`.
*   **Sudo Access:** Commands run with system privileges by default in the REPL.

**Example Session:**

```javascript
objectql> await tasks.find({ status: 'todo' })
[ { id: 1, title: 'Fix bug', status: 'todo' } ]

objectql> await projects.create({ name: 'New API' })
{ id: 10, name: 'New API', ... }
```

### 2.3 `console` (Visual Database Browser)

Starts a terminal-based visual interface for browsing and managing your database tables. This provides an alternative to the REPL for users who prefer a graphical interface.

**Prerequisites:**

You must have an `objectql.config.ts` or `objectql.config.js` file in your project root that exports your configured `ObjectQL` instance (default export or named export `app`).

**Usage:**

```bash
npx objectql console
# or with alias
npx objectql c

# With custom config file
npx objectql console --config path/to/objectql.config.ts
```

**Features:**
*   **Split-pane Interface:** Object list on the left, data table on the right
*   **Pagination:** Navigate through large datasets (20 records per page)
*   **Record Detail View:** View full record details in an overlay
*   **Keyboard Navigation:** Intuitive keyboard shortcuts
*   **Help System:** Built-in help screen (press `?`)

**Keyboard Shortcuts:**

| Key | Action |
| :--- | :--- |
| `↑` / `↓`, `j` / `k` | Navigate up/down |
| `Tab` | Switch between panels |
| `Enter` | View record detail |
| `Escape` | Close detail view |
| `n` | Next page |
| `p` | Previous page |
| `r` | Refresh data |
| `?`, `h` | Show help |
| `q`, `Ctrl+C` | Quit |

**Example Usage:**

```bash
# Start the console
npm run console

# Use arrow keys to select an object (e.g., "projects")
# Use arrow keys to browse records
# Press Enter to view a record in detail
# Press Escape to return to the list
# Press 'n' to go to the next page
# Press 'q' to quit
```

For more details, see the [Visual Console Guide](../console.md).

### 2.4 `serve` (Development Server)

Starts a development HTTP server with your ObjectQL instance, allowing you to test API calls.

**Usage:**

```bash
npx objectql serve [options]
```

**Options:**

| Option | Alias | Default | Description |
| :--- | :--- | :--- | :--- |
| `--port` | `-p` | `3000` | Port to listen on |
| `--dir` | `-d` | `.` | Directory containing schema files |

**Example:**

```bash
npx objectql serve --port 4000 --dir ./src
```

### 2.5 `migration` (Coming Soon)

Future versions will include migration commands to sync your YAML schema with the database.

*   `migration:create`: Create a new SQL migration file based on schema changes.
*   `migration:run`: Apply pending migrations to the database.

## 3. Integration with Workflow

We recommend adding the generation command to your lifecycle scripts.

**package.json:**

```json
{
  "scripts": {
    "codegen": "objectql generate -s ./src -o ./src/generated",
    "build": "npm run codegen && tsc",
    "dev": "npm run codegen && ts-node src/index.ts"
  }
}
```

This ensures that whenever you build or start your app, your TypeScript types are perfectly synced with your YAML definitions.
