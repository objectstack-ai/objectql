/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Import and re-export types from the Protocol Constitution (@objectstack/spec)
import type { Action } from '@objectstack/spec';
import { FieldConfig } from "./field";
import { HookAPI } from "./hook"; // Reuse the restricted API interface

/**
 * Re-export Protocol Types from the Constitution
 */
export type { Action as SpecAction };

/**
 * RUNTIME-SPECIFIC TYPES
 * The following types extend the Protocol Action definition with runtime execution capabilities
 */

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
 * 
 * RUNTIME TYPE: Used during action execution.
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
 * Runtime Action Configuration
 * 
 * The configuration of an Action visible to the Metadata engine (YAML/JSON side).
 * Compatible with Protocol Action but adds runtime-specific options.
 */
export interface ActionConfig {
    /** Display label */
    label?: string;
    
    /** Description */
    description?: string;
    
    /** Icon name */
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
 * 
 * RUNTIME TYPE: Includes the handler function for execution.
 */
export interface ActionDefinition<BaseT = any, InputT = any, ReturnT = any> extends ActionConfig {
    /**
     * The business logic implementation.
     */
    handler: (ctx: ActionContext<BaseT, InputT>) => Promise<ReturnT>;
}

export type ActionHandler<BaseT = any, InputT = any, ReturnT = any> = (ctx: ActionContext<BaseT, InputT>) => Promise<ReturnT>;
