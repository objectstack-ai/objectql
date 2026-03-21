/**
 * ObjectQL Demo — Application Configuration
 *
 * ObjectStack configuration for the demo application.
 * Uses @objectql/driver-turso when TURSO_DATABASE_URL is set,
 * falls back to MemoryDriver for zero-config local development.
 *
 * For local development: `pnpm dev` (uses @objectstack/cli)
 * For Vercel deployment: configured via api/[[...route]].ts
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

import { HonoServerPlugin } from '@objectstack/plugin-hono-server';
import { AuthPlugin } from '@objectstack/plugin-auth';
import { ConsolePlugin } from '@object-ui/console';
import { ObjectQLPlugin } from '@objectstack/objectql';
import { QueryPlugin } from '@objectql/plugin-query';
import { ValidatorPlugin } from '@objectql/plugin-validator';
import { FormulaPlugin } from '@objectql/plugin-formula';
import { ObjectQLSecurityPlugin } from '@objectql/plugin-security';
import { createApiRegistryPlugin } from '@objectstack/core';
import { MemoryDriver } from '@objectql/driver-memory';
import { createTursoDriver } from '@objectql/driver-turso';
import { createAppPlugin } from '@objectql/platform-node';

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

const defaultDriver = createDefaultDriver();

// Load the project-tracker showcase metadata.
const projectTrackerPlugin = createAppPlugin({
    id: 'project-tracker',
    dir: path.join(__dirname, '../../examples/showcase/project-tracker/src'),
    label: 'Project Tracker',
    description: 'A showcase of ObjectQL capabilities including all field types.',
});

export default {
    metadata: {
        name: 'objectql-demo',
        version: '1.0.0',
    },
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
                // Connect Turso driver if applicable (MemoryDriver.connect() is a no-op)
                if (typeof (defaultDriver as any).connect === 'function') {
                    await (defaultDriver as { connect: () => Promise<void> }).connect();
                }
            },
        },
        projectTrackerPlugin,
        new ObjectQLPlugin(),
        new QueryPlugin({ datasources: { default: defaultDriver } }),
        new ValidatorPlugin(),
        new FormulaPlugin(),
        new ObjectQLSecurityPlugin({ enableAudit: false }),
        new AuthPlugin({
            secret: process.env.AUTH_SECRET || 'objectql-demo-dev-secret-change-me-in-production',
            trustedOrigins: ['http://localhost:*'],
        }),
    ],
};
