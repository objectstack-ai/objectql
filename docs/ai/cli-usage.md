# AI-Powered CLI

The ObjectQL CLI provides AI-powered commands to generate and validate applications using natural language.

## Overview

The `objectql ai` command provides interactive and automated application generation with built-in validation and testing.

## Prerequisites

Set your OpenAI API key as an environment variable:

```bash
export OPENAI_API_KEY=sk-your-api-key-here
```

## Commands

### Interactive Mode (Default)

The easiest way to build applications - just type:

```bash
objectql ai
```

This starts an interactive conversational session where you can:
- Describe what you want to build in natural language
- Request changes and improvements iteratively
- Get suggestions for next steps
- See files generated in real-time

**Example Session:**

```
$ objectql ai
💬 ObjectQL AI Assistant

What would you like to build today?
> A blog system with posts, comments, and categories

Great! I'll create a blog system for you...
✓ Generated: post.object.yml
✓ Generated: comment.object.yml  
✓ Generated: category.object.yml
✓ Generated: post.hook.ts
✓ Generated: post.test.ts

What would you like to add or modify?
> Add tags to posts

Adding tag support...
✓ Generated: tag.object.yml
✓ Updated: post.object.yml

Type "done" to finish, or continue refining your app.
> done

📁 Application saved to ./src
```

**Specify Output Directory:**

```bash
objectql ai ./my-app
```

### One-Shot Generation

Generate a complete application from a single description without interaction:

```bash
objectql ai generate -d "A CRM system with customers, contacts, and opportunities" -o ./src
```

**Options:**
- `-d, --description <text>` - Application description (required)
- `-o, --output <path>` - Output directory (default: `./src`)
- `-t, --type <type>` - Generation type: `basic`, `complete`, or `custom` (default: `custom`)

**Generation Types:**

- `basic` - Minimal metadata (objects only)
- `complete` - Full metadata (objects, forms, views, actions, hooks, tests)
- `custom` - AI decides based on description (recommended)

**Examples:**

```bash
# Generate complete CRM
objectql ai generate \
  -d "Customer relationship management with sales pipeline" \
  -t complete \
  -o ./crm

# Generate simple inventory tracker
objectql ai generate \
  -d "Track products with quantities and locations" \
  -t basic

# Let AI decide what's needed
objectql ai generate \
  -d "E-commerce platform with products, orders, and payments"
```

**What Gets Generated:**

For a `complete` application, you get:

1. **Metadata Files (YAML)**
   - `*.object.yml` - Data entities
   - `*.validation.yml` - Validation rules
   - `*.form.yml` - Data entry forms
   - `*.view.yml` - List views
   - `*.page.yml` - UI pages
   - `*.menu.yml` - Navigation
   - `*.permission.yml` - Access control

2. **TypeScript Implementation Files**
   - `*.action.ts` - Custom business operations
   - `*.hook.ts` - Lifecycle triggers (beforeCreate, afterUpdate, etc.)

3. **Test Files**
   - `*.test.ts` - Jest tests for business logic

### Validation

Validate existing metadata files with AI-powered analysis:

```bash
objectql ai validate ./src
```

**Options:**
- `<path>` - Path to metadata directory (required)
- `--fix` - Automatically fix issues where possible
- `-v, --verbose` - Show detailed validation output

**What Gets Checked:**
- ✅ YAML syntax
- ✅ ObjectQL specification compliance
- ✅ Business logic consistency
- ✅ Data model best practices
- ✅ Security considerations
- ✅ Performance implications
- ✅ Field type correctness
- ✅ Relationship integrity

**Example:**

```bash
$ objectql ai validate ./src -v

🔍 Validating metadata files...

✓ user.object.yml - Valid
⚠ order.object.yml - 2 warnings
  - Line 15: Consider adding index on 'customer_id' field for query performance
  - Line 23: 'total' field should use 'currency' type instead of 'number'
  
❌ product.object.yml - 1 error
  - Line 10: Invalid field type 'string', use 'text' instead

📊 Summary:
  Files checked: 3
  Errors: 1
  Warnings: 2
  Info: 0
```

### Chat Assistant

Get help and guidance about ObjectQL concepts:

```bash
objectql ai chat
```

**With Initial Prompt:**

```bash
objectql ai chat -p "How do I create a lookup relationship?"
```

**Example Session:**

```
$ objectql ai chat
🤖 ObjectQL AI Assistant

Ask me anything about ObjectQL!
> How do I add email validation to a field?

You can add email validation in several ways:

1. Use the built-in 'email' field type:
   fields:
     email:
       type: email
       required: true

2. Or add validation rules:
   fields:
     contact_email:
       type: text
       validation:
         format: email
         
> What about custom validation logic?

For custom validation, use a validation hook...
```

## Complete Workflow Example

Here's a complete workflow from generation to deployment:

```bash
# 1. Set API key
export OPENAI_API_KEY=sk-your-key

# 2. Generate application (interactive)
objectql ai
> A project management system with tasks, projects, and teams
> done

# 3. Validate generated files
objectql ai validate ./src -v

# 4. Fix any issues
objectql ai validate ./src --fix

# 5. Test the application
objectql serve

# 6. Get help if needed
objectql ai chat -p "How do I add user authentication?"
```

## Tips & Best Practices

### Writing Good Descriptions

**Good:**
```bash
objectql ai generate -d "Inventory management with products, warehouses, stock movements, and reorder points. Include barcode scanning support and low stock alerts."
```

**Not as good:**
```bash
objectql ai generate -d "inventory app"
```

**Tips:**
- Be specific about entities and relationships
- Mention key features and business rules
- Include any special requirements (e.g., "with approval workflow")
- Specify important fields or attributes

### Interactive vs One-Shot

Use **Interactive Mode** when:
- Building a new application from scratch
- Exploring different design options
- Need to make iterative refinements
- Want AI guidance and suggestions

Use **One-Shot Generation** when:
- You have a clear, detailed requirements document
- Building a simple, well-defined system
- Automating app generation in scripts
- Need quick prototypes

### Validation Workflow

Always validate generated files:

```bash
# After generation
objectql ai generate -d "..." -o ./src

# Validate
objectql ai validate ./src -v

# Auto-fix common issues
objectql ai validate ./src --fix

# Manually review any remaining issues
```

## Environment Variables

- `OPENAI_API_KEY` - Your OpenAI API key (required)
- `OPENAI_MODEL` - Model to use (optional, default: `gpt-4`)
- `OPENAI_TEMPERATURE` - Generation temperature 0-1 (optional, default: `0.7`)

## Fallback Behavior

Without an API key, the CLI will:
- ✅ Still perform basic YAML syntax validation
- ❌ Cannot generate applications
- ❌ Cannot perform AI-powered deep validation
- ❌ Chat assistant unavailable

```bash
# This still works without API key:
objectql ai validate ./src  # Basic YAML syntax check only
```

## Next Steps

- Read [Programmatic API](/ai/programmatic-api) to use AI agent in your code
- Check [Generating Apps](/ai/generating-apps) for advanced prompting techniques
- See [Building Apps](/ai/building-apps) to use ObjectQL in AI applications
