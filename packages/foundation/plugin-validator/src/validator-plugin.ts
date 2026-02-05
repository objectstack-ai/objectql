/**
 * ObjectQL Validator Plugin
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { RuntimePlugin, RuntimeContext, ValidationRuleResult } from '@objectql/types';
import { ValidationError } from '@objectql/types';
import type { ValidationContext } from '@objectql/types';
import type { Logger } from '@objectstack/spec/contracts';
import { createLogger } from '@objectstack/core';
import { Validator, ValidatorOptions } from './validator';
import { ValidatorPluginConfigSchema, ValidatorPluginConfig } from './config.schema';

/**
 * Extended kernel with validator capability
 */
interface KernelWithValidator {
    validator?: Validator;
    metadata?: any;
    hooks?: any;
}

/**
 * Validator Plugin
 * 
 * Wraps the ObjectQL Validator engine as a microkernel plugin.
 * Registers validation middleware hooks into the kernel lifecycle.
 */
export class ValidatorPlugin implements RuntimePlugin {
  name = '@objectql/plugin-validator';
  version = '4.0.5';
  
  private validator: Validator;
  private config: ValidatorPluginConfig;
  private logger: Logger;
  private kernel: any;
  
  constructor(config: Partial<ValidatorPluginConfig> = {}) {
    // Validate and parse configuration using Zod schema
    this.config = ValidatorPluginConfigSchema.parse(config);
    
    // Initialize structured logger
    this.logger = createLogger({
      name: this.name,
      level: 'info',
      format: 'pretty'
    });
    
    // Initialize the validator with language options
    this.validator = new Validator({
      language: this.config.language,
      languageFallback: this.config.languageFallback,
    });
  }
  
  /**
   * Install the plugin into the kernel
   * Registers validation middleware for queries and mutations
   */
  async install(ctx: RuntimeContext | any): Promise<void> {
    const kernel = (ctx.engine || (ctx.getKernel && ctx.getKernel())) as KernelWithValidator;
    this.kernel = kernel; 
    
    this.logger.info('Installing validator plugin', {
      config: {
        enableQueryValidation: this.config.enableQueryValidation,
        enableMutationValidation: this.config.enableMutationValidation,
        language: this.config.language
      }
    });
    
    // Make validator accessible from the kernel for direct usage
    kernel.validator = this.validator;
    
    // Register validation middleware for queries (if enabled)
    if (this.config.enableQueryValidation !== false) {
      this.registerQueryValidation(kernel, ctx);
    }
    
    // Register validation middleware for mutations (if enabled)
    if (this.config.enableMutationValidation !== false) {
      this.registerMutationValidation(kernel, ctx);
    }
    
    this.logger.info('Validator plugin installed successfully');
  }

  // --- Adapter for @objectstack/core compatibility ---
  async init(ctx: any): Promise<void> {
    return this.install(ctx);
  }

  async start(ctx: any): Promise<void> {
    // Validator plugin doesn't have onStart logic in legacy
    return Promise.resolve();
  }
  // ---------------------------------------------------
  
  /**
   * Register query validation middleware
   * @private
   */
  private registerQueryValidation(kernel: KernelWithValidator, ctx: any): void {
      const registerHook = (name: string, handler: any) => {
        if (typeof ctx.hook === 'function') {
            ctx.hook(name, handler);
        } else if (kernel.hooks && typeof kernel.hooks.register === 'function') {
            kernel.hooks.register(name, handler);
        }
      };

    registerHook('beforeQuery', async (context: any) => {
        // Query validation logic
        // In a real implementation, this would validate query parameters
        // For now, this is a placeholder that demonstrates the integration pattern
        if (context.query && context.metadata?.validation_rules) {
          // Validation would happen here
          // const result = await this.validator.validate(
          //   context.metadata.validation_rules,
          //   { /* validation context */ }
          // );
        }
      });
  }
  
  /**
   * Register mutation validation middleware
   * @private
   */
  private registerMutationValidation(kernel: KernelWithValidator, ctx: any): void {
      const registerHook = (name: string, handler: any) => {
        if (typeof ctx.hook === 'function') {
            ctx.hook(name, handler);
        } else if (kernel.hooks && typeof kernel.hooks.register === 'function') {
            kernel.hooks.register(name, handler);
        }
      };

      const handler = async (context: any) => {
          const { objectName, data, previousData, operation, api, user, changedFields } = context;
          
          // Get schema from kernel metadata
          const schemaItem = this.kernel.metadata.get('object', objectName);
          const schema = schemaItem?.content || schemaItem;
          
          if (!schema) return;

          const allResults: ValidationRuleResult[] = [];
          const record = data || {};

          // 1. Validate field-level rules
          if (schema.fields) {
              for (const [fieldName, fieldConfig] of Object.entries(schema.fields) as any[]) {
                  // Skip field validation for updates if the field is not in the update payload
                  if (operation === 'update' && !(fieldName in record)) {
                      continue;
                  }
                  
                  const value = record[fieldName];
                  const fieldResults = await this.validator.validateField(
                      fieldName,
                      fieldConfig,
                      value,
                      {
                          record,
                          previousRecord: previousData,
                          operation,
                          user,
                          api,
                      }
                  );
                  allResults.push(...fieldResults);
              }
          }

          // 2. Validate object-level validation rules
          if (schema.validation?.rules && schema.validation.rules.length > 0) {
              // For updates, merge the update data with previous record
              const mergedRecord = operation === 'update' && previousData
                  ? { ...previousData, ...record }
                  : record;

              // Calculate changed fields if not provided
              let changes = changedFields;
              if (!changes && operation === 'update' && previousData) {
                  changes = Object.keys(record).filter(key => record[key] !== previousData[key]);
              }

              const validationContext: ValidationContext = {
                  record: mergedRecord,
                  previousRecord: previousData,
                  operation,
                  user,
                  api,
                  changedFields: changes,
              };

              const result = await this.validator.validate(schema.validation.rules, validationContext);
              allResults.push(...result.results);
          }

          // 3. Collect errors and throw if any
          const errors = allResults.filter(r => !r.valid && r.severity === 'error');
          if (errors.length > 0) {
              const errorMessage = errors.map(e => e.message).join('; ');
              throw new ValidationError(errorMessage, errors);
          }
      };

      registerHook('beforeCreate', handler);
      registerHook('beforeUpdate', handler);
  }
  
  /**
   * Get the validator instance for direct access

   */
  getValidator(): Validator {
    return this.validator;
  }
}
