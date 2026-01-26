/**
 * ObjectQL Security Plugin - Query Trimmer
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { PermissionConfig, RecordRuleCondition } from '@objectql/types';
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
      // Formula conditions can't be directly converted to filters
      // They need to be evaluated in memory after fetching
      console.warn('Formula conditions cannot be converted to query filters');
      return {};
    }
    
    if (condition.type === 'lookup') {
      // Lookup conditions require join logic
      console.warn('Lookup conditions not yet supported in query trimming');
      return {};
    }
    
    return {};
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
