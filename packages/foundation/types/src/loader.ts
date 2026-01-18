/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { MetadataRegistry } from './registry';

export interface LoaderHandlerContext {
    file: string;
    content: string;
    registry: MetadataRegistry;
    packageName?: string;
}

export type LoaderHandler = (ctx: LoaderHandlerContext) => void;

export interface LoaderPlugin {
    name: string;
    glob: string[];
    handler: LoaderHandler;
    options?: any;
}
