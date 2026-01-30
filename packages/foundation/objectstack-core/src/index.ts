/**
 * @objectstack/core
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Re-export everything from runtime
export { 
    ObjectKernel, 
    ObjectStackKernel,
    type Plugin,
    type RuntimeContext as PluginContext,
    type RuntimeContext,
    type RuntimeAppConfig,
    type RuntimeDriver,
    type Component
} from '@objectstack/runtime';
