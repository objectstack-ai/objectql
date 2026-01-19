# ObjectQL Metadata Standard - Complete Guide

## Introduction

ObjectQL is a **universal metadata standard** for defining enterprise applications. Instead of writing code, you define your application structure, business logic, and user interface through **structured metadata** in YAML/JSON format.

**ObjectOS** interprets this metadata at runtime to generate fully functional enterprise applications - similar to how Salesforce runs on metadata, but open-source and database-agnostic.

## What is Metadata?

In ObjectQL, **metadata** is machine-readable configuration that describes:

1. **What data to store** (Objects, Fields, Relationships)
2. **How to validate it** (Validation Rules, Constraints)
3. **Who can access it** (Permissions, Security)
4. **What business logic to execute** (Hooks, Actions, Workflows)

## Complete Metadata Taxonomy

### 1. Core Data Layer

#### [Objects & Fields](./object.md)
**Purpose**: Define your data model - the foundation of your application.

**What you define**:
- Business entities (Customer, Order, Product, etc.)
- Field types (text, number, date, lookup, formula, etc.)
- Relationships (one-to-many, many-to-many)
- Indexes for performance
- AI/Vector search configuration

**Example** (`project.object.yml`):
```yaml
# File: project.object.yml
# No need for 'name: project' - it's inferred from filename!

label: Project
fields:
  name:
    type: text
    required: true
  status:
    type: select
    options: [planned, active, completed]
  owner:
    type: lookup
    reference_to: users
```

#### [Query Language](./query-language.md)
**Purpose**: Universal JSON-based query protocol for database operations.

**What you define**:
- Filter conditions (WHERE clauses)
- Sorting and pagination
- Field selection (projections)
- Joins (expand related data)
- Aggregations (GROUP BY, SUM, COUNT)

**Example**:
```json
{
  "object": "orders",
  "fields": ["name", "amount"],
  "filters": [
    ["status", "=", "paid"],
    "and",
    ["amount", ">", 1000]
  ],
  "expand": {
    "customer": {
      "fields": ["name", "email"]
    }
  }
}
```

#### [Validation Rules](./validation.md)
**Purpose**: Enforce data quality and business rules.

**What you define**:
- Field-level validation (email format, number ranges)
- Cross-field validation (end date > start date)
- Custom validation logic (check credit limits)
- Uniqueness constraints
- State machine transitions
- Async validations (external API checks)

**Example** (`project.validation.yml`):
```yaml
# File: project.validation.yml
# Object is inferred from filename!

description: "Validation rules for Projects"

rules:
  - name: valid_date_range
    type: cross_field
    message: End date must be after start date
    condition:
      field: end_date
      operator: ">"
      compare_to: start_date
```

#### Initial Data
**Purpose**: Define seed data or default records to be loaded on startup.

**What you define**:
- Target object
- List of records to insert (auto-created if validation passes)

**Example** (`users.data.yml`):
```yaml
# File: users.data.yml
# Object is inferred from filename!

records:
  - name: Administrator
    email: admin@company.com
    role: admin
  - name: Guest
    email: guest@company.com
    role: read_only
```

### 2. Business Logic Layer

#### [Hooks (Triggers)](./hook.md)
**Purpose**: Execute logic before/after data operations.

**What you define**:
- beforeCreate / afterCreate
- beforeUpdate / afterUpdate
- beforeDelete / afterDelete
- beforeFind / afterFind

**Example**:
```typescript
beforeCreate: async ({ data, user }) => {
  // Auto-assign owner
  data.owner_id = user.id;
  
  // Set default status
  if (!data.status) {
    data.status = 'draft';
  }
}
```

#### [Actions (RPC)](./action.md)
**Purpose**: Define custom server-side operations.

**What you define**:
- Record-level actions (Approve, Reject, Clone)
- Global actions (Import Data, Generate Report)
- Input parameters with validation
- Business logic implementation

**Example**:
```yaml
actions:
  approve_order:
    type: record
    label: Approve Order
    params:
      comment:
        type: textarea
        required: true
```

#### [Workflows & Processes](./workflow.md)
**Purpose**: Automate business processes and approvals.

**What you define**:
- Approval workflows (multi-step approvals)
- Automation workflows (triggered actions)
- Scheduled workflows (recurring tasks)
- Process steps and transitions
- Escalation rules
- Notifications

**Example**:
```yaml
name: order_approval_workflow
type: approval
trigger:
  event: create_or_update
  conditions:
    - field: amount
      operator: ">"
      value: 1000
steps:
  - name: manager_approval
    type: approval
    assignee:
      type: field
      field: manager_id
```

### 3. User Interface Layer

#### [Pages](./page.md)
**Purpose**: Define UI layouts and page structures.

**What you define**:
- List pages (table/grid views)
- Detail pages (record details)
- Dashboard pages (metrics and charts)
- Custom pages (specialized UI)
- Page sections and components
- Responsive layouts

**Example** (`project_list.page.yml`):
```yaml
# File: project_list.page.yml
# Page name is inferred from filename!

label: Projects
type: list
object: project

view:
  columns:
    - name
    - status
    - owner
    - end_date
  
  sort:
    - field: end_date
      direction: asc

actions:
  - create_project
  - export_to_excel
```

