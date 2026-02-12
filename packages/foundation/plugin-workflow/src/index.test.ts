/**
 * ObjectQL Workflow Plugin
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StateMachineEngine } from './engine/state-machine-engine.js';
import { GuardEvaluator, type GuardResolver } from './engine/guard-evaluator.js';
import { ActionExecutor, type ActionExecutorFn } from './engine/action-executor.js';

// ============================================================================
// Test Fixtures
// ============================================================================

const simpleConfig = {
  initial: 'draft',
  states: {
    draft: {
      on: {
        SUBMIT: 'review',
      },
    },
    review: {
      on: {
        APPROVE: { target: 'approved', cond: 'hasRole:admin' },
        REJECT: 'draft',
      },
    },
    approved: { type: 'final' as const },
  },
};

const compoundConfig = {
  initial: 'active',
  states: {
    active: {
      type: 'compound' as const,
      initial: 'idle',
      states: {
        idle: {
          on: { START: 'running' },
          entry: 'logEntry',
        },
        running: {
          on: { PAUSE: 'idle' },
          exit: 'logExit',
        },
      },
      on: {
        COMPLETE: 'done',
      },
    },
    done: { type: 'final' as const },
  },
};

const actionsConfig = {
  initial: 'open',
  states: {
    open: {
      on: {
        CLOSE: {
          target: 'closed',
          actions: ['setField:status=closed', 'timestamp:closedAt'],
        },
      },
      entry: 'setField:openedAt=$now',
      exit: 'log:leaving-open',
    },
    closed: {
      type: 'final' as const,
      entry: 'increment:closeCount',
    },
  },
};

function makeContext(overrides: Record<string, any> = {}) {
  return {
    record: { id: '1', status: 'draft', owner: 'user-1', createdBy: 'user-1', ...overrides.record },
    previousRecord: overrides.previousRecord,
    operation: overrides.operation || ('update' as const),
    user: { id: 'user-1', roles: ['admin'], permissions: ['approve'], ...overrides.user },
    api: overrides.api,
  };
}

// ============================================================================
// StateMachineEngine Tests
// ============================================================================

describe('StateMachineEngine', () => {
  let guardEvaluator: GuardEvaluator;
  let actionExecutor: ActionExecutor;

  beforeEach(() => {
    guardEvaluator = new GuardEvaluator();
    actionExecutor = new ActionExecutor();
  });

  // --------------------------------------------------------------------------
  // transition()
  // --------------------------------------------------------------------------

  describe('transition()', () => {
    it('should allow a valid transition', async () => {
      const engine = new StateMachineEngine(simpleConfig, guardEvaluator, actionExecutor);
      const ctx = makeContext();

      const result = await engine.transition('draft', 'review', ctx);

      expect(result.allowed).toBe(true);
      expect(result.targetState).toBe('review');
      expect(result.metadata?.transition).toBe('draft -> review');
    });

    it('should fail when current state is not found', async () => {
      const engine = new StateMachineEngine(simpleConfig, guardEvaluator, actionExecutor);
      const ctx = makeContext();

      const result = await engine.transition('nonexistent', 'review', ctx);

      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe('STATE_NOT_FOUND');
      expect(result.error).toContain('nonexistent');
    });

    it('should fail when no transition path exists', async () => {
      const engine = new StateMachineEngine(simpleConfig, guardEvaluator, actionExecutor);
      const ctx = makeContext();

      const result = await engine.transition('draft', 'approved', ctx);

      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe('TRANSITION_NOT_FOUND');
      expect(result.error).toContain('No valid transition');
      expect(result.metadata?.transition).toBe('draft -> approved');
    });

    it('should deny transition when guard fails', async () => {
      // User without admin role
      const noAdminEvaluator = new GuardEvaluator();
      const engine = new StateMachineEngine(simpleConfig, noAdminEvaluator, actionExecutor);
      const ctx = makeContext({ user: { id: 'user-2', roles: ['viewer'], permissions: [] } });

      const result = await engine.transition('review', 'approved', ctx);

      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe('TRANSITION_DENIED');
      expect(result.metadata?.blockedBy).toBe('hasRole:admin');
    });

    it('should allow guarded transition when guard passes', async () => {
      const engine = new StateMachineEngine(simpleConfig, guardEvaluator, actionExecutor);
      const ctx = makeContext(); // user has admin role

      const result = await engine.transition('review', 'approved', ctx);

      expect(result.allowed).toBe(true);
      expect(result.targetState).toBe('approved');
    });

    it('should execute transition actions', async () => {
      const engine = new StateMachineEngine(actionsConfig, guardEvaluator, actionExecutor);
      const ctx = makeContext({ record: { id: '1', status: 'open', closeCount: 0 } });

      const result = await engine.transition('open', 'closed', ctx);

      expect(result.allowed).toBe(true);
      expect(result.actions).toBeDefined();
      expect(result.actions!.length).toBeGreaterThan(0);
      // Actions should have been executed on the record
      expect(ctx.record.status).toBe('closed');
      expect(ctx.record.closedAt).toBeDefined();
    });

    it('should collect and execute entry/exit actions', async () => {
      const executeSpy = vi.fn();
      const spyExecutor = new ActionExecutor(async (action, _ctx) => {
        executeSpy(action);
      });
      const engine = new StateMachineEngine(actionsConfig, guardEvaluator, spyExecutor);
      const ctx = makeContext({ record: { id: '1', status: 'open', closeCount: 0 } });

      await engine.transition('open', 'closed', ctx);

      // exit actions from 'open' + transition actions + entry actions for 'closed'
      const executedActions = executeSpy.mock.calls.map((c: any[]) => c[0]);
      expect(executedActions).toContain('log:leaving-open');
      expect(executedActions).toContain('setField:status=closed');
      expect(executedActions).toContain('increment:closeCount');
    });
  });

  // --------------------------------------------------------------------------
  // getInitialState()
  // --------------------------------------------------------------------------

  describe('getInitialState()', () => {
    it('should return the explicit initial state', () => {
      const engine = new StateMachineEngine(simpleConfig, guardEvaluator, actionExecutor);
      expect(engine.getInitialState()).toBe('draft');
    });

    it('should return the first state when no initial is specified', () => {
      const config = {
        states: {
          alpha: { on: { GO: 'beta' } },
          beta: { type: 'final' as const },
        },
      };
      const engine = new StateMachineEngine(config, guardEvaluator, actionExecutor);
      expect(engine.getInitialState()).toBe('alpha');
    });

    it('should resolve compound state to its initial child', () => {
      const engine = new StateMachineEngine(compoundConfig, guardEvaluator, actionExecutor);
      // 'active' is compound with initial 'idle', so should resolve to 'active.idle'
      expect(engine.getInitialState()).toBe('active.idle');
    });

    it('should return empty string when no states exist', () => {
      const config = { states: {} };
      const engine = new StateMachineEngine(config, guardEvaluator, actionExecutor);
      expect(engine.getInitialState()).toBe('');
    });
  });

  // --------------------------------------------------------------------------
  // isFinalState()
  // --------------------------------------------------------------------------

  describe('isFinalState()', () => {
    it('should return true for a final state', () => {
      const engine = new StateMachineEngine(simpleConfig, guardEvaluator, actionExecutor);
      expect(engine.isFinalState('approved')).toBe(true);
    });

    it('should return false for a non-final state', () => {
      const engine = new StateMachineEngine(simpleConfig, guardEvaluator, actionExecutor);
      expect(engine.isFinalState('draft')).toBe(false);
      expect(engine.isFinalState('review')).toBe(false);
    });

    it('should return false for an unknown state', () => {
      const engine = new StateMachineEngine(simpleConfig, guardEvaluator, actionExecutor);
      expect(engine.isFinalState('nonexistent')).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // getValidTransitions()
  // --------------------------------------------------------------------------

  describe('getValidTransitions()', () => {
    it('should return target states from a state with transitions', () => {
      const engine = new StateMachineEngine(simpleConfig, guardEvaluator, actionExecutor);
      const targets = engine.getValidTransitions('review');
      expect(targets).toContain('approved');
      expect(targets).toContain('draft');
      expect(targets).toHaveLength(2);
    });

    it('should return empty array for a final state', () => {
      const engine = new StateMachineEngine(simpleConfig, guardEvaluator, actionExecutor);
      expect(engine.getValidTransitions('approved')).toEqual([]);
    });

    it('should return empty array for an unknown state', () => {
      const engine = new StateMachineEngine(simpleConfig, guardEvaluator, actionExecutor);
      expect(engine.getValidTransitions('nonexistent')).toEqual([]);
    });

    it('should return targets for states with string transitions', () => {
      const engine = new StateMachineEngine(simpleConfig, guardEvaluator, actionExecutor);
      const targets = engine.getValidTransitions('draft');
      expect(targets).toEqual(['review']);
    });
  });

  // --------------------------------------------------------------------------
  // StateMachineEngine.validate()
  // --------------------------------------------------------------------------

  describe('validate()', () => {
    it('should pass for a valid config', () => {
      const result = StateMachineEngine.validate(simpleConfig);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when states are empty', () => {
      const result = StateMachineEngine.validate({ states: {} });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('State machine must have at least one state');
    });

    it('should fail when states are undefined', () => {
      const result = StateMachineEngine.validate({} as any);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should fail when initial state does not exist', () => {
      const config = {
        initial: 'nonexistent',
        states: {
          draft: { on: { SUBMIT: 'review' } },
          review: { type: 'final' as const },
        },
      };
      const result = StateMachineEngine.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Initial state "nonexistent" not found in states');
    });

    it('should warn when compound state has no initial', () => {
      const config = {
        initial: 'parent',
        states: {
          parent: {
            type: 'compound' as const,
            // Missing initial
            states: {
              child1: { on: {} },
              child2: { type: 'final' as const },
            },
          },
        },
      };
      const result = StateMachineEngine.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('Compound state') && e.includes('initial'))).toBe(true);
    });
  });
});

// ============================================================================
// GuardEvaluator Tests
// ============================================================================

describe('GuardEvaluator', () => {
  let evaluator: GuardEvaluator;

  beforeEach(() => {
    evaluator = new GuardEvaluator();
  });

  // --------------------------------------------------------------------------
  // evaluate() - no guard
  // --------------------------------------------------------------------------

  describe('evaluate() with no guard', () => {
    it('should pass when guard is undefined', async () => {
      const ctx = makeContext();
      const result = await evaluator.evaluate(undefined, ctx);
      expect(result.passed).toBe(true);
      expect(result.guard).toBe('none');
    });
  });

  // --------------------------------------------------------------------------
  // evaluateStringGuard() - built-in guards
  // --------------------------------------------------------------------------

  describe('built-in string guards', () => {
    it('hasRole: should pass when user has the role', async () => {
      const ctx = makeContext({ user: { id: 'u1', roles: ['admin', 'editor'] } });
      const result = await evaluator.evaluate('hasRole:admin', ctx);
      expect(result.passed).toBe(true);
    });

    it('hasRole: should fail when user lacks the role', async () => {
      const ctx = makeContext({ user: { id: 'u1', roles: ['viewer'] } });
      const result = await evaluator.evaluate('hasRole:admin', ctx);
      expect(result.passed).toBe(false);
    });

    it('hasRole: should fail when user has no roles', async () => {
      const ctx = makeContext({ user: { id: 'u1', roles: undefined, permissions: undefined } });
      const result = await evaluator.evaluate('hasRole:admin', ctx);
      expect(result.passed).toBe(false);
    });

    it('hasPermission: should pass when user has the permission', async () => {
      const ctx = makeContext({ user: { id: 'u1', permissions: ['approve', 'edit'] } });
      const result = await evaluator.evaluate('hasPermission:approve', ctx);
      expect(result.passed).toBe(true);
    });

    it('hasPermission: should fail when user lacks the permission', async () => {
      const ctx = makeContext({ user: { id: 'u1', permissions: ['edit'] } });
      const result = await evaluator.evaluate('hasPermission:approve', ctx);
      expect(result.passed).toBe(false);
    });

    it('field: should evaluate equality expression', async () => {
      const ctx = makeContext({ record: { approved: true } });
      const result = await evaluator.evaluate('field:approved=true', ctx);
      expect(result.passed).toBe(true);
    });

    it('field: should evaluate inequality expression', async () => {
      const ctx = makeContext({ record: { status: 'active' } });
      const result = await evaluator.evaluate('field:status!=draft', ctx);
      expect(result.passed).toBe(true);
    });

    it('isOwner should pass when user owns the record', async () => {
      const ctx = makeContext({
        record: { owner: 'user-1' },
        user: { id: 'user-1' },
      });
      const result = await evaluator.evaluate('isOwner', ctx);
      expect(result.passed).toBe(true);
    });

    it('isOwner should fail when user does not own the record', async () => {
      const ctx = makeContext({
        record: { owner: 'user-2' },
        user: { id: 'user-1' },
      });
      const result = await evaluator.evaluate('isOwner', ctx);
      expect(result.passed).toBe(false);
    });

    it('isOwner should pass via ownerId field', async () => {
      const ctx = makeContext({
        record: { ownerId: 'user-1' },
        user: { id: 'user-1' },
      });
      const result = await evaluator.evaluate('isOwner', ctx);
      expect(result.passed).toBe(true);
    });

    it('isCreator should pass when user created the record', async () => {
      const ctx = makeContext({
        record: { createdBy: 'user-1' },
        user: { id: 'user-1' },
      });
      const result = await evaluator.evaluate('isCreator', ctx);
      expect(result.passed).toBe(true);
    });

    it('isCreator should fail when user did not create the record', async () => {
      const ctx = makeContext({
        record: { createdBy: 'user-2' },
        user: { id: 'user-1' },
      });
      const result = await evaluator.evaluate('isCreator', ctx);
      expect(result.passed).toBe(false);
    });

    it('unknown guard should fail by default', async () => {
      const ctx = makeContext();
      const result = await evaluator.evaluate('unknownGuard', ctx);
      expect(result.passed).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Field expression evaluation
  // --------------------------------------------------------------------------

  describe('field expression operators', () => {
    it('should evaluate > operator', async () => {
      const ctx = makeContext({ record: { amount: 1500 } });
      const result = await evaluator.evaluate('field:amount>1000', ctx);
      expect(result.passed).toBe(true);
    });

    it('should evaluate < operator', async () => {
      const ctx = makeContext({ record: { amount: 500 } });
      const result = await evaluator.evaluate('field:amount<1000', ctx);
      expect(result.passed).toBe(true);
    });

    it('should evaluate >= operator', async () => {
      const ctx = makeContext({ record: { amount: 1000 } });
      const result = await evaluator.evaluate('field:amount>=1000', ctx);
      expect(result.passed).toBe(true);
    });

    it('should evaluate <= operator', async () => {
      const ctx = makeContext({ record: { amount: 1000 } });
      const result = await evaluator.evaluate('field:amount<=1000', ctx);
      expect(result.passed).toBe(true);
    });

    it('should evaluate != operator', async () => {
      const ctx = makeContext({ record: { status: 'active' } });
      const result = await evaluator.evaluate('field:status!=closed', ctx);
      expect(result.passed).toBe(true);
    });

    it('should evaluate = with false result', async () => {
      const ctx = makeContext({ record: { status: 'active' } });
      const result = await evaluator.evaluate('field:status=closed', ctx);
      expect(result.passed).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // evaluateCondition() - field/operator/value objects
  // --------------------------------------------------------------------------

  describe('evaluateCondition() with field/operator/value', () => {
    it('should evaluate equals condition', async () => {
      const ctx = makeContext({ record: { status: 'active' } });
      const condition = { field: 'status', operator: 'equals', value: 'active' };
      const result = await evaluator.evaluate(condition as any, ctx);
      expect(result.passed).toBe(true);
    });

    it('should evaluate not_equals condition', async () => {
      const ctx = makeContext({ record: { status: 'active' } });
      const condition = { field: 'status', operator: 'not_equals', value: 'closed' };
      const result = await evaluator.evaluate(condition as any, ctx);
      expect(result.passed).toBe(true);
    });

    it('should evaluate greater_than condition', async () => {
      const ctx = makeContext({ record: { amount: 200 } });
      const condition = { field: 'amount', operator: 'greater_than', value: 100 };
      const result = await evaluator.evaluate(condition as any, ctx);
      expect(result.passed).toBe(true);
    });

    it('should evaluate less_than condition', async () => {
      const ctx = makeContext({ record: { amount: 50 } });
      const condition = { field: 'amount', operator: 'less_than', value: 100 };
      const result = await evaluator.evaluate(condition as any, ctx);
      expect(result.passed).toBe(true);
    });

    it('should evaluate contains condition', async () => {
      const ctx = makeContext({ record: { title: 'Hello World' } });
      const condition = { field: 'title', operator: 'contains', value: 'World' };
      const result = await evaluator.evaluate(condition as any, ctx);
      expect(result.passed).toBe(true);
    });

    it('should evaluate is_null condition', async () => {
      const ctx = makeContext({ record: { deletedAt: null } });
      const condition = { field: 'deletedAt', operator: 'is_null' };
      const result = await evaluator.evaluate(condition as any, ctx);
      expect(result.passed).toBe(true);
    });

    it('should evaluate is_not_null condition', async () => {
      const ctx = makeContext({ record: { title: 'Test' } });
      const condition = { field: 'title', operator: 'is_not_null' };
      const result = await evaluator.evaluate(condition as any, ctx);
      expect(result.passed).toBe(true);
    });

    it('should evaluate in condition', async () => {
      const ctx = makeContext({ record: { status: 'active' } });
      const condition = { field: 'status', operator: 'in', value: ['active', 'pending'] };
      const result = await evaluator.evaluate(condition as any, ctx);
      expect(result.passed).toBe(true);
    });

    it('should evaluate starts_with condition', async () => {
      const ctx = makeContext({ record: { email: 'admin@example.com' } });
      const condition = { field: 'email', operator: 'starts_with', value: 'admin' };
      const result = await evaluator.evaluate(condition as any, ctx);
      expect(result.passed).toBe(true);
    });

    it('should evaluate ends_with condition', async () => {
      const ctx = makeContext({ record: { email: 'admin@example.com' } });
      const condition = { field: 'email', operator: 'ends_with', value: '.com' };
      const result = await evaluator.evaluate(condition as any, ctx);
      expect(result.passed).toBe(true);
    });

    it('should fail condition and include error message', async () => {
      const ctx = makeContext({ record: { status: 'draft' } });
      const condition = { field: 'status', operator: 'equals', value: 'active' };
      const result = await evaluator.evaluate(condition as any, ctx);
      expect(result.passed).toBe(false);
      expect(result.error).toContain('Condition not met');
    });
  });

  // --------------------------------------------------------------------------
  // evaluateCondition() - all_of / any_of
  // --------------------------------------------------------------------------

  describe('evaluateCondition() with all_of / any_of', () => {
    it('all_of should pass when all sub-conditions pass', async () => {
      const ctx = makeContext({ record: { status: 'active', amount: 200 } });
      const condition = {
        all_of: [
          { field: 'status', operator: 'equals', value: 'active' },
          { field: 'amount', operator: 'greater_than', value: 100 },
        ],
      };
      const result = await evaluator.evaluate(condition as any, ctx);
      expect(result.passed).toBe(true);
    });

    it('all_of should fail when any sub-condition fails', async () => {
      const ctx = makeContext({ record: { status: 'draft', amount: 200 } });
      const condition = {
        all_of: [
          { field: 'status', operator: 'equals', value: 'active' },
          { field: 'amount', operator: 'greater_than', value: 100 },
        ],
      };
      const result = await evaluator.evaluate(condition as any, ctx);
      expect(result.passed).toBe(false);
    });

    it('any_of should pass when at least one sub-condition passes', async () => {
      const ctx = makeContext({ record: { status: 'draft', amount: 200 } });
      const condition = {
        any_of: [
          { field: 'status', operator: 'equals', value: 'active' },
          { field: 'amount', operator: 'greater_than', value: 100 },
        ],
      };
      const result = await evaluator.evaluate(condition as any, ctx);
      expect(result.passed).toBe(true);
    });

    it('any_of should fail when no sub-conditions pass', async () => {
      const ctx = makeContext({ record: { status: 'draft', amount: 50 } });
      const condition = {
        any_of: [
          { field: 'status', operator: 'equals', value: 'active' },
          { field: 'amount', operator: 'greater_than', value: 100 },
        ],
      };
      const result = await evaluator.evaluate(condition as any, ctx);
      expect(result.passed).toBe(false);
      expect(result.error).toContain('No OR condition matched');
    });
  });

  // --------------------------------------------------------------------------
  // Custom GuardResolver
  // --------------------------------------------------------------------------

  describe('custom GuardResolver', () => {
    it('should use custom resolver for string guards', async () => {
      const customResolver: GuardResolver = vi.fn().mockResolvedValue(true);
      const customEvaluator = new GuardEvaluator(customResolver);
      const ctx = makeContext();

      const result = await customEvaluator.evaluate('myCustomGuard', ctx);

      expect(result.passed).toBe(true);
      expect(customResolver).toHaveBeenCalledWith('myCustomGuard', ctx);
    });

    it('should return false from custom resolver', async () => {
      const customResolver: GuardResolver = vi.fn().mockResolvedValue(false);
      const customEvaluator = new GuardEvaluator(customResolver);
      const ctx = makeContext();

      const result = await customEvaluator.evaluate('myCustomGuard', ctx);

      expect(result.passed).toBe(false);
    });

    it('should handle custom resolver errors gracefully', async () => {
      const customResolver: GuardResolver = vi.fn().mockRejectedValue(new Error('Guard error'));
      const customEvaluator = new GuardEvaluator(customResolver);
      const ctx = makeContext();

      const result = await customEvaluator.evaluate('failingGuard', ctx);

      expect(result.passed).toBe(false);
      expect(result.error).toBe('Guard error');
    });
  });

  // --------------------------------------------------------------------------
  // evaluateMultiple() - AND logic
  // --------------------------------------------------------------------------

  describe('evaluateMultiple()', () => {
    it('should pass when all guards pass', async () => {
      const ctx = makeContext({
        record: { owner: 'user-1', status: 'active' },
        user: { id: 'user-1', roles: ['admin'] },
      });

      const result = await evaluator.evaluateMultiple(
        ['hasRole:admin', 'isOwner'],
        ctx,
      );

      expect(result.passed).toBe(true);
      expect(result.guard).toBe('all');
    });

    it('should fail on the first failing guard', async () => {
      const ctx = makeContext({
        record: { owner: 'user-2' },
        user: { id: 'user-1', roles: ['viewer'] },
      });

      const result = await evaluator.evaluateMultiple(
        ['hasRole:admin', 'isOwner'],
        ctx,
      );

      expect(result.passed).toBe(false);
      expect(result.guard).toBe('hasRole:admin');
    });

    it('should pass when guards array is empty', async () => {
      const ctx = makeContext();
      const result = await evaluator.evaluateMultiple([], ctx);
      expect(result.passed).toBe(true);
      expect(result.guard).toBe('none');
    });

    it('should pass when guards is undefined', async () => {
      const ctx = makeContext();
      const result = await evaluator.evaluateMultiple(undefined, ctx);
      expect(result.passed).toBe(true);
    });
  });
});

// ============================================================================
// ActionExecutor Tests
// ============================================================================

describe('ActionExecutor', () => {
  let executor: ActionExecutor;

  beforeEach(() => {
    executor = new ActionExecutor();
  });

  // --------------------------------------------------------------------------
  // Built-in actions
  // --------------------------------------------------------------------------

  describe('built-in actions', () => {
    it('setField: should set a field value', async () => {
      const ctx = makeContext({ record: { status: 'draft' } });
      const result = await executor.execute('setField:status=approved', ctx);

      expect(result.success).toBe(true);
      expect(ctx.record.status).toBe('approved');
    });

    it('setField: should parse boolean values', async () => {
      const ctx = makeContext({ record: { active: false } });
      await executor.execute('setField:active=true', ctx);
      expect(ctx.record.active).toBe(true);
    });

    it('setField: should parse numeric values', async () => {
      const ctx = makeContext({ record: { priority: 0 } });
      await executor.execute('setField:priority=5', ctx);
      expect(ctx.record.priority).toBe(5);
    });

    it('setField: should parse null values', async () => {
      const ctx = makeContext({ record: { assignee: 'someone' } });
      await executor.execute('setField:assignee=null', ctx);
      expect(ctx.record.assignee).toBeNull();
    });

    it('increment: should increment a numeric field', async () => {
      const ctx = makeContext({ record: { counter: 5 } });
      const result = await executor.execute('increment:counter', ctx);

      expect(result.success).toBe(true);
      expect(ctx.record.counter).toBe(6);
    });

    it('increment: should default to 0 when field is missing', async () => {
      const ctx = makeContext({ record: {} });
      await executor.execute('increment:counter', ctx);
      expect(ctx.record.counter).toBe(1);
    });

    it('decrement: should decrement a numeric field', async () => {
      const ctx = makeContext({ record: { counter: 5 } });
      const result = await executor.execute('decrement:counter', ctx);

      expect(result.success).toBe(true);
      expect(ctx.record.counter).toBe(4);
    });

    it('decrement: should default to 0 when field is missing', async () => {
      const ctx = makeContext({ record: {} });
      await executor.execute('decrement:counter', ctx);
      expect(ctx.record.counter).toBe(-1);
    });

    it('clearField: should set field to null', async () => {
      const ctx = makeContext({ record: { status: 'active' } });
      const result = await executor.execute('clearField:status', ctx);

      expect(result.success).toBe(true);
      expect(ctx.record.status).toBeNull();
    });

    it('timestamp: should set field to ISO timestamp', async () => {
      const ctx = makeContext({ record: {} });
      const before = new Date().toISOString();
      const result = await executor.execute('timestamp:updated_at', ctx);
      const after = new Date().toISOString();

      expect(result.success).toBe(true);
      expect(ctx.record.updated_at).toBeDefined();
      expect(ctx.record.updated_at >= before).toBe(true);
      expect(ctx.record.updated_at <= after).toBe(true);
    });

    it('log: should succeed silently', async () => {
      const ctx = makeContext();
      const result = await executor.execute('log:transition-complete', ctx);
      expect(result.success).toBe(true);
    });

    it('unknown action should succeed as no-op', async () => {
      const ctx = makeContext();
      const result = await executor.execute('unknownAction', ctx);
      expect(result.success).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Variable substitution
  // --------------------------------------------------------------------------

  describe('variable substitution', () => {
    it('$now should resolve to ISO timestamp', async () => {
      const ctx = makeContext({ record: {} });
      const before = new Date().toISOString();
      await executor.execute('setField:updatedAt=$now', ctx);
      const after = new Date().toISOString();

      expect(ctx.record.updatedAt).toBeDefined();
      expect(ctx.record.updatedAt >= before).toBe(true);
      expect(ctx.record.updatedAt <= after).toBe(true);
    });

    it('$record.fieldName should resolve to record field value', async () => {
      const ctx = makeContext({ record: { name: 'Alice', displayName: '' } });
      await executor.execute('setField:displayName=$record.name', ctx);
      expect(ctx.record.displayName).toBe('Alice');
    });

    it('unresolvable variable should keep as-is', async () => {
      const ctx = makeContext({ record: {} });
      await executor.execute('setField:ref=$unknown.path', ctx);
      expect(ctx.record.ref).toBe('$unknown.path');
    });
  });

  // --------------------------------------------------------------------------
  // executeMultiple()
  // --------------------------------------------------------------------------

  describe('executeMultiple()', () => {
    it('should execute actions sequentially', async () => {
      const ctx = makeContext({ record: { counter: 0 } });
      const results = await executor.executeMultiple(
        ['increment:counter', 'increment:counter', 'increment:counter'],
        ctx,
      );

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(ctx.record.counter).toBe(3);
    });

    it('should stop on failure', async () => {
      const failingExecutor = new ActionExecutor(async (action) => {
        if (action === 'failAction') {
          throw new Error('Action failed');
        }
      });

      const ctx = makeContext({ record: {} });
      const results = await failingExecutor.executeMultiple(
        ['successAction', 'failAction', 'neverReached'],
        ctx,
      );

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBe('Action failed');
    });

    it('should return empty array for undefined actions', async () => {
      const ctx = makeContext();
      const results = await executor.executeMultiple(undefined, ctx);
      expect(results).toEqual([]);
    });

    it('should return empty array for empty actions', async () => {
      const ctx = makeContext();
      const results = await executor.executeMultiple([], ctx);
      expect(results).toEqual([]);
    });
  });

  // --------------------------------------------------------------------------
  // Custom ActionExecutorFn
  // --------------------------------------------------------------------------

  describe('custom ActionExecutorFn', () => {
    it('should delegate to custom executor', async () => {
      const customFn: ActionExecutorFn = vi.fn().mockResolvedValue(undefined);
      const customExecutor = new ActionExecutor(customFn);
      const ctx = makeContext();

      const result = await customExecutor.execute('myCustomAction', ctx);

      expect(result.success).toBe(true);
      expect(customFn).toHaveBeenCalledWith('myCustomAction', ctx);
    });

    it('should capture custom executor errors', async () => {
      const customFn: ActionExecutorFn = vi.fn().mockRejectedValue(new Error('Custom error'));
      const customExecutor = new ActionExecutor(customFn);
      const ctx = makeContext();

      const result = await customExecutor.execute('failingAction', ctx);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Custom error');
    });
  });

  // --------------------------------------------------------------------------
  // Execution log
  // --------------------------------------------------------------------------

  describe('execution log', () => {
    it('getExecutionLog() should return all executed actions', async () => {
      const ctx = makeContext({ record: { counter: 0 } });
      await executor.execute('increment:counter', ctx);
      await executor.execute('increment:counter', ctx);

      const log = executor.getExecutionLog();
      expect(log).toHaveLength(2);
      expect(log[0].action).toBe('increment:counter');
      expect(log[0].success).toBe(true);
    });

    it('getExecutionLog() should return a copy', async () => {
      const ctx = makeContext({ record: { counter: 0 } });
      await executor.execute('increment:counter', ctx);

      const log1 = executor.getExecutionLog();
      const log2 = executor.getExecutionLog();
      expect(log1).not.toBe(log2);
      expect(log1).toEqual(log2);
    });

    it('clearExecutionLog() should reset the log', async () => {
      const ctx = makeContext({ record: { counter: 0 } });
      await executor.execute('increment:counter', ctx);
      expect(executor.getExecutionLog()).toHaveLength(1);

      executor.clearExecutionLog();
      expect(executor.getExecutionLog()).toHaveLength(0);
    });

    it('should log failed actions', async () => {
      const failingExecutor = new ActionExecutor(async () => {
        throw new Error('Boom');
      });
      const ctx = makeContext();

      await failingExecutor.execute('badAction', ctx);
      const log = failingExecutor.getExecutionLog();

      expect(log).toHaveLength(1);
      expect(log[0].success).toBe(false);
      expect(log[0].error).toBe('Boom');
    });
  });
});
