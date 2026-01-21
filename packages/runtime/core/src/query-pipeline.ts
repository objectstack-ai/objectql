/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { UnifiedQuery, QueryProcessorPlugin, QueryProcessorContext } from '@objectql/types';
import { PluginManager } from './plugin-manager';

/**
 * Error thrown when query pipeline operations fail
 */
export class PipelineError extends Error {
    constructor(
        public code: 'VALIDATION_FAILED' | 'EXECUTION_FAILED',
        message: string,
        public pluginName?: string
    ) {
        super(message);
        this.name = 'PipelineError';
    }
}

/**
 * QueryPipeline manages query processing through registered plugins
 * using async series waterfall pattern
 */
export class QueryPipeline {
    constructor(private pluginManager: PluginManager) {}

    /**
     * Execute a query through the pipeline
     * @param objectName The object to query
     * @param query The query to execute
     * @param context Query execution context
     * @param executor Function to execute the query (driver)
     * @returns Query results
     */
    async execute(
        objectName: string,
        query: UnifiedQuery,
        context: QueryProcessorContext,
        executor: (objectName: string, query: UnifiedQuery) => Promise<any[]>
    ): Promise<any[]> {
        const processors = this.getQueryProcessors();

        // Prepare context
        const fullContext: QueryProcessorContext = {
            ...context,
            objectName
        };

        // Phase 1: Validation
        await this.runValidation(processors, query, fullContext);

        // Phase 2: beforeQuery (waterfall transformation)
        const transformedQuery = await this.runBeforeQuery(processors, query, fullContext);

        // Phase 3: Execute query
        let results: any[];
        try {
            results = await executor(objectName, transformedQuery);
        } catch (error) {
            throw new PipelineError(
                'EXECUTION_FAILED',
                `Query execution failed: ${error instanceof Error ? error.message : String(error)}`
            );
        }

        // Phase 4: afterQuery (waterfall transformation)
        const transformedResults = await this.runAfterQuery(processors, results, fullContext);

        return transformedResults;
    }

    /**
     * Get all registered query processor plugins
     */
    private getQueryProcessors(): QueryProcessorPlugin[] {
        return this.pluginManager
            .getByType('query_processor')
            .filter((p): p is QueryProcessorPlugin => {
                return p.metadata.type === 'query_processor';
            });
    }

    /**
     * Run validation phase
     */
    private async runValidation(
        processors: QueryProcessorPlugin[],
        query: UnifiedQuery,
        context: QueryProcessorContext
    ): Promise<void> {
        for (const processor of processors) {
            if (processor.validateQuery) {
                try {
                    await processor.validateQuery(query, context);
                } catch (error) {
                    throw new PipelineError(
                        'VALIDATION_FAILED',
                        `Query validation failed in plugin "${processor.metadata.name}": ${
                            error instanceof Error ? error.message : String(error)
                        }`,
                        processor.metadata.name
                    );
                }
            }
        }
    }

    /**
     * Run beforeQuery phase (async series waterfall)
     * Each plugin receives the output of the previous plugin
     */
    private async runBeforeQuery(
        processors: QueryProcessorPlugin[],
        initialQuery: UnifiedQuery,
        context: QueryProcessorContext
    ): Promise<UnifiedQuery> {
        let currentQuery = initialQuery;

        for (const processor of processors) {
            if (processor.beforeQuery) {
                try {
                    const result = await processor.beforeQuery(currentQuery, context);
                    currentQuery = result || currentQuery;
                } catch (error) {
                    throw new PipelineError(
                        'EXECUTION_FAILED',
                        `beforeQuery failed in plugin "${processor.metadata.name}": ${
                            error instanceof Error ? error.message : String(error)
                        }`,
                        processor.metadata.name
                    );
                }
            }
        }

        return currentQuery;
    }

    /**
     * Run afterQuery phase (async series waterfall)
     * Each plugin receives the output of the previous plugin
     */
    private async runAfterQuery(
        processors: QueryProcessorPlugin[],
        initialResults: any[],
        context: QueryProcessorContext
    ): Promise<any[]> {
        let currentResults = initialResults;

        for (const processor of processors) {
            if (processor.afterQuery) {
                try {
                    const result = await processor.afterQuery(currentResults, context);
                    currentResults = result || currentResults;
                } catch (error) {
                    throw new PipelineError(
                        'EXECUTION_FAILED',
                        `afterQuery failed in plugin "${processor.metadata.name}": ${
                            error instanceof Error ? error.message : String(error)
                        }`,
                        processor.metadata.name
                    );
                }
            }
        }

        return currentResults;
    }
}
