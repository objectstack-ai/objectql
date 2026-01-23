/**
 * ObjectQL Formula Plugin
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { RuntimePlugin, RuntimeContext, ObjectStackKernel } from '@objectstack/runtime';
import { FormulaEngine } from './formula-engine';
import type { FormulaEngineConfig } from '@objectql/types';

/**
 * Configuration for the Formula Plugin
 */
export interface FormulaPluginConfig extends FormulaEngineConfig {
  /**
   * Enable automatic formula evaluation on queries
   * @default true
   */
  autoEvaluateOnQuery?: boolean;
}

/**
 * Formula Plugin
 * 
 * Wraps the ObjectQL Formula Engine as an ObjectStack plugin.
 * Registers formula evaluation capabilities into the kernel.
 */
export class FormulaPlugin implements RuntimePlugin {
  name = '@objectql/formulas';
  version = '4.0.0';
  
  private engine: FormulaEngine;
  private config: FormulaPluginConfig;
  
  constructor(config: FormulaPluginConfig = {}) {
    this.config = {
      autoEvaluateOnQuery: true,
      ...config
    };
    
    // Initialize the formula engine with configuration
    this.engine = new FormulaEngine(config);
  }
  
  /**
   * Install the plugin into the kernel
   * Registers formula evaluation capabilities
   */
  async install(ctx: RuntimeContext): Promise<void> {
    const kernel = ctx.engine as ObjectStackKernel;
    
    console.log(`[${this.name}] Installing formula plugin...`);
    
    // Make formula engine accessible from the kernel for direct usage
    (kernel as any).formulaEngine = this.engine;
    
    // Register formula provider if the kernel supports it
    this.registerFormulaProvider(kernel);
    
    // Register formula evaluation middleware if auto-evaluation is enabled
    if (this.config.autoEvaluateOnQuery !== false) {
      this.registerFormulaMiddleware(kernel);
    }
    
    console.log(`[${this.name}] Formula plugin installed`);
  }
  
  /**
   * Register the formula provider with the kernel
   * @private
   */
  private registerFormulaProvider(kernel: ObjectStackKernel): void {
    // Check if kernel supports formula provider registration
    // Note: Using type assertion since registerFormulaProvider may not be in the interface
    const kernelWithFormulas = kernel as any;
    
    if (typeof kernelWithFormulas.registerFormulaProvider === 'function') {
      kernelWithFormulas.registerFormulaProvider({
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
    } else {
      // If the kernel doesn't support formula provider registration yet,
      // we still register the engine for direct access
      kernelWithFormulas.formulaEngine = this.engine;
    }
  }
  
  /**
   * Register formula evaluation middleware
   * @private
   */
  private registerFormulaMiddleware(kernel: ObjectStackKernel): void {
    // Check if kernel supports middleware hooks
    const kernelWithHooks = kernel as any;
    
    if (typeof kernelWithHooks.use === 'function') {
      // Register middleware to evaluate formulas after queries
      kernelWithHooks.use('afterQuery', async (context: any) => {
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
