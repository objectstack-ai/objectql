/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Command } from 'commander';
import { i18nExtract, i18nInit, i18nValidate } from '../commands/i18n';

export function registerI18nCommands(program: Command) {
    const i18nCmd = program
        .command('i18n')
        .description('Internationalization commands');

    i18nCmd
        .command('extract')
        .description('Extract translatable strings from metadata files')
        .option('-s, --source <path>', 'Source directory', '.')
        .option('-o, --output <path>', 'Output directory', './src/i18n')
        .option('-l, --lang <lang>', 'Language code', 'en')
        .action(async (options) => {
            try {
                await i18nExtract(options);
            } catch (error) {
                console.error(error);
                process.exit(1);
            }
        });

    i18nCmd
        .command('init <lang>')
        .description('Initialize i18n for a new language')
        .option('-b, --base-dir <path>', 'Base i18n directory', './src/i18n')
        .action(async (lang, options) => {
            try {
                await i18nInit({ lang, baseDir: options.baseDir });
            } catch (error) {
                console.error(error);
                process.exit(1);
            }
        });

    i18nCmd
        .command('validate <lang>')
        .description('Validate translation completeness')
        .option('-b, --base-dir <path>', 'Base i18n directory', './src/i18n')
        .option('--base-lang <lang>', 'Base language to compare against', 'en')
        .action(async (lang, options) => {
            try {
                await i18nValidate({ lang, baseDir: options.baseDir, baseLang: options.baseLang });
            } catch (error) {
                console.error(error);
                process.exit(1);
            }
        });
}
