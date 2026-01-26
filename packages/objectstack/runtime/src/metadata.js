"use strict";
/**
 * @objectql/runtime
 * Metadata Registry - Core metadata management for ObjectStack
 *
 * This module provides the foundational metadata registry that manages
 * object configurations, actions, hooks, and other metadata.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetadataRegistry = void 0;
/**
 * Metadata Registry
 * Central registry for all metadata in the ObjectStack ecosystem
 */
class MetadataRegistry {
    constructor() {
        // Expose store for compatibility
        this.store = new Map();
        this.packages = new Map();
    }
    /**
     * Register a metadata item
     */
    register(type, item) {
        if (!this.store.has(type)) {
            this.store.set(type, new Map());
        }
        const typeMap = this.store.get(type);
        typeMap.set(item.id, item);
        // Track package association (support both packageName and package fields)
        const pkgName = item.packageName || item.package;
        if (pkgName) {
            if (!this.packages.has(pkgName)) {
                this.packages.set(pkgName, []);
            }
            const key = `${type}:${item.id}`;
            const packageItems = this.packages.get(pkgName);
            if (!packageItems.includes(key)) {
                packageItems.push(key);
            }
        }
    }
    /**
     * Get a specific metadata item
     */
    get(type, id) {
        const typeMap = this.store.get(type);
        if (!typeMap)
            return undefined;
        const item = typeMap.get(id);
        return item === null || item === void 0 ? void 0 : item.content;
    }
    /**
     * List all items of a specific type
     */
    list(type) {
        const typeMap = this.store.get(type);
        if (!typeMap)
            return [];
        return Array.from(typeMap.values()).map(item => item.content);
    }
    /**
     * Check if a metadata item exists
     */
    has(type, id) {
        var _a;
        const typeMap = this.store.get(type);
        return (_a = typeMap === null || typeMap === void 0 ? void 0 : typeMap.has(id)) !== null && _a !== void 0 ? _a : false;
    }
    /**
     * Unregister a specific item
     */
    unregister(type, id) {
        const typeMap = this.store.get(type);
        if (typeMap) {
            typeMap.delete(id);
        }
    }
    /**
     * Get the full metadata entry (not just content)
     */
    getEntry(type, id) {
        const typeMap = this.store.get(type);
        return typeMap ? typeMap.get(id) : undefined;
    }
    /**
     * Unregister all items from a package
     */
    unregisterPackage(packageName) {
        const items = this.packages.get(packageName);
        if (!items) {
            // Also try to find by scanning all entries (for compatibility)
            for (const [, typeMap] of this.store.entries()) {
                const entriesToDelete = [];
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
    clear() {
        this.store.clear();
        this.packages.clear();
    }
    /**
     * Get all types
     */
    getTypes() {
        return Array.from(this.store.keys());
    }
}
exports.MetadataRegistry = MetadataRegistry;
//# sourceMappingURL=metadata.js.map