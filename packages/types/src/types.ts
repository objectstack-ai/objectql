import { ObjectConfig } from "./object";
import { Driver } from "./driver";
import { UnifiedQuery, FilterCriterion } from "./query";
import { ObjectRegistry } from "./registry";
import { HookName, HookHandler, HookContext } from "./hook";
import { ActionHandler, ActionContext } from "./action";

export { ObjectConfig } from "./object";
export { ObjectRegistry } from "./registry";
export * from "./hook";
export * from "./action";

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
    execute(actionName: string, id: string | number | undefined, params: any): Promise<any>;
}

export interface ObjectQLPlugin {
    name: string;
    setup(app: IObjectQL): void | Promise<void>;
}

export interface ObjectQLConfig {
    registry?: ObjectRegistry;
    datasources?: Record<string, Driver>;
    /**
     * Optional connection string for auto-configuration.
     * e.g. "sqlite://dev.db", "postgres://localhost/db", "mongodb://localhost/db"
     */
    connection?: string;
    /**
     * Path(s) to the directory containing schema files (*.object.yml).
     */
    source?: string | string[];
    objects?: Record<string, ObjectConfig>;
    /**
     * @deprecated Use 'presets' instead.
     */
    packages?: string[];
    /**
     * List of npm packages or presets to load.
     */
    presets?: string[];
    /**
     * List of plugins to load. 
     * Can be an instance of ObjectQLPlugin or a package name string.
     */
    plugins?: (ObjectQLPlugin | string)[];
    /**
     * List of remote ObjectQL instances to connect to.
     * e.g. ["http://user-service:3000", "http://order-service:3000"]
     */
    remotes?: string[];
}

export interface IObjectQL {
    getObject(name: string): ObjectConfig | undefined;
    getConfigs(): Record<string, ObjectConfig>;
    datasource(name: string): Driver;
    init(): Promise<void>;
    addPackage(name: string): void;
    removePackage(name: string): void;
    metadata: ObjectRegistry; 

    on(event: HookName, objectName: string, handler: HookHandler): void;
    triggerHook(event: HookName, objectName: string, ctx: HookContext): Promise<void>;

    registerAction(objectName: string, actionName: string, handler: ActionHandler): void;
    executeAction(objectName: string, actionName: string, ctx: ActionContext): Promise<any>;
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
