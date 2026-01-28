/**
 * @objectql/runtime
 * ObjectStack Runtime Types
 * 
 * This package defines the runtime types for the ObjectStack ecosystem.
 */

// Import core modules for use in kernel
import { MetadataRegistry } from './metadata';
import { HookManager } from './hooks';
import { ActionManager } from './actions';

// Export core runtime modules
export * from './metadata';
export * from './hooks';
export * from './actions';

/**
 * Runtime Context
 * Provides access to the ObjectStack kernel during plugin execution
 */
export interface RuntimeContext {
    /** The ObjectStack kernel instance */
    engine: ObjectStackKernel;
}

/**
 * Runtime Plugin
 * Interface for ObjectStack plugins
 */
export interface RuntimePlugin {
    /** Plugin name */
    name: string;
    /** Plugin version */
    version?: string;
    /** Install hook - called during kernel initialization */
    install?: (ctx: RuntimeContext) => void | Promise<void>;
    /** Start hook - called when kernel starts */
    onStart?: (ctx: RuntimeContext) => void | Promise<void>;
    /** Stop hook - called when kernel stops */
    onStop?: (ctx: RuntimeContext) => void | Promise<void>;
}

/**
 * Driver Interface (compatible with @objectql/types Driver)
 * Represents a database or storage driver
 */
export interface RuntimeDriver {
    /** Driver name/identifier */
    name?: string;
    /** Connect to the database */
    connect?: () => Promise<void>;
    /** Disconnect from the database */
    disconnect?: () => Promise<void>;
    /** Any additional driver methods */
    [key: string]: any;
}

/**
 * Application Config (compatible with @objectql/types AppConfig)
 * Represents an application manifest
 */
export interface RuntimeAppConfig {
    /** Unique application name */
    name: string;
    /** Application label */
    label?: string;
    /** Application description */
    description?: string;
    /** Objects to register */
    objects?: Record<string, any>;
    /** Custom metadata */
    [key: string]: any;
}

/**
 * Kernel Component
 * Union type for all components that can be loaded into the kernel
 */
export type KernelComponent = RuntimePlugin | RuntimeDriver | RuntimeAppConfig;

/**
 * ObjectStack Kernel
 * The core runtime engine implementing the micro-kernel pattern
 * 
 * The micro-kernel accepts a heterogeneous array of components:
 * - RuntimePlugin: Protocol adapters, feature plugins
 * - RuntimeDriver: Database/storage drivers  
 * - RuntimeAppConfig: Application manifests
 * 
 * @example
 * ```typescript
 * import { ObjectStackKernel } from '@objectql/runtime';
 * import { InMemoryDriver } from '@objectql/driver-memory';
 * import { GraphQLPlugin } from '@objectql/protocol-graphql';
 * 
 * const kernel = new ObjectStackKernel([
 *   { name: 'my-app', label: 'My App', objects: {...} }, // App config
 *   new InMemoryDriver(),                                // Driver
 *   new GraphQLPlugin({ port: 4000 })                   // Plugin
 * ]);
 * 
 * await kernel.start();
 * ```
 */
export class ObjectStackKernel {
    /** Query interface (QL) */
    public ql: unknown = null;
    
    /** Metadata registry */
    public metadata: MetadataRegistry;
    
    /** Hook manager */
    public hooks: HookManager;
    
    /** Action manager */
    public actions: ActionManager;
    
    /** Registered plugins */
    private plugins: RuntimePlugin[] = [];
    
    /** Registered drivers */
    private drivers: RuntimeDriver[] = [];
    
    /** Registered applications */
    private applications: RuntimeAppConfig[] = [];

    /**
     * Create a new ObjectStack kernel
     * @param components - Array of plugins, drivers, and app configs
     */
    constructor(components: KernelComponent[] = []) {
        this.metadata = new MetadataRegistry();
        this.hooks = new HookManager();
        this.actions = new ActionManager();
        
        // Classify components by type
        this.classifyComponents(components);
    }

