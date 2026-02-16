/**
 * ObjectQL Kernel Factory
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @deprecated Use `new ObjectStackKernel([...plugins])` directly from `@objectstack/runtime`.
 * This factory will be removed in v5.0.
 */

import { ObjectKernel } from '@objectstack/runtime';
import { ObjectQLPlugin as UpstreamObjectQLPlugin } from '@objectstack/objectql';
import type { Plugin } from '@objectstack/core';

/**
 * Options for creating an ObjectQL Kernel
 * @deprecated Use `new ObjectStackKernel([...plugins])` from `@objectstack/runtime` instead.
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
 * @deprecated Use `new ObjectStackKernel([...plugins])` from `@objectstack/runtime` instead.
 * This factory will be removed in v5.0.
 *
 * @example
 * ```typescript
 * // ❌ Deprecated
 * import { createObjectQLKernel } from '@objectql/core';
 * const kernel = createObjectQLKernel({ plugins: [...] });
 *
 * // ✅ Recommended
 * import { ObjectStackKernel } from '@objectstack/runtime';
 * import { ObjectQLPlugin } from '@objectstack/objectql';
 * const kernel = new ObjectStackKernel([new ObjectQLPlugin(), ...plugins]);
 * ```
 */
export function createObjectQLKernel(options: ObjectQLKernelOptions = {}): ObjectKernel {
  console.warn(
    '[@objectql/core] createObjectQLKernel() is deprecated. ' +
    'Use `new ObjectStackKernel([new ObjectQLPlugin(), ...plugins])` from `@objectstack/runtime` instead. ' +
    'See: https://github.com/objectstack-ai/spec/blob/main/content/docs/guides/objectql-migration.mdx'
  );
  return new (ObjectKernel as any)([
    new UpstreamObjectQLPlugin(),
    ...(options.plugins || []),
  ]);
}
