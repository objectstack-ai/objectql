"use strict";
/**
 * @objectql/runtime
 * Action System - Custom action management
 *
 * Provides a system for registering and executing custom actions on objects
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionManager = exports.RuntimeError = void 0;
/**
 * Runtime Error
 * Simple error class for runtime package
 */
class RuntimeError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'RuntimeError';
    }
}
exports.RuntimeError = RuntimeError;
/**
 * Action Manager
 * Manages registration and execution of custom actions
 */
class ActionManager {
    constructor() {
        this.actions = new Map();
    }
    /**
     * Register an action
     * @param objectName - Object name
     * @param actionName - Action name
     * @param handler - Action handler function
     * @param packageName - Package name for tracking
     */
    register(objectName, actionName, handler, packageName) {
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
    async execute(objectName, actionName, ctx) {
        const key = `${objectName}:${actionName}`;
        const entry = this.actions.get(key);
        if (!entry) {
            throw new RuntimeError('ACTION_NOT_FOUND', `Action '${actionName}' not found for object '${objectName}'`);
        }
        return await entry.handler(ctx);
    }
    /**
     * Check if an action exists
     */
    has(objectName, actionName) {
        const key = `${objectName}:${actionName}`;
        return this.actions.has(key);
    }
    /**
     * Remove actions from a package
     */
    removePackage(packageName) {
        for (const [key, entry] of this.actions.entries()) {
            if (entry.packageName === packageName) {
                this.actions.delete(key);
            }
        }
    }
    /**
     * Clear all actions
     */
    clear() {
        this.actions.clear();
    }
}
exports.ActionManager = ActionManager;
//# sourceMappingURL=actions.js.map