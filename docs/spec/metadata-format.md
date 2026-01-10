# ObjectQL Metadata Specification

**Version:** 1.0.0

## 1. Architecture Overview

ObjectQL is a **query transpiler** that converts a standardized JSON-DSL into native database queries.

* **Pattern:** Repository Pattern with a Multi-Datasource strategy.
* **Datasources:**
  * **MongoDB:** Schema-less, fast iteration.
  * **PostgreSQL/Knex:** Schema-strict, JSONB hybrid storage.
* **Execution Flow:** `Client -> JSON DSL -> ObjectQL Core -> Driver -> Native Query -> DB`.

## 2. Directory & Datasource Resolution

The system uses a **"Directory-as-Datasource"** convention to map objects to database connections.

### 2.1 Standard Structure

```text
/project-root
├── /objects
│   ├── /_common/           # [Reserved] Mixins or abstract definitions
│   │
│   ├── /external/          # [Datasource: external] (e.g., pg)
│   │   └── erp_orders.object.yml  # -> Mapped to 'external' connection
│   │
│   └── users.object.yml           # [Datasource: default] (Root level = default)
│
├── /roles                  # RBAC Definitions
└── objectql.config.js          # Connection config (Environment specific)
```

### 2.2 Resolution Priority

1. **Explicit:** `datasource` property in YAML (if supported).
2. **Implicit:** Subdirectory name under `/objects/`.
3. **Fallback:** `default` connection.

### 2.3 Connection Configuration (`objectql.config.js`)

This file exports the configuration for all valid datasources. The `default` datasource is required.

```javascript
module.exports = {
  datasources: {
    // The 'default' connection (Required)
    // Used for files in /objects/*.object.yml (root)
    default: {
      driver: '@objectql/driver-mongo',
      connection: process.env.MONGO_URL
    },

    // 'logs' connection
    // Used for files in /objects/logs/*.object.yml
    external: {
      driver: '@objectql/driver-knex', // NPM package or Driver Instance
      client: 'pg',                    // Knex specific config
      connection: process.env.POSTGRES_URL
    },
  }
}
```

## 3. Object Definition

Object files are typically defined in YAML (or JSON) and represent a business entity or database table.

Files should use **Snake Case** filenames (e.g., `project_tasks.object.yml`).

### 3.1 Root Properties

| Property | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | **Required.** Unique API name of the object. Should match filename. |
| `label` | `string` | Human-readable label (e.g., "Project Task"). |
| `icon` | `string` | SLDS icon string (e.g., `standard:task`). |
| `description` | `string` | Internal description of the object. |
| `fields` | `Map` | Dictionary of field definitions. |
| `actions` | `Map` | Dictionary of custom action definitions. |
| `customizable` | `boolean` | Whether this object can be modified or deleted. System objects (e.g., `user`, `session`) should be set to `false`. **Default: `true`** (if not specified, the object is customizable). |

## 4. Field Definitions

Fields are defined under the `fields` key. The key for each entry corresponds to the field's API name.

```yaml
fields:
  field_name:
    type: text
    label: Field Label
```

### 4.1 Common Properties

| Property | Type | Description |
| :--- | :--- | :--- |
| `type` | `string` | **Required.** Data type of the field. See Section 4.2. |
| `label` | `string` | Display label for UI validation messages. |
| `required` | `boolean` | If `true`, the field cannot be null/undefined. Default: `false`. |
| `defaultValue` | `any` | Default value if not provided during creation. |
| `index` | `boolean` | Hint to create a database index. |
| `searchable` | `boolean` | Hint to include this field in global search. |
| `sortable` | `boolean` | Hint that this field can be used for sorting in UI. |
| `description` | `string` | Help text or documentation for the field. |
| `customizable` | `boolean` | Whether this field can be modified or deleted. System fields (e.g., `_id`, `createdAt`, `updatedAt`) should be set to `false`. **Default: `true`** (if not specified, the field is customizable). |

### 4.2 Supported Field Types

