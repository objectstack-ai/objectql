# Organizing Metadata for Large Projects

When building enterprise-scale applications with ObjectQL, proper metadata organization becomes critical. This guide demonstrates best practices for structuring your object definitions, actions, hooks, and translations in a maintainable way.

## The Challenge

As your application grows beyond 30-50 objects, a flat file structure becomes problematic:

**Problems with Flat Structure:**
```
src/objects/
├── user.object.yml
├── organization.object.yml
├── account.object.yml
├── contact.object.yml
├── opportunity.object.yml
├── employee.object.yml
├── department.object.yml
├── invoice.object.yml
├── payment.object.yml
├── project.object.yml
├── task.object.yml
... (100+ files)
```

- ❌ Hard to find related objects
- ❌ Merge conflicts when multiple teams work simultaneously
- ❌ Unclear ownership boundaries
- ❌ Can't deploy modules independently
- ❌ Difficult to understand relationships

## Recommended Structure: Domain-Driven Modules

For applications with **30+ objects** and **multiple teams**, organize by business domain:

```
src/
├── core/                    # Foundation objects (user, org, etc.)
│   ├── objects/
│   ├── i18n/
│   └── index.ts
│
├── modules/                 # Business domain modules
│   ├── crm/                # Customer management
│   │   ├── objects/
│   │   ├── actions/
│   │   ├── hooks/
│   │   ├── i18n/
│   │   ├── README.md
│   │   └── index.ts
│   │
│   ├── hr/                 # Human resources
│   ├── finance/            # Finance & accounting
│   └── project/            # Project management
│
├── extensions/             # Custom overrides
├── shared/                 # Shared utilities
└── index.ts               # Application entry
```

## Real-World Example

See the complete working example at:
```
packages/starters/enterprise/
```

This demonstrates:
- ✅ 20+ objects organized across 5 modules
- ✅ Domain-driven structure (CRM, HR, Finance, Project)
- ✅ Cross-module relationships
- ✅ Extension pattern for customization
- ✅ Comprehensive indexing strategy
- ✅ Multi-language support (en, zh-CN)
- ✅ Module documentation

## Module Anatomy

Each module follows a consistent pattern:

```
modules/[domain]/
├── objects/              # Object definitions
│   ├── [object1].object.yml
│   └── [object2].object.yml
├── actions/              # Custom actions
│   └── [object1].action.ts
├── hooks/                # Lifecycle hooks
│   └── [object1].hooks.ts
├── i18n/                 # Translations
│   ├── en/
│   └── zh-CN/
├── README.md             # Module documentation
└── index.ts              # Module exports
```

### Module Documentation Template

Each module should have a README explaining:

1. **Overview** - What business domain it covers
2. **Objects** - List of objects with descriptions
3. **Relationships** - How objects relate to each other
4. **Team Ownership** - Who maintains this module
5. **Dependencies** - What other modules/objects it depends on
6. **Usage Examples** - Common query patterns

## Object Naming Conventions

### File-Based Naming

**ObjectQL uses filename-based identification.** The object name is automatically inferred from the filename (without the `.object.yml` extension), eliminating redundancy.

**Examples:**
- `crm_account.object.yml` → Object name: `crm_account`
- `finance_invoice.object.yml` → Object name: `finance_invoice`
- `project_task.object.yml` → Object name: `project_task`

Inside the file, you **no longer need** to specify `name: crm_account` - it's inferred from the filename!

```yaml
# File: crm_account.object.yml
# Object name "crm_account" is automatically inferred!

label: CRM Account
fields:
  company_name:
    type: text
    required: true
```

### Prefixing Strategy

For large projects with multiple modules, use prefixes in your **filenames** to avoid name collisions:

```
# ✅ Good: Clear module ownership via filenames
crm/objects/crm_account.object.yml       → Object: crm_account
finance/objects/finance_invoice.object.yml → Object: finance_invoice
project/objects/project_task.object.yml   → Object: project_task

# ❌ Avoid: Risk of collision
crm/objects/account.object.yml           → Object: account (ambiguous)
finance/objects/account.object.yml       → Object: account (collision!)
```

**When to prefix:**
- ✅ Multi-module applications (30+ objects)
- ✅ Plugin architectures
- ✅ When similar concepts exist across domains

**When NOT to prefix:**
- ❌ Core shared objects (`user.object.yml`, `organization.object.yml`)
- ❌ Small applications (< 30 objects)
- ❌ When it reduces clarity

## Dependency Management

### Dependency Layers

```
┌─────────────────────────────────┐
│   Application Layer             │
│   (modules/*)                   │
│   - Can depend on Core          │
│   - Can depend on other modules │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│   Foundation Layer              │
│   (core/*)                      │
│   - No dependencies             │
│   - Used by everyone            │
└─────────────────────────────────┘
```

