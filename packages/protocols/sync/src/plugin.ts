/**
 * ObjectQL Sync Protocol — Plugin
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { RuntimePlugin, RuntimeContext, SyncEndpointConfig, SyncPushRequest } from '@objectql/types';
import { SyncHandler, type RecordResolver } from './sync-handler.js';

/**
 * Configuration for the sync protocol plugin.
 */
export interface SyncProtocolPluginConfig {
  /** Sync endpoint configuration */
  readonly endpoint: SyncEndpointConfig;
  /** Per-object conflict field definitions */
  readonly conflictFields?: ReadonlyMap<string, readonly string[]>;
}

/**
 * ObjectQL Sync Protocol Plugin
 *
 * Provides server-side sync endpoint for handling client push/pull requests.
 * Implements delta computation and change tracking.
 */
export class SyncProtocolPlugin implements RuntimePlugin {
  name = '@objectql/protocol-sync';
  version = '4.2.0';

  private readonly config: SyncProtocolPluginConfig;
  private handler: SyncHandler | null = null;

  constructor(config: SyncProtocolPluginConfig) {
    this.config = config;
  }

  async install(ctx: RuntimeContext): Promise<void> {
    if (!this.config.endpoint.enabled) return;

    this.handler = new SyncHandler({
      config: this.config.endpoint,
      conflictFields: this.config.conflictFields,
    });

    // Register sync handler on the kernel
    const kernel = ctx.engine as Record<string, unknown>;
    kernel['syncProtocol'] = {
      handler: this.handler,
      handlePush: (request: SyncPushRequest, resolver: RecordResolver) =>
        this.handler!.handlePush(request, resolver),
    };
  }

  async onStart(_ctx: RuntimeContext): Promise<void> {
    // Protocol is ready to accept requests
  }

  async onStop(_ctx: RuntimeContext): Promise<void> {
    this.handler = null;
  }

  /** Get the sync handler (available after install) */
  getHandler(): SyncHandler | null {
    return this.handler;
  }
}
