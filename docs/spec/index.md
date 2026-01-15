# Metadata Specifications

This section contains the complete metadata specifications for the ObjectQL platform. ObjectQL is a metadata-driven standard for enterprise applications - every aspect of your application is defined through structured metadata.

📖 **[Read the Complete Metadata Standard Guide](./metadata-standard.md)** - A comprehensive overview of the entire metadata system and how all pieces fit together.

📊 **[Implementation Progress Report](../../PROGRESS.md)** - Current implementation status of all specifications (v1.8.3 - 70% complete)

## Core Data Layer

*   [**Objects & Fields**](./object.md) - Data model definitions, field types, relationships, and validation rules ✅
*   [**Query Language (JSON-DSL)**](./query-language.md) - Unified query protocol for database-agnostic data access ✅
*   [**Validation Rules**](./validation.md) - Data quality and business rule enforcement ✅

## Business Logic Layer

*   [**Hooks (Triggers)**](./hook.md) - Event-driven logic attached to data operations ✅
*   [**Actions (RPC)**](./action.md) - Custom server-side functions and APIs ✅
*   [**Workflows & Processes**](./workflow.md) - Automated business processes and approval chains ⚠️ *Spec complete, implementation pending*

## Security & Access Control

*   [**Permissions**](./permission.md) - Role-based access control, field-level security, and record-level rules ✅

---

**Legend:**
- ✅ Complete - Both specification and implementation ready
- ⚠️ Partial - Specification complete, implementation in progress or planned

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
  
  data/               # Initial Seeding
    *.data.yml         # Seed data
```

## Getting Started

1. **Start with Objects**: Define your data model using [Objects & Fields](./object.md)
2. **Add Business Logic**: Implement validation, hooks, and actions
3. **Secure Your App**: Configure permissions and access rules
4. **Build Workflows**: Automate processes and approvals
