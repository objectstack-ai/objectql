import { ObjectRepository } from "./repository";
import { ObjectConfig } from "./metadata";
import { Driver } from "./driver";
import { UnifiedQuery, FilterCriterion } from "./query";
import { MetadataRegistry } from "./registry";
import { SecurityEngine } from "./security";

export { ObjectConfig } from "./metadata";
export { MetadataRegistry } from "./registry";

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
    security: SecurityEngine;
}

export interface HookContext<T = any> {
  // === 1. The Session Context ===
  // Automatically propagates userId, spaceId, and Transaction.
  ctx: ObjectQLContext;

  // === 2. Operational Info ===
  entity: string;
  op: 'find' | 'create' | 'update' | 'delete' | 'count' | 'aggregate';
  
  // === 3. Data Payload (Mutable) ===
  // - In beforeCreate/Update: The data to be written. 
  // - In afterCreate/Update: The result record returned from DB.
  doc?: T;              

  // === 4. Query Context (Mutable, for 'find' only) ===
  // Complies strictly with the UnifiedQuery JSON-DSL (AST).
  // Developers can modify 'fields', 'sort', or wrap 'filters'.
  query?: UnifiedQuery;
  
  // === 5. Helpers ===
  getPreviousDoc: () => Promise<T | undefined>;
  
  // AST Manipulation Utilities
  utils: {
    /**
     * Safely injects a new filter criterion into the existing AST.
     * It wraps existing filters in a new group to preserve operator precedence.
     * * Logic: (Existing_Filters) AND (New_Filter)
     */
    restrict: (criterion: FilterCriterion) => void;
  };
}

export type HookFunction = (context: HookContext) => Promise<void>;

export interface ObjectQLContext {
    // === Identity & Isolation ===
    userId?: string;                        // Current User ID
    spaceId?: string;                       // Multi-tenancy Isolation (Organization ID)
    roles: string[];                        // RBAC Roles

    // === Execution Flags ===
    /**
     * Sudo Mode / System Bypass.
     * - true: Bypasses all permission checks (CRUD, Field Level Security, Record Level Security).
     * - false/undefined: Enforces all permission checks based on 'roles'.
     */
    isSystem?: boolean;

    /**
     * Trigger Control.
     * - true: Skips all lifecycle hooks (beforeCreate, afterUpdate, etc.).
     * - Useful for bulk data imports or raw data correction to prevent side effects.
     * - Requires 'isSystem: true' (Security Safeguard).
     */
    ignoreTriggers?: boolean;

    // === Data Entry Point ===
    /**
     * Returns a repository proxy bound to this context.
     * All operations performed via this proxy inherit userId, spaceId, and transaction.
     */
    object(entityName: string): ObjectRepository;

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
    ignoreTriggers?: boolean;
}
