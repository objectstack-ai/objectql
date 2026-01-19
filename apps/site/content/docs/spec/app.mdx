# Application Definition

Applications define high-level containers for organizing related functionality, objects, and features. They provide logical grouping, navigation structure, and branding for distinct areas of your system.

**File Naming Convention:** `<app_name>.app.yml`

The filename (without the `.app.yml` extension) automatically becomes the application's identifier. This eliminates the need for a redundant `name` property inside the file.

**Examples:**
- `crm.app.yml` → Application identifier: `crm`
- `sales.app.yml` → Application identifier: `sales`
- `hr_management.app.yml` → Application identifier: `hr_management`

Files should use **snake_case** for multi-word names.

## 1. Root Properties

| Property | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `label` | `string` | **Required** | Human-readable application name (e.g., "Customer Relationship Management"). |
| `description` | `string` | Optional | Brief description of the application's purpose. |
| `icon` | `string` | Optional | Icon identifier for the app launcher. |
| `logo` | `string` | Optional | URL or path to custom logo image. |
| `color` | `string` | Optional | Brand color for the app (hex code). |
| `homepage` | `string` | Optional | Default landing page path when app is opened. |
| `objects` | `array` | Optional | Objects that belong to this application. |
| `menus` | `array` | Optional | Navigation menus for this application. |
| `pages` | `array` | Optional | Pages associated with this application. |
| `sort_order` | `number` | Optional | Sort order in app launcher (lower = first). |
| `is_active` | `boolean` | Optional | Whether the app is visible to users. Default: `true`. |
| `permissions` | `object` | Optional | Access control for the application. |
| `features` | `object` | Optional | Feature flags and configuration. |
| `settings` | `object` | Optional | Application-specific settings. |
| `ai_context` | `object` | Optional | AI-friendly context for understanding app purpose. |

## 2. Basic Application Definition

### 2.1 Minimal Application

```yaml
# File: crm.app.yml

label: Customer Relationship Management
description: Manage customer relationships, sales pipeline, and opportunities
icon: standard:account
homepage: /crm/dashboard
```

### 2.2 Complete Application

```yaml
# File: sales.app.yml

label: Sales Management
description: Complete sales lifecycle management from lead to close
icon: standard:opportunity
logo: /assets/sales-logo.png
color: "#3498db"
homepage: /sales/dashboard

# Objects included in this app
objects:
  - lead
  - opportunity
  - account
  - contact
  - quote
  - order

# Navigation menus
menus:
  - sales_main_menu
  - sales_actions_menu

# Key pages
pages:
  - sales_dashboard
  - pipeline_view
  - forecast_view

# Sort order in app launcher
sort_order: 10

# Active state
is_active: true

# Access control
permissions:
  view: [sales_rep, sales_manager, admin]
  configure: [sales_manager, admin]

# Application features
features:
  forecasting:
    enabled: true
    settings:
      forecast_periods: [monthly, quarterly]
  
  territory_management:
    enabled: true
  
  pipeline_analytics:
    enabled: true

# Application settings
settings:
  currency: USD
  fiscal_year_start: january
  quota_period: quarterly
  
  stages:
    - prospecting
    - qualification
    - proposal
    - negotiation
    - closed_won
    - closed_lost

ai_context:
  intent: "Complete sales lifecycle management application"
  domain: sales
  key_features:
    - "Lead management and qualification"
    - "Opportunity pipeline tracking"
    - "Sales forecasting"
    - "Quote and order generation"
```

## 3. Application Components

### 3.1 Objects

Define which objects belong to this application.

```yaml
# File: hr.app.yml

label: Human Resources
icon: standard:people

# Objects in this app
objects:
  - employee
  - department
  - position
  - leave_request
  - performance_review
  - training_program

# Object grouping
object_groups:
  - label: Employee Management
    objects:
      - employee
      - department
      - position
  
  - label: Leave & Attendance
    objects:
      - leave_request
      - attendance_record
  
  - label: Performance
    objects:
      - performance_review
      - goal
```

### 3.2 Menus

Define navigation structure for the application.

```yaml
menus:
  # Main navigation menu
  - id: crm_main_menu
    type: main
    position: left
  
  # Quick actions menu
  - id: crm_quick_actions
    type: toolbar
    position: top
  
  # Admin menu (conditional)
  - id: crm_admin_menu
    type: sidebar
    permissions:
      view: [admin]
```

### 3.3 Pages and Dashboards

```yaml
pages:
  # Dashboard
  - id: sales_dashboard
    label: Sales Dashboard
    type: dashboard
    is_default: true
  
  # List pages
  - id: opportunity_list
    label: Opportunities
    type: list
  
  # Detail pages
  - id: account_detail
    label: Account Details
    type: detail
  
  # Custom pages
  - id: forecast_view
    label: Sales Forecast
    type: custom
```

## 4. Multi-App Organization

