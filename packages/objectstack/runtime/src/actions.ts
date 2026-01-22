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
 */
export interface ActionContext {
    /** Object name */
    objectName: string;
    /** Action name */
    actionName: string;
    /** Input data */
    data?: any;
    /** Record IDs (for record-level actions) */
    ids?: string[];
    /** User context */
    user?: any;
    /** Additional metadata */
    metadata?: any;
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
