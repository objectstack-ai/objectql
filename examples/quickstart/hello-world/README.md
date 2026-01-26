# Hello ObjectQL

This is the simplest possible example of **ObjectQL** following the **latest ObjectStack specification** (v4.0+).

## What it demonstrates

1.  **Zero Config:** No YAML files or server setup required
2.  **In-Memory SQL:** Uses SQLite in memory, so no database installation is needed
3.  **Inline Schema:** Defines the data model directly in code using programmatic API
4.  **Latest Spec Compliance:**
    - Label/value format for select options
    - Explicit field labels for AI-friendly metadata
    - Proper field type declarations

## Key Concepts

### Metadata Definition Approaches

**Programmatic (This Example):**
```typescript
app.registerObject({
  name: 'deal',  // Required when using code
  fields: {
    stage: { 
      type: 'select',
      options: [
        { label: 'New', value: 'new' },  // ✅ Latest spec format
        { label: 'Negotiation', value: 'negotiation' }
      ]
    }
  }
});
```

**YAML-based (Recommended for Production):**
```yaml
# File: deal.object.yml
# NO 'name:' field needed - inferred from filename! ✅
label: Deal
fields:
  stage:
    type: select
    options:
      - label: New
        value: new
      - label: Negotiation
        value: negotiation
```

## How to Run

Since you are in the monorepo, simply run:

```bash
# Install dependencies (if not already done at root)
pnpm install

# Run the script
cd examples/quickstart/hello-world
pnpm start
```

## What you see

The script will:
1.  Initialize the ObjectQL engine with an in-memory SQLite driver
2.  Create a `deal` object definition programmatically
3.  Insert a record into the database
4.  Query it back and print the result

## Expected Output

```
🚀 Starting ObjectQL Hello World...
Creating a new Deal...
✅ Deals found in database: [
  {
    _id: '...',
    title: 'Enterprise Contract',
    amount: 50000,
    stage: 'new',
    created_at: '...',
    updated_at: '...'
  }
]
```

## Next Steps

- See [Project Tracker Example](../../showcase/project-tracker/) for YAML-based metadata
- Read the [Metadata Standard Spec](https://protocol.objectstack.ai) from @objectstack/spec
- Explore the [ObjectQL Documentation](../../../content/docs/)
