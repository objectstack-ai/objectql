# Formula Engine Specification

Formula fields are **read-only calculated fields** that automatically derive their values from other fields, related records, or system variables. They are computed at query time and are never stored in the database.

The Formula Engine is a core component of ObjectQL that enables declarative, metadata-driven calculations without requiring custom code for simple business logic.

## 1. Overview

### 1.1 What is a Formula Field?

A formula field is a special field type that:

- **Computes values dynamically** based on an expression
- **Never stores data** - calculated on-the-fly during queries
- **Supports cross-field references** - can access other fields on the same record
- **Supports relationship traversal** - can access fields on related records via lookups
- **Supports system variables** - like `$today`, `$now`, `$current_user`
- **Type-safe** - must declare the expected data type of the result

### 1.2 Use Cases

| Use Case | Example Formula |
|----------|----------------|
| **Calculated Totals** | `quantity * unit_price` |
| **String Concatenation** | `first_name + ' ' + last_name` |
| **Date Calculations** | `$today - created_date` |
| **Conditional Logic** | `status === 'active' ? 'Open' : 'Closed'` |
| **Percentage Calculations** | `(actual / target) * 100` |
| **Cross-Object References** | `account.owner.name` |
| **Complex Business Logic** | Multi-line JavaScript expressions |

### 1.3 File Naming Convention

Formulas are defined as fields within object definition files:

**File:** `<object_name>.object.yml`

```yaml
# File: order.object.yml
# Object name is inferred from filename

label: Order
fields:
  quantity:
    type: number
    required: true
  
  unit_price:
    type: currency
    required: true
  
  # Formula Field
  total_amount:
    type: formula
    expression: "quantity * unit_price"
    data_type: currency
    label: Total Amount
```

## 2. Formula Field Configuration

### 2.1 Required Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | `string` | ✅ Yes | Must be `"formula"` |
| `expression` | `string` | ✅ Yes | JavaScript-style expression to evaluate |
| `data_type` | `string` | ✅ Yes | Expected return type: `number`, `text`, `date`, `datetime`, `boolean`, `currency`, `percent` |

### 2.2 Optional Properties

| Property | Type | Description |
|----------|------|-------------|
| `label` | `string` | Display label for UI |
| `description` | `string` | Help text explaining the formula's purpose |
| `ai_context` | `object` | AI-friendly context for understanding business intent |
| `format` | `string` | Display format for numbers/dates (e.g., `"0.00"`, `"YYYY-MM-DD"`) |
| `precision` | `number` | Decimal places for numeric results |
| `blank_as_zero` | `boolean` | Treat null/undefined as zero in calculations (default: `false`) |
| `treat_blank_as` | `any` | Value to use when referenced fields are null/undefined |

### 2.3 Data Types

The `data_type` property specifies the expected return type of the formula expression:

| Data Type | Description | Example Expression |
|-----------|-------------|-------------------|
| `number` | Integer or decimal number | `quantity * 2` |
| `currency` | Monetary value | `price * (1 - discount_rate)` |
| `percent` | Percentage (0-100) | `(completed / total) * 100` |
| `text` | String value | `first_name + ' ' + last_name` |
| `date` | Date only (YYYY-MM-DD) | `$today` |
| `datetime` | Date and time | `created_at + 86400000` |
| `boolean` | True/false | `amount > 1000` |

## 3. Expression Syntax

### 3.1 Field References

Reference fields on the current record by their API name:

```yaml
# Direct field reference
full_name:
  type: formula
  expression: "first_name + ' ' + last_name"
  data_type: text

# With curly braces (alternative syntax)
full_name_alt:
  type: formula
  expression: "{first_name} + ' ' + {last_name}"
  data_type: text
```

### 3.2 Arithmetic Operators

Standard JavaScript arithmetic operators are supported:

```yaml
# Addition
total:
  type: formula
  expression: "subtotal + tax"
  data_type: currency

# Subtraction
profit:
  type: formula
  expression: "revenue - cost"
  data_type: currency

# Multiplication
area:
  type: formula
  expression: "width * height"
  data_type: number

# Division
average:
  type: formula
  expression: "total / count"
  data_type: number

# Modulo
remainder:
  type: formula
  expression: "value % 10"
  data_type: number

# Exponentiation
squared:
  type: formula
  expression: "value ** 2"
  data_type: number
```

