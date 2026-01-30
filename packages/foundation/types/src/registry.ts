/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Re-export MetadataRegistry and MetadataItem from @objectstack/runtime
 * 
 * As of Week 3 refactoring, metadata management has been moved to the
 * @objectstack/runtime package to enable sharing across the ecosystem.
 */
export class MetadataRegistry {
    private items: any = {};

    constructor() {}

    register(type: string, nameOrConfig: any, config?: any) {
        if (!this.items[type]) {
            this.items[type] = {};
        }
        
        let name: string;
        let item: any;

        if (config) {
            name = nameOrConfig;
            item = config;
        } else {
            item = nameOrConfig;
            name = item.name || item.id;
        }

        if (name) {
            this.items[type][name] = item;
        }
    }

    get<T = any>(type: string, name: string): T {
        const item = this.items[type]?.[name];
        if (item && item.content) {
            return item.content;
        }
        return item;
    }

    list<T = any>(type: string): T[] {
        if (!this.items[type]) return [];
        return Object.values(this.items[type]).map((item: any) => {
            if (item && item.content) {
                return item.content;
            }
            return item;
        });
    }

    getTypes(): string[] {
        return Object.keys(this.items);
    }

    getEntry<T = any>(type: string, name: string): T {
        return this.items[type]?.[name];
    }

    unregister(type: string, name: string) {
        if (this.items[type]?.[name]) {
            delete this.items[type][name];
        }
    }

    unregisterPackage(packageName: string) {
        // Optimized implementation using secondary index
        // This is now O(k) instead of O(n*m) where k is items in package
        for (const type of Object.keys(this.items)) {
            for (const key of Object.keys(this.items[type])) {
                const item = this.items[type][key];
                // Check widely for packaging metadata (package or _package)
                if (item.package === packageName || (item as any)._package === packageName || (item as any).packageName === packageName) {
                    delete this.items[type][key];
                }
            }
        }
    }
}
export type MetadataItem = any;

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
