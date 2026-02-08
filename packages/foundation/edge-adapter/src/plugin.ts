/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { RuntimePlugin, RuntimeContext, EdgeAdapterConfig } from '@objectql/types';
import { detectRuntime } from './detector.js';
import { validateCapabilities, getCapabilities, type CapabilityRequirement } from './capabilities.js';
import { resolveBindings, type ResolvedBinding } from './binding-resolver.js';

/**
 * Configuration options for the EdgeAdapterPlugin.
 */
export interface EdgeAdapterPluginConfig {
    /** Override auto-detected runtime */
    readonly runtime?: EdgeAdapterConfig['runtime'];
    /** Edge driver bindings */
    readonly bindings?: EdgeAdapterConfig['bindings'];
    /** Maximum execution time override */
    readonly maxExecutionTime?: number;
    /** Enable request-scoped connections (default: true) */
    readonly requestScoped?: boolean;
    /** Capability requirements to validate on startup */
    readonly requirements?: CapabilityRequirement;
}

/**
 * Edge adapter plugin for the ObjectStack runtime.
 *
 * Detects the current edge runtime, validates capabilities,
 * resolves driver bindings, and registers edge context on the kernel.
 */
export class EdgeAdapterPlugin implements RuntimePlugin {
    readonly name = '@objectql/edge-adapter';
    readonly version = '4.2.0';

    private readonly config: EdgeAdapterPluginConfig;
    private resolvedBindings: readonly ResolvedBinding[] = [];

    constructor(config: EdgeAdapterPluginConfig = {}) {
        this.config = config;
    }

    async install(ctx: RuntimeContext): Promise<void> {
        const runtime = this.config.runtime ?? detectRuntime();
        const capabilities = getCapabilities(runtime);

        // Validate capabilities if requirements specified
        if (this.config.requirements) {
            const validation = validateCapabilities(runtime, this.config.requirements);
            if (!validation.valid) {
                throw new Error(
                    `[${this.name}] Runtime '${runtime}' missing capabilities: ${validation.missing.join(', ')}`,
                );
            }
        }

        // Resolve driver bindings
        const adapterConfig: EdgeAdapterConfig = {
            runtime,
            bindings: this.config.bindings,
            maxExecutionTime: this.config.maxExecutionTime ?? capabilities.maxExecutionTime,
            requestScoped: this.config.requestScoped ?? true,
        };

        this.resolvedBindings = resolveBindings(adapterConfig);

        // Register edge context on the kernel
        const kernel = ctx.engine as Record<string, unknown>;
        kernel['edge'] = {
            runtime,
            capabilities,
            bindings: this.resolvedBindings,
            config: adapterConfig,
        };
    }

    async onStart(_ctx: RuntimeContext): Promise<void> {
        // Edge runtimes are typically stateless; no long-lived connections needed
    }

    async onStop(_ctx: RuntimeContext): Promise<void> {
        // Cleanup
    }

    /** Get the resolved bindings (available after install) */
    getResolvedBindings(): readonly ResolvedBinding[] {
        return this.resolvedBindings;
    }
}
