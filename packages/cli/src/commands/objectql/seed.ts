/**
 * @objectstack/plugin-objectql
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Command, Flags } from '@oclif/core';

/**
 * Seed command — imports seed data from YAML/JSON files.
 *
 * Status: P1 — scaffold only, full implementation planned.
 */
export class SeedCommand extends Command {
  static override description = 'Import seed data from file into ObjectQL datasources (coming soon)';

  static override examples = [
    '<%= config.bin %> objectql seed',
    '<%= config.bin %> objectql seed --file seeds/accounts.yml',
  ];

  static override flags = {
    file: Flags.string({
      char: 'f',
      description: 'Path to a seed file (YAML or JSON)',
    }),
  };

  public async run(): Promise<void> {
    await this.parse(SeedCommand);
    this.log('🚧 objectql seed is not yet implemented. See https://github.com/objectstack-ai/objectql for updates.');
  }
}