### 3.3 Comparison Operators

```yaml
is_high_value:
  type: formula
  expression: "amount > 10000"
  data_type: boolean

is_equal:
  type: formula
  expression: "status === 'completed'"
  data_type: boolean

is_in_range:
  type: formula
  expression: "score >= 70 && score <= 100"
  data_type: boolean
```

| Operator | Description | Example |
|----------|-------------|---------|
| `===` | Strict equality | `status === 'active'` |
| `!==` | Strict inequality | `role !== 'admin'` |
| `==` | Loose equality | `count == 0` |
| `!=` | Loose inequality | `value != null` |
| `>` | Greater than | `amount > 1000` |
| `>=` | Greater than or equal | `score >= 70` |
| `<` | Less than | `age < 18` |
| `<=` | Less than or equal | `price <= 100` |

### 3.4 Logical Operators

```yaml
is_eligible:
  type: formula
  expression: "age >= 18 && has_account && !is_blocked"
  data_type: boolean
```

| Operator | Description | Example |
|----------|-------------|---------|
| `&&` | Logical AND | `is_active && is_verified` |
| `\|\|` | Logical OR | `is_admin \|\| is_moderator` |
| `!` | Logical NOT | `!is_deleted` |

### 3.5 String Operations

```yaml
# Concatenation
full_address:
  type: formula
  expression: "street + ', ' + city + ', ' + state + ' ' + zip"
  data_type: text

# Template literals (backticks)
greeting:
  type: formula
  expression: "`Hello, ${first_name}!`"
  data_type: text

# String methods
uppercase_name:
  type: formula
  expression: "name.toUpperCase()"
  data_type: text

lowercase_email:
  type: formula
  expression: "email.toLowerCase()"
  data_type: text

# String slicing
initials:
  type: formula
  expression: "first_name.charAt(0) + last_name.charAt(0)"
  data_type: text
```

### 3.6 Conditional Expressions

#### Ternary Operator

```yaml
status_label:
  type: formula
  expression: "is_active ? 'Active' : 'Inactive'"
  data_type: text

priority_score:
  type: formula
  expression: "is_urgent ? 100 : 50"
  data_type: number
```

#### Multi-condition Ternary

```yaml
risk_level:
  type: formula
  expression: "amount > 100000 ? 'High' : (amount > 10000 ? 'Medium' : 'Low')"
  data_type: text
```

#### If-Else Blocks (Multi-line)

```yaml
category:
  type: formula
  expression: |
    if (score >= 90) {
      return 'Excellent';
    } else if (score >= 70) {
      return 'Good';
    } else if (score >= 50) {
      return 'Average';
    } else {
      return 'Poor';
    }
  data_type: text
```

### 3.7 Null/Undefined Handling

```yaml
# Using nullish coalescing
display_name:
  type: formula
  expression: "nickname ?? full_name ?? 'Anonymous'"
  data_type: text

# Using logical OR
backup_value:
  type: formula
  expression: "primary_value || secondary_value || 0"
  data_type: number

# Explicit null check
safe_division:
  type: formula
  expression: "denominator !== 0 ? numerator / denominator : null"
  data_type: number
```

### 3.8 Date Calculations

```yaml
# Days since creation
days_old:
  type: formula
  expression: "$today - created_date"
  data_type: number
  description: "Number of days since record was created"

# Is overdue check
is_overdue:
  type: formula
  expression: "due_date < $today && status !== 'completed'"
  data_type: boolean

# Duration in days
project_duration:
  type: formula
  expression: "end_date - start_date"
  data_type: number

# Add days to a date
expected_delivery:
  type: formula
  expression: "order_date + 7"
  data_type: date
  description: "Order date plus 7 days"
```

### 3.9 Relationship Traversal (Lookup Fields)

Access fields on related records using dot notation:

