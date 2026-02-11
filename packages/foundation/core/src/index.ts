/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// ── Convenience factory ──
export { createObjectQLKernel, type ObjectQLKernelOptions } from './kernel-factory';

// ── Core runtime components ──
export * from './repository';
export * from './app';
export * from './plugin';

// ── Utilities ──
export * from './util';
