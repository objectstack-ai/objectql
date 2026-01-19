# Page Definition

Pages define the user interface views and layouts for your application. They control how data is displayed and how users interact with your objects.

**File Naming Convention:** `<page_name>.page.yml`

The filename (without the `.page.yml` extension) automatically becomes the page's identifier. This eliminates the need for a redundant `name` property inside the file.

**Examples:**
- `project_list.page.yml` → Page identifier: `project_list`
- `dashboard.page.yml` → Page identifier: `dashboard`
- `customer_detail.page.yml` → Page identifier: `customer_detail`

Files should use **snake_case** for multi-word names.

## 1. Root Properties

| Property | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `label` | `string` | Recommended | Human-readable title (e.g., "Project Dashboard"). |
| `type` | `string` | **Required** | Page type: `list`, `detail`, `dashboard`, `custom`. |
| `object` | `string` | Conditional | Object name this page displays. Required for `list` and `detail` types. |
| `icon` | `string` | Optional | Icon identifier (e.g., `standard:home`). |
| `description` | `string` | Optional | Internal description of the page purpose. |
| `layout` | `object` | Optional | Layout configuration for the page. |
| `sections` | `array` | Optional | Page sections and components. |
| `filters` | `array` | Optional | Default filters applied to data. |
| `permissions` | `object` | Optional | Access control for the page. |
| `ai_context` | `object` | Optional | AI-friendly context for understanding page purpose. |

## 2. Page Types

### 2.1 List Page

Displays a collection of records in a table or grid view.

```yaml
# File: project_list.page.yml

label: Projects
type: list
object: project
icon: standard:project

# Default view configuration
view:
  # Columns to display
  columns:
    - name
    - status
    - owner
    - created_at
  
  # Default sorting
  sort:
    - field: created_at
      direction: desc
  
  # Quick filters
  filters:
    - field: status
      operator: "="
      value: active

# Actions available on this page
actions:
  - create_project
  - bulk_update_status
  - export_to_excel

# AI Context
ai_context:
  intent: "Display all projects with filtering and sorting capabilities"
  common_use_cases:
    - "View all active projects"
    - "Search projects by name"
    - "Filter projects by owner"
```

### 2.2 Detail Page

Displays a single record with full details and related records.

```yaml
# File: project_detail.page.yml

label: Project Details
type: detail
object: project

# Layout sections
sections:
  # Basic information section
  - label: Project Information
    columns: 2
    fields:
      - name
      - status
      - owner
      - start_date
      - end_date
      - budget
  
  # Related lists section
  - label: Tasks
    type: related_list
    relationship: tasks
    columns:
      - title
      - status
      - assignee
      - due_date
  
  # Activity timeline
  - label: Activity
    type: timeline
    events:
      - comments
      - status_changes
      - task_updates

# Actions available on detail page
actions:
  - edit
  - delete
  - clone_project
  - archive

ai_context:
  intent: "Display comprehensive project details with related tasks and activity"
```

### 2.3 Dashboard Page

Aggregated views with charts, metrics, and widgets.

```yaml
# File: sales_dashboard.page.yml

label: Sales Dashboard
type: dashboard
icon: standard:dashboard

# Dashboard layout
layout:
  columns: 12
  
# Widgets
widgets:
  # Revenue chart
  - type: chart
    title: Monthly Revenue
    position: { row: 0, col: 0, width: 8, height: 4 }
    source:
      object: order
      aggregation:
        field: amount
        function: sum
        group_by: created_month
    chart_type: line
  
  # KPI metric
  - type: metric
    title: Total Deals Closed
    position: { row: 0, col: 8, width: 4, height: 2 }
    source:
      object: deal
      aggregation:
        function: count
      filters:
        - field: status
          operator: "="
          value: closed_won
  
  # Recent activity list
  - type: list
    title: Recent Opportunities
    position: { row: 4, col: 0, width: 12, height: 4 }
    source:
      object: opportunity
      limit: 10
      sort:
        - field: created_at
          direction: desc

# Refresh interval (seconds)
refresh_interval: 300

ai_context:
  intent: "Executive dashboard showing key sales metrics and trends"
  domain: sales
```

