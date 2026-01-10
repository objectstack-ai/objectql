import { ObjectConfig } from "./object";
import { Driver } from "./driver";
import { UnifiedQuery, FilterCriterion } from "./query";
import { MetadataRegistry } from "./registry";
import { HookName, HookHandler, HookContext } from "./hook";

export { ObjectConfig } from "./object";
export { MetadataRegistry } from "./registry";
export { HookName, HookHandler, HookContext } from "./hook";

/**
 * Interface for object repository like operations.
 * Defined here for context typing, but implemented in client.
 */
export interface IObjectRepository {
    find(query?: UnifiedQuery): Promise<any[]>;
    findOne(idOrQuery: string | number | UnifiedQuery): Promise<any>;
    count(filters: any): Promise<number>;
    create(doc: any): Promise<any>;
    update(id: string | number, doc: any, options?: any): Promise<any>;
    delete(id: string | number): Promise<any>;
    aggregate(query: any): Promise<any>;
    distinct(field: string, filters?: any): Promise<any[]>;
    findOneAndUpdate?(filters: any, update: any, options?: any): Promise<any>;
    createMany(data: any[]): Promise<any>;
    updateMany(filters: any, data: any): Promise<any>;
    deleteMany(filters: any): Promise<any>;
}

export interface ObjectQLConfig {

    registry?: MetadataRegistry;
    datasources: Record<string, Driver>;
    objects?: Record<string, ObjectConfig>;
    packages?: string[];
}

export interface IObjectQL {
    getObject(name: string): ObjectConfig | undefined;
    getConfigs(): Record<string, ObjectConfig>;
    datasource(name: string): Driver;
    init(): Promise<void>;
    addPackage(name: string): void;
    removePackage(name: string): void;
    metadata: MetadataRegistry; 

    on(event: HookName, objectName: string, handler: HookHandler): void;
    triggerHook(event: HookName, objectName: string, ctx: HookContext): Promise<void>;
}

export interface ObjectQLContext {
    // === Identity & Isolation ===
    userId?: string;                        // Current User ID
    spaceId?: string;                       // Multi-tenancy Isolation (Organization ID)
    roles: string[];                        // RBAC Roles

    // === Execution Flags ===
    /**
     * Sudo Mode / System Bypass.
     */
    isSystem?: boolean;

    // === Data Entry Point ===
    /**
     * Returns a repository proxy bound to this context.
     * All operations performed via this proxy inherit userId, spaceId, and transaction.
     */
    object(entityName: string): IObjectRepository;

    /**
     * Execute a function within a transaction.
     * The callback receives a new context 'trxCtx' which inherits userId, spaceId from this context.
     */
    transaction(callback: (trxCtx: ObjectQLContext) => Promise<any>): Promise<any>;

    /**
     * Returns a new context with system privileges (isSystem: true).
     * It shares the same transaction scope as the current context.
     */
    sudo(): ObjectQLContext;

    /**
     * Internal: Driver-specific transaction handle.
     */
    transactionHandle?: any;
}

export interface ObjectQLContextOptions {
    userId?: string;
    spaceId?: string;
    roles?: string[];
    isSystem?: boolean;
}
