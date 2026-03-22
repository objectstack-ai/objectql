/**
 * ObjectQL Plugin Analytics — Cube Registry
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { CubeMeta, MetadataRegistry, ObjectConfig } from '@objectql/types';
import type { CubeDefinition, CubeMeasure, CubeDimension } from './types';

/**
 * CubeRegistry
 *
 * Central registry for analytics cube definitions.
 * Supports both manifest-based registration and automatic
 * discovery from MetadataRegistry object definitions.
 */
export class CubeRegistry {
    private readonly cubes = new Map<string, CubeDefinition>();

    /** Register a cube from a manifest definition. */
    register(cube: CubeDefinition): void {
        this.cubes.set(cube.name, cube);
    }

    /** Register multiple cubes from manifest definitions. */
    registerAll(cubes: readonly CubeDefinition[]): void {
        for (const cube of cubes) {
            this.register(cube);
        }
    }

    /** Look up a cube by name. Returns undefined if not found. */
    get(name: string): CubeDefinition | undefined {
        return this.cubes.get(name);
    }

    /** List all registered cubes. */
    list(): CubeDefinition[] {
        return Array.from(this.cubes.values());
    }

    /** Convert a CubeDefinition to the spec-compliant CubeMeta format. */
    toMeta(cube: CubeDefinition): CubeMeta {
        return {
            name: cube.name,
            title: cube.title,
            measures: cube.measures.map(m => ({
                name: `${cube.name}.${m.name}`,
                type: m.type,
                title: m.title,
            })),
            dimensions: cube.dimensions.map(d => ({
                name: `${cube.name}.${d.name}`,
                type: d.type,
                title: d.title,
            })),
        };
    }

    /** Get CubeMeta for all cubes, optionally filtered by name. */
    getMeta(cubeName?: string): CubeMeta[] {
        if (cubeName) {
            const cube = this.cubes.get(cubeName);
            return cube ? [this.toMeta(cube)] : [];
        }
        return this.list().map(c => this.toMeta(c));
    }

    /**
     * Auto-discover cubes from MetadataRegistry.
     *
     * For each registered object, infer a cube with:
     *  - A `count` measure (always available)
     *  - `sum`/`avg`/`min`/`max` measures for every numeric field
     *  - Dimensions for every non-numeric field (string, boolean, select)
     *  - Time dimensions for date/datetime fields
     */
    discoverFromMetadata(metadata: MetadataRegistry): void {
        const objects = this.listMetadataObjects(metadata);
        for (const obj of objects) {
            if (this.cubes.has(obj.name)) continue; // manifest takes precedence

            const measures: CubeMeasure[] = [
                { name: 'count', type: 'count', field: '*' },
            ];
            const dimensions: CubeDimension[] = [];

            const fields = obj.fields || {};
            for (const [fieldName, field] of Object.entries(fields)) {
                const fType = typeof field === 'object' && field !== null
                    ? (field as unknown as Record<string, unknown>).type as string | undefined
                    : undefined;

                if (this.isNumericType(fType)) {
                    measures.push(
                        { name: `${fieldName}_sum`, type: 'sum', field: fieldName, title: `Sum of ${fieldName}` },
                        { name: `${fieldName}_avg`, type: 'avg', field: fieldName, title: `Avg of ${fieldName}` },
                        { name: `${fieldName}_min`, type: 'min', field: fieldName, title: `Min of ${fieldName}` },
                        { name: `${fieldName}_max`, type: 'max', field: fieldName, title: `Max of ${fieldName}` },
                    );
                } else if (this.isTimeType(fType)) {
                    dimensions.push({ name: fieldName, type: 'time', field: fieldName });
                } else {
                    dimensions.push({
                        name: fieldName,
                        type: this.mapFieldType(fType),
                        field: fieldName,
                    });
                }
            }

            this.cubes.set(obj.name, {
                name: obj.name,
                title: obj.name,
                objectName: obj.name,
                measures,
                dimensions,
            });
        }
    }

    // -------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------

    private listMetadataObjects(metadata: MetadataRegistry): ObjectConfig[] {
        if (typeof (metadata as any).list === 'function') {
            return (metadata as any).list('object') as ObjectConfig[];
        }
        if (typeof (metadata as any).getAll === 'function') {
            return (metadata as any).getAll('object') as ObjectConfig[];
        }
        return [];
    }

    private isNumericType(type?: string): boolean {
        if (!type) return false;
        return ['number', 'currency', 'percent', 'integer', 'float', 'decimal'].includes(type);
    }

    private isTimeType(type?: string): boolean {
        if (!type) return false;
        return ['date', 'datetime', 'time', 'timestamp'].includes(type);
    }

    private mapFieldType(type?: string): 'string' | 'number' | 'boolean' {
        if (!type) return 'string';
        if (type === 'boolean' || type === 'checkbox') return 'boolean';
        return 'string';
    }
}