### Cross-Module References

When modules need to reference each other's objects:

```yaml
# In modules/finance/objects/invoice.object.yml
fields:
  account:
    type: lookup
    reference_to: crm_account  # Reference to CRM module
```

**Best Practices:**
1. Document cross-module dependencies in module README
2. Avoid circular dependencies
3. Use core objects to break dependency cycles
4. Consider extracting shared concepts to core layer

## Index Strategy by Module

Different modules have different performance requirements:

### High-Traffic Modules (CRM, Sales)
```yaml
# Aggressive indexing
fields:
  status: { type: select, index: true }
  owner: { type: lookup, index: true }
  created_at: { type: datetime, index: true }

indexes:
  owner_status_idx: { fields: [owner, status] }
  status_created_idx: { fields: [status, created_at] }
```

### Low-Traffic Modules (Admin, Config)
```yaml
# Minimal indexing
fields:
  name: { type: text, index: true }
  status: { type: select, index: true }
# Add more indexes only when needed
```

## Extension Pattern

Use extensions to customize objects without modifying source files.

**Original** (`core/objects/user.object.yml`):
```yaml
# File: user.object.yml
# Object name "user" is inferred from filename

fields:
  name: { type: text }
  email: { type: text }
```

**Extension** (`extensions/user.extension.object.yml`):
```yaml
# File: user.extension.object.yml
# Extends the "user" object (matches by filename base)

fields:
  employee_id: { type: text }
  email: { required: true, unique: true }
```

**Result:** ObjectQL merges both definitions, adding `employee_id` and making `email` required.

## Internationalization at Scale

### Three-Layer i18n Strategy

```
1. Core Layer (core/i18n/)
   → Shared objects (user, organization)
   
2. Module Layer (modules/[domain]/i18n/)
   → Domain-specific objects
   
3. Extension Layer (extensions/i18n/)
   → Customer/regional customizations
```

### Directory Structure
```
core/i18n/
  en/core.json
  zh-CN/core.json

modules/crm/i18n/
  en/crm.json
  zh-CN/crm.json
```

## Migration Path

### From Flat to Modular

**Step 1: Analyze**
Group existing objects by business domain.

**Step 2: Plan**
Create module structure, decide on prefixes.

**Step 3: Migrate Gradually**
```
src/
├── objects/          # Legacy (keep temporarily)
├── modules/          # New structure
│   └── crm/          # Start with one module
└── index.ts          # Loads from both
```

**Step 4: Update References**
Update imports and references to use new module structure.

**Step 5: Clean Up**
Remove legacy flat structure once migration is complete.

## Project Size Guidelines

| Size | Objects | Teams | Recommended Structure |
|------|---------|-------|----------------------|
| **Small** | 1-30 | 1 | Flat `objects/` directory |
| **Medium** | 30-100 | 2-3 | Domain modules |
| **Large** | 100-500 | 5-10 | Modules + plugins |
| **Enterprise** | 500+ | 10+ | Monorepo with packages |

## Testing Strategy

### Module Tests
```typescript
// modules/crm/__tests__/integration.test.ts
describe('CRM Module', () => {
  it('should handle lead conversion', async () => {
    const lead = await createLead();
    await convertLead(lead.id);
    // Verify account, contact, opportunity created
  });
});
```

### Object Schema Tests
```typescript
// modules/crm/objects/__tests__/account.test.ts
describe('Account Object', () => {
  it('should have required fields', () => {
    const schema = loadObjectSchema('crm_account');
    expect(schema.fields.name.required).toBe(true);
  });
});
```

## Complete Working Example

Explore the full example with 20+ objects:
```bash
cd packages/starters/enterprise
pnpm install
pnpm build
```

The example includes:
- Core module (user, organization, attachment)
- CRM module (account, contact, opportunity, lead)
- HR module (employee, department, position, timesheet)
- Finance module (invoice, payment, expense, budget)
- Project module (project, task, milestone, timesheet entry)
- Extensions pattern
- Multi-language support
- Comprehensive documentation

## Key Takeaways

1. **Start simple** - Don't over-engineer for small projects
2. **Think in domains** - Organize by business capability, not technical layers
3. **Document boundaries** - Make module ownership and dependencies explicit
4. **Plan for scale** - Use prefixes and modules when you hit 30-50 objects
5. **Test modules** - Each module should be testable independently
6. **Version control** - Use module-level versioning for independent deployments

## See Also

- [Data Modeling Guide](./data-modeling.md)
- [Plugin Development](./plugins.md)
- [Logic Hooks](./logic-hooks.md)
- See examples in the repository under `examples/` directory
