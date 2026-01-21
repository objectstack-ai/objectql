/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { QueryPipeline, PipelineError } from '../src/query-pipeline';
import { PluginManager } from '../src/plugin-manager';
import { QueryProcessorPlugin, UnifiedQuery, QueryProcessorContext } from '@objectql/types';

describe('QueryPipeline', () => {
    let manager: PluginManager;
    let pipeline: QueryPipeline;

    beforeEach(() => {
        manager = new PluginManager();
        pipeline = new QueryPipeline(manager);
    });

    describe('basic execution', () => {
        it('should execute query without any processors', async () => {
            const mockExecutor = jest.fn().mockResolvedValue([
                { id: 1, name: 'Test' }
            ]);

            const results = await pipeline.execute(
                'project',
                { filters: [['status', '=', 'active']] },
                { objectName: 'project' },
                mockExecutor
            );

            expect(results).toEqual([{ id: 1, name: 'Test' }]);
            expect(mockExecutor).toHaveBeenCalledWith('project', {
                filters: [['status', '=', 'active']]
            });
        });

        it('should throw error if executor fails', async () => {
            const mockExecutor = jest.fn().mockRejectedValue(new Error('DB error'));

            await expect(
                pipeline.execute(
                    'project',
                    {},
                    { objectName: 'project' },
                    mockExecutor
                )
            ).rejects.toThrow(PipelineError);
        });
    });

    describe('validation phase', () => {
        it('should run validation before execution', async () => {
            const validationCalls: string[] = [];

            const plugin: QueryProcessorPlugin = {
                metadata: {
                    name: 'validator',
                    type: 'query_processor'
                },
                async validateQuery(query, context) {
                    validationCalls.push('validated');
                    if (!query.filters || query.filters.length === 0) {
                        throw new Error('Filters required');
                    }
                }
            };

            manager.register(plugin);

            const mockExecutor = jest.fn().mockResolvedValue([]);

            // Should pass validation
            await pipeline.execute('project', { filters: [['id', '=', 1]] }, {
                objectName: 'project'
            }, mockExecutor);

            expect(validationCalls).toHaveLength(1);

            // Should fail validation
            await expect(
                pipeline.execute('project', {}, { objectName: 'project' }, mockExecutor)
            ).rejects.toThrow(PipelineError);
        });

        it('should run all validators', async () => {
            const validations: string[] = [];

            const plugin1: QueryProcessorPlugin = {
                metadata: { name: 'v1', type: 'query_processor' },
                async validateQuery() {
                    validations.push('v1');
                }
            };

            const plugin2: QueryProcessorPlugin = {
                metadata: { name: 'v2', type: 'query_processor' },
                async validateQuery() {
                    validations.push('v2');
                }
            };

            manager.register(plugin1);
            manager.register(plugin2);

            await pipeline.execute('project', {}, { objectName: 'project' }, async () => []);

            expect(validations).toEqual(['v1', 'v2']);
        });
    });

    describe('beforeQuery phase (waterfall)', () => {
        it('should transform query through waterfall', async () => {
            const plugin1: QueryProcessorPlugin = {
                metadata: { name: 'p1', type: 'query_processor' },
                async beforeQuery(query) {
                    return {
                        ...query,
                        fields: ['id', 'name']
                    };
                }
            };

            const plugin2: QueryProcessorPlugin = {
                metadata: { name: 'p2', type: 'query_processor' },
                async beforeQuery(query) {
                    return {
                        ...query,
                        limit: 10
                    };
                }
            };

            manager.register(plugin1);
            manager.register(plugin2);

            const mockExecutor = jest.fn().mockResolvedValue([]);

            await pipeline.execute('project', {}, { objectName: 'project' }, mockExecutor);

            expect(mockExecutor).toHaveBeenCalledWith('project', {
                fields: ['id', 'name'],
                limit: 10
            });
        });

        it('should pass transformed query from one plugin to next', async () => {
            let receivedQuery: UnifiedQuery | null = null;

            const plugin1: QueryProcessorPlugin = {
                metadata: { name: 'p1', type: 'query_processor' },
                async beforeQuery(query) {
                    return {
                        ...query,
                        modified: 'by-p1'
                    } as any;
                }
            };

            const plugin2: QueryProcessorPlugin = {
                metadata: { name: 'p2', type: 'query_processor' },
                async beforeQuery(query) {
                    receivedQuery = query;
                    return query;
                }
            };

            manager.register(plugin1);
            manager.register(plugin2);

            await pipeline.execute('project', {}, { objectName: 'project' }, async () => []);

            expect(receivedQuery).toEqual({ modified: 'by-p1' });
        });
    });

    describe('afterQuery phase (waterfall)', () => {
        it('should transform results through waterfall', async () => {
            const plugin1: QueryProcessorPlugin = {
                metadata: { name: 'p1', type: 'query_processor' },
                async afterQuery(results) {
                    return results.map(r => ({ ...r, decorated: true }));
                }
            };

            const plugin2: QueryProcessorPlugin = {
                metadata: { name: 'p2', type: 'query_processor' },
                async afterQuery(results) {
                    return results.filter(r => (r as any).decorated);
                }
            };

            manager.register(plugin1);
            manager.register(plugin2);

            const mockExecutor = jest.fn().mockResolvedValue([
                { id: 1 },
                { id: 2 }
            ]);

            const results = await pipeline.execute(
                'project',
                {},
                { objectName: 'project' },
                mockExecutor
            );

            expect(results).toEqual([
                { id: 1, decorated: true },
                { id: 2, decorated: true }
            ]);
        });

        it('should pass transformed results from one plugin to next', async () => {
            let receivedResults: any[] | null = null;

            const plugin1: QueryProcessorPlugin = {
                metadata: { name: 'p1', type: 'query_processor' },
                async afterQuery(results) {
                    return [{ modified: 'by-p1' }];
                }
            };

            const plugin2: QueryProcessorPlugin = {
                metadata: { name: 'p2', type: 'query_processor' },
                async afterQuery(results) {
                    receivedResults = results;
                    return results;
                }
            };

            manager.register(plugin1);
            manager.register(plugin2);

            await pipeline.execute('project', {}, { objectName: 'project' }, async () => []);

            expect(receivedResults).toEqual([{ modified: 'by-p1' }]);
        });
    });

    describe('complete pipeline flow', () => {
        it('should execute validation -> beforeQuery -> execute -> afterQuery', async () => {
            const executionOrder: string[] = [];

            const plugin: QueryProcessorPlugin = {
                metadata: { name: 'complete', type: 'query_processor' },
                async validateQuery() {
                    executionOrder.push('validate');
                },
                async beforeQuery(query) {
                    executionOrder.push('before');
                    return query;
                },
                async afterQuery(results) {
                    executionOrder.push('after');
                    return results;
                }
            };

            manager.register(plugin);

            const mockExecutor = jest.fn(async () => {
                executionOrder.push('execute');
                return [];
            });

            await pipeline.execute('project', {}, { objectName: 'project' }, mockExecutor);

            expect(executionOrder).toEqual(['validate', 'before', 'execute', 'after']);
        });

        it('should pass context to all hooks', async () => {
            const receivedContexts: QueryProcessorContext[] = [];

            const plugin: QueryProcessorPlugin = {
                metadata: { name: 'ctx-test', type: 'query_processor' },
                async validateQuery(query, context) {
                    receivedContexts.push(context);
                },
                async beforeQuery(query, context) {
                    receivedContexts.push(context);
                    return query;
                },
                async afterQuery(results, context) {
                    receivedContexts.push(context);
                    return results;
                }
            };

            manager.register(plugin);

            const testContext = {
                objectName: 'project',
                user: { id: 'user-123' }
            };

            await pipeline.execute('project', {}, testContext, async () => []);

            expect(receivedContexts).toHaveLength(3);
            receivedContexts.forEach(ctx => {
                expect(ctx.objectName).toBe('project');
                expect(ctx.user).toEqual({ id: 'user-123' });
            });
        });
    });

    describe('error handling', () => {
        it('should throw PipelineError with plugin name on validation failure', async () => {
            const plugin: QueryProcessorPlugin = {
                metadata: { name: 'bad-validator', type: 'query_processor' },
                async validateQuery() {
                    throw new Error('Invalid query');
                }
            };

            manager.register(plugin);

            try {
                await pipeline.execute('project', {}, { objectName: 'project' }, async () => []);
                fail('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(PipelineError);
                const pipelineError = error as PipelineError;
                expect(pipelineError.pluginName).toBe('bad-validator');
                expect(pipelineError.code).toBe('VALIDATION_FAILED');
            }
        });

        it('should throw PipelineError on beforeQuery failure', async () => {
            const plugin: QueryProcessorPlugin = {
                metadata: { name: 'bad-before', type: 'query_processor' },
                async beforeQuery() {
                    throw new Error('Transform failed');
                }
            };

            manager.register(plugin);

            try {
                await pipeline.execute('project', {}, { objectName: 'project' }, async () => []);
                fail('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(PipelineError);
                const pipelineError = error as PipelineError;
                expect(pipelineError.pluginName).toBe('bad-before');
                expect(pipelineError.code).toBe('EXECUTION_FAILED');
            }
        });

        it('should throw PipelineError on afterQuery failure', async () => {
            const plugin: QueryProcessorPlugin = {
                metadata: { name: 'bad-after', type: 'query_processor' },
                async afterQuery() {
                    throw new Error('Transform failed');
                }
            };

            manager.register(plugin);

            try {
                await pipeline.execute('project', {}, { objectName: 'project' }, async () => []);
                fail('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(PipelineError);
                const pipelineError = error as PipelineError;
                expect(pipelineError.pluginName).toBe('bad-after');
                expect(pipelineError.code).toBe('EXECUTION_FAILED');
            }
        });
    });
});
