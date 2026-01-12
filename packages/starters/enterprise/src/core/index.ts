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
