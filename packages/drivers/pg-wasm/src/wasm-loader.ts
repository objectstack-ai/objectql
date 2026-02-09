/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * WASM binary loader for PGlite
 * Handles lazy loading and initialization of the PostgreSQL WASM module
 */

import { ObjectQLError } from '@objectql/types';

let pgliteModule: any = null;

/**
 * Load the PGlite WASM module
 * This is a lazy loader that ensures the module is only loaded once
 */
export async function loadWasmModule(): Promise<any> {
    if (pgliteModule) {
        return pgliteModule;
    }

    // Dynamic import to avoid bundling issues
    const { PGlite } = await import('@electric-sql/pglite');
    pgliteModule = PGlite;
    
    return pgliteModule;
}

/**
 * Get the loaded PGlite module (throws if not loaded)
 */
export function getPGlite(): any {
    if (!pgliteModule) {
        throw new ObjectQLError({ code: 'DRIVER_ERROR', message: 'PGlite WASM module not loaded. Call loadWasmModule() first.' });
    }
    return pgliteModule;
}
