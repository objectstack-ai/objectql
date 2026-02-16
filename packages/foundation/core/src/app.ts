/**
 * ObjectQL Bridge Class
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * @deprecated This bridge class is deprecated. Use `@objectstack/objectql` ObjectQL directly.
 * The MetadataRegistry bridge is no longer necessary — ObjectLoader should register objects
 * directly into the upstream SchemaRegistry via `@objectql/platform-node`.
 * This class will be removed in v5.0.
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
 *
 * @deprecated Use `@objectstack/objectql` ObjectQL directly. This bridge will be removed in v5.0.
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

  private pendingDrivers: Array<{ name: string; driver: DriverInterface; isDefault: boolean }> = [];

  // Explicitly declare inherited methods to ensure they're in the type definition
  declare registerObject: (schema: ServiceObject, packageId?: string, namespace?: string) => string;

  constructor(config: ObjectQLConfig = {}) {
    // Upstream constructor only accepts hostContext
    super();

    // Emit deprecation warning
    console.warn(
      '[@objectql/core] ObjectQL bridge class is deprecated. ' +
      'Use ObjectQL from `@objectstack/objectql` directly. ' +
      'See: https://github.com/objectstack-ai/spec/blob/main/content/docs/guides/objectql-migration.mdx'
    );

    // Store drivers for registration during init()
    if (config.datasources) {
      for (const [name, driver] of Object.entries(config.datasources)) {
        // Always set driver.name to the config key so datasource(name) lookups work
        (driver as any).name = name;
        // Cast: local Driver interface is structurally compatible with upstream DriverInterface
        this.pendingDrivers.push({
          name,
          driver: driver as DriverInterface,
          isDefault: name === 'default'
        });
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
    // Register any pending drivers from the constructor config
    for (const { driver, isDefault } of this.pendingDrivers) {
      (this as any).registerDriver(driver, isDefault);
    }
    this.pendingDrivers = [];

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
          super.registerObject(obj as ServiceObject, '__filesystem__');
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
  override getObject(name: string): ServiceObject | undefined {
    // Check upstream SchemaRegistry first (call parent)
    const upstream = super.getObject(name);
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
  override getConfigs(): Record<string, ServiceObject> {
    // Get upstream objects first (call parent)
    const result = super.getConfigs();
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
  override removePackage(packageId: string): void {
    super.removePackage(packageId);
    this.metadata.unregisterPackage(packageId);
  }
}
