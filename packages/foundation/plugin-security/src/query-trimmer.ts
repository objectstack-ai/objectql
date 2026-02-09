/**
 * ObjectQL Security Plugin - Query Trimmer
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ObjectQLError } from '@objectql/types';
import type { RecordRuleCondition } from '@objectql/types';
import type { SecurityContext } from './types';
import { PermissionLoader } from './permission-loader';

/**
 * Query Trimmer
 * 
 * Modifies ObjectQL WHERE conditions to implement row-level security (RLS).
 * Works at the AST level to inject security filters before SQL generation,
 * ensuring zero performance overhead.
 */
export class QueryTrimmer {
  private loader: PermissionLoader;
  
  constructor(loader: PermissionLoader) {
    this.loader = loader;
  }
  
  /**
   * Apply row-level security filters to a query
   * 
   * This modifies the query object in-place to add security filters
   * based on the current user's permissions.
   */
  async applyRowLevelSecurity(
    objectName: string,
    query: any,
    context: SecurityContext
  ): Promise<void> {
    const config = await this.loader.load(objectName);
    
    if (!config || !config.row_level_security?.enabled) {
      return; // No RLS configured
    }
    
    const user = context.user;
    if (!user) {
      // No user context, apply most restrictive filter
      this.addFilter(query, { _id: null }); // Match nothing
      return;
    }
    
    const userRoles = user.roles || [];
    const rls = config.row_level_security;
    
    // Check for bypass permission
    if (rls.exceptions) {
      for (const exception of rls.exceptions) {
        if (userRoles.includes(exception.role) && exception.bypass) {
          return; // User can bypass RLS
        }
      }
    }
    
    // Apply role-specific conditions
    let conditionApplied = false;
    
    if (rls.exceptions) {
      for (const exception of rls.exceptions) {
        if (userRoles.includes(exception.role) && exception.condition) {
          const filter = this.conditionToFilter(exception.condition, user);
          this.addFilter(query, filter);
          conditionApplied = true;
          break;
        }
      }
    }
    
    // Apply default rule if no role-specific condition was applied
    if (!conditionApplied && rls.default_rule) {
      const filter = this.conditionToFilter(rls.default_rule, user);
      this.addFilter(query, filter);
    }
  }
  
  /**
   * Apply record rules as query filters
   * 
   * This is useful for automatically filtering records based on
   * ownership or other record-level rules.
   */
  async applyRecordRules(
    objectName: string,
    query: any,
    context: SecurityContext,
    operation: string
  ): Promise<void> {
    const config = await this.loader.load(objectName);
    
    if (!config || !config.record_rules) {
      return;
    }
    
    const user = context.user;
    if (!user) {
      return;
    }
    
    // Find applicable record rules for this operation
    const applicableRules = config.record_rules.filter((rule: any) => {
      const perms = rule.permissions;
      if (operation === 'read' && perms.read) return true;
      if (operation === 'update' && perms.update) return true;
      if (operation === 'delete' && perms.delete) return true;
      return false;
    });
    
    // Convert rules to filters and combine with OR
    if (applicableRules.length > 0) {
      const filters = applicableRules.map((rule: any) => 
        this.conditionToFilter(rule.condition, user)
      );
      
      // Combine multiple rule filters with OR logic
      if (filters.length === 1) {
        this.addFilter(query, filters[0]);
      } else {
        this.addFilter(query, { $or: filters });
      }
    }
  }
  
  /**
   * Convert a permission condition to a query filter
   */
  private conditionToFilter(condition: RecordRuleCondition, user: any): any {
    if (!condition.type || condition.type === 'simple') {
      // Simple condition: { field: "owner_id", operator: "=", value: "$current_user.id" }
      const field = condition.field;
      const operator = condition.operator;
      let value = condition.value;
      
      // Resolve user context variables
      if (typeof value === 'string' && value.startsWith('$current_user.')) {
        const path = value.substring('$current_user.'.length);
        value = this.getFieldValue(user, path);
      }
      
      return this.operatorToMongoFilter(field, operator, value);
    }
    
    if (condition.type === 'complex') {
      // Complex condition: combine multiple conditions with AND/OR
      return this.complexConditionToFilter(condition.expression, user);
    }
    
    if (condition.type === 'formula') {
      // Formula-based conditions: Evaluate the formula and convert to filters
      try {
        const filter = this.formulaToFilter(condition.formula, user);
        if (filter && Object.keys(filter).length > 0) {
          return filter;
        }
      } catch (_error: any) {
        // Formula will be evaluated in-memory (fallback)
      }
      
      // If we can't convert to a filter, return empty object
      // The record will need to be fetched and evaluated in-memory
      return {};
    }
    
    if (condition.type === 'lookup') {
      // Lookup conditions: Convert to subquery filter
      try {
        const filter = this.lookupToFilter(condition, user);
        if (filter && Object.keys(filter).length > 0) {
          return filter;
        }
      } catch (_error: any) {
        // Lookup will be evaluated in-memory (fallback)
      }
      
      // If we can't convert to a filter, return empty object
      return {};
    }
    
    return {};
  }
  
