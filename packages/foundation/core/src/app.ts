/**
 * ObjectQL Bridge Class
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * Extends the upstream @objectstack/objectql.ObjectQL engine with:
 *  - Legacy constructor config (datasources map)
 *  - MetadataRegistry integration (for ObjectLoader filesystem loading)
 *
 * This allows existing consumers to keep using:
 *   const app = new ObjectQL({ datasources: { default: driver } });
 *   const loader = new ObjectLoader(app.metadata);
 *   await loader.load(dir);
 *   await app.init();
 */

import { ObjectQL as UpstreamObjectQL, SchemaRegistry } from '@objectstack/objectql';
import type { ServiceObject } from '@objectstack/spec/data';
import type { DriverInterface } from '@objectstack/core';
import { MetadataRegistry } from '@objectql/types';
import type { Driver } from '@objectql/types';

// Runtime-safe accessor for compat methods that exist in @objectstack/objectql@3.0.1
// but may not be visible to TypeScript due to module resolution variance.
type UpstreamCompat = UpstreamObjectQL & {
  registerObject(schema: ServiceObject, packageId?: string, namespace?: string): string;
  getObject(name: string): ServiceObject | undefined;
  getConfigs(): Record<string, ServiceObject>;
  removePackage(packageId: string): void;
};

/**
 * Legacy config shape accepted by the ObjectQL bridge constructor.
 */
export interface ObjectQLConfig {
  datasources?: Record<string, Driver | DriverInterface>;
  [key: string]: unknown;
}

/**
 * ObjectQL — drop-in replacement that bridges the upstream engine
 * with the @objectql/types MetadataRegistry used by ObjectLoader.
 */
export class ObjectQL extends UpstreamObjectQL {
  /**
   * Filesystem metadata registry populated by ObjectLoader.
   * After calling loader.load(), call app.init() to sync these
   * entries into the upstream SchemaRegistry & driver layer.
   */
  readonly metadata = new MetadataRegistry();

  /** Typed self-reference for compat methods */
  private get compat(): UpstreamCompat { return this as unknown as UpstreamCompat; }

  constructor(config: ObjectQLConfig = {}) {
    // Upstream constructor only accepts hostContext
    super();

    // Register drivers from legacy datasources config
    if (config.datasources) {
      for (const [name, driver] of Object.entries(config.datasources)) {
        if (!(driver as any).name) {
          (driver as any).name = name;
        }
        // Cast: local Driver interface is structurally compatible with upstream DriverInterface
        this.registerDriver(driver as DriverInterface, name === 'default');
      }
    }
  }

  /**
   * Initialize the engine.
   *
   * Before calling the upstream init (which connects drivers and syncs schemas),
   * bridge all objects loaded via ObjectLoader into the upstream SchemaRegistry.
   */
  async init(): Promise<void> {
    this.syncMetadataToRegistry();
    return super.init();
  }

  /**
   * Sync all filesystem-loaded metadata into the upstream SchemaRegistry.
   * Called automatically by init(), but can also be called manually.
   */
  private syncMetadataToRegistry(): void {
    // Bridge filesystem-loaded objects → upstream SchemaRegistry
    const objects = this.metadata.list<any>('object');
    for (const obj of objects) {
      if (obj && obj.name) {
        // Only register if not already in SchemaRegistry
        if (!SchemaRegistry.getObject(obj.name)) {
          this.compat.registerObject(obj as ServiceObject, '__filesystem__');
        }
      }
    }

    // Bridge filesystem-loaded hooks → upstream hook system
    const hooks = this.metadata.list<any>('hook');
    for (const hookEntry of hooks) {
      if (hookEntry && typeof hookEntry === 'object') {
        const objectName = (hookEntry as any).id || (hookEntry as any).objectName;
        for (const [event, handler] of Object.entries(hookEntry)) {
          if (typeof handler === 'function' && event !== 'id' && event !== 'objectName') {
            this.registerHook(event, handler as any, { object: objectName });
          }
        }
      }
    }
  }

  /**
   * Get an object definition by name.
   *
   * Checks the upstream SchemaRegistry first, then falls back to the
   * local MetadataRegistry for objects loaded via ObjectLoader but
   * not yet synced (i.e., init() hasn't been called yet).
   */
  getObject(name: string): ServiceObject | undefined {
    // Check upstream SchemaRegistry
    const upstream = SchemaRegistry.getObject(name);
    if (upstream) return upstream;
    // Fallback: check local MetadataRegistry (pre-init)
    return this.metadata.get<ServiceObject>('object', name);
  }

  /**
   * Get all registered object configs as a name→config map.
   *
   * Merges results from the upstream SchemaRegistry with the
   * local MetadataRegistry (for pre-init objects).
   */
  getConfigs(): Record<string, ServiceObject> {
    const result: Record<string, ServiceObject> = {};
    // Get upstream objects from SchemaRegistry
    const upstreamObjects = SchemaRegistry.getAllObjects();
    for (const obj of upstreamObjects) {
      if (obj.name) {
        result[obj.name] = obj;
      }
    }
    // Merge local MetadataRegistry entries not yet synced upstream
    const localObjects = this.metadata.list<any>('object');
    for (const obj of localObjects) {
      if (obj && obj.name && !result[obj.name]) {
        result[obj.name] = obj;
      }
    }
    return result;
  }

  /**
   * Remove all hooks, actions, and objects contributed by a package.
   * Also cleans up the local MetadataRegistry.
   */
  removePackage(packageId: string): void {
    this.compat.removePackage(packageId);
    this.metadata.unregisterPackage(packageId);
  }
}