```yaml
# Single-level lookup
account_name:
  type: formula
  expression: "account.name"
  data_type: text

# Multi-level lookup (nested relationships)
account_owner_email:
  type: formula
  expression: "account.owner.email"
  data_type: text

# With null safety
safe_lookup:
  type: formula
  expression: "account?.owner?.name ?? 'No Owner'"
  data_type: text

# Computed from related fields
account_total:
  type: formula
  expression: "account.annual_revenue * account.growth_rate"
  data_type: currency
```

## 4. System Variables

System variables provide access to runtime context information.

### 4.1 Date & Time Variables

| Variable | Type | Description | Example Usage |
|----------|------|-------------|---------------|
| `$today` | `date` | Current date (YYYY-MM-DD) | `$today - created_date` |
| `$now` | `datetime` | Current timestamp (ISO 8601) | `$now` |
| `$year` | `number` | Current year | `$year - 2020` |
| `$month` | `number` | Current month (1-12) | `$month` |
| `$day` | `number` | Current day of month (1-31) | `$day` |
| `$hour` | `number` | Current hour (0-23) | `$hour` |

```yaml
age_in_days:
  type: formula
  expression: "$today - birth_date"
  data_type: number

current_year_only:
  type: formula
  expression: "created_date.year === $year"
  data_type: boolean
```

### 4.2 User Context Variables

| Variable | Type | Description | Example Usage |
|----------|------|-------------|---------------|
| `$current_user.id` | `string` | Current user's ID | `owner_id === $current_user.id` |
| `$current_user.name` | `string` | Current user's name | `$current_user.name` |
| `$current_user.email` | `string` | Current user's email | `$current_user.email` |
| `$current_user.role` | `string` | Current user's role | `$current_user.role === 'admin'` |

```yaml
is_owner:
  type: formula
  expression: "owner_id === $current_user.id"
  data_type: boolean
  description: "True if current user is the record owner"

assigned_to_me:
  type: formula
  expression: "assigned_to === $current_user.id"
  data_type: boolean
```

### 4.3 Record Context Variables

| Variable | Type | Description | Example Usage |
|----------|------|-------------|---------------|
| `$record.id` | `string` | Current record ID | `$record.id` |
| `$record._id` | `string` | Current record _id (database ID) | `$record._id` |
| `$is_new` | `boolean` | True if record is being created | `$is_new ? 0 : 1` |

```yaml
default_owner:
  type: formula
  expression: "$is_new ? $current_user.id : owner_id"
  data_type: text
  description: "Set current user as owner on creation"
```

## 5. Built-in Functions

The formula engine supports a subset of JavaScript standard library functions.

### 5.1 Math Functions

```yaml
rounded_value:
  type: formula
  expression: "Math.round(price * 1.07)"
  data_type: number

ceiling:
  type: formula
  expression: "Math.ceil(quantity / 12)"
  data_type: number

floor_value:
  type: formula
  expression: "Math.floor(amount)"
  data_type: number

absolute_diff:
  type: formula
  expression: "Math.abs(actual - target)"
  data_type: number

max_value:
  type: formula
  expression: "Math.max(option_a, option_b, option_c)"
  data_type: number

min_value:
  type: formula
  expression: "Math.min(budget, available_funds)"
  data_type: number

power:
  type: formula
  expression: "Math.pow(base, exponent)"
  data_type: number

square_root:
  type: formula
  expression: "Math.sqrt(area)"
  data_type: number
```

| Function | Description | Example |
|----------|-------------|---------|
| `Math.round(x)` | Round to nearest integer | `Math.round(3.7)` → `4` |
| `Math.ceil(x)` | Round up | `Math.ceil(3.2)` → `4` |
| `Math.floor(x)` | Round down | `Math.floor(3.9)` → `3` |
| `Math.abs(x)` | Absolute value | `Math.abs(-5)` → `5` |
| `Math.max(...)` | Maximum value | `Math.max(1, 5, 3)` → `5` |
| `Math.min(...)` | Minimum value | `Math.min(1, 5, 3)` → `1` |
| `Math.pow(x, y)` | Exponentiation | `Math.pow(2, 3)` → `8` |
| `Math.sqrt(x)` | Square root | `Math.sqrt(16)` → `4` |

