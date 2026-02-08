/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect } from 'vitest';
import { GuardEvaluator } from '../src/engine/guard-evaluator';
import type { ExecutionContext } from '../src/types';

describe('GuardEvaluator', () => {
  describe('Built-in Guards', () => {
    it('should evaluate role-based guards', async () => {
      const evaluator = new GuardEvaluator();
      
      const context: ExecutionContext = {
        record: {},
        operation: 'update',
        user: {
          id: 'user1',
          roles: ['admin', 'editor'],
        },
      };

      const result1 = await evaluator.evaluate('hasRole:admin', context);
      expect(result1.passed).toBe(true);

      const result2 = await evaluator.evaluate('hasRole:viewer', context);
      expect(result2.passed).toBe(false);
    });

    it('should evaluate permission-based guards', async () => {
      const evaluator = new GuardEvaluator();
      
      const context: ExecutionContext = {
        record: {},
        operation: 'update',
        user: {
          id: 'user1',
          permissions: ['edit:project', 'view:project'],
        },
      };

      const result1 = await evaluator.evaluate('hasPermission:edit:project', context);
      expect(result1.passed).toBe(true);

      const result2 = await evaluator.evaluate('hasPermission:delete:project', context);
      expect(result2.passed).toBe(false);
    });

    it('should evaluate ownership guards', async () => {
      const evaluator = new GuardEvaluator();
      
      const context: ExecutionContext = {
        record: { owner: 'user1' },
        operation: 'update',
        user: { id: 'user1' },
      };

      const result1 = await evaluator.evaluate('isOwner', context);
      expect(result1.passed).toBe(true);

      const context2: ExecutionContext = {
        record: { owner: 'user2' },
        operation: 'update',
        user: { id: 'user1' },
      };

      const result2 = await evaluator.evaluate('isOwner', context2);
      expect(result2.passed).toBe(false);
    });

    it('should evaluate field expression guards', async () => {
      const evaluator = new GuardEvaluator();
      
      const context: ExecutionContext = {
        record: { approved: true, amount: 1000 },
        operation: 'update',
      };

      const result1 = await evaluator.evaluate('field:approved=true', context);
      expect(result1.passed).toBe(true);

      const result2 = await evaluator.evaluate('field:amount>500', context);
      expect(result2.passed).toBe(true);

      const result3 = await evaluator.evaluate('field:amount<500', context);
      expect(result3.passed).toBe(false);
    });
  });

  describe('Condition Objects', () => {
    it('should evaluate simple conditions', async () => {
      const evaluator = new GuardEvaluator();
      
      const context: ExecutionContext = {
        record: { status: 'active', amount: 100 },
        operation: 'update',
      };

      const condition = {
        field: 'status',
        operator: 'equals' as const,
        value: 'active',
      };

      const result = await evaluator.evaluate(condition, context);
      expect(result.passed).toBe(true);
    });

    it('should evaluate numeric comparisons', async () => {
      const evaluator = new GuardEvaluator();
      
      const context: ExecutionContext = {
        record: { amount: 100 },
        operation: 'update',
      };

      const tests = [
        { operator: 'greater_than' as const, value: 50, expected: true },
        { operator: 'greater_than' as const, value: 150, expected: false },
        { operator: 'less_than' as const, value: 150, expected: true },
        { operator: 'less_than' as const, value: 50, expected: false },
        { operator: 'greater_than_or_equal' as const, value: 100, expected: true },
        { operator: 'less_than_or_equal' as const, value: 100, expected: true },
      ];

      for (const test of tests) {
        const condition = {
          field: 'amount',
          operator: test.operator,
          value: test.value,
        };
        const result = await evaluator.evaluate(condition, context);
        expect(result.passed).toBe(test.expected);
      }
    });

    it('should evaluate string operations', async () => {
      const evaluator = new GuardEvaluator();
      
      const context: ExecutionContext = {
        record: { name: 'Hello World' },
        operation: 'update',
      };

      const tests = [
        { operator: 'contains' as const, value: 'Hello', expected: true },
        { operator: 'contains' as const, value: 'Goodbye', expected: false },
        { operator: 'starts_with' as const, value: 'Hello', expected: true },
        { operator: 'ends_with' as const, value: 'World', expected: true },
      ];

      for (const test of tests) {
        const condition = {
          field: 'name',
          operator: test.operator,
          value: test.value,
        };
        const result = await evaluator.evaluate(condition, context);
        expect(result.passed).toBe(test.expected);
      }
    });

    it('should evaluate null checks', async () => {
      const evaluator = new GuardEvaluator();
      
      const context1: ExecutionContext = {
        record: { value: null },
        operation: 'update',
      };

      const condition1 = {
        field: 'value',
        operator: 'is_null' as const,
      };
      const result1 = await evaluator.evaluate(condition1, context1);
      expect(result1.passed).toBe(true);

      const context2: ExecutionContext = {
        record: { value: 'something' },
        operation: 'update',
      };

      const condition2 = {
        field: 'value',
        operator: 'is_not_null' as const,
      };
      const result2 = await evaluator.evaluate(condition2, context2);
      expect(result2.passed).toBe(true);
    });
  });

  describe('AND/OR Logic', () => {
    it('should evaluate AND conditions', async () => {
      const evaluator = new GuardEvaluator();
      
      const context: ExecutionContext = {
        record: { approved: true, amount: 100 },
        operation: 'update',
      };

      const condition = {
        all_of: [
          { field: 'approved', operator: 'equals' as const, value: true },
          { field: 'amount', operator: 'greater_than' as const, value: 50 },
        ],
      };

      const result1 = await evaluator.evaluate(condition, context);
      expect(result1.passed).toBe(true);

      // One condition fails
      const context2: ExecutionContext = {
        record: { approved: false, amount: 100 },
        operation: 'update',
      };

      const result2 = await evaluator.evaluate(condition, context2);
      expect(result2.passed).toBe(false);
    });

    it('should evaluate OR conditions', async () => {
      const evaluator = new GuardEvaluator();
      
      const context: ExecutionContext = {
        record: { type: 'premium', amount: 100 },
        operation: 'update',
      };

      const condition = {
        any_of: [
          { field: 'type', operator: 'equals' as const, value: 'premium' },
          { field: 'amount', operator: 'greater_than' as const, value: 1000 },
        ],
      };

      const result1 = await evaluator.evaluate(condition, context);
      expect(result1.passed).toBe(true);

      // Both conditions fail
      const context2: ExecutionContext = {
        record: { type: 'basic', amount: 50 },
        operation: 'update',
      };

      const result2 = await evaluator.evaluate(condition, context2);
      expect(result2.passed).toBe(false);
    });
  });

  describe('Custom Guard Resolver', () => {
    it('should use custom resolver when provided', async () => {
      const customResolver = async (guardRef: string) => {
        return guardRef === 'customGuard:allowed';
      };

      const evaluator = new GuardEvaluator(customResolver);
      
      const context: ExecutionContext = {
        record: {},
        operation: 'update',
      };

      const result1 = await evaluator.evaluate('customGuard:allowed', context);
      expect(result1.passed).toBe(true);

      const result2 = await evaluator.evaluate('customGuard:denied', context);
      expect(result2.passed).toBe(false);
    });
  });

  describe('Multiple Guards', () => {
    it('should evaluate multiple guards with AND logic', async () => {
      const evaluator = new GuardEvaluator();
      
      const context: ExecutionContext = {
        record: { approved: true, amount: 100 },
        operation: 'update',
        user: { id: 'user1', roles: ['admin'] },
      };

      const guards = [
        'hasRole:admin',
        { field: 'approved', operator: 'equals' as const, value: true },
      ];

      const result1 = await evaluator.evaluateMultiple(guards, context);
      expect(result1.passed).toBe(true);

      // One guard fails
      const context2: ExecutionContext = {
        record: { approved: false, amount: 100 },
        operation: 'update',
        user: { id: 'user1', roles: ['admin'] },
      };

      const result2 = await evaluator.evaluateMultiple(guards, context2);
      expect(result2.passed).toBe(false);
    });
  });

  describe('Nested Values', () => {
    it('should access nested object values', async () => {
      const evaluator = new GuardEvaluator();
      
      const context: ExecutionContext = {
        record: {
          user: {
            profile: {
              level: 'premium',
            },
          },
        },
        operation: 'update',
      };

      const condition = {
        field: 'user.profile.level',
        operator: 'equals' as const,
        value: 'premium',
      };

      const result = await evaluator.evaluate(condition, context);
      expect(result.passed).toBe(true);
    });
  });
});
