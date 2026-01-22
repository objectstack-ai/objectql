/**
 * @objectstack/runtime
 * ObjectStack Runtime Types
 * 
 * This package defines the runtime types for the ObjectStack ecosystem.
 */

/**
 * Runtime Context
 * Provides access to the ObjectStack kernel during plugin execution
 */
export interface RuntimeContext {
    /** The ObjectStack kernel instance */
    engine: any; // ObjectStackKernel
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
export interface ObjectStackKernel {
    /** Query interface (QL) */
    ql: any;
    /** Start the kernel */
    start(): Promise<void>;
    /** Stop the kernel */
    stop?(): Promise<void>;
    /** Seed initial data */
    seed?(): Promise<void>;
}