| Type | Description | Specific Properties |
| :--- | :--- | :--- |
| **Basic Types** | | |
| `text` | Single line text. | `min_length`, `max_length`, `regex` |
| `textarea` | Multiline text. | `rows`, `min_length`, `max_length` |
| `markdown` | Markdown formatted text. | |
| `html` | Rich text content (HTML). | |
| `number` | Numeric value (integer or float). | `precision`, `min`, `max` |
| `currency` | Monetary value. | `scale`, `min`, `max` |
| `percent` | Percentage value (0-1). | `scale`, `min`, `max` |
| `boolean` | `true` or `false`. | |
| **System/Format Types** | | |
| `email` | Email address with validation. | |
| `phone` | Phone number formatting. | |
| `url` | Web URL validation. | |
| `password` | Encrypted or masked string. | |
| **Date & Time** | | |
| `date` | Date only (YYYY-MM-DD). | |
| `datetime` | Date and time (ISO string). | |
| `time` | Time only (HH:mm:ss). | |
| **Complex/Media** | | |
| `file` | File attachment (stored as JSON). | `multiple` |
| `image` | Image attachment (stored as JSON). | `multiple` |
| `avatar` | User avatar image. | |
| `location` | Geolocation (lat/lng JSON). | |
| **Relationships** | | |
| `select` | Selection from a list. | `options`, `multiple` |
| `lookup` | Reference to another object. | `reference_to`, `multiple` |
| `master_detail` | Strong ownership relationship. | `reference_to` (Required) |
| **Advanced** | | |
| `formula` | Read-only calculated field. | `expression`, `data_type` |
| `summary` | Roll-up summary of child records. | `summary_object`, `summary_type`, `summary_field`, `summary_filters` |
| `auto_number` | Auto-incrementing unique identifier. | `auto_number_format` |
| `object` | JSON object structure. | |
| `grid` | Array of objects/rows. | |

### 4.6 Field Attributes

| Attribute | Type | Description |
| :--- | :--- | :--- |
| `required` | `boolean` | If true, database enforces NOT NULL. |
| `unique` | `boolean` | If true, database enforces UNIQUE constraint. |
| `readonly` | `boolean` | UI hint: Field should not be editable by users. |
| `hidden` | `boolean` | UI/API hint: Field should be hidden by default. |
| `defaultValue` | `any` | Default value on creation. |
| `help_text` | `string` | Tooltip for end-users. |
| `multiple` | `boolean` | Allows multiple values (stored as JSON array). |
| `min`, `max` | `number` | Range validation for numeric types. |
| `min_length`, `max_length` | `number` | Length validation for text types. |
| `regex` | `string` | Custom regular expression validation. |


### 4.3 Relationship Fields

Key properties for `lookup` or `master_detail`:

*   **reference_to**: The `name` of the target object.

```yaml
owner:
  type: lookup
  reference_to: users
  label: Owner
```

### 4.4 Select Options

Options for `select` can be a simple list or label/value pairs.

```yaml
status:
  type: select
  options:
    - label: Planned
      value: planned
    - label: In Progress
      value: in_progress
```

## 5. Actions (RPC)

Custom business logic can be defined in the `actions` section.

```yaml
actions:
  approve:
    label: Approve Request
    description: Approves the current record.
    params:
      comment:
        type: textarea
        label: Approval Comments
    result:
      type: boolean
```

## 6. App Definition

App files define application interfaces with custom navigation menus, similar to Airtable interfaces. Apps are defined in `*.app.yml` or `*.app.yaml` files.

### 6.1 Root Properties

| Property | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | Unique identifier for the app, default to id if not specified. |
| `label` | `string` | **Required.** Display name of the app. |
| `description` | `string` | Description of the app's purpose. |
| `icon` | `string` | Icon identifier (e.g., `ri-dashboard-line`). |
| `color` | `string` | Color theme for the app (e.g., `blue`, `gray`). |
| `dark` | `boolean` | Whether to use dark mode by default. |
| `menu` | `array` | Left-side navigation menu configuration. See Section 6.2. |

### 6.2 Menu Configuration

The `menu` property defines the left-side navigation structure. It can be either:
- An array of menu items (flat structure)
- An array of menu sections (grouped structure)

#### Menu Item Properties

| Property | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier for the menu item. |
| `label` | `string` | **Required.** Display label for the menu item. |
| `icon` | `string` | Icon identifier (e.g., `ri-home-line`, `ri-dashboard-line`). |
| `type` | `string` | Type: `object`, `page`, `url`, or `divider`. Default: `page`. |
| `object` | `string` | Object name to link to (when `type: object`). |
| `url` | `string` | URL path (when `type: page` or `type: url`). |
| `badge` | `string|number` | Badge text or count to display next to the item. |
| `visible` | `boolean` | Whether the item is visible. Default: `true`. |
| `items` | `array` | Nested sub-menu items (for hierarchical menus). |

#### Menu Section Properties