### 5.2 String Functions

```yaml
uppercase:
  type: formula
  expression: "name.toUpperCase()"
  data_type: text

lowercase:
  type: formula
  expression: "email.toLowerCase()"
  data_type: text

trimmed:
  type: formula
  expression: "description.trim()"
  data_type: text

substring:
  type: formula
  expression: "code.substring(0, 3)"
  data_type: text

replaced:
  type: formula
  expression: "text.replace('old', 'new')"
  data_type: text

char_at:
  type: formula
  expression: "name.charAt(0)"
  data_type: text

length:
  type: formula
  expression: "description.length"
  data_type: number

includes_check:
  type: formula
  expression: "tags.includes('urgent')"
  data_type: boolean
```

| Method | Description | Example |
|--------|-------------|---------|
| `.toUpperCase()` | Convert to uppercase | `"hello".toUpperCase()` → `"HELLO"` |
| `.toLowerCase()` | Convert to lowercase | `"HELLO".toLowerCase()` → `"hello"` |
| `.trim()` | Remove whitespace | `" text ".trim()` → `"text"` |
| `.substring(start, end?)` | Extract substring | `"hello".substring(0, 2)` → `"he"` |
| `.replace(old, new)` | Replace text | `"hi".replace("h", "H")` → `"Hi"` |
| `.charAt(index)` | Get character at index | `"hello".charAt(1)` → `"e"` |
| `.length` | String length | `"hello".length` → `5` |
| `.includes(substr)` | Check if contains | `"hello".includes("ell")` → `true` |

### 5.3 Date Functions

```yaml
year_extracted:
  type: formula
  expression: "created_date.getFullYear()"
  data_type: number

month_extracted:
  type: formula
  expression: "created_date.getMonth() + 1"
  data_type: number
  description: "Month (1-12)"

day_extracted:
  type: formula
  expression: "created_date.getDate()"
  data_type: number

iso_date:
  type: formula
  expression: "event_date.toISOString()"
  data_type: text
```

| Method | Description | Example |
|--------|-------------|---------|
| `.getFullYear()` | Get year | `date.getFullYear()` → `2026` |
| `.getMonth()` | Get month (0-11) | `date.getMonth()` → `0` (January) |
| `.getDate()` | Get day of month | `date.getDate()` → `15` |
| `.getDay()` | Get day of week (0-6) | `date.getDay()` → `3` (Wednesday) |
| `.toISOString()` | Convert to ISO string | `date.toISOString()` |

### 5.4 Array Functions

When working with multi-select fields or arrays:

```yaml
tag_count:
  type: formula
  expression: "tags.length"
  data_type: number

has_urgent:
  type: formula
  expression: "tags.includes('urgent')"
  data_type: boolean

first_tag:
  type: formula
  expression: "tags[0]"
  data_type: text

joined_tags:
  type: formula
  expression: "tags.join(', ')"
  data_type: text
```

## 6. Advanced Patterns

### 6.1 Complex Business Logic

```yaml
commission_rate:
  type: formula
  expression: |
    // Progressive commission structure
    if (sales_total > 100000) {
      return 0.15; // 15% for top performers
    } else if (sales_total > 50000) {
      return 0.10; // 10% for mid-tier
    } else if (sales_total > 10000) {
      return 0.05; // 5% for entry-level
    } else {
      return 0.02; // 2% base rate
    }
  data_type: percent
  description: "Progressive commission based on sales volume"

risk_score:
  type: formula
  expression: |
    // Multi-factor risk calculation
    let score = 0;
    
    // Credit score factor (40%)
    if (customer.credit_score < 600) {
      score += 40;
    } else if (customer.credit_score < 700) {
      score += 20;
    }
    
    // Amount factor (30%)
    if (amount > 100000) {
      score += 30;
    } else if (amount > 50000) {
      score += 15;
    }
    
    // History factor (30%)
    if (customer.payment_history === 'poor') {
      score += 30;
    } else if (customer.payment_history === 'fair') {
      score += 15;
    }
    
    return score;
  data_type: number
  description: "Risk score (0-100) based on multiple factors"
```

