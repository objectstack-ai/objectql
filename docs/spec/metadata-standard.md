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
5. **How to present it** (Views, Forms, Reports)
6. **How to navigate it** (Menus, Dashboards)

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

**Example**:
```yaml
name: project
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

**Example**:
```yaml
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

**Example**:
```yaml
# initial.data.yml
object: User
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

### 3. Presentation Layer

#### [Views & Layouts](./view.md)
**Purpose**: Define how data is displayed to users.

**What you define**:
- List views (tabular data)
- Grid views (inline editing)
- Kanban boards (drag & drop)
- Calendar views (events, timeline)
- Card layouts (mobile-friendly)
- Column configurations
- Default filters and sorting

**Example**:
```yaml
name: task_list
type: list
object: tasks
config:
  columns:
    - field: name
      width: 300
      sortable: true
    - field: status
      renderer: badge
  default_filters:
    - field: status
      operator: "!="
      value: completed
```

#### [Forms](./form.md)
**Purpose**: Define data entry and editing interfaces.

**What you define**:
- Form layouts (sections, tabs, columns)
- Field configurations (labels, help text, defaults)
- Conditional logic (show/hide based on values)
- Validation rules
- Wizard forms (multi-step)
- Quick create forms

**Example**:
```yaml
name: project_form
type: edit
object: projects
layout:
  sections:
    - name: basic_info
      label: Basic Information
      columns: 2
      fields:
        - name
        - status
        - owner
conditional_logic:
  - condition:
      field: status
      operator: "="
      value: completed
    actions:
      - show_fields: [completion_date]
```

#### [Reports & Dashboards](./report.md)
**Purpose**: Analytics, visualization, and business intelligence.

**What you define**:
- Tabular reports (data lists)
- Summary reports (grouped with totals)
- Matrix reports (pivot tables)
- Charts (bar, line, pie, etc.)
- Dashboards (KPIs, charts, metrics)
- Scheduled reports
- Export formats

**Example**:
```yaml
name: sales_by_region
type: summary
object: orders
groupings:
  - field: customer.region
    label: Region
aggregations:
  - function: sum
    field: amount
    label: Total Sales
  - function: count
    field: id
    label: Order Count
chart:
  enabled: true
  type: bar
```

#### [Menus & Navigation](./menu.md)
**Purpose**: Define application structure and navigation.

**What you define**:
- Menu hierarchies
- Navigation items
- Quick actions
- Breadcrumbs
- Favorites
- Search integration
- Role-based menu visibility

**Example**:
```yaml
name: main_navigation
type: sidebar
items:
  - name: sales
    label: Sales
    icon: currency
    type: section
    items:
      - name: leads
        label: Leads
        path: /sales/leads
        object: leads
      - name: opportunities
        label: Opportunities
        path: /sales/opportunities
        object: opportunities
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

**Example**:
```yaml
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
  
  views/                     # Presentation
    customer_list.view.yml
    customer_kanban.view.yml
  
  forms/                     # Data entry
    customer_form.form.yml
    quick_customer.form.yml
  
  reports/                   # Analytics
    sales_summary.report.yml
    sales_dashboard.dashboard.yml
  
  navigation/                # App structure
    main_menu.menu.yml
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

### 3. UI Phase
1. Design views for different contexts
2. Create forms for data entry
3. Build reports and dashboards
4. Configure navigation menus

### 4. Testing Phase
1. Test with different user roles
2. Validate business rules
3. Check permission enforcement
4. Performance testing

### 5. Deployment
1. Commit metadata to Git
2. Deploy to ObjectOS runtime
3. Monitor and iterate

## Metadata API & File Structure

ObjectQL provides a universal loader and generic API for all metadata types.

### File Naming Convention
Metadata files are automatically loaded based on their extension. The `name` property in the file is used as the ID, or it is inferred from the filename (e.g. `my-list.view.yml` -> `my-list`).

| Type | Extension |
|---|---|
| Object | `*.object.yml` |
| View | `*.view.yml` |
| Form | `*.form.yml` |
| Menu | `*.menu.yml` |
| Report | `*.report.yml` |
| Workflow | `*.workflow.yml` |
| Permission | `*.permission.yml` |
| Validation | `*.validation.yml` |
| Initial Data | `*.data.yml` |

### Generic Metadata API
All metadata types can be queried via the REST API:

- `GET /api/metadata/:type`
  - List all entries for a specific type (e.g. `/api/metadata/view`)
- `GET /api/metadata/:type/:id`
  - Get the JSON content of a specific entry (e.g. `/api/metadata/view/task_list`)
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
# customers.object.yml
name: customer
fields:
  name: { type: text }
  email: { type: email }

# customers.view.yml
name: customer_list
type: list
object: customer
columns:
  - name
  - email
```

**Result**: ObjectOS automatically generates API, UI, validation, and security - all from metadata!

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
3. **Build UI**: Create views and forms
4. **Secure**: Configure permissions
5. **Automate**: Add workflows
6. **Analyze**: Create reports

## Reference

- [Objects & Fields](./object.md) - Data modeling
- [Query Language](./query-language.md) - Data access
- [Validation](./validation.md) - Data quality
- [Hooks](./hook.md) - Event triggers
- [Actions](./action.md) - Custom operations
- [Workflows](./workflow.md) - Process automation
- [Views](./view.md) - Data presentation
- [Forms](./form.md) - Data entry
- [Reports](./report.md) - Analytics
- [Menus](./menu.md) - Navigation
- [Permissions](./permission.md) - Security
