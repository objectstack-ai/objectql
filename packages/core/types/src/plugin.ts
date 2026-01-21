/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Base plugin metadata required by all ObjectQL plugins.
 * 
 * This extends the RuntimePlugin from @objectstack/runtime with
 * ObjectQL-specific plugin types.
 */
export interface PluginMetadata {
    /** Unique plugin identifier (e.g., '@objectql/query-validation') */
    name: string;
    
    /** Semantic version (e.g., '4.0.0') */
    version: string;
    
    /** Plugin type discriminator */
    type: PluginType;
    
    /** Required plugin dependencies */
    dependencies?: string[];
    
    /** Optional plugin dependencies that enhance functionality */
    optionalDependencies?: string[];
    
    /** Plugins that conflict with this one */
    conflicts?: string[];
}

/**
 * Supported ObjectQL plugin types.
 */
export type PluginType = 
    | 'driver'
    | 'query-processor'
    | 'repository'
    | 'feature'
    | 'custom';

/**
 * Plugin lifecycle methods.
 */
export interface PluginLifecycle {
    /**
     * Called when the plugin is registered with the runtime.
     * Use this to initialize resources, register handlers, etc.
     */
    setup?(runtime: any): Promise<void>;
    
    /**
     * Called when the runtime is shutting down.
     * Use this to cleanup resources, close connections, etc.
     */
    teardown?(runtime: any): Promise<void>;
}

/**
 * Base plugin interface that all ObjectQL plugins must implement.
 * 
 * This is a minimal interface that can be extended by specific plugin types.
 */
export interface BasePlugin extends PluginMetadata, PluginLifecycle {}
