/**
 * @objectstack/runtime
 * Hook System - Event lifecycle management
 * 
 * Provides a generic hook system for lifecycle events (before/after CRUD operations)
 */

export type HookName = 
    | 'beforeFind'
    | 'afterFind'
    | 'beforeCreate'
    | 'afterCreate'
    | 'beforeUpdate'
    | 'afterUpdate'
    | 'beforeDelete'
    | 'afterDelete'
    | 'beforeValidate'
    | 'afterValidate';

/**
 * Hook Context
 * Context passed to hook handlers
 */
export interface HookContext {
    /** Object name */
    objectName: string;
    /** Current data */
    data?: any;
    /** Original data (for updates) */
    originalData?: any;
    /** User context */
    user?: any;
    /** Additional metadata */
    metadata?: any;
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