    /**
     * Classify components into plugins, drivers, and app configs
     * @private
     */
    private classifyComponents(components: KernelComponent[]): void {
        for (const component of components) {
            if (this.isRuntimePlugin(component)) {
                this.plugins.push(component);
            } else if (this.isRuntimeDriver(component)) {
                this.drivers.push(component);
            } else if (this.isRuntimeAppConfig(component)) {
                this.applications.push(component);
            } else {
                console.warn('[ObjectStackKernel] Unknown component type:', component);
            }
        }
    }

    /**
     * Type guard for RuntimePlugin
     * @private
     */
    private isRuntimePlugin(component: any): component is RuntimePlugin {
        return (
            typeof component === 'object' &&
            component !== null &&
            typeof component.name === 'string' &&
            (typeof component.install === 'function' ||
             typeof component.onStart === 'function' ||
             typeof component.onStop === 'function')
        );
    }

    /**
     * Type guard for RuntimeDriver
     * @private
     */
    private isRuntimeDriver(component: any): component is RuntimeDriver {
        return (
            typeof component === 'object' &&
            component !== null &&
            (typeof component.connect === 'function' ||
             typeof component.find === 'function' ||
             typeof component.create === 'function' ||
             typeof component.update === 'function' ||
             typeof component.delete === 'function')
        );
    }

    /**
     * Type guard for RuntimeAppConfig
     * @private
     */
    private isRuntimeAppConfig(component: any): component is RuntimeAppConfig {
        return (
            typeof component === 'object' &&
            component !== null &&
            typeof component.name === 'string' &&
            // App configs typically have 'objects' or 'label' fields
            (component.objects !== undefined || component.label !== undefined) &&
            // Must NOT be a plugin (no lifecycle methods)
            typeof component.install !== 'function' &&
            typeof component.onStart !== 'function' &&
            typeof component.onStop !== 'function' &&
            // Must NOT be a driver (no driver methods)
            typeof component.connect !== 'function' &&
            typeof component.find !== 'function' &&
            typeof component.create !== 'function'
        );
    }

    /** Start the kernel */
    async start(): Promise<void> {
        console.log('[ObjectStackKernel] Starting kernel...');
        
        try {
            // Phase 1: Load application manifests
            for (const app of this.applications) {
                console.log(`[ObjectStackKernel] Loading application: ${app.name}`);
                if (app.objects) {
                    for (const [objName, objConfig] of Object.entries(app.objects)) {
                        this.metadata.register('object', {
                            id: objName,
                            content: objConfig,
                            packageName: app.name
                        } as any);
                    }
                }
            }
            
            // Phase 2: Connect drivers
            for (const driver of this.drivers) {
                if (driver.connect) {
                    console.log(`[ObjectStackKernel] Connecting driver: ${driver.name || 'unnamed'}`);
                    await driver.connect();
                }
            }
            
            // Phase 3: Install all plugins
            for (const plugin of this.plugins) {
                if (plugin.install) {
                    console.log(`[ObjectStackKernel] Installing plugin: ${plugin.name}`);
                    await plugin.install({ engine: this });
                }
            }
            
            // Phase 4: Start all plugins
            for (const plugin of this.plugins) {
                if (plugin.onStart) {
                    console.log(`[ObjectStackKernel] Starting plugin: ${plugin.name}`);
                    await plugin.onStart({ engine: this });
                }
            }
            
            console.log('[ObjectStackKernel] Kernel started successfully');
        } catch (error) {
            console.error('[ObjectStackKernel] Error during kernel startup:', error);
            // Attempt to stop any partially initialized components
            await this.stop().catch(stopError => {
                console.error('[ObjectStackKernel] Error during cleanup after failed startup:', stopError);
            });
            throw error;
        }
    }

