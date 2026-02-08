/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Guard Evaluator
 * 
 * Evaluates guard conditions (`cond`) against record data and context.
 * Guards determine whether a state transition is allowed.
 */

import type { ExecutionContext, GuardResult } from '../types';
import type { ValidationCondition } from '@objectql/types';

/**
 * Type for custom guard resolver function
 */
export type GuardResolver = (guardRef: string, context: ExecutionContext) => Promise<boolean>;

/**
 * Guard Evaluator class
 */
export class GuardEvaluator {
  private customResolver?: GuardResolver;

  constructor(customResolver?: GuardResolver) {
    this.customResolver = customResolver;
  }

  /**
   * Evaluate a guard condition
   */
  async evaluate(
    guard: string | ValidationCondition | undefined,
    context: ExecutionContext
  ): Promise<GuardResult> {
    // No guard means always pass
    if (!guard) {
      return { passed: true, guard: 'none' };
    }

    // String guard reference - use custom resolver or default
    if (typeof guard === 'string') {
      return this.evaluateStringGuard(guard, context);
    }

    // Object guard condition - evaluate inline
    return this.evaluateCondition(guard, context);
  }

  /**
   * Evaluate multiple guards (AND logic)
   */
  async evaluateMultiple(
    guards: (string | ValidationCondition)[] | undefined,
    context: ExecutionContext
  ): Promise<GuardResult> {
    if (!guards || guards.length === 0) {
      return { passed: true, guard: 'none' };
    }

    for (const guard of guards) {
      const result = await this.evaluate(guard, context);
      if (!result.passed) {
        return result;
      }
    }

    return { passed: true, guard: 'all' };
  }

  /**
   * Evaluate a string guard reference
   */
  private async evaluateStringGuard(
    guardRef: string,
    context: ExecutionContext
  ): Promise<GuardResult> {
    try {
      // Use custom resolver if provided
      if (this.customResolver) {
        const passed = await this.customResolver(guardRef, context);
        return { passed, guard: guardRef };
      }

      // Built-in guard patterns
      const passed = await this.evaluateBuiltInGuard(guardRef, context);
      return { passed, guard: guardRef };
    } catch (error) {
      return {
        passed: false,
        guard: guardRef,
        error: error instanceof Error ? error.message : 'Guard evaluation failed',
      };
    }
  }

  /**
   * Evaluate built-in guard patterns
   */
  private async evaluateBuiltInGuard(
    guardRef: string,
    context: ExecutionContext
  ): Promise<boolean> {
    const { record, user } = context;

    // Permission-based guards
    if (guardRef.startsWith('hasRole:')) {
      const role = guardRef.substring(8);
      return user?.roles?.includes(role) ?? false;
    }

    if (guardRef.startsWith('hasPermission:')) {
      const permission = guardRef.substring(14);
      return user?.permissions?.includes(permission) ?? false;
    }

    // Field-based guards
    if (guardRef.startsWith('field:')) {
      const fieldExpr = guardRef.substring(6);
      return this.evaluateFieldExpression(fieldExpr, record);
    }

    // User-based guards
    if (guardRef === 'isOwner') {
      return record.owner === user?.id || record.ownerId === user?.id;
    }

    if (guardRef === 'isCreator') {
      return record.createdBy === user?.id;
    }

    // Default: unknown guard fails
    return false;
  }

  /**
   * Evaluate a field expression
   * Examples: "approved=true", "amount>1000", "status!=draft"
   */
  private evaluateFieldExpression(expr: string, record: Record<string, any>): boolean {
    // Parse simple expressions
    const operators = ['>=', '<=', '!=', '=', '>', '<'];
    
    for (const op of operators) {
      const parts = expr.split(op);
      if (parts.length === 2) {
        const [field, valueStr] = parts.map(s => s.trim());
        const fieldValue = this.getNestedValue(record, field);
        const expectedValue = this.parseValue(valueStr);
        
        return this.compareValues(fieldValue, op, expectedValue);
      }
    }

    // If no operator, check if field is truthy
    const value = this.getNestedValue(record, expr);
    return !!value;
  }

