/**
 * ObjectQL Formula Plugin
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { RuntimePlugin, RuntimeContext } from '@objectql/types';
import type { Logger } from '@objectstack/spec/contracts';
import { createLogger } from '@objectstack/core';
import { FormulaEngine } from './formula-engine';
import { FormulaPluginConfigSchema, FormulaPluginConfig } from './config.schema';

/**
 * Extended kernel with formula engine capability
 */
interface KernelWithFormulas {
    formulaEngine?: FormulaEngine;
    metadata?: any;
    hooks?: any;
}

/**
 * Formula Plugin
 * 
 * Wraps the ObjectQL Formula Engine as a microkernel plugin.
 * Registers formula evaluation capabilities into the kernel.
 */
export class FormulaPlugin implements RuntimePlugin {
  name = '@objectql/plugin-formula';
  version = '4.0.5';
  
  private engine: FormulaEngine;
  private config: FormulaPluginConfig;
  private logger: Logger;
  
  constructor(config: Partial<FormulaPluginConfig> = {}) {
    // Validate and parse configuration using Zod schema
    this.config = FormulaPluginConfigSchema.parse(config);
    
    // Initialize structured logger
    this.logger = createLogger({
      name: this.name,
      level: 'info',
      format: 'pretty'
    });
    
    // Initialize the formula engine with configuration
    this.engine = new FormulaEngine({
      enable_cache: this.config.enableCache,
      cache_ttl: Math.floor(this.config.cacheTTL / 1000), // Convert ms to seconds
      max_execution_time: this.config.timeout
    });
  }
  
  /**
   * Install the plugin into the kernel
   * Registers formula evaluation capabilities
   */
  async install(ctx: RuntimeContext): Promise<void> {
    const kernel = ctx.engine as KernelWithFormulas;
    
    this.logger.info('Installing formula plugin', {
      config: {
        autoEvaluateOnQuery: this.config.autoEvaluateOnQuery,
        strict: this.config.strict,
        timeout: this.config.timeout
      }
    });
    
    // Make formula engine accessible from the kernel for direct usage
    kernel.formulaEngine = this.engine;
    
    // Register formula provider if the kernel supports it
    this.registerFormulaProvider(kernel);
    
    // Register formula evaluation middleware if auto-evaluation is enabled
    if (this.config.autoEvaluateOnQuery !== false) {
      this.registerFormulaMiddleware(kernel);
    }
    
    this.logger.info('Formula plugin installed successfully');
  }
  
  /**
   * Register the formula provider with the kernel
   * @private
   */
  private registerFormulaProvider(kernel: KernelWithFormulas): void {
    // Check if kernel supports formula provider registration
    if (typeof (kernel as any).registerFormulaProvider === 'function') {
      (kernel as any).registerFormulaProvider({
        evaluate: (formula: string, context: any) => {
          // Delegate to the formula engine
          // Note: In a real implementation, we would need to properly construct
          // the FormulaContext from the provided context
          return this.engine.evaluate(
            formula,
            context,
            'text', // default data type
            {}
          );
        },
        validate: (expression: string) => {
          return this.engine.validate(expression);
        },
        extractMetadata: (fieldName: string, expression: string, dataType: any) => {
          return this.engine.extractMetadata(fieldName, expression, dataType);
        }
      });
    }
    // Note: formulaEngine is already registered in install() method above
  }
  
  /**
   * Register formula evaluation middleware
   * @private
   */
  private registerFormulaMiddleware(kernel: KernelWithFormulas): void {
    // Check if kernel supports hook registration
    if (kernel.hooks && typeof kernel.hooks.register === 'function') {
      // Register middleware to evaluate formulas after queries
      kernel.hooks.register('afterQuery', async (context: any) => {
        // Formula evaluation logic would go here
        // This would automatically compute formula fields after data is retrieved
        if (context.results && context.metadata?.fields) {
          // Iterate through fields and evaluate formulas
          // const formulaFields = Object.entries(context.metadata.fields)
          //   .filter(([_, fieldConfig]) => (fieldConfig as any).formula);
          // 
          // for (const record of context.results) {
          //   for (const [fieldName, fieldConfig] of formulaFields) {
          //     const formula = (fieldConfig as any).formula;
          //     const result = this.engine.evaluate(formula, /* context */, /* dataType */);
          //     record[fieldName] = result.value;
          //   }
          // }
        }
      });
    }
  }
  
  /**
   * Get the formula engine instance for direct access
   */
  getEngine(): FormulaEngine {
    return this.engine;
  }
}
