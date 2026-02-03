/**
 * ObjectQL Formula Plugin - Configuration Schema
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { z } from 'zod';

/**
 * Formula Plugin Configuration Schema
 * 
 * Validates the configuration for the ObjectQL Formula Plugin using Zod.
 * This ensures type safety and runtime validation for plugin configuration.
 */
export const FormulaPluginConfigSchema = z.object({
  /**
   * Enable strict mode for formula evaluation
   * When true, formulas are evaluated in strict mode with additional safety checks
   * @default true
   */
  strict: z.boolean().optional().default(true),
  
  /**
   * Maximum execution time for formula evaluation in milliseconds
   * Set to 0 to disable timeout enforcement (required for synchronous execution)
   * Note: Timeout enforcement is not supported for synchronous formula execution
   * @default 0
   */
  timeout: z.number().nonnegative().optional().default(0),
  
  /**
   * Enable automatic formula evaluation on queries
   * When true, formula fields are automatically evaluated after data retrieval
   * @default true
   */
  autoEvaluateOnQuery: z.boolean().optional().default(true),
  
  /**
   * Custom functions available in formula context
   * Map of function names to implementations
   */
  customFunctions: z.record(z.string(), z.function()).optional(),
  
  /**
   * Enable caching of formula evaluation results
   * @default false
   */
  enableCache: z.boolean().optional().default(false),
  
  /**
   * Cache TTL in milliseconds (only used if enableCache is true)
   * @default 60000 (1 minute)
   */
  cacheTTL: z.number().positive().optional().default(60000)
});

export type FormulaPluginConfig = z.infer<typeof FormulaPluginConfigSchema>;
