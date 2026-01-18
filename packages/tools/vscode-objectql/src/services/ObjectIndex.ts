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
import * as yaml from 'js-yaml';

export interface ObjectDefinition {
    name: string;
    uri: vscode.Uri;
}

export class ObjectIndex {
    private objects: Map<string, ObjectDefinition> = new Map();
    private watchers: vscode.FileSystemWatcher[] = [];

    constructor() {
        this.initialize();
    }

    private async initialize() {
        // Initial scan
        const files = await vscode.workspace.findFiles('**/*.object.yml', '**/node_modules/**');
        for (const file of files) {
            await this.indexFile(file);
        }

        // Watch for changes
        const watcher = vscode.workspace.createFileSystemWatcher('**/*.object.yml');
        watcher.onDidCreate(uri => this.indexFile(uri));
        watcher.onDidChange(uri => this.indexFile(uri));
        watcher.onDidDelete(uri => this.removeFile(uri));
        this.watchers.push(watcher);
    }

    private async indexFile(uri: vscode.Uri) {
        try {
            const document = await vscode.workspace.openTextDocument(uri);
            const text = document.getText();
            // Parsing YAML can be heavy, maybe use a regex for name first for speed?
            // "name: project"
            // For robustness, let's use js-yaml but safely
            try {
                const doc = yaml.load(text) as any;
                if (doc && doc.name) {
                    this.objects.set(doc.name, {
                        name: doc.name,
                        uri: uri
                    });
                }
            } catch (e) {
                // YAML parse error, fall back to regex or ignore
                const nameMatch = /^name:\s*([a-zA-Z0-9_]+)/m.exec(text);
                if (nameMatch) {
                    this.objects.set(nameMatch[1], {
                        name: nameMatch[1],
                        uri: uri
                    });
                }
            }
        } catch (error) {
            console.error(`Error indexing file ${uri.fsPath}:`, error);
        }
    }

    private removeFile(uri: vscode.Uri) {
        // Inefficient reverse lookup but fine for file deletion events which are rare
        for (const [name, def] of this.objects.entries()) {
            if (def.uri.fsPath === uri.fsPath) {
                this.objects.delete(name);
            }
        }
    }

    public getObject(name: string): ObjectDefinition | undefined {
        return this.objects.get(name);
    }

    public getAllObjects(): ObjectDefinition[] {
        return Array.from(this.objects.values());
    }

    public dispose() {
        this.watchers.forEach(w => w.dispose());
    }
}
