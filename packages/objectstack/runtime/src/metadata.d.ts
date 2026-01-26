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
export declare class MetadataRegistry {
    store: Map<string, Map<string, MetadataItem>>;
    private packages;
    /**
     * Register a metadata item
     */
    register(type: string, item: MetadataItem): void;
    /**
     * Get a specific metadata item
     */
    get<T = any>(type: string, id: string): T | undefined;
    /**
     * List all items of a specific type
     */
    list<T = any>(type: string): T[];
    /**
     * Check if a metadata item exists
     */
    has(type: string, id: string): boolean;
    /**
     * Unregister a specific item
     */
    unregister(type: string, id: string): void;
    /**
     * Get the full metadata entry (not just content)
     */
    getEntry(type: string, id: string): MetadataItem | undefined;
    /**
     * Unregister all items from a package
     */
    unregisterPackage(packageName: string): void;
    /**
     * Clear all metadata
     */
    clear(): void;
    /**
     * Get all types
     */
    getTypes(): string[];
}
//# sourceMappingURL=metadata.d.ts.map