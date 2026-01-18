/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Command } from 'commander';
import { aiGenerate, aiChat } from '../commands/ai';

export function registerAiCommands(program: Command) {
    const aiCmd = program
        .command('ai')
        .description('AI Architect capabilities');

    aiCmd
        .command('chat')
        .description('Interactive architecture chat')
        .option('-p, --prompt <text>', 'Initial prompt')
        .action(async (options) => {
            await aiChat({ initialPrompt: options.prompt });
        });

    aiCmd
        .command('run <prompt>')
        .description('Execute an AI modification on the project (e.g. "Add a blog module")')
        .option('-o, --output <path>', 'Output directory', './src')
        .action(async (prompt, options) => {
            await aiGenerate({ description: prompt, output: options.output, type: 'custom' });
        });
}
