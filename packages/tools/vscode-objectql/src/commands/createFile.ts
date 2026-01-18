/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export async function createNewFile(
    context: vscode.ExtensionContext, 
    fileType: 'object' | 'validation' | 'permission' | 'workflow'
) {
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

  // Determine file path based on "AI-Native" folder structure
  let folder = 'src';
  if (fileType === 'object') {
     folder = 'src/objects';
  } else if (fileType === 'workflow') {
     folder = 'src/workflows';
  }
  
  const fullFileName = `${fileName}.${fileType}.yml`;
  const defaultPath = vscode.Uri.joinPath(workspaceFolder.uri, folder, fullFileName);
  
  // Get template content
  const template = getTemplate(context, fileType, fileName);

  try {
    // Check if file already exists
    try {
        await vscode.workspace.fs.stat(defaultPath);
        const overwrite = await vscode.window.showWarningMessage(
            `File ${fullFileName} already exists. Overwrite?`,
            'Yes', 'No'
        );
        if (overwrite !== 'Yes') {
            return;
        }
    } catch {
        // File does not exist, proceed
    }
    
    // Write file
    const edit = new vscode.WorkspaceEdit();
    edit.createFile(defaultPath, { overwrite: true, ignoreIfExists: false });
    edit.insert(defaultPath, new vscode.Position(0, 0), template);
    
    const success = await vscode.workspace.applyEdit(edit);

    if (success) {
        // Open file
        const document = await vscode.workspace.openTextDocument(defaultPath);
        await vscode.window.showTextDocument(document);
        vscode.window.showInformationMessage(`Created ${fullFileName}`);
    } else {
        vscode.window.showErrorMessage(`Failed to create file: ${fullFileName}`);
    }

  } catch (error) {
    vscode.window.showErrorMessage(`Failed to create file: ${error}`);
  }
}

function getTemplate(context: vscode.ExtensionContext, fileType: string, name: string): string {
    try {
      // Look for templates in the 'templates' folder at the root of the extension
      let templatePath = vscode.Uri.joinPath(context.extensionUri, 'templates', `${fileType}.template.yml`).fsPath;
      
      if (fs.existsSync(templatePath)) {
          let content = fs.readFileSync(templatePath, 'utf8');
          content = content.replace(/{{name}}/g, name);
          content = content.replace(/{{label}}/g, capitalizeWords(name));
          return content;
      } 
  
      return getFallbackTemplate(fileType, name);
    } catch (e) {
        console.error('Error reading template:', e);
        return getFallbackTemplate(fileType, name);
    }
  }
  
function getFallbackTemplate(fileType: string, name: string): string {
    return `# ${capitalizeWords(name)} ${fileType}\nname: ${name}\n`;
}

function capitalizeWords(str: string): string {
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
