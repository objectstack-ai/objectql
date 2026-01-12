# Enterprise-Scale Metadata Organization

This example demonstrates **best practices for organizing metadata** in large-scale ObjectQL projects, suitable for enterprise applications with hundreds of objects and complex business domains.

## 📋 Problem Statement

When building large applications, poor metadata organization leads to:
- **Difficulty finding objects** - scattered files with no clear structure
- **Merge conflicts** - multiple teams editing the same files
- **Unclear ownership** - no way to know which team owns which domain
- **Deployment risks** - can't deploy modules independently
- **Maintenance burden** - hard to understand relationships between objects

## 🎯 Solution: Domain-Driven Structure

This example shows a **modular, domain-based** organization pattern that scales to enterprise needs.

```
src/
├── core/                      # Shared/Foundation Layer
│   ├── objects/              # Base objects used across domains
│   │   ├── user.object.yml
│   │   ├── organization.object.yml
│   │   └── attachment.object.yml
│   ├── i18n/
│   │   ├── en/
│   │   └── zh-CN/
│   └── index.ts
│
├── modules/                   # Business Domain Modules
│   ├── crm/                  # Customer Relationship Module
│   │   ├── objects/
│   │   │   ├── crm_account.object.yml
│   │   │   ├── crm_contact.object.yml
│   │   │   ├── crm_opportunity.object.yml
│   │   │   └── crm_lead.object.yml
│   │   ├── actions/
│   │   │   └── convert-lead.action.ts
│   │   ├── hooks/
│   │   │   └── opportunity.hooks.ts
│   │   ├── i18n/
│   │   │   ├── en/
│   │   │   └── zh-CN/
│   │   ├── README.md
│   │   └── index.ts
│   │
│   ├── hr/                   # Human Resources Module
│   │   ├── objects/
│   │   │   ├── hr_employee.object.yml
│   │   │   ├── hr_department.object.yml
│   │   │   ├── hr_position.object.yml
│   │   │   └── hr_timesheet.object.yml
│   │   ├── actions/
│   │   ├── hooks/
│   │   ├── i18n/
│   │   ├── README.md
│   │   └── index.ts
│   │
│   ├── finance/              # Finance & Accounting Module
│   │   ├── objects/
│   │   │   ├── finance_invoice.object.yml
│   │   │   ├── finance_payment.object.yml
│   │   │   ├── finance_expense.object.yml
│   │   │   └── finance_budget.object.yml
│   │   ├── actions/
│   │   ├── hooks/
│   │   ├── i18n/
│   │   ├── README.md
│   │   └── index.ts
│   │
│   └── project/              # Project Management Module
│       ├── objects/
│       │   ├── project_project.object.yml
│       │   ├── project_task.object.yml
│       │   ├── project_milestone.object.yml
│       │   └── project_timesheet_entry.object.yml
│       ├── actions/
│       ├── hooks/
│       ├── i18n/
│       ├── README.md
│       └── index.ts
│
├── extensions/               # Custom Extensions/Overrides
│   ├── user.extension.object.yml
│   └── README.md
│
├── shared/                   # Shared Utilities
│   ├── constants.ts
│   ├── validators.ts
│   └── utils.ts
│
└── index.ts                  # Application Entry Point
```

## 🏗️ Architecture Principles

### 1. **Separation of Concerns**
Each module is self-contained with its own:
- Object definitions (`.object.yml`)
- Business logic (actions & hooks)
- Translations (i18n)
- Documentation

### 2. **Clear Dependencies**
```
Application Layer (modules/*)
        ↓
  Foundation Layer (core/*)
        ↓
   External Plugins
```

### 3. **Team Ownership**
Each module can be owned by a different team:
- `modules/crm/` → Sales Team
- `modules/hr/` → HR Team
- `modules/finance/` → Finance Team

### 4. **Independent Deployment**
Modules can be:
- Developed in parallel
- Tested independently
- Deployed as feature flags
- Extracted to separate packages

## 📦 Module Structure

Each module follows this pattern:

```
modules/[domain]/
├── objects/              # Domain object definitions
├── actions/              # Custom actions (*.action.ts)
├── hooks/                # Lifecycle hooks (*.hooks.ts)
├── i18n/                 # Module-specific translations
│   ├── en/
│   └── zh-CN/
├── README.md             # Module documentation
└── index.ts              # Module exports
```

## 🔗 Object Naming Conventions

### Prefixing Strategy
For large projects, consider prefixing object names:

```yaml
# ❌ Bad: Name collision risk
name: task

# ✅ Good: Clear module ownership
name: project_task
```

**When to prefix:**
- ✅ When multiple modules might have similar concepts
- ✅ In multi-tenant or plugin architectures
- ❌ When it's clearly a core shared object (e.g., `user`, `organization`)

