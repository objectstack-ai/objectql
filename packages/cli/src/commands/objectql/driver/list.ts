/**
 * @objectstack/plugin-objectql
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Command } from '@oclif/core';

/**
 * Driver List command — lists available ObjectQL drivers.
 *
 * Status: P2 — scaffold only, full implementation planned.
 */
export class DriverListCommand extends Command {
  static override description = 'List available ObjectQL database drivers (coming soon)';

  static override examples = [
    '<%= config.bin %> objectql driver list',
  ];

  public async run(): Promise<void> {
    await this.parse(DriverListCommand);
    this.log('🚧 objectql driver list is not yet implemented. See https://github.com/objectstack-ai/objectql for updates.');
  }
}
