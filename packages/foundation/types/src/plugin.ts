/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { IObjectQL } from './app';

// Import plugin types from @objectstack/spec (the protocol standard)
export type {
    PluginContextData,
    PluginLifecycleHooks,
    PluginDefinition,
} from '@objectstack/spec';

/**
 * @deprecated Legacy plugin interface. Use PluginDefinition from @objectstack/spec instead.
 * 
 * This interface is maintained for backward compatibility with existing plugins.
 * New plugins should implement PluginDefinition with lifecycle hooks (onEnable, onDisable, etc.)
 * instead of the legacy setup() method.
 * 
 * @example Migration from legacy to new:
 * // Old way (deprecated):
 * export class MyPlugin implements ObjectQLPlugin {
 *   name = 'my-plugin';
 *   setup(app: IObjectQL) { ... }
 * }
 * 
 * // New way (recommended):
 * export default {
 *   id: 'my-plugin',
 *   onEnable: async (context) => { ... }
 * } satisfies PluginDefinition;
 */
export interface ObjectQLPlugin {
    name: string;
    setup(app: IObjectQL): void | Promise<void>;
}
