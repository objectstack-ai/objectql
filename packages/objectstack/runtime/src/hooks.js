"use strict";
/**
 * @objectql/runtime
 * Hook System - Event lifecycle management
 *
 * Provides a generic hook system for lifecycle events (before/after CRUD operations)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HookManager = void 0;
/**
 * Hook Manager
 * Manages registration and execution of hooks
 */
class HookManager {
    constructor() {
        this.hooks = new Map();
    }
    /**
     * Register a hook
     */
    register(event, objectName, handler, packageName) {
        if (!this.hooks.has(event)) {
            this.hooks.set(event, []);
        }
        const entries = this.hooks.get(event);
        entries.push({ objectName, handler, packageName });
    }
    /**
     * Trigger hooks for an event
     */
    async trigger(event, objectName, ctx) {
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
    removePackage(packageName) {
        for (const [event, entries] of this.hooks.entries()) {
            this.hooks.set(event, entries.filter(e => e.packageName !== packageName));
        }
    }
    /**
     * Clear all hooks
     */
    clear() {
        this.hooks.clear();
    }
}
exports.HookManager = HookManager;
//# sourceMappingURL=hooks.js.map