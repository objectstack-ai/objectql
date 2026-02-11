/**
 * ObjectQL Kernel Factory
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ObjectKernel } from '@objectstack/runtime';
import { ObjectQLPlugin as UpstreamObjectQLPlugin } from '@objectstack/objectql';
import type { Plugin } from '@objectstack/core';

/**
 * Options for creating an ObjectQL Kernel
 */
export interface ObjectQLKernelOptions {
  /**
   * Additional plugins to register with the kernel
   */
  plugins?: Plugin[];
}

/**
 * Convenience factory for creating an ObjectQL-ready kernel.
 *
 * Creates an ObjectStackKernel pre-configured with the upstream ObjectQLPlugin
 * (data engine, schema registry, protocol implementation) plus any additional
 * plugins provided.
 *
 * @example
 * ```typescript
 * import { createObjectQLKernel } from '@objectql/core';
 * import { QueryPlugin } from '@objectql/plugin-query';
 * import { OptimizationsPlugin } from '@objectql/plugin-optimizations';
 *
 * const kernel = createObjectQLKernel({
 *   plugins: [new QueryPlugin(), new OptimizationsPlugin()],
 * });
 * await kernel.start();
 * ```
 */
export function createObjectQLKernel(options: ObjectQLKernelOptions = {}): ObjectKernel {
  return new (ObjectKernel as any)([
    new UpstreamObjectQLPlugin(),
    ...(options.plugins || []),
  ]);
}
