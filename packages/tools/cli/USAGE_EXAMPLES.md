# ObjectQL CLI - Usage Examples

This guide provides practical examples for all ObjectQL CLI commands.

## Table of Contents

- [Project Initialization](#project-initialization)
- [Metadata Generation](#metadata-generation)
- [TypeScript Code Generation](#typescript-code-generation)
- [Internationalization (i18n)](#internationalization-i18n)
- [Database Migrations](#database-migrations)
- [Development Tools](#development-tools)

---

## Project Initialization

### Creating a New Project

#### Basic Project

```bash
# Create a minimal project with basic examples
objectql init --template basic --name my-project

# Navigate and start working
cd my-project
pnpm install
pnpm run build
objectql repl
```

#### Express API Project

```bash
# Create a project with Express server setup
objectql init -t express-api -n my-api

cd my-api
pnpm install
pnpm start
```

#### Enterprise Project

```bash
# Create a full-featured enterprise structure
objectql init -t enterprise -n my-enterprise-app

cd my-enterprise-app
pnpm install
objectql studio
```

#### Advanced Options

```bash
# Skip dependency installation (install manually later)
objectql init -n my-project --skip-install

# Skip git initialization
objectql init -n my-project --skip-git

# Custom directory
objectql init -n my-project --dir /path/to/projects

# Combine options
objectql init -t express-api -n my-api --skip-install --skip-git
```

---

## Metadata Generation

### Creating Objects

```bash
# Create a simple object
objectql new object users

# Create in specific directory
objectql new object products --dir ./src/catalog

# Create with module structure
objectql new object crm_contacts --dir ./src/modules/crm
```

Generated `users.object.yml`:
```yaml
label: Users
fields:
  name:
    type: text
    label: Name
    required: true
```

### Creating Views

```bash
objectql new view user_list

# Creates user_list.view.yml with default columns
```

### Creating Forms

```bash
objectql new form user_edit

# Creates user_edit.form.yml with basic layout
```

### Creating Actions

```bash
objectql new action approve_request

# Creates TWO files:
# 1. approve_request.action.yml - metadata
# 2. approve_request.action.ts - implementation
```

Edit the generated `approve_request.action.ts`:
```typescript
import { ActionContext } from '@objectql/types';

export async function action_approve_request(context: ActionContext) {
    const { record, user } = context;
    
    // Your business logic here
    await context.object('requests').update(record._id, {
        status: 'approved',
        approved_by: user._id,
        approved_at: new Date()
    });
    
    return {
        success: true,
        message: 'Request approved successfully'
    };
}
```

### Creating Hooks

```bash
objectql new hook users

# Creates TWO files:
# 1. users.hook.yml - metadata
# 2. users.hook.ts - implementation
```

### Creating Permissions

```bash
objectql new permission users

# Creates users.permission.yml with admin/user profiles
```

### Creating Validation Rules

```bash
objectql new validation users

# Creates users.validation.yml with sample rules
```

### Creating Workflows

```bash
objectql new workflow order_processing

# Creates order_processing.workflow.yml
```

### Creating Reports

```bash
objectql new report sales_summary

# Creates sales_summary.report.yml
```

### All Supported Types

```bash
objectql new object <name>        # Object/Entity definition
objectql new view <name>          # Data view
objectql new form <name>          # Form layout
objectql new page <name>          # Page definition
objectql new action <name>        # Custom action
objectql new hook <name>          # Lifecycle hook
objectql new permission <name>    # Permission rules
objectql new validation <name>    # Validation rules
objectql new workflow <name>      # Workflow automation
objectql new report <name>        # Report definition
objectql new menu <name>          # Menu configuration
objectql new data <name>          # Sample data
```

---

## TypeScript Code Generation

### Basic Usage

```bash
# Generate types from current directory
objectql generate

# Generates TypeScript interfaces in ./src/generated/
```

### Custom Paths

```bash
# Custom source and output
objectql generate -s ./metadata -o ./types

# From specific module
objectql generate -s ./src/modules/crm -o ./src/modules/crm/types
```

### Integration with Build Process

In `package.json`:
```json
{
  "scripts": {
    "codegen": "objectql generate -s src -o src/types",
    "prebuild": "npm run codegen",
    "build": "tsc"
  }
}
```

### Using Generated Types

```typescript
import { User, Project, Task } from './generated';

const user: User = {
    _id: '123',
    name: 'John Doe',
    email: 'john@example.com'
};

const project: Project = {
    _id: '456',
    name: 'My Project',
    owner: user._id,
    status: 'active'
};
```

---

## Internationalization (i18n)

### Setting Up i18n

#### 1. Extract Translatable Strings

```bash
# Extract for English (default)
objectql i18n extract

# Extract for specific language
objectql i18n extract --lang zh-CN

# Custom paths
objectql i18n extract -s ./src -o ./translations --lang en
```

This creates JSON files like `src/i18n/en/users.json`:
```json
{
    "label": "Users",
    "fields": {
        "name": { "label": "Name" },
        "email": { "label": "Email" },
        "status": {
            "label": "Status",
            "options": {
                "active": "Active",
                "inactive": "Inactive"
            }
        }
    },
    "actions": {
        "approve": {
            "label": "Approve User",
            "confirm_text": "Are you sure you want to approve this user?"
        }
    }
}
```

#### 2. Initialize New Language

```bash
# Initialize Chinese (Simplified)
objectql i18n init zh-CN

# Initialize French
objectql i18n init fr

# Initialize Spanish
objectql i18n init es
```

#### 3. Extract for New Language

```bash
# Extract all translatable strings for Chinese
objectql i18n extract --lang zh-CN
```

#### 4. Translate the JSON Files

Edit `src/i18n/zh-CN/users.json`:
```json
{
    "label": "用户",
    "fields": {
        "name": { "label": "姓名" },
        "email": { "label": "邮箱" },
        "status": {
            "label": "状态",
            "options": {
                "active": "活跃",
                "inactive": "未激活"
            }
        }
    },
    "actions": {
        "approve": {
            "label": "批准用户",
            "confirm_text": "确定要批准此用户吗？"
        }
    }
}
```

#### 5. Validate Completeness

```bash
# Check if all English strings are translated to Chinese
objectql i18n validate zh-CN

# Use custom base language
objectql i18n validate fr --base-lang en

# Custom directory
objectql i18n validate es --base-dir ./translations
```

Output:
```
🌐 Validating translations for zh-CN against en...

✓ users.json - Complete
⚠ projects.json - 3 missing keys:
    - fields.budget.label
    - fields.deadline.description
    - actions.export.label

📊 Summary:
Total files: 5
Missing translations: 3
```

### Complete i18n Workflow

```bash
# 1. Start with English (extract from metadata)
objectql i18n extract --lang en

# 2. Add Chinese support
objectql i18n init zh-CN
objectql i18n extract --lang zh-CN

# 3. Add French support
objectql i18n init fr
objectql i18n extract --lang fr

# 4. Translate the JSON files manually
# ... edit files in src/i18n/zh-CN/ and src/i18n/fr/

# 5. Validate translations
objectql i18n validate zh-CN
objectql i18n validate fr

# 6. When you add new fields, re-extract
objectql i18n extract --lang zh-CN
objectql i18n extract --lang fr

# 7. Re-validate
objectql i18n validate zh-CN
objectql i18n validate fr
```

---

## Database Migrations

### Creating Migrations

```bash
# Create a new migration
objectql migrate create add_status_field

# Creates: migrations/20260112120000_add_status_field.ts
```

### Editing Migration

Edit `migrations/20260112120000_add_status_field.ts`:
```typescript
import { ObjectQL } from '@objectql/core';

export async function up(app: ObjectQL) {
    console.log('Adding status field to users');
    
    const users = app.getObject('users');
    await users.updateSchema({
        fields: {
            status: { 
                type: 'select', 
                label: 'Status',
                options: [
                    { label: 'Active', value: 'active' },
                    { label: 'Inactive', value: 'inactive' }
                ]
            }
        }
    });
}

export async function down(app: ObjectQL) {
    console.log('Removing status field from users');
    
    const users = app.getObject('users');
    await users.updateSchema({
        fields: {
            status: undefined
        }
    });
}
```

### Running Migrations

```bash
# Check migration status
objectql migrate status

# Run all pending migrations
objectql migrate

# With custom config
objectql migrate --config ./config/objectql.config.ts

# Custom migrations directory
objectql migrate --dir ./db/migrations
```

### Migration Examples

#### Adding a Field

```typescript
export async function up(app: ObjectQL) {
    const tasks = app.getObject('tasks');
    await tasks.updateSchema({
        fields: {
            priority: {
                type: 'select',
                label: 'Priority',
                options: ['low', 'medium', 'high']
            }
        }
    });
}
```

#### Adding an Index

```typescript
export async function up(app: ObjectQL) {
    const users = app.getObject('users');
    await users.addIndex('email', { unique: true });
}
```

#### Data Migration

```typescript
export async function up(app: ObjectQL) {
    const tasks = app.getObject('tasks');
    
    // Update all tasks without priority
    const result = await tasks.find({
        filters: [['priority', '=', null]]
    });
    
    for (const task of result.records) {
        await tasks.update(task._id, {
            priority: 'medium'
        });
    }
    
    console.log(`Updated ${result.records.length} tasks`);
}
```

---

## Development Tools

### REPL (Interactive Shell)

```bash
# Start REPL
objectql repl

# With custom config
objectql repl --config ./objectql.config.ts
```

In the REPL:
```javascript
objectql> await tasks.find()
objectql> await tasks.insert({ name: 'New Task', status: 'open' })
objectql> await tasks.update('123', { status: 'completed' })
objectql> await tasks.delete('123')

// Access specific object
objectql> const users = app.getObject('users')
objectql> await users.count()

// Run queries
objectql> await tasks.find({
...   filters: [['status', '=', 'open']],
...   sort: [['created_at', 'desc']]
... })
```

### Serve (Development Server)

```bash
# Start server on default port (3000)
objectql serve

# Custom port
objectql serve --port 8080

# Custom schema directory
objectql serve --dir ./src/metadata

# Full example
objectql serve --port 4000 --dir ./src
```

Access:
- Swagger UI: `http://localhost:3000/swagger`
- API: `http://localhost:3000/` (POST)
- OpenAPI: `http://localhost:3000/openapi.json` (GET)

### Studio (Web Admin)

```bash
# Start studio
objectql studio

# Custom port
objectql studio --port 8080

# Don't open browser
objectql studio --no-open

# Full example
objectql studio --port 4000 --dir ./src --no-open
```

Access the UI at: `http://localhost:3000/studio`

---

## Complete Workflow Examples

### Starting a New Project

```bash
# 1. Initialize project
objectql init -t basic -n my-crm

# 2. Navigate to project
cd my-crm
pnpm install

# 3. Create your first object
objectql new object contacts

# 4. Edit contacts.object.yml
# ... add fields

# 5. Generate TypeScript types
objectql generate

# 6. Start development
objectql studio

# 7. Build for production
pnpm run build
```

### Adding a New Feature Module

```bash
# 1. Create object
objectql new object crm_leads --dir ./src/modules/crm

# 2. Create view
objectql new view crm_lead_list --dir ./src/modules/crm

# 3. Create form
objectql new form crm_lead_edit --dir ./src/modules/crm

# 4. Create action
objectql new action crm_convert_lead --dir ./src/modules/crm

# 5. Add permissions
objectql new permission crm_leads --dir ./src/modules/crm

# 6. Generate types
objectql generate

# 7. Test in REPL
objectql repl
```

### Internationalization Workflow

```bash
# 1. Extract English strings
objectql i18n extract --lang en

# 2. Add Chinese support
objectql i18n init zh-CN
objectql i18n extract --lang zh-CN

# 3. Translate files in src/i18n/zh-CN/

# 4. Validate
objectql i18n validate zh-CN

# 5. When metadata changes, re-extract
objectql i18n extract --lang en
objectql i18n extract --lang zh-CN

# 6. Re-validate
objectql i18n validate zh-CN
```

### Database Migration Workflow

```bash
# 1. Create migration
objectql migrate create add_user_roles

# 2. Edit migration file in migrations/

# 3. Check status
objectql migrate status

# 4. Run migration
objectql migrate

# 5. Verify in REPL
objectql repl
> await users.findOne()
```

---

## Tips and Best Practices

### Project Structure

```
my-project/
├── src/
│   ├── modules/
│   │   ├── crm/
│   │   │   ├── contacts.object.yml
│   │   │   ├── contacts.view.yml
│   │   │   ├── contacts.form.yml
│   │   │   └── contacts.permission.yml
│   │   └── sales/
│   │       ├── orders.object.yml
│   │       └── ...
│   ├── i18n/
│   │   ├── en/
│   │   ├── zh-CN/
│   │   └── fr/
│   └── types/          # Generated
├── migrations/
├── objectql.config.ts
└── package.json
```

### Naming Conventions

- Objects: `snake_case` (e.g., `crm_contacts`, `sales_orders`)
- Actions/Hooks: `snake_case` (e.g., `approve_order`, `send_email`)
- Fields: `snake_case` (e.g., `first_name`, `email_address`)

### Git Integration

Add to `.gitignore`:
```
node_modules/
dist/
*.log
.DS_Store
*.sqlite3
.env
.env.local

# Keep migrations
!migrations/
```

### Automation Scripts

In `package.json`:
```json
{
  "scripts": {
    "codegen": "objectql generate -s src -o src/types",
    "i18n:extract": "objectql i18n extract --lang en && objectql i18n extract --lang zh-CN",
    "i18n:validate": "objectql i18n validate zh-CN",
    "migrate": "objectql migrate",
    "dev": "objectql studio",
    "prebuild": "npm run codegen",
    "build": "tsc"
  }
}
```

---

## Troubleshooting

### Common Issues

**Issue**: `Cannot find module '@objectql/core'`
```bash
# Solution: Install dependencies first
pnpm install
```

**Issue**: Migration fails
```bash
# Solution: Check migration status
objectql migrate status

# Review config file
cat objectql.config.ts
```

**Issue**: Types not updating
```bash
# Solution: Re-generate types
objectql generate -s src -o src/types
```

**Issue**: i18n validation shows missing keys
```bash
# Solution: Re-extract and translate
objectql i18n extract --lang zh-CN
# Then edit the JSON files
```

---

## Getting Help

```bash
# General help
objectql --help

# Command-specific help
objectql init --help
objectql new --help
objectql i18n --help
objectql migrate --help
```

For more information, visit: https://github.com/objectql/objectql
