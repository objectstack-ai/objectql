/**
 * ObjectQL Plugin Analytics — Semantic Compiler
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ObjectQLError } from '@objectql/types';
import type { AnalyticsQuery } from '@objectql/types';
import type { CubeDefinition, LogicalPlan, LogicalPlanMeasure, LogicalPlanDimension, LogicalPlanFilter, LogicalPlanTimeDimension } from './types';
import type { CubeRegistry } from './cube-registry';

/**
 * SemanticCompiler
 *
 * Compiles an AnalyticsQuery + CubeDefinition into a driver-agnostic LogicalPlan.
 * This is the "front-end" of the analytics compilation pipeline.
 *
 *   AnalyticsQuery + Cube ──► SemanticCompiler ──► LogicalPlan
 *                                                      │
 *                                        ┌─────────────┼─────────────┐
 *                                        ▼             ▼             ▼
 *                                  NativeSQLStrategy  ObjectQL   MemoryFallback
 */
export class SemanticCompiler {
    constructor(private readonly registry: CubeRegistry) {}

    /**
     * Compile an AnalyticsQuery into a LogicalPlan.
     * @throws ObjectQLError if cube is not found or measures/dimensions are invalid.
     */
    compile(query: AnalyticsQuery): LogicalPlan {
        const cubeName = this.resolveCubeName(query);
        const cube = this.registry.get(cubeName);
        if (!cube) {
            throw new ObjectQLError({
                code: 'ANALYTICS_CUBE_NOT_FOUND',
                message: `Cube '${cubeName}' is not registered. Available cubes: ${this.registry.list().map(c => c.name).join(', ') || '(none)'}`,
            });
        }

        const measures = this.compileMeasures(query.measures, cube);
        const dimensions = this.compileDimensions(query.dimensions, cube);
        const filters = this.compileFilters(query.filters, cube);
        const timeDimensions = this.compileTimeDimensions(query.timeDimensions, cube);

        return {
            objectName: cube.objectName,
            datasource: cube.datasource || 'default',
            measures,
            dimensions,
            filters,
            timeDimensions,
            order: query.order,
            limit: query.limit,
            offset: query.offset,
            timezone: query.timezone,
        };
    }

    // -------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------

    private resolveCubeName(query: AnalyticsQuery): string {
        if (query.cube) return query.cube;

        // Infer cube from the first measure reference (e.g. 'orders.count' → 'orders')
        if (query.measures.length > 0) {
            const dotIdx = query.measures[0].indexOf('.');
            if (dotIdx > 0) return query.measures[0].substring(0, dotIdx);
        }

        throw new ObjectQLError({
            code: 'ANALYTICS_MISSING_CUBE',
            message: 'AnalyticsQuery must specify a cube name either explicitly or via dotted measure references.',
        });
    }

    private compileMeasures(measureRefs: string[], cube: CubeDefinition): LogicalPlanMeasure[] {
        return measureRefs.map(ref => {
            const measureName = this.stripCubePrefix(ref, cube.name);
            const def = cube.measures.find(m => m.name === measureName);
            if (!def) {
                throw new ObjectQLError({
                    code: 'ANALYTICS_INVALID_MEASURE',
                    message: `Measure '${ref}' not found in cube '${cube.name}'. Available: ${cube.measures.map(m => m.name).join(', ')}`,
                });
            }
            return {
                cube: cube.name,
                measure: def.name,
                aggregation: def.type,
                field: def.field || def.name,
                alias: `${cube.name}__${def.name}`,
            };
        });
    }

    private compileDimensions(dimRefs: string[] | undefined, cube: CubeDefinition): LogicalPlanDimension[] {
        if (!dimRefs || dimRefs.length === 0) return [];
        return dimRefs.map(ref => {
            const dimName = this.stripCubePrefix(ref, cube.name);
            const def = cube.dimensions.find(d => d.name === dimName);
            if (!def) {
                throw new ObjectQLError({
                    code: 'ANALYTICS_INVALID_DIMENSION',
                    message: `Dimension '${ref}' not found in cube '${cube.name}'. Available: ${cube.dimensions.map(d => d.name).join(', ')}`,
                });
            }
            return {
                cube: cube.name,
                dimension: def.name,
                field: def.field || def.name,
                alias: `${cube.name}__${def.name}`,
            };
        });
    }

    private compileFilters(
        filters: AnalyticsQuery['filters'],
        cube: CubeDefinition,
    ): LogicalPlanFilter[] {
        if (!filters || filters.length === 0) return [];
        return filters.map(f => {
            const memberName = this.stripCubePrefix(f.member, cube.name);
            // Resolve to field name from dimension or measure
            const dim = cube.dimensions.find(d => d.name === memberName);
            const meas = cube.measures.find(m => m.name === memberName);
            const field = dim?.field || dim?.name || meas?.field || meas?.name || memberName;
            return {
                field,
                operator: f.operator,
                values: f.values,
            };
        });
    }

    private compileTimeDimensions(
        timeDims: AnalyticsQuery['timeDimensions'],
        cube: CubeDefinition,
    ): LogicalPlanTimeDimension[] {
        if (!timeDims || timeDims.length === 0) return [];
        return timeDims.map(td => {
            const dimName = this.stripCubePrefix(td.dimension, cube.name);
            const def = cube.dimensions.find(d => d.name === dimName);
            const field = def?.field || def?.name || dimName;
            return {
                field,
                granularity: td.granularity,
                dateRange: td.dateRange,
                alias: `${cube.name}__${dimName}`,
            };
        });
    }

    /** Strip 'cubeName.' prefix from a reference if present. */
    private stripCubePrefix(ref: string, cubeName: string): string {
        const prefix = `${cubeName}.`;
        return ref.startsWith(prefix) ? ref.substring(prefix.length) : ref;
    }
}
