/**
 * @objectstack/runtime
 * Hook System - Event lifecycle management
 * 
 * Provides a generic hook system for lifecycle events (before/after CRUD operations)
 */

export type HookName = 
    | 'beforeFind'
    | 'afterFind'
    | 'beforeCount'
    | 'afterCount'
    | 'beforeCreate'
    | 'afterCreate'
    | 'beforeUpdate'
    | 'afterUpdate'
    | 'beforeDelete'
    | 'afterDelete'
    | 'beforeValidate'
    | 'afterValidate';

/**
 * HookAPI - Minimal API surface exposed to hooks for performing side-effects or checks
 * Allows hooks to perform database operations without circular dependencies
 */
export interface HookAPI {
    find(objectName: string, query?: any): Promise<any[]>;
    findOne(objectName: string, id: string | number): Promise<any>;
    count(objectName: string, query?: any): Promise<number>;
    create(objectName: string, data: any): Promise<any>;
    update(objectName: string, id: string | number, data: any): Promise<any>;
    delete(objectName: string, id: string | number): Promise<any>;
}

/**
 * Hook Context
 * Context passed to hook handlers
 * 
 * Extended to support ObjectQL's rich context requirements including:
 * - Database API access for cross-object operations
 * - User session information
 * - Shared state between before/after hooks
 * - Operation type tracking
 * - Query/result data for retrieval operations
 * - Record data for mutation operations
 */
export interface HookContext {
    /** Object name */
    objectName: string;
    
    /** Current data (for create/update operations) */
    data?: any;
    
    /** Original data (for updates) */
    originalData?: any;
    
    /** User context */
    user?: {
        id: string | number;
        [key: string]: any;
    };
    
    /** Additional metadata */
    metadata?: any;
    
    /** The triggering operation (ObjectQL extension) */
    operation?: 'find' | 'count' | 'create' | 'update' | 'delete';
    
    /** Access to the database/engine to perform extra queries (ObjectQL extension) */
    api?: HookAPI;
    
    /** 
     * Shared state for passing data between matching 'before' and 'after' hooks (ObjectQL extension)
     * e.g. Calculate a diff in 'beforeUpdate' and read it in 'afterUpdate'
     */
    state?: Record<string, any>;
    
    /** The query criteria being executed (for retrieval operations, ObjectQL extension) */
    query?: any;
    
    /** The result of the query/operation (available in 'after' hooks, ObjectQL extension) */
    result?: any;
    
    /** The record ID (for update/delete operations, ObjectQL extension) */
    id?: string | number;
    
    /** The existing record fetched from DB before operation (ObjectQL extension) */
    previousData?: any;
    
    /** Allow additional properties for extensibility */
    [key: string]: any;
}

/**
 * Hook Handler
 * Function signature for hook handlers
 */
export type HookHandler = (ctx: HookContext) => void | Promise<void>;

/**
 * Hook Entry
 * Internal representation of a registered hook
 */
export interface HookEntry {
    objectName: string;
    handler: HookHandler;
    packageName?: string;
}

/**
 * Hook Manager
 * Manages registration and execution of hooks
 */
export class HookManager {
    private hooks: Map<HookName, HookEntry[]> = new Map();

    /**
     * Register a hook
     */
    register(
        event: HookName,
        objectName: string,
        handler: HookHandler,
        packageName?: string
    ): void {
        if (!this.hooks.has(event)) {
            this.hooks.set(event, []);
        }
        
        const entries = this.hooks.get(event)!;
        entries.push({ objectName, handler, packageName });
    }

    /**
     * Trigger hooks for an event
     */
    async trigger(
        event: HookName,
        objectName: string,
        ctx: HookContext
    ): Promise<void> {
        const entries = this.hooks.get(event) || [];
        
        for (const entry of entries) {
            // Match on wildcard '*' or specific object name
            if (entry.objectName === '*' || entry.objectName === objectName) {
                await entry.handler(ctx);
            }
        }
    }

    /**
     * Remove hooks from a package
     */
    removePackage(packageName: string): void {
        for (const [event, entries] of this.hooks.entries()) {
            this.hooks.set(
                event,
                entries.filter(e => e.packageName !== packageName)
            );
        }
    }

    /**
     * Clear all hooks
     */
    clear(): void {
        this.hooks.clear();
    }
}