| Property | Type | Description |
| :--- | :--- | :--- |
| `label` | `string` | Section title/header. |
| `items` | `array` | **Required.** Menu items in this section. |
| `collapsible` | `boolean` | Whether the section can be collapsed. Default: `false`. |
| `collapsed` | `boolean` | Whether the section is collapsed by default. Default: `false`. |

### 6.3 Menu Types

**`object`**: Links to an object's list view
```yaml
- label: Projects
  icon: ri-building-line
  type: object
  object: projects
```

**`page`**: Links to an internal page/route
```yaml
- label: Dashboard
  icon: ri-dashboard-line
  type: page
  url: /dashboard
```

**`url`**: External or absolute URL link
```yaml
- label: Documentation
  icon: ri-book-line
  type: url
  url: https://docs.example.com
```

**`divider`**: Visual separator (no label or action)
```yaml
- type: divider
```

### 6.4 Complete App Example

```yaml
name: projects
label: Project Management
description: Manage and track your projects efficiently.
icon: ri-dashboard-line
color: blue
dark: false

menu:
  # Main section
  - label: Main
    items:
      - label: Dashboard
        icon: ri-dashboard-line
        type: page
        url: /dashboard
      - label: All Projects
        icon: ri-building-line
        type: object
        object: projects
      - label: Active Tasks
        icon: ri-checkbox-circle-line
        type: object
        object: tasks
        badge: 12
  
  # Views section
  - label: Views
    collapsible: true
    items:
      - label: My Projects
        icon: ri-user-line
        type: page
        url: /my-projects
      - label: Team Calendar
        icon: ri-calendar-line
        type: page
        url: /calendar
      - label: Reports
        icon: ri-bar-chart-line
        type: page
        url: /reports
  
  # Settings
  - label: Settings
    collapsible: true
    collapsed: true
    items:
      - label: App Settings
        icon: ri-settings-3-line
        type: page
        url: /settings
      - type: divider
      - label: Help & Support
        icon: ri-question-line
        type: url
        url: https://docs.example.com
```

## 7. Complete Example

```yaml
name: project
label: Project
icon: standard:case
description: Tracks internal projects and deliverables.
enable_search: true

fields:
  name:
    label: Project Name
    type: text
    required: true
    index: true
    searchable: true
  
  status:
    label: Status
    type: select
    defaultValue: planned
    options:
      - label: Planned
        value: planned
      - label: Active
        value: active
      - label: Archived
        value: archived

  priority:
    label: Priority
    type: select
    options: [High, Medium, Low]

  start_date:
    label: Start Date
    type: date

  budget:
    label: Total Budget
    type: currency
    scale: 2

  manager:
    label: Project Manager
    type: lookup
    reference_to: users
    index: true

  notes:
    label: Internal Notes
    type: textarea

actions:
  calculate_roi:
    label: Calculate ROI
    result: 
      type: currency
```

## 7. Chart Definition

Chart files define data visualizations based on object data. They use the naming convention `*.chart.yml` or `*.chart.yaml`.

### 7.1 Root Properties

| Property | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | **Required.** Unique API name of the chart. |
| `label` | `string` | Human-readable label for the chart. |
| `description` | `string` | Description of what the chart visualizes. |
| `type` | `string` | **Required.** Chart type: `bar`, `line`, `pie`, or `area`. |
| `object` | `string` | **Required.** The object/entity to visualize data from. |
| `xAxisKey` | `string` | **Required.** Field name for X-axis data. |
| `yAxisKeys` | `string[]` | **Required.** Array of field names for Y-axis data series. |
| `height` | `number` | Chart height in pixels. Default: `300`. |
| `colors` | `string[]` | Custom color palette for chart series. |
| `showGrid` | `boolean` | Whether to display grid lines. Default: `true`. |
| `showLegend` | `boolean` | Whether to display the legend. Default: `true`. |
| `showTooltip` | `boolean` | Whether to show tooltips on hover. Default: `true`. |
| `filters` | `array` | Optional filters to apply to the data query. |
| `sort` | `array` | Sort criteria as `[field, direction]` pairs. |

### 7.2 Chart Types

**Bar Chart**: Best for comparing values across categories.

**Line Chart**: Ideal for showing trends over time.

**Area Chart**: Similar to line charts but with filled areas, great for cumulative data.

**Pie Chart**: Best for showing proportions and distributions (limit to 5-7 categories).

### 7.3 Example Chart Definitions

#### Pie Chart Example

```yaml
name: projects_by_status
label: Projects by Status
description: Distribution of projects across different statuses
type: pie
object: projects
xAxisKey: status
yAxisKeys:
  - count
height: 350
showLegend: true
showTooltip: true
```

