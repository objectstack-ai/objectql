/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * State Machine Engine
 * 
 * Core interpreter for StateMachineConfig.
 * Evaluates state transitions, handles guards, executes actions, and resolves compound states.
 */

import type { StateMachineConfig, StateNodeConfig, Transition } from '@objectql/types';
import type { ExecutionContext, TransitionResult, StateResolution } from '../types';
import { GuardEvaluator } from './guard-evaluator';
import { ActionExecutor } from './action-executor';

/**
 * State Machine Engine class
 */
export class StateMachineEngine {
  private config: StateMachineConfig;
  private guardEvaluator: GuardEvaluator;
  private actionExecutor: ActionExecutor;

  constructor(
    config: StateMachineConfig,
    guardEvaluator: GuardEvaluator,
    actionExecutor: ActionExecutor
  ) {
    this.config = config;
    this.guardEvaluator = guardEvaluator;
    this.actionExecutor = actionExecutor;
  }

  /**
   * Attempt a state transition
   */
  async transition(
    currentState: string,
    targetState: string,
    context: ExecutionContext
  ): Promise<TransitionResult> {
    // Find the current state node
    const currentNode = this.findStateNode(currentState);
    if (!currentNode) {
      return {
        allowed: false,
        error: `Current state "${currentState}" not found in state machine`,
        errorCode: 'STATE_NOT_FOUND',
      };
    }

    // Find the transition
    const transition = this.findTransition(currentNode, targetState);
    if (!transition) {
      return {
        allowed: false,
        error: `No valid transition from "${currentState}" to "${targetState}"`,
        errorCode: 'TRANSITION_NOT_FOUND',
        metadata: {
          transition: `${currentState} -> ${targetState}`,
        },
      };
    }

    // Evaluate guards
    const guardsEvaluated: string[] = [];
    if (transition.cond) {
      const guards = Array.isArray(transition.cond) ? transition.cond : [transition.cond];
      
      for (const guard of guards) {
        const guardRef = typeof guard === 'string' ? guard : 'inline';
        guardsEvaluated.push(guardRef);
        
        const guardResult = await this.guardEvaluator.evaluate(guard, context);
        if (!guardResult.passed) {
          return {
            allowed: false,
            error: guardResult.error || `Guard "${guardRef}" denied transition`,
            errorCode: 'TRANSITION_DENIED',
            metadata: {
              blockedBy: guardRef,
              guardsEvaluated,
              transition: `${currentState} -> ${targetState}`,
            },
          };
        }
      }
    }

    // Resolve state paths for exit/entry actions
    const exitResolution = this.resolveStatePath(currentState);
    const entryResolution = this.resolveStatePath(targetState);

    // Collect all actions to execute
    const actionsToExecute: string[] = [];

    // Exit actions (from innermost to outermost)
    actionsToExecute.push(...exitResolution.exitActions.reverse());

    // Transition actions
    if (transition.actions) {
      const transitionActions = Array.isArray(transition.actions)
        ? transition.actions
        : [transition.actions];
      actionsToExecute.push(...transitionActions.map(a => typeof a === 'string' ? a : a.type || ''));
    }

    // Entry actions (from outermost to innermost)
    actionsToExecute.push(...entryResolution.entryActions);

    // Execute actions
    await this.actionExecutor.executeMultiple(actionsToExecute.filter(a => a), context);

    return {
      allowed: true,
      targetState: entryResolution.leafState,
      actions: actionsToExecute,
      metadata: {
        guardsEvaluated,
        transition: `${currentState} -> ${targetState}`,
      },
    };
  }

  /**
   * Get initial state for the state machine
   */
  getInitialState(): string {
    if (!this.config.initial) {
      // If no initial state specified, use the first state
      const firstState = Object.keys(this.config.states || {})[0];
      return firstState || '';
    }

    // Resolve initial state (may be a compound state)
    const resolution = this.resolveStatePath(this.config.initial);
    return resolution.leafState;
  }

  /**
   * Check if a state is final
   */
  isFinalState(state: string): boolean {
    const node = this.findStateNode(state);
    if (!node) return false;

    return node.type === 'final';
  }

  /**
   * Get all valid transitions from a state
   */
  getValidTransitions(state: string): string[] {
    const node = this.findStateNode(state);
    if (!node || !node.on) return [];

    const targets: string[] = [];
    
    for (const [_event, transition] of Object.entries(node.on)) {
      if (typeof transition === 'string') {
        targets.push(transition);
      } else if (transition && typeof transition === 'object') {
        const trans = transition as Transition;
        if (trans.target) {
          targets.push(trans.target);
        }
      }
    }

    return targets;
  }

