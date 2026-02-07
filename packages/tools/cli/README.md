# @objectql/cli

Command Line Interface for ObjectQL - A comprehensive toolkit for building, managing, and deploying ObjectQL applications.

## Installation

```bash
npm install -g @objectql/cli
# OR
pnpm add -D @objectql/cli
```

## Commands

### Lifecycle (Delegated to @objectstack/cli)

The following commands are now delegated to **@objectstack/cli**:

- `objectql init` → `objectstack create`
- `objectql dev` → `objectstack dev`
- `objectql start` → `objectstack serve`
- `objectql doctor` → `objectstack doctor`

You can use either `objectstack` or the short alias `os`:

```bash
npx objectstack dev
npx os serve
npx objectstack doctor
npx objectstack create
```

### Metadata & Tooling (This CLI)

This CLI focuses on metadata scaffolding, type generation, database workflows, i18n, and local tooling:

- `generate`, `new`, `db push`, `db pull`, `migrate`
- `i18n extract`, `i18n init`, `i18n validate`
- `lint`, `format`, `repl`, `test`, `build`


### Metadata Generation

#### `new <type> <name>`

Generate a new metadata file with boilerplate code.

```bash
# Create a new object definition
objectql new object users

# Create a view
objectql new view user_list

# Create a form
objectql new form user_edit

# Create in a specific directory
objectql new object products --dir ./src/modules/catalog
```

**Supported Types:**
- `object` - Object/Entity definition
- `view` - Data view configuration
- `form` - Form layout
- `page` - Page definition
- `action` - Custom action (generates .yml + .ts)
- `hook` - Lifecycle hook (generates .yml + .ts)
- `permission` - Permission rules
- `validation` - Validation rules
- `workflow` - Workflow automation
- `report` - Report definition
- `menu` - Menu configuration
- `data` - Sample data

**Options:**
- `-d, --dir <path>` - Output directory [default: "."]

---

### TypeScript Code Generation

#### `generate` (alias: `g`)

Generate TypeScript interfaces from your `object.yml` definitions.

```bash
# Generate types from current directory
objectql generate

# Specify source and output directories
objectql generate -s src -o src/generated

# Generate from specific path
objectql generate --source ./metadata --output ./types
```

**Options:**
- `-s, --source <path>` - Source directory containing *.object.yml [default: "."]
- `-o, --output <path>` - Output directory for generated types [default: "./src/generated"]

---

### Internationalization (i18n)

#### `i18n extract`

Extract translatable strings from metadata files and create translation files.

```bash
# Extract to default location (./src/i18n/en)
objectql i18n extract

# Extract for specific language
objectql i18n extract --lang zh-CN

# Custom source and output directories
objectql i18n extract -s ./metadata -o ./translations --lang fr
```

**Options:**
- `-s, --source <path>` - Source directory [default: "."]
- `-o, --output <path>` - Output directory [default: "./src/i18n"]
- `-l, --lang <lang>` - Language code [default: "en"]

#### `i18n init <lang>`

Initialize i18n structure for a new language.

```bash
# Initialize for Chinese (Simplified)
objectql i18n init zh-CN

# Initialize for French
objectql i18n init fr

# Custom base directory
objectql i18n init es --base-dir ./translations
```

**Options:**
- `-b, --base-dir <path>` - Base i18n directory [default: "./src/i18n"]

#### `i18n validate <lang>`

Validate translation completeness against base language.

```bash
# Validate Chinese translations against English
objectql i18n validate zh-CN

# Use custom base language
objectql i18n validate fr --base-lang en

# Custom directory
objectql i18n validate es --base-dir ./translations
```

**Options:**
- `-b, --base-dir <path>` - Base i18n directory [default: "./src/i18n"]
- `--base-lang <lang>` - Base language to compare against [default: "en"]

---

### Database Migrations

#### `migrate`

Run pending database migrations.

```bash
# Run all pending migrations
objectql migrate

# Specify custom config file
objectql migrate --config ./config/objectstack.config.ts

# Custom migrations directory
objectql migrate --dir ./db/migrations
```

