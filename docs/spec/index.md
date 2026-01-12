# Metadata Specifications

This section contains the complete metadata specifications for the ObjectQL platform. ObjectQL is a metadata-driven standard for enterprise applications - every aspect of your application is defined through structured metadata.

📖 **[Read the Complete Metadata Standard Guide](./metadata-standard.md)** - A comprehensive overview of the entire metadata system and how all pieces fit together.

## Core Data Layer

*   [**Objects & Fields**](./object.md) - Data model definitions, field types, relationships, and validation rules
*   [**Query Language (JSON-DSL)**](./query-language.md) - Unified query protocol for database-agnostic data access
*   [**Validation Rules**](./validation.md) - Data quality and business rule enforcement

## Business Logic Layer

*   [**Hooks (Triggers)**](./hook.md) - Event-driven logic attached to data operations
*   [**Actions (RPC)**](./action.md) - Custom server-side functions and APIs
*   [**Workflows & Processes**](./workflow.md) - Automated business processes and approval chains

### Presentation Layer
*   [**Pages**](./page.md) - Composable UI pages with layouts, components, and interactions
*   [**Views & Layouts**](./view.md) - Data presentation configurations
*   [**Forms**](./form.md) - Data entry and editing interfaces
*   [**Reports & Dashboards**](./report.md) - Analytics and BI
*   [**Menus & Navigation**](./menu.md) - Application structure and navigation hierarchy
*   [**Applications**](./app.md) - Application container and simple metadata

*   [**Views & Layouts**](./view.md) - Data presentation configurations (list, grid, kanban, calendar)
*   [**Forms**](./form.md) - Data entry and editing interfaces
*   [**Reports & Dashboards**](./report.md) - Analytics, visualizations, and business intelligence

## Security & Access Control

*   [**Permissions**](./permission.md) - Role-based access control, field-level security, and record-level rules

## Design Philosophy

ObjectQL treats metadata as the **source of truth** for your entire application:

1. **Define Once, Run Anywhere**: Metadata is interpreted by ObjectOS to generate enterprise applications
2. **AI-Native**: Structured metadata is optimized for LLM understanding and generation
3. **Version Controlled**: Metadata lives in YAML/JSON files, tracked in Git
4. **Type-Safe**: Generate TypeScript types from metadata for full IDE support
5. **Composable**: Mix and match metadata to build complex applications

## Metadata File Organization

```
src/
  objects/              # Core data models
    *.object.yml       # Object definitions
    *.validation.yml   # Validation rules
    *.permission.yml   # Permission rules
    *.hook.ts          # Hook implementations
    *.action.ts        # Action implementations
  
  workflows/           # Business processes
    *.workflow.yml     # Workflow definitions
  
  pages/              # UI pages
    *.page.yml         # Page definitions
  
  views/              # UI presentation
    *.view.yml         # View configurations
    *.form.yml         # Form layouts
  
  reports/            # Analytics
    *.report.yml       # Report definitions
    *.dashboard.yml    # Dashboard configurations

  data/               # Initial Seeding
    *.data.yml         # Seed data
  
  navigation/         # App structure
    *.menu.yml         # Menu definitions
```

## Getting Started

1. **Start with Objects**: Define your data model using [Objects & Fields](./object.md)
2. **Add Business Logic**: Implement validation, hooks, and actions
3. **Design UI**: Create views, forms, and navigation
4. **Secure Your App**: Configure permissions and access rules
5. **Build Workflows**: Automate processes and approvals
6. **Create Reports**: Add analytics and dashboards
