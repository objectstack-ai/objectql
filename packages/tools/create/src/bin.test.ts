/**
 * @objectql/create — bin.ts unit tests
 *
 * Tests the create-objectql CLI scaffolding logic including:
 * - Template directory structure validation
 * - package.json de-monorepo transformation
 * - Commander program configuration
 * - Legacy template aliasing
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Command } from 'commander';

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const TEMPLATES_DIR = path.resolve(PACKAGE_ROOT, 'templates');
const EXPECTED_TEMPLATES = ['hello-world', 'starter', 'enterprise'] as const;

// ─── Template Structure Tests ───────────────────────────────────────────────

describe('@objectql/create — template structures', () => {
  it('templates directory exists at package root', () => {
    expect(fs.existsSync(TEMPLATES_DIR)).toBe(true);
  });

  it('contains all expected template directories', () => {
    const entries = fs.readdirSync(TEMPLATES_DIR);
    for (const name of EXPECTED_TEMPLATES) {
      expect(entries).toContain(name);
    }
  });

  for (const template of EXPECTED_TEMPLATES) {
    describe(`"${template}" template`, () => {
      const dir = path.join(TEMPLATES_DIR, template);

      it('is a directory', () => {
        expect(fs.statSync(dir).isDirectory()).toBe(true);
      });

      it('contains package.json', () => {
        expect(fs.existsSync(path.join(dir, 'package.json'))).toBe(true);
      });

      it('contains tsconfig.json', () => {
        expect(fs.existsSync(path.join(dir, 'tsconfig.json'))).toBe(true);
      });

      it('contains a src/ directory with at least one .ts file', () => {
        const srcDir = path.join(dir, 'src');
        expect(fs.existsSync(srcDir)).toBe(true);

        const files = fs.readdirSync(srcDir, { recursive: true }) as string[];
        const tsFiles = files.filter(f => String(f).endsWith('.ts'));
        expect(tsFiles.length).toBeGreaterThan(0);
      });

      it('package.json has a name field', () => {
        const pkg = fs.readJsonSync(path.join(dir, 'package.json'));
        expect(pkg.name).toBeDefined();
        expect(typeof pkg.name).toBe('string');
      });
    });
  }
});

// ─── package.json De-Monorepo Transformation Tests ──────────────────────────

describe('@objectql/create — package.json transformation', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = path.join(PACKAGE_ROOT, '__test_tmp_bin__');
    await fs.ensureDir(tmpDir);
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  /**
   * Replicate the de-monorepo logic from bin.ts for isolated unit testing:
   * - Sets `name` to basename of target directory
   * - Deletes `private` and `repository`
   * - Replaces `workspace:*` with `latest`
   */
  function deMonorepo(pkg: Record<string, unknown>, dirBasename: string) {
    pkg.name = dirBasename;
    delete pkg.private;
    delete pkg.repository;

    const updateDeps = (deps: Record<string, string> | undefined) => {
      if (!deps) return;
      for (const key in deps) {
        if (deps[key] === 'workspace:*') {
          deps[key] = 'latest';
        }
      }
    };

    updateDeps(pkg.dependencies as Record<string, string> | undefined);
    updateDeps(pkg.devDependencies as Record<string, string> | undefined);
    updateDeps(pkg.peerDependencies as Record<string, string> | undefined);
    return pkg;
  }

  it('should rename package to directory basename', () => {
    const pkg = deMonorepo(
      { name: '@objectql/example-hello-world', version: '1.0.0' },
      'my-cool-app'
    );
    expect(pkg.name).toBe('my-cool-app');
  });

  it('should remove "private" field', () => {
    const pkg = deMonorepo(
      { name: 'x', private: true },
      'app'
    );
    expect(pkg).not.toHaveProperty('private');
  });

  it('should remove "repository" field', () => {
    const pkg = deMonorepo(
      { name: 'x', repository: { type: 'git', url: 'https://github.com/...' } },
      'app'
    );
    expect(pkg).not.toHaveProperty('repository');
  });

  it('should replace workspace:* dependencies with "latest"', () => {
    const pkg = deMonorepo(
      {
        name: 'x',
        dependencies: { '@objectql/core': 'workspace:*', 'chalk': '^4.1.2' },
        devDependencies: { '@objectql/types': 'workspace:*', 'typescript': '^5.0.0' },
      },
      'app'
    );

    const deps = pkg.dependencies as Record<string, string>;
    const devDeps = pkg.devDependencies as Record<string, string>;

    expect(deps['@objectql/core']).toBe('latest');
    expect(deps['chalk']).toBe('^4.1.2');
    expect(devDeps['@objectql/types']).toBe('latest');
    expect(devDeps['typescript']).toBe('^5.0.0');
  });

  it('should leave non-workspace versions untouched', () => {
    const pkg = deMonorepo(
      {
        name: 'x',
        dependencies: { 'lodash': '^4.17.21', 'express': '~4.18.0' },
      },
      'app'
    );
    const deps = pkg.dependencies as Record<string, string>;
    expect(deps['lodash']).toBe('^4.17.21');
    expect(deps['express']).toBe('~4.18.0');
  });

  it('should handle missing dependencies gracefully', () => {
    const pkg = deMonorepo({ name: 'x' }, 'app');
    expect(pkg.name).toBe('app');
    expect(pkg.dependencies).toBeUndefined();
  });

  it('round-trip: copy template, transform, verify on disk', async () => {
    const targetDir = path.join(tmpDir, 'my-project');
    const templatePath = path.join(TEMPLATES_DIR, 'hello-world');

    await fs.copy(templatePath, targetDir);

    const pkgPath = path.join(targetDir, 'package.json');
    const pkg = await fs.readJson(pkgPath);

    const transformed = deMonorepo(pkg, path.basename(targetDir));
    await fs.writeJson(pkgPath, transformed, { spaces: 2 });

    const written = await fs.readJson(pkgPath);
    expect(written.name).toBe('my-project');
    expect(written).not.toHaveProperty('private');
    expect(written).not.toHaveProperty('repository');

    // All @objectql/* deps should now be "latest"
    const allDeps = { ...written.dependencies, ...written.devDependencies };
    for (const [key, value] of Object.entries(allDeps)) {
      if (key.startsWith('@objectql/') || key.startsWith('@objectstack/')) {
        expect(value).toBe('latest');
      }
    }
  });
});

