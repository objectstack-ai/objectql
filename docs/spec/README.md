# ObjectQL Metadata Specifications

Welcome to the complete ObjectQL metadata specification documentation. This directory contains **~16,000 words** of comprehensive technical specifications covering every aspect of metadata-driven enterprise application development.

## 🤖 AI-Native Metadata Design

ObjectQL metadata is designed from the ground up to be **AI-friendly**, enabling:

- **Better Code Generation**: AI tools understand business intent, not just syntax
- **Natural Language Queries**: Convert user questions to structured queries
- **Auto-Documentation**: Generate comprehensive docs from metadata
- **Smart Validation**: AI suggests improvements and catches errors
- **Realistic Test Data**: Generate test data following proper patterns

### AI Context Blocks

All metadata types now support optional `ai_context` blocks that provide semantic information:

```yaml
# Example: Object with AI context
name: project
fields:
  status:
    type: select
    options: [planning, active, completed]
    
    ai_context:
      intent: "Track project through its lifecycle"
      is_state_machine: true
      transitions:
        planning: [active, cancelled]
        active: [completed, cancelled]
        completed: []  # Terminal state
```

**Benefits:**
- 🎯 **Intent-Driven**: Capture WHY, not just WHAT
- 📚 **Self-Documenting**: Metadata explains itself
- 🤖 **AI-Friendly**: LLMs generate better code
- ✅ **Validated**: Business rules are explicit
- 🧪 **Testable**: Examples embedded for testing

## 📚 Start Here

**New to ObjectQL metadata?** Start with:

1. **[Complete Metadata Standard Guide](./metadata-standard.md)** - Your comprehensive introduction to the entire system
2. **[Objects & Fields](./object.md)** - The foundation: define your data model **with AI context**
3. **[Query Language](./query-language.md)** - How to access and manipulate data **with natural language support**

## 🗂️ Specification Categories

### Core Data Layer
Define what data to store and how to access it.

| Specification | Description | AI Features |
|---------------|-------------|-------------|
| [Objects & Fields](./object.md) | Data models, relationships, indexes | `ai_context` blocks, semantic relationships, state machines, examples |
| [Query Language](./query-language.md) | JSON-DSL for data operations | Natural language intent, optimization hints, explainability |
| [Validation Rules](./validation.md) | Data quality enforcement | Declarative rules, business intent, multi-language generation |

### Business Logic Layer
Define what happens when data changes.

| Specification | Description | AI Features |
|---------------|-------------|-------------|
| [Hooks (Triggers)](./hook.md) | Event-driven logic | Lifecycle events with business context |
| [Actions (RPC)](./action.md) | Custom operations | Intent-driven operations |
| [Workflows & Processes](./workflow.md) | Process automation | Decision criteria, SLAs, business process documentation |

### Presentation Layer
Define how users interact with data.

| Specification | Description | AI Features |
|---------------|-------------|-------------|
| [Views & Layouts](./view.md) | Data presentation | Context-aware displays |
| [Forms](./form.md) | Data entry interfaces | Smart defaults, auto-complete, validation assistance |
| [Reports & Dashboards](./report.md) | Analytics & BI | Business metrics with context |
| [Menus & Navigation](./menu.md) | App structure | Navigation patterns |

### Security & Access Control
Define who can do what.

| Specification | Description | AI Features |
|---------------|-------------|-------------|
| [Permissions](./permission.md) | Access control | Security rationale, compliance tagging |

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
✅ **AI-Native** - Structured format optimized for LLM code generation  
✅ **Intent-Driven** - Metadata captures business WHY, not just technical WHAT  
✅ **Database-Agnostic** - Run on MongoDB, PostgreSQL, MySQL  
✅ **Type-Safe** - Generate TypeScript types from metadata  
✅ **Version Controlled** - Track changes in Git  
✅ **Self-Documenting** - AI context enables auto-documentation  
✅ **Testable** - Embedded examples for realistic test data  

## 🤖 AI-Powered Features

### Code Generation
```yaml
# AI understands this metadata and generates correct implementations
owner:
  type: lookup
  reference_to: users
  ai_context:
    intent: "Person responsible for project success"
    semantic_type: ownership  # AI knows this is ownership, not just a reference
```

### Natural Language Queries
```json
{
  "ai_context": {
    "natural_language": "Show me my overdue tasks",
    "intent": "Find tasks assigned to current user past their deadline"
  },
  "object": "tasks",
  "filters": [
    ["assignee_id", "=", "$current_user"],
    "and",
    ["due_date", "<", "$today"]
  ]
}
```

### Smart Validation
```yaml
# AI can generate implementations from declarative rules
rules:
  - name: budget_within_limits
    type: business_rule
    ai_context:
      intent: "Prevent budget overruns"
      business_rule: "Projects must be within department limits"
    constraint:
      expression: "budget <= department.budget_limit"
```

### State Machines
```yaml
# AI enforces valid transitions
status:
  type: select
  ai_context:
    is_state_machine: true
    transitions:
      planning: [active, cancelled]
      active: [completed, cancelled]
      completed: []  # Terminal
```

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
