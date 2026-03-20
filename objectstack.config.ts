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
import { ObjectLoader } from '@objectql/platform-node';
import { MetadataRegistry, AppConfig, ObjectConfig } from '@objectql/types';

/** Minimal shape of the PluginContext provided by @objectstack/core during init(). */
interface PluginInitContext {
    registerService(name: string, service: unknown): void;
}

/** App manifest enriched with objects and a guaranteed id field for SchemaRegistry. */
interface AppManifest extends AppConfig {
    id: string;
    objects: Record<string, ObjectConfig>;
}

/**
 * Loads all metadata from a given directory using ObjectLoader and returns a
 * list of app manifests, each enriched with the objects found in that directory.
 *
 * @param dir - Absolute path to the app source directory (scanned recursively)
 */
function loadAppManifests(dir: string): AppManifest[] {
    const registry = new MetadataRegistry();
    const loader = new ObjectLoader(registry);
    loader.load(dir);

    const apps = registry.list<AppConfig>('app');
    if (apps.length === 0) return [];

    // Build an object map from all objects loaded in this directory
    const objects: Record<string, ObjectConfig> = {};
    for (const obj of registry.list<ObjectConfig>('object')) {
        if (obj.name) objects[obj.name] = obj;
    }

    return apps.map(app => ({
        ...app,
        // Ensure manifest.id is always set so SchemaRegistry.installPackage()
        // can index it correctly (falls back to name if id is absent in YAML).
        id: (app as AppConfig & { id?: string }).id ?? app.name,
        objects,
    }));
}

/**
 * ExampleAppsPlugin — RuntimePlugin that loads the showcase example apps.
 *
 * Follows the ObjectStack convention: metadata is loaded inside plugins using
 * ObjectLoader from @objectql/platform-node, not via manual fs code in the
 * config.  The plugin registers `app.<name>` services so that the upstream
 * ObjectQLPlugin can discover and install them during its start() phase.
 */
const ExampleAppsPlugin = {
    name: 'example-apps',
    async init(ctx: PluginInitContext) {
        const exampleDirs = [
            path.join(__dirname, 'examples/showcase/project-tracker/src'),
            path.join(__dirname, 'examples/showcase/enterprise-erp/src'),
        ];

        for (const dir of exampleDirs) {
            const manifests = loadAppManifests(dir);
            for (const manifest of manifests) {
                ctx.registerService(`app.${manifest.name}`, manifest);
            }
        }
    },
    async start() {},
};

// Shared driver instance — registered as 'driver.default' service for
// upstream ObjectQLPlugin discovery and passed to QueryPlugin for query execution.
const defaultDriver = new MemoryDriver();

export default {
    metadata: {
        name: 'objectos',
        version: '1.0.0'
    },
    // Runtime plugins (instances only)
    plugins: [
        createApiRegistryPlugin(),
        new HonoServerPlugin({}),
        new ConsolePlugin(),
        // Load all example app metadata and register app.* services so the
        // upstream ObjectQLPlugin can discover and install them.
        ExampleAppsPlugin,
        // Register MemoryDriver as 'driver.default' service so upstream
        // ObjectQLPlugin can discover it during start() phase.
        {
            name: 'driver-memory',
            init: async (ctx: any) => {
                ctx.registerService('driver.default', defaultDriver);
            },
            start: async () => {},
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
