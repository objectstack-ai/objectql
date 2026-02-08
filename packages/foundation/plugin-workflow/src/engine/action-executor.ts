/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Action Executor
 * 
 * Executes entry/exit/transition actions for state machine operations.
 * Actions are side effects that occur during state transitions.
 */

import type { ExecutionContext, ActionResult } from '../types';

/**
 * Type for custom action executor function
 */
export type ActionExecutorFn = (actionRef: string, context: ExecutionContext) => Promise<void>;

/**
 * Action Executor class
 */
export class ActionExecutor {
  private customExecutor?: ActionExecutorFn;
  private executionLog: ActionResult[] = [];

  constructor(customExecutor?: ActionExecutorFn) {
    this.customExecutor = customExecutor;
  }

  /**
   * Execute a single action
   */
  async execute(
    action: string,
    context: ExecutionContext
  ): Promise<ActionResult> {
    try {
      // Use custom executor if provided
      if (this.customExecutor) {
        await this.customExecutor(action, context);
        const result = { success: true, action };
        this.executionLog.push(result);
        return result;
      }

      // Built-in action execution
      await this.executeBuiltInAction(action, context);
      const result = { success: true, action };
      this.executionLog.push(result);
      return result;
    } catch (error) {
      const result = {
        success: false,
        action,
        error: error instanceof Error ? error.message : 'Action execution failed',
      };
      this.executionLog.push(result);
      return result;
    }
  }

  /**
   * Execute multiple actions in sequence
   */
  async executeMultiple(
    actions: string[] | undefined,
    context: ExecutionContext
  ): Promise<ActionResult[]> {
    if (!actions || actions.length === 0) {
      return [];
    }

    const results: ActionResult[] = [];
    
    for (const action of actions) {
      const result = await this.execute(action, context);
      results.push(result);
      
      // Stop execution if an action fails
      if (!result.success) {
        break;
      }
    }

    return results;
  }

  /**
   * Get execution log
   */
  getExecutionLog(): ActionResult[] {
    return [...this.executionLog];
  }

  /**
   * Clear execution log
   */
  clearExecutionLog(): void {
    this.executionLog = [];
  }

  /**
   * Execute built-in actions
   */
  private async executeBuiltInAction(
    action: string,
    context: ExecutionContext
  ): Promise<void> {
    const { record } = context;

    // Field update actions: "setField:fieldName=value"
    if (action.startsWith('setField:')) {
      const fieldExpr = action.substring(9);
      this.executeFieldUpdate(fieldExpr, record);
      return;
    }

    // Increment action: "increment:fieldName"
    if (action.startsWith('increment:')) {
      const fieldName = action.substring(10);
      const currentValue = record[fieldName] || 0;
      record[fieldName] = currentValue + 1;
      return;
    }

    // Decrement action: "decrement:fieldName"
    if (action.startsWith('decrement:')) {
      const fieldName = action.substring(10);
      const currentValue = record[fieldName] || 0;
      record[fieldName] = currentValue - 1;
      return;
    }

    // Clear field action: "clearField:fieldName"
    if (action.startsWith('clearField:')) {
      const fieldName = action.substring(11);
      record[fieldName] = null;
      return;
    }

    // Timestamp action: "timestamp:fieldName"
    if (action.startsWith('timestamp:')) {
      const fieldName = action.substring(10);
      record[fieldName] = new Date().toISOString();
      return;
    }

    // Log action: "log:message"
    if (action.startsWith('log:')) {
      const message = action.substring(4);
      console.log(`[WorkflowAction] ${message}`, { record });
      return;
    }

    // No-op for unknown actions (allows declarative action references)
    // Custom executor should handle these
  }

  /**
   * Execute a field update expression
   * Example: "status=approved", "approvedBy=$user.id"
   */
  private executeFieldUpdate(expr: string, record: Record<string, any>): void {
    const equalIndex = expr.indexOf('=');
    if (equalIndex === -1) {
      throw new Error(`Invalid field update expression: ${expr}`);
    }

    const fieldName = expr.substring(0, equalIndex).trim();
    const valueExpr = expr.substring(equalIndex + 1).trim();

    // Parse value
    let value: any;

    // Variable substitution: $user.id, $record.owner, etc.
    if (valueExpr.startsWith('$')) {
      value = this.resolveVariable(valueExpr, record);
    } else {
      value = this.parseValue(valueExpr);
    }

    // Set field value
    record[fieldName] = value;
  }

  /**
   * Resolve a variable reference
   */
  private resolveVariable(varRef: string, record: Record<string, any>): any {
    // Remove $ prefix
    const path = varRef.substring(1);

    // Handle special variables
    if (path === 'now' || path === 'timestamp') {
      return new Date().toISOString();
    }

    if (path.startsWith('record.')) {
      const fieldPath = path.substring(7);
      return this.getNestedValue(record, fieldPath);
    }

    // Return as-is if not resolvable
    return varRef;
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