### 4.1 App Grouping

Organize multiple related apps.

```yaml
# File: suite.app.yml

label: Business Suite
description: Complete business management suite
type: suite

# Child applications
apps:
  - crm
  - sales
  - service
  - marketing

# Shared resources
shared:
  objects:
    - user
    - account
    - contact
  
  menus:
    - main_navigation
```

### 4.2 App Dependencies

```yaml
# File: service.app.yml

label: Customer Service
icon: standard:case

# Dependencies on other apps
dependencies:
  - crm  # Requires CRM app for accounts/contacts
  
  # Shared objects from CRM
  shared_from:
    crm:
      - account
      - contact

# Service-specific objects
objects:
  - case
  - knowledge_article
  - service_contract
```

## 5. Permissions and Access Control

### 5.1 App-Level Permissions

```yaml
permissions:
  # Who can view this app
  view: [sales_rep, sales_manager, admin]
  
  # Who can configure app settings
  configure: [sales_manager, admin]
  
  # Who can access admin features
  admin: [admin]

# Permission sets
permission_sets:
  - name: sales_user
    grants:
      view: true
      create_records: true
      edit_own_records: true
  
  - name: sales_manager
    grants:
      view: true
      create_records: true
      edit_all_records: true
      delete_records: true
      configure: true
```

### 5.2 Feature-Based Access

```yaml
features:
  forecasting:
    enabled: true
    permissions:
      access: [sales_manager, admin]
  
  advanced_reporting:
    enabled: true
    permissions:
      access: [analyst, sales_manager, admin]
  
  data_export:
    enabled: true
    permissions:
      access: [admin]
```

## 6. Application Settings

### 6.1 Business Configuration

```yaml
settings:
  # Locale settings
  locale:
    currency: USD
    date_format: MM/DD/YYYY
    timezone: America/New_York
  
  # Business calendar
  fiscal_year_start: january
  business_hours:
    start: "09:00"
    end: "17:00"
    timezone: America/New_York
  
  # Workflow settings
  approvals:
    required_for_high_value: true
    high_value_threshold: 50000
  
  # Notification settings
  notifications:
    email_enabled: true
    slack_enabled: true
    mobile_push_enabled: true
```

### 6.2 Integration Settings

```yaml
settings:
  integrations:
    # Email integration
    email:
      provider: gmail
      sync_enabled: true
      sync_interval: 300 # seconds
    
    # Calendar integration
    calendar:
      provider: google_calendar
      sync_events: true
    
    # Third-party apps
    external:
      salesforce:
        enabled: true
        sync_direction: bidirectional
      
      slack:
        enabled: true
        channels:
          - sales-team
          - deals
```

## 7. Feature Flags

Control application features dynamically.

```yaml
features:
  # AI-powered features
  ai_assistant:
    enabled: true
    settings:
      model: gpt-4
      suggestions_enabled: true
  
  # Analytics
  advanced_analytics:
    enabled: true
    settings:
      retention_days: 90
  
  # Mobile app
  mobile_app:
    enabled: true
    platforms: [ios, android]
  
  # Experimental features
  beta_features:
    enabled: false
    available_to: [admin]
```

## 8. Complete Examples

### Example 1: CRM Application

```yaml
# File: crm.app.yml

label: Customer Relationship Management
description: Unified platform for managing customer relationships and sales
icon: standard:account
logo: /assets/crm-logo.png
color: "#2ecc71"
homepage: /crm/dashboard

# Core objects
objects:
  - account
  - contact
  - lead
  - opportunity

# Object grouping
object_groups:
  - label: Customers
    objects: [account, contact]
  
  - label: Sales Pipeline
    objects: [lead, opportunity]

# Navigation
menus:
  - crm_main_menu
  - crm_quick_create

# Key pages
pages:
  - crm_dashboard
  - sales_pipeline
  - account_360_view

# Permissions
permissions:
  view: [sales_rep, sales_manager, admin]
  configure: [sales_manager, admin]

# Features
features:
  lead_scoring:
    enabled: true
    settings:
      model: engagement_based
  
  duplicate_detection:
    enabled: true
  
  email_tracking:
    enabled: true

# Settings
settings:
  locale:
    currency: USD
    timezone: America/New_York
  
  sales_process:
    stages: [prospecting, qualification, proposal, negotiation, closed]
    required_fields_by_stage:
      qualification: [budget, timeline, decision_maker]
      proposal: [quote_sent_date, proposal_document]

sort_order: 1
is_active: true

ai_context:
  intent: "Comprehensive CRM for managing customer relationships and sales pipeline"
  domain: crm
  key_workflows:
    - "Lead capture and qualification"
    - "Opportunity management"
    - "Account relationship tracking"
```

### Example 2: Project Management Application