### 6.2 Financial Calculations

```yaml
net_present_value:
  type: formula
  expression: |
    // NPV calculation
    const rate = discount_rate / 100;
    const periods = duration_months / 12;
    return future_value / Math.pow(1 + rate, periods);
  data_type: currency
  description: "Net Present Value calculation"

compound_interest:
  type: formula
  expression: |
    // Compound interest: A = P(1 + r/n)^(nt)
    const P = principal;
    const r = annual_rate / 100;
    const n = 12; // monthly compounding
    const t = years;
    return P * Math.pow(1 + r / n, n * t);
  data_type: currency
  description: "Compound interest calculation"

amortization_payment:
  type: formula
  expression: |
    // Monthly payment calculation
    const P = loan_amount;
    const r = annual_rate / 100 / 12; // monthly rate
    const n = term_months;
    
    if (r === 0) return P / n;
    
    return P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  data_type: currency
  description: "Monthly loan payment"
```

### 6.3 Lookup Chains with Calculations

```yaml
account_weighted_score:
  type: formula
  expression: |
    (account.revenue * 0.4) + 
    (account.employee_count * 0.3) + 
    (account.industry_rank * 0.3)
  data_type: number
  description: "Weighted scoring based on account attributes"

territory_performance:
  type: formula
  expression: |
    const target = owner.territory.quota;
    const actual = owner.territory.actual_sales;
    return (actual / target) * 100;
  data_type: percent
  description: "Territory performance as percentage of quota"
```

## 7. Error Handling

### 7.1 Division by Zero

Always guard against division by zero:

```yaml
# BAD - Can cause error
average_bad:
  type: formula
  expression: "total / count"
  data_type: number

# GOOD - Safe division
average_good:
  type: formula
  expression: "count !== 0 ? total / count : 0"
  data_type: number

# GOOD - Returns null instead of zero
average_null:
  type: formula
  expression: "count !== 0 ? total / count : null"
  data_type: number
```

### 7.2 Null/Undefined Field References

```yaml
# BAD - Can fail if account is null
unsafe_name:
  type: formula
  expression: "account.name"
  data_type: text

# GOOD - Optional chaining
safe_name:
  type: formula
  expression: "account?.name ?? 'No Account'"
  data_type: text

# GOOD - Explicit null check
checked_name:
  type: formula
  expression: "account !== null ? account.name : 'N/A'"
  data_type: text
```

### 7.3 Type Coercion

Ensure proper type handling:

```yaml
# String to number
numeric_value:
  type: formula
  expression: "Number(text_value) || 0"
  data_type: number

# Number to string
string_value:
  type: formula
  expression: "String(numeric_value)"
  data_type: text

# Boolean conversion
bool_value:
  type: formula
  expression: "Boolean(value)"
  data_type: boolean
```

## 8. Performance Considerations

### 8.1 Optimization Guidelines

1. **Keep formulas simple** - Complex logic should be in hooks or actions
2. **Minimize nested lookups** - Each lookup requires a database join
3. **Cache expensive calculations** - Consider computed fields in the database
4. **Avoid recursive formulas** - Formulas cannot reference other formula fields

### 8.2 When NOT to Use Formulas

| Scenario | Use Instead |
|----------|-------------|
| Aggregations (SUM, COUNT) | Use `summary` field type |
| Async operations (API calls) | Use hooks or actions |
| Mutable calculations | Use regular fields + hooks |
| Complex business logic (>20 lines) | Use custom actions |
| Recursive calculations | Use hooks with database fields |

### 8.3 Formula Evaluation Timing

Formulas are evaluated:

- ✅ **During queries** - When the field is selected
- ✅ **In API responses** - Automatically included in serialized records
- ✅ **In validation rules** - Can be referenced in validation expressions
- ❌ **NOT during database writes** - Formulas are never stored

## 9. AI Context for Formulas

Formula fields support AI context to help AI tools understand business intent:

