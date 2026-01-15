# Formula Engine Tutorial

This tutorial demonstrates the Formula Engine capabilities in ObjectQL. Formulas are read-only calculated fields that automatically derive their values from other fields, related records, or system variables.

## Quick Start

```bash
npm install
npm run dev
```

## What You'll Learn

1. Basic formula expressions (arithmetic, string concatenation)
2. Conditional logic in formulas
3. System variables ($today, $current_user)
4. Complex business logic
5. Error handling

## Example Objects

### 1. E-commerce Order

Demonstrates:
- Price calculations with discounts and tax
- Stock status logic
- Risk assessment

### 2. CRM Contact

Demonstrates:
- String concatenation (full name)
- Relationship traversal
- User ownership checks

### 3. Project Management

Demonstrates:
- Date calculations
- Progress tracking
- Health scores

## Running the Examples

```bash
npm run dev
```

This will:
1. Initialize the ObjectQL engine
2. Register objects with formulas
3. Create sample records
4. Query and display formula results

## Key Concepts

### Formula Field Definition

```yaml
full_name:
  type: formula
  formula: "first_name + ' ' + last_name"
  data_type: text
  label: Full Name
```

### System Variables

- `$today` - Current date
- `$now` - Current timestamp
- `$current_user.id` - Current user ID
- `$year`, `$month`, `$day` - Date components

### Supported Operations

- Arithmetic: `+`, `-`, `*`, `/`, `%`, `**`
- Comparison: `===`, `!==`, `>`, `<`, `>=`, `<=`
- Logical: `&&`, `||`, `!`
- Conditional: Ternary operator, if/else blocks
- String methods: `.toUpperCase()`, `.toLowerCase()`, `.trim()`, etc.
- Math functions: `Math.round()`, `Math.max()`, etc.

## See Also

- [Formula Specification](../../docs/spec/formula.md)
- [Formulas & Rules Guide](../../docs/guide/formulas-and-rules.md)
