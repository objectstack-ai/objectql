/**
 * ObjectQL CLI - Command Registration Test Suite
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { registerLifecycleCommands } from './register/lifecycle';
import { registerScaffoldCommands } from './register/scaffold';
import { registerDatabaseCommands } from './register/database';
import { registerToolsCommands } from './register/tools';
import { registerI18nCommands } from './register/i18n';
import { resolveConfigFile, CONFIG_SEARCH_PATHS } from './utils/config-loader';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Mock command action handlers to avoid real execution
vi.mock('./commands/build', () => ({ build: vi.fn() }));
vi.mock('./commands/doctor', () => ({ validateCommand: vi.fn(), doctorCommand: vi.fn() }));
vi.mock('./commands/format', () => ({ format: vi.fn() }));
vi.mock('./commands/generate', () => ({ generateTypes: vi.fn() }));
vi.mock('./commands/lint', () => ({ lint: vi.fn() }));
vi.mock('./commands/migrate', () => ({ migrate: vi.fn(), migrateCreate: vi.fn(), migrateStatus: vi.fn() }));
vi.mock('./commands/new', () => ({ newMetadata: vi.fn() }));
vi.mock('./commands/repl', () => ({ startRepl: vi.fn() }));
vi.mock('./commands/sync', () => ({ syncDatabase: vi.fn() }));
vi.mock('./commands/test', () => ({ test: vi.fn() }));
vi.mock('./commands/database-push', () => ({ dbPushCommand: vi.fn() }));
vi.mock('./commands/i18n', () => ({ i18nExtract: vi.fn(), i18nInit: vi.fn(), i18nValidate: vi.fn() }));
vi.mock('./utils/objectstack-cli', () => ({ forwardToObjectStack: vi.fn() }));

/** Helper: find a command (or subcommand) by its name path, e.g. ['db', 'push']. */
function findCommand(root: Command, names: string[]): Command | undefined {
    let current: Command | undefined = root;
    for (const name of names) {
        current = current?.commands.find(
            (c) => c.name() === name || c.aliases().includes(name),
        );
        if (!current) return undefined;
    }
    return current;
}

