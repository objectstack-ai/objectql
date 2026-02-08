/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { EdgeRuntime } from '@objectql/types';

/**
 * Detects the current edge runtime environment by inspecting global objects.
 *
 * Detection order matters — more specific checks come first to avoid
 * false positives (e.g., Cloudflare Workers before generic edge checks).
 */
export function detectRuntime(): EdgeRuntime {
    // Check for Cloudflare Workers (has WebSocketPair in global scope)
    if (
        typeof globalThis !== 'undefined' &&
        'caches' in globalThis &&
        typeof (globalThis as Record<string, unknown>).WebSocketPair !== 'undefined'
    ) {
        return 'cloudflare-workers';
    }

    // Check for Deno
    if (typeof (globalThis as Record<string, unknown>).Deno !== 'undefined') {
        return 'deno-deploy';
    }

    // Check for Bun
    if (typeof (globalThis as Record<string, unknown>).Bun !== 'undefined') {
        return 'bun';
    }

    // Check for Vercel Edge Runtime
    if (typeof (globalThis as Record<string, unknown>).EdgeRuntime !== 'undefined') {
        return 'vercel-edge';
    }

    // Default to Node.js
    return 'node';
}