    /** Stop the kernel */
    async stop(): Promise<void> {
        console.log('[ObjectStackKernel] Stopping kernel...');
        
        const errors: Error[] = [];
        
        // Stop all plugins in reverse order
        for (let i = this.plugins.length - 1; i >= 0; i--) {
            const plugin = this.plugins[i];
            if (plugin.onStop) {
                try {
                    console.log(`[ObjectStackKernel] Stopping plugin: ${plugin.name}`);
                    await plugin.onStop({ engine: this });
                } catch (error) {
                    console.error(`[ObjectStackKernel] Error stopping plugin ${plugin.name}:`, error);
                    errors.push(error as Error);
                }
            }
        }
        
        // Disconnect drivers
        for (const driver of this.drivers) {
            if (driver.disconnect) {
                try {
                    console.log(`[ObjectStackKernel] Disconnecting driver: ${driver.name || 'unnamed'}`);
                    await driver.disconnect();
                } catch (error) {
                    console.error(`[ObjectStackKernel] Error disconnecting driver ${driver.name || 'unnamed'}:`, error);
                    errors.push(error as Error);
                }
            }
        }
        
        if (errors.length > 0) {
            console.error(`[ObjectStackKernel] Kernel stopped with ${errors.length} error(s)`);
            // Throw the first error to signal failure while ensuring cleanup continues
            throw errors[0];
        }
        
        console.log('[ObjectStackKernel] Kernel stopped successfully');
    }

    /** Seed initial data */
    async seed(): Promise<void> {
        // Stub implementation
    }
    
    /**
     * Get a registered driver by name or type
     * @param nameOrType - Driver name or type identifier
     * @returns The driver instance or undefined
     */
    getDriver(nameOrType?: string): RuntimeDriver | undefined {
        if (!nameOrType) {
            // Return the first driver (default)
            return this.drivers[0];
        }
        return this.drivers.find(d => d.name === nameOrType);
    }
    
    /**
     * Get all registered drivers
     * @returns Array of all drivers
     */
    getAllDrivers(): RuntimeDriver[] {
        return [...this.drivers];
    }

    /** Find records */
    async find(objectName: string, query: unknown): Promise<{ value: unknown[]; count: number }> {
        return { value: [], count: 0 };
    }

    /** Get a single record */
    async get(objectName: string, id: string): Promise<unknown> {
        return {};
    }

    /** Create a record */
    async create(objectName: string, data: unknown): Promise<unknown> {
        return data;
    }

    /** Update a record */
    async update(objectName: string, id: string, data: unknown): Promise<unknown> {
        return data;
    }

    /** Delete a record */
    async delete(objectName: string, id: string): Promise<boolean> {
        return true;
    }

    /** Get metadata for an object */
    getMetadata(objectName: string): unknown {
        return {};
    }

    /** Get view configuration */
    getView(objectName: string, viewType?: 'list' | 'form'): unknown {
        return null;
    }
}

/**
 * ObjectStack Runtime Protocol
 * Base class for runtime protocol implementations
 * 
 * This is the bridge layer between external protocols (REST, GraphQL, OData, etc.)
 * and the ObjectStack kernel. It provides a standardized API for protocol plugins
 * to interact with the kernel without direct database access.
 * 
 * Key Design Principles:
 * - No Direct DB Access: All data operations go through the kernel
 * - Protocol Agnostic: Works with any protocol implementation
 * - Type Safe: Provides strongly typed methods
 * - Metadata-Driven: Exposes metadata for dynamic schema discovery
 */
export class ObjectStackRuntimeProtocol {
    constructor(private readonly kernel: ObjectStackKernel) {}

    // ========================================
    // METADATA METHODS
    // ========================================

    /**
     * Get all registered object types (metadata)
     * Used for schema generation in GraphQL, OData, etc.
     * @returns Array of object names
     */
    getMetaTypes(): string[] {
        // Get the type map for 'object' metadata
        const typeMap = this.kernel.metadata.store.get('object');
        if (!typeMap) return [];
        
        // Return the keys (object IDs/names)
        return Array.from(typeMap.keys());
    }

    /**
     * Get metadata for a specific object
     * @param objectName - The name of the object
     * @returns Object metadata configuration
     */
    getMetaItem(objectName: string): unknown {
        return this.kernel.metadata.get('object', objectName);
    }

