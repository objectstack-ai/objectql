# ObjectQL - Visual Studio Code Extension

![ObjectQL Logo](images/icon.svg)

**The Standard Protocol for AI Software Generation**

Enhance your development experience with ObjectQL metadata files through intelligent code completion, validation, and snippets.

---

## ✨ Features

### 🎯 Intelligent IntelliSense

- **Auto-completion** for ObjectQL YAML files (`.object.yml`, `.validation.yml`, `.permission.yml`, `.app.yml`)
- **JSON Schema validation** with inline error reporting
- **Context-aware suggestions** based on file type and cursor position

### 📝 Code Snippets

**Object Definition Snippets:**
- `oql-object` - Complete object definition template
- `oql-field-text` - Text field
- `oql-field-number` - Number field
- `oql-field-select` - Select field with options
- `oql-field-lookup` - Relationship field
- `oql-field-datetime` - DateTime field
- `oql-field-email` - Email field
- `oql-field-file` - File attachment field
- `oql-field-image` - Image field
- `oql-index` - Database index definition
- `oql-ai-search` - AI semantic search configuration

**Validation Snippets:**
- `oql-validation-cross-field` - Cross-field validation
- `oql-validation-unique` - Uniqueness validation
- `oql-validation-business` - Business rule validation
- `oql-validation-state` - State machine validation

**TypeScript Hook & Action Snippets:**
- `oql-hook-beforeCreate` - Before create hook
- `oql-hook-afterCreate` - After create hook
- `oql-hook-beforeUpdate` - Before update hook
- `oql-hook-afterUpdate` - After update hook
- `oql-hook-beforeDelete` - Before delete hook
- `oql-hook-afterDelete` - After delete hook
- `oql-action-record` - Record-level action
- `oql-action-global` - Global action
- `oql-query` - Repository query
- `oql-create` - Create record
- `oql-update` - Update record

### 🎨 File Type Recognition

Custom icons and language associations for ObjectQL metadata files:
- `*.object.yml` - Object definitions
- `*.validation.yml` - Validation rules
- `*.permission.yml` - Permission rules
- `*.app.yml` - Application configuration
- `*.hook.ts` - Hook implementations
- `*.action.ts` - Action implementations

### ⚡ Quick Commands

Access via Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

- **ObjectQL: New Object Definition** - Create a new object from template
- **ObjectQL: New Validation Rules** - Create validation rules file
- **ObjectQL: New Permission Rules** - Create permission rules file
- **ObjectQL: New Application Config** - Create app configuration
- **ObjectQL: Validate Current File** - Validate current ObjectQL file

### 🔍 Schema Validation

Real-time validation against ObjectQL JSON schemas:
- Syntax checking
- Type validation
- Required field validation
- Enum value validation
- Instant feedback in Problems panel

---

## 🚀 Getting Started

### Prerequisites

This extension works best with:
- **Red Hat YAML** extension (`redhat.vscode-yaml`) - Recommended for YAML language support

The extension will prompt you to install the YAML extension if it's not already installed.

### Installation

#### From VSIX File

1. Download the latest `.vsix` file from releases
2. Open VS Code
3. Go to Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
4. Click the "..." menu → "Install from VSIX..."
5. Select the downloaded `.vsix` file

#### From Source

```bash
cd packages/tools/vscode-objectql
npm install
npm run compile
npm run package
```

This creates a `vscode-objectql-0.1.0.vsix` file that you can install.

---

## 📖 Usage

### Creating a New Object

1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Type "ObjectQL: New Object Definition"
3. Enter object name (e.g., `account`, `project`)
4. A new file is created with a complete template

**Example Output:**

```yaml
# ObjectQL Object Definition
name: account
label: Account
description: "Account object"

fields:
  name:
    type: text
    label: Name
    required: true
    searchable: true
  
  status:
    type: select
    label: Status
    options:
      - label: Active
        value: active
      - label: Inactive
        value: inactive
    defaultValue: active
```

### Using Snippets

Start typing in a YAML file:

1. Type `oql-field-` and see available field snippets
2. Select the desired field type
3. Tab through placeholders to customize

**Example - Adding a lookup field:**

```yaml
fields:
  owner:  # Type 'oql-field-lookup' and press Enter
    type: lookup
    label: Owner
    reference_to: users
    required: true
```

### Validation in Real-Time

As you type, the extension validates your YAML against ObjectQL schemas:

- ✅ Valid fields show no errors
- ❌ Invalid fields are underlined in red
- 💡 Hover over errors for detailed messages
- 📋 View all issues in the Problems panel

---

## ⚙️ Configuration

Configure the extension through VS Code settings:

```json
{
  "objectql.validation.enabled": true,
  "objectql.completion.enabled": true,
  "objectql.diagnostics.enabled": true,
  "objectql.trace.server": "off"
}
```

### Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `objectql.validation.enabled` | boolean | `true` | Enable schema validation |
| `objectql.completion.enabled` | boolean | `true` | Enable auto-completion |
| `objectql.diagnostics.enabled` | boolean | `true` | Enable diagnostics |
| `objectql.trace.server` | string | `"off"` | Language server trace level |

---

## 🎓 Examples

### Complete Object with Validation

```yaml
name: opportunity
label: Opportunity
description: "Sales opportunity tracking"

fields:
  name:
    type: text
    label: Opportunity Name
    required: true
    searchable: true
  
  amount:
    type: currency
    label: Amount
    min: 0
  
  close_date:
    type: date
    label: Close Date
    required: true
  
  stage:
    type: select
    label: Stage
    options:
      - label: Prospecting
        value: prospecting
      - label: Qualification
        value: qualification
      - label: Proposal
        value: proposal
      - label: Closed Won
        value: closed_won
      - label: Closed Lost
        value: closed_lost
    defaultValue: prospecting
  
  account:
    type: lookup
    label: Account
    reference_to: accounts
    required: true

validation:
  rules:
    - name: positive_amount
      type: cross_field
      message: "Amount must be positive"
      rule:
        field: amount
        operator: ">"
        value: 0
      trigger: [create, update]

indexes:
  stage_date:
    fields: [stage, close_date]
```

---

## 🔗 Resources

- **Documentation:** [ObjectQL Docs](https://github.com/objectstack-ai/objectql)
- **Repository:** [GitHub](https://github.com/objectstack-ai/objectql)
- **Issues:** [Report a Bug](https://github.com/objectstack-ai/objectql/issues)
- **Website:** [objectql.org](https://www.objectql.org)

---

## 🤝 Contributing

Contributions are welcome! Please see the main repository for contribution guidelines.

---

## 📄 License

MIT License - see [LICENSE](../../../LICENSE) for details.

---

## 🙏 Acknowledgments

- Built on the **ObjectQL** protocol and runtime
- Uses **Red Hat YAML** extension for YAML language support
- Part of the **ObjectStack AI** ecosystem

---

<div align="center">

**ObjectQL** • **ObjectOS** • **Object UI**

*The Trinity of AI-Native Software Generation*

</div>
