/**
 * ObjectQL CLI - ObjectStack CLI Delegation
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import chalk from 'chalk';

const isWindows = process.platform === 'win32';

const getLocalObjectStackBin = () => {
  const binName = isWindows ? 'objectstack.cmd' : 'objectstack';
  return resolve(process.cwd(), 'node_modules', '.bin', binName);
};

export function forwardToObjectStack(command: string, args: string[] = []): never {
  const localBin = getLocalObjectStackBin();
  const finalArgs = [command, ...args];

  console.log(chalk.yellow(`\n↪ Delegating to @objectstack/cli: objectstack ${finalArgs.join(' ')}`));

  let result: ReturnType<typeof spawnSync>;

  if (existsSync(localBin)) {
    result = spawnSync(localBin, finalArgs, { stdio: 'inherit' });
  } else {
    const npxCmd = isWindows ? 'npx.cmd' : 'npx';
    result = spawnSync(npxCmd, ['-y', '@objectstack/cli', ...finalArgs], { stdio: 'inherit' });
  }

  if (result.error) {
    console.error(chalk.red(`Failed to run @objectstack/cli: ${result.error.message}`));
    process.exit(1);
  }

  process.exit(result.status ?? 0);
}