```yaml
total_revenue:
  type: formula
  expression: "unit_price * quantity * (1 - discount_rate)"
  data_type: currency
  
  # AI context for better understanding
  ai_context:
    intent: "Calculate total revenue after discounts"
    business_rule: "Revenue = Price × Quantity × (1 - Discount %)"
    examples:
      - description: "Standard order"
        inputs:
          unit_price: 100
          quantity: 5
          discount_rate: 0.1
        result: 450
      - description: "No discount"
        inputs:
          unit_price: 50
          quantity: 2
          discount_rate: 0
        result: 100
    algorithm: "Simple multiplication with discount factor"
    validation_notes: "Discount rate must be between 0 and 1"
```

## 10. Best Practices

### 10.1 Naming Conventions

```yaml
# GOOD - Clear, descriptive names
full_name:
  type: formula
  expression: "first_name + ' ' + last_name"
  data_type: text

days_until_due:
  type: formula
  expression: "due_date - $today"
  data_type: number

# BAD - Unclear names
calc_1:
  type: formula
  expression: "field_a + field_b"
  data_type: number
```

### 10.2 Documentation

Always include labels and descriptions:

```yaml
weighted_priority:
  type: formula
  expression: "(urgency * 0.4) + (impact * 0.4) + (customer_tier * 0.2)"
  data_type: number
  label: Weighted Priority Score
  description: "Calculated priority based on urgency (40%), impact (40%), and customer tier (20%)"
```

### 10.3 Defensive Programming

```yaml
# GOOD - Handles all edge cases
safe_percentage:
  type: formula
  expression: |
    if (total === 0 || total === null || total === undefined) {
      return 0;
    }
    const pct = (completed / total) * 100;
    return Math.min(100, Math.max(0, pct)); // Clamp to 0-100
  data_type: percent
  description: "Completion percentage, safely clamped to 0-100%"
```

### 10.4 Testing Formulas

Consider adding test cases in AI context:

```yaml
margin_percentage:
  type: formula
  expression: "((revenue - cost) / revenue) * 100"
  data_type: percent
  
  ai_context:
    test_cases:
      - input: { revenue: 100, cost: 70 }
        expected: 30
        description: "30% margin"
      - input: { revenue: 0, cost: 0 }
        expected: null
        description: "Zero revenue edge case"
      - input: { revenue: 100, cost: 100 }
        expected: 0
        description: "Zero margin"
```

## 11. TypeScript Types

Formula configuration is defined in `@objectql/types`:

```typescript
/**
 * Formula field configuration
 */
export interface FormulaFieldConfig extends BaseFieldConfig {
  type: 'formula';
  
  /** JavaScript expression to evaluate */
  expression: string;
  
  /** Expected return data type */
  data_type: 'number' | 'text' | 'date' | 'datetime' | 'boolean' | 'currency' | 'percent';
  
  /** Display format for numbers/dates */
  format?: string;
  
  /** Decimal precision for numeric results */
  precision?: number;
  
  /** Treat blank/null as zero in calculations */
  blank_as_zero?: boolean;
  
  /** Default value for null/undefined referenced fields */
  treat_blank_as?: any;
}

/**
 * Formula evaluation context
 */
export interface FormulaContext {
  /** Current record data */
  record: Record<string, any>;
  
  /** System variables ($today, $now, etc.) */
  system: {
    today: Date;
    now: Date;
    year: number;
    month: number;
    day: number;
    hour: number;
  };
  
  /** Current user context */
  current_user: {
    id: string;
    name?: string;
    email?: string;
    role?: string;
  };
  
  /** Record context flags */
  is_new: boolean;
}
```

## 12. Examples by Domain

### 12.1 E-Commerce

```yaml
# Product pricing
final_price:
  type: formula
  expression: "list_price * (1 - discount_rate) * (1 + tax_rate)"
  data_type: currency

# Inventory status
stock_status:
  type: formula
  expression: |
    if (quantity_available === 0) return 'Out of Stock';
    if (quantity_available < reorder_point) return 'Low Stock';
    return 'In Stock';
  data_type: text

# Customer lifetime value
lifetime_value:
  type: formula
  expression: "average_order_value * purchase_frequency * customer_lifespan_years"
  data_type: currency
```

