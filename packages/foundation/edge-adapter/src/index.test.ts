/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect } from 'vitest';
import { detectRuntime } from './detector.js';
import { getCapabilities, validateCapabilities } from './capabilities.js';
import { resolveBindings, getDefaultDriver } from './binding-resolver.js';
import { EdgeAdapterPlugin } from './plugin.js';

describe('Edge Runtime Detector', () => {
    it('should detect Node.js as default runtime', () => {
        expect(detectRuntime()).toBe('node');
    });

    it('should detect Deno runtime', () => {
        (globalThis as Record<string, unknown>).Deno = { version: { deno: '1.0.0' } };
        expect(detectRuntime()).toBe('deno-deploy');
        delete (globalThis as Record<string, unknown>).Deno;
    });

    it('should detect Bun runtime', () => {
        (globalThis as Record<string, unknown>).Bun = { version: '1.0.0' };
        expect(detectRuntime()).toBe('bun');
        delete (globalThis as Record<string, unknown>).Bun;
    });

    it('should detect Vercel Edge runtime', () => {
        (globalThis as Record<string, unknown>).EdgeRuntime = 'edge';
        expect(detectRuntime()).toBe('vercel-edge');
        delete (globalThis as Record<string, unknown>).EdgeRuntime;
    });
});

describe('Capability Validator', () => {
    it('should return capabilities for all runtimes', () => {
        const runtimes = ['cloudflare-workers', 'deno-deploy', 'vercel-edge', 'bun', 'node'] as const;
        for (const runtime of runtimes) {
            const caps = getCapabilities(runtime);
            expect(caps).toBeDefined();
            expect(typeof caps.wasm).toBe('boolean');
        }
    });

    it('should validate passing requirements', () => {
        const result = validateCapabilities('node', { wasm: true, persistentStorage: true });
        expect(result.valid).toBe(true);
        expect(result.missing).toHaveLength(0);
    });

    it('should validate failing requirements for vercel-edge', () => {
        const result = validateCapabilities('vercel-edge', {
            persistentStorage: true,
            webSocket: true,
        });
        expect(result.valid).toBe(false);
        expect(result.missing).toContain('Persistent Storage');
        expect(result.missing).toContain('WebSocket');
    });

    it('should check execution time limits', () => {
        const result = validateCapabilities('vercel-edge', {
            minExecutionTime: 60000,
        });
        expect(result.valid).toBe(false);
        expect(result.missing.length).toBeGreaterThan(0);
    });

    it('should pass execution time check for unlimited runtimes', () => {
        const result = validateCapabilities('node', {
            minExecutionTime: 60000,
        });
        expect(result.valid).toBe(true);
    });
});

describe('Binding Resolver', () => {
    it('should resolve explicit bindings', () => {
        const resolved = resolveBindings({
            runtime: 'cloudflare-workers',
            bindings: {
                main: {
                    driver: '@objectql/driver-sqlite-wasm',
                    binding: 'D1_DATABASE',
                    config: { database: 'my-db' },
                },
            },
        });
        expect(resolved).toHaveLength(1);
        expect(resolved[0].datasource).toBe('main');
        expect(resolved[0].driver).toBe('@objectql/driver-sqlite-wasm');
        expect(resolved[0].binding).toBe('D1_DATABASE');
    });

    it('should provide default binding when none specified', () => {
        const resolved = resolveBindings({ runtime: 'cloudflare-workers' });
        expect(resolved).toHaveLength(1);
        expect(resolved[0].datasource).toBe('default');
        expect(resolved[0].driver).toBe('@objectql/driver-sqlite-wasm');
    });

    it('should return default drivers for each runtime', () => {
        expect(getDefaultDriver('cloudflare-workers')).toBe('@objectql/driver-sqlite-wasm');
        expect(getDefaultDriver('deno-deploy')).toBe('@objectql/driver-pg-wasm');
        expect(getDefaultDriver('vercel-edge')).toBe('@objectql/driver-memory');
        expect(getDefaultDriver('bun')).toBe('@objectql/driver-sqlite-wasm');
        expect(getDefaultDriver('node')).toBe('@objectql/driver-sql');
    });
});

describe('EdgeAdapterPlugin', () => {
    it('should have correct name and version', () => {
        const plugin = new EdgeAdapterPlugin();
        expect(plugin.name).toBe('@objectql/edge-adapter');
        expect(plugin.version).toBe('4.2.0');
    });

    it('should install with auto-detected runtime', async () => {
        const plugin = new EdgeAdapterPlugin();
        const kernel: Record<string, unknown> = {};
        await plugin.install({ engine: kernel });
        const edge = kernel['edge'] as Record<string, unknown>;
        expect(edge).toBeDefined();
        expect(edge.runtime).toBe('node');
        expect(edge.capabilities).toBeDefined();
        expect(edge.bindings).toBeDefined();
    });

    it('should install with explicit runtime', async () => {
        const plugin = new EdgeAdapterPlugin({ runtime: 'cloudflare-workers' });
        const kernel: Record<string, unknown> = {};
        await plugin.install({ engine: kernel });
        const edge = kernel['edge'] as Record<string, unknown>;
        expect(edge.runtime).toBe('cloudflare-workers');
    });

    it('should throw when capabilities requirements are not met', async () => {
        const plugin = new EdgeAdapterPlugin({
            runtime: 'vercel-edge',
            requirements: { persistentStorage: true },
        });
        const kernel: Record<string, unknown> = {};
        await expect(plugin.install({ engine: kernel })).rejects.toThrow('missing capabilities');
    });

    it('should resolve bindings after install', async () => {
        const plugin = new EdgeAdapterPlugin({
            runtime: 'cloudflare-workers',
            bindings: {
                primary: { driver: '@objectql/driver-sqlite-wasm', binding: 'D1' },
            },
        });
        const kernel: Record<string, unknown> = {};
        await plugin.install({ engine: kernel });
        const bindings = plugin.getResolvedBindings();
        expect(bindings).toHaveLength(1);
        expect(bindings[0].datasource).toBe('primary');
    });

    it('should support onStart and onStop lifecycle', async () => {
        const plugin = new EdgeAdapterPlugin();
        const ctx = { engine: {} };
        await plugin.install(ctx);
        await plugin.onStart(ctx);
        await plugin.onStop(ctx);
    });
});
