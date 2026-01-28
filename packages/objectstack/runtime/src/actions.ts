/**
 * @objectstack/runtime
 * Action System - Custom action management
 * 
 * Provides a system for registering and executing custom actions on objects
 */

/**
 * Runtime Error
 * Simple error class for runtime package
 */
export class RuntimeError extends Error {
    constructor(public code: string, message: string) {
        super(message);
        this.name = 'RuntimeError';
    }
}

/**
 * Action Context
 * Context passed to action handlers
 * 
 * Extended to support ObjectQL's rich context requirements including:
 * - Database API access for performing operations
 * - User session information
 * - Validated input parameters
 * - Record ID for record-level actions
 */
export interface ActionContext {
    /** Object name */
    objectName: string;
    
    /** Action name */
    actionName: string;
    
    /** Input data (legacy field, prefer 'input' for ObjectQL) */
    data?: any;
    
    /** Record IDs (for record-level actions, legacy array form) */
    ids?: string[];
    
    /** User context */
    user?: {
        id: string | number;
        [key: string]: any;
    };
    
    /** Additional metadata */
    metadata?: any;
    
    /** 
     * The ID of the record being acted upon (ObjectQL extension)
     * Only available if type is 'record'
     */
    id?: string | number;
    
    /**
     * The validated input arguments (ObjectQL extension)
     * Prefer this over 'data' for typed action inputs
     */
    input?: any;
    
    /**
     * Database Access API (ObjectQL extension)
     * Same interface as used in hooks
     */
    api?: {
        find(objectName: string, query?: any): Promise<any[]>;
        findOne(objectName: string, id: string | number): Promise<any>;
        count(objectName: string, query?: any): Promise<number>;
        create(objectName: string, data: any): Promise<any>;
        update(objectName: string, id: string | number, data: any): Promise<any>;
        delete(objectName: string, id: string | number): Promise<any>;
    };
    
    /** Allow additional properties for extensibility */
    [key: string]: any;
}

/**
 * Action Handler
 * Function signature for action handlers
 */
export type ActionHandler = (ctx: ActionContext) => any | Promise<any>;

/**
 * Action Entry
 * Internal representation of a registered action
 */
export interface ActionEntry {
    handler: ActionHandler;
    packageName?: string;
}

/**
 * Action Manager
 * Manages registration and execution of custom actions
 */
export class ActionManager {
    private actions: Map<string, ActionEntry> = new Map();

    /**
     * Register an action
     * @param objectName - Object name
     * @param actionName - Action name
     * @param handler - Action handler function
     * @param packageName - Package name for tracking
     */
    register(
        objectName: string,
        actionName: string,
        handler: ActionHandler,
        packageName?: string
    ): void {
        const key = `${objectName}:${actionName}`;
        this.actions.set(key, { handler, packageName });
    }

    /**
     * Execute an action
     * @param objectName - Object name
     * @param actionName - Action name
     * @param ctx - Action context
     * @returns Action result
     */
    async execute(
        objectName: string,
        actionName: string,
        ctx: ActionContext
    ): Promise<any> {
        const key = `${objectName}:${actionName}`;
        const entry = this.actions.get(key);
        
        if (!entry) {
            throw new RuntimeError(
                'ACTION_NOT_FOUND',
                `Action '${actionName}' not found for object '${objectName}'`
            );
        }
        
        return await entry.handler(ctx);
    }

    /**
     * Check if an action exists
     */
    has(objectName: string, actionName: string): boolean {
        const key = `${objectName}:${actionName}`;
        return this.actions.has(key);
    }

    /**
     * List all registered action keys
     * @returns Array of action keys in format "objectName:actionName"
     */
    list(): string[] {
        return Array.from(this.actions.keys());
    }

    /**
     * Remove actions from a package
     */
    removePackage(packageName: string): void {
        for (const [key, entry] of this.actions.entries()) {
            if (entry.packageName === packageName) {
                this.actions.delete(key);
            }
        }
    }

    /**
     * Clear all actions
     */
    clear(): void {
        this.actions.clear();
    }
}