#### Bar Chart with Custom Colors

```yaml
name: projects_by_priority
label: Projects by Priority
description: Bar chart showing project distribution by priority level
type: bar
object: projects
xAxisKey: priority
yAxisKeys:
  - count
height: 300
showGrid: true
showLegend: true
showTooltip: true
colors:
  - '#FF6F2C'  # High priority (Orange)
  - '#FFC940'  # Normal priority (Yellow)
  - '#20C933'  # Low priority (Green)
```

#### Multi-Series Area Chart

```yaml
name: tasks_completion
label: Task Completion Trend
description: Track task completion progress over time
type: area
object: tasks
xAxisKey: due_date
yAxisKeys:
  - completed_count
  - total_count
height: 350
showGrid: true
showLegend: true
showTooltip: true
colors:
  - '#20C933'
  - '#2D7FF9'
```

#### Bar Chart with Sorting

```yaml
name: project_budget
label: Project Budget Overview
description: Visualize total budget allocated for each project
type: bar
object: projects
xAxisKey: name
yAxisKeys:
  - budget
height: 400
showGrid: true
showLegend: true
showTooltip: true
sort:
  - - budget
    - desc
```

## 8. Page Definition

Page files define user interface pages or dashboards that display data and visualizations. They use the naming convention `*.page.yml` or `*.page.yaml`.

Similar to Airtable's interface builder, pages allow you to compose various components (charts, tables, forms) into cohesive user experiences.

### 8.1 Root Properties

| Property | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | **Required.** Unique API name of the page. |
| `label` | `string` | Human-readable label for the page. |
| `description` | `string` | Description of the page's purpose. |
| `icon` | `string` | Icon identifier for the page (e.g., `dashboard`, `table`, `chart`). |
| `layout` | `string` | Layout type: `grid`, `flex`, `stack`, or `tabs`. Default: `grid`. |
| `components` | `array` | Array of page components to display. |
| `settings` | `object` | Layout-specific settings (e.g., grid columns, gaps, responsive behavior). |

### 8.2 Page Components

Components are defined as objects with a `type` and optional `props`:

```yaml
components:
  - type: chart
    props:
      chartName: projects_by_status
  - type: table
    props:
      object: projects
      fields:
        - name
        - status
        - priority
```

**Common Component Types:**
- `chart`: Display a chart visualization (requires `chartName` prop)
- `table`: Display a data table (requires `object` prop)
- `form`: Display a data entry form
- `text`: Display static text or markdown content
- `custom`: Custom component implementation

### 8.3 Layout Types

**Grid Layout**: Responsive grid with configurable columns

**Flex Layout**: Flexible box layout for responsive designs

**Stack Layout**: Vertical or horizontal stack of components

**Tabs Layout**: Tabbed interface for organizing multiple views

### 8.4 Example Page Definitions

#### Dashboard with Charts

```yaml
name: projects_dashboard
label: Projects Dashboard
description: Overview of all projects with charts and task tracking
icon: dashboard
layout: grid
components:
  - type: chart
    props:
      chartName: projects_by_status
  - type: chart
    props:
      chartName: projects_by_priority
  - type: chart
    props:
      chartName: project_budget
  - type: chart
    props:
      chartName: tasks_completion
  - type: table
    props:
      object: projects
      fields:
        - name
        - status
        - priority
        - start_date
        - budget
settings:
  gridColumns: 2
  gap: 20
  responsive: true
```

#### Simple Detail Page

```yaml
name: project_detail
label: Project Details
description: Detailed view of a single project
icon: file
layout: stack
components:
  - type: form
    props:
      object: projects
      mode: view
  - type: table
    props:
      object: tasks
      filters:
        - - project
          - =
          - $current.id
settings:
  direction: vertical
  gap: 16
```

#### Tabbed Interface

```yaml
name: project_tabs
label: Project Workspace
description: Tabbed interface for project management
icon: layers
layout: tabs
components:
  - type: tab
    props:
      label: Overview
      children:
        - type: chart
          props:
            chartName: projects_by_status
  - type: tab
    props:
      label: Tasks
      children:
        - type: table
          props:
            object: tasks
  - type: tab
    props:
      label: Budget
      children:
        - type: chart
          props:
            chartName: project_budget
settings:
  defaultTab: 0
  tabPosition: top
```

## 9. Metadata Protection

Similar to Salesforce and other low-code platforms, ObjectQL supports protecting system metadata from modification or deletion. This is crucial for maintaining system integrity when integrating with authentication systems like better-auth.

### 9.1 Object-Level Protection

Objects can be marked as non-customizable using the `customizable` property:

```yaml
name: user
description: System user for authentication
customizable: false  # Prevents modification or deletion of this object
fields:
  email:
    type: email
    required: true
```

When an object is marked as `customizable: false`:
- The object cannot be deleted using `unregister()`
- Attempts to modify the object will throw a validation error
- The object cannot be removed as part of package unregistration

**Use Cases:**
- Authentication objects (user, session, account)
- Core system objects (organization, member)
- Third-party integration objects that must maintain a specific schema

### 9.2 Field-Level Protection

Individual fields can be marked as non-customizable, even within customizable objects:

```yaml
name: user
customizable: true  # Allow adding custom fields
fields:
  email:
    type: email
    customizable: false  # But protect core system field
  createdAt:
    type: datetime
    customizable: false  # Protect audit fields
  updatedAt:
    type: datetime
    customizable: false  # Protect audit fields
  customField:
    type: text
    customizable: true  # Allow modification of custom fields
```

When a field is marked as `customizable: false`:
- The field cannot be modified or deleted
- Field properties (type, validation rules, etc.) cannot be changed
- The field will always appear in the object schema

**Common Protected Fields:**
- `_id` or `id`: Primary key
- `createdAt`: Record creation timestamp
- `updatedAt`: Record update timestamp
- `createdBy`: User who created the record
- `updatedBy`: User who last updated the record

### 9.3 Better-Auth Integration

All better-auth objects are marked as non-customizable to ensure authentication system integrity:

**Protected Objects:**
- `user`: User accounts and authentication
- `account`: OAuth provider accounts
- `session`: Active user sessions
- `verification`: Email/phone verification tokens
- `invitation`: Organization invitations
- `organization`: Multi-tenant organizations
- `member`: Organization memberships

**Example:**
```yaml
# packages/better-auth/src/user.object.yml
name: user
description: System user for authentication
customizable: false
fields:
  email:
    type: string
    unique: true
  password:
    type: string
    hidden: true
  createdAt:
    type: datetime
    customizable: false
  updatedAt:
    type: datetime
    customizable: false
```

### 9.4 Validation API

The MetadataRegistry provides validation methods to check if metadata can be modified:

```typescript
import { MetadataRegistry } from '@objectql/metadata';

const registry = new MetadataRegistry();

// Check if an object can be modified
try {
  registry.validateObjectCustomizable('user');
  // Proceed with modification
} catch (error) {
  // Error: Cannot modify system object 'user'
}

// Check if a field can be modified
try {
  registry.validateFieldCustomizable('user', 'createdAt');
  // Proceed with field modification
} catch (error) {
  // Error: Cannot modify system field 'createdAt' on object 'user'
}
```

### 9.5 Best Practices

1. **System Objects**: Always mark authentication and core system objects as non-customizable
2. **Audit Fields**: Mark timestamp and user tracking fields as non-customizable
3. **Custom Extensions**: Allow users to add custom fields to system objects by keeping the object customizable but protecting core fields
4. **Documentation**: Clearly document which objects and fields are protected and why
5. **Error Messages**: Provide clear error messages when modification attempts are blocked

### 9.6 Default Behavior

**When the `customizable` property is not specified, it defaults to `true` (customizable).**

This means:
- **Objects without `customizable` property**: Can be modified and deleted
- **Fields without `customizable` property**: Can be modified and deleted

**Examples:**

```yaml
# Object without customizable - defaults to true (customizable)
name: my_custom_object
fields:
  title:
    type: text
    # Field without customizable - defaults to true (customizable)
  description:
    type: textarea
    # Field without customizable - defaults to true (customizable)
```

```yaml
# Explicitly marking as non-customizable
name: user
customizable: false  # Must be explicitly set to false to protect
fields:
  email:
    type: email
    customizable: false  # Must be explicitly set to false to protect
  createdAt:
    type: datetime
    customizable: false  # Must be explicitly set to false to protect
  customField:
    type: text
    # No customizable property - defaults to true (customizable)
```

This default behavior ensures:
1. **Backward Compatibility**: Existing objects and fields without the `customizable` property continue to work as before
2. **Opt-in Protection**: System objects and fields must explicitly opt-in to protection by setting `customizable: false`
3. **Safe Defaults**: User-defined metadata is customizable by default, only system metadata needs protection


