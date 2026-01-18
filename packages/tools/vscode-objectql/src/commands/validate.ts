/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as vscode from 'vscode';
import * as path from 'path';

export async function validateCurrentFile() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('No active editor');
    return;
  }

  const document = editor.document;
  const fileName = path.basename(document.fileName);

  // Check if it's an ObjectQL file
  const objectqlFilePattern = /\.(object|validation|permission|workflow)\.(yml|yaml)$/;
  if (!objectqlFilePattern.test(fileName)) {
    vscode.window.showWarningMessage('This is not an ObjectQL metadata file');
    return;
  }

  // Trigger validation by saving
  await document.save();
  
  vscode.window.showInformationMessage('Validation complete. Check Problems panel for issues.');
}
