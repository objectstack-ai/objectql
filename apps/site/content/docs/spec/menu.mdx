# Menu Definition

Menus define the navigation structure and organization of your application. They control how users access pages, objects, and features through a hierarchical menu system.

**File Naming Convention:** `<menu_name>.menu.yml`

The filename (without the `.menu.yml` extension) automatically becomes the menu's identifier. This eliminates the need for a redundant `name` property inside the file.

**Examples:**
- `main_menu.menu.yml` → Menu identifier: `main_menu`
- `admin_menu.menu.yml` → Menu identifier: `admin_menu`
- `user_profile.menu.yml` → Menu identifier: `user_profile`

Files should use **snake_case** for multi-word names.

## 1. Root Properties

| Property | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `label` | `string` | **Required** | Human-readable menu title. |
| `type` | `string` | Optional | Menu type: `main`, `sidebar`, `dropdown`, `toolbar`, `context`. Default: `main`. |
| `description` | `string` | Optional | Internal description of menu purpose. |
| `icon` | `string` | Optional | Icon identifier for the menu. |
| `items` | `array` | **Required** | Menu items and structure. |
| `position` | `string` | Optional | Menu placement: `top`, `left`, `right`. |
| `collapsible` | `boolean` | Optional | Whether menu can be collapsed. |
| `default_collapsed` | `boolean` | Optional | Initial collapse state. |
| `permissions` | `object` | Optional | Access control for the menu. |
| `ai_context` | `object` | Optional | AI-friendly context. |

## 2. Menu Types

### 2.1 Main Navigation Menu

Primary application navigation.

```yaml
# File: main_menu.menu.yml

label: Main Navigation
type: main
position: left

items:
  # Dashboard
  - label: Dashboard
    icon: standard:home
    path: /dashboard
    
  # CRM Section
  - label: CRM
    icon: standard:account
    items:
      - label: Accounts
        icon: standard:account
        object: account
        path: /accounts
      
      - label: Contacts
        icon: standard:contact
        object: contact
        path: /contacts
      
      - label: Opportunities
        icon: standard:opportunity
        object: opportunity
        path: /opportunities
      
      - separator: true
      
      - label: Reports
        icon: standard:reports
        items:
          - label: Sales Pipeline
            path: /reports/sales_pipeline
          
          - label: Win/Loss Analysis
            path: /reports/win_loss
  
  # Projects Section
  - label: Projects
    icon: standard:project
    items:
      - label: All Projects
        object: project
        path: /projects
      
      - label: My Projects
        path: /projects/my
      
      - label: Project Templates
        path: /projects/templates
  
  # Settings
  - label: Settings
    icon: standard:settings
    path: /settings
    permissions:
      view: [admin]

ai_context:
  intent: "Main application navigation menu"
  domain: application
```

### 2.2 Sidebar Menu

Contextual sidebar navigation.

```yaml
# File: admin_sidebar.menu.yml

label: Administration
type: sidebar
position: left
collapsible: true

items:
  # User Management
  - label: Users & Access
    icon: standard:user
    items:
      - label: Users
        object: user
        path: /admin/users
      
      - label: Roles
        object: role
        path: /admin/roles
      
      - label: Permission Sets
        object: permission_set
        path: /admin/permissions
  
  # Data Management
  - label: Data Management
    icon: standard:data
    items:
      - label: Objects
        path: /admin/objects
      
      - label: Fields
        path: /admin/fields
      
      - label: Relationships
        path: /admin/relationships
      
      - separator: true
      
      - label: Import Data
        path: /admin/import
      
      - label: Export Data
        path: /admin/export
  
  # System Configuration
  - label: System
    icon: standard:settings
    items:
      - label: Company Settings
        path: /admin/company
      
      - label: Email Configuration
        path: /admin/email
      
      - label: Integrations
        path: /admin/integrations
      
      - label: API Keys
        path: /admin/api_keys

permissions:
  view: [admin, system_admin]

ai_context:
  intent: "Administrative configuration and management menu"
  domain: administration
```

### 2.3 Dropdown Menu

User actions or context menu.

