/**
 * ObjectQL Validator Plugin - Configuration Schema
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { z } from 'zod';

/**
 * Validator Plugin Configuration Schema
 * 
 * Validates the configuration for the ObjectQL Validator Plugin using Zod.
 * This ensures type safety and runtime validation for plugin configuration.
 */
export const ValidatorPluginConfigSchema = z.object({
  /**
   * Language for validation error messages
   * @default 'en'
   */
  language: z.string().optional().default('en'),
  
  /**
   * Fallback languages if translation not found
   * @default ['en', 'zh-CN']
   */
  languageFallback: z.array(z.string()).optional().default(['en', 'zh-CN']),
  
  /**
   * Enable validation on queries
   * @default true
   */
  enableQueryValidation: z.boolean().optional().default(true),
  
  /**
   * Enable validation on mutations
   * @default true
   */
  enableMutationValidation: z.boolean().optional().default(true)
});

export type ValidatorPluginConfig = z.infer<typeof ValidatorPluginConfigSchema>;
