# @objectql/plugin-formula

Formula engine plugin for ObjectQL - Evaluate JavaScript-style formulas with field references, system variables, and safe sandbox execution.

## Overview

The Formula Plugin provides calculated field capabilities for ObjectQL applications. It enables you to define JavaScript-style expressions that compute values dynamically based on other fields, system variables, and custom functions.

## Features

- **Field References**: Access other fields in the same record (e.g., `quantity * unit_price`)
- **System Variables**: Use built-in variables like `$today`, `$current_user.id`, `$year`
- **Lookup Chains**: Navigate relationships (e.g., `account.owner.name`)
- **Built-in Functions**: Access Math, String, Date methods
- **Conditional Logic**: Use ternary operators and if/else statements
- **Safe Sandbox**: Execute formulas in a controlled environment
- **Custom Functions**: Register your own functions for use in formulas
- **Type Coercion**: Automatic conversion to expected data types

## Installation

```bash
pnpm add @objectql/plugin-formula
```

## Usage

### Basic Setup

```typescript
import { ObjectStackKernel } from '@objectstack/runtime';
import { FormulaPlugin } from '@objectql/plugin-formula';

const kernel = new ObjectStackKernel([
  // Your application config
  myApp,
  
  // Add the formula plugin
  new FormulaPlugin({
    enable_cache: false,
    sandbox: {
      enabled: true,
      allowed_globals: ['Math', 'String', 'Number', 'Date']
    }
  })
]);

await kernel.start();
```

### Defining Formula Fields

In your object metadata:

```yaml
name: invoice_items
fields:
  quantity:
    type: number
  unit_price:
    type: currency
  
  # Calculated field
  total_amount:
    type: formula
    expression: "quantity * unit_price"
    data_type: currency
  
  # Using system variables
  days_since_created:
    type: formula
    expression: "Math.floor(($today - created_at) / (1000 * 60 * 60 * 24))"
    data_type: number
```

### Configuration Options

```typescript
interface FormulaPluginConfig {
  // Enable result caching
  enable_cache?: boolean;
  
  // Cache TTL in seconds
  cache_ttl?: number;
  
  // Custom functions registry
  custom_functions?: Record<string, Function>;
  
  // Sandbox configuration
  sandbox?: {
    enabled?: boolean;
    allowed_globals?: string[];
    blocked_operations?: string[];
  };
  
  // Auto-evaluate formulas on query
  autoEvaluateOnQuery?: boolean;
}
```

### System Variables

Available system variables in formulas:

- `$today` - Current date (midnight)
- `$now` - Current timestamp
- `$year`, `$month`, `$day` - Current date components
- `$hour`, `$minute`, `$second` - Current time components
- `$current_user` - Current user object with `.id`, `.name`, etc.
- `$is_new` - Boolean indicating if this is a new record
- `$record_id` - Current record ID

## Examples

### Conditional Formulas

```yaml
discount:
  type: formula
  expression: "total_amount > 1000 ? total_amount * 0.1 : 0"
  data_type: currency
```

### Lookup Chain Formulas

```yaml
account_owner_email:
  type: formula
  expression: "account.owner.email"
  data_type: text
```

### Custom Functions

```typescript
const plugin = new FormulaPlugin({
  custom_functions: {
    formatCurrency: (value: number) => `$${value.toFixed(2)}`,
    calculateTax: (amount: number, rate: number) => amount * rate
  }
});
```

## Security

The formula engine includes basic sandbox protection:

- Blocks dangerous operations like `eval`, `Function`, `require`, `import`
- Restricts access to allowed global objects
- **Note**: For production use with untrusted formulas, consider additional sandboxing

## API Reference

See the [full API documentation](../../docs/api/plugin-formula.md) for detailed information about:

- `FormulaEngine` class
- `FormulaPlugin` class
- Type definitions
- Error handling

## License

MIT © ObjectStack Inc.
