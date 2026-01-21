/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { IObjectQL } from './app';
import { UnifiedQuery } from './query';

export interface ObjectQLPlugin {
    name: string;
    setup(app: IObjectQL): void | Promise<void>;
}

/**
 * Plugin metadata for dependency management and lifecycle
 */
export interface PluginMetadata {
    /** Unique plugin name */
    name: string;
    /** Plugin version (semver format) */
    version?: string;
    /** Plugin type classification */
    type?: 'driver' | 'repository' | 'query_processor' | 'extension';
    /** Plugin dependencies (plugin names that must be loaded first) */
    dependencies?: string[];
}

/**
 * Base plugin interface with lifecycle and dependency support
 */
export interface BasePlugin {
    /** Plugin metadata */
    readonly metadata: PluginMetadata;
    
    /** Setup hook called during plugin initialization */
    setup?(runtime: any): void | Promise<void>;
    
    /** Teardown hook called during plugin shutdown */
    teardown?(): void | Promise<void>;
}

/**
 * Context provided to query processor plugins
 */
export interface QueryProcessorContext {
    /** The object being queried */
    objectName: string;
    /** Current user/session context */
    user?: {
        id: string | number;
        [key: string]: any;
    };
    /** Additional runtime context */
    [key: string]: any;
}

/**
 * Plugin interface for query processing pipeline
 */
export interface QueryProcessorPlugin extends BasePlugin {
    metadata: PluginMetadata & { type: 'query_processor' };
    
    /** 
     * Validate query before execution
     * Can throw errors to reject the query
     */
    validateQuery?(query: UnifiedQuery, context: QueryProcessorContext): void | Promise<void>;
    
    /** 
     * Transform query before execution
     * Returns modified query (async waterfall pattern)
     */
    beforeQuery?(query: UnifiedQuery, context: QueryProcessorContext): UnifiedQuery | Promise<UnifiedQuery>;
    
    /** 
     * Process results after query execution
     * Returns modified results (async waterfall pattern)
     */
    afterQuery?(results: any[], context: QueryProcessorContext): any[] | Promise<any[]>;
}