### 2.4 Custom Page

Fully custom pages with embedded components or external integrations.

```yaml
# File: custom_report.page.yml

label: Custom Analytics
type: custom
icon: standard:report

# Custom component configuration
component:
  # Reference to custom React/Vue component
  path: ./components/CustomAnalytics.tsx
  
  # Props passed to component
  props:
    dataSource: sales_data
    dateRange: last_90_days
    
# Data sources for the custom component
data_sources:
  sales_data:
    object: order
    fields:
      - amount
      - created_at
      - status
      - customer_id
    filters:
      - field: status
        operator: "="
        value: completed

permissions:
  view: [admin, sales_manager]

ai_context:
  intent: "Custom analytics page with specialized visualizations"
```

## 3. Layout Configuration

### 3.1 Grid Layout

```yaml
layout:
  type: grid
  columns: 12 # 12-column grid system
  gap: 16 # Gap between items in pixels
  
sections:
  - type: fields
    position: { row: 0, col: 0, width: 6, height: 4 }
    fields: [name, status, owner]
  
  - type: related_list
    position: { row: 0, col: 6, width: 6, height: 4 }
    relationship: tasks
```

### 3.2 Tab Layout

```yaml
layout:
  type: tabs
  
tabs:
  - label: Details
    sections:
      - fields: [name, description, status]
  
  - label: Related
    sections:
      - type: related_list
        relationship: tasks
  
  - label: History
    sections:
      - type: timeline
```

## 4. Filters and Search

```yaml
# Quick filters (displayed as buttons)
quick_filters:
  - label: My Projects
    filters:
      - field: owner_id
        operator: "="
        value: $current_user.id
  
  - label: Active
    filters:
      - field: status
        operator: "="
        value: active

# Advanced search configuration
search:
  # Enable full-text search
  enabled: true
  
  # Fields to search across
  fields:
    - name
    - description
    - owner.name
  
  # Search placeholder
  placeholder: "Search projects..."
```

## 5. Permissions

Control who can access the page.

```yaml
permissions:
  # Roles that can view this page
  view: [admin, manager, user]
  
  # Dynamic visibility rules
  visibility_rules:
    - condition:
        field: status
        operator: "="
        value: archived
      roles: [admin]
```

## 6. Responsive Behavior

```yaml
responsive:
  # Mobile configuration
  mobile:
    # Hide certain columns on mobile
    hidden_columns:
      - created_at
      - modified_at
    
    # Mobile-specific layout
    layout: stack
  
  # Tablet configuration
  tablet:
    columns: 2
```

## 7. Complete Examples

### Example 1: Customer List Page

```yaml
# File: customer_list.page.yml

label: Customers
type: list
object: customer
icon: standard:account

view:
  columns:
    - name
    - email
    - phone
    - industry
    - status
    - owner
  
  sort:
    - field: name
      direction: asc

quick_filters:
  - label: My Customers
    filters:
      - field: owner_id
        operator: "="
        value: $current_user.id
  
  - label: Active
    filters:
      - field: status
        operator: "="
        value: active
  
  - label: VIP
    filters:
      - field: tier
        operator: "="
        value: vip

search:
  enabled: true
  fields:
    - name
    - email
    - company
  placeholder: "Search customers..."

actions:
  - create_customer
  - import_customers
  - export_to_csv

permissions:
  view: [admin, sales_rep, support]

ai_context:
  intent: "Manage customer records with filtering and search"
  domain: crm
  common_queries:
    - "Show all VIP customers"
    - "Find customers in technology industry"
    - "List my active customers"
```

### Example 2: Order Detail Page

