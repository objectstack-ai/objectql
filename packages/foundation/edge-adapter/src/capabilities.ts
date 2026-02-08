/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { EdgeCapabilities, EdgeRuntime } from '@objectql/types';
import { EDGE_CAPABILITIES } from '@objectql/types';

/**
 * Declares the minimum capabilities a runtime must provide.
 */
export interface CapabilityRequirement {
    readonly wasm?: boolean;
    readonly persistentStorage?: boolean;
    readonly webSocket?: boolean;
    readonly scheduledTriggers?: boolean;
    readonly minExecutionTime?: number;
}

/**
 * Result of validating a runtime against a set of requirements.
 */
export interface CapabilityValidationResult {
    readonly valid: boolean;
    readonly runtime: EdgeRuntime;
    readonly capabilities: EdgeCapabilities;
    readonly missing: readonly string[];
}

/**
 * Returns the predefined capability profile for a given runtime.
 */
export function getCapabilities(runtime: EdgeRuntime): EdgeCapabilities {
    return EDGE_CAPABILITIES[runtime];
}

/**
 * Validates that a runtime satisfies the given capability requirements.
 */
export function validateCapabilities(
    runtime: EdgeRuntime,
    requirements: CapabilityRequirement,
): CapabilityValidationResult {
    const capabilities = getCapabilities(runtime);
    const missing: string[] = [];

    if (requirements.wasm && !capabilities.wasm) {
        missing.push('WebAssembly');
    }
    if (requirements.persistentStorage && !capabilities.persistentStorage) {
        missing.push('Persistent Storage');
    }
    if (requirements.webSocket && !capabilities.webSocket) {
        missing.push('WebSocket');
    }
    if (requirements.scheduledTriggers && !capabilities.scheduledTriggers) {
        missing.push('Scheduled Triggers');
    }
    if (
        requirements.minExecutionTime &&
        capabilities.maxExecutionTime !== undefined &&
        capabilities.maxExecutionTime !== Infinity &&
        capabilities.maxExecutionTime < requirements.minExecutionTime
    ) {
        missing.push(
            `Execution time (need ${requirements.minExecutionTime}ms, max ${capabilities.maxExecutionTime}ms)`,
        );
    }

    return {
        valid: missing.length === 0,
        runtime,
        capabilities,
        missing,
    };
}
