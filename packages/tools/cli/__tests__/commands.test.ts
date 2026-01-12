import * as fs from 'fs';
import * as path from 'path';
import { newMetadata } from '../src/commands/new';
import { i18nExtract, i18nInit, i18nValidate } from '../src/commands/i18n';

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

        it('should validate object name format', async () => {
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
});