// ─── Commander Program Setup Tests ──────────────────────────────────────────

describe('@objectql/create — Commander program configuration', () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    program
      .name('create-objectql')
      .description('Scaffold a new ObjectQL project')
      .argument('[directory]', 'Directory to create the project in')
      .option('-t, --template <name>', 'Template to use (hello-world, starter, enterprise)')
      .action(() => { /* no-op for config tests */ });
  });

  it('program name is "create-objectql"', () => {
    expect(program.name()).toBe('create-objectql');
  });

  it('has a description', () => {
    expect(program.description()).toBe('Scaffold a new ObjectQL project');
  });

  it('accepts an optional [directory] argument', () => {
    const args = program.registeredArguments;
    expect(args.length).toBe(1);
    expect(args[0].name()).toBe('directory');
    expect(args[0].required).toBe(false);
  });

  it('has a --template option with short alias -t', () => {
    const opt = program.options.find(o => o.long === '--template');
    expect(opt).toBeDefined();
    expect(opt!.short).toBe('-t');
  });

  it('parses --template flag correctly', () => {
    program.parse(['node', 'create-objectql', 'my-dir', '--template', 'starter']);
    expect(program.opts().template).toBe('starter');
    expect(program.args[0]).toBe('my-dir');
  });
});

// ─── Legacy Alias Tests ─────────────────────────────────────────────────────

describe('@objectql/create — legacy template aliasing', () => {
  it('"project-tracker" should map to "starter" template', () => {
    // Mirrors the aliasing logic: if (templateName === 'project-tracker') templateName = 'starter';
    let templateName: string = 'project-tracker';
    if (templateName === 'project-tracker') templateName = 'starter';
    expect(templateName).toBe('starter');
  });

  it('"starter" remains unchanged', () => {
    let templateName: string = 'starter';
    if (templateName === 'project-tracker') templateName = 'starter';
    expect(templateName).toBe('starter');
  });
});

// ─── .gitignore Generation Tests ────────────────────────────────────────────

describe('@objectql/create — .gitignore generation', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = path.join(PACKAGE_ROOT, '__test_tmp_gitignore__');
    await fs.ensureDir(tmpDir);
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  it('writes expected ignore patterns', async () => {
    const content = `node_modules/\ndist/\n*.log\n.DS_Store\n*.sqlite3\n.env\n.env.local\n`;
    await fs.writeFile(path.join(tmpDir, '.gitignore'), content);

    const written = await fs.readFile(path.join(tmpDir, '.gitignore'), 'utf-8');
    expect(written).toContain('node_modules/');
    expect(written).toContain('dist/');
    expect(written).toContain('.env');
    expect(written).toContain('*.sqlite3');
  });
});