describe('CLI Command Registration', () => {
    let program: Command;

    beforeEach(() => {
        program = new Command();
        program.name('objectql').version('0.0.0-test');
        registerLifecycleCommands(program);
        registerScaffoldCommands(program);
        registerDatabaseCommands(program);
        registerToolsCommands(program);
        registerI18nCommands(program);
    });

    // ─── Top-level commands ─────────────────────────────────────────────

    describe('lifecycle commands', () => {
        it('should register init', () => {
            const cmd = findCommand(program, ['init']);
            expect(cmd).toBeDefined();
            expect(cmd!.description()).toContain('ObjectStack');
        });

        it('should register dev with options', () => {
            const cmd = findCommand(program, ['dev']);
            expect(cmd).toBeDefined();
            expect(cmd!.description()).toContain('development server');

            const optionNames = cmd!.options.map((o) => o.long);
            expect(optionNames).toContain('--port');
            expect(optionNames).toContain('--dir');
            expect(optionNames).toContain('--config');
            expect(optionNames).toContain('--modules');
            expect(optionNames).toContain('--no-watch');
        });

        it('should register build with options', () => {
            const cmd = findCommand(program, ['build']);
            expect(cmd).toBeDefined();
            expect(cmd!.description()).toContain('production');

            const optionNames = cmd!.options.map((o) => o.long);
            expect(optionNames).toContain('--dir');
            expect(optionNames).toContain('--output');
            expect(optionNames).toContain('--no-types');
            expect(optionNames).toContain('--no-validate');
        });

        it('should register start with options', () => {
            const cmd = findCommand(program, ['start']);
            expect(cmd).toBeDefined();
            expect(cmd!.description()).toContain('production server');

            const optionNames = cmd!.options.map((o) => o.long);
            expect(optionNames).toContain('--port');
            expect(optionNames).toContain('--dir');
            expect(optionNames).toContain('--config');
        });
    });

    describe('scaffold commands', () => {
        it('should register generate with alias g', () => {
            const cmd = findCommand(program, ['generate']);
            expect(cmd).toBeDefined();
            expect(cmd!.aliases()).toContain('g');
            expect(cmd!.description()).toContain('metadata element');
        });

        it('should register generate with required arguments <schematic> <name>', () => {
            const cmd = findCommand(program, ['generate']);
            expect(cmd).toBeDefined();
            // Commander stores arguments as _args
            const argNames = (cmd as unknown as { _args: { _name: string }[] })._args.map(
                (a) => a._name,
            );
            expect(argNames).toContain('schematic');
            expect(argNames).toContain('name');
        });

        it('should register types command', () => {
            const cmd = findCommand(program, ['types']);
            expect(cmd).toBeDefined();
            expect(cmd!.description()).toContain('TypeScript definitions');

            const optionNames = cmd!.options.map((o) => o.long);
            expect(optionNames).toContain('--source');
            expect(optionNames).toContain('--output');
        });

        it('should register hidden new command for backward compat', () => {
            const cmd = findCommand(program, ['new']);
            expect(cmd).toBeDefined();
        });
    });

    describe('database commands (db subgroup)', () => {
        it('should register db as a parent command', () => {
            const db = findCommand(program, ['db']);
            expect(db).toBeDefined();
            expect(db!.description()).toContain('Database');
        });

        it('should register db push', () => {
            const cmd = findCommand(program, ['db', 'push']);
            expect(cmd).toBeDefined();
            expect(cmd!.description()).toContain('Push');
            expect(cmd!.options.map((o) => o.long)).toContain('--force');
        });

        it('should register db pull with options', () => {
            const cmd = findCommand(program, ['db', 'pull']);
            expect(cmd).toBeDefined();
            expect(cmd!.description()).toContain('Introspect');

            const optionNames = cmd!.options.map((o) => o.long);
            expect(optionNames).toContain('--config');
            expect(optionNames).toContain('--output');
            expect(optionNames).toContain('--tables');
            expect(optionNames).toContain('--force');
        });
    });

    describe('migrate commands (migrate subgroup)', () => {
        it('should register migrate as a parent command', () => {
            const migrate = findCommand(program, ['migrate']);
            expect(migrate).toBeDefined();
            expect(migrate!.description()).toContain('migration');
        });

        it('should register migrate up', () => {
            const cmd = findCommand(program, ['migrate', 'up']);
            expect(cmd).toBeDefined();
            expect(cmd!.description()).toContain('pending migrations');
        });

        it('should register migrate create with <name> argument', () => {
            const cmd = findCommand(program, ['migrate', 'create']);
            expect(cmd).toBeDefined();
            expect(cmd!.description()).toContain('migration file');
            const argNames = (cmd as unknown as { _args: { _name: string }[] })._args.map(
                (a) => a._name,
            );
            expect(argNames).toContain('name');
        });

        it('should register migrate status', () => {
            const cmd = findCommand(program, ['migrate', 'status']);
            expect(cmd).toBeDefined();
            expect(cmd!.description()).toContain('status');
        });
    });

    describe('tools commands', () => {
        it('should register doctor', () => {
            const cmd = findCommand(program, ['doctor']);
            expect(cmd).toBeDefined();
            expect(cmd!.description()).toContain('health');
        });

        it('should register validate with --dir option', () => {
            const cmd = findCommand(program, ['validate']);
            expect(cmd).toBeDefined();
            expect(cmd!.description()).toContain('Validate');
            expect(cmd!.options.map((o) => o.long)).toContain('--dir');
        });

        it('should register repl', () => {
            const cmd = findCommand(program, ['repl']);
            expect(cmd).toBeDefined();
            expect(cmd!.description()).toContain('REPL');
            expect(cmd!.options.map((o) => o.long)).toContain('--config');
        });

        it('should register test with watch/coverage/runner options', () => {
            const cmd = findCommand(program, ['test']);
            expect(cmd).toBeDefined();
            expect(cmd!.description()).toContain('test');

            const optionNames = cmd!.options.map((o) => o.long);
            expect(optionNames).toContain('--watch');
            expect(optionNames).toContain('--coverage');
            expect(optionNames).toContain('--runner');
            expect(optionNames).toContain('--dir');
        });

        it('should register lint', () => {
            const cmd = findCommand(program, ['lint']);
            expect(cmd).toBeDefined();
            expect(cmd!.description()).toContain('Lint');
        });

        it('should register format', () => {
            const cmd = findCommand(program, ['format']);
            expect(cmd).toBeDefined();
            expect(cmd!.description()).toContain('Format');
        });
    });

    describe('i18n commands (i18n subgroup)', () => {
        it('should register i18n as a parent command', () => {
            const i18n = findCommand(program, ['i18n']);
            expect(i18n).toBeDefined();
            expect(i18n!.description()).toContain('Internationalization');
        });

        it('should register i18n extract with options', () => {
            const cmd = findCommand(program, ['i18n', 'extract']);
            expect(cmd).toBeDefined();
            expect(cmd!.description()).toContain('Extract');

            const optionNames = cmd!.options.map((o) => o.long);
            expect(optionNames).toContain('--source');
            expect(optionNames).toContain('--output');
            expect(optionNames).toContain('--lang');
        });

        it('should register i18n init with <lang> argument', () => {
            const cmd = findCommand(program, ['i18n', 'init']);
            expect(cmd).toBeDefined();
            expect(cmd!.description()).toContain('Initialize');
            const argNames = (cmd as unknown as { _args: { _name: string }[] })._args.map(
                (a) => a._name,
            );
            expect(argNames).toContain('lang');
        });

        it('should register i18n validate with <lang> argument and options', () => {
            const cmd = findCommand(program, ['i18n', 'validate']);
            expect(cmd).toBeDefined();
            expect(cmd!.description()).toContain('Validate');

            const argNames = (cmd as unknown as { _args: { _name: string }[] })._args.map(
                (a) => a._name,
            );
            expect(argNames).toContain('lang');

            const optionNames = cmd!.options.map((o) => o.long);
            expect(optionNames).toContain('--base-dir');
            expect(optionNames).toContain('--base-lang');
        });
    });

    // ─── Completeness check ─────────────────────────────────────────────

    describe('completeness', () => {
        it('should register all expected top-level commands', () => {
            const topLevelNames = program.commands.map((c) => c.name());
            const expected = [
                'init', 'dev', 'build', 'start',     // lifecycle
                'generate', 'types', 'new',            // scaffold
                'db', 'migrate',                        // database
                'doctor', 'validate', 'repl', 'test', 'lint', 'format', // tools
                'i18n',                                 // i18n
            ];
            for (const name of expected) {
                expect(topLevelNames).toContain(name);
            }
        });

        it('should register all expected db subcommands', () => {
            const db = findCommand(program, ['db']);
            const subNames = db!.commands.map((c) => c.name());
            expect(subNames).toContain('push');
            expect(subNames).toContain('pull');
        });

        it('should register all expected migrate subcommands', () => {
            const migrate = findCommand(program, ['migrate']);
            const subNames = migrate!.commands.map((c) => c.name());
            expect(subNames).toContain('up');
            expect(subNames).toContain('create');
            expect(subNames).toContain('status');
        });

        it('should register all expected i18n subcommands', () => {
            const i18n = findCommand(program, ['i18n']);
            const subNames = i18n!.commands.map((c) => c.name());
            expect(subNames).toContain('extract');
            expect(subNames).toContain('init');
            expect(subNames).toContain('validate');
        });
    });
});