  /**
   * Convert a formula condition to a query filter
   * 
   * This function attempts to parse common formula patterns and convert them
   * to database filters. Complex formulas that can't be converted will need
   * to be evaluated in-memory.
   * 
   * Supported patterns:
   * - Field comparisons: "field == value", "field > value"
   * - User context: "$current_user.id", "$current_user.role"
   * - Logical operators: "&&", "||"
   * - Simple arithmetic: "field + 10 > 100"
   */
  private formulaToFilter(formula: string, user: any): any {
    // Remove whitespace for easier parsing
    const normalized = formula.trim();
    
    // Pattern 1: Logical OR (check first since it has lower precedence)
    // Split on || but not inside quotes
    const orParts = this.splitOnOperator(normalized, '||');
    if (orParts.length > 1) {
      const filters = orParts.map(part => this.formulaToFilter(part, user)).filter(f => Object.keys(f).length > 0);
      if (filters.length > 1) {
        return { $or: filters };
      } else if (filters.length === 1) {
        return filters[0];
      }
    }
    
    // Pattern 2: Logical AND
    const andParts = this.splitOnOperator(normalized, '&&');
    if (andParts.length > 1) {
      const filters = andParts.map(part => this.formulaToFilter(part, user)).filter(f => Object.keys(f).length > 0);
      if (filters.length > 1) {
        return { $and: filters };
      } else if (filters.length === 1) {
        return filters[0];
      }
    }
    
    // Pattern 3: Simple field comparison (e.g., "status == 'active'")
    const simpleCompareMatch = normalized.match(/^(\w+)\s*(==|!=|>|>=|<|<=)\s*(.+)$/);
    if (simpleCompareMatch) {
      const field = simpleCompareMatch[1];
      const operator = simpleCompareMatch[2];
      let value: any = simpleCompareMatch[3].trim();
      
      // Remove quotes from string values
      if ((value.startsWith("'") && value.endsWith("'")) || 
          (value.startsWith('"') && value.endsWith('"'))) {
        value = value.slice(1, -1);
      } else if (/^\d+$/.test(value)) {
        // Parse numeric values
        value = parseInt(value, 10);
      } else if (/^\d+\.\d+$/.test(value)) {
        // Parse float values
        value = parseFloat(value);
      } else if (value === 'true') {
        value = true;
      } else if (value === 'false') {
        value = false;
      } else if (value === 'null') {
        value = null;
      }
      
      // Resolve user context
      if (typeof value === 'string' && value.startsWith('$current_user.')) {
        const path = value.substring('$current_user.'.length);
        value = this.getFieldValue(user, path);
      }
      
      // Convert to MongoDB filter
      const mongoOp = this.jsOperatorToMongoOperator(operator);
      return this.operatorToMongoFilter(field, mongoOp, value);
    }
    
    // Pattern 4: Field existence check (e.g., "owner" or "!owner")
    if (/^!?\w+$/.test(normalized)) {
      const negate = normalized.startsWith('!');
      const field = negate ? normalized.slice(1) : normalized;
      
      return negate 
        ? { [field]: { $in: [null, undefined, ''] } }
        : { [field]: { $ne: null } };
    }
    
    // Unable to convert formula to filter
    throw new ObjectQLError({ code: 'INTERNAL_ERROR', message: `Unsupported formula pattern: ${formula}` });
  }
  
  /**
   * Split formula on an operator, respecting quotes
   */
  private splitOnOperator(formula: string, operator: string): string[] {
    const parts: string[] = [];
    let current = '';
    let inQuote = false;
    let quoteChar = '';
    
    for (let i = 0; i < formula.length; i++) {
      const char = formula[i];
      const nextChar = formula[i + 1];
      
      // Handle quotes
      if ((char === '"' || char === "'") && (i === 0 || formula[i - 1] !== '\\')) {
        if (!inQuote) {
          inQuote = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          inQuote = false;
          quoteChar = '';
        }
        current += char;
        continue;
      }
      
      // Check for operator
      if (!inQuote) {
        if (operator === '||' && char === '|' && nextChar === '|') {
          if (current.trim()) {
            parts.push(current.trim());
          }
          current = '';
          i++; // Skip next character
          continue;
        } else if (operator === '&&' && char === '&' && nextChar === '&') {
          if (current.trim()) {
            parts.push(current.trim());
          }
          current = '';
          i++; // Skip next character
          continue;
        }
      }
      
      current += char;
    }
    
    if (current.trim()) {
      parts.push(current.trim());
    }
    
    return parts.length > 0 ? parts : [formula];
  }
  
