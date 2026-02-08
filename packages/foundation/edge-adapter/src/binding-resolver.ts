/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { EdgeAdapterConfig, EdgeRuntime } from '@objectql/types';

/**
 * Default driver recommendations per runtime.
 */
const DEFAULT_BINDINGS: Readonly<Record<EdgeRuntime, string>> = {
    'cloudflare-workers': '@objectql/driver-sqlite-wasm',
    'deno-deploy': '@objectql/driver-pg-wasm',
    'vercel-edge': '@objectql/driver-memory',
    'bun': '@objectql/driver-sqlite-wasm',
    'node': '@objectql/driver-sql',
};

/**
 * A fully resolved driver binding for a named datasource.
 */
export interface ResolvedBinding {
    readonly datasource: string;
    readonly driver: string;
    readonly binding?: string;
    readonly config: Record<string, unknown>;
}

/**
 * Returns the recommended default driver for a given runtime.
 */
export function getDefaultDriver(runtime: EdgeRuntime): string {
    return DEFAULT_BINDINGS[runtime];
}

/**
 * Resolves edge driver bindings from adapter configuration.
 *
 * If no explicit bindings are provided, a default binding is generated
 * using the recommended driver for the target runtime.
 */
export function resolveBindings(config: EdgeAdapterConfig): readonly ResolvedBinding[] {
    const bindings = config.bindings ?? {};
    const resolved: ResolvedBinding[] = [];

    for (const [datasource, binding] of Object.entries(bindings)) {
        resolved.push({
            datasource,
            driver: binding.driver,
            binding: binding.binding,
            config: binding.config ?? {},
        });
    }

    // If no bindings provided, resolve a default
    if (resolved.length === 0) {
        resolved.push({
            datasource: 'default',
            driver: getDefaultDriver(config.runtime),
            config: {},
        });
    }

    return resolved;
}
