/**
 * @objectql/runtime
 * Metadata Registry - Core metadata management for ObjectStack
 * 
 * This module provides the foundational metadata registry that manages
 * object configurations, actions, hooks, and other metadata.
 */

/**
 * Metadata Item
 * Represents a single metadata entry in the registry
 */
export interface MetadataItem {
    /** Type of metadata (object, action, hook, etc.) */
    type: string;
    /** Unique identifier */
    id: string;
    /** The actual metadata content */
    content: unknown;
    /** Package name this metadata belongs to */
    packageName?: string;
    /** Optional path to the metadata source file */
    path?: string;
    /** Alternative package name field for compatibility */
    package?: string;
}

/**
 * Metadata Registry
 * Central registry for all metadata in the ObjectStack ecosystem
 */
export class MetadataRegistry {
    // Expose store for compatibility
    public store: Map<string, Map<string, MetadataItem>> = new Map();
    private packages: Map<string, string[]> = new Map();

    /**
     * Register a metadata item
     */
    register(type: string, item: MetadataItem): void {
        if (!this.store.has(type)) {
            this.store.set(type, new Map());
        }
        
        const typeMap = this.store.get(type)!;
        typeMap.set(item.id, item);

        // Track package association (support both packageName and package fields)
        const pkgName = item.packageName || item.package;
        if (pkgName) {
            if (!this.packages.has(pkgName)) {
                this.packages.set(pkgName, []);
            }
            const key = `${type}:${item.id}`;
            const packageItems = this.packages.get(pkgName)!;
            if (!packageItems.includes(key)) {
                packageItems.push(key);
            }
        }
    }

    /**
     * Get a specific metadata item
     */
    get<T = any>(type: string, id: string): T | undefined {
        const typeMap = this.store.get(type);
        if (!typeMap) return undefined;
        
        const item = typeMap.get(id);
        return item?.content as T;
    }

    /**
     * List all items of a specific type
     */
    list<T = any>(type: string): T[] {
        const typeMap = this.store.get(type);
        if (!typeMap) return [];
        
        return Array.from(typeMap.values()).map(item => item.content as T);
    }

    /**
     * Check if a metadata item exists
     */
    has(type: string, id: string): boolean {
        const typeMap = this.store.get(type);
        return typeMap?.has(id) ?? false;
    }

    /**
     * Unregister a specific item
     */
    unregister(type: string, id: string): void {
        const typeMap = this.store.get(type);
        if (typeMap) {
            typeMap.delete(id);
        }
    }

    /**
     * Get the full metadata entry (not just content)
     */
    getEntry(type: string, id: string): MetadataItem | undefined {
        const typeMap = this.store.get(type);
        return typeMap ? typeMap.get(id) : undefined;
    }

    /**
     * Unregister all items from a package
     */
    unregisterPackage(packageName: string): void {
        const items = this.packages.get(packageName);
        if (!items) {
            // Also try to find by scanning all entries (for compatibility)
            for (const [, typeMap] of this.store.entries()) {
                const entriesToDelete: string[] = [];
                for (const [id, item] of typeMap.entries()) {
                    if (item.package === packageName || item.packageName === packageName) {
                        entriesToDelete.push(id);
                    }
                }
                for (const id of entriesToDelete) {
                    typeMap.delete(id);
                }
            }
            return;
        }

        for (const key of items) {
            const [type, id] = key.split(':');
            this.unregister(type, id);
        }
        
        this.packages.delete(packageName);
    }

    /**
     * Clear all metadata
     */
    clear(): void {
        this.store.clear();
        this.packages.clear();
    }

    /**
     * Get all types
     */
    getTypes(): string[] {
        return Array.from(this.store.keys());
    }
}
