/**
 * @objectstack/plugin-objectql
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Command } from '@oclif/core';

/**
 * Query command — starts an interactive ObjectQL REPL.
 *
 * Status: P2 — scaffold only, full implementation planned.
 */
export class QueryCommand extends Command {
  static override description = 'Start an interactive ObjectQL query REPL (coming soon)';

  static override examples = [
    '<%= config.bin %> objectql query',
  ];

  public async run(): Promise<void> {
    await this.parse(QueryCommand);
    this.log('🚧 objectql query REPL is not yet implemented. See https://github.com/objectstack-ai/objectql for updates.');
  }
}
