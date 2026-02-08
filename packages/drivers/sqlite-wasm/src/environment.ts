/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ObjectQLError } from '@objectql/types';

/**
 * Environment detection utilities for browser WASM support
 */

/**
 * Check if WebAssembly is available
 */
export function checkWebAssembly(): void {
    if (typeof globalThis.WebAssembly === 'undefined') {
        throw new ObjectQLError({
            code: 'ENVIRONMENT_ERROR',
            message: 'WebAssembly is not supported in this environment. SQLite WASM driver requires WebAssembly support.'
        });
    }
}

/**
 * Check if OPFS (Origin Private File System) is available
 */
export async function checkOPFS(): Promise<boolean> {
    try {
        if (typeof navigator === 'undefined' || !navigator.storage) {
            return false;
        }
        
        // Check if getDirectory method exists
        if (typeof (navigator.storage as any).getDirectory !== 'function') {
            return false;
        }
        
        // Try to actually access it
        const root = await (navigator.storage as any).getDirectory();
        return !!root;
    } catch {
        return false;
    }
}

/**
 * Detect the best available storage backend
 */
export async function detectStorageBackend(): Promise<'opfs' | 'memory'> {
    const hasOPFS = await checkOPFS();
    return hasOPFS ? 'opfs' : 'memory';
}
