/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { MetadataRegistry, ObjectConfig } from '@objectql/types';
import { ObjectLoader } from './loader';
import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

/**
 * Configuration for createAppPlugin factory.
 */
export interface AppPluginConfig {
    /**
     * Unique app identifier. Used as the service name suffix: `app.<id>`.
     * If not provided, it will be inferred from the app manifest YAML
     * in the directory, or from the directory name.
     */
    id?: string;

    /**
     * Directory path containing the app's metadata files
     * (*.object.yml, *.view.yml, *.permission.yml, etc.).
     * ObjectLoader will recursively scan this directory.
     */
    dir: string;

    /**
     * Human-readable label for the application.
     * Falls back to the app manifest's label or the id.
     */
    label?: string;

    /**
     * Description of the application.
     */
    description?: string;
}

/**
 * Assemble a manifest object from a MetadataRegistry.
 *
 * The manifest matches the format expected by the upstream
 * `ObjectQL.registerApp()` — objects as a Record, plus arrays
 * for views, permissions, workflows, etc.
 */
function assembleManifest(
    registry: MetadataRegistry,
    config: AppPluginConfig,
    appManifest: Record<string, unknown> | undefined,
): Record<string, unknown> {
    const id = config.id
        ?? (appManifest?.name as string | undefined)
        ?? path.basename(config.dir);

    // Build objects map (Record<string, ObjectConfig>)
    const objectsMap: Record<string, ObjectConfig> = {};

    // Merge actions into their parent objects.
    // registry.list() already unwraps .content, returning the inner actions map.
    // We need to use getEntry() to get the raw entry with its `id` field.
    const actionEntries = registry.listEntries('action');
    for (const entry of actionEntries) {
        const actionId = (entry.id ?? entry.name) as string;
        const actionContent = entry.content ?? entry;
        const obj = registry.get<ObjectConfig>('object', actionId);
        if (obj) {
            obj.actions = actionContent as ObjectConfig['actions'];
        }
    }

    for (const obj of registry.list<ObjectConfig>('object')) {
        objectsMap[obj.name] = obj;
    }

    // Start with app manifest as base, then override with explicit config values.
    // This ensures config.label/description take precedence over appManifest values.
    const manifest: Record<string, unknown> = {
        ...(appManifest ?? {}),
        id,
        name: id,
        label: config.label ?? (appManifest?.label as string | undefined) ?? id,
        description: config.description ?? (appManifest?.description as string | undefined),
        objects: objectsMap,
    };

    // Add collected metadata arrays (non-empty only)
    const metadataTypes = [
        'view', 'form', 'permission', 'report', 'workflow',
        'validation', 'data', 'page', 'menu',
    ];
    for (const type of metadataTypes) {
        const items = registry.list(type);
        if (items.length > 0) {
            // Pluralize key for array form: view → views, etc.
            const key = type.endsWith('s') ? type : `${type}s`;
            manifest[key] = items;
        }
    }

    // Always include objects even if empty (signal to registerApp)
    if (Object.keys(objectsMap).length === 0) {
        manifest.objects = {};
    }

    return manifest;
}

/**
 * Create a plugin that loads metadata from a filesystem directory
 * and registers it as an `app.<id>` service.
 *
 * The upstream `@objectstack/objectql` ObjectQLPlugin will automatically
 * discover all `app.*` services during its `start()` phase and call
 * `ql.registerApp(manifest)` for each one.
 *
 * **Usage:**
 * ```typescript
 * import { createAppPlugin } from '@objectql/platform-node';
 * import path from 'path';
 *
 * export default {
 *     plugins: [
 *         new ObjectQLPlugin(),
 *         createAppPlugin({
 *             id: 'project-tracker',
 *             dir: path.join(__dirname, 'examples/showcase/project-tracker/src'),
 *         }),
 *         // ... other plugins
 *     ]
 * };
 * ```
 *
 * @param config - App plugin configuration
 * @returns A plugin object compatible with @objectstack/core Plugin interface
 */
export function createAppPlugin(config: AppPluginConfig) {
    const { dir } = config;

    return {
        name: `app-loader:${config.id ?? path.basename(dir)}`,
        type: 'app' as const,

        /**
         * init phase: Load metadata and register as `app.<id>` service.
         */
        init: async (ctx: {
            registerService: (name: string, service: unknown) => void;
            logger?: { info: (...args: unknown[]) => void; debug: (...args: unknown[]) => void };
        }) => {
            const log = ctx.logger ?? console;

            // Validate directory exists
            if (!fs.existsSync(dir)) {
                log.info(`[AppPlugin] Directory not found, skipping: ${dir}`);
                return;
            }

            // 1. Load metadata using ObjectLoader
            const registry = new MetadataRegistry();
            const loader = new ObjectLoader(registry);
            loader.load(dir);

            // 2. Extract app manifest from loaded *.app.yml files (if any)
            const appEntries = registry.list<{ content?: Record<string, unknown> }>('app');
            const appManifest = appEntries.length > 0
                ? (appEntries[0].content ?? appEntries[0]) as Record<string, unknown>
                : undefined;

            // 3. Assemble the full manifest
            const manifest = assembleManifest(registry, config, appManifest);
            const appId = manifest.id as string;

            // 4. Register as app.<id> service for ObjectQLPlugin auto-discovery
            const serviceName = `app.${appId}`;
            ctx.registerService(serviceName, manifest);

            log.info(`[AppPlugin] Registered service '${serviceName}'`, {
                objects: Object.keys(manifest.objects as Record<string, unknown>).length,
                dir,
            });
        },

        /**
         * start phase: No-op — ObjectQLPlugin handles registration during its start().
         */
        start: async () => {},
    };
}
