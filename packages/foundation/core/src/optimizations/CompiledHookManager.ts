/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Hook definition
 */
export interface Hook {
    pattern: string;
    handler: (context: any) => Promise<void> | void;
    packageName?: string;
    priority?: number;
}

/**
 * Compiled Hook Manager
 * 
 * Improvement: Pre-compiles hook pipelines by event pattern at registration time.
 * No runtime pattern matching required.
 * 
 * Expected: 5x faster hook execution, parallel async support
 */
export class CompiledHookManager {
    // Direct event -> hooks mapping (no pattern matching at runtime)
    private pipelines = new Map<string, Hook[]>();
    
    // Keep track of all registered hooks for management
    private allHooks = new Map<string, Hook>();

    /**
     * Expand a pattern like "before*" to all matching events
     */
    private expandPattern(pattern: string): string[] {
        // Common event patterns
        const eventTypes = [
            'beforeCreate', 'afterCreate',
            'beforeUpdate', 'afterUpdate',
            'beforeDelete', 'afterDelete',
            'beforeFind', 'afterFind',
            'beforeCount', 'afterCount'
        ];

        // Handle wildcards
        if (pattern === '*') {
            return eventTypes;
        }
        
        if (pattern.includes('*')) {
            // Use global replace to handle all occurrences of *
            const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
            return eventTypes.filter(event => regex.test(event));
        }

        // Exact match
        return [pattern];
    }

    /**
     * Register a hook - pre-groups by event pattern
     */
    registerHook(event: string, objectName: string, handler: any, packageName?: string): void {
        const hook: Hook = {
            pattern: `${event}:${objectName}`,
            handler,
            packageName,
            priority: 0
        };

        // Store in all hooks registry
        const hookId = `${event}:${objectName}:${Date.now()}`;
        this.allHooks.set(hookId, hook);

        // Expand event patterns
        const events = this.expandPattern(event);
        
        // Handle wildcard object names
        if (objectName === '*') {
            for (const concreteEvent of events) {
                // Register for all potential object names
                // Since we don't know all object names upfront, we keep a special '*' pipeline
                const wildcardKey = `${concreteEvent}:*`;
                if (!this.pipelines.has(wildcardKey)) {
                    this.pipelines.set(wildcardKey, []);
                }
                this.pipelines.get(wildcardKey)!.push(hook);
            }
        } else {
            // Pre-group hooks by concrete event names (only for non-wildcard objects)
            for (const concreteEvent of events) {
                const key = `${concreteEvent}:${objectName}`;
                if (!this.pipelines.has(key)) {
                    this.pipelines.set(key, []);
                }
                this.pipelines.get(key)!.push(hook);
            }
        }
    }

    /**
     * Run hooks for an event - direct lookup, no pattern matching
     */
    async runHooks(event: string, objectName: string, context: any): Promise<void> {
        const key = `${event}:${objectName}`;
        const wildcardKey = `${event}:*`;
        
        // Collect all applicable hooks
        const hooks: Hook[] = [];
        
        // Add object-specific hooks
        const objectHooks = this.pipelines.get(key);
        if (objectHooks) {
            hooks.push(...objectHooks);
        }
        
        // Add wildcard hooks
        const wildcardHooks = this.pipelines.get(wildcardKey);
        if (wildcardHooks) {
            hooks.push(...wildcardHooks);
        }

        if (hooks.length === 0) {
            return;
        }

        // Sort by priority (higher priority first)
        hooks.sort((a, b) => (b.priority || 0) - (a.priority || 0));

        // Execute hooks in parallel for better performance
        // Note: If order matters, change to sequential execution
        await Promise.all(hooks.map(hook => {
            try {
                return Promise.resolve(hook.handler(context));
            } catch (error) {
                console.error(`Hook execution failed for ${event}:${objectName}`, error);
                return Promise.resolve();
            }
        }));
    }

    /**
     * Remove all hooks from a package
     */
    removePackage(packageName: string): void {
        // Remove from all hooks registry
        const hooksToRemove: string[] = [];
        for (const [hookId, hook] of this.allHooks.entries()) {
            if (hook.packageName === packageName) {
                hooksToRemove.push(hookId);
            }
        }
        hooksToRemove.forEach(id => this.allHooks.delete(id));

        // Remove from pipelines
        for (const [key, hooks] of this.pipelines.entries()) {
            const filtered = hooks.filter(h => h.packageName !== packageName);
            if (filtered.length === 0) {
                this.pipelines.delete(key);
            } else {
                this.pipelines.set(key, filtered);
            }
        }
    }

    /**
     * Clear all hooks
     */
    clear(): void {
        this.pipelines.clear();
        this.allHooks.clear();
    }

    /**
     * Get statistics about registered hooks
     */
    getStats(): { totalHooks: number; totalPipelines: number } {
        return {
            totalHooks: this.allHooks.size,
            totalPipelines: this.pipelines.size
        };
    }
}