```yaml
# File: project_management.app.yml

label: Project Management
description: Plan, track, and deliver projects on time
icon: standard:project
color: "#9b59b6"
homepage: /projects/dashboard

objects:
  - project
  - task
  - milestone
  - project_resource
  - time_entry

object_groups:
  - label: Planning
    objects: [project, milestone]
  
  - label: Execution
    objects: [task, time_entry]
  
  - label: Resources
    objects: [project_resource]

menus:
  - projects_main_menu
  - project_actions_menu

pages:
  - projects_dashboard
  - project_gantt_view
  - project_kanban_board
  - resource_allocation

permissions:
  view: [team_member, project_manager, admin]
  create_projects: [project_manager, admin]
  configure: [admin]

features:
  gantt_charts:
    enabled: true
  
  time_tracking:
    enabled: true
    billable: true
  
  resource_planning:
    enabled: true
  
  budgeting:
    enabled: true
    settings:
      track_costs: true
      track_revenue: true

settings:
  work_days: [monday, tuesday, wednesday, thursday, friday]
  work_hours_per_day: 8
  
  project_statuses:
    - planning
    - active
    - on_hold
    - completed
    - cancelled
  
  task_priorities:
    - low
    - medium
    - high
    - urgent
  
  notifications:
    task_assigned: true
    deadline_approaching: true
    milestone_completed: true

sort_order: 20

ai_context:
  intent: "Project management application for planning and execution"
  domain: project_management
  methodologies:
    - Agile
    - Waterfall
    - Hybrid
```

### Example 3: Admin Console Application

```yaml
# File: admin.app.yml

label: Administration
description: System administration and configuration
icon: standard:settings
color: "#34495e"
homepage: /admin/overview

objects:
  - user
  - role
  - permission_set
  - profile
  - system_log
  - audit_trail

object_groups:
  - label: User Management
    objects: [user, role, profile]
  
  - label: Security
    objects: [permission_set, audit_trail]
  
  - label: System
    objects: [system_log, background_job]

menus:
  - admin_sidebar_menu

pages:
  - admin_dashboard
  - user_management
  - system_health
  - audit_logs

permissions:
  view: [admin, system_admin]
  configure: [system_admin]

features:
  user_impersonation:
    enabled: true
    permissions:
      access: [system_admin]
    audit: true
  
  bulk_operations:
    enabled: true
  
  system_monitoring:
    enabled: true
    settings:
      metrics_retention_days: 30

settings:
  security:
    password_policy:
      min_length: 12
      require_uppercase: true
      require_numbers: true
      require_special_chars: true
      expiry_days: 90
    
    session:
      timeout_minutes: 60
      concurrent_sessions: 3
    
    mfa:
      enabled: true
      methods: [totp, sms]
  
  system:
    maintenance_mode: false
    api_rate_limit: 1000 # per hour
    max_upload_size: 10485760 # 10MB

sort_order: 999

ai_context:
  intent: "System administration and configuration console"
  domain: administration
  critical_features:
    - "User and access management"
    - "Security configuration"
    - "System monitoring"
    - "Audit logging"
```

## 9. Best Practices

### 9.1 Organization

- **Single responsibility**: Each app should focus on a specific domain
- **Clear boundaries**: Minimize overlapping functionality between apps
- **Logical grouping**: Group related objects and features together
- **Consistent naming**: Use descriptive, consistent naming conventions

### 9.2 Scalability

- **Modular design**: Build apps that can work independently
- **Shared resources**: Use shared objects for common entities
- **Feature flags**: Use flags for gradual rollout of features
- **Performance**: Consider object count and data volume

### 9.3 User Experience

- **Clear navigation**: Provide intuitive menu structure
- **Sensible defaults**: Set appropriate default pages and settings
- **Progressive disclosure**: Show advanced features only when needed
- **Consistent branding**: Use consistent icons, colors, and terminology

### 9.4 Security

- **Permission-first**: Define permissions for all app components
- **Least privilege**: Grant minimum necessary access
- **Audit logging**: Track configuration changes
- **Regular review**: Periodically review and update permissions

## 10. Application Lifecycle

### 10.1 Development

```yaml
# Development app configuration
is_active: true
features:
  beta_features:
    enabled: true
  debug_mode:
    enabled: true
settings:
  logging_level: debug
```

### 10.2 Production

```yaml
# Production app configuration
is_active: true
features:
  beta_features:
    enabled: false
  debug_mode:
    enabled: false
settings:
  logging_level: info
  performance_monitoring: true
```

## 11. Integration with Other Metadata

Applications integrate with:

- **Objects**: Define which objects belong to the app
- **Menus**: Provide navigation structure
- **Pages**: Define app-specific pages and dashboards
- **Permissions**: Control app and feature access
- **Workflows**: Organize workflows by application context

## See Also

- [Objects](./object.md) - Data model definitions
- [Menus](./menu.md) - Navigation structure
- [Pages](./page.md) - UI page definitions
- [Permissions](./permission.md) - Access control
