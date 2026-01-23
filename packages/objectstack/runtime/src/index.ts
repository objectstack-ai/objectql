/**
 * @objectstack/runtime
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
 * ObjectStack Kernel
 * The core runtime engine
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

    constructor(plugins: RuntimePlugin[] = []) {
        this.plugins = plugins;
        this.metadata = new MetadataRegistry();
        this.hooks = new HookManager();
        this.actions = new ActionManager();
    }

    /** Start the kernel */
    async start(): Promise<void> {
        // Install all plugins
        for (const plugin of this.plugins) {
            if (plugin.install) {
                await plugin.install({ engine: this });
            }
        }
        
        // Start all plugins
        for (const plugin of this.plugins) {
            if (plugin.onStart) {
                await plugin.onStart({ engine: this });
            }
        }
    }

    /** Stop the kernel */
    async stop(): Promise<void> {
        // Stop all plugins in reverse order
        for (let i = this.plugins.length - 1; i >= 0; i--) {
            const plugin = this.plugins[i];
            if (plugin.onStop) {
                await plugin.onStop({ engine: this });
            }
        }
    }

    /** Seed initial data */
    async seed(): Promise<void> {
        // Stub implementation
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
 */
export class ObjectStackRuntimeProtocol {
    // Stub implementation
}

