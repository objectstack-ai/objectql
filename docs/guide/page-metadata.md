# Page Metadata Guide

Page metadata in ObjectQL allows you to define custom UI pages declaratively using YAML files. This approach is inspired by low-code platforms like Airtable, Retool, and Appsmith, making it easy to create rich, data-driven interfaces without writing custom frontend code.

## Overview

Pages are the visual interface layer in ObjectQL applications. They define how data is displayed, how users interact with it, and how components are arranged on the screen.

### Key Features

- **Declarative Configuration**: Define pages using simple YAML files
- **Multiple Layout Types**: Support for various layouts (dashboard, forms, wizards, etc.)
- **Component-Based**: Compose pages from reusable components
- **Data Binding**: Connect components to ObjectQL data sources
- **Responsive Design**: Built-in responsive configuration
- **Access Control**: Fine-grained permission management
- **AI-Ready**: AI context for intelligent page generation

## Quick Start

Create a new page by adding a `*.page.yml` file to your project:

```yaml
# src/dashboard.page.yml
name: dashboard
label: Project Dashboard
description: Overview of projects and tasks
icon: dashboard
layout: dashboard

components:
  - id: total_projects
    type: metric
    label: Total Projects
    data_source:
      object: projects
      query:
        op: count
    grid:
      x: 0
      y: 0
      w: 3
      h: 2
  
  - id: recent_tasks
    type: data_grid
    label: Recent Tasks
    data_source:
      object: tasks
      fields: ['name', 'status', 'due_date']
      sort: [['created_at', 'desc']]
      limit: 10
    grid:
      x: 0
      y: 2
      w: 12
      h: 6
```

## Page Configuration

### Basic Structure

Every page must have these core properties:

```yaml
name: page_identifier        # Unique identifier
label: Display Name          # Human-readable name
layout: single_column        # Layout type
```

### Layout Types

ObjectQL supports multiple layout types for different use cases:

#### 1. Single Column Layout
```yaml
layout: single_column
components:
  - id: header
    type: text
    label: Welcome
  - id: data_table
    type: data_grid
    data_source:
      object: tasks
```

Best for: Simple forms, lists, detail views

#### 2. Two Column Layout
```yaml
layout: two_column
sections:
  - id: main_content
    type: content
    style:
      width: 70%
    components:
      - id: edit_form
        type: form
        # ...
  
  - id: sidebar
    type: sidebar
    style:
      width: 30%
    components:
      - id: stats
        type: metric
        # ...
```

Best for: Detail pages with sidebar, master-detail views

#### 3. Dashboard Layout
```yaml
layout: dashboard
components:
  - id: metric_1
    type: metric
    grid:
      x: 0    # Grid column (0-11)
      y: 0    # Grid row
      w: 3    # Width (grid units)
      h: 2    # Height (grid units)
  
  - id: chart_1
    type: chart
    grid:
      x: 3
      y: 0
      w: 6
      h: 4
```

Best for: Dashboards, KPI displays, analytics pages

#### 4. Wizard Layout
```yaml
layout: wizard
components:
  - id: step_1
    type: container
    label: Basic Info
    config:
      step: 1
    components:
      - id: form_1
        type: form
        # ...
  
  - id: step_2
    type: container
    label: Details
    config:
      step: 2
    components:
      - id: form_2
        type: form
        # ...
```

Best for: Multi-step processes, onboarding, complex forms

#### 5. Canvas Layout
```yaml
layout: canvas
components:
  - id: hero
    type: container
    style:
      position: absolute
      top: 0
      left: 0
      width: 100%
      height: 400px
    # ...
```

Best for: Landing pages, custom layouts

#### 6. Tabs Layout
```yaml
layout: tabs
components:
  - id: tab_1
    type: container
    label: Overview
    components:
      # Tab content
  
  - id: tab_2
    type: container
    label: Details
    components:
      # Tab content
```

Best for: Organizing related content

## Components

### Component Types

ObjectQL provides a rich set of built-in component types:

#### Data Display Components

**Data Grid**
```yaml
- id: tasks_grid
  type: data_grid
  label: Tasks
  data_source:
    object: tasks
    fields: ['name', 'status', 'priority', 'due_date']
    sort: [['created_at', 'desc']]
  config:
    columns:
      - field: name
        label: Task Name
        width: 300
      - field: status
        label: Status
        badge: true
    row_actions:
      - label: Edit
        action: edit_task
    enable_search: true
    enable_filters: true
```

**Detail View**
```yaml
- id: project_detail
  type: detail_view
  label: Project Details
  data_source:
    object: projects
    query:
      op: findOne
      filter: [['_id', '=', '{{route.params.id}}']]
  config:
    mode: readonly
    sections:
      - label: Basic Info
        fields: ['name', 'description', 'status']
      - label: Timeline
        fields: ['start_date', 'end_date']
```

**Metric/KPI**
```yaml
- id: total_count
  type: metric
  label: Total Projects
  data_source:
    object: projects
    query:
      op: count
  config:
    format: number
    icon: folder
    color: blue
```

**Chart**
```yaml
- id: status_chart
  type: chart
  label: Projects by Status
  data_source:
    object: projects
    fields: ['status']
    query:
      op: group_by
      field: status
      aggregate: count
  config:
    chart_type: pie
    colors: ['#10b981', '#3b82f6', '#f59e0b']
```

#### Data Input Components

**Form**
```yaml
- id: edit_form
  type: form
  label: Edit Project
  data_source:
    object: projects
  config:
    mode: edit  # create, edit, or view
    layout: vertical
    fields:
      - name: name
        label: Project Name
        type: text
        required: true
      - name: description
        label: Description
        type: textarea
      - name: status
        label: Status
        type: select
    field_layout:
      - row: [name]
      - row: [description]
      - row: [status]
  actions:
    on_submit:
      type: run_action
      object: projects
      action: update
      success_message: Project updated
```

**Button**
```yaml
- id: submit_btn
  type: button
  label: Submit
  config:
    variant: primary
    icon: check
  actions:
    on_click:
      type: submit_form
      success_message: Submitted successfully
```

#### Layout Components

**Container**
```yaml
- id: section_1
  type: container
  label: Section Title
  components:
    - id: child_1
      type: text
      # ...
```

**Tabs**
```yaml
- id: tabs_container
  type: tabs
  components:
    - id: tab_1
      type: container
      label: Tab 1
      components: [...]
    - id: tab_2
      type: container
      label: Tab 2
      components: [...]
```

#### Content Components

**Text**
```yaml
- id: welcome_text
  type: text
  config:
    content: |
      # Welcome to ObjectQL
      This is a markdown-formatted text component.
    format: markdown
  style:
    padding: 20px
```

**Image**
```yaml
- id: logo
  type: image
  config:
    src: /assets/logo.png
    alt: Company Logo
  style:
    width: 200px
```

**Divider**
```yaml
- id: separator
  type: divider
  style:
    margin: 20px 0
```

## Data Sources

Components can connect to ObjectQL data sources:

### Basic Query
```yaml
data_source:
  object: projects
  fields: ['name', 'status', 'owner']
  sort: [['created_at', 'desc']]
  limit: 10
```

### Filtered Query
```yaml
data_source:
  object: tasks
  fields: ['name', 'due_date']
  filters:
    - ['status', '=', 'active']
    - 'and'
    - ['assigned_to', '=', '{{current_user.id}}']
```

### With Relationships
```yaml
data_source:
  object: tasks
  fields: ['name', 'status']
  expand:
    project:
      fields: ['name']
    assigned_to:
      fields: ['name', 'email']
```

### Aggregations
```yaml
data_source:
  object: projects
  query:
    op: count
```

```yaml
data_source:
  object: tasks
  query:
    op: group_by
    field: status
    aggregate: count
```

## Actions

Components can trigger actions in response to user interactions:

### Navigation
```yaml
actions:
  on_click:
    type: navigate
    path: /projects/{{id}}
```

### Modal
```yaml
actions:
  on_click:
    type: open_modal
    modal: edit_project_modal
```

### Execute Action
```yaml
actions:
  on_click:
    type: run_action
    object: projects
    action: archive
    confirm: Archive this project?
    success_message: Project archived
```

### Form Submission
```yaml
actions:
  on_submit:
    type: submit_form
    success_message: Form submitted
    on_error: show_toast
```

### Refresh Data
```yaml
actions:
  on_load:
    type: refresh
```

### Custom Handler
```yaml
actions:
  on_click:
    type: custom
    handler: myCustomHandler
```

## Styling

Components support flexible styling:

```yaml
style:
  width: 100%
  height: 400px
  background: '#f7fafc'
  padding: 20px
  margin: 10px 0
  border_radius: 8px
  class_name: custom-class
  custom_css:
    box-shadow: 0 2px 4px rgba(0,0,0,0.1)
```

## Responsive Design

Configure responsive behavior for different screen sizes:

### Page-Level
```yaml
responsive:
  mobile:
    columns: 1
  tablet:
    columns: 2
  desktop:
    columns: 3
```

### Component-Level
```yaml
components:
  - id: responsive_grid
    type: data_grid
    responsive:
      mobile:
        visible: true
        columns: 1
      tablet:
        visible: true
        columns: 2
      desktop:
        visible: true
        columns: 3
```

## Access Control

Define permissions for pages and components:

### Page Permissions
```yaml
permissions:
  view: ['admin', 'manager', 'user']
  edit: ['admin', 'manager']
```

### Component Visibility
```yaml
components:
  - id: admin_only
    type: button
    label: Delete
    permissions: ['admin']
    visible_when:
      role: admin
```

## State Management

Pages can maintain state:

```yaml
state:
  initial:
    current_tab: 0
    selected_items: []
    filter_value: ''
  persist: true
  storage_key: my_page_state
```

## AI Context

Provide context for AI-powered features:

```yaml
ai_context:
  intent: Manage project tasks and track progress
  persona: Project managers and team members
  tasks:
    - View all tasks
    - Create new tasks
    - Update task status
    - Assign tasks to team members
```

## Real-time Updates

Enable real-time data updates:

```yaml
realtime: true
refresh_interval: 30  # seconds
```

## SEO & Metadata

Configure SEO metadata:

```yaml
meta:
  title: Project Dashboard - My App
  description: Manage your projects and tasks
  keywords: ['projects', 'tasks', 'dashboard']
```

## Examples

### Complete Dashboard Example

See `examples/starters/basic-script/src/dashboard.page.yml` for a full dashboard implementation.

### Form Page Example

See `examples/starters/basic-script/src/project_detail.page.yml` for a two-column detail page with forms.

### Wizard Example

See `examples/starters/basic-script/src/create_project_wizard.page.yml` for a multi-step wizard.

### Canvas Layout Example

See `examples/starters/basic-script/src/landing.page.yml` for a custom landing page.

## Integration with Navigation

Pages can be referenced in application navigation:

```yaml
# app.yml
navigation:
  - type: page
    name: dashboard
    label: Dashboard
    icon: dashboard
    path: /dashboard
```

## Best Practices

1. **Keep It Simple**: Start with simple layouts and add complexity as needed
2. **Reuse Components**: Use containers to create reusable component groups
3. **Data Binding**: Use `{{}}` syntax to bind dynamic values
4. **Responsive First**: Always consider mobile layouts
5. **Test Permissions**: Verify access control for sensitive pages
6. **AI Context**: Provide clear AI context for better code generation
7. **Naming Convention**: Use descriptive component IDs (e.g., `tasks_grid` not `grid1`)

## Next Steps

- Learn about [Application Configuration](./application.md)
- Explore [Data Modeling](./data-modeling.md)
- Read about [Actions](./logic-actions.md)
- Check [Validation Rules](./validation.md)
