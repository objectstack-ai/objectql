/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Internal types for the Workflow Engine
 * These complement the protocol types from @objectql/types
 */

import type { StateMachineConfig, StateNodeConfig } from '@objectql/types';

/**
 * Execution context for state machine operations
 */
export interface ExecutionContext {
  /** Current record data */
  record: Record<string, any>;
  
  /** Previous record data (for updates) */
  previousRecord?: Record<string, any>;
  
  /** Operation type */
  operation: 'create' | 'update' | 'delete';
  
  /** Current user context */
  user?: any;
  
  /** API instance for database access */
  api?: any;
  
  /** Additional context data */
  context?: Record<string, any>;
}

/**
 * Result of a state transition attempt
 */
export interface TransitionResult {
  /** Whether the transition was allowed */
  allowed: boolean;
  
  /** Target state if transition is allowed */
  targetState?: string;
  
  /** Error message if transition was denied */
  error?: string;
  
  /** Error code */
  errorCode?: string;
  
  /** Actions to execute */
  actions?: string[];
  
  /** Metadata about the transition */
  metadata?: {
    /** Guard that blocked the transition (if any) */
    blockedBy?: string;
    
    /** Guards that were evaluated */
    guardsEvaluated?: string[];
    
    /** Transition that was attempted */
    transition?: string;
  };
}

/**
 * Workflow instance for audit trail
 */
export interface WorkflowInstance {
  /** Instance ID */
  id: string;
  
  /** Object name */
  objectName: string;
  
  /** Record ID */
  recordId: string;
  
  /** State machine name */
  stateMachineName: string;
  
  /** Current state */
  currentState: string;
  
  /** Previous state */
  previousState?: string;
  
  /** Timestamp */
  timestamp: string;
  
  /** User who triggered the transition */
  userId?: string;
  
  /** Transition event */
  event?: string;
  
  /** Actions executed */
  actionsExecuted?: string[];
  
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Guard evaluation result
 */
export interface GuardResult {
  /** Whether the guard passed */
  passed: boolean;
  
  /** Guard name/reference */
  guard: string;
  
  /** Error message if guard failed */
  error?: string;
}

/**
 * Action execution result
 */
export interface ActionResult {
  /** Whether the action executed successfully */
  success: boolean;
  
  /** Action name/reference */
  action: string;
  
  /** Error message if action failed */
  error?: string;
  
  /** Result data from the action */
  result?: any;
}

/**
 * State resolution result (for compound/parallel states)
 */
export interface StateResolution {
  /** Resolved state path */
  statePath: string[];
  
  /** Leaf state (final resolved state) */
  leafState: string;
  
  /** Whether this is a final state */
  isFinal: boolean;
  
  /** Entry actions for all states in the path */
  entryActions: string[];
  
  /** Exit actions for states being exited */
  exitActions: string[];
}
