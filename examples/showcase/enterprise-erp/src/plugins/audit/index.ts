/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Export the plugin for external usage
export * from './audit.plugin';

// Make it the default export as well for easier consumption
import { AuditLogPlugin } from './audit.plugin';
export default AuditLogPlugin;
