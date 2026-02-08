/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { detectRuntime } from './detector.js';
export {
    getCapabilities,
    validateCapabilities,
    type CapabilityRequirement,
    type CapabilityValidationResult,
} from './capabilities.js';
export {
    getDefaultDriver,
    resolveBindings,
    type ResolvedBinding,
} from './binding-resolver.js';
export {
    EdgeAdapterPlugin,
    type EdgeAdapterPluginConfig,
} from './plugin.js';
