# ObjectQL Metadata Specifications

Welcome to the complete ObjectQL metadata specification documentation. This directory contains **~16,000 words** of comprehensive technical specifications covering every aspect of metadata-driven enterprise application development.

## 📚 Start Here

**New to ObjectQL metadata?** Start with:

1. **[Complete Metadata Standard Guide](./metadata-standard.md)** - Your comprehensive introduction to the entire system
2. **[Objects & Fields](./object.md)** - The foundation: define your data model
3. **[Query Language](./query-language.md)** - How to access and manipulate data

## 🗂️ Specification Categories

### Core Data Layer
Define what data to store and how to access it.

| Specification | Description | Lines | Key Concepts |
|---------------|-------------|-------|--------------|
| [Objects & Fields](./object.md) | Data models, relationships, indexes | 272 | Entity definition, field types, relationships |
| [Query Language](./query-language.md) | JSON-DSL for data operations | 239 | Filters, sorting, joins, aggregations |
| [Validation Rules](./validation.md) | Data quality enforcement | 488 | Field validation, business rules, state machines |

### Business Logic Layer
Define what happens when data changes.

| Specification | Description | Lines | Key Concepts |
|---------------|-------------|-------|--------------|
| [Hooks (Triggers)](./hook.md) | Event-driven logic | 122 | beforeCreate, afterUpdate, lifecycle events |
| [Actions (RPC)](./action.md) | Custom operations | 111 | Record actions, global actions, RPC |
| [Workflows & Processes](./workflow.md) | Process automation | 581 | Approvals, automation, scheduling |

### Presentation Layer
Define how users interact with data.

| Specification | Description | Lines | Key Concepts |
|---------------|-------------|-------|--------------|
| [Views & Layouts](./view.md) | Data presentation | 329 | List, grid, kanban, calendar views |
| [Forms](./form.md) | Data entry interfaces | 672 | Form layouts, conditional logic, wizards |
| [Reports & Dashboards](./report.md) | Analytics & BI | 606 | Tabular, summary, matrix reports, charts |
| [Menus & Navigation](./menu.md) | App structure | 520 | Menu hierarchies, breadcrumbs, navigation |

### Security & Access Control
Define who can do what.

| Specification | Description | Lines | Key Concepts |
|---------------|-------------|-------|--------------|
| [Permissions](./permission.md) | Access control | 455 | RBAC, field-level security, record-level rules |

## 🎯 Quick Navigation by Use Case

### "I want to..."

**...define my data structure**
→ Start with [Objects & Fields](./object.md)

**...control who can access data**
→ See [Permissions](./permission.md)

**...validate user input**
→ Check [Validation Rules](./validation.md)

**...execute logic when data changes**
→ Learn about [Hooks](./hook.md)

**...create custom operations**
→ Read [Actions](./action.md)

**...automate business processes**
→ Explore [Workflows](./workflow.md)

**...display data to users**
→ Study [Views & Layouts](./view.md)

**...create data entry forms**
→ Review [Forms](./form.md)

**...build reports and analytics**
→ See [Reports & Dashboards](./report.md)

**...organize app navigation**
→ Check [Menus & Navigation](./menu.md)

**...query data programmatically**
→ Learn [Query Language](./query-language.md)

## 📖 Documentation Statistics

- **Total Specifications**: 14 documents
- **Total Words**: ~17,000
- **Total Lines**: ~7,200
- **Total Size**: ~168 KB
- **Language**: 100% English
- **Format**: Markdown with YAML/JSON examples

## 🏗️ Metadata Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    ObjectOS Runtime                      │
│              (Interprets & Executes Metadata)            │
└─────────────────────────────────────────────────────────┘
                           ▲
                           │
┌─────────────────────────────────────────────────────────┐
│                  Metadata Definitions                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Data Layer   │  │ Logic Layer  │  │ UI Layer     │ │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤ │
│  │ Objects      │  │ Hooks        │  │ Views        │ │
│  │ Validation   │  │ Actions      │  │ Forms        │ │
│  │ Permissions  │  │ Workflows    │  │ Reports      │ │
│  │ Query Lang   │  │              │  │ Menus        │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 🎓 Learning Path

### Beginner (Day 1-2)
1. Read [Complete Metadata Standard Guide](./metadata-standard.md)
2. Study [Objects & Fields](./object.md)
3. Practice [Query Language](./query-language.md)
4. Review [Views & Layouts](./view.md)

### Intermediate (Day 3-5)
5. Implement [Validation Rules](./validation.md)
6. Add [Hooks](./hook.md) for business logic
7. Create [Forms](./form.md) for data entry
8. Configure [Permissions](./permission.md)

### Advanced (Week 2+)
9. Design [Workflows](./workflow.md)
10. Build [Reports & Dashboards](./report.md)
11. Implement [Actions](./action.md)
12. Structure [Menus & Navigation](./menu.md)

## 💡 Key Concepts

### Metadata-Driven Development
Instead of writing code, you define structured metadata. ObjectOS interprets this metadata to generate your application.

**Traditional Approach:**
```typescript
// 100+ lines of code per feature
class CustomerController {
  async create(req, res) { ... }
  async update(req, res) { ... }
  // ...
}
```

**ObjectQL Approach:**
```yaml
# customers.object.yml (10 lines)
name: customer
fields:
  name: { type: text }
  email: { type: email }
```

### Benefits

✅ **10x Faster Development** - Define features, not implementation
✅ **AI-Optimized** - Structured format perfect for LLMs
✅ **Database-Agnostic** - Run on MongoDB, PostgreSQL, MySQL
✅ **Type-Safe** - Generate TypeScript types from metadata
✅ **Version Controlled** - Track changes in Git
✅ **Consistent** - Unified patterns across all features
✅ **Maintainable** - Clear separation of concerns

## 🔗 External Resources

- [ObjectQL GitHub](https://github.com/objectql/objectql)
- [Getting Started Guide](../guide/getting-started.md)
- [API Documentation](../api/)
- [Examples](../../examples/)

## 📝 Contributing

Found an error or want to improve the documentation?

1. File an issue on GitHub
2. Submit a pull request with improvements
3. Join our community discussions

## 📄 License

MIT © ObjectQL Contributors

---

**Last Updated**: January 2026
**Version**: 1.0
**Status**: Complete ✅
