/**
 * ObjectQL Validator Plugin
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { RuntimePlugin, RuntimeContext } from '@objectql/types';
import { Validator, ValidatorOptions } from './validator';

/**
 * Extended kernel with validator capability
 */
interface KernelWithValidator {
    validator?: Validator;
    metadata?: any;
    hooks?: any;
}

/**
 * Configuration for the Validator Plugin
 */
export interface ValidatorPluginConfig extends ValidatorOptions {
  /**
   * Enable validation on queries
   * @default true
   */
  enableQueryValidation?: boolean;
  
  /**
   * Enable validation on mutations
   * @default true
   */
  enableMutationValidation?: boolean;
}

/**
 * Validator Plugin
 * 
 * Wraps the ObjectQL Validator engine as a microkernel plugin.
 * Registers validation middleware hooks into the kernel lifecycle.
 */
export class ValidatorPlugin implements RuntimePlugin {
  name = '@objectql/plugin-validator';
  version = '4.0.2';
  
  private validator: Validator;
  private config: ValidatorPluginConfig;
  
  constructor(config: ValidatorPluginConfig = {}) {
    this.config = {
      enableQueryValidation: true,
      enableMutationValidation: true,
      ...config
    };
    
    // Initialize the validator with language options
    this.validator = new Validator({
      language: config.language,
      languageFallback: config.languageFallback,
    });
  }
  
  /**
   * Install the plugin into the kernel
   * Registers validation middleware for queries and mutations
   */
  async install(ctx: RuntimeContext | any): Promise<void> {
    const kernel = (ctx.engine || (ctx.getKernel && ctx.getKernel())) as KernelWithValidator;
    
    console.log(`[${this.name}] Installing validator plugin...`);
    
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
    
    console.log(`[${this.name}] Validator plugin installed`);
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

    registerHook('beforeMutation', async (context: any) => {
        // Mutation validation logic
        // This would validate data before create/update operations
        if (context.data && context.metadata?.validation_rules) {
          // Validation would happen here
          // const result = await this.validator.validate(
          //   context.metadata.validation_rules,
          //   { /* validation context */ }
          // );
          // if (!result.valid) {
          //   throw new Error('Validation failed: ' + result.errors.map(e => e.message).join(', '));
          // }
        }
      });
  }
  
  /**
   * Get the validator instance for direct access
   */
  getValidator(): Validator {
    return this.validator;
  }
}