    /**
     * Get all metadata items of a specific type
     * @param metaType - The type of metadata (e.g., 'object', 'action', 'page')
     * @returns Map of metadata items
     */
    getAllMetaItems(metaType: string): Map<string, unknown> {
        const items = this.kernel.metadata.list(metaType);
        const map = new Map<string, unknown>();
        items.forEach((item: any, index: number) => {
            // Create a map with item names/ids as keys
            // For objects, use the name field if available
            const key = item.name || item.id || `item_${index}`;
            map.set(key, item);
        });
        return map;
    }

    /**
     * Check if an object exists in metadata
     */
    hasObject(objectName: string): boolean {
        return this.kernel.metadata.has('object', objectName);
    }

    // ========================================
    // DATA QUERY METHODS
    // ========================================

    /**
     * Find multiple records
     * @param objectName - The object to query
     * @param query - Query parameters (filters, sorting, pagination)
     * @returns Array of records and count
     */
    async findData(objectName: string, query?: any): Promise<{ value: any[]; count: number }> {
        return await this.kernel.find(objectName, query || {});
    }

    /**
     * Get a single record by ID
     * @param objectName - The object to query
     * @param id - Record identifier
     * @returns Single record
     */
    async getData(objectName: string, id: string): Promise<any> {
        return await this.kernel.get(objectName, id);
    }

    /**
     * Count records matching filters
     * @param objectName - The object to count
     * @param filters - Filter conditions
     * @returns Number of matching records
     */
    async countData(objectName: string, filters?: any): Promise<number> {
        const result = await this.kernel.find(objectName, { where: filters });
        return result.count;
    }

    // ========================================
    // DATA MUTATION METHODS
    // ========================================

    /**
     * Create a new record
     * @param objectName - The object to create
     * @param data - Record data
     * @returns Created record
     */
    async createData(objectName: string, data: any): Promise<any> {
        return await this.kernel.create(objectName, data);
    }

    /**
     * Update an existing record
     * @param objectName - The object to update
     * @param id - Record identifier
     * @param data - Updated fields
     * @returns Updated record
     */
    async updateData(objectName: string, id: string, data: any): Promise<any> {
        return await this.kernel.update(objectName, id, data);
    }

    /**
     * Delete a record
     * @param objectName - The object to delete from
     * @param id - Record identifier
     * @returns Success status
     */
    async deleteData(objectName: string, id: string): Promise<boolean> {
        return await this.kernel.delete(objectName, id);
    }

    // ========================================
    // VIEW & UI METADATA METHODS
    // ========================================

    /**
     * Get view configuration for an object
     * @param objectName - The object name
     * @param viewType - Type of view (list, form, etc.)
     * @returns View configuration
     */
    getViewConfig(objectName: string, viewType?: 'list' | 'form'): unknown {
        return this.kernel.getView(objectName, viewType);
    }

    // ========================================
    // HOOK & ACTION METHODS
    // ========================================

    /**
     * Execute a custom action
     * @param actionName - The action identifier (format: "objectName:actionName")
     * @param params - Action parameters
     * @returns Action result
     */
    async executeAction(actionName: string, params?: any): Promise<any> {
        // Parse action name to extract object and action
        const parts = actionName.split(':');
        if (parts.length !== 2) {
            throw new Error(`Invalid action name format: "${actionName}". Expected "objectName:actionName"`);
        }
        
        const [objectName, action] = parts;
        
        // Create action context
        const ctx: any = {
            objectName,
            actionName: action,
            data: params,
            input: params
        };
        
        return await this.kernel.actions.execute(objectName, action, ctx);
    }

    /**
     * Get all registered actions
     * @returns Array of action names in format "objectName:actionName"
     */
    getActions(): string[] {
        return this.kernel.actions.list();
    }

    // ========================================
    // UTILITY METHODS
    // ========================================

    /**
     * Get the underlying kernel instance
     * For advanced use cases only
     */
    getKernel(): ObjectStackKernel {
        return this.kernel;
    }
}

