/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import * as fs from 'fs';
import { ObjectQLError } from '@objectql/types';

/**
 * Config file search order:
 * 1. objectstack.config.ts  (canonical — matches @objectstack/cli)
 * 2. objectstack.config.js
 * 3. objectql.config.ts     (legacy compat)
 * 4. objectql.config.js
 */
const CONFIG_FILE_NAMES = [
    'objectstack.config.ts',
    'objectstack.config.js',
    'objectql.config.ts',
    'objectql.config.js',
] as const;

/**
 * Resolve the absolute path to the project configuration file.
 *
 * - When `configPath` is provided, it is resolved relative to `cwd` (or used as-is if already absolute).
 * - When omitted, the function searches the `cwd` for known config file names in priority order.
 *
 * @returns The absolute path to the config file.
 * @throws  If no config file can be located.
 */
export function resolveConfigFile(configPath?: string, cwd: string = process.cwd()): string {
    if (configPath) {
        const resolved = path.isAbsolute(configPath) ? configPath : path.join(cwd, configPath);
        if (!fs.existsSync(resolved)) {
            throw new ObjectQLError({ code: 'CONFIG_ERROR', message: `Configuration file not found: ${resolved}` });
        }
        return resolved;
    }

    for (const fileName of CONFIG_FILE_NAMES) {
        const candidate = path.join(cwd, fileName);
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    throw new ObjectQLError({
        code: 'CONFIG_ERROR',
        message: 'No configuration file found. Expected one of:\n' +
            CONFIG_FILE_NAMES.map(f => `  - ${f}`).join('\n') +
            '\n\nRun `objectstack create` to scaffold a new project.',
    });
}

/**
 * Config file names used for doctor/validation checks.
 * Includes sub-directory variants (src/).
 */
export const CONFIG_SEARCH_PATHS = [
    ...CONFIG_FILE_NAMES,
    'src/objectstack.config.ts',
    'src/objectstack.config.js',
    'src/objectql.config.ts',
    'src/objectql.config.js',
] as const;
