# View Definition

Views define saved queries, filters, and display configurations for data collections. They allow users to create and share custom perspectives on object data without modifying the underlying page definitions.

**File Naming Convention:** `<view_name>.view.yml`

The filename (without the `.view.yml` extension) automatically becomes the view's identifier. This eliminates the need for a redundant `name` property inside the file.

**Examples:**
- `active_projects.view.yml` → View identifier: `active_projects`
- `my_tasks.view.yml` → View identifier: `my_tasks`
- `high_priority_leads.view.yml` → View identifier: `high_priority_leads`

Files should use **snake_case** for multi-word names.

## 1. Root Properties

| Property | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `label` | `string` | **Required** | Human-readable view name (e.g., "My Active Projects"). |
| `object` | `string` | **Required** | Object this view queries. |
| `description` | `string` | Optional | Internal description of the view purpose. |
| `type` | `string` | Optional | View type: `list`, `kanban`, `calendar`, `table`, `chart`. Default: `list`. |
| `filters` | `array` | Optional | Query filters applied to records. |
| `columns` | `array` | Optional | Fields to display (for list/table views). |
| `sort` | `array` | Optional | Default sorting configuration. |
| `group_by` | `string` | Optional | Field to group records by (for kanban/grouped views). |
| `aggregations` | `object` | Optional | Aggregate calculations (sum, count, avg, etc.). |
| `owner` | `string` | Optional | User who created this view. |
| `visibility` | `string` | Optional | `public`, `private`, `shared`. Default: `private`. |
| `shared_with` | `array` | Optional | Users/roles who can access this view. |
| `is_default` | `boolean` | Optional | Whether this is the default view for the object. |
| `ai_context` | `object` | Optional | AI-friendly context for understanding view purpose. |

## 2. View Types

### 2.1 List View

Standard table/list display of records.

```yaml
# File: active_projects.view.yml

label: Active Projects
object: project
type: list

# Filter criteria
filters:
  - field: status
    operator: "="
    value: active
  - and
  - field: end_date
    operator: ">="
    value: $today

# Columns to display
columns:
  - name
  - owner
  - start_date
  - end_date
  - budget
  - progress

# Default sorting
sort:
  - field: end_date
    direction: asc

# Visibility
visibility: public

ai_context:
  intent: "Show all currently active projects sorted by end date"
  common_use_cases:
    - "View projects due soon"
    - "Track active project status"
```

### 2.2 Kanban View

Card-based view grouped by status or category.

```yaml
# File: task_board.view.yml

label: Task Board
object: task
type: kanban

# Kanban configuration
group_by: status

# Swimlanes (status columns)
swimlanes:
  - value: todo
    label: To Do
    color: gray
  
  - value: in_progress
    label: In Progress
    color: blue
  
  - value: review
    label: In Review
    color: yellow
  
  - value: done
    label: Done
    color: green

# Card display fields
card_fields:
  - title
  - assignee
  - due_date
  - priority

# Filters
filters:
  - field: archived
    operator: "="
    value: false

# Sorting within columns
sort:
  - field: priority
    direction: desc
  - field: due_date
    direction: asc

ai_context:
  intent: "Kanban board for task management with drag-and-drop status updates"
  domain: project_management
```

### 2.3 Calendar View

Time-based visualization of records.

```yaml
# File: project_timeline.view.yml

label: Project Timeline
object: project
type: calendar

# Calendar configuration
date_field: start_date
end_date_field: end_date

# Display mode
display_mode: month # day, week, month, year

# Event display
event_label: name
event_color_field: status

# Color mapping
color_map:
  planning: blue
  active: green
  on_hold: yellow
  completed: gray

# Filters
filters:
  - field: start_date
    operator: ">="
    value: $first_of_year

ai_context:
  intent: "Calendar view showing project timelines and durations"
  domain: project_management
```

### 2.4 Chart View

Data visualization with charts and graphs.

