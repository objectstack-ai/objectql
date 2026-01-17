---
layout: home

hero:
  name: ObjectQL
  text: The Universal Data Compiler
  tagline: Stop writing glue code. Start compiling your data layer. Define schemas once in YAML, compile to optimized SQL for any database, auto-generate type-safe APIs.
  image:
    src: /logo.svg
    alt: ObjectQL Logo
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/objectstack-ai/objectql

features:
  - icon: 🔒
    title: Zero-Overhead Security
    details: RBAC and ACL rules are compiled directly into SQL WHERE clauses at query time, not checked in application memory. Security breaches from forgotten permission checks are impossible.
  - icon: 🌐
    title: Database Agnostic
    details: Write your schema once. Switch from local SQLite in development to production PostgreSQL, MySQL, or TiDB without changing a single line of code. The compiler handles dialect translation.
  - icon: ⚡
    title: Virtual Columns
    details: Define computed fields in your schema that compile to efficient database expressions. No N+1 queries, no manual JOIN management—just declare the intent and let the compiler optimize.
---

## Show Code: From Schema to SQL

You define the intent in declarative YAML. ObjectQL compiles it into optimized, database-specific SQL.

::: code-group

```yaml [project.object.yml]
name: project
label: Project
fields:
  name: 
    type: text
    required: true
  status:
    type: select
    options: [planning, active, completed]
    default: planning
  owner:
    type: lookup
    reference_to: users
    required: true
  # Virtual column: computed at query time
  task_count:
    type: number
    formula: "COUNT(tasks.id)"
    virtual: true
```

```sql [Compiled SQL (PostgreSQL)]
-- Query: Find active projects with task counts
SELECT 
  p.id,
  p.name,
  p.status,
  u.name AS owner_name,
  (SELECT COUNT(*) 
   FROM tasks t 
   WHERE t.project_id = p.id) AS task_count
FROM projects p
LEFT JOIN users u ON p.owner = u.id
WHERE p.status = 'active'
  AND p.tenant_id = $1  -- RBAC injected automatically
ORDER BY p.created_at DESC;
```

:::

**You define the intent. We compile the optimized SQL.**

## Why ObjectQL?

### Architected for Enterprise Backends

ObjectQL is not a runtime wrapper around your database. It's a **compiler** that transforms high-level metadata into production-grade database operations.

**🔒 Security by Design**

Traditional ORMs rely on developers remembering to add permission checks:

```typescript
// Traditional ORM - Easy to forget!
const projects = await Project.find({ status: 'active' });
// ❌ Oops, forgot to filter by user's tenant
```

ObjectQL injects security rules during compilation:

```typescript
// ObjectQL - Permissions enforced by the engine
const projects = await objectql.find('project', {
  filters: [['status', '=', 'active']]
});
// ✅ WHERE clause automatically includes: tenant_id = current_user.tenant_id
```

Permission rules are defined once in metadata and enforced at the database level. Zero chance of data leakage from application-layer bugs.

**🌐 True Database Portability**

Switch databases without code changes:

- **Development**: SQLite (zero configuration, file-based)
- **Staging**: PostgreSQL (JSONB optimized queries)
- **Production**: MySQL 8.0+ or TiDB (horizontal scaling)
- **Enterprise**: Oracle or SQL Server (legacy integration)

The compiler generates dialect-specific SQL automatically. No vendor lock-in.

**⚡ Virtual Columns Without the Pain**

Define computed fields that compile to efficient SQL:

```yaml
# In your schema
revenue_total:
  type: currency
  formula: "SUM(line_items.amount)"
  virtual: true
```

ObjectQL compiles this to a subquery or JOIN based on the query context. No N+1 problems, no manual optimization needed.

## Compiler vs. Traditional ORM

| Feature | ObjectQL (Compiler) | Traditional ORM (Runtime) |
|---------|---------------------|---------------------------|
| **Runtime Overhead** | Near-zero (direct SQL compilation) | High (query builder + reflection) |
| **Security Model** | Engine-enforced (compiled into WHERE clauses) | Application-logic (developer must remember) |
| **Database Portability** | Protocol-based (dialect-agnostic AST) | Code-based (vendor-specific methods) |
| **Query Optimization** | Compile-time analysis + dialect-specific optimizations | Best-effort runtime translation |
| **Type Safety** | Schema-first (TypeScript types generated from YAML) | Code-first (manual type definitions) |
| **Computed Fields** | Virtual columns compiled to SQL expressions | Requires manual afterLoad hooks |
| **Permission Injection** | Automatic (part of compilation phase) | Manual (decorators or middleware) |
| **AI Integration** | Metadata = perfect LLM context | Code = fuzzy target for generation |

## Supported Drivers

ObjectQL compiles to multiple database backends with dialect-specific optimizations:

**🐘 PostgreSQL** — JSONB field type support, advanced indexing strategies, full-text search with `tsvector`

**🐬 MySQL** — 8.0+ features including JSON columns, window functions, and CTEs

**💎 SQLite** — Local-first ready, zero configuration, perfect for development and edge deployments

**🏢 SQL Server & Oracle** — Enterprise-grade legacy system integration with vendor-specific optimization

**🍃 MongoDB** — Document model support with schema validation (experimental)

All drivers share the same query protocol. Write once, deploy anywhere.

---

## Next Steps

- **[Developer Guide](/guide/getting-started)** — Build your first ObjectQL application
- **[Data Modeling Reference](/guide/data-modeling)** — Learn the schema definition language
- **[Query Language Spec](/spec/query-language)** — Understand the compilation target
- **[AI-Native Development](/ai/)** — Use ObjectQL as an LLM tool interface
