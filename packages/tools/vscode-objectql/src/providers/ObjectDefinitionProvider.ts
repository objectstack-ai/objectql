/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as vscode from 'vscode';
import { ObjectIndex } from '../services/ObjectIndex';

export class ObjectDefinitionProvider implements vscode.DefinitionProvider {
    constructor(private objectIndex: ObjectIndex) {}

    public navigateTo(objectName: string) {
        // ...
    }

    public async provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Definition | undefined> {
        const line = document.lineAt(position);
        const text = line.text;

        // Check if we are on a "reference_to" line
        // Pattern: reference_to: objectName
        const referenceMatch = /reference_to:\s*([a-zA-Z0-9_]+)/.exec(text);
        
        if (referenceMatch) {
            const objectName = referenceMatch[1];
            
            // Check if cursor is on the object name
            const startChar = text.indexOf(objectName);
            const endChar = startChar + objectName.length;
            
            if (position.character >= startChar && position.character <= endChar) {
                const def = this.objectIndex.getObject(objectName);
                if (def) {
                   return new vscode.Location(def.uri, new vscode.Position(0, 0));
                }
            }
        }
        
        return undefined;
    }
}
