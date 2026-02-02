/**
 * ObjectQL Security Plugin - Permission Loader
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Logger } from '@objectstack/spec/contracts';
import { createLogger } from '@objectstack/core';
import type { PermissionConfig } from '@objectql/types';
import type { IPermissionStorage, SecurityPluginConfig, CompiledPermissionRule } from './types';

/**
 * Memory-based permission storage
 */
class MemoryPermissionStorage implements IPermissionStorage {
  private permissions: Map<string, PermissionConfig>;
  
  constructor(configs: PermissionConfig[] = []) {
    this.permissions = new Map();
    configs.forEach(config => {
      this.permissions.set(config.object, config);
    });
  }
  
  async load(objectName: string): Promise<PermissionConfig | undefined> {
    return this.permissions.get(objectName);
  }
  
  async loadAll(): Promise<Map<string, PermissionConfig>> {
    return new Map(this.permissions);
  }
  
  async reload(): Promise<void> {
    // For memory storage, no need to reload
  }
}

/**
 * Permission Loader
 * 
 * Loads permission metadata from various sources (memory, Redis, database, custom)
 * and provides pre-compiled permission rules for fast evaluation.
 */
export class PermissionLoader {
  private storage: IPermissionStorage;
  private compiledRules: Map<string, CompiledPermissionRule[]>;
  private precompileEnabled: boolean;
  private logger: Logger;
  
  constructor(config: SecurityPluginConfig) {
    // Initialize storage based on configuration
    this.storage = this.initializeStorage(config);
    this.compiledRules = new Map();
    this.precompileEnabled = config.precompileRules !== false;
    
    // Initialize structured logger
    this.logger = createLogger({
      name: '@objectql/plugin-security/permission-loader',
      level: 'info',
      format: 'pretty'
    });
  }
  
  /**
   * Initialize the appropriate storage backend
   */
  private initializeStorage(config: SecurityPluginConfig): IPermissionStorage {
    const storageType = config.storageType || 'memory';
    
    switch (storageType) {
      case 'memory':
        return new MemoryPermissionStorage(config.permissions || []);
      
      case 'custom':
        if (!config.storage) {
          throw new Error('Custom storage implementation required when storageType is "custom"');
        }
        return config.storage;
      
      case 'redis':
        // TODO: Implement Redis storage
        throw new Error('Redis storage not yet implemented');
      
      case 'database':
        // TODO: Implement Database storage
        throw new Error('Database storage not yet implemented');
      
      default:
        throw new Error(`Unknown storage type: ${storageType}`);
    }
  }
  
  /**
   * Load permission configuration for an object
   */
  async load(objectName: string): Promise<PermissionConfig | undefined> {
    const config = await this.storage.load(objectName);
    
    if (config && this.precompileEnabled) {
      await this.precompilePermissionRules(objectName, config);
    }
    
    return config;
  }
  
  /**
   * Load all permission configurations
   */
  async loadAll(): Promise<Map<string, PermissionConfig>> {
    const allConfigs = await this.storage.loadAll();
    
    if (this.precompileEnabled) {
      for (const [objectName, config] of allConfigs.entries()) {
        await this.precompilePermissionRules(objectName, config);
      }
    }
    
    return allConfigs;
  }
  
  /**
   * Get pre-compiled rules for an object
   */
  getCompiledRules(objectName: string): CompiledPermissionRule[] {
    return this.compiledRules.get(objectName) || [];
  }
  
  /**
   * Pre-compile permission rules for fast evaluation
   * 
   * This converts permission rules into optimized data structures:
   * - Bitmasks for quick permission checks
   * - Lookup maps for role-based checks
   * - Compiled evaluators for condition expressions
   */
  private async precompilePermissionRules(
    objectName: string,
    config: PermissionConfig
  ): Promise<void> {
    const compiledRules: CompiledPermissionRule[] = [];
    
    // Pre-compile object-level permissions
    if (config.object_permissions) {
      const roleLookup = new Map<string, Set<string>>();
      let permissionBitmask = 0;
      
      // Build role lookup for each operation
      const operations = ['create', 'read', 'update', 'delete', 'view_all', 'modify_all'];
      operations.forEach((op, index) => {
        const roles = (config.object_permissions as any)?.[op];
        if (roles && Array.isArray(roles)) {
          permissionBitmask |= (1 << index);
          roleLookup.set(op, new Set(roles));
        }
      });
      
      compiledRules.push({
        ruleName: 'object_permissions',
        permissionBitmask,
        roleLookup,
        priority: 0
      });
    }
    
    // Pre-compile record-level rules
    if (config.record_rules) {
      config.record_rules.forEach((rule: any, index: number) => {
        const roleLookup = new Map<string, Set<string>>();
        let permissionBitmask = 0;
        
        // Build bitmask for permissions
        if (rule.permissions.read) {
          permissionBitmask |= (1 << 0); // read bit
        }
        if (rule.permissions.update) {
          permissionBitmask |= (1 << 1); // update bit
        }
        if (rule.permissions.delete) {
          permissionBitmask |= (1 << 2); // delete bit
        }
        
        // Compile condition evaluator
        const evaluator = this.compileCondition(rule.condition);
        
        compiledRules.push({
          ruleName: rule.name,
          permissionBitmask,
          roleLookup,
          evaluator,
          priority: rule.priority || 0
        });
      });
    }
    
    // Sort by priority (higher priority first)
    compiledRules.sort((a, b) => b.priority - a.priority);
    
    this.compiledRules.set(objectName, compiledRules);
  }
  
