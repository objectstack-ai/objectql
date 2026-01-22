/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Query Module
 * 
 * This module contains ObjectQL's query-specific functionality:
 * - FilterTranslator: Converts ObjectQL filters to ObjectStack FilterNode
 * - QueryBuilder: Builds ObjectStack QueryAST from ObjectQL UnifiedQuery
 * 
 * These are the core components that differentiate ObjectQL from generic runtime systems.
 */

export * from './filter-translator';
export * from './query-builder';