```yaml
# File: user_profile.menu.yml

label: User Profile
type: dropdown
trigger: avatar # What triggers the dropdown

items:
  # User info (non-clickable header)
  - type: header
    label: $current_user.name
    subtitle: $current_user.email
  
  - separator: true
  
  # Profile actions
  - label: My Profile
    icon: standard:user
    path: /profile
  
  - label: Account Settings
    icon: standard:settings
    path: /settings/account
  
  - label: Preferences
    icon: standard:preferences
    path: /settings/preferences
  
  - separator: true
  
  # Quick actions
  - label: Switch Organization
    icon: standard:organization
    action: switch_org
  
  - label: Help & Support
    icon: standard:help
    path: /help
  
  - separator: true
  
  # Logout
  - label: Logout
    icon: standard:logout
    action: logout
    style: danger

ai_context:
  intent: "User profile dropdown with account actions"
  domain: user_interface
```

### 2.4 Context Menu

Right-click or action menu.

```yaml
# File: record_actions.menu.yml

label: Record Actions
type: context
description: Context menu for record operations

items:
  # View/Edit
  - label: View Details
    icon: standard:view
    action: view_record
  
  - label: Edit
    icon: standard:edit
    action: edit_record
    permission: update
  
  - separator: true
  
  # Record actions
  - label: Clone
    icon: standard:copy
    action: clone_record
    permission: create
  
  - label: Share
    icon: standard:share
    action: share_record
  
  - separator: true
  
  # Advanced actions
  - label: Export
    icon: standard:export
    items:
      - label: Export as PDF
        action: export_pdf
      
      - label: Export as Excel
        action: export_excel
  
  - separator: true
  
  # Delete
  - label: Delete
    icon: standard:delete
    action: delete_record
    permission: delete
    confirm: Are you sure you want to delete this record?
    style: danger

ai_context:
  intent: "Context menu for record-level operations"
  domain: user_interface
```

### 2.5 Toolbar Menu

Quick action toolbar.

```yaml
# File: list_toolbar.menu.yml

label: List Toolbar
type: toolbar
position: top

items:
  # Create button
  - label: New
    icon: standard:add
    action: create_record
    variant: primary
    permission: create
  
  # Bulk actions
  - label: Actions
    icon: standard:actions
    type: dropdown
    items:
      - label: Bulk Edit
        action: bulk_edit
      
      - label: Bulk Delete
        action: bulk_delete
        confirm: Delete selected records?
      
      - label: Export Selected
        action: export_selected
  
  # View options
  - label: View
    icon: standard:view
    type: dropdown
    items:
      - label: List View
        action: set_view_type
        value: list
        checked: true
      
      - label: Kanban View
        action: set_view_type
        value: kanban
      
      - label: Calendar View
        action: set_view_type
        value: calendar
  
  # Filters
  - label: Filter
    icon: standard:filter
    action: show_filters
    badge: 2 # Show active filter count
  
  # Refresh
  - icon: standard:refresh
    action: refresh
    tooltip: Refresh data

ai_context:
  intent: "Toolbar with quick actions for list views"
  domain: user_interface
```

## 3. Menu Items

### 3.1 Basic Link Item

```yaml
items:
  - label: Dashboard
    icon: standard:home
    path: /dashboard
    
  - label: Customers
    icon: standard:account
    object: customer
    path: /customers
```

### 3.2 Item with Submenu

```yaml
items:
  - label: Sales
    icon: standard:opportunity
    items:
      - label: Opportunities
        path: /opportunities
      
      - label: Quotes
        path: /quotes
      
      - label: Orders
        path: /orders
```

### 3.3 Action Item

```yaml
items:
  - label: Create Record
    icon: standard:add
    action: create_record
    params:
      object: customer
  
  - label: Run Report
    icon: standard:report
    action: run_report
    params:
      report_id: sales_summary
```

### 3.4 Separator

```yaml
items:
  - label: Item 1
    path: /item1
  
  - separator: true
  
  - label: Item 2
    path: /item2
```

### 3.5 Header

```yaml
items:
  - type: header
    label: Recent Items
  
  - label: Recent Item 1
    path: /items/1
  
  - label: Recent Item 2
    path: /items/2
```

### 3.6 Dynamic Items

```yaml
items:
  # Static item
  - label: All Projects
    path: /projects
  
  # Dynamic items from database
  - type: dynamic
    label: Recent Projects
    source:
      object: project
      filters:
        - field: owner_id
          operator: "="
          value: $current_user.id
      sort:
        - field: modified_at
          direction: desc
      limit: 5
    template:
      label: $record.name
      path: /projects/$record.id
      icon: standard:project
```

