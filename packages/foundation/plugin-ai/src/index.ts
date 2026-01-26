/**
 * @objectql/plugin-ai
 * AI Plugin for ObjectQL
 * 
 * Copyright (c) 2026-present ObjectStack Inc.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { AIPlugin, AIServiceImpl, createAIPlugin } from './plugin';

// Re-export AI types from @objectql/types for convenience
export type {
    AIPluginConfig,
    AIProvider,
    AIService,
    AIGenerationRequest,
    AIGenerationResult,
    AIValidationRequest,
    AIValidationResult,
    AISuggestionRequest,
    AISuggestionResult
} from '@objectql/types';
