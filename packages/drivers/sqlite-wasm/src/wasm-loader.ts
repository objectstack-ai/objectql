/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * WASM binary loader for wa-sqlite
 * Handles lazy loading and initialization of the SQLite WASM module
 */

import { ObjectQLError } from '@objectql/types';

let wasmModule: any = null;
let sqlite3: any = null;

/**
 * Load the wa-sqlite WASM module
 * This is a lazy loader that ensures the module is only loaded once
 */
export async function loadWasmModule(): Promise<any> {
    if (sqlite3) {
        return sqlite3;
    }

    // Dynamic import to avoid bundling issues
    const wasmFactory = await import('wa-sqlite/dist/wa-sqlite-async.mjs');
    const SQLiteESMFactory = wasmFactory.default;
    
    wasmModule = await SQLiteESMFactory();
    sqlite3 = wasmModule;
    
    return sqlite3;
}

/**
 * Get the loaded SQLite3 module (throws if not loaded)
 */
export function getSqlite3(): any {
    if (!sqlite3) {
        throw new ObjectQLError({ code: 'DRIVER_ERROR', message: 'SQLite WASM module not loaded. Call loadWasmModule() first.' });
    }
    return sqlite3;
}
