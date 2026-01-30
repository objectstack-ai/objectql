/**
 * @objectstack/objectql
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Object Configuration
 */
export interface ObjectConfig {
    name: string;
    label?: string;
    fields?: Record<string, any>;
    [key: string]: any;
}

/**
 * Schema Registry - manages object schemas
 * Uses a singleton pattern with static methods for global access
 */
export class SchemaRegistry {
    private static instance: SchemaRegistry;
    private schemas = new Map<string, Map<string, any>>();
    
    private constructor() {}
    
    private static getInstance(): SchemaRegistry {
        if (!SchemaRegistry.instance) {
            SchemaRegistry.instance = new SchemaRegistry();
        }
        return SchemaRegistry.instance;
    }
    
    /**
     * Register an item in the registry
     * @param type - The type of item (e.g., 'object', 'field', 'action')
     * @param item - The item to register
     * @param idField - The field to use as the ID (default: 'name')
     */
    static registerItem(type: string, item: any, idField: string = 'name'): void {
        const registry = SchemaRegistry.getInstance();
        if (!registry.schemas.has(type)) {
            registry.schemas.set(type, new Map());
        }
        const typeMap = registry.schemas.get(type)!;
        const id = item[idField];
        typeMap.set(id, item);
    }
    
    /**
     * Get an item from the registry
     */
    static getItem(type: string, id: string): any | undefined {
        const registry = SchemaRegistry.getInstance();
        const typeMap = registry.schemas.get(type);
        return typeMap?.get(id);
    }
    
    /**
     * List all items of a type
     */
    static listItems(type: string): any[] {
        const registry = SchemaRegistry.getInstance();
        const typeMap = registry.schemas.get(type);
        if (!typeMap) return [];
        return Array.from(typeMap.values());
    }
    
    /**
     * Check if an item exists
     */
    static hasItem(type: string, id: string): boolean {
        const registry = SchemaRegistry.getInstance();
        const typeMap = registry.schemas.get(type);
        return typeMap?.has(id) || false;
    }
    
    /**
     * Delete an item
     */
    static deleteItem(type: string, id: string): boolean {
        const registry = SchemaRegistry.getInstance();
        const typeMap = registry.schemas.get(type);
        if (!typeMap) return false;
        return typeMap.delete(id);
    }
    
    /**
     * Clear all items
     */
    static clear(): void {
        const registry = SchemaRegistry.getInstance();
        registry.schemas.clear();
    }
    
    // Instance methods for backward compatibility
    register(name: string, schema: ObjectConfig): void {
        SchemaRegistry.registerItem('object', schema, 'name');
    }
    
    get(name: string): ObjectConfig | undefined {
        return SchemaRegistry.getItem('object', name);
    }
    
    list(): ObjectConfig[] {
        return SchemaRegistry.listItems('object');
    }
    
    has(name: string): boolean {
        return SchemaRegistry.hasItem('object', name);
    }
    
    delete(name: string): boolean {
        return SchemaRegistry.deleteItem('object', name);
    }
}

/**
 * ObjectQL Engine - runtime query engine
 */
export class ObjectQL {
    constructor() {
        // Use the singleton SchemaRegistry
    }
    
    getSchemaRegistry(): typeof SchemaRegistry {
        return SchemaRegistry;
    }
    
    registerSchema(name: string, schema: ObjectConfig): void {
        SchemaRegistry.registerItem('object', schema, 'name');
    }
    
    getSchema(name: string): ObjectConfig | undefined {
        return SchemaRegistry.getItem('object', name);
    }
}

/**
 * Protocol Implementation Interface
 */
export class ObjectStackProtocolImplementation {
    // Placeholder for protocol implementation
}
