/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TriggerContext, Trigger } from '@objectql/types';

/**
 * Maps database operations to trigger actions
 */
const OPERATION_TO_ACTION_MAP: Record<string, 'insert' | 'update' | 'delete'> = {
    'create': 'insert',
    'update': 'update',
    'delete': 'delete'
};

/**
 * Trigger Execution Engine
 * 
 * Executes triggers (business logic hooks) before or after database operations.
 * Replaces the legacy hook system with the standard @objectstack/spec trigger protocol.
 */
export class TriggerEngine {
    private triggers: Map<string, Trigger[]> = new Map();

    /**
     * Register a trigger for a specific object
     */
    register(objectName: string, trigger: Trigger, packageName?: string): void {
        const key = this.getTriggerKey(objectName);
        const triggers = this.triggers.get(key) || [];
        
        // Add package metadata for cleanup
        (trigger as any).__packageName = packageName;
        
        triggers.push(trigger);
        
        // Sort by execution order (lower numbers execute first)
        triggers.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        this.triggers.set(key, triggers);
    }

    /**
     * Remove all triggers for a specific package
     */
    removePackage(packageName: string): void {
        for (const [key, triggers] of this.triggers.entries()) {
            const filtered = triggers.filter(t => (t as any).__packageName !== packageName);
            if (filtered.length === 0) {
                this.triggers.delete(key);
            } else {
                this.triggers.set(key, filtered);
            }
        }
    }

    /**
     * Execute triggers for a specific operation
     */
    async execute(
        objectName: string,
        operation: 'create' | 'update' | 'delete',
        timing: 'before' | 'after',
        context: Omit<TriggerContext, 'action' | 'timing'>
    ): Promise<void> {
        const action = OPERATION_TO_ACTION_MAP[operation];
        if (!action) {
            throw new Error(`Unknown operation: ${operation}`);
        }

        const triggers = this.getMatchingTriggers(objectName, action, timing);
        
        if (triggers.length === 0) {
            return;
        }

        // Build complete trigger context
        const triggerContext: TriggerContext = {
            ...context,
            action,
            timing
        };

        // Execute triggers in order
        for (const trigger of triggers) {
            if (!trigger.active) {
                continue;
            }

            try {
                await trigger.execute(triggerContext);
            } catch (error) {
                // Re-throw with context about which trigger failed
                const enhancedError = new Error(
                    `Trigger '${trigger.name}' failed: ${error instanceof Error ? error.message : String(error)}`
                );
                (enhancedError as any).originalError = error;
                (enhancedError as any).triggerName = trigger.name;
                throw enhancedError;
            }
        }
    }

    /**
     * Get triggers that match the given criteria
     */
    private getMatchingTriggers(
        objectName: string,
        action: 'insert' | 'update' | 'delete',
        timing: 'before' | 'after'
    ): Trigger[] {
        const key = this.getTriggerKey(objectName);
        const allTriggers = this.triggers.get(key) || [];

        return allTriggers.filter(trigger => {
            // Check timing match
            if (trigger.timing !== timing) {
                return false;
            }

            // Check action match (can be single action or array)
            if (Array.isArray(trigger.action)) {
                return trigger.action.includes(action);
            } else {
                return trigger.action === action;
            }
        });
    }

    /**
     * Generate internal key for trigger storage
     */
    private getTriggerKey(objectName: string): string {
        return objectName.toLowerCase();
    }

    /**
     * Get all registered triggers (for debugging/testing)
     */
    getAllTriggers(): Map<string, Trigger[]> {
        return new Map(this.triggers);
    }

    /**
     * Clear all triggers (for testing)
     */
    clear(): void {
        this.triggers.clear();
    }
}