#### [Views](./view.md)
**Purpose**: Saved queries and display configurations.

**What you define**:
- Filters and sorting
- Column selections
- Grouping and aggregations
- Chart visualizations
- Kanban boards
- Calendar views

**Example** (`active_projects.view.yml`):
```yaml
# File: active_projects.view.yml
# View name is inferred from filename!

label: Active Projects
object: project
type: list

filters:
  - field: status
    operator: "="
    value: active

columns:
  - name
  - owner
  - end_date
  - progress

sort:
  - field: end_date
    direction: asc
```

#### [Forms](./form.md)
**Purpose**: Data entry layouts and configurations.

**What you define**:
- Field layouts (sections, columns)
- Field configurations (required, defaults)
- Validation rules
- Conditional fields
- Form actions
- Wizard forms (multi-step)

**Example** (`project_create.form.yml`):
```yaml
# File: project_create.form.yml
# Form name is inferred from filename!

label: Create Project
object: project
type: create

sections:
  - label: Project Information
    fields:
      - name:
          required: true
      - status:
          default: planning
      - owner:
          default: $current_user.id

defaults:
  priority: medium
  status: planning
```

#### [Reports](./report.md)
**Purpose**: Analytics and data exports.

**What you define**:
- Report types (tabular, summary, matrix, chart)
- Data sources and joins
- Grouping and aggregations
- Visualizations
- Export formats (PDF, Excel, CSV)
- Scheduled distribution

**Example** (`sales_summary.report.yml`):
```yaml
# File: sales_summary.report.yml
# Report name is inferred from filename!

label: Sales Summary
type: summary
object: order

grouping:
  - field: sales_rep
    label: Sales Rep

aggregations:
  total_revenue:
    field: amount
    function: sum
    format: currency
  
  order_count:
    function: count
```

#### [Menus](./menu.md)
**Purpose**: Navigation structure and organization.

**What you define**:
- Menu items and hierarchy
- Navigation paths
- Icons and labels
- Permissions per item
- Dynamic menu generation
- Contextual actions

**Example** (`main_menu.menu.yml`):
```yaml
# File: main_menu.menu.yml
# Menu name is inferred from filename!

label: Main Navigation
type: main
position: left

items:
  - label: Dashboard
    icon: standard:home
    path: /dashboard
  
  - label: CRM
    icon: standard:account
    items:
      - label: Accounts
        path: /accounts
      - label: Contacts
        path: /contacts
```

### 4. Security & Access Control

#### [Permissions](./permission.md)
**Purpose**: Control who can access what data and operations.

**What you define**:
- Object-level permissions (CRUD operations)
- Field-level security (hide sensitive fields)
- Record-level rules (ownership, sharing)
- Role-based access control (RBAC)
- Sharing rules
- Permission sets and profiles

**Example** (`employee.permission.yml`):
```yaml
# File: employee.permission.yml
# Object is inferred from filename!

object_permissions:
  create: [admin, manager]
  read: [admin, manager, user]
  update: [admin, manager]
  delete: [admin]

field_permissions:
  salary:
    read: [admin, hr_manager]
    update: [admin]

record_rules:
  - name: owner_access
    condition:
      field: owner_id
      operator: "="
      value: $current_user.id
    permissions:
      read: true
      update: true
```

## Metadata Architecture Principles

### 1. Declarative Over Imperative
Define **WHAT** you want, not **HOW** to implement it. ObjectOS handles the implementation.

### 2. Separation of Concerns
- **Data model** is separate from **presentation**
- **Business logic** is separate from **UI**
- **Security** is separate from **functionality**

### 3. Composition
Combine simple metadata pieces to build complex applications.

### 4. Type Safety
Generate TypeScript types from metadata for full IDE support:
```bash
npx objectql generate --source ./src --output ./src/generated
```

### 5. Version Control
All metadata lives in YAML/JSON files, tracked in Git like code.

### 6. AI-Optimized
Structured metadata is perfect for LLM consumption and generation - no hallucination of SQL or complex APIs.

## File Organization Best Practices

```
src/
  objects/                   # Data layer
    customers.object.yml     # Object definition
    customers.validation.yml # Validation rules
    customers.permission.yml # Security rules
    customers.hook.ts        # Hook implementation
    customers.action.ts      # Action implementation
  
  workflows/                 # Business processes
    order_approval.workflow.yml
    customer_onboarding.workflow.yml
  
  ui/                        # User interface
    pages/
      customer_list.page.yml
      customer_detail.page.yml
    views/
      my_customers.view.yml
      vip_customers.view.yml
    forms/
      customer_create.form.yml
      customer_edit.form.yml
    menus/
      main_menu.menu.yml
      admin_menu.menu.yml
  
  reports/                   # Analytics
    sales_summary.report.yml
    customer_ltv.report.yml
  
  data/                      # Initial data
    default_users.data.yml
    sample_customers.data.yml
  
  apps/                      # Application definitions
    crm.app.yml
    sales.app.yml
```

