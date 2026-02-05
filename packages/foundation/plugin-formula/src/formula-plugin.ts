/**
 * ObjectQL Formula Plugin
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { RuntimePlugin, RuntimeContext, FormulaContext } from '@objectql/types';
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
  private kernel: any;
  
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
  async install(ctx: RuntimeContext | any): Promise<void> {
    // Robust kernel detection:
    // 1. ctx.engine (Legacy ObjectStack)
    // 2. ctx.getKernel() (ObjectStack Factory)
    // 3. ctx is the Kernel itself (Modern Microkernel)
    const kernel = (ctx.engine || (ctx.getKernel && ctx.getKernel()) || ctx) as KernelWithFormulas;
    this.kernel = kernel;
    
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
      this.registerFormulaMiddleware(kernel, ctx);
    }
    
    this.logger.info('Formula plugin installed successfully');
  }

  // --- Adapter for @objectstack/core compatibility ---
  async init(ctx: any): Promise<void> {
    return this.install(ctx);
  }

  async start(ctx: any): Promise<void> {
    // Formula plugin doesn't have onStart logic in legacy
    return Promise.resolve();
  }
  // ---------------------------------------------------
  
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
  private registerFormulaMiddleware(kernel: KernelWithFormulas, ctx: any): void {
      const registerHook = (name: string, handler: any) => {
        if (typeof ctx.hook === 'function') {
            ctx.hook(name, handler);
        } else if (kernel.hooks && typeof kernel.hooks.register === 'function') {
            // Register for all objects using wildcard
            kernel.hooks.register(name, '*', handler);
        }
      };

      registerHook('afterFind', async (context: any) => {
          // context is RetrievalHookContext
          const { objectName, result, user } = context;
          if (!result) return;
          
          // Get schema
          const schemaItem = this.kernel.metadata.get('object', objectName);
          const schema = schemaItem?.content || schemaItem;
          if (!schema || !schema.fields) {
               return;
          }
          
          // Identify formula fields
          const formulaFields: [string, any][] = [];
          for (const [key, field] of Object.entries(schema.fields) as any[]) {
              if (field.type === 'formula' && field.expression) {
                  formulaFields.push([key, field]);
              }
          }
          
          if (formulaFields.length === 0) return;

          const results = Array.isArray(result) ? result : [result];
          const now = new Date();
          const systemInfo = {
                today: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                now: now,
                year: now.getFullYear(),
                month: now.getMonth() + 1,
                day: now.getDate(),
                hour: now.getHours(),
                minute: now.getMinutes(),
                second: now.getSeconds(),
          };

          for (const record of results) {
              if (!record) continue;
              
              const formulaContext: FormulaContext = {
                  record,
                  system: systemInfo,
                  current_user: {
                      id: user?.id || '',
                      name: user?.name,
                      email: user?.email,
                      role: user?.roles?.[0]
                  },
                  is_new: false,
                  record_id: record._id || record.id
              };
              
              for (const [fieldName, fieldConfig] of formulaFields) {
                  const evalResult = this.engine.evaluate(
                      fieldConfig.expression,
                      formulaContext,
                      fieldConfig.data_type || 'text',
                      { strict: true }
                  );
                  
                  if (evalResult.success) {
                      record[fieldName] = evalResult.value;
                  } else {
                      record[fieldName] = null;
                      // Log specific error as seen in repository.ts
                      console.error(
                        '[ObjectQL][FormulaEngine] Formula evaluation failed',
                        {
                            objectName: objectName,
                            fieldName,
                            recordId: formulaContext.record_id,
                            expression: fieldConfig.expression,
                            error: evalResult.error,
                            stack: evalResult.stack,
                        }
                    );
                  }
              }
          }
      });
  }
  
  /**
   * Get the formula engine instance for direct access
   */
  getEngine(): FormulaEngine {
    return this.engine;
  }
}
