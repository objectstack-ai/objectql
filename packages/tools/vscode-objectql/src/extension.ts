/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as vscode from 'vscode';
import { createNewFile } from './commands/createFile';
import { validateCurrentFile } from './commands/validate';
import { ObjectIndex } from './services/ObjectIndex';
import { ObjectDefinitionProvider } from './providers/ObjectDefinitionProvider';
import { ObjectCompletionProvider } from './providers/ObjectCompletionProvider';
import { LANGUAGES, SCHEMES } from './utils/constants';

let objectIndex: ObjectIndex;

/**
 * Extension activation function
 * Called when VSCode activates the extension
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('ObjectQL extension is now active!');

  // Initialize Services
  objectIndex = new ObjectIndex();

  // Register Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('objectql.newObject', () => createNewFile(context, 'object')),
    vscode.commands.registerCommand('objectql.newValidation', () => createNewFile(context, 'validation')),
    vscode.commands.registerCommand('objectql.newPermission', () => createNewFile(context, 'permission')),
    vscode.commands.registerCommand('objectql.newWorkflow', () => createNewFile(context, 'workflow')),
    vscode.commands.registerCommand('objectql.validateSchema', validateCurrentFile)
  );

  // Register Providers
  const selector = { language: LANGUAGES.YAML, scheme: SCHEMES.FILE };
  
  context.subscriptions.push(
      vscode.languages.registerDefinitionProvider(selector, new ObjectDefinitionProvider(objectIndex)),
      vscode.languages.registerCompletionItemProvider(selector, new ObjectCompletionProvider(objectIndex), ' ')
  );

  // Clean up
  context.subscriptions.push(objectIndex);

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
  if (objectIndex) {
      objectIndex.dispose();
  }
  console.log('ObjectQL extension is now deactivated');
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
