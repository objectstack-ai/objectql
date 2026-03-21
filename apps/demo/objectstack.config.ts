/**
 * ObjectQL Demo — Application Configuration
 *
 * Minimal ObjectStack configuration for the demo application.
 * Uses in-memory driver with the project-tracker showcase example.
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
import { createAppPlugin } from '@objectql/platform-node';

// In-memory driver — zero-config, no external DB required.
const defaultDriver = new MemoryDriver();

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
        // Register the driver as 'driver.default' service.
        {
            name: 'driver-default',
            init: async (ctx: any) => {
                ctx.registerService('driver.default', defaultDriver);
            },
            start: async () => {},
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
