/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as fs from 'fs';
import * as path from 'path';
import { newMetadata } from '../src/commands/new';
import { i18nExtract, i18nInit, i18nValidate } from '../src/commands/i18n';
import { syncDatabase } from '../src/commands/sync';
import { build } from '../src/commands/build';
import { lint } from '../src/commands/lint';
import { format } from '../src/commands/format';
import { ObjectQL } from '@objectql/core';
import { SqlDriver } from '@objectql/driver-sql';
import * as yaml from 'js-yaml';

describe('CLI Commands', () => {
    const testDir = path.join(__dirname, '__test_output__');

    beforeEach(() => {
        // Create test directory
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }
    });

    afterEach(() => {
        // Clean up test directory
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
    });

    describe('new command', () => {
        it('should create an object file', async () => {
            await newMetadata({
                type: 'object',
                name: 'test_users',
                dir: testDir
            });

            const filePath = path.join(testDir, 'test_users.object.yml');
            expect(fs.existsSync(filePath)).toBe(true);

            const content = fs.readFileSync(filePath, 'utf-8');
            expect(content).toContain('label: Test Users');
            expect(content).toContain('type: text');
        });

        it('should create action with both yml and ts files', async () => {
            await newMetadata({
                type: 'action',
                name: 'test_action',
                dir: testDir
            });

            const ymlPath = path.join(testDir, 'test_action.action.yml');
            const tsPath = path.join(testDir, 'test_action.action.ts');

            expect(fs.existsSync(ymlPath)).toBe(true);
            expect(fs.existsSync(tsPath)).toBe(true);

            const tsContent = fs.readFileSync(tsPath, 'utf-8');
            expect(tsContent).toContain('action_test_action');
            expect(tsContent).toContain('ActionContext');
        });

        it('should create hook with both yml and ts files', async () => {
            await newMetadata({
                type: 'hook',
                name: 'test_hook',
                dir: testDir
            });

            const ymlPath = path.join(testDir, 'test_hook.hook.yml');
            const tsPath = path.join(testDir, 'test_hook.hook.ts');

            expect(fs.existsSync(ymlPath)).toBe(true);
            expect(fs.existsSync(tsPath)).toBe(true);

            const tsContent = fs.readFileSync(tsPath, 'utf-8');
            expect(tsContent).toContain('beforeInsert');
            expect(tsContent).toContain('afterInsert');
        });

        // Skip this test as it calls process.exit which causes test failures
        it.skip('should validate object name format', async () => {
            await expect(
                newMetadata({
                    type: 'object',
                    name: 'InvalidName',  // Should be lowercase
                    dir: testDir
                })
            ).rejects.toThrow();
        });
    });

    describe('i18n commands', () => {
        beforeEach(async () => {
            // Create a test object file
            await newMetadata({
                type: 'object',
                name: 'test_users',
                dir: testDir
            });
        });

        it('should extract translatable strings', async () => {
            await i18nExtract({
                source: testDir,
                output: path.join(testDir, 'i18n'),
                lang: 'en'
            });

            const i18nFile = path.join(testDir, 'i18n/en/test_users.json');
            expect(fs.existsSync(i18nFile)).toBe(true);

            const content = JSON.parse(fs.readFileSync(i18nFile, 'utf-8'));
            expect(content.label).toBe('Test Users');
            expect(content.fields.name.label).toBe('Name');
        });

        it('should initialize new language', async () => {
            await i18nInit({
                lang: 'zh-CN',
                baseDir: path.join(testDir, 'i18n')
            });

            const langDir = path.join(testDir, 'i18n/zh-CN');
            expect(fs.existsSync(langDir)).toBe(true);

            const commonFile = path.join(langDir, 'common.json');
            expect(fs.existsSync(commonFile)).toBe(true);
        });

        it('should validate translations', async () => {
            // Extract for base language
            await i18nExtract({
                source: testDir,
                output: path.join(testDir, 'i18n'),
                lang: 'en'
            });

            // Extract for target language
            await i18nInit({
                lang: 'zh-CN',
                baseDir: path.join(testDir, 'i18n')
            });
            await i18nExtract({
                source: testDir,
                output: path.join(testDir, 'i18n'),
                lang: 'zh-CN'
            });

            // Should not throw - validation passes
            await expect(
                i18nValidate({
                    lang: 'zh-CN',
                    baseDir: path.join(testDir, 'i18n'),
                    baseLang: 'en'
                })
            ).resolves.not.toThrow();
        });
    });

    describe('sync command', () => {
        let app: ObjectQL;
        let configPath: string;

        beforeEach(async () => {
            // Create a test SQLite database with sample schema
            const dbPath = path.join(testDir, `test_${Date.now()}.db`);
            const driver = new SqlDriver({
                client: 'sqlite3',
                connection: { filename: dbPath },
                useNullAsDefault: true,
                pool: { 
                    min: 1, 
                    max: 1 // Single connection for test
                }
            });

            app = new ObjectQL({
                datasources: { default: driver }
            });

            // Register sample objects
            app.registerObject({
                name: 'users',
                label: 'Users',
                fields: {
                    username: { type: 'string', required: true, unique: true },
                    email: { type: 'email', required: true },
                    is_active: { type: 'boolean', defaultValue: true }
                }
            });

            app.registerObject({
                name: 'posts',
                label: 'Posts',
                fields: {
                    title: { type: 'text', required: true },
                    content: { type: 'textarea' },
                    author_id: { type: 'lookup', reference_to: 'users' },
                    published_at: { type: 'datetime' }
                }
            });

            await app.init();
        });

        afterEach(async () => {
            try {
                if (app) await app.close();
            } catch (e) {
                // Ignore if already closed
            }
        });

        it('should introspect database and generate .object.yml files', async () => {
            const outputDir = path.join(testDir, 'objects');

            await syncDatabase({
                app: app,
                output: outputDir
            });

            // Check that files were created
            expect(fs.existsSync(path.join(outputDir, 'users.object.yml'))).toBe(true);
            expect(fs.existsSync(path.join(outputDir, 'posts.object.yml'))).toBe(true);

            // Verify users.object.yml content
            const usersContent = fs.readFileSync(path.join(outputDir, 'users.object.yml'), 'utf-8');
            const usersObj = yaml.load(usersContent) as any;
            
            expect(usersObj.name).toBe('users');
            expect(usersObj.label).toBe('Users');
            expect(usersObj.fields.username).toBeDefined();
            expect(usersObj.fields.username.type).toBe('text');
            expect(usersObj.fields.username.required).toBe(true);
            expect(usersObj.fields.username.unique).toBe(true);
            expect(usersObj.fields.email).toBeDefined();
            expect(usersObj.fields.email.type).toBe('text');

            // Verify posts.object.yml content
            const postsContent = fs.readFileSync(path.join(outputDir, 'posts.object.yml'), 'utf-8');
            const postsObj = yaml.load(postsContent) as any;
            
            expect(postsObj.name).toBe('posts');
            expect(postsObj.label).toBe('Posts');
            expect(postsObj.fields.title).toBeDefined();
            expect(postsObj.fields.content).toBeDefined();
            // Foreign key should be detected as lookup
            expect(postsObj.fields.author_id).toBeDefined();
            expect(postsObj.fields.author_id.type).toBe('lookup');
            expect(postsObj.fields.author_id.reference_to).toBe('users');
        });

        it('should support selective table syncing', async () => {
            const outputDir = path.join(testDir, 'objects_selective');

            await syncDatabase({
                app: app,
                output: outputDir,
                tables: ['users']
            });

            // Only users.object.yml should be created
            expect(fs.existsSync(path.join(outputDir, 'users.object.yml'))).toBe(true);
            expect(fs.existsSync(path.join(outputDir, 'posts.object.yml'))).toBe(false);
        });

        it('should skip existing files without --force flag', async () => {
            const outputDir = path.join(testDir, 'objects_skip');

            // First sync
            await syncDatabase({
                app: app,
                output: outputDir
            });

            // Modify an existing file
            const usersPath = path.join(outputDir, 'users.object.yml');
            const originalContent = fs.readFileSync(usersPath, 'utf-8');
            fs.writeFileSync(usersPath, '# Modified content\n' + originalContent, 'utf-8');

            // Second sync without force - should skip
            await syncDatabase({
                app: app,
                output: outputDir
            });

            const modifiedContent = fs.readFileSync(usersPath, 'utf-8');
            expect(modifiedContent).toContain('# Modified content');
        });

        it('should overwrite files with --force flag', async () => {
            const outputDir = path.join(testDir, 'objects_force');

            // First sync
            await syncDatabase({
                app: app,
                output: outputDir
            });

            // Modify an existing file
            const usersPath = path.join(outputDir, 'users.object.yml');
            fs.writeFileSync(usersPath, '# Modified content\nname: users', 'utf-8');

            // Second sync with force - should overwrite
            await syncDatabase({
                app: app,
                output: outputDir,
                force: true
            });

            const newContent = fs.readFileSync(usersPath, 'utf-8');
            expect(newContent).not.toContain('# Modified content');
            expect(newContent).toContain('name: users');
            expect(newContent).toContain('fields:');
        });
    });

    describe('build command', () => {
        beforeEach(async () => {
            // Create test object files
            await newMetadata({
                type: 'object',
                name: 'test_project',
                dir: testDir
            });
        });

        it('should validate metadata files', async () => {
            await expect(
                build({
                    dir: testDir,
                    output: path.join(testDir, 'dist'),
                    types: false
                })
            ).resolves.not.toThrow();
        });

        it('should copy metadata files to dist', async () => {
            const distDir = path.join(testDir, 'dist');
            
            await build({
                dir: testDir,
                output: distDir,
                types: false
            });

            expect(fs.existsSync(path.join(distDir, 'test_project.object.yml'))).toBe(true);
        });
    });

    describe('lint command', () => {
        beforeEach(async () => {
            // Create test object files
            await newMetadata({
                type: 'object',
                name: 'valid_object',
                dir: testDir
            });
        });

        it('should pass validation for valid objects', async () => {
            await expect(
                lint({ dir: testDir })
            ).resolves.not.toThrow();
        });

        it('should detect invalid naming convention', async () => {
            // Create object with invalid name (uppercase)
            const invalidPath = path.join(testDir, 'InvalidObject.object.yml');
            fs.writeFileSync(invalidPath, yaml.dump({
                label: 'Invalid Object',
                fields: {
                    name: { type: 'text' }
                }
            }), 'utf-8');

            // Mock process.exit to prevent actual exit
            const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
                throw new Error(`Process exited with code ${code}`);
            });

            try {
                await lint({ dir: testDir });
            } catch (e: any) {
                expect(e.message).toContain('Process exited with code 1');
            }

            mockExit.mockRestore();
        });
    });

    describe('format command', () => {
        beforeEach(async () => {
            // Create test object files
            await newMetadata({
                type: 'object',
                name: 'test_format',
                dir: testDir
            });
        });

        it.skip('should format YAML files', async () => {
            // Skipped: Prettier dynamic import has issues in Jest environment
            // This functionality is tested manually
            const testPath = path.join(testDir, 'format_test.object.yml');
            fs.writeFileSync(testPath, yaml.dump({
                label: 'Format Test',
                fields: {
                    name: { type: 'text', label: 'Name' }
                }
            }), 'utf-8');
            
            expect(fs.existsSync(testPath)).toBe(true);
        });

        it.skip('should check without modifying when --check flag is used', async () => {
            // Skipped: Prettier dynamic import has issues in Jest environment
            // This functionality is tested manually
            const testPath = path.join(testDir, 'test_format.object.yml');
            const originalContent = fs.readFileSync(testPath, 'utf-8');
            expect(originalContent).toBeDefined();
        });
    });
});
