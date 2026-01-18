/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { generateTypes } from '../commands/generate';
import { newMetadata } from '../commands/new';

export function registerScaffoldCommands(program: Command) {
    program
        .command('generate <schematic> <name>')
        .alias('g')
        .description('Generate a new metadata element (object, action, etc.)')
        .option('-d, --dir <path>', 'Output directory', '.')
        .action(async (schematic, name, options) => {
            try {
                // Maps to existing newMetadata which accepts (type, name, dir)
                await newMetadata({ type: schematic, name, dir: options.dir });
            } catch (error) {
                console.error(error);
                process.exit(1);
            }
        });

    program
        .command('types')
        .description('Force regenerate TypeScript definitions')
        .option('-s, --source <path>', 'Source directory', '.')
        .option('-o, --output <path>', 'Output directory', './src/generated')
        .action(async (options) => {
            try {
                await generateTypes(options.source, options.output);
            } catch (error) {
                console.error(error);
                process.exit(1);
            }
        });

    // Backward compatibility (Hidden or Deprecated)
    program
        .command('new <type> <name>', { hidden: true })
        .action(async (type, name, options) => {
             console.warn(chalk.yellow('Deprecated: Use "objectql generate" instead.'));
             await newMetadata({ type, name, dir: options.dir });
        });
}
