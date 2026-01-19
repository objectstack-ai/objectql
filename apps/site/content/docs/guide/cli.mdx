# CLI Guide

The ObjectQL CLI (`@objectql/cli`) is an essential tool for development, automating tasks like type generation and database migrations.

## 1. Installation

The CLI is typically installed as a dev dependency in your project.

```bash
npm install -D @objectql/cli
```

You can then run it via `npx objectql` or add scripts to your `package.json`.

## 2. Core Commands

### 2.1 `init` (Create Project)

The recommended way to create a new ObjectQL project is using the initialization package.

```bash
npm create @objectql@latest [name] [options]
```

**Options:**

| Option | Alias | Default | Description |
| :--- | :--- | :--- | :--- |
| `--template <template>` | `-t` | `starter` | Template to use (`starter`, `hello-world`). |
| `--skip-install` | | `false` | Skip dependency installation. |
| `--skip-git` | | `false` | Skip git initialization. |

**Example:**

```bash
npm create @objectql@latest my-app -- --template showcase
```

Alternatively, if you already have the CLI installed globally or in a project, you can use the legacy `init` command:

```bash
npx objectql init [options]
```

### 2.2 `generate` (Type Generation)

Scans your `*.object.yml` files and generates TypeScript interfaces. This is crucial for maintaining type safety in your Hooks and Actions.
**Alias**: `g`

```bash
npx objectql generate [options]
```

**Options:**

| Option | Alias | Default | Description |
| :--- | :--- | :--- | :--- |
| `--source <path>` | `-s` | `.` | Root directory to search for object files. |
| `--output <path>` | `-o` | `./src/generated` | Directory where `.ts` files will be generated. |

**Example:**

```bash
# Generate types from /src/objects to /src/types
npx objectql generate --source ./src/objects --output ./src/types
```

### 2.3 `new` (Scaffold Metadata)

Generate a new metadata file (Object, View, Form, etc.) in the project.

```bash
npx objectql new <type> <name> [options]
```

**Arguments:**
*   `<type>`: The type of metadata to generate (e.g., `object`, `view`, `page`).
*   `<name>`: The name of the file/entity.

**Options:**

| Option | Alias | Default | Description |
| :--- | :--- | :--- | :--- |
| `--dir <path>` | `-d` | `.` | Output directory. |

**Example:**
```bash
npx objectql new object customer
```

## 3. Development Tools

### 3.1 `dev` (Development Server)

Start the development server with hot-reload support.
**Alias**: `d`

```bash
npx objectql dev [options]
```

**Options:**

| Option | Alias | Default | Description |
| :--- | :--- | :--- | :--- |
| `--port <number>` | `-p` | `3000` | Port to listen on. |
| `--dir <path>` | `-d` | `.` | Root module directory (context). |
| `--config <path>` | `-c` | - | Path to `objectql.config.ts`. |
| `--modules <items>` | | - | Comma-separated list of modules to load (overrides config). Supports NPM packages (`@org/pkg`) or local paths (`./src/mod`). |
| `--no-watch` | | `false` | Disable file watching. |

### 3.2 `start` (Production Server)

good Start the server in production mode.

```bash
npx objectql start [options]
```

**Options:**

| Option | Alias | Default | Description |
| :--- | :--- | :--- | :--- |
| `--port <number>` | `-p` | `3000` | Port to listen on. |
| `--dir <path>` | `-d` | `.` | Root module directory (context). |
| `--config <path>` | `-c` | - | Path to `objectql.config.ts`. |
| `--modules <items>` | | - | Comma-separated list of modules to load (overrides config). |

### 3.3 `studio` (Admin UI)

Starts the web-based admin studio to browse data and view schema.
**Alias**: `ui`

```bash
npx objectql studio [options]
```

**Options:**

| Option | Alias | Default | Description |
| :--- | :--- | :--- | :--- |
| `--port <number>` | `-p` | `3000` | Port to listen on. |
| `--dir <path>` | `-d` | `.` | Directory containing schema. |
| `--no-open` | | `false` | Do not open the browser automatically. |

### 3.3 `repl` (Interactive Shell)

Starts an interactive terminal similar to the MongoDB shell, allowing you to directly query your database using the ObjectQL API.
**Alias**: `r`

```bash
npx objectql repl [options]
```

**Options:**

| Option | Alias | Default | Description |
| :--- | :--- | :--- | :--- |
| `--config <path>` | `-c` | - | Path to `objectql.config.ts/js`. |

**Example Session:**

```javascript
objectql> await tasks.find({ status: 'todo' })
[ { id: 1, title: 'Fix bug', status: 'todo' } ]
```

## 4. Internationalization (i18n)

Tools for managing translations.

### 4.1 `i18n extract`

Extract translatable strings from metadata files into JSON.

```bash
npx objectql i18n extract [options]
```

**Options:**

| Option | Alias | Default | Description |
| :--- | :--- | :--- | :--- |
| `--source <path>` | `-s` | `.` | Source directory to scan. |
| `--output <path>` | `-o` | `./src/i18n` | Output directory for translation files. |
| `--lang <lang>` | `-l` | `en` | Language code. |

### 4.2 `i18n init`

Initialize i18n structure for a new language.

```bash
npx objectql i18n init <lang> [options]
```

**Options:**

| Option | Alias | Default | Description |
| :--- | :--- | :--- | :--- |
| `--base-dir <path>` | `-b` | `./src/i18n` | Base i18n directory. |

### 4.3 `i18n validate`

Validate translation completeness against a base language.

```bash
npx objectql i18n validate <lang> [options]
```

**Options:**

| Option | Alias | Default | Description |
| :--- | :--- | :--- | :--- |
| `--base-dir <path>` | `-b` | `./src/i18n` | Base i18n directory. |
| `--base-lang <lang>` | | `en` | Base language to compare against. |

## 5. Database Migration

Manage database schema changes.

### 5.1 `migrate`

Run pending database migrations.

```bash
npx objectql migrate [options]
```

**Options:**

| Option | Alias | Default | Description |
| :--- | :--- | :--- | :--- |
| `--config <path>` | `-c` | - | Path to `objectql.config.ts/js`. |
| `--dir <path>` | `-d` | `./migrations` | Migrations directory. |

### 5.2 `migrate create`

Create a new migration file.

```bash
npx objectql migrate create <name> [options]
```

**Options:**

| Option | Alias | Default | Description |
| :--- | :--- | :--- | :--- |
| `--dir <path>` | `-d` | `./migrations` | Migrations directory. |

### 5.3 `migrate status`

Show the status of migrations (applied/pending).

```bash
npx objectql migrate status [options]
```

**Options:**

| Option | Alias | Default | Description |
| :--- | :--- | :--- | :--- |
| `--config <path>` | `-c` | - | Path to `objectql.config.ts/js`. |
| `--dir <path>` | `-d` | `./migrations` | Migrations directory. |

## 6. Integration with Workflow

We recommend adding the CLI commands to your lifecycle scripts.

**package.json:**

```json
{
  "scripts": {
    "codegen": "objectql generate -s ./src -o ./src/generated",
    "build": "npm run codegen && tsc",
    "dev": "npm run codegen && ts-node src/index.ts",
    "studio": "objectql studio"
  }
}
```

This ensures that whenever you build or start your app, your TypeScript types are perfectly synced with your YAML definitions.
