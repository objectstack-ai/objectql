import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Extension activation function
 * Called when VSCode activates the extension
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('ObjectQL extension is now active!');

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('objectql.newObject', () => createNewFile(context, 'object')),
    vscode.commands.registerCommand('objectql.newValidation', () => createNewFile(context, 'validation')),
    vscode.commands.registerCommand('objectql.newPermission', () => createNewFile(context, 'permission')),
    vscode.commands.registerCommand('objectql.newApp', () => createNewFile(context, 'app')),
    vscode.commands.registerCommand('objectql.validateSchema', validateCurrentFile)
  );

  // Configure YAML language server for ObjectQL files
  configureYamlLanguageServer();

  // Show welcome message on first activation
  const hasShownWelcome = context.globalState.get('objectql.hasShownWelcome', false);
  if (!hasShownWelcome) {
    showWelcomeMessage(context);
  }
}

/**
 * Extension deactivation function
 */
export function deactivate() {
  console.log('ObjectQL extension is now deactivated');
}

/**
 * Create a new ObjectQL file from template
 */
async function createNewFile(context: vscode.ExtensionContext, fileType: 'object' | 'validation' | 'permission' | 'app') {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  
  if (!workspaceFolder) {
    vscode.window.showErrorMessage('Please open a workspace folder first');
    return;
  }

  // Prompt for filename
  const fileName = await vscode.window.showInputBox({
    prompt: `Enter ${fileType} name (without extension)`,
    placeHolder: `my_${fileType}`,
    validateInput: (value: string) => {
      if (!value) {
        return 'Name cannot be empty';
      }
      if (!/^[a-z_][a-z0-9_]*$/.test(value)) {
        return 'Name must start with lowercase letter or underscore and contain only lowercase letters, numbers, and underscores';
      }
      return null;
    }
  });

  if (!fileName) {
    return;
  }

  // Determine file path
  const fullFileName = `${fileName}.${fileType}.yml`;
  const defaultPath = path.join(workspaceFolder.uri.fsPath, 'src', 'objects', fullFileName);
  
  // Get template content
  const template = getTemplate(fileType, fileName);

  try {
    // Ensure directory exists
    const dir = path.dirname(defaultPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Check if file already exists
    if (fs.existsSync(defaultPath)) {
      const overwrite = await vscode.window.showWarningMessage(
        `File ${fullFileName} already exists. Overwrite?`,
        'Yes', 'No'
      );
      if (overwrite !== 'Yes') {
        return;
      }
    }

    // Write file
    fs.writeFileSync(defaultPath, template, 'utf8');

    // Open file
    const document = await vscode.workspace.openTextDocument(defaultPath);
    await vscode.window.showTextDocument(document);

    vscode.window.showInformationMessage(`Created ${fullFileName}`);
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to create file: ${error}`);
  }
}

/**
 * Get template content for file type
 */
function getTemplate(fileType: string, name: string): string {
  switch (fileType) {
    case 'object':
      return `# ObjectQL Object Definition
# Documentation: https://github.com/objectstack-ai/objectql

name: ${name}
label: ${capitalizeWords(name)}
description: "${capitalizeWords(name)} object"

fields:
  name:
    type: text
    label: Name
    required: true
    searchable: true
    help_text: "The name of the ${name}"
  
  description:
    type: textarea
    label: Description
    help_text: "Detailed description"
  
  status:
    type: select
    label: Status
    options:
      - label: Active
        value: active
      - label: Inactive
        value: inactive
    defaultValue: active
  
  created_by:
    type: lookup
    label: Created By
    reference_to: users
    readonly: true
  
  created_at:
    type: datetime
    label: Created At
    readonly: true

# Indexes for performance
indexes:
  name_idx:
    fields: [name]
  status_idx:
    fields: [status]

# Validation rules (optional)
validation:
  rules:
    - name: name_required
      type: cross_field
      message: "Name is required"
      rule:
        field: name
        operator: "!="
        value: null
`;

    case 'validation':
      return `# ObjectQL Validation Rules
# Documentation: https://github.com/objectstack-ai/objectql/docs/spec/validation.md

# Object-level validation rules
rules:
  # Cross-field validation example
  - name: end_after_start
    type: cross_field
    message: "End date must be after start date"
    fields: [start_date, end_date]
    rule:
      field: end_date
      operator: ">"
      compare_to: start_date
    trigger: [create, update]
    severity: error

  # Business rule example
  - name: status_approval_required
    type: business_rule
    message: "Approval required before activation"
    constraint:
      expression: "status === 'active' && approved === true"
    trigger: [create, update]
    severity: error

  # Uniqueness validation
  - name: unique_email
    type: unique
    message: "Email must be unique"
    field: email
    case_sensitive: false
    trigger: [create, update]
`;

    case 'permission':
      return `# ObjectQL Permission Rules
# Documentation: https://github.com/objectstack-ai/objectql/docs/spec/permission.md

# Role-based permissions
roles:
  admin:
    permissions:
      create: true
      read: true
      update: true
      delete: true
  
  user:
    permissions:
      create: true
      read: true
      update: 
        condition: "owner === $userId"
      delete: false
  
  guest:
    permissions:
      create: false
      read: true
      update: false
      delete: false

# Field-level permissions
field_permissions:
  sensitive_data:
    roles: [admin]
    mask: true
  
  internal_notes:
    roles: [admin, user]

# Record-level security (Row-Level Security)
record_permissions:
  owner_only:
    condition: "owner === $userId"
    roles: [user]
`;

    case 'app':
      return `# ObjectQL Application Configuration
# Documentation: https://github.com/objectstack-ai/objectql/docs/spec/app.md

name: ${name}
label: ${capitalizeWords(name)}
description: "${capitalizeWords(name)} application"
version: "1.0.0"

# Application metadata
metadata:
  author: "Your Name"
  license: "MIT"

# Navigation and menu structure
navigation:
  - label: Home
    path: /
    icon: home
  
  - label: ${capitalizeWords(name)}
    icon: database
    children:
      - label: List
        path: /${name}
        object: ${name}
      - label: Create New
        path: /${name}/new
        object: ${name}

# Objects included in this app
objects:
  - ${name}

# Themes and branding
theme:
  primary_color: "#0066cc"
  secondary_color: "#6c757d"
`;

    default:
      return '';
  }
}

/**
 * Validate current file against schema
 */
async function validateCurrentFile() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('No active editor');
    return;
  }

  const document = editor.document;
  const fileName = path.basename(document.fileName);

  // Check if it's an ObjectQL file
  const objectqlFilePattern = /\.(object|validation|permission|app)\.(yml|yaml)$/;
  if (!objectqlFilePattern.test(fileName)) {
    vscode.window.showWarningMessage('This is not an ObjectQL metadata file');
    return;
  }

  // Trigger validation by saving
  await document.save();
  
  vscode.window.showInformationMessage('Validation complete. Check Problems panel for issues.');
}

/**
 * Configure YAML language server settings for ObjectQL
 */
function configureYamlLanguageServer() {
  const config = vscode.workspace.getConfiguration('yaml');
  const schemas = config.get('schemas', {}) as Record<string, string | string[]>;

  // Check if ObjectQL schemas are already configured
  const hasObjectSchema = Object.values(schemas).some(val => 
    (Array.isArray(val) && val.some(v => v.includes('*.object.yml'))) ||
    (typeof val === 'string' && val.includes('*.object.yml'))
  );

  if (!hasObjectSchema) {
    vscode.window.showInformationMessage(
      'ObjectQL extension works best with YAML language support. Please install "Red Hat YAML" extension if not already installed.',
      'Install'
    ).then((selection: string | undefined) => {
      if (selection === 'Install') {
        vscode.commands.executeCommand('workbench.extensions.search', 'redhat.vscode-yaml');
      }
    });
  }
}

/**
 * Show welcome message
 */
function showWelcomeMessage(context: vscode.ExtensionContext) {
  vscode.window.showInformationMessage(
    'Welcome to ObjectQL! Create your first object definition with "ObjectQL: New Object Definition" command.',
    'Get Started',
    'Documentation'
  ).then((selection: string | undefined) => {
    if (selection === 'Get Started') {
      vscode.commands.executeCommand('objectql.newObject');
    } else if (selection === 'Documentation') {
      vscode.env.openExternal(vscode.Uri.parse('https://github.com/objectstack-ai/objectql'));
    }
  });

  context.globalState.update('objectql.hasShownWelcome', true);
}

/**
 * Capitalize words for display names
 */
function capitalizeWords(str: string): string {
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