### File Naming
```
[object_name].object.yml     # Object definition
[object_name].action.ts      # Actions for this object
[object_name].hooks.ts       # Hooks for this object
[object_name].data.yml       # Seed data (optional)
```

## 🌐 Internationalization at Scale

### Three-Layer Strategy

1. **Core Layer** (`core/i18n/`)
   - Shared objects (user, organization)
   - Common UI labels
   
2. **Module Layer** (`modules/[domain]/i18n/`)
   - Domain-specific objects
   - Business terminology

3. **Extension Layer** (`extensions/i18n/`)
   - Customer-specific customizations
   - Regional variants

### Example Structure
```
core/i18n/
  en/
    user.json
    organization.json
  zh-CN/
    user.json
    organization.json

modules/crm/i18n/
  en/
    account.json
    opportunity.json
  zh-CN/
    account.json
    opportunity.json
```

## 🔐 Index & Performance Strategy

### Field-Level Indexes (Simple)
For single-column lookups:
```yaml
fields:
  email:
    type: text
    unique: true    # Creates unique index
  status:
    type: select
    index: true     # Creates regular index
```

### Composite Indexes (Advanced)
Define at object root for multi-column queries:
```yaml
indexes:
  # For query: WHERE status = 'open' ORDER BY created_at DESC
  status_created_idx:
    fields: [status, created_at]
  
  # For unique constraint: UNIQUE(company_id, email)
  company_email_unique:
    fields: [company_id, email]
    unique: true
```

### Index Strategy by Module

**High-Traffic Modules** (CRM, Finance):
- Add indexes on every filter field
- Use composite indexes for common query patterns
- Monitor query performance regularly

**Low-Traffic Modules** (HR, Admin):
- Basic indexes on primary lookup fields
- Add more as needed based on usage

## 🧩 Extension Pattern

Use extensions to customize objects without modifying core definitions:

**Core Definition** (`core/objects/user.object.yml`):
```yaml
name: user
fields:
  name: { type: text }
  email: { type: text }
```

**Extension** (`extensions/user.extension.object.yml`):
```yaml
name: user  # Same name triggers merge
fields:
  # Add custom field
  employee_id:
    type: text
    label: Employee ID
  
  # Override existing field
  email:
    required: true
    unique: true
```

## 🧪 Testing Strategy

### Unit Tests
Test individual object schemas:
```typescript
// modules/crm/objects/__tests__/account.test.ts
describe('Account Object', () => {
  it('should have required fields', () => {
    const account = loadObject('account');
    expect(account.fields.name.required).toBe(true);
  });
});
```

### Integration Tests
Test module interactions:
```typescript
// modules/crm/__tests__/integration.test.ts
describe('CRM Module', () => {
  it('should convert lead to opportunity', async () => {
    // Test cross-object logic
  });
});
```

## 📊 Real-World Size Reference

| Project Size | Objects | Modules | Teams | Structure |
|--------------|---------|---------|-------|-----------|
| **Small** (Startup) | 10-30 | 1-2 | 1 | Flat `/objects/` |
| **Medium** (Scale-up) | 30-100 | 3-5 | 2-3 | `/modules/` by domain |
| **Large** (Enterprise) | 100-500 | 8-15 | 5-10 | `/modules/` + `/plugins/` |
| **Very Large** (Platform) | 500+ | 15+ | 10+ | Monorepo with packages |

## 🚀 Migration Path

### From Flat to Modular

1. **Analyze** - Group objects by business domain
2. **Create** - Create module directories
3. **Move** - Relocate objects to appropriate modules
4. **Test** - Verify imports and references still work
5. **Document** - Update README files

### Gradual Approach
You don't have to reorganize everything at once:
```
src/
├── objects/          # Legacy flat structure (deprecated)
├── modules/          # New modular structure
│   └── crm/          # Start with one module
└── index.ts          # Loads from both
```

## 💡 Pro Tips

1. **Start Simple** - Don't over-engineer for 10 objects. Use modules when you hit 30-50 objects.

2. **Document Boundaries** - Each module README should explain:
   - What business domain it covers
   - Key objects and relationships
   - Team ownership
   - Dependencies on other modules

3. **Avoid Circular Dependencies** - Use shared objects in `core/` to break cycles.

4. **Version Control** - Use `.gitignore` to exclude generated files:
   ```
   dist/
   *.generated.ts
   node_modules/
   ```

5. **Code Generation** - Run `objectql generate` to create TypeScript types for each module separately.

## 📚 See Also

- [Data Modeling Guide](../../../docs/guide/data-modeling.md)
- [Plugin Development](../../../docs/guide/plugins.md)
- [ObjectQL Architecture](../../../docs/guide/architecture.md)

## 🤝 Contributing

This is a living example. If you have suggestions for enterprise-scale patterns, please open an issue or PR!