// ─── Utility: config-loader ─────────────────────────────────────────────

describe('config-loader utility', () => {
    describe('resolveConfigFile', () => {
        it('should resolve an explicit config path relative to cwd', () => {
            const tmpDir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'cli-test-'));
            const configPath = path.join(tmpDir, 'objectstack.config.ts');
            fs.writeFileSync(configPath, 'export default {};');

            const resolved = resolveConfigFile('objectstack.config.ts', tmpDir);
            expect(resolved).toBe(configPath);

            fs.rmSync(tmpDir, { recursive: true, force: true });
        });

        it('should resolve an absolute config path as-is', () => {
            const tmpDir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'cli-test-'));
            const configPath = path.join(tmpDir, 'my.config.ts');
            fs.writeFileSync(configPath, 'export default {};');

            const resolved = resolveConfigFile(configPath);
            expect(resolved).toBe(configPath);

            fs.rmSync(tmpDir, { recursive: true, force: true });
        });

        it('should throw when explicit config path does not exist', () => {
            expect(() => resolveConfigFile('/nonexistent/config.ts')).toThrow();
        });

        it('should auto-discover objectstack.config.ts when no path given', () => {
            const tmpDir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'cli-test-'));
            fs.writeFileSync(path.join(tmpDir, 'objectstack.config.ts'), 'export default {};');

            const resolved = resolveConfigFile(undefined, tmpDir);
            expect(resolved).toBe(path.join(tmpDir, 'objectstack.config.ts'));

            fs.rmSync(tmpDir, { recursive: true, force: true });
        });

        it('should prefer objectstack.config.ts over objectql.config.ts', () => {
            const tmpDir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'cli-test-'));
            fs.writeFileSync(path.join(tmpDir, 'objectstack.config.ts'), '');
            fs.writeFileSync(path.join(tmpDir, 'objectql.config.ts'), '');

            const resolved = resolveConfigFile(undefined, tmpDir);
            expect(path.basename(resolved)).toBe('objectstack.config.ts');

            fs.rmSync(tmpDir, { recursive: true, force: true });
        });

        it('should fall back to objectql.config.ts when objectstack variant is absent', () => {
            const tmpDir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'cli-test-'));
            fs.writeFileSync(path.join(tmpDir, 'objectql.config.ts'), '');

            const resolved = resolveConfigFile(undefined, tmpDir);
            expect(path.basename(resolved)).toBe('objectql.config.ts');

            fs.rmSync(tmpDir, { recursive: true, force: true });
        });

        it('should throw when no config file is found', () => {
            const tmpDir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'cli-test-'));
            expect(() => resolveConfigFile(undefined, tmpDir)).toThrow();
            fs.rmSync(tmpDir, { recursive: true, force: true });
        });
    });

    describe('CONFIG_SEARCH_PATHS', () => {
        it('should expose known config search paths', () => {
            expect(CONFIG_SEARCH_PATHS.length).toBeGreaterThanOrEqual(4);
            expect(CONFIG_SEARCH_PATHS).toContain('objectstack.config.ts');
            expect(CONFIG_SEARCH_PATHS).toContain('objectql.config.ts');
        });
    });
});