### 12.2 Project Management

```yaml
# Project health
health_score:
  type: formula
  expression: |
    let score = 100;
    if ($today > due_date) score -= 30;
    if (budget_spent > budget * 0.8) score -= 20;
    if (tasks_completed / tasks_total < 0.5) score -= 20;
    return Math.max(0, score);
  data_type: number

# Days remaining
days_until_deadline:
  type: formula
  expression: "due_date - $today"
  data_type: number

# Budget utilization
budget_used_percentage:
  type: formula
  expression: "(budget_spent / budget) * 100"
  data_type: percent
```

### 12.3 CRM / Sales

```yaml
# Lead scoring
lead_score:
  type: formula
  expression: |
    (company_size * 0.3) + 
    (budget_level * 0.3) + 
    (engagement_level * 0.2) + 
    (timeline_urgency * 0.2)
  data_type: number

# Opportunity probability
win_probability:
  type: formula
  expression: |
    const baseProb = {
      'prospecting': 10,
      'qualification': 25,
      'proposal': 50,
      'negotiation': 75,
      'closed_won': 100,
      'closed_lost': 0
    };
    return baseProb[stage] || 0;
  data_type: percent

# Account tier classification
account_tier:
  type: formula
  expression: |
    if (annual_revenue > 10000000) return 'Enterprise';
    if (annual_revenue > 1000000) return 'Corporate';
    if (annual_revenue > 100000) return 'SMB';
    return 'Startup';
  data_type: text
```

### 12.4 HR / Employee Management

```yaml
# Years of service
years_of_service:
  type: formula
  expression: "($today - hire_date) / 365"
  data_type: number

# PTO remaining
pto_remaining:
  type: formula
  expression: "pto_accrued - pto_used"
  data_type: number

# Performance rating
overall_rating:
  type: formula
  expression: |
    (performance_score * 0.5) + 
    (attendance_score * 0.2) + 
    (peer_feedback_score * 0.3)
  data_type: number
```

## 13. Migration from Other Systems

### 13.1 From Salesforce Formula Fields

Salesforce formula syntax can be adapted to ObjectQL:

| Salesforce | ObjectQL Equivalent |
|------------|-------------------|
| `TODAY()` | `$today` |
| `NOW()` | `$now` |
| `$User.Id` | `$current_user.id` |
| `IF(condition, true_val, false_val)` | `condition ? true_val : false_val` |
| `ISBLANK(field)` | `field === null \|\| field === undefined` |
| `TEXT(number)` | `String(number)` |
| `VALUE(text)` | `Number(text)` |

### 13.2 From Excel Formulas

Common Excel patterns:

| Excel | ObjectQL Equivalent |
|-------|-------------------|
| `=A1+B1` | `field_a + field_b` |
| `=IF(A1>10,"High","Low")` | `field_a > 10 ? 'High' : 'Low'` |
| `=ROUND(A1,2)` | `Math.round(field_a * 100) / 100` |
| `=MAX(A1,B1,C1)` | `Math.max(field_a, field_b, field_c)` |

## 14. Related Documentation

- [Object Definition](./object.md) - Complete object metadata reference
- [Validation Rules](./validation.md) - Using formulas in validation rules
- [Query Language](./query-language.md) - Querying formula fields
- [Formulas & Rules Guide](../guide/formulas-and-rules.md) - Practical guide with examples

## 15. Limitations

### Current Limitations

1. **No recursion** - Formula fields cannot reference other formula fields
2. **No async operations** - Cannot make API calls or database queries
3. **No aggregations** - Use `summary` field type instead
4. **Limited to JavaScript subset** - Not all JavaScript features are supported
5. **Query-time only** - Cannot be used for database indexing or filtering at DB level

### Future Enhancements (Planned)

- Formula versioning and migration
- Formula debugging tools
- Performance profiling
- Formula dependencies graph
- Cross-formula references (controlled)
- Custom function libraries