```yaml
# File: revenue_by_month.view.yml

label: Monthly Revenue
object: order
type: chart

# Chart configuration
chart_type: bar # line, bar, pie, donut, area

# Data aggregation
aggregations:
  # Y-axis metric
  metric:
    field: amount
    function: sum
    label: Total Revenue
  
  # X-axis grouping
  dimension:
    field: created_at
    group_by: month
    label: Month

# Filters
filters:
  - field: status
    operator: "="
    value: completed
  - and
  - field: created_at
    operator: ">="
    value: $start_of_year

# Time range
time_range:
  field: created_at
  period: last_12_months

ai_context:
  intent: "Visualize monthly revenue trends from completed orders"
  domain: sales
```

### 2.5 Pivot Table View

Multi-dimensional data analysis.

```yaml
# File: sales_analysis.view.yml

label: Sales Analysis
object: deal
type: pivot

# Pivot configuration
rows:
  - sales_rep
  - region

columns:
  - quarter

values:
  - field: amount
    function: sum
    label: Total Deal Value
  
  - field: id
    function: count
    label: Number of Deals

# Filters
filters:
  - field: stage
    operator: "="
    value: closed_won
  - and
  - field: close_date
    operator: ">="
    value: $start_of_year

ai_context:
  intent: "Analyze sales performance by rep, region, and quarter"
  domain: sales
```

## 3. Filters

Views use the same filter syntax as the [Query Language](./query-language.md).

### 3.1 Basic Filters

```yaml
filters:
  # Single condition
  - field: status
    operator: "="
    value: active
  
  # Logical operator
  - and
  
  # Another condition
  - field: priority
    operator: in
    value: [high, urgent]
```

### 3.2 Dynamic Filters

Use dynamic values for user-specific or time-based filters.

```yaml
filters:
  # Current user
  - field: owner_id
    operator: "="
    value: $current_user.id
  
  # Date functions
  - and
  - field: due_date
    operator: between
    value: [$today, $end_of_week]
  
  # User attributes
  - and
  - field: region
    operator: "="
    value: $current_user.region
```

### 3.3 Advanced Filters

```yaml
filters:
  # Nested conditions
  - or:
      - field: priority
        operator: "="
        value: urgent
      - and:
          - field: priority
            operator: "="
            value: high
          - field: due_date
            operator: "<"
            value: $tomorrow
  
  # Related object filters
  - field: customer.industry
    operator: "="
    value: technology
  
  # Formula-based filters
  - field: days_overdue
    operator: ">"
    value: 0
```

## 4. Display Configuration

### 4.1 Columns

Define which fields to display and how.

```yaml
columns:
  # Simple field reference
  - name
  - status
  
  # Column with custom configuration
  - field: amount
    label: Deal Value
    width: 150
    alignment: right
    format: currency
  
  # Related field
  - field: owner.name
    label: Owner
    width: 200
  
  # Formula field
  - field: days_until_due
    label: Days Remaining
    format: number
```

### 4.2 Sorting

```yaml
sort:
  # Primary sort
  - field: priority
    direction: desc
  
  # Secondary sort
  - field: created_at
    direction: asc
```

### 4.3 Pagination

```yaml
pagination:
  page_size: 50 # Records per page
  default_page: 1
  show_total: true
```

## 5. Aggregations

Calculate summary statistics for the view.

```yaml
aggregations:
  # Count records
  total_count:
    function: count
  
  # Sum numeric field
  total_revenue:
    field: amount
    function: sum
  
  # Average
  average_deal_size:
    field: amount
    function: avg
  
  # Min/Max
  earliest_date:
    field: created_at
    function: min
  
  latest_date:
    field: created_at
    function: max
  
  # Group by
  by_status:
    field: status
    function: count
    group_by: status
```

## 6. Visibility and Sharing

### 6.1 Private View

Only visible to the creator.

```yaml
label: My Private Tasks
object: task
visibility: private

filters:
  - field: assignee_id
    operator: "="
    value: $current_user.id
```

### 6.2 Public View

Visible to all users who can access the object.

```yaml
label: All Active Projects
object: project
visibility: public

filters:
  - field: status
    operator: "="
    value: active
```

### 6.3 Shared View

Visible to specific users or roles.

```yaml
label: Executive Dashboard View
object: opportunity
visibility: shared

shared_with:
  roles:
    - executive
    - sales_manager
  users:
    - ceo@company.com
    - cfo@company.com

filters:
  - field: stage
    operator: "="
    value: negotiation
```

