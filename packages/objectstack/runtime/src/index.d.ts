/**
 * @objectql/runtime
 * ObjectStack Runtime Types
 *
 * This package defines the runtime types for the ObjectStack ecosystem.
 */
import { MetadataRegistry } from './metadata';
import { HookManager } from './hooks';
import { ActionManager } from './actions';
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
export declare class ObjectStackKernel {
    /** Query interface (QL) */
    ql: unknown;
    /** Metadata registry */
    metadata: MetadataRegistry;
    /** Hook manager */
    hooks: HookManager;
    /** Action manager */
    actions: ActionManager;
    /** Registered plugins */
    private plugins;
    constructor(plugins?: RuntimePlugin[]);
    /** Start the kernel */
    start(): Promise<void>;
    /** Stop the kernel */
    stop(): Promise<void>;
    /** Seed initial data */
    seed(): Promise<void>;
    /** Find records */
    find(objectName: string, query: unknown): Promise<{
        value: unknown[];
        count: number;
    }>;
    /** Get a single record */
    get(objectName: string, id: string): Promise<unknown>;
    /** Create a record */
    create(objectName: string, data: unknown): Promise<unknown>;
    /** Update a record */
    update(objectName: string, id: string, data: unknown): Promise<unknown>;
    /** Delete a record */
    delete(objectName: string, id: string): Promise<boolean>;
    /** Get metadata for an object */
    getMetadata(objectName: string): unknown;
    /** Get view configuration */
    getView(objectName: string, viewType?: 'list' | 'form'): unknown;
}
/**
 * ObjectStack Runtime Protocol
 * Base class for runtime protocol implementations
 */
export declare class ObjectStackRuntimeProtocol {
}
//# sourceMappingURL=index.d.ts.map