  /**
   * Evaluate a condition object
   */
  private async evaluateCondition(
    condition: ValidationCondition,
    context: ExecutionContext
  ): Promise<GuardResult> {
    const { record } = context;

    try {
      // Handle AND/OR logic
      if ('all_of' in condition && condition.all_of) {
        for (const subCondition of condition.all_of) {
          const result = await this.evaluateCondition(subCondition, context);
          if (!result.passed) {
            return result;
          }
        }
        return { passed: true, guard: 'all_of' };
      }

      if ('any_of' in condition && condition.any_of) {
        for (const subCondition of condition.any_of) {
          const result = await this.evaluateCondition(subCondition, context);
          if (result.passed) {
            return result;
          }
        }
        return { passed: false, guard: 'any_of', error: 'No OR condition matched' };
      }

      // Handle field-based conditions
      if ('field' in condition && condition.field && 'operator' in condition) {
        const fieldValue = this.getNestedValue(record, condition.field);
        const passed = this.evaluateOperator(
          fieldValue,
          condition.operator!,
          condition.value,
          condition.compare_to ? this.getNestedValue(record, condition.compare_to) : undefined
        );

        return {
          passed,
          guard: `${condition.field} ${condition.operator} ${condition.value}`,
          error: passed ? undefined : `Condition not met: ${condition.field} ${condition.operator} ${condition.value}`,
        };
      }

      // Default: no valid condition structure
      return { passed: true, guard: 'unknown' };
    } catch (error) {
      return {
        passed: false,
        guard: 'condition',
        error: error instanceof Error ? error.message : 'Condition evaluation failed',
      };
    }
  }

  /**
   * Evaluate an operator
   */
  private evaluateOperator(
    fieldValue: any,
    operator: string,
    value?: any,
    compareTo?: any
  ): boolean {
    const compareValue = compareTo !== undefined ? compareTo : value;

    switch (operator) {
      case 'equals':
      case 'eq':
        return fieldValue === compareValue;
      case 'not_equals':
      case 'ne':
        return fieldValue !== compareValue;
      case 'greater_than':
      case 'gt':
        return fieldValue > compareValue;
      case 'greater_than_or_equal':
      case 'gte':
        return fieldValue >= compareValue;
      case 'less_than':
      case 'lt':
        return fieldValue < compareValue;
      case 'less_than_or_equal':
      case 'lte':
        return fieldValue <= compareValue;
      case 'contains':
        return String(fieldValue).includes(String(compareValue));
      case 'not_contains':
        return !String(fieldValue).includes(String(compareValue));
      case 'in':
        return Array.isArray(compareValue) && compareValue.includes(fieldValue);
      case 'not_in':
        return Array.isArray(compareValue) && !compareValue.includes(fieldValue);
      case 'is_null':
        return fieldValue === null || fieldValue === undefined;
      case 'is_not_null':
        return fieldValue !== null && fieldValue !== undefined;
      case 'starts_with':
        return String(fieldValue).startsWith(String(compareValue));
      case 'ends_with':
        return String(fieldValue).endsWith(String(compareValue));
      default:
        return false;
    }
  }

  /**
   * Compare values using operator string
   */
  private compareValues(value1: any, operator: string, value2: any): boolean {
    switch (operator) {
      case '=':
        return value1 == value2;
      case '!=':
        return value1 != value2;
      case '>':
        return value1 > value2;
      case '<':
        return value1 < value2;
      case '>=':
        return value1 >= value2;
      case '<=':
        return value1 <= value2;
      default:
        return false;
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: Record<string, any>, path: string): any {
    const keys = path.split('.');
    let value = obj;
    
    for (const key of keys) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = value[key];
    }
    
    return value;
  }

  /**
   * Parse a string value to appropriate type
   */
  private parseValue(valueStr: string): any {
    const trimmed = valueStr.trim();
    
    // Boolean
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    
    // Null
    if (trimmed === 'null') return null;
    
    // Number
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return parseFloat(trimmed);
    }
    
    // String (remove quotes if present)
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return trimmed.slice(1, -1);
    }
    
    return trimmed;
  }
}
