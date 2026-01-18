/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Core Module - Foundation Objects
 * 
 * Exports all core/shared objects
 */

export const CORE_OBJECTS = [
  'user',
  'organization',
  'attachment',
] as const;

export type CoreObject = typeof CORE_OBJECTS[number];

/**
 * Module metadata
 */
export const CORE_MODULE = {
  name: 'core',
  label: 'Core Objects',
  description: 'Foundation objects used across all modules',
  version: '1.0.0',
  objects: CORE_OBJECTS,
} as const;
