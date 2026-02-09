/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Metadata reference for secondary index
 */
interface MetadataRef {
    type: string;
    name: string;
}

/**
 * Optimized Metadata Registry with O(k) package uninstall complexity
 * 
 * Uses secondary indexes to achieve O(k) complexity for unregisterPackage
 * operation (where k is the number of items in the package) instead of
 * O(n*m) (where n is types and m is items per type).
 */
export class MetadataRegistry {
    private items: Record<string, Record<string, Record<string, unknown>>> = {};
    
    // Secondary index: package name -> list of metadata references
    private packageIndex = new Map<string, Set<MetadataRef>>();

    constructor() {}

    register(type: string, nameOrConfig: string | Record<string, unknown>, config?: Record<string, unknown>) {
        if (!this.items[type]) {
            this.items[type] = {};
        }
        
        let name: string;
        let item: Record<string, unknown>;

        if (config) {
            name = nameOrConfig as string;
            item = config;
        } else {
            item = nameOrConfig as Record<string, unknown>;
            name = (item.name || item.id) as string;
        }

        if (name) {
            this.items[type][name] = item;
            
            // Update package index
            const packageName = (item.package || item._package || item.packageName) as string | undefined;
            if (packageName) {
                if (!this.packageIndex.has(packageName)) {
                    this.packageIndex.set(packageName, new Set());
                }
                this.packageIndex.get(packageName)!.add({ type, name });
            }
        }
    }

    get<T = unknown>(type: string, name: string): T {
        const item = this.items[type]?.[name];
        if (item && item.content) {
            return item.content as T;
        }
        return item as T;
    }

    list<T = unknown>(type: string): T[] {
        if (!this.items[type]) return [];
        return Object.values(this.items[type]).map((item: Record<string, unknown>) => {
            if (item && item.content) {
                return item.content;
            }
            return item;
        }) as T[];
    }

    getTypes(): string[] {
        return Object.keys(this.items);
    }

    getEntry<T = unknown>(type: string, name: string): T {
        return this.items[type]?.[name] as T;
    }

    unregister(type: string, name: string) {
        const item = this.items[type]?.[name];
        if (item) {
            // Update package index
            const packageName = (item.package || item._package || item.packageName) as string | undefined;
            if (packageName) {
                const refs = this.packageIndex.get(packageName);
                if (refs) {
                    // Remove this specific reference
                    for (const ref of refs) {
                        if (ref.type === type && ref.name === name) {
                            refs.delete(ref);
                            break;
                        }
                    }
                    // Clean up empty package entries
                    if (refs.size === 0) {
                        this.packageIndex.delete(packageName);
                    }
                }
            }
            delete this.items[type][name];
        }
    }

    /**
     * Optimized package unregistration with O(k) complexity
     * where k is the number of items in the package.
     * 
     * Previous complexity: O(n*m) - iterate all types and all items
     * New complexity: O(k) - direct lookup via secondary index
     */
    unregisterPackage(packageName: string) {
        // Direct lookup via secondary index ✅
        const refs = this.packageIndex.get(packageName);
        if (refs) {
            // Delete each item referenced by this package
            for (const ref of refs) {
                if (this.items[ref.type]?.[ref.name]) {
                    delete this.items[ref.type][ref.name];
                }
            }
            // Remove package from index
            this.packageIndex.delete(packageName);
        }
    }
}
export type MetadataItem = Record<string, unknown>;

/**
 * Legacy Metadata interface - kept for backward compatibility
 * @deprecated Use MetadataItem from @objectstack/runtime instead
 */
export interface Metadata {
    type: string;
    id: string;
    path?: string;
    package?: string;
    content: unknown;
}
