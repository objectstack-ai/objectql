"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
/**
 * Extension activation function
 * Called when VSCode activates the extension
 */
function activate(context) {
    console.log('ObjectQL extension is now active!');
    // Register commands
    context.subscriptions.push(vscode.commands.registerCommand('objectql.newObject', () => createNewFile(context, 'object')), vscode.commands.registerCommand('objectql.newValidation', () => createNewFile(context, 'validation')), vscode.commands.registerCommand('objectql.newPermission', () => createNewFile(context, 'permission')), vscode.commands.registerCommand('objectql.newApp', () => createNewFile(context, 'app')), vscode.commands.registerCommand('objectql.validateSchema', validateCurrentFile));
    // Show welcome message on first activation
    const hasShownWelcome = context.globalState.get('objectql.hasShownWelcome', false);
    if (!hasShownWelcome) {
        showWelcomeMessage(context);
    }
}
/**
 * Extension deactivation function
 */
function deactivate() {
    console.log('ObjectQL extension is now deactivated');
}
/**
 * Create a new ObjectQL file from template
 */
async function createNewFile(context, fileType) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('Please open a workspace folder first');
        return;
    }
    // Prompt for filename
    const fileName = await vscode.window.showInputBox({
        prompt: `Enter ${fileType} name (without extension)`,
        placeHolder: `my_${fileType}`,
        validateInput: (value) => {
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
    // Guess the location based on standard folder structure
    let folder = 'src';
    if (fileType === 'object') {
        folder = 'src/objects';
    }
    else if (fileType === 'app') {
        folder = 'src';
    }
    const fullFileName = `${fileName}.${fileType}.yml`;
    const defaultPath = path.join(workspaceFolder.uri.fsPath, folder, fullFileName);
    // Get template content
    const template = getTemplate(context, fileType, fileName);
    try {
        // Ensure directory exists
        const dir = path.dirname(defaultPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        // Check if file already exists
        if (fs.existsSync(defaultPath)) {
            const overwrite = await vscode.window.showWarningMessage(`File ${fullFileName} already exists. Overwrite?`, 'Yes', 'No');
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
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to create file: ${error}`);
    }
}
/**
 * Get template content for file type from template files
 */
function getTemplate(context, fileType, name) {
    try {
        // Check if we are running from 'out' or 'src'
        // Usually extension path is the root of the package.
        let templatePath = path.join(context.extensionPath, 'src', 'templates', `${fileType}.template.yml`);
        // Fallback if not found (maybe flattened or in out)
        if (!fs.existsSync(templatePath)) {
            templatePath = path.join(context.extensionPath, 'out', 'templates', `${fileType}.template.yml`);
        }
        if (fs.existsSync(templatePath)) {
            let content = fs.readFileSync(templatePath, 'utf8');
            content = content.replace(/{{name}}/g, name);
            content = content.replace(/{{label}}/g, capitalizeWords(name));
            return content;
        }
        // Fallback to hardcoded string if file read fails (Safety net)
        console.warn(`Template file not found at ${templatePath}, utilizing fallback.`);
        return getFallbackTemplate(fileType, name);
    }
    catch (e) {
        console.error('Error reading template:', e);
        return getFallbackTemplate(fileType, name);
    }
}
function getFallbackTemplate(fileType, name) {
    // Minimal fallback
    return `# ${capitalizeWords(name)} ${fileType}\nname: ${name}\n`;
}
/**
 * Validate current file by saving (triggers schema validation)
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
 * Show welcome message
 */
function showWelcomeMessage(context) {
    vscode.window.showInformationMessage('Welcome to ObjectQL! Create your first object definition with "ObjectQL: New Object Definition" command.', 'Get Started', 'Documentation').then((selection) => {
        if (selection === 'Get Started') {
            vscode.commands.executeCommand('objectql.newObject');
        }
        else if (selection === 'Documentation') {
            vscode.env.openExternal(vscode.Uri.parse('https://github.com/objectstack-ai/objectql'));
        }
    });
    context.globalState.update('objectql.hasShownWelcome', true);
}
/**
 * Capitalize words for display names
 */
function capitalizeWords(str) {
    return str
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}
//# sourceMappingURL=extension.js.map