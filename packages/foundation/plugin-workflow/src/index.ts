/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * @objectql/plugin-workflow
 * 
 * State machine workflow engine plugin for ObjectQL.
 * Provides full XState-level state machine execution with guards, actions, and compound states.
 */

// Main plugin export
export { WorkflowPlugin, type WorkflowPluginConfig } from './workflow-plugin';

// Engine components
export { StateMachineEngine } from './engine/state-machine-engine';
export { GuardEvaluator, type GuardResolver } from './engine/guard-evaluator';
export { ActionExecutor, type ActionExecutorFn } from './engine/action-executor';

// Types
export type {
  ExecutionContext,
  TransitionResult,
  WorkflowInstance,
  GuardResult,
  ActionResult,
  StateResolution,
} from './types';

// Re-export protocol types from @objectql/types for convenience
export type {
  StateMachineConfig,
  StateNodeConfig,
  Transition,
  ActionRef,
} from '@objectql/types';
