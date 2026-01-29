/**
 * ObjectQL Plugin System
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Runtime context passed to plugin lifecycle hooks
 * 
 * This context provides access to the kernel/engine instance
 * and allows plugins to interact with the ObjectStack runtime.
 */
export interface RuntimeContext {
    /**
     * The ObjectStack kernel/engine instance
     * 
     * This provides access to:
     * - metadata registry
     * - hook manager
     * - action manager
     * - CRUD operations
     */
    engine: any; // Using 'any' to avoid circular dependency
    
    /**
     * Get the kernel instance (alternative accessor)
     * Some implementations may use getKernel() instead of engine
     */
    getKernel?: () => any;
}

/**
 * RuntimePlugin Interface
 * 
 * Defines the standard plugin contract for ObjectStack/ObjectQL ecosystem.
 * All plugins (protocol adapters, data drivers, feature extensions) should
 * implement this interface to ensure consistent lifecycle management.
 * 
 * Lifecycle Order:
 * 1. install() - Called during kernel initialization
 * 2. onStart() - Called when kernel starts
 * 3. onStop() - Called when kernel stops/shuts down
 * 
 * @example
 * ```typescript
 * export class MyPlugin implements RuntimePlugin {
 *   name = '@myorg/my-plugin';
 *   version = '1.0.0';
 *   
 *   async install(ctx: RuntimeContext): Promise<void> {
 *     // Register hooks, load configuration
 *     console.log('Plugin installed');
 *   }
 *   
 *   async onStart(ctx: RuntimeContext): Promise<void> {
 *     // Start servers, connect to services
 *     console.log('Plugin started');
 *   }
 *   
 *   async onStop(ctx: RuntimeContext): Promise<void> {
 *     // Cleanup resources, disconnect
 *     console.log('Plugin stopped');
 *   }
 * }
 * ```
 */
export interface RuntimePlugin {
    /**
     * Unique plugin identifier
     * 
     * Should follow npm package naming convention
     * Examples: '@objectql/plugin-security', '@myorg/my-plugin'
     */
    name: string;
    
    /**
     * Plugin version (semantic versioning)
     * 
     * Optional but recommended for debugging and compatibility tracking
     * Example: '1.0.0', '2.1.3-beta'
     */
    version?: string;
    
    /**
     * Install hook - called during kernel initialization
     * 
     * Use this phase to:
     * - Register hooks and event handlers
     * - Initialize plugin state
     * - Load configuration
     * - Register metadata (objects, fields, actions)
     * - Validate dependencies
     * 
     * This is called BEFORE the kernel starts, so services may not be available yet.
     * 
     * @param ctx - Runtime context with access to kernel/engine
     */
    install?(ctx: RuntimeContext): void | Promise<void>;
    
    /**
     * Start hook - called when kernel starts
     * 
     * Use this phase to:
     * - Start background processes (servers, workers, schedulers)
     * - Connect to external services (databases, APIs, message queues)
     * - Initialize runtime resources
     * - Perform health checks
     * 
     * This is called AFTER install() and AFTER all plugins are installed.
     * 
     * @param ctx - Runtime context with access to kernel/engine
     */
    onStart?(ctx: RuntimeContext): void | Promise<void>;
    
    /**
     * Stop hook - called when kernel stops/shuts down
     * 
     * Use this phase to:
     * - Stop background processes
     * - Disconnect from external services
     * - Cleanup resources (file handles, connections, timers)
     * - Flush pending operations
     * - Save state if needed
     * 
     * This is called during graceful shutdown. Ensure cleanup completes quickly.
     * 
     * @param ctx - Runtime context with access to kernel/engine
     */
    onStop?(ctx: RuntimeContext): void | Promise<void>;
}