## 4. Item Properties

### 4.1 Core Properties

```yaml
- label: Menu Item        # Display text
  icon: standard:home     # Icon
  path: /home            # Navigation path
  badge: 5               # Badge count
  tooltip: Tooltip text  # Hover text
```

### 4.2 Appearance

```yaml
- label: Delete
  icon: standard:delete
  style: danger         # primary, secondary, success, danger, warning
  variant: outline      # solid, outline, ghost
  size: medium          # small, medium, large
```

### 4.3 State

```yaml
- label: Option 1
  checked: true         # Checkbox/radio state
  disabled: false       # Disabled state
  active: true          # Active/selected state
  loading: false        # Loading state
```

### 4.4 Behavior

```yaml
- label: Item
  path: /path
  target: _blank        # Link target
  external: true        # External link
  download: true        # Trigger download
```

## 5. Permissions

Control menu visibility based on user permissions.

### 5.1 Role-Based

```yaml
items:
  - label: Admin Panel
    path: /admin
    permissions:
      view: [admin, system_admin]
  
  - label: Reports
    path: /reports
    permissions:
      view: [admin, manager, analyst]
```

### 5.2 Object-Based

```yaml
items:
  - label: Customers
    object: customer
    path: /customers
    permissions:
      object: customer
      operation: read
```

### 5.3 Dynamic Permissions

```yaml
items:
  - label: Sensitive Data
    path: /sensitive
    permissions:
      condition:
        field: $current_user.clearance_level
        operator: ">="
        value: 3
```

## 6. Styling and Theming

### 6.1 Menu Styling

```yaml
# Menu-level styling
style:
  background: white
  color: text-primary
  border: true
  shadow: true
  rounded: true
  width: 250 # pixels

# Item styling
items:
  - label: Item
    style:
      background: blue-500
      color: white
      padding: 8
      margin: 4
```

### 6.2 Active State

```yaml
active_style:
  background: blue-100
  color: blue-700
  border_left: 3px solid blue-700
  font_weight: bold
```

### 6.3 Hover State

```yaml
hover_style:
  background: gray-100
  color: gray-900
```

## 7. Complete Examples

### Example 1: Application Main Menu

```yaml
# File: app_main_menu.menu.yml

label: Application Menu
type: main
position: left
collapsible: true
default_collapsed: false

style:
  width: 260
  background: white
  shadow: true

items:
  # Dashboard
  - label: Dashboard
    icon: standard:home
    path: /
    exact: true # Only active on exact match
  
  # Sales Section
  - type: header
    label: SALES
  
  - label: Leads
    icon: standard:lead
    object: lead
    path: /leads
    badge: $count.leads_unqualified
  
  - label: Opportunities
    icon: standard:opportunity
    object: opportunity
    path: /opportunities
  
  - label: Accounts
    icon: standard:account
    object: account
    path: /accounts
  
  - label: Contacts
    icon: standard:contact
    object: contact
    path: /contacts
  
  # Marketing Section
  - type: header
    label: MARKETING
  
  - label: Campaigns
    icon: standard:campaign
    object: campaign
    path: /campaigns
  
  - label: Email Templates
    icon: standard:email
    path: /email_templates
  
  # Service Section
  - type: header
    label: SERVICE
  
  - label: Cases
    icon: standard:case
    object: case
    path: /cases
    badge: $count.cases_open
    badge_style: danger
  
  - label: Knowledge Base
    icon: standard:knowledge
    path: /knowledge
  
  # Separator
  - separator: true
  
  # Analytics
  - label: Reports & Dashboards
    icon: standard:reports
    items:
      - label: Sales Reports
        path: /reports/sales
      
      - label: Service Reports
        path: /reports/service
      
      - separator: true
      
      - label: Dashboards
        path: /dashboards
  
  # Separator
  - separator: true
  
  # Admin (conditional)
  - label: Setup
    icon: standard:settings
    path: /setup
    permissions:
      view: [admin]

ai_context:
  intent: "Main navigation for CRM application"
  domain: crm
```

### Example 2: Record Detail Actions Menu