```yaml
# File: order_detail.page.yml

label: Order Details
type: detail
object: order
icon: standard:orders

sections:
  # Order Information
  - label: Order Information
    type: fields
    columns: 2
    fields:
      - order_number
      - status
      - customer
      - order_date
      - total_amount
      - payment_status
  
  # Line Items
  - label: Order Items
    type: related_list
    relationship: order_items
    columns:
      - product
      - quantity
      - unit_price
      - total_price
    actions:
      - add_item
      - remove_item
  
  # Shipping Information
  - label: Shipping
    type: fields
    columns: 1
    fields:
      - shipping_address
      - shipping_method
      - tracking_number
      - estimated_delivery
  
  # Activity Timeline
  - label: Activity
    type: timeline
    events:
      - status_changes
      - comments
      - email_notifications

actions:
  - edit
  - delete
  - clone_order
  - cancel_order
  - process_refund
  - send_invoice

permissions:
  view: [admin, sales, customer_service]
  edit: [admin, sales]
  delete: [admin]

ai_context:
  intent: "Display complete order details with line items and shipping information"
  domain: e-commerce
```

## 8. Best Practices

### 8.1 Performance

- **Limit initial data load**: Use pagination and lazy loading
- **Index searchable fields**: Ensure fields used in filters have database indexes
- **Optimize related lists**: Limit initial records displayed
- **Cache dashboard widgets**: Use appropriate refresh intervals

### 8.2 User Experience

- **Meaningful defaults**: Set sensible default filters and sorts
- **Progressive disclosure**: Show most important information first
- **Consistent layouts**: Use similar layouts for similar page types
- **Mobile-first design**: Consider mobile users in layout decisions

### 8.3 Security

- **Page-level permissions**: Control access to sensitive pages
- **Field-level security**: Respect field permissions in page layouts
- **Record-level rules**: Apply sharing rules consistently
- **Audit sensitive actions**: Log access to confidential pages

### 8.4 Maintainability

- **Clear naming**: Use descriptive page identifiers
- **Reusable components**: Create reusable section templates
- **Version control**: Track page changes in Git
- **Documentation**: Add `ai_context` for future maintenance

## 9. Advanced Features

### 9.1 Dynamic Pages

Pages that adapt based on context or user.

```yaml
# Conditional sections based on record state
sections:
  - label: Approval Section
    type: fields
    fields: [approver, approval_date]
    visibility:
      condition:
        field: status
        operator: in
        value: [pending_approval, approved]
```

### 9.2 Embedded Actions

```yaml
sections:
  - label: Quick Actions
    type: action_group
    actions:
      - approve
      - reject
      - request_more_info
    layout: horizontal
```

### 9.3 Custom Renderers

```yaml
view:
  columns:
    - name
    - amount
    - status:
        # Custom renderer for status field
        renderer: badge
        color_map:
          active: green
          pending: yellow
          closed: gray
```

## 10. Integration with Other Metadata

Pages work seamlessly with other metadata types:

- **Objects**: Pages display data from object definitions
- **Views**: Pages can embed saved views
- **Forms**: Detail pages use forms for data entry
- **Actions**: Pages expose actions as buttons
- **Permissions**: Pages respect object and field permissions
- **Workflows**: Pages show workflow states and actions

## 11. AI Context Guidelines

Include `ai_context` to help AI understand:

```yaml
ai_context:
  # Business purpose
  intent: "Dashboard for sales managers to track team performance"
  
  # Business domain
  domain: sales
  
  # Common user goals
  common_use_cases:
    - "View team quota attainment"
    - "Track pipeline health"
    - "Monitor deal progression"
  
  # Related pages
  related_pages:
    - opportunity_list
    - sales_forecast
```

## 12. Migration from Code

### Before (React Component):
```typescript
function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState({});
  
  // 200+ lines of component code...
}
```

### After (Metadata):
```yaml
# File: project_list.page.yml
label: Projects
type: list
object: project
view:
  columns: [name, status, owner]
```

The ObjectQL runtime automatically generates the UI from metadata!

## See Also

- [Views](./view.md) - Saved data views and filters
- [Forms](./form.md) - Data entry layouts
- [Objects](./object.md) - Data model definitions
- [Permissions](./permission.md) - Access control