## 7. Complete Examples

### Example 1: My Open Tasks View

```yaml
# File: my_open_tasks.view.yml

label: My Open Tasks
object: task
type: list
description: Tasks assigned to me that are not yet completed

# Filter to current user's open tasks
filters:
  - field: assignee_id
    operator: "="
    value: $current_user.id
  - and
  - field: status
    operator: not in
    value: [completed, cancelled]

# Display columns
columns:
  - title
  - priority
  - project.name
  - due_date
  - status

# Sort by priority then due date
sort:
  - field: priority
    direction: desc
  - field: due_date
    direction: asc

# Aggregations
aggregations:
  total_tasks:
    function: count
  
  overdue_count:
    function: count
    filters:
      - field: due_date
        operator: "<"
        value: $today

# Private view
visibility: private

ai_context:
  intent: "Personal task list showing open assignments sorted by priority"
  domain: task_management
  common_use_cases:
    - "Check daily tasks"
    - "See overdue tasks"
    - "Plan work priorities"
```

### Example 2: Sales Pipeline View

```yaml
# File: sales_pipeline.view.yml

label: Sales Pipeline
object: opportunity
type: kanban
description: Visual pipeline of all sales opportunities

# Group by stage
group_by: stage

# Pipeline stages
swimlanes:
  - value: prospecting
    label: Prospecting
    color: gray
  
  - value: qualification
    label: Qualification
    color: blue
  
  - value: proposal
    label: Proposal
    color: purple
  
  - value: negotiation
    label: Negotiation
    color: yellow
  
  - value: closed_won
    label: Closed Won
    color: green
  
  - value: closed_lost
    label: Closed Lost
    color: red

# Card display
card_fields:
  - name
  - account.name
  - amount
  - close_date
  - probability

# Only show open opportunities
filters:
  - field: is_closed
    operator: "="
    value: false

# Sort within stages
sort:
  - field: amount
    direction: desc

# Aggregations
aggregations:
  total_pipeline:
    field: amount
    function: sum
  
  weighted_pipeline:
    field: weighted_amount
    function: sum
  
  opportunity_count:
    function: count

# Public to sales team
visibility: public

ai_context:
  intent: "Kanban board showing sales pipeline with drag-and-drop stage updates"
  domain: sales
  related_views:
    - forecast_view
    - closed_deals
```

### Example 3: Overdue Invoices Report

```yaml
# File: overdue_invoices.view.yml

label: Overdue Invoices
object: invoice
type: list
description: Invoices past due date that haven't been paid

# Overdue filter
filters:
  - field: due_date
    operator: "<"
    value: $today
  - and
  - field: status
    operator: "!="
    value: paid

# Display columns
columns:
  - invoice_number
  - customer.name
  - amount
  - due_date
  - days_overdue
  - status

# Sort by days overdue
sort:
  - field: days_overdue
    direction: desc

# Aggregations
aggregations:
  total_overdue:
    field: amount
    function: sum
    label: Total Overdue Amount
  
  count_by_age:
    function: count
    group_by: aging_bucket
    label: Invoices by Age

# Shared with finance team
visibility: shared
shared_with:
  roles:
    - finance
    - accounting
    - collections

ai_context:
  intent: "Track overdue invoices for collections follow-up"
  domain: finance
  alerts:
    - "Highlight invoices over 90 days old"
    - "Notify collections team of new overdue invoices"
```

### Example 4: Revenue Trend Chart

```yaml
# File: revenue_trend.view.yml

label: Revenue Trend
object: order
type: chart
description: Monthly revenue trend over the last 12 months

# Chart configuration
chart_type: line

# Aggregation
aggregations:
  metric:
    field: total_amount
    function: sum
    label: Revenue
  
  dimension:
    field: order_date
    group_by: month
    label: Month

# Only completed orders
filters:
  - field: status
    operator: "="
    value: completed
  - and
  - field: order_date
    operator: ">="
    value: $start_of_last_year

# Time range
time_range:
  field: order_date
  period: last_12_months

# Public view
visibility: public

ai_context:
  intent: "Visualize revenue trends to identify seasonal patterns"
  domain: sales
  insights:
    - "Track month-over-month growth"
    - "Identify seasonal trends"
    - "Compare with previous year"
```

