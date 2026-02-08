/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// ============================================================================
// Edge Runtime Types
// ============================================================================

/**
 * Supported edge runtime environments.
 */
export type EdgeRuntime =
    | 'cloudflare-workers'
    | 'deno-deploy'
    | 'vercel-edge'
    | 'bun'
    | 'node';

/**
 * Edge-specific driver binding.
 *
 * Maps an ObjectQL driver to an edge-platform-native storage primitive.
 * For example, Cloudflare Workers binds `driver-sqlite-wasm` to D1.
 */
export interface EdgeDriverBinding {
    /**
     * The ObjectQL driver package name.
     * e.g., `'@objectql/driver-memory'`, `'@objectql/driver-sqlite-wasm'`
     */
    readonly driver: string;

    /**
     * Edge-platform binding name (environment variable or resource identifier).
     * e.g., `'D1_DATABASE'` for Cloudflare D1, `'POSTGRES_URL'` for Deno Postgres.
     */
    readonly binding?: string;

    /**
     * Driver-specific configuration overrides for the edge environment.
     */
    readonly config?: Record<string, unknown>;
}

/**
 * Edge runtime adapter configuration.
 *
 * Declares how ObjectQL should adapt to a specific edge runtime.
 * Used by the edge adapter packages (e.g., `@objectql/adapter-cloudflare`).
 */
export interface EdgeAdapterConfig {
    /** Target edge runtime */
    readonly runtime: EdgeRuntime;

    /**
     * Driver bindings for this edge environment.
     * Maps datasource names to edge-specific driver bindings.
     */
    readonly bindings?: Record<string, EdgeDriverBinding>;

    /**
     * Maximum execution time in milliseconds.
     * Edge runtimes impose strict CPU time limits.
     * Default varies by runtime (e.g., 30000 for Cloudflare Workers).
     */
    readonly maxExecutionTime?: number;

    /**
     * Enable request-scoped driver connections.
     * Edge runtimes are stateless; connections are created per-request.
     * Default: true
     */
    readonly requestScoped?: boolean;
}

/**
 * Edge runtime environment capabilities.
 *
 * Declares what platform APIs are available in the target edge runtime.
 * Used by ObjectQL to select compatible code paths.
 */
export interface EdgeCapabilities {
    /** WebAssembly support */
    readonly wasm: boolean;

    /** Persistent storage available (OPFS, KV, D1, etc.) */
    readonly persistentStorage: boolean;

    /** WebSocket support for real-time sync */
    readonly webSocket: boolean;

    /** Cron/scheduled trigger support */
    readonly scheduledTriggers: boolean;

    /** Maximum request body size in bytes */
    readonly maxRequestBodySize?: number;

    /** Maximum execution time in milliseconds */
    readonly maxExecutionTime?: number;

    /** Available storage primitives */
    readonly storagePrimitives: readonly string[];
}

/**
 * Predefined edge capability profiles for known runtimes.
 */
export const EDGE_CAPABILITIES: Readonly<Record<EdgeRuntime, EdgeCapabilities>> = {
    'cloudflare-workers': {
        wasm: true,
        persistentStorage: true,
        webSocket: true,
        scheduledTriggers: true,
        maxRequestBodySize: 100 * 1024 * 1024, // 100MB
        maxExecutionTime: 30_000,
        storagePrimitives: ['D1', 'KV', 'R2', 'Durable Objects'],
    },
    'deno-deploy': {
        wasm: true,
        persistentStorage: true,
        webSocket: true,
        scheduledTriggers: true,
        maxRequestBodySize: 512 * 1024, // 512KB
        maxExecutionTime: 50_000,
        storagePrimitives: ['Deno KV', 'Deno Postgres'],
    },
    'vercel-edge': {
        wasm: true,
        persistentStorage: false,
        webSocket: false,
        scheduledTriggers: false,
        maxRequestBodySize: 4 * 1024 * 1024, // 4MB
        maxExecutionTime: 25_000,
        storagePrimitives: ['KV (via Vercel KV)', 'Postgres (via Vercel Postgres)'],
    },
    'bun': {
        wasm: true,
        persistentStorage: true,
        webSocket: true,
        scheduledTriggers: false,
        maxRequestBodySize: Infinity,
        maxExecutionTime: Infinity,
        storagePrimitives: ['SQLite (bun:sqlite)', 'File System'],
    },
    'node': {
        wasm: true,
        persistentStorage: true,
        webSocket: true,
        scheduledTriggers: false,
        maxRequestBodySize: Infinity,
        maxExecutionTime: Infinity,
        storagePrimitives: ['All drivers'],
    },
};
