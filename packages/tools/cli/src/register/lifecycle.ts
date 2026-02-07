/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { build } from '../commands/build';
import { forwardToObjectStack } from '../utils/objectstack-cli';

export function registerLifecycleCommands(program: Command) {
    program
        .command('init')
        .description('Create a new ObjectStack project (Delegated to @objectstack/cli)')
        .action(async () => {
            console.log(chalk.yellow('\n⚠️  The "objectql init" command is delegated to @objectstack/cli.'));
            forwardToObjectStack('create');
        });

    program
        .command('dev')
        .description('Start development server (Delegated to @objectstack/cli)')
        .option('-p, --port <number>', 'Port to listen on', '3000')
        .option('-d, --dir <path>', 'Directory containing schema', '.')
        .option('-c, --config <path>', 'Path to objectstack.config.ts/js')
        .option('--modules <items>', 'Comma-separated list of modules to load')
        .option('--no-watch', 'Disable file watching')
        .action(async () => {
            const args = process.argv.slice(3);
            forwardToObjectStack('dev', args);
        });

    program
        .command('build')
        .description('Build project for production')
        .option('-d, --dir <path>', 'Source directory', '.')
        .option('-o, --output <path>', 'Output directory', './dist')
        .option('--no-types', 'Skip TypeScript type generation')
        .option('--no-validate', 'Skip metadata validation')
        .action(async (options) => {
            await build({
                dir: options.dir,
                output: options.output,
                types: options.types,
                validate: options.validate
            });
        });

    program
        .command('start')
        .description('Start production server (Delegated to @objectstack/cli)')
        .option('-p, --port <number>', 'Port to listen on', '3000')
        .option('-d, --dir <path>', 'Directory containing schema', '.')
        .option('-c, --config <path>', 'Path to objectstack.config.ts/js')
        .action(async () => {
            const args = process.argv.slice(3);
            forwardToObjectStack('serve', args);
        });
}
