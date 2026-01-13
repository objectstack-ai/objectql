# @objectql/cli

Command Line Interface for ObjectQL - A comprehensive toolkit for building, managing, and deploying ObjectQL applications.

## Installation

```bash
npm install -g @objectql/cli
# OR
pnpm add -D @objectql/cli
```

## Commands

### AI-Powered Features

The `ai` command provides AI-powered application generation and assistance. **By default, it starts in interactive conversational mode** for the best experience.

#### Interactive Mode (Default)

Simply type `objectql ai` to start building your application through conversation.

```bash
# Start interactive conversational builder (most common use case)
objectql ai

# Specify output directory
objectql ai ./src/my-app
```

The interactive mode:
- Guides you step-by-step through application creation
- Lets you describe what you want in natural language
- Generates metadata, TypeScript implementations, and tests
- Allows iterative refinement through dialogue
- Provides suggestions for next steps

---

#### One-Shot Generation

For quick, non-interactive generation from a single description.

```bash
# Generate from a description
objectql ai generate -d "A task management system with projects and tasks"

# Generate complete enterprise application
objectql ai generate -d "CRM with customers, contacts, opportunities" -t complete -o ./src

# Generation types: basic, complete, custom (default)
objectql ai generate -d "Inventory system" -t complete
```

**Options:**
- `-d, --description <text>` - Application description (required)
- `-o, --output <path>` - Output directory [default: "./src"]
- `-t, --type <type>` - Generation type: basic, complete, or custom [default: "custom"]

**Generates:**
- ObjectQL metadata (objects, forms, views, pages, menus, etc.)
- TypeScript implementations for actions and hooks
- Jest test files for business logic validation

---

#### Validation

Validate metadata files using AI for compliance and best practices.

```bash
# Validate all metadata files
objectql ai validate ./src

# Validate with detailed output
objectql ai validate ./src -v

# Validate and auto-fix issues
objectql ai validate ./src --fix
```

**Options:**
- `<path>` - Path to metadata directory (required)
- `--fix` - Automatically fix issues where possible
- `-v, --verbose` - Show detailed validation output

**Checks:**
- YAML syntax validation
- ObjectQL specification compliance
- Business logic consistency
- Data model best practices
- Security and performance analysis
- Falls back to basic validation if no API key is set

---

#### Chat Assistant

Interactive AI assistant for ObjectQL questions and guidance.

```bash
# Start chat assistant
objectql ai chat

# Start with an initial question
objectql ai chat -p "How do I create a lookup relationship?"
```

**Options:**
- `-p, --prompt <text>` - Initial prompt for the AI

---

#### Complete Example Workflow

```bash
# Set your API key
export OPENAI_API_KEY=sk-your-api-key-here

# Option 1: Interactive (recommended) - Just type this!
objectql ai

# Option 2: Quick one-shot generation
objectql ai generate -d "Project management with tasks and milestones" -t complete

# Validate the generated files
objectql ai validate ./src -v

# Get help with questions
objectql ai chat -p "How do I add email notifications?"
```

---

### Prerequisites

For AI-powered features, set your OpenAI API key:

```bash
export OPENAI_API_KEY=sk-your-api-key-here
```

Without an API key, basic validation (YAML syntax) is still available.

---

### Project Initialization

#### `init`

Create a new ObjectQL project from a template.

```bash
# Interactive mode (prompts for options)
objectql init

# With options
objectql init --template basic --name my-project

# Available templates: basic, express-api, enterprise
objectql init -t express-api -n my-api-server

# Skip automatic dependency installation
objectql init --skip-install

# Skip git initialization
objectql init --skip-git
```

**Options:**
- `-t, --template <template>` - Template to use (basic, express-api, enterprise) [default: "basic"]
- `-n, --name <name>` - Project name
- `-d, --dir <path>` - Target directory
- `--skip-install` - Skip dependency installation
- `--skip-git` - Skip git initialization

**Templates:**
- **basic** - Minimal setup with basic examples
- **express-api** - Express.js server with REST API
- **enterprise** - Full-featured enterprise application structure

---

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
objectql migrate --config ./config/objectql.config.ts

# Custom migrations directory
objectql migrate --dir ./db/migrations
```

**Options:**
- `-c, --config <path>` - Path to objectql.config.ts/js
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
objectql migrate status --config ./config/objectql.config.ts
```

**Options:**
- `-c, --config <path>` - Path to objectql.config.ts/js
- `-d, --dir <path>` - Migrations directory [default: "./migrations"]

---

### Development Tools

#### `serve` (alias: `s`)

Start a lightweight development server with an in-memory database. Perfect for rapid prototyping without setting up a backend project.

```bash
# Start server in current directory (port 3000)
objectql serve

# Specify options
objectql serve --dir ./src/schema --port 8080
```

The server exposes:
- **Web Console (Swagger UI)**: `http://localhost:<port>/swagger` (GET) - Interactive API explorer
- **JSON API Endpoint**: `http://localhost:<port>/` (POST)
- **OpenAPI Spec**: `http://localhost:<port>/openapi.json` (GET)

**Options:**
- `-p, --port <number>` - Port to listen on [default: "3000"]
- `-d, --dir <path>` - Directory containing schema [default: "."]

#### `repl` (alias: `r`)

Start an interactive shell to query your data.

```bash
# Start REPL
objectql repl

# Use custom config
objectql repl --config ./objectql.config.ts
```

**Options:**
- `-c, --config <path>` - Path to objectql.config.ts/js

**Example REPL session:**
```javascript
objectql> await tasks.find()
objectql> await tasks.insert({ name: 'New Task', status: 'open' })
objectql> await tasks.update({ _id: '123' }, { status: 'completed' })
```

#### `studio` (alias: `ui`)

Start the ObjectQL Studio - a web-based admin interface.

```bash
# Start studio
objectql studio

# Custom port and directory
objectql studio --port 8080 --dir ./src

# Don't open browser automatically
objectql studio --no-open
```

**Options:**
- `-p, --port <number>` - Port to listen on [default: "3000"]
- `-d, --dir <path>` - Directory containing schema [default: "."]
- `--no-open` - Do not open browser automatically

---

## Typical Workflows

### Starting a New Project

```bash
# 1. Create project from template
objectql init -t basic -n my-app

# 2. Navigate to project
cd my-app

# 3. Install dependencies (if skipped)
pnpm install

# 4. Start development
objectql studio
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

Most commands expect an `objectql.config.ts` or `objectql.config.js` file in your project root:

```typescript
// objectql.config.ts
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
- `OBJECTQL_PORT` - Default port for serve/studio commands
- `OBJECTQL_DB_URL` - Database connection string

---

## Getting Help

```bash
# Show all commands
objectql --help

# Show help for specific command
objectql init --help
objectql i18n extract --help
objectql migrate --help
```

---

## License

MIT
