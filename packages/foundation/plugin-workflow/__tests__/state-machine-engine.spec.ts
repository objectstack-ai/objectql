/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { StateMachineEngine } from '../src/engine/state-machine-engine';
import { GuardEvaluator } from '../src/engine/guard-evaluator';
import { ActionExecutor } from '../src/engine/action-executor';
import type { StateMachineConfig } from '@objectql/types';

describe('StateMachineEngine', () => {
  let guardEvaluator: GuardEvaluator;
  let actionExecutor: ActionExecutor;

  beforeEach(() => {
    guardEvaluator = new GuardEvaluator();
    actionExecutor = new ActionExecutor();
  });

  describe('Simple State Machine', () => {
    it('should allow valid transition', async () => {
      const config: StateMachineConfig = {
        initial: 'draft',
        states: {
          draft: {
            on: {
              submit: { target: 'active' },
            },
          },
          active: {
            on: {
              complete: { target: 'done' },
            },
          },
          done: {
            type: 'final',
          },
        },
      };

      const engine = new StateMachineEngine(config, guardEvaluator, actionExecutor);

      const result = await engine.transition('draft', 'active', {
        record: { status: 'draft' },
        operation: 'update',
      });

      expect(result.allowed).toBe(true);
      expect(result.targetState).toBe('active');
      expect(result.error).toBeUndefined();
    });

    it('should deny invalid transition', async () => {
      const config: StateMachineConfig = {
        initial: 'draft',
        states: {
          draft: {
            on: {
              submit: { target: 'active' },
            },
          },
          active: {},
          done: {
            type: 'final',
          },
        },
      };

      const engine = new StateMachineEngine(config, guardEvaluator, actionExecutor);

      const result = await engine.transition('draft', 'done', {
        record: { status: 'draft' },
        operation: 'update',
      });

      expect(result.allowed).toBe(false);
      expect(result.error).toContain('No valid transition');
      expect(result.errorCode).toBe('TRANSITION_NOT_FOUND');
    });

    it('should get initial state', () => {
      const config: StateMachineConfig = {
        initial: 'draft',
        states: {
          draft: {},
          active: {},
        },
      };

      const engine = new StateMachineEngine(config, guardEvaluator, actionExecutor);
      expect(engine.getInitialState()).toBe('draft');
    });

    it('should detect final state', () => {
      const config: StateMachineConfig = {
        initial: 'draft',
        states: {
          draft: {},
          done: {
            type: 'final',
          },
        },
      };

      const engine = new StateMachineEngine(config, guardEvaluator, actionExecutor);
      expect(engine.isFinalState('done')).toBe(true);
      expect(engine.isFinalState('draft')).toBe(false);
    });
  });

  describe('Guards', () => {
    it('should evaluate guard conditions', async () => {
      const config: StateMachineConfig = {
        initial: 'draft',
        states: {
          draft: {
            on: {
              submit: {
                target: 'active',
                cond: {
                  field: 'approved',
                  operator: 'equals',
                  value: true,
                },
              },
            },
          },
          active: {},
        },
      };

      const engine = new StateMachineEngine(config, guardEvaluator, actionExecutor);

      // Guard passes
      let result = await engine.transition('draft', 'active', {
        record: { status: 'draft', approved: true },
        operation: 'update',
      });

      expect(result.allowed).toBe(true);

      // Guard fails
      result = await engine.transition('draft', 'active', {
        record: { status: 'draft', approved: false },
        operation: 'update',
      });

      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe('TRANSITION_DENIED');
    });

    it('should evaluate multiple guards with AND logic', async () => {
      const config: StateMachineConfig = {
        initial: 'draft',
        states: {
          draft: {
            on: {
              submit: {
                target: 'active',
                cond: [
                  {
                    field: 'approved',
                    operator: 'equals',
                    value: true,
                  },
                  {
                    field: 'amount',
                    operator: 'greater_than',
                    value: 0,
                  },
                ],
              },
            },
          },
          active: {},
        },
      };

      const engine = new StateMachineEngine(config, guardEvaluator, actionExecutor);

      // Both guards pass
      let result = await engine.transition('draft', 'active', {
        record: { status: 'draft', approved: true, amount: 100 },
        operation: 'update',
      });

      expect(result.allowed).toBe(true);

      // One guard fails
      result = await engine.transition('draft', 'active', {
        record: { status: 'draft', approved: true, amount: 0 },
        operation: 'update',
      });

      expect(result.allowed).toBe(false);
    });
  });

  describe('Actions', () => {
    it('should execute entry and exit actions', async () => {
      const executedActions: string[] = [];
      const customExecutor = async (action: string) => {
        executedActions.push(action);
      };

      const customActionExecutor = new ActionExecutor(customExecutor);

      const config: StateMachineConfig = {
        initial: 'draft',
        states: {
          draft: {
            exit: ['onExitDraft'],
            on: {
              submit: { target: 'active' },
            },
          },
          active: {
            entry: ['onEnterActive'],
          },
        },
      };

      const engine = new StateMachineEngine(config, guardEvaluator, customActionExecutor);

      await engine.transition('draft', 'active', {
        record: { status: 'draft' },
        operation: 'update',
      });

      expect(executedActions).toEqual(['onExitDraft', 'onEnterActive']);
    });

    it('should execute transition actions', async () => {
      const executedActions: string[] = [];
      const customExecutor = async (action: string) => {
        executedActions.push(action);
      };

      const customActionExecutor = new ActionExecutor(customExecutor);

      const config: StateMachineConfig = {
        initial: 'draft',
        states: {
          draft: {
            on: {
              submit: {
                target: 'active',
                actions: ['notifyApprover'],
              },
            },
          },
          active: {},
        },
      };

      const engine = new StateMachineEngine(config, guardEvaluator, customActionExecutor);

      await engine.transition('draft', 'active', {
        record: { status: 'draft' },
        operation: 'update',
      });

      expect(executedActions).toContain('notifyApprover');
    });
  });

  describe('Compound States', () => {
    it('should resolve compound state to initial child', async () => {
      const config: StateMachineConfig = {
        initial: 'editing',
        states: {
          editing: {
            initial: 'draft',
            states: {
              draft: {},
              review: {},
            },
          },
          published: {},
        },
      };

      const engine = new StateMachineEngine(config, guardEvaluator, actionExecutor);
      expect(engine.getInitialState()).toBe('editing.draft');
    });

    it('should handle transitions in compound states', async () => {
      const config: StateMachineConfig = {
        initial: 'editing',
        states: {
          editing: {
            initial: 'draft',
            states: {
              draft: {
                on: {
                  review: { target: 'editing.review' },
                },
              },
              review: {},
            },
            on: {
              publish: { target: 'published' },
            },
          },
          published: {},
        },
      };

      const engine = new StateMachineEngine(config, guardEvaluator, actionExecutor);

      // Transition within compound state using absolute path
      let result = await engine.transition('editing.draft', 'editing.review', {
        record: { status: 'editing.draft' },
        operation: 'update',
      });

      expect(result.allowed).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should validate well-formed state machine', () => {
      const config: StateMachineConfig = {
        initial: 'draft',
        states: {
          draft: {
            on: {
              submit: { target: 'active' },
            },
          },
          active: {},
        },
      };

      const validation = StateMachineEngine.validate(config);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing initial state', () => {
      const config: StateMachineConfig = {
        initial: 'nonexistent',
        states: {
          draft: {},
        },
      };

      const validation = StateMachineEngine.validate(config);
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('Initial state'))).toBe(true);
    });

    it('should detect empty states', () => {
      const config: StateMachineConfig = {
        initial: 'draft',
        states: {},
      };

      const validation = StateMachineEngine.validate(config);
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('at least one state'))).toBe(true);
    });

    it('should detect compound state without initial', () => {
      const config: StateMachineConfig = {
        initial: 'editing',
        states: {
          editing: {
            // Missing initial!
            states: {
              draft: {},
              review: {},
            },
          },
        },
      };

      const validation = StateMachineEngine.validate(config);
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('Compound state'))).toBe(true);
    });
  });
});