```yaml
# File: opportunity_actions.menu.yml

label: Opportunity Actions
type: dropdown
description: Actions available on opportunity records

items:
  # Quick actions
  - label: Edit
    icon: standard:edit
    action: edit_record
    keyboard_shortcut: e
  
  - label: Clone
    icon: standard:copy
    action: clone_record
  
  - label: Share
    icon: standard:share
    action: share_record
  
  - separator: true
  
  # Stage progression
  - label: Advance Stage
    icon: standard:forward
    action: advance_stage
    disabled_when:
      field: stage
      operator: "="
      value: closed_won
  
  - label: Mark as Won
    icon: standard:success
    action: mark_won
    style: success
  
  - label: Mark as Lost
    icon: standard:close
    action: mark_lost
    style: danger
  
  - separator: true
  
  # Related actions
  - label: Create Quote
    icon: standard:quote
    action: create_related
    params:
      object: quote
  
  - label: Schedule Meeting
    icon: standard:event
    action: create_related
    params:
      object: event
  
  - separator: true
  
  # Export
  - label: Export
    icon: standard:export
    items:
      - label: PDF Summary
        action: export_pdf
      
      - label: Excel Details
        action: export_excel
  
  - separator: true
  
  # Delete
  - label: Delete
    icon: standard:delete
    action: delete_record
    style: danger
    confirm: Delete this opportunity?
    permission: delete

ai_context:
  intent: "Contextual actions for opportunity records"
  domain: sales
```

### Example 3: Quick Create Menu

```yaml
# File: quick_create.menu.yml

label: Create New
type: dropdown
description: Quick create menu for common objects

trigger:
  type: button
  icon: standard:add
  label: New
  variant: primary

items:
  # Frequently used
  - type: header
    label: QUICK CREATE
  
  - label: Lead
    icon: standard:lead
    action: create_record
    params:
      object: lead
    keyboard_shortcut: "cmd+shift+l"
  
  - label: Contact
    icon: standard:contact
    action: create_record
    params:
      object: contact
    keyboard_shortcut: "cmd+shift+c"
  
  - label: Opportunity
    icon: standard:opportunity
    action: create_record
    params:
      object: opportunity
    keyboard_shortcut: "cmd+shift+o"
  
  - label: Task
    icon: standard:task
    action: create_record
    params:
      object: task
      defaults:
        assignee_id: $current_user.id
        due_date: $tomorrow
    keyboard_shortcut: "cmd+shift+t"
  
  - separator: true
  
  # More options
  - label: More...
    icon: standard:more
    items:
      - label: Account
        icon: standard:account
        action: create_record
        params:
          object: account
      
      - label: Case
        icon: standard:case
        action: create_record
        params:
          object: case
      
      - label: Campaign
        icon: standard:campaign
        action: create_record
        params:
          object: campaign

ai_context:
  intent: "Quick access to create common records"
  domain: productivity
```

## 8. Best Practices

### 8.1 Organization

- **Logical grouping**: Group related items together
- **Limit depth**: Keep menu hierarchy shallow (max 3 levels)
- **Use separators**: Visually separate different groups
- **Meaningful labels**: Use clear, descriptive labels

### 8.2 Performance

- **Lazy load**: Load submenu items on demand
- **Cache permissions**: Cache permission checks
- **Optimize queries**: Efficient database queries for dynamic items
- **Debounce search**: Debounce search in large menus

### 8.3 Usability

- **Keyboard shortcuts**: Support keyboard navigation
- **Search functionality**: Add search for large menus
- **Highlight active**: Clearly show current location
- **Responsive design**: Adapt to different screen sizes

### 8.4 Accessibility

- **ARIA labels**: Use proper ARIA attributes
- **Keyboard navigation**: Full keyboard support
- **Focus management**: Proper focus handling
- **Screen reader**: Ensure screen reader compatibility

## 9. Integration with Other Metadata

Menus integrate with:

- **Pages**: Navigate to page definitions
- **Objects**: Link to object list/detail pages
- **Actions**: Trigger custom actions
- **Permissions**: Respect access control
- **Apps**: Organize by application context

## 10. Dynamic Menu Generation

```yaml
items:
  # Generate menu from app definitions
  - type: dynamic
    source: apps
    template:
      label: $app.label
      icon: $app.icon
      items:
        type: dynamic
        source: $app.objects
        template:
          label: $object.label_plural
          icon: $object.icon
          path: /objects/$object.name
```

## See Also

- [Pages](./page.md) - UI page definitions
- [Apps](./app.md) - Application definitions
- [Permissions](./permission.md) - Access control
- [Actions](./action.md) - Custom actions
