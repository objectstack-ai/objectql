import { FieldConfig } from "./field";
import { HookAPI } from "./hook"; // Reuse the restricted API interface

/**
 * Defines the scope of the action.
 * - `record`: Acts on a specific record instance (e.g. "Approve Order").
 * - `global`: Acts on the collection or system (e.g. "Import CSV", "Daily Report").
 */
export type ActionType = 'record' | 'global';

/**
 * Re-using FieldConfig allows us to describe input parameters 
 * using the same rich vocabulary as database fields (validation, UI hints, etc).
 */
export type ActionInputDefinition = Record<string, FieldConfig>;

/**
 * Context passed to the action handler execution.
 */
export interface ActionContext<BaseT = any, InputT = any> {
    /** The object this action belongs to. */
    objectName: string;
    
    /** The name of the action being executed. */
    actionName: string;

    /** 
     * The ID of the record being acted upon.
     * Only available if type is 'record'.
     */
    id?: string | number;

    /**
     * The validated input arguments.
     */
    input: InputT;

    /**
     * Database Access API (Same as Hooks).
     */
    api: HookAPI;

    /**
     * User Session.
     */
    user?: {
        id: string | number;
        [key: string]: any;
    };
}

/**
 * The configuration of an Action visible to the Metadata engine (YAML/JSON side).
 */
export interface ActionConfig {
    label?: string;
    description?: string;
    icon?: string;
    
    /**
     * Default: 'global' if no fields defined, but usually specified explicitly.
     */
    type?: ActionType; // 'record' | 'global'

    /**
     * Message to show before executing. If present, UI should prompt confirmation.
     */
    confirm_text?: string;
    
    /**
     * If true, this action is not exposed via API directly (server-internal).
     */
    internal?: boolean;
    
    /**
     * Input parameter schema.
     */
    params?: ActionInputDefinition;
    
    /**
     * Output data shape description (optional, for content negotiation).
     */
    return_type?: string | FieldConfig; 
}

/**
 * The full implementation definition (Code side).
 */
export interface ActionDefinition<BaseT = any, InputT = any, ReturnT = any> extends ActionConfig {
    /**
     * The business logic implementation.
     */
    handler: (ctx: ActionContext<BaseT, InputT>) => Promise<ReturnT>;
}

export type ActionHandler<BaseT = any, InputT = any, ReturnT = any> = (ctx: ActionContext<BaseT, InputT>) => Promise<ReturnT>;
