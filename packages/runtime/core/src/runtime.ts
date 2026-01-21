/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { BasePlugin, UnifiedQuery, QueryProcessorContext } from '@objectql/types';
import { PluginManager } from './plugin-manager';
import { QueryPipeline } from './query-pipeline';

/**
 * Runtime configuration
 */
export interface RuntimeConfig {
    /** Plugins to register */
    plugins?: BasePlugin[];
}

/**
 * Query executor function (provided by driver or higher level)
 */
export type QueryExecutor = (objectName: string, query: UnifiedQuery) => Promise<any[]>;

/**
 * Runtime instance
 */
export interface Runtime {
    /** Plugin manager */
    pluginManager: PluginManager;
    
    /** Initialize the runtime */
    init(): Promise<void>;
    
    /** Execute a query through the pipeline */
    query(objectName: string, query: UnifiedQuery, context?: Partial<QueryProcessorContext>): Promise<any[]>;
    
    /** Shutdown the runtime */
    shutdown(): Promise<void>;
    
    /** Set the query executor (driver) */
    setQueryExecutor(executor: QueryExecutor): void;
}

/**
 * Internal runtime implementation
 */
class RuntimeImpl implements Runtime {
    public pluginManager: PluginManager;
    private pipeline: QueryPipeline;
    private queryExecutor?: QueryExecutor;

    constructor(config: RuntimeConfig) {
        this.pluginManager = new PluginManager();
        this.pipeline = new QueryPipeline(this.pluginManager);

        // Register plugins
        if (config.plugins) {
            for (const plugin of config.plugins) {
                this.pluginManager.register(plugin);
            }
        }
    }

    async init(): Promise<void> {
        await this.pluginManager.boot(this);
    }

    async query(
        objectName: string,
        query: UnifiedQuery,
        context: Partial<QueryProcessorContext> = {}
    ): Promise<any[]> {
        if (!this.queryExecutor) {
            throw new Error('Query executor not set. Call setQueryExecutor() first.');
        }

        return this.pipeline.execute(
            objectName,
            query,
            context as QueryProcessorContext,
            this.queryExecutor
        );
    }

    async shutdown(): Promise<void> {
        await this.pluginManager.shutdown();
    }

    setQueryExecutor(executor: QueryExecutor): void {
        this.queryExecutor = executor;
    }
}

/**
 * Create a runtime instance
 * @param config Runtime configuration
 * @returns Runtime instance
 */
export function createRuntime(config: RuntimeConfig = {}): Runtime {
    return new RuntimeImpl(config);
}