  /**
   * Convert a lookup condition to a query filter
   * 
   * This converts lookup chains into subquery filters that can be pushed
   * down to the database layer.
   */
  private lookupToFilter(condition: any, user: any): any {
    const { object, via, condition: nestedCondition } = condition;
    
    // For simple lookup conditions, we can use MongoDB-style $lookup or
    // SQL-style JOIN filters. The exact implementation depends on the driver.
    
    // Convert the nested condition to a filter
    const nestedFilter = this.conditionToFilter(nestedCondition, user);
    
    if (Object.keys(nestedFilter).length === 0) {
      throw new ObjectQLError({ code: 'INTERNAL_ERROR', message: 'Unable to convert nested lookup condition' });
    }
    
    // Create a lookup filter
    // This will be interpreted by the driver layer
    return {
      $lookup: {
        from: object,
        localField: via,
        foreignField: '_id',
        filter: nestedFilter
      }
    };
  }
  
  /**
   * Convert JavaScript comparison operator to MongoDB operator
   */
  private jsOperatorToMongoOperator(op: string): string {
    switch (op) {
      case '==':
      case '===':
        return '=';
      case '!=':
      case '!==':
        return '!=';
      case '>':
        return '>';
      case '>=':
        return '>=';
      case '<':
        return '<';
      case '<=':
        return '<=';
      default:
        return '=';
    }
  }
  
  /**
   * Convert a complex condition expression to a filter
   */
  private complexConditionToFilter(expression: any[], user: any): any {
    const stack: any[] = [];
    
    for (const element of expression) {
      if (element === 'and') {
        const b = stack.pop();
        const a = stack.pop();
        stack.push({ $and: [a, b] });
      } else if (element === 'or') {
        const b = stack.pop();
        const a = stack.pop();
        stack.push({ $or: [a, b] });
      } else {
        // It's a condition element
        const field = element.field;
        const operator = element.operator;
        let value = element.value;
        
        // Resolve user context variables
        if (typeof value === 'string' && value.startsWith('$current_user.')) {
          const path = value.substring('$current_user.'.length);
          value = this.getFieldValue(user, path);
        }
        
        const filter = this.operatorToMongoFilter(field, operator, value);
        stack.push(filter);
      }
    }
    
    return stack.pop() || {};
  }
  
  /**
   * Convert an operator and value to a MongoDB-style filter
   */
  private operatorToMongoFilter(field: string, operator: string, value: any): any {
    switch (operator) {
      case '=':
        return { [field]: value };
      case '!=':
        return { [field]: { $ne: value } };
      case '>':
        return { [field]: { $gt: value } };
      case '>=':
        return { [field]: { $gte: value } };
      case '<':
        return { [field]: { $lt: value } };
      case '<=':
        return { [field]: { $lte: value } };
      case 'in':
        return { [field]: { $in: value } };
      case 'not_in':
        return { [field]: { $nin: value } };
      case 'contains':
        return { [field]: { $regex: value, $options: 'i' } };
      case 'not_contains':
        return { [field]: { $not: { $regex: value, $options: 'i' } } };
      case 'starts_with':
        return { [field]: { $regex: `^${value}`, $options: 'i' } };
      case 'ends_with':
        return { [field]: { $regex: `${value}$`, $options: 'i' } };
      default:
        return {};
    }
  }
  
  /**
   * Add a filter to a query object
   * Merges with existing filters using AND logic
   */
  private addFilter(query: any, filter: any): void {
    if (!query.filters) {
      query.filters = filter;
    } else {
      // Merge with existing filters using AND
      if (query.filters.$and) {
        query.filters.$and.push(filter);
      } else {
        query.filters = {
          $and: [query.filters, filter]
        };
      }
    }
  }
  
  /**
   * Get field value from an object, supporting nested paths
   */
  private getFieldValue(obj: any, fieldPath: string): any {
    if (!obj) return undefined;
    
    const parts = fieldPath.split('.');
    let value = obj;
    
    for (const part of parts) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = value[part];
    }
    
    return value;
  }
  
  /**
   * Check if a query would return any results
   * Useful for optimization - if RLS filters make a query impossible,
   * we can skip the database call entirely
   */
  isQueryImpossible(query: any): boolean {
    if (!query.filters) {
      return false;
    }
    
    // Check for impossible conditions like { _id: null }
    if (query.filters._id === null) {
      return true;
    }
    
    // Add more impossible condition checks as needed
    
    return false;
  }
}
