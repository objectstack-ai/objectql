/**
 * @objectstack/runtime
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
    content: any;
    /** Package name this metadata belongs to */
    packageName?: string;
}

/**
 * Metadata Registry
 * Central registry for all metadata in the ObjectStack ecosystem
 */
export class MetadataRegistry {
    private items: Map<string, Map<string, MetadataItem>> = new Map();
    private packages: Map<string, string[]> = new Map();

    /**
     * Register a metadata item
     */
    register(type: string, item: MetadataItem): void {
        if (!this.items.has(type)) {
            this.items.set(type, new Map());
        }
        
        const typeMap = this.items.get(type)!;
        typeMap.set(item.id, item);

        // Track package association
        if (item.packageName) {
            if (!this.packages.has(item.packageName)) {
                this.packages.set(item.packageName, []);
            }
            const key = `${type}:${item.id}`;
            const packageItems = this.packages.get(item.packageName)!;
            if (!packageItems.includes(key)) {
                packageItems.push(key);
            }
        }
    }

    /**
     * Get a specific metadata item
     */
    get<T = any>(type: string, id: string): T | undefined {
        const typeMap = this.items.get(type);
        if (!typeMap) return undefined;
        
        const item = typeMap.get(id);
        return item?.content as T;
    }

    /**
     * List all items of a specific type
     */
    list<T = any>(type: string): T[] {
        const typeMap = this.items.get(type);
        if (!typeMap) return [];
        
        return Array.from(typeMap.values()).map(item => item.content as T);
    }

    /**
     * Check if a metadata item exists
     */
    has(type: string, id: string): boolean {
        const typeMap = this.items.get(type);
        return typeMap?.has(id) ?? false;
    }

    /**
     * Unregister a specific item
     */
    unregister(type: string, id: string): void {
        const typeMap = this.items.get(type);
        if (typeMap) {
            typeMap.delete(id);
        }
    }

    /**
     * Unregister all items from a package
     */
    unregisterPackage(packageName: string): void {
        const items = this.packages.get(packageName);
        if (!items) return;

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
        this.items.clear();
        this.packages.clear();
    }

    /**
     * Get all types
     */
    getTypes(): string[] {
        return Array.from(this.items.keys());
    }
}
