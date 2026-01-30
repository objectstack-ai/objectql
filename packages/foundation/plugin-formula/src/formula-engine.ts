/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Formula Engine Implementation
 * 
 * Evaluates formula expressions defined in object metadata.
 * Formulas are read-only calculated fields computed at query time.
 * 
 * @see @objectql/types/formula for type definitions
 * @see docs/spec/formula.md for complete specification
 */

import {
  FormulaContext,
  FormulaEvaluationResult,
  FormulaEvaluationOptions,
  FormulaError,
  FormulaErrorType,
  FormulaValue,
  FormulaDataType,
  FormulaMetadata,
  FormulaEngineConfig,
  FormulaCustomFunction,
} from '@objectql/types';

/**
 * Formula Engine for evaluating JavaScript-style expressions
 * 
 * Features:
 * - Field references (e.g., `quantity * unit_price`)
 * - System variables (e.g., `$today`, `$current_user.id`)
 * - Lookup chains (e.g., `account.owner.name`)
 * - Built-in functions (Math, String, Date methods)
 * - Conditional logic (ternary, if/else)
 * - Safe sandbox execution
 */
export class FormulaEngine {
  private config: FormulaEngineConfig;
  private customFunctions: Record<string, FormulaCustomFunction>;

  constructor(config: FormulaEngineConfig = {}) {
    this.config = {
      enable_cache: config.enable_cache ?? false,
      cache_ttl: config.cache_ttl ?? 300,
      max_execution_time: config.max_execution_time ?? 0, // 0 means no timeout enforcement
      enable_monitoring: config.enable_monitoring ?? false,
      custom_functions: config.custom_functions ?? {},
      sandbox: {
        enabled: config.sandbox?.enabled ?? true,
        allowed_globals: config.sandbox?.allowed_globals ?? ['Math', 'String', 'Number', 'Boolean', 'Date', 'Array', 'Object'],
        blocked_operations: config.sandbox?.blocked_operations ?? ['eval', 'Function', 'require', 'import'],
      },
    };
    this.customFunctions = this.config.custom_functions || {};
  }

