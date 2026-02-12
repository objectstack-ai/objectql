/**
 * ObjectQL VSCode Extension Tests
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Mock vscode module (unavailable outside VS Code runtime)
vi.mock('vscode', () => ({
  commands: { registerCommand: vi.fn(), executeCommand: vi.fn() },
  window: {
    showInformationMessage: vi.fn().mockResolvedValue(undefined),
    showErrorMessage: vi.fn(),
    showWarningMessage: vi.fn(),
    showInputBox: vi.fn(),
    showTextDocument: vi.fn(),
    activeTextEditor: undefined,
    createOutputChannel: vi.fn(() => ({ appendLine: vi.fn(), show: vi.fn() })),
  },
  workspace: {
    workspaceFolders: [],
    findFiles: vi.fn().mockResolvedValue([]),
    getConfiguration: vi.fn(() => ({ get: vi.fn() })),
    openTextDocument: vi.fn(),
    applyEdit: vi.fn(),
    asRelativePath: vi.fn((uri: any) => uri.toString()),
    onDidChangeTextDocument: vi.fn(),
    createFileSystemWatcher: vi.fn(() => ({
      onDidCreate: vi.fn(),
      onDidChange: vi.fn(),
      onDidDelete: vi.fn(),
      dispose: vi.fn(),
    })),
    fs: { stat: vi.fn() },
  },
  languages: {
    registerDefinitionProvider: vi.fn(),
    registerCompletionItemProvider: vi.fn(),
  },
  Uri: {
    file: vi.fn((f: string) => ({ fsPath: f, toString: () => f })),
    parse: vi.fn((s: string) => ({ fsPath: s, toString: () => s })),
    joinPath: vi.fn((_base: any, ...segments: string[]) => {
      const joined = segments.join('/');
      return { fsPath: joined, toString: () => joined };
    }),
  },
  env: { openExternal: vi.fn() },
  Position: class {
    constructor(public line: number, public character: number) {}
  },
  Range: class {
    constructor(public start: any, public end: any) {}
  },
  Location: class {
    constructor(public uri: any, public range: any) {}
  },
  CompletionItem: class {
    label: string;
    kind?: number;
    detail?: string;
    documentation?: any;
    constructor(label: string, kind?: number) {
      this.label = label;
      this.kind = kind;
    }
  },
  CompletionItemKind: { Field: 5, Class: 7, Property: 10 },
  MarkdownString: class {
    value: string;
    constructor(value?: string) { this.value = value ?? ''; }
  },
  WorkspaceEdit: class {
    createFile: any = vi.fn();
    insert: any = vi.fn();
  },
  ExtensionContext: class {},
  Disposable: class {
    static from(..._args: any[]) {
      return { dispose: vi.fn() };
    }
  },
}));

// Mock js-yaml for ObjectIndex
vi.mock('js-yaml', () => ({
  load: vi.fn(),
}));

// ─── Helpers ─────────────────────────────────────────────

function readPackageJson() {
  const pkgPath = path.resolve(__dirname, '..', 'package.json');
  return JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
}

function createMockContext(): any {
  return {
    subscriptions: [],
    extensionUri: { fsPath: '/mock/extension' },
    globalState: {
      get: vi.fn().mockReturnValue(true), // suppress welcome message
      update: vi.fn(),
    },
  };
}

// ─── Tests ───────────────────────────────────────────────

describe('VSCode ObjectQL Extension', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 1. Extension Manifest ─────────────────────────────

  describe('Extension Manifest (package.json)', () => {
    const pkg = readPackageJson();

    it('should declare contributes.commands', () => {
      expect(pkg.contributes).toBeDefined();
      expect(pkg.contributes.commands).toBeDefined();
      expect(Array.isArray(pkg.contributes.commands)).toBe(true);
      expect(pkg.contributes.commands.length).toBeGreaterThan(0);
    });

    it('should have the expected command IDs', () => {
      const commandIds: string[] = pkg.contributes.commands.map((c: any) => c.command);

      expect(commandIds).toContain('objectql.newObject');
      expect(commandIds).toContain('objectql.newValidation');
      expect(commandIds).toContain('objectql.newPermission');
      expect(commandIds).toContain('objectql.newWorkflow');
      expect(commandIds).toContain('objectql.validateSchema');
    });

    it('should categorize all commands under "ObjectQL"', () => {
      for (const cmd of pkg.contributes.commands) {
        expect(cmd.category).toBe('ObjectQL');
      }
    });

    it('should have activation events for ObjectQL file types', () => {
      expect(pkg.activationEvents).toBeDefined();
      expect(pkg.activationEvents).toContain('workspaceContains:**/*.object.yml');
      expect(pkg.activationEvents).toContain('workspaceContains:**/*.validation.yml');
      expect(pkg.activationEvents).toContain('workspaceContains:**/*.permission.yml');
      expect(pkg.activationEvents).toContain('workspaceContains:**/*.workflow.yml');
    });

    it('should depend on the YAML extension', () => {
      expect(pkg.extensionDependencies).toContain('redhat.vscode-yaml');
    });

    it('should declare language contributions for all metadata file types', () => {
      const langIds: string[] = pkg.contributes.languages.map((l: any) => l.id);
      expect(langIds).toContain('objectql-object');
      expect(langIds).toContain('objectql-validation');
      expect(langIds).toContain('objectql-permission');
      expect(langIds).toContain('objectql-workflow');
    });
  });

  // ── 2. Command Registration in activate() ────────────

  describe('activate() command registration', () => {
    it('should register all five commands declared in the manifest', async () => {
      const vscode = await import('vscode');
      const { activate } = await import('./extension');

      const ctx = createMockContext();
      activate(ctx);

      const registeredIds = (vscode.commands.registerCommand as ReturnType<typeof vi.fn>).mock.calls.map(
        (call: any[]) => call[0]
      );

      const pkg = readPackageJson();
      const manifestIds: string[] = pkg.contributes.commands.map((c: any) => c.command);

      for (const id of manifestIds) {
        expect(registeredIds).toContain(id);
      }
    });

    it('should register a DefinitionProvider and CompletionItemProvider', async () => {
      const vscode = await import('vscode');
      const { activate } = await import('./extension');

      const ctx = createMockContext();
      activate(ctx);

      expect(vscode.languages.registerDefinitionProvider).toHaveBeenCalledTimes(1);
      expect(vscode.languages.registerCompletionItemProvider).toHaveBeenCalledTimes(1);
    });

    it('should push disposables into context.subscriptions', async () => {
      const { activate } = await import('./extension');
      const ctx = createMockContext();
      activate(ctx);

      // 5 commands + 2 providers + 1 ObjectIndex dispose = 8
      expect(ctx.subscriptions.length).toBe(8);
    });
  });

  // ── 3. deactivate() ──────────────────────────────────

  describe('deactivate()', () => {
    it('should not throw when called', async () => {
      const { deactivate } = await import('./extension');
      expect(() => deactivate()).not.toThrow();
    });
  });

  // ── 4. Utility Constants ─────────────────────────────

  describe('utils/constants', () => {
    it('should export SCHEMES.FILE as "file"', async () => {
      const { SCHEMES } = await import('./utils/constants');
      expect(SCHEMES.FILE).toBe('file');
    });

    it('should export SCHEMES.UNTITLED as "untitled"', async () => {
      const { SCHEMES } = await import('./utils/constants');
      expect(SCHEMES.UNTITLED).toBe('untitled');
    });

    it('should export LANGUAGES.YAML as "yaml"', async () => {
      const { LANGUAGES } = await import('./utils/constants');
      expect(LANGUAGES.YAML).toBe('yaml');
    });
  });

  // ── 5. ObjectIndex service initialisation ─────────────

  describe('ObjectIndex service', () => {
    it('should be constructible and exposable', async () => {
      const { ObjectIndex } = await import('./services/ObjectIndex');
      const index = new ObjectIndex();
      expect(index).toBeDefined();
      expect(typeof index.getObject).toBe('function');
      expect(typeof index.getAllObjects).toBe('function');
      expect(typeof index.dispose).toBe('function');
    });

    it('should return undefined for unknown objects', async () => {
      const { ObjectIndex } = await import('./services/ObjectIndex');
      const index = new ObjectIndex();
      expect(index.getObject('nonexistent')).toBeUndefined();
    });

    it('should return an empty array from getAllObjects initially', async () => {
      const { ObjectIndex } = await import('./services/ObjectIndex');
      const index = new ObjectIndex();
      expect(index.getAllObjects()).toEqual([]);
    });
  });

  // ── 6. Provider instantiation ─────────────────────────

  describe('Providers', () => {
    it('should instantiate ObjectDefinitionProvider', async () => {
      const { ObjectIndex } = await import('./services/ObjectIndex');
      const { ObjectDefinitionProvider } = await import('./providers/ObjectDefinitionProvider');
      const index = new ObjectIndex();
      const provider = new ObjectDefinitionProvider(index);
      expect(provider).toBeDefined();
      expect(typeof provider.provideDefinition).toBe('function');
    });

    it('should instantiate ObjectCompletionProvider', async () => {
      const { ObjectIndex } = await import('./services/ObjectIndex');
      const { ObjectCompletionProvider } = await import('./providers/ObjectCompletionProvider');
      const index = new ObjectIndex();
      const provider = new ObjectCompletionProvider(index);
      expect(provider).toBeDefined();
      expect(typeof provider.provideCompletionItems).toBe('function');
    });
  });

  // ── 7. Manifest ↔ Code consistency ────────────────────

  describe('Manifest / Code consistency', () => {
    it('should have no commands in code that are missing from the manifest', async () => {
      const vscode = await import('vscode');
      const { activate } = await import('./extension');
      const ctx = createMockContext();
      activate(ctx);

      const registeredIds: string[] = (vscode.commands.registerCommand as ReturnType<typeof vi.fn>).mock.calls.map(
        (call: any[]) => call[0]
      );

      const pkg = readPackageJson();
      const manifestIds: string[] = pkg.contributes.commands.map((c: any) => c.command);

      for (const id of registeredIds) {
        expect(manifestIds).toContain(id);
      }
    });

    it('should register the providers with the yaml/file selector', async () => {
      const vscode = await import('vscode');
      const { activate } = await import('./extension');
      const ctx = createMockContext();
      activate(ctx);

      const defCall = (vscode.languages.registerDefinitionProvider as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(defCall[0]).toEqual({ language: 'yaml', scheme: 'file' });

      const compCall = (vscode.languages.registerCompletionItemProvider as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(compCall[0]).toEqual({ language: 'yaml', scheme: 'file' });
    });
  });
});
