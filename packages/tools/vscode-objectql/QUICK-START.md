# ObjectQL VSCode Extension - Quick Start Guide

## 🚀 Installation

### Option 1: Install from VSIX
```bash
cd packages/tools/vscode-objectql
code --install-extension vscode-objectql-0.1.0.vsix
```

### Option 2: Build from Source
```bash
cd packages/tools/vscode-objectql
npm install
npm run compile
npm run package
code --install-extension vscode-objectql-0.1.0.vsix
```

## 📋 What You Get

### 1. Smart Auto-Completion
When editing `.object.yml` files, you get intelligent suggestions:

**Field Types:**
- `text`, `textarea`, `markdown`, `html`
- `number`, `currency`, `percent`
- `date`, `datetime`, `time`
- `select`, `lookup`, `master_detail`
- `boolean`, `email`, `phone`, `url`
- `file`, `image`, `location`
- `formula`, `summary`, `auto_number`
- `object`, `vector`, `grid`

**Validation Operators:**
- `=`, `!=`, `>`, `>=`, `<`, `<=`
- `in`, `not_in`, `contains`, `not_contains`
- `starts_with`, `ends_with`

### 2. Code Snippets

Type these prefixes and press Tab:

#### Object & Field Snippets
```yaml
oql-object              # Complete object definition
oql-field-text          # Text field
oql-field-number        # Number field
oql-field-select        # Select with options
oql-field-lookup        # Relationship field
oql-field-datetime      # DateTime field
oql-field-email         # Email field
oql-field-currency      # Currency field
oql-field-file          # File attachment
oql-field-image         # Image field
oql-index               # Database index
oql-ai-search           # AI semantic search
```

#### Validation Snippets
```yaml
oql-validation-cross-field    # Cross-field validation
oql-validation-unique         # Uniqueness validation
oql-validation-business       # Business rule
oql-validation-state          # State machine
```

#### TypeScript Snippets
```typescript
oql-hook-beforeCreate    // Before create hook
oql-hook-afterCreate     // After create hook
oql-hook-beforeUpdate    // Before update hook
oql-hook-afterUpdate     // After update hook
oql-hook-beforeDelete    // Before delete hook
oql-hook-afterDelete     // After delete hook
oql-action-record        // Record-level action
oql-action-global        // Global action
oql-query                // Repository query
oql-create               // Create record
oql-update               // Update record
oql-error                // ObjectQL error
```

### 3. Quick Commands

Press `Ctrl+Shift+P` (or `Cmd+Shift+P`) and type "ObjectQL":

- **ObjectQL: New Object Definition** - Create new object with template
- **ObjectQL: New Validation Rules** - Create validation file
- **ObjectQL: New Permission Rules** - Create permission file
- **ObjectQL: New Application Config** - Create app config
- **ObjectQL: Validate Current File** - Validate against schema

### 4. Real-Time Validation

The extension validates your YAML files in real-time:

✅ **Valid Syntax:**
```yaml
name: product
label: Product
fields:
  name:
    type: text
    required: true
```

❌ **Invalid Syntax:**
```yaml
name: product
fields:
  name:
    type: invalid_type  # Error: Invalid field type
    required: "yes"     # Error: Should be boolean
```

Errors appear:
- Underlined in red in the editor
- Listed in the Problems panel (`Ctrl+Shift+M`)
- With helpful error messages on hover

### 5. File Icons

ObjectQL files get custom icons in the Explorer:
- 📊 `.object.yml` - Database table icon
- ✅ `.validation.yml` - Checkmark icon
- 🔒 `.permission.yml` - Lock icon
- 📱 `.app.yml` - Application icon

## 💡 Usage Examples

### Example 1: Create a Product Object

1. Press `Ctrl+Shift+P`
2. Type "ObjectQL: New Object"
3. Enter "product"
4. Edit the generated template:

```yaml
name: product
label: Product
description: "Product catalog item"

fields:
  name:
    type: text
    label: Product Name
    required: true
    searchable: true
  
  price:
    type: currency
    label: Price
    required: true
    min: 0
  
  category:
    type: select
    label: Category
    options:
      - label: Electronics
        value: electronics
      - label: Clothing
        value: clothing
```

### Example 2: Add Field with Snippet

1. In an `.object.yml` file, type `oql-field-select`
2. Press Tab
3. Fill in the placeholders:
   - Field name: `status`
   - Label: `Status`
   - Options: `Draft`, `Published`, `Archived`

Result:
```yaml
status:
  type: select
  label: Status
  options:
    - label: Draft
      value: draft
    - label: Published
      value: published
  defaultValue: draft
```

### Example 3: Add Validation

1. Type `oql-validation-cross-field`
2. Press Tab
3. Configure the rule:

```yaml
validation:
  rules:
    - name: price_positive
      type: cross_field
      message: "Price must be greater than 0"
      rule:
        field: price
        operator: ">"
        value: 0
      trigger: [create, update]
      severity: error
```

### Example 4: Create a Hook

1. Create `product.hook.ts`
2. Type `oql-hook-beforeCreate`
3. Press Tab
4. Implement your logic:

```typescript
import { HookContext, ObjectQLError } from '@objectql/types';

export async function beforeCreate(ctx: HookContext): Promise<void> {
  const { doc } = ctx;
  
  // Auto-generate SKU
  if (!doc.sku) {
    doc.sku = `PRD-${Date.now()}`;
  }
  
  // Set timestamps
  doc.created_at = new Date();
}
```

## ⚙️ Configuration

Add to your VS Code settings (`.vscode/settings.json`):

```json
{
  "objectql.validation.enabled": true,
  "objectql.completion.enabled": true,
  "objectql.diagnostics.enabled": true,
  
  "yaml.schemas": {
    "./packages/tools/vscode-objectql/schemas/object.schema.json": "*.object.yml",
    "./packages/tools/vscode-objectql/schemas/app.schema.json": "*.app.yml"
  }
}
```

## 🎯 Pro Tips

1. **Use Tab Navigation**: After inserting a snippet, press Tab to jump between placeholders
2. **Check Problems Panel**: Always check the Problems panel for validation errors
3. **Hover for Help**: Hover over field names to see documentation
4. **Command Palette**: Use `Ctrl+Shift+P` for quick access to all commands
5. **Auto-Save**: Enable auto-save to see validation in real-time

## 🐛 Troubleshooting

**Snippets not appearing?**
- Make sure you're in a YAML or TypeScript file
- Check that `objectql.completion.enabled` is true
- Try reloading the window (`Developer: Reload Window`)

**Validation not working?**
- Install the Red Hat YAML extension
- Check that the file extension is correct (`.object.yml`, not `.object.yaml`)
- Verify `objectql.validation.enabled` is true

**Extension not activating?**
- Open a folder/workspace (not just a file)
- Create or open an ObjectQL file (`.object.yml`)
- Check the Output panel → Extension Host for errors

## 📚 Next Steps

- Read the [complete README](README.md) for all features
- Check [INSTALL.md](INSTALL.md) for detailed installation
- See [CONTRIBUTING.md](CONTRIBUTING.md) to contribute
- Review [IMPLEMENTATION-SUMMARY.md](IMPLEMENTATION-SUMMARY.md) for technical details

## 🎉 You're Ready!

Start creating ObjectQL metadata files with full IDE support:
- ✅ IntelliSense
- ✅ Validation
- ✅ Snippets
- ✅ Quick commands
- ✅ File icons

Happy coding! 🚀
