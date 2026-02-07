/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { registerLifecycleCommands } from './register/lifecycle';
import { registerScaffoldCommands } from './register/scaffold';
import { registerDatabaseCommands } from './register/database';
import { registerToolsCommands } from './register/tools';
import { registerI18nCommands } from './register/i18n';

// Read version from package.json to keep in sync (ISS-010)
const { version } = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf8'));

const program = new Command();

program
  .name('objectql')
  .description('ObjectQL CLI tool - The ObjectStack AI Protocol Interface')
  .version(version);

// Register all command groups
registerLifecycleCommands(program);
registerScaffoldCommands(program);
registerDatabaseCommands(program);
registerToolsCommands(program);
registerI18nCommands(program);

program.parse(process.argv);
