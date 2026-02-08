/**
 * ObjectQL Sync Plugin
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { RuntimePlugin, RuntimeContext, SyncConfig } from '@objectql/types';
import { SyncEngine, type SyncTransport, type SyncEventListener } from './sync-engine.js';

/**
 * Configuration for the sync plugin.
 */
export interface SyncPluginConfig {
  /** Client device identifier */
  readonly clientId: string;
  /** Default sync configuration for objects that don't specify their own */
  readonly defaultConfig?: SyncConfig;
  /** Sync transport implementation */
  readonly transport: SyncTransport;
  /** Global sync event listeners */
  readonly listeners?: readonly SyncEventListener[];
}

/**
 * ObjectQL Sync Plugin
 *
 * Provides offline-first sync capabilities for ObjectQL applications.
 * Records mutations locally and synchronizes with the server when online.
 */
export class SyncPlugin implements RuntimePlugin {
  name = '@objectql/plugin-sync';
  version = '4.2.0';

  private readonly config: SyncPluginConfig;
  private readonly engines: Map<string, SyncEngine> = new Map();

  constructor(config: SyncPluginConfig) {
    this.config = config;
  }

  async install(ctx: RuntimeContext): Promise<void> {
    // Register sync capabilities on the kernel
    const kernel = ctx.engine as Record<string, unknown>;
    kernel['sync'] = {
      getEngine: (objectName: string) => this.getEngine(objectName),
      getAllEngines: () => this.getAllEngines(),
      syncAll: () => this.syncAll(),
    };
  }

  async onStart(_ctx: RuntimeContext): Promise<void> {
    // Engines are created lazily when sync is first needed
  }

  async onStop(_ctx: RuntimeContext): Promise<void> {
    // Cancel all scheduled syncs
    for (const engine of this.engines.values()) {
      engine.cancelScheduledSync();
    }
    this.engines.clear();
  }

  /**
   * Get or create a sync engine for the given object.
   */
  getEngine(objectName: string, syncConfig?: SyncConfig): SyncEngine {
    let engine = this.engines.get(objectName);
    if (!engine) {
      const config = syncConfig ?? this.config.defaultConfig ?? {
        enabled: true,
        strategy: 'last-write-wins' as const,
      };
      engine = new SyncEngine({
        clientId: this.config.clientId,
        transport: this.config.transport,
        config,
      });
      // Add global listeners
      if (this.config.listeners) {
        for (const listener of this.config.listeners) {
          engine.addListener(listener);
        }
      }
      this.engines.set(objectName, engine);
    }
    return engine;
  }

  /**
   * Get all active sync engines.
   */
  getAllEngines(): ReadonlyMap<string, SyncEngine> {
    return this.engines;
  }

  /**
   * Trigger sync for all active engines.
   */
  async syncAll(): Promise<void> {
    const promises: Promise<unknown>[] = [];
    for (const engine of this.engines.values()) {
      promises.push(engine.sync());
    }
    await Promise.all(promises);
  }
}