  /**
   * Find a state node by name
   */
  private findStateNode(stateName: string): StateNodeConfig | undefined {
    if (!this.config.states) return undefined;

    // Handle compound state paths (e.g., "parent.child")
    const parts = stateName.split('.');
    let currentStates = this.config.states;
    let node: StateNodeConfig | undefined;

    for (const part of parts) {
      node = currentStates[part];
      if (!node) return undefined;
      
      // Navigate to child states if this is a compound state
      if (node.states) {
        currentStates = node.states;
      }
    }

    return node;
  }

  /**
   * Find a transition from current node to target
   */
  private findTransition(
    currentNode: StateNodeConfig,
    targetState: string
  ): Transition | undefined {
    if (!currentNode.on) return undefined;

    // Look through all events/transitions
    for (const [_event, transition] of Object.entries(currentNode.on)) {
      // Handle string target
      if (typeof transition === 'string') {
        if (transition === targetState) {
          return { target: targetState };
        }
        continue;
      }

      // Handle transition object
      if (transition && typeof transition === 'object') {
        const trans = transition as Transition;
        if (trans.target === targetState) {
          return trans;
        }

        // Handle array of transitions
        if (Array.isArray(trans)) {
          for (const t of trans) {
            if (typeof t === 'object' && t.target === targetState) {
              return t;
            }
          }
        }
      }
    }

    return undefined;
  }

  /**
   * Resolve a state path to its leaf state and collect entry/exit actions
   */
  private resolveStatePath(stateName: string): StateResolution {
    const statePath: string[] = [];
    const entryActions: string[] = [];
    const exitActions: string[] = [];
    
    let currentPath = '';
    const parts = stateName.split('.');
    let currentStates = this.config.states || {};
    let leafState = stateName;
    let isFinal = false;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}.${part}` : part;
      statePath.push(currentPath);

      const node = currentStates[part];
      if (!node) break;

      // Collect entry actions
      if (node.entry) {
        const actions = Array.isArray(node.entry) ? node.entry : [node.entry];
        entryActions.push(...actions.map(a => typeof a === 'string' ? a : a.type || ''));
      }

      // Collect exit actions
      if (node.exit) {
        const actions = Array.isArray(node.exit) ? node.exit : [node.exit];
        exitActions.push(...actions.map(a => typeof a === 'string' ? a : a.type || ''));
      }

      // Check if this is a final state
      if (node.type === 'final') {
        isFinal = true;
      }

      // If this is a compound state, resolve to its initial child
      if (node.states && node.initial) {
        currentStates = node.states;
        leafState = `${currentPath}.${node.initial}`;
        // Continue resolving the initial child
        parts.splice(i + 1, 0, node.initial);
      } else if (node.states) {
        // Compound state without explicit initial - use first state
        const firstChild = Object.keys(node.states)[0];
        if (firstChild) {
          currentStates = node.states;
          leafState = `${currentPath}.${firstChild}`;
          parts.splice(i + 1, 0, firstChild);
        }
      }
    }

    return {
      statePath,
      leafState,
      isFinal,
      entryActions: entryActions.filter(a => a),
      exitActions: exitActions.filter(a => a),
    };
  }

  /**
   * Validate that a state machine configuration is well-formed
   */
  static validate(config: StateMachineConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check that states exist
    if (!config.states || Object.keys(config.states).length === 0) {
      errors.push('State machine must have at least one state');
    }

    // Check that initial state exists
    if (config.initial && config.states) {
      if (!config.states[config.initial]) {
        errors.push(`Initial state "${config.initial}" not found in states`);
      }
    }

    // Validate each state node
    if (config.states) {
      for (const [stateName, state] of Object.entries(config.states)) {
        // Check compound states have initial
        if (state.states && !state.initial) {
          errors.push(`Compound state "${stateName}" must specify an initial child state`);
        }

        // Validate transitions reference existing states
        if (state.on) {
          for (const [_event, transition] of Object.entries(state.on)) {
            const target = typeof transition === 'string' 
              ? transition 
              : (transition as any)?.target;
            
            if (target && !config.states[target]) {
              // Could be a compound state path, skip validation for now
              // In production, would need more sophisticated path validation
            }
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
