/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as vscode from 'vscode';
import { ObjectIndex } from '../services/ObjectIndex';

export class ObjectCompletionProvider implements vscode.CompletionItemProvider {
    constructor(private objectIndex: ObjectIndex) {}

    public provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
        const line = document.lineAt(position);
        const text = line.text;

        // Check if we are typing a value for "reference_to"
        // Regex to check if "reference_to:" is present and cursor is after it
        if (/reference_to:\s*$/.test(text.substring(0, position.character))) {
            const objects = this.objectIndex.getAllObjects();
            
            return objects.map(obj => {
                const item = new vscode.CompletionItem(obj.name, vscode.CompletionItemKind.Class);
                item.detail = 'ObjectQL Object';
                // Optional: verify if file exists to provide valid documentation
                item.documentation = new vscode.MarkdownString(`Reference to **${obj.name}** object defined in ` + 
                    `[${vscode.workspace.asRelativePath(obj.uri)}](${obj.uri})`);
                return item;
            });
        }

        return undefined;
    }
}