**Options:**
- `-c, --config <path>` - Path to objectstack.config.ts/js
- `-d, --dir <path>` - Migrations directory [default: "./migrations"]

#### `migrate create <name>`

Create a new migration file.

```bash
# Create a new migration
objectql migrate create add_status_field

# Custom directory
objectql migrate create init_schema --dir ./db/migrations
```

**Options:**
- `-d, --dir <path>` - Migrations directory [default: "./migrations"]

#### `migrate status`

Show migration status (pending vs. completed).

```bash
# Show migration status
objectql migrate status

# With custom config
objectql migrate status --config ./config/objectstack.config.ts
```

**Options:**
- `-c, --config <path>` - Path to objectstack.config.ts/js
- `-d, --dir <path>` - Migrations directory [default: "./migrations"]

#### `sync`

Introspect an existing SQL database and generate ObjectQL `.object.yml` files from the database schema. This is useful for:
- Connecting to an existing/legacy database
- Reverse-engineering database schema to ObjectQL metadata
- Bootstrapping a new ObjectQL project from an existing database

```bash
# Sync all tables from the database
objectql sync

# Sync specific tables only
objectql sync --tables users posts comments

# Custom output directory
objectql sync --output ./src/metadata/objects

# Overwrite existing files
objectql sync --force

# With custom config file
objectql sync --config ./config/objectstack.config.ts
```

**Options:**
- `-c, --config <path>` - Path to objectstack.config.ts/js
- `-o, --output <path>` - Output directory for .object.yml files [default: "./src/objects"]
- `-t, --tables <tables...>` - Specific tables to sync (default: all tables)
- `-f, --force` - Overwrite existing .object.yml files

**Features:**
- Automatically detects table structure (columns, data types, constraints)
- Maps SQL types to appropriate ObjectQL field types
- Identifies foreign keys and converts them to `lookup` relationships
- Generates human-readable labels from table/column names
- Preserves field constraints (required, unique, maxLength)
- Skips system fields (id, created_at, updated_at) as they're automatic in ObjectQL

**Example:**

Given a database with this table structure:
```sql
CREATE TABLE users (
    id VARCHAR PRIMARY KEY,
    username VARCHAR UNIQUE NOT NULL,
    email VARCHAR NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

Running `objectql sync` generates:
```yaml
# users.object.yml
name: users
label: Users
fields:
  username:
    type: text
    label: Username
    required: true
    unique: true
  email:
    type: text
    label: Email
    required: true
  is_active:
    type: boolean
    label: Is Active
    defaultValue: true
```

---

### Development Tools

#### `dev`

Development server is delegated to **@objectstack/cli**:

```bash
npx objectstack dev
# or
npx os dev
```

#### `start`

Production server is delegated to **@objectstack/cli**:

```bash
npx objectstack serve
# or
npx os serve
```

#### `build` (alias: `b`)

Build project and prepare for production deployment. Validates metadata, generates TypeScript types, and copies files to dist folder.

```bash
# Build project
objectql build

# Build with custom output directory
objectql build --output ./build

# Build without type generation
objectql build --no-types

# Build without validation
objectql build --no-validate
```

**Options:**
- `-d, --dir <path>` - Source directory [default: "."]
- `-o, --output <path>` - Output directory [default: "./dist"]
- `--no-types` - Skip TypeScript type generation
- `--no-validate` - Skip metadata validation

**Build Steps:**
1. Validates all metadata files
2. Generates TypeScript type definitions (if enabled)
3. Copies all metadata files (.yml) to dist folder

#### `test` (alias: `t`)

Run tests for the ObjectQL project. Automatically detects and runs Jest tests if configured.

```bash
# Run all tests
objectql test

# Run tests in watch mode
objectql test --watch

# Run tests with coverage report
objectql test --coverage

# Specify project directory
objectql test --dir ./src
```

**Options:**
- `-d, --dir <path>` - Project directory [default: "."]
- `-w, --watch` - Watch mode (re-run tests on file changes)
- `--coverage` - Generate coverage report

**Requirements:**
- Jest must be installed and configured in package.json
- Falls back to `npm test` if Jest is not detected

#### `lint` (alias: `l`)

Validate metadata files for correctness and best practices.

```bash
# Lint all metadata files
objectql lint

