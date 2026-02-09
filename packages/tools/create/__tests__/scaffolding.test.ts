/**
 * @objectql/create — Scaffolding output tests
 *
 * Verifies that the create-objectql templates exist and produce valid projects.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const TEMPLATES_DIR = path.resolve(__dirname, '../templates');

const EXPECTED_TEMPLATES = ['hello-world', 'starter', 'enterprise'];

describe('@objectql/create templates', () => {
    it('should have all expected template directories', () => {
        for (const template of EXPECTED_TEMPLATES) {
            const templatePath = path.join(TEMPLATES_DIR, template);
            expect(fs.existsSync(templatePath), `Template "${template}" should exist at ${templatePath}`).toBe(true);
        }
    });

    for (const template of EXPECTED_TEMPLATES) {
        describe(`${template} template`, () => {
            const templatePath = path.join(TEMPLATES_DIR, template);

            it('should contain a package.json', () => {
                const pkgPath = path.join(templatePath, 'package.json');
                expect(fs.existsSync(pkgPath)).toBe(true);

                const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
                expect(pkg.name).toBeDefined();
                expect(pkg.dependencies || pkg.devDependencies).toBeDefined();
            });

            it('should contain a tsconfig.json', () => {
                const tsconfigPath = path.join(templatePath, 'tsconfig.json');
                expect(fs.existsSync(tsconfigPath)).toBe(true);
            });

            it('should contain a src directory with entry point', () => {
                const srcDir = path.join(templatePath, 'src');
                expect(fs.existsSync(srcDir)).toBe(true);

                // Check for at least one .ts file in src
                const srcFiles = fs.readdirSync(srcDir, { recursive: true }) as string[];
                const tsFiles = srcFiles.filter(f => String(f).endsWith('.ts'));
                expect(tsFiles.length).toBeGreaterThan(0);
            });

            it('should contain objectstack.config.ts or objectql config', () => {
                const srcDir = path.join(templatePath, 'src');
                const rootFiles = fs.readdirSync(templatePath);
                const srcFiles = fs.existsSync(srcDir) ? fs.readdirSync(srcDir) : [];
                const allFiles = [...rootFiles, ...srcFiles];

                const hasConfig = allFiles.some(f =>
                    String(f).includes('objectstack.config') ||
                    String(f).includes('objectql.config') ||
                    String(f).includes('index.ts') ||
                    String(f).includes('.app.yml') ||
                    String(f).includes('seed.ts')
                );
                expect(hasConfig).toBe(true);
            });

            it('should have workspace:* dependencies for @objectql packages', () => {
                const pkgPath = path.join(templatePath, 'package.json');
                const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
                const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

                const objectqlDeps = Object.entries(allDeps).filter(
                    ([key]) => key.startsWith('@objectql/') || key.startsWith('@objectstack/')
                );

                // Templates in the monorepo should use workspace:* references
                for (const [name, version] of objectqlDeps) {
                    expect(version, `${name} should use workspace:* in template`).toBe('workspace:*');
                }
            });
        });
    }
});
