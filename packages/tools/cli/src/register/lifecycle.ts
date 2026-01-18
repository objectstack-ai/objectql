/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { dev } from '../commands/dev';
import { start } from '../commands/start';
import { build } from '../commands/build';

export function registerLifecycleCommands(program: Command) {
    program
        .command('init')
        .description('Create a new ObjectQL project (Deprecated)')
        .action(async () => {
            console.log(chalk.red('\n⚠️  DEPRECATED: The "objectql init" command has been removed.'));
            console.log(chalk.white('Please use the standard initializer instead:\n'));
            console.log(chalk.cyan('  npm create @objectql@latest <my-app>'));
            console.log('');
            process.exit(1);
        });

    program
        .command('dev')
        .description('Start development server with hot reload and type generation')
        .option('-p, --port <number>', 'Port to listen on', '3000')
        .option('-d, --dir <path>', 'Directory containing schema', '.')
        .option('-c, --config <path>', 'Path to objectql.config.ts/js')
        .option('--modules <items>', 'Comma-separated list of modules to load')
        .option('--no-watch', 'Disable file watching')
        .action(async (options) => {
            await dev({ 
                port: parseInt(options.port), 
                dir: options.dir,
                config: options.config,
                modules: options.modules,
                watch: options.watch
            });
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
        .description('Start production server')
        .option('-p, --port <number>', 'Port to listen on', '3000')
        .option('-d, --dir <path>', 'Directory containing schema', '.')
        .option('-c, --config <path>', 'Path to objectql.config.ts/js')
        .action(async (options) => {
            await start({ 
                port: parseInt(options.port), 
                dir: options.dir,
                config: options.config
            });
        });
}