## Development Workflow

### 1. Design Phase
1. Define objects and fields
2. Set up relationships
3. Create validation rules
4. Configure permissions

### 2. Logic Phase
1. Implement hooks for business logic
2. Create custom actions
3. Design workflows and approvals

### 3. Testing Phase
1. Test with different user roles
2. Validate business rules
3. Check permission enforcement
4. Performance testing

### 4. Deployment
1. Commit metadata to Git
2. Deploy to ObjectOS runtime
3. Monitor and iterate

## Metadata API & File Structure

ObjectQL provides a universal loader and generic API for all metadata types.

### File Naming Convention

**ObjectQL uses filename-based identification** to eliminate redundancy. The filename (without extension) automatically becomes the resource identifier, making the `name` property **optional** in most cases.

**Convention:** `<identifier>.<type>.yml`

| Type | Extension | Identifier Source | Example |
|---|---|---|---|
| Object | `*.object.yml` | Filename = Object name | `project.object.yml` → object: `project` |
| Application | `*.app.yml` | Filename = App name | `crm.app.yml` → app: `crm` |
| Workflow | `*.workflow.yml` | Filename = Workflow name | `approval.workflow.yml` → workflow: `approval` |
| Permission | `*.permission.yml` | Filename = Object name | `project.permission.yml` → applies to: `project` |
| Validation | `*.validation.yml` | Filename = Object name | `project.validation.yml` → applies to: `project` |
| Initial Data | `*.data.yml` | Filename = Object name | `users.data.yml` → applies to: `users` |
| Page | `*.page.yml` | Filename = Page name | `dashboard.page.yml` → page: `dashboard` |
| View | `*.view.yml` | Filename = View name | `active_projects.view.yml` → view: `active_projects` |
| Form | `*.form.yml` | Filename = Form name | `customer_create.form.yml` → form: `customer_create` |
| Report | `*.report.yml` | Filename = Report name | `sales_summary.report.yml` → report: `sales_summary` |
| Menu | `*.menu.yml` | Filename = Menu name | `main_menu.menu.yml` → menu: `main_menu` |

**Benefits:**
- ✅ **Less redundancy** - No need to repeat the name inside the file
- ✅ **Cleaner files** - Reduced boilerplate by 10-15%
- ✅ **Easier to maintain** - Rename file = rename resource
- ✅ **AI-friendly** - Clear, predictable structure

### Generic Metadata API
All metadata types can be queried via the REST API:

- `GET /api/metadata/:type`
  - List all entries for a specific type (e.g. `/api/metadata/object`)
- `GET /api/metadata/:type/:id`
  - Get the JSON content of a specific entry (e.g. `/api/metadata/object/customer`)
- `POST /api/metadata/:type/:id`
  - Update metadata content (if supported by storage)

## Why Metadata-Driven?

### Traditional Development
```typescript
// Define class
class Customer {
  id: string;
  name: string;
  email: string;
}

// Write controller
app.get('/customers', auth, validate, async (req, res) => {
  const customers = await db.query('SELECT * FROM customers WHERE ...');
  res.json(customers);
});

// Write React component
function CustomerList() {
  // 100+ lines of UI code
}
```

### ObjectQL Metadata Approach
```yaml
# customer.object.yml
# Object name comes from filename!
fields:
  name: { type: text }
  email: { type: email }
```

**Result**: ObjectOS automatically generates API, validation, and security - all from metadata!

## Benefits

1. **Rapid Development**: Build apps 10x faster
2. **Consistency**: Unified patterns across all features
3. **AI-Friendly**: LLMs can read and generate metadata accurately
4. **Type-Safe**: Generate types from metadata
5. **Database-Agnostic**: Same metadata runs on MongoDB, PostgreSQL, MySQL
6. **Version Controlled**: Track changes in Git
7. **Low-Code Ready**: Perfect foundation for visual builders
8. **Maintainable**: Clear separation of concerns

## Next Steps

1. **Start Simple**: Define your first object → [Objects & Fields](./object.md)
2. **Add Logic**: Implement validation and hooks
3. **Build UI**: Create pages, views, and forms
4. **Secure**: Configure permissions
5. **Automate**: Add workflows
6. **Analyze**: Create reports

## Reference

### Core Data Layer
- [Objects & Fields](./object.md) - Data modeling
- [Query Language](./query-language.md) - Data access
- [Validation](./validation.md) - Data quality
- [Formula Fields](./formula.md) - Calculated fields
- [Initial Data](./data.md) - Seed data

### Business Logic Layer
- [Hooks](./hook.md) - Event triggers
- [Actions](./action.md) - Custom operations
- [Workflows](./workflow.md) - Process automation

### User Interface Layer
- [Pages](./page.md) - UI pages and components
- [Views](./view.md) - Data presentation
- [Forms](./form.md) - Data entry
- [Reports](./report.md) - Analytics
- [Menus](./menu.md) - Navigation

### Application & Security
- [Apps](./app.md) - Application organization
- [Permissions](./permission.md) - Security and access control