## 8. Best Practices

### 8.1 Performance

- **Limit initial data**: Use filters to reduce result set
- **Index filter fields**: Ensure filtered fields have indexes
- **Optimize aggregations**: Use database-level aggregations
- **Paginate large results**: Use reasonable page sizes

### 8.2 User Experience

- **Meaningful defaults**: Set sensible filters and sorts
- **Clear naming**: Use descriptive view names
- **Appropriate type**: Choose the right view type for the data
- **Save user preferences**: Remember user's customizations

### 8.3 Maintainability

- **Document intent**: Use `ai_context` to explain purpose
- **Reusable views**: Create views others can leverage
- **Version control**: Track view changes in Git
- **Regular review**: Clean up unused views

### 8.4 Security

- **Respect permissions**: Views honor object/field security
- **Careful sharing**: Consider who should access each view
- **Filter sensitive data**: Exclude confidential records
- **Audit access**: Log view usage for sensitive data

## 9. Dynamic Values

Views support dynamic values that evaluate at runtime.

### 9.1 User Context

```yaml
# Current user values
$current_user.id
$current_user.email
$current_user.role
$current_user.region
$current_user.manager_id
```

### 9.2 Date Functions

```yaml
# Relative dates
$today
$yesterday
$tomorrow
$start_of_week
$end_of_week
$start_of_month
$end_of_month
$start_of_quarter
$end_of_quarter
$start_of_year
$end_of_year

# Relative periods
$last_7_days
$last_30_days
$last_90_days
$last_12_months
$next_7_days
$next_30_days
```

### 9.3 Computed Values

```yaml
# Formulas
$computed.field_name

# Record counts
$count.related_object

# Aggregates
$sum.field_name
$avg.field_name
```

## 10. View Composition

Views can reference other views for composition.

```yaml
# File: executive_pipeline.view.yml

label: Executive Pipeline View
object: opportunity

# Inherit from base view
extends: sales_pipeline

# Add additional filters
filters:
  - field: amount
    operator: ">"
    value: 100000

# Override columns
columns:
  - name
  - account.name
  - amount
  - stage
  - owner.name

ai_context:
  intent: "Executive view of large opportunities in pipeline"
  extends: sales_pipeline
```

## 11. Integration with Other Metadata

Views integrate seamlessly with:

- **Objects**: Query object data with full field access
- **Pages**: Pages can display views as tabs or sections
- **Permissions**: Views respect object and field permissions
- **Actions**: Views can expose actions for bulk operations
- **Formulas**: Views can display calculated formula fields

## 12. AI Context Guidelines

Include `ai_context` to help AI understand:

```yaml
ai_context:
  # Business purpose
  intent: "Track high-priority tasks due this week"
  
  # Business domain
  domain: project_management
  
  # Common scenarios
  common_use_cases:
    - "Daily standup review"
    - "Weekly planning"
    - "Urgent task tracking"
  
  # Related views
  related_views:
    - all_tasks
    - overdue_tasks
  
  # Insights provided
  insights:
    - "Shows task distribution by priority"
    - "Highlights overdue items"
```

## 13. Migration from Code

### Before (SQL Query):
```sql
SELECT t.*, u.name as owner_name
FROM tasks t
JOIN users u ON t.owner_id = u.id
WHERE t.status NOT IN ('completed', 'cancelled')
  AND t.owner_id = ?
ORDER BY t.priority DESC, t.due_date ASC;
```

### After (Metadata):
```yaml
# File: my_open_tasks.view.yml
object: task
filters:
  - field: status
    operator: not in
    value: [completed, cancelled]
  - and
  - field: owner_id
    operator: "="
    value: $current_user.id
columns: [title, priority, due_date, status]
sort:
  - field: priority
    direction: desc
  - field: due_date
    direction: asc
```

The ObjectQL engine automatically generates optimized queries!

## See Also

- [Query Language](./query-language.md) - Filter and query syntax
- [Pages](./page.md) - UI page definitions
- [Objects](./object.md) - Data model definitions
- [Permissions](./permission.md) - Access control
