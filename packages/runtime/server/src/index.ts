/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Core exports
export * from './types';
export * from './utils';
export * from './server';

// Re-export from subdivided packages for backward compatibility
// Users can import directly from @objectql/server or from the specific packages
export * from '@objectql/server-rest';
export * from '@objectql/server-graphql';
export * from '@objectql/server-metadata';
export * from '@objectql/server-storage';