# Lint specific directory
objectql lint --dir ./src/objects

# Auto-fix issues (future feature)
objectql lint --fix
```

**Options:**
- `-d, --dir <path>` - Directory to lint [default: "."]
- `--fix` - Automatically fix issues (future feature)

**Validation Rules:**
- Object and field names must be lowercase with underscores
- All objects should have labels
- All fields should have labels
- No empty objects (objects must have at least one field)

#### `format` (alias: `fmt`)

Format metadata files using Prettier for consistent styling.

```bash
# Format all YAML files
objectql format

# Format specific directory
objectql format --dir ./src

# Check formatting without modifying files
objectql format --check
```

**Options:**
- `-d, --dir <path>` - Directory to format [default: "."]
- `--check` - Check if files are formatted without modifying them

**Formatting Rules:**
- Uses Prettier with YAML parser
- Print width: 80 characters
- Tab width: 2 spaces
- Single quotes for strings

#### `serve`

Production server is delegated to **@objectstack/cli**:

```bash
npx objectstack serve
# or
npx os serve
```
- `-d, --dir <path>` - Directory containing schema [default: "."]

#### `repl` (alias: `r`)

Start an interactive shell to query your data.

```bash
# Start REPL
objectql repl

# Use custom config
objectql repl --config ./objectstack.config.ts
```

**Options:**
- `-c, --config <path>` - Path to objectstack.config.ts/js

**Example REPL session:**
```javascript
objectql> await tasks.find()
objectql> await tasks.insert({ name: 'New Task', status: 'open' })
objectql> await tasks.update({ _id: '123' }, { status: 'completed' })
```

## Typical Workflows

### Starting a New Project

```bash
# 1. Create project
npx objectstack create

# 2. Navigate to project
cd my-app

# 3. Install dependencies (if skipped)
pnpm install

# 4. Start development
npx objectstack dev
```

### Adding New Functionality

```bash
# 1. Create object definition
objectql new object products

# 2. Edit the generated file: products.object.yml

# 3. Generate TypeScript types
objectql generate

# 4. Add translations
objectql i18n extract --lang en
objectql i18n init zh-CN
objectql i18n extract --lang zh-CN

# 5. Test in REPL
objectql repl
> await products.find()
```

### Managing Translations

```bash
# 1. Initialize new language
objectql i18n init zh-CN

# 2. Extract all translatable strings
objectql i18n extract --lang zh-CN

# 3. Translate the JSON files in src/i18n/zh-CN/

# 4. Validate completeness
objectql i18n validate zh-CN
```

### Database Migrations

```bash
# 1. Create migration
objectql migrate create add_priority_field

# 2. Edit migration file in migrations/

# 3. Check status
objectql migrate status

# 4. Run migrations
objectql migrate
```

---

## Configuration File

Most commands expect an `objectstack.config.ts` or `objectstack.config.js` file in your project root:

```typescript
// objectstack.config.ts
import { ObjectQL } from '@objectql/core';
import { SqlDriver } from '@objectql/driver-sql';
import { ObjectLoader } from '@objectql/platform-node';
import * as path from 'path';

const app = new ObjectQL({
    datasources: {
        default: new SqlDriver({
            client: 'sqlite3',
            connection: {
                filename: path.join(__dirname, 'dev.sqlite3')
            },
            useNullAsDefault: true
        })
    }
});

const loader = new ObjectLoader(app.metadata);
loader.load(path.join(__dirname, 'src'));

export default app;
```

---

## Environment Variables

Some commands support environment variables for configuration:

- `OBJECTQL_CONFIG` - Path to config file
- `OBJECTQL_DB_URL` - Database connection string

---

## Getting Help

```bash
# Show all commands
objectql --help

# Show help for specific command
objectql generate --help
objectql i18n extract --help
objectql migrate --help

# ObjectStack CLI lifecycle help
objectstack --help
```

---

## License

MIT
