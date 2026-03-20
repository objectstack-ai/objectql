/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createRequire } from 'module';
import * as path from 'path';

// Polyfill require and __dirname for ESM
if (typeof globalThis.require === 'undefined') {
    const require = createRequire(import.meta.url);
    (globalThis as any).require = require;
}
if (typeof globalThis.__dirname === 'undefined') {
    (globalThis as any).__dirname = path.dirname(new URL(import.meta.url).pathname);
}

import { ObjectQLSecurityPlugin } from '@objectql/plugin-security';
import { GraphQLPlugin } from '@objectql/protocol-graphql';
import { ODataV4Plugin } from '@objectql/protocol-odata-v4';
import { JSONRPCPlugin } from '@objectql/protocol-json-rpc';
import { HonoServerPlugin } from '@objectstack/plugin-hono-server';
import { AuthPlugin } from '@objectstack/plugin-auth';
import { ConsolePlugin } from '@object-ui/console';
import { ObjectQLPlugin } from '@objectstack/objectql';
import { QueryPlugin } from '@objectql/plugin-query';
import { ValidatorPlugin } from '@objectql/plugin-validator';
import { FormulaPlugin } from '@objectql/plugin-formula';
import { createApiRegistryPlugin } from '@objectstack/core';
import { MemoryDriver } from '@objectql/driver-memory';
import { createTursoDriver } from '@objectql/driver-turso';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

function loadObjects(dir: string) {
    const objects: Record<string, any> = {};
    if (!fs.existsSync(dir)) return objects;
    
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file.endsWith('.object.yml') || file.endsWith('.object.yaml')) {
            const content = fs.readFileSync(path.join(dir, file), 'utf8');
            try {
                const doc = yaml.load(content) as any;
                if (doc) {
                    const name = doc.name || file.replace(/\.object\.ya?ml$/, '');
                    objects[name] = { ...doc, name };
                }
            } catch (e) {
                console.error(`Failed to load ${file}:`, e);
            }
        }
    }
    return objects;
}

const projectTrackerDir = path.join(__dirname, 'examples/showcase/project-tracker/src');

// Choose driver based on environment — Turso when TURSO_DATABASE_URL is set,
// MemoryDriver otherwise (zero-config fallback for quick starts).
function createDefaultDriver() {
    const tursoUrl = process.env.TURSO_DATABASE_URL;
    if (tursoUrl) {
        console.log(`🗄️  Driver: Turso (${tursoUrl})`);
        const syncUrl = process.env.TURSO_SYNC_URL;
        return createTursoDriver({
            url: tursoUrl,
            authToken: process.env.TURSO_AUTH_TOKEN,
            syncUrl,
            sync: syncUrl
                ? {
                    intervalSeconds: Number(process.env.TURSO_SYNC_INTERVAL) || 60,
                    onConnect: true,
                }
                : undefined,
        });
    }
    console.log('🗄️  Driver: Memory (in-memory, non-persistent)');
    return new MemoryDriver();
}

// Shared driver instance — registered as 'driver.default' service for
// upstream ObjectQLPlugin discovery and passed to QueryPlugin for query execution.
const defaultDriver = createDefaultDriver();

export default {
    metadata: {
        name: 'objectos',
        version: '1.0.0'
    },
    objects: loadObjects(projectTrackerDir),
    // Runtime plugins (instances only)
    plugins: [
        createApiRegistryPlugin(),
        new HonoServerPlugin({}),
        new ConsolePlugin(),
        // Register the active driver as 'driver.default' service so upstream
        // ObjectQLPlugin can discover it during start() phase.
        {
            name: 'driver-default',
            init: async (ctx: any) => {
                ctx.registerService('driver.default', defaultDriver);
            },
            start: async () => {
                // Connect Turso driver if applicable (MemoryDriver has no connect method)
                if ('connect' in defaultDriver && typeof (defaultDriver as { connect: () => Promise<void> }).connect === 'function') {
                    await (defaultDriver as { connect: () => Promise<void> }).connect();
                }
            },
        },
        // Upstream ObjectQLPlugin from @objectstack/objectql:
        // - Registers objectql, metadata, data, protocol services
        // - Discovers driver.* and app.* services (fixes auth plugin object registration)
        // - Registers audit hooks (created_by/updated_by) and tenant isolation middleware
        new ObjectQLPlugin(),
        new QueryPlugin({ datasources: { default: defaultDriver } }),
        new ValidatorPlugin(),
        new FormulaPlugin(),
        new ObjectQLSecurityPlugin({
            enableAudit: false
        }),
        new AuthPlugin({
            secret: process.env.AUTH_SECRET || 'objectql-dev-secret-change-me-in-production',
            trustedOrigins: ['http://localhost:*'],
        }),
        new GraphQLPlugin({
            basePath: '/graphql',
            introspection: true,
            enableSubscriptions: true
        }),
        new ODataV4Plugin({
            basePath: '/odata',
            enableBatch: true,
            enableSearch: true,
            enableETags: true
        }),
        new JSONRPCPlugin({
            basePath: '/rpc',
            enableIntrospection: true,
            enableSessions: true
        })
    ]
};