  /**
   * Evaluate a formula expression
   * 
   * @param expression - The JavaScript expression to evaluate
   * @param context - Runtime context with record data, system variables, user context
   * @param dataType - Expected return data type
   * @param options - Evaluation options
   * @returns Evaluation result with value, type, success flag, and optional error
   */
  evaluate(
    expression: string,
    context: FormulaContext,
    dataType: FormulaDataType,
    options: FormulaEvaluationOptions = {}
  ): FormulaEvaluationResult {
    const startTime = Date.now();
    const timeout = options.timeout ?? this.config.max_execution_time ?? 0;

    try {
      // Validate expression
      if (!expression || expression.trim() === '') {
        throw new FormulaError(
          FormulaErrorType.SYNTAX_ERROR,
          'Formula expression cannot be empty',
          expression
        );
      }

      // Prepare evaluation context
      const evalContext = this.buildEvaluationContext(context);

      // Execute expression with timeout
      const value = this.executeExpression(expression, evalContext, timeout, options);

      // Validate and coerce result type
      const coercedValue = this.coerceValue(value, dataType, expression);

      const executionTime = Date.now() - startTime;

      return {
        value: coercedValue,
        type: dataType,
        success: true,
        execution_time: executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      if (error instanceof FormulaError) {
        return {
          value: null,
          type: dataType,
          success: false,
          error: error.message,
          stack: error.stack,
          execution_time: executionTime,
        };
      }

      // Wrap unknown errors
      return {
        value: null,
        type: dataType,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        execution_time: executionTime,
      };
    }
  }

  /**
   * Build the evaluation context from FormulaContext
   * Creates a safe object with field values, system variables, and user context
   */
  private buildEvaluationContext(context: FormulaContext): Record<string, any> {
    const evalContext: Record<string, any> = {};

    // Add all record fields to context
    for (const [key, value] of Object.entries(context.record)) {
      evalContext[key] = value;
    }

    // Add system variables with $ prefix
    evalContext.$today = context.system.today;
    evalContext.$now = context.system.now;
    evalContext.$year = context.system.year;
    evalContext.$month = context.system.month;
    evalContext.$day = context.system.day;
    evalContext.$hour = context.system.hour;
    evalContext.$minute = context.system.minute;
    evalContext.$second = context.system.second;

    // Add current user context
    evalContext.$current_user = context.current_user;

    // Add record context flags
    evalContext.$is_new = context.is_new;
    evalContext.$record_id = context.record_id;

    // Add custom functions
    for (const [name, func] of Object.entries(this.customFunctions)) {
      evalContext[name] = func;
    }

    return evalContext;
  }

  /**
   * Execute the expression in a sandboxed environment
   * 
   * SECURITY NOTE: Uses Function constructor for dynamic evaluation.
   * While we check for blocked operations, this is not a complete security sandbox.
   * For production use with untrusted formulas, consider using a proper sandboxing library
   * like vm2 or implementing an AST-based evaluator.
   */
  private executeExpression(
    expression: string,
    context: Record<string, any>,
    timeout: number,
    options: FormulaEvaluationOptions
  ): FormulaValue {
    // Check for blocked operations
    // NOTE: This is a basic check using string matching. It will have false positives
    // (e.g., a field named 'evaluation' contains 'eval') and can be bypassed 
    // (e.g., using this['eval'] or globalThis['eval']).
    // For production security with untrusted formulas, use AST parsing or vm2.
    if (this.config.sandbox?.enabled) {
      const blockedOps = this.config.sandbox.blocked_operations || [];
      for (const op of blockedOps) {
        if (expression.includes(op)) {
          throw new FormulaError(
            FormulaErrorType.SECURITY_VIOLATION,
            `Blocked operation detected: ${op}`,
            expression
          );
        }
      }
    }

    try {
      // Create function parameters from context keys
      const paramNames = Object.keys(context);
      const paramValues = Object.values(context);

      // Wrap expression to handle both expression-style and statement-style formulas
      const wrappedExpression = this.wrapExpression(expression);

      // Create and execute function
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const func = new Function(...paramNames, wrappedExpression);
      
      // Execute with timeout protection
      const result = this.executeWithTimeout(func, paramValues, timeout);

      return result as FormulaValue;
    } catch (error) {
      if (error instanceof FormulaError) {
        throw error;
      }

      // Parse JavaScript errors
      const err = error as Error;
      
      if (error instanceof ReferenceError) {
        throw new FormulaError(
          FormulaErrorType.FIELD_NOT_FOUND,
          `Referenced field not found: ${err.message}`,
          expression,
          { original_error: err.message }
        );
      }

      if (error instanceof TypeError) {
        throw new FormulaError(
          FormulaErrorType.TYPE_ERROR,
          `Type error in formula: ${err.message}`,
          expression,
          { original_error: err.message }
        );
      }

      if (error instanceof SyntaxError) {
        throw new FormulaError(
          FormulaErrorType.SYNTAX_ERROR,
          `Syntax error in formula: ${err.message}`,
          expression,
          { original_error: err.message }
        );
      }

      throw new FormulaError(
        FormulaErrorType.RUNTIME_ERROR,
        `Runtime error: ${error instanceof Error ? err.message : String(error)}`,
        expression,
        { original_error: error instanceof Error ? err.message : String(error) }
      );
    }
  }

  /**
   * Wrap expression to handle both expression and statement styles
   */
  private wrapExpression(expression: string): string {
    const trimmed = expression.trim();

    // If it contains a return statement or is a block, use as-is
    if (trimmed.includes('return ') || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
      return trimmed;
    }

    // If it's multi-line with if/else, wrap in a function body
    if (trimmed.includes('\n') || trimmed.match(/if\s*\(/)) {
      return trimmed;
    }

    // Otherwise, treat as expression and return it
    return `return (${trimmed});`;
  }

  /**
   * Execute function with timeout protection
   * 
   * NOTE: This synchronous implementation **cannot** pre-emptively interrupt execution.
   * To avoid giving a false sense of safety, any positive finite timeout configuration
   * is rejected up-front. Callers must not rely on timeout-based protection in this
   * runtime; instead, formulas must be written to be fast and side-effect free.
   */
  private executeWithTimeout(
    func: Function,
    args: any[],
    timeout: number
  ): unknown {
    // Reject any positive finite timeout to avoid misleading "protection" semantics.
    if (Number.isFinite(timeout) && timeout > 0) {
      throw new FormulaError(
        FormulaErrorType.TIMEOUT,
        'Formula timeout enforcement is not supported for synchronous execution. ' +
          'Remove the timeout configuration or migrate to an async/isolated runtime ' +
          'that can safely interrupt long-running formulas.',
        '',
        { requestedTimeoutMs: timeout }
      );
    }

    // No timeout configured (or non-positive/invalid value): execute directly.
    return func(...args);
  }

  /**
   * Coerce the result value to the expected data type
   */
  private coerceValue(value: unknown, dataType: FormulaDataType, expression: string): FormulaValue {
    // Handle null/undefined
    if (value === null || value === undefined) {
      return null;
    }

    try {
      switch (dataType) {
        case 'number':
        case 'currency':
        case 'percent':
          if (typeof value === 'number') {
            // Check for division by zero result
            if (!isFinite(value)) {
              throw new FormulaError(
                FormulaErrorType.DIVISION_BY_ZERO,
                'Formula resulted in Infinity or NaN (possible division by zero)',
                expression
              );
            }
            return value;
          }
          if (typeof value === 'string') {
            const num = Number(value);
            if (isNaN(num)) {
              throw new FormulaError(
                FormulaErrorType.TYPE_ERROR,
                `Cannot convert "${value}" to number`,
                expression
              );
            }
            return num;
          }
          if (typeof value === 'boolean') {
            return value ? 1 : 0;
          }
          throw new FormulaError(
            FormulaErrorType.TYPE_ERROR,
            `Expected number, got ${typeof value}`,
            expression
          );

        case 'text':
          return String(value);

        case 'boolean':
          return Boolean(value);

        case 'date':
        case 'datetime':
          if (value instanceof Date) {
            return value;
          }
          if (typeof value === 'string') {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
              throw new FormulaError(
                FormulaErrorType.TYPE_ERROR,
                `Cannot convert "${value}" to date`,
                expression
              );
            }
            return date;
          }
          if (typeof value === 'number') {
            return new Date(value);
          }
          throw new FormulaError(
            FormulaErrorType.TYPE_ERROR,
            `Expected date, got ${typeof value}`,
            expression
          );

        default:
          return value as FormulaValue;
      }
    } catch (error) {
      if (error instanceof FormulaError) {
        throw error;
      }
      throw new FormulaError(
        FormulaErrorType.TYPE_ERROR,
        `Type coercion failed: ${error instanceof Error ? error.message : String(error)}`,
        expression
      );
    }
  }

  /**
   * Extract metadata from a formula expression
   * Analyzes the expression to determine dependencies and complexity
   */
  extractMetadata(
    fieldName: string,
    expression: string,
    dataType: FormulaDataType
  ): FormulaMetadata {
    const dependencies: string[] = [];
    const lookupChains: string[] = [];
    const systemVariables: string[] = [];
    const validationErrors: string[] = [];

    try {
      // Extract system variables (start with $)
      const systemVarPattern = /\$([a-z_][a-z0-9_]*)/gi;
      const systemMatches = Array.from(expression.matchAll(systemVarPattern));
      for (const match of systemMatches) {
        const sysVar = '$' + match[1];
        if (!systemVariables.includes(sysVar)) {
          systemVariables.push(sysVar);
        }
      }

      // Extract field references (but not system variables or keywords)
      const fieldPattern = /\b([a-z_][a-z0-9_]*)\b/gi;
      const matches = Array.from(expression.matchAll(fieldPattern));
      
      for (const match of matches) {
        const identifier = match[1];
        
        // Skip JavaScript keywords and built-ins
        if (this.isJavaScriptKeyword(identifier)) {
          continue;
        }

        // Field references
        if (!dependencies.includes(identifier)) {
          dependencies.push(identifier);
        }
      }

      // Extract lookup chains (e.g., account.owner.name)
      const lookupPattern = /\b([a-z_][a-z0-9_]*(?:\.[a-z_][a-z0-9_]*)+)\b/gi;
      const lookupMatches = Array.from(expression.matchAll(lookupPattern));
      
      for (const match of lookupMatches) {
        const chain = match[1];
        if (!lookupChains.includes(chain)) {
          lookupChains.push(chain);
        }
      }

      // Basic validation
      if (!expression.trim()) {
        validationErrors.push('Expression cannot be empty');
      }

      // Estimate complexity
      const complexity = this.estimateComplexity(expression);

      return {
        field_name: fieldName,
        expression,
        data_type: dataType,
        dependencies,
        lookup_chains: lookupChains,
        system_variables: systemVariables,
        is_valid: validationErrors.length === 0,
        validation_errors: validationErrors.length > 0 ? validationErrors : undefined,
        complexity,
      };
    } catch (error) {
      return {
        field_name: fieldName,
        expression,
        data_type: dataType,
        dependencies: [],
        lookup_chains: [],
        system_variables: [],
        is_valid: false,
        validation_errors: [
          error instanceof Error ? error.message : String(error),
        ],
        complexity: 'simple',
      };
    }
  }

  /**
   * Check if identifier is a JavaScript keyword or built-in
   */
  private isJavaScriptKeyword(identifier: string): boolean {
    const keywords = new Set([
      'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue',
      'return', 'function', 'var', 'let', 'const', 'true', 'false', 'null',
      'undefined', 'this', 'new', 'typeof', 'instanceof', 'in', 'of',
      'Math', 'String', 'Number', 'Boolean', 'Date', 'Array', 'Object',
      'parseInt', 'parseFloat', 'isNaN', 'isFinite',
    ]);
    return keywords.has(identifier);
  }

  /**
   * Estimate formula complexity based on heuristics
   */
  private estimateComplexity(expression: string): 'simple' | 'medium' | 'complex' {
    const lines = expression.split('\n').length;
    const hasConditionals = /if\s*\(|switch\s*\(|\?/.test(expression);
    const hasLoops = /for\s*\(|while\s*\(/.test(expression);
    const hasLookups = /\.[a-z_][a-z0-9_]*/.test(expression);

    if (lines > 20 || hasLoops) {
      return 'complex';
    }

    if (lines > 5 || hasConditionals || hasLookups) {
      return 'medium';
    }

    return 'simple';
  }

  /**
   * Register a custom function for use in formulas
   */
  registerFunction(name: string, func: FormulaCustomFunction): void {
    this.customFunctions[name] = func;
  }

  /**
   * Validate a formula expression without executing it
   * 
   * SECURITY NOTE: Uses Function constructor for syntax validation.
   * This doesn't execute the code but creates a function object.
   * For stricter validation, consider using a parser library like @babel/parser.
   */
  validate(expression: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!expression || expression.trim() === '') {
      errors.push('Expression cannot be empty');
      return { valid: false, errors };
    }

    // Check for blocked operations
    if (this.config.sandbox?.enabled) {
      const blockedOps = this.config.sandbox.blocked_operations || [];
      for (const op of blockedOps) {
        if (expression.includes(op)) {
          errors.push(`Blocked operation detected: ${op}`);
        }
      }
    }

    // Try to parse as JavaScript (basic syntax check)
    try {
      const wrappedExpression = this.wrapExpression(expression);
      new Function('', wrappedExpression);
    } catch (error) {
      errors.push(`Syntax error: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