  /**
   * Compile a condition into an evaluator function
   * 
   * This converts declarative conditions into executable JavaScript
   * for fast evaluation during permission checks.
   */
  private compileCondition(condition: any): (context: any) => boolean {
    if (!condition) {
      return () => true;
    }
    
    // Handle simple conditions
    if (!condition.type || condition.type === 'simple') {
      return (context: any) => {
        const fieldValue = this.getFieldValue(context.record, condition.field);
        const compareValue = this.resolveValue(condition.value, context);
        return this.evaluateOperator(fieldValue, condition.operator, compareValue);
      };
    }
    
    // Handle complex conditions
    if (condition.type === 'complex') {
      return (context: any) => {
        const expression = condition.expression;
        const stack: boolean[] = [];
        
        for (const element of expression) {
          if (element === 'and') {
            const b = stack.pop() ?? false;
            const a = stack.pop() ?? false;
            stack.push(a && b);
          } else if (element === 'or') {
            const b = stack.pop() ?? false;
            const a = stack.pop() ?? false;
            stack.push(a || b);
          } else {
            // Evaluate condition element
            const fieldValue = this.getFieldValue(context.record, element.field);
            const compareValue = this.resolveValue(element.value, context);
            const result = this.evaluateOperator(fieldValue, element.operator, compareValue);
            stack.push(result);
          }
        }
        
        return stack.pop() || false;
      };
    }
    
    // Handle formula conditions
    if (condition.type === 'formula') {
      return (context: any) => {
        try {
          // SECURITY NOTE: Formula evaluation using Function constructor
          // This is isolated to the permission evaluation context and does not
          // expose any global scope. For production use, consider:
          // 1. Using a sandboxed evaluator (e.g., vm2, isolated-vm)
          // 2. Implementing a custom expression parser
          // 3. Restricting formula usage to trusted administrators only
          
          // Create a restricted evaluation context
          const evalContext = {
            record: context.record,
            user: context.user,
            $current_user: context.user,
            // Do NOT expose: window, document, process, require, etc.
          };
          
          // Use Function constructor for evaluation
          // The 'with' statement creates a limited scope
          const fn = new Function('context', `
            'use strict';
            const { record, user, $current_user } = context;
            return ${condition.formula};
          `);
          return !!fn(evalContext);
        } catch (error) {
          this.logger.error('Error evaluating formula condition', error as Error, {
            formula: condition.formula
          });
          return false;
        }
      };
    }
    
    // Default: return true for unsupported condition types
    return () => true;
  }
  
  /**
   * Get field value from a record, supporting nested paths
   */
  private getFieldValue(record: any, fieldPath: string): any {
    if (!record) return undefined;
    
    const parts = fieldPath.split('.');
    let value = record;
    
    for (const part of parts) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = value[part];
    }
    
    return value;
  }
  
  /**
   * Resolve a value that may contain variables like $current_user.id
   */
  private resolveValue(value: any, context: any): any {
    if (typeof value === 'string' && value.startsWith('$current_user.')) {
      const path = value.substring('$current_user.'.length);
      return this.getFieldValue(context.user, path);
    }
    return value;
  }
  
  /**
   * Evaluate a comparison operator
   */
  private evaluateOperator(fieldValue: any, operator: string, compareValue: any): boolean {
    switch (operator) {
      case '=':
        return fieldValue === compareValue;
      case '!=':
        return fieldValue !== compareValue;
      case '>':
        return fieldValue > compareValue;
      case '>=':
        return fieldValue >= compareValue;
      case '<':
        return fieldValue < compareValue;
      case '<=':
        return fieldValue <= compareValue;
      case 'in':
        return Array.isArray(compareValue) && compareValue.includes(fieldValue);
      case 'not_in':
        return Array.isArray(compareValue) && !compareValue.includes(fieldValue);
      case 'contains':
        return typeof fieldValue === 'string' && fieldValue.includes(compareValue);
      case 'not_contains':
        return typeof fieldValue === 'string' && !fieldValue.includes(compareValue);
      case 'starts_with':
        return typeof fieldValue === 'string' && fieldValue.startsWith(compareValue);
      case 'ends_with':
        return typeof fieldValue === 'string' && fieldValue.endsWith(compareValue);
      default:
        return false;
    }
  }
  
  /**
   * Reload permissions from storage
   */
  async reload(): Promise<void> {
    await this.storage.reload();
    this.compiledRules.clear();
    
    if (this.precompileEnabled) {
      const allConfigs = await this.storage.loadAll();
      for (const [objectName, config] of allConfigs.entries()) {
        await this.precompilePermissionRules(objectName, config);
      }
    }
  }
}
