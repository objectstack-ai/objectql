/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Re-export MetadataRegistry and MetadataItem from @objectstack/runtime
 * 
 * As of Week 3 refactoring, metadata management has been moved to the
 * @objectstack/runtime package to enable sharing across the ecosystem.
 */
export { MetadataRegistry, MetadataItem } from '@objectstack/runtime';

/**
 * Legacy Metadata interface - kept for backward compatibility
 * @deprecated Use MetadataItem from @objectstack/runtime instead
 */
export interface Metadata {
    type: string;
    id: string;
    path?: string;
    package?: string;
    content: unknown;
}
