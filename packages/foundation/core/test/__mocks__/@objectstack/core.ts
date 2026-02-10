/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Mock for @objectstack/core to enable Jest testing
 * 
 * Since @objectstack/core@0.9.2 uses ES modules with import.meta,
 * which Jest doesn't support well, we provide this mock for testing.
 */

export const createLogger = jest.fn(() => ({
  trace: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  fatal: jest.fn(),
}));

class MockMetadataRegistry {
  private store = new Map<string, Map<string, any>>();

  register(type: string, nameOrConfig: string | any, config?: any): void {
    if (!this.store.has(type)) {
      this.store.set(type, new Map());
    }
    const typeMap = this.store.get(type)!;
    let name: string;
    let item: any;
    if (config) {
      name = nameOrConfig as string;
      item = config;
    } else {
      item = nameOrConfig;
      name = item.id || item.name;
    }
    typeMap.set(name, item);
  }

  get<T = any>(type: string, id: string): T | undefined {
    const typeMap = this.store.get(type);
    const item = typeMap?.get(id);
    return item?.content as T;
  }

  list<T = any>(type: string): T[] {
    const typeMap = this.store.get(type);
    if (!typeMap) return [];
    return Array.from(typeMap.values()).map(item => item.content as T);
  }

  unregister(type: string, id: string): boolean {
    const typeMap = this.store.get(type);
    if (!typeMap) return false;
    return typeMap.delete(id);
  }

  getTypes(): string[] {
    return Array.from(this.store.keys());
  }

  getEntry(type: string, id: string): any | undefined {
    const typeMap = this.store.get(type);
    return typeMap ? typeMap.get(id) : undefined;
  }

  unregisterPackage(packageName: string): void {
    for (const [_type, typeMap] of this.store.entries()) {
      const toDelete: string[] = [];
      for (const [id, item] of typeMap.entries()) {
        if (item.packageName === packageName || item.package === packageName) {
          toDelete.push(id);
        }
      }
      toDelete.forEach(id => typeMap.delete(id));
    }
  }
}

class MockHookManager {
  removePackage(_packageName: string): void {
    // Mock implementation
  }
  clear(): void {
    // Mock implementation
  }
}

class MockActionManager {
  removePackage(_packageName: string): void {
    // Mock implementation
  }
  clear(): void {
    // Mock implementation
  }
}

export class ObjectKernel {
  public ql: unknown = null;
  public metadata: MockMetadataRegistry;
  public hooks: MockHookManager;
  public actions: MockActionManager;
  private plugins: any[] = [];
  private driver: any = null;

  constructor(plugins: any[] = []) {
    this.plugins = plugins;
    this.metadata = new MockMetadataRegistry();
    this.hooks = new MockHookManager();
    this.actions = new MockActionManager();
  }

  setDriver(driver: any): void {
    this.driver = driver;
  }

  async start(): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.install) {
        await plugin.install({ engine: this });
      }
    }
    for (const plugin of this.plugins) {
      if (plugin.onStart) {
        await plugin.onStart({ engine: this });
      }
    }
  }

  async stop(): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.onStop) {
        await plugin.onStop({ engine: this });
      }
    }
  }

  getDriver(): any {
    const driver = this.plugins.find(p =>
      p.constructor.name?.includes('Driver') ||
      (typeof p.find === 'function' && typeof p.create === 'function')
    );
    return driver || this.driver;
  }

  async seed(): Promise<void> {
    // Mock implementation
  }

  async find(objectName: string, query: any): Promise<{ value: Record<string, any>[]; count: number }> {
    const driver = this.getDriver();
    if (driver) {
      const normalizedQuery: any = {};
      if (query.filters) {
        normalizedQuery.where = query.filters;
      } else if (query.filter) {
        normalizedQuery.where = query.filter;
      } else if (query.where) {
        normalizedQuery.where = query.where;
      }
      if (query.fields) {
        normalizedQuery.fields = query.fields;
      }
      if (query.sort) {
        if (Array.isArray(query.sort) && query.sort.length > 0) {
          const firstItem = query.sort[0];
          if (firstItem !== undefined) {
            if (Array.isArray(firstItem)) {
              normalizedQuery.orderBy = query.sort.map((s: any) => ({
                field: s[0],
                order: s[1]
              }));
            } else if (typeof firstItem === 'object') {
              normalizedQuery.orderBy = query.sort.flatMap((s: any) =>
                Object.entries(s).map(([field, order]) => ({
                  field,
                  order: (order === -1 || order === 'desc' || order === 'DESC') ? 'desc' : 'asc'
                }))
              );
            }
          }
        } else if (query.sort) {
          normalizedQuery.orderBy = query.sort;
        }
      } else if (query.orderBy) {
        normalizedQuery.orderBy = query.orderBy;
      }
      if (query.limit !== undefined) {
        normalizedQuery.limit = query.limit;
      } else if (query.top !== undefined) {
        normalizedQuery.limit = query.top;
      }
      if (query.offset !== undefined) {
        normalizedQuery.offset = query.offset;
      } else if (query.skip !== undefined) {
        normalizedQuery.offset = query.skip;
      }
      if (query.aggregations) {
        normalizedQuery.aggregate = query.aggregations.map((agg: any) => ({
          func: agg.function,
          field: agg.field,
          alias: agg.alias
        }));
      }
      if (query.groupBy) {
        normalizedQuery.groupBy = query.groupBy;
      }
      const results = await driver.find(objectName, normalizedQuery, {});
      return { value: results, count: results.length };
    }
    return { value: [], count: 0 };
  }

  async get(objectName: string, id: string): Promise<Record<string, any>> {
    const driver = this.getDriver();
    if (driver) {
      return await driver.findOne(objectName, id, {}, {});
    }
    return {};
  }

  async create(objectName: string, data: any): Promise<Record<string, any>> {
    const driver = this.getDriver();
    if (driver) {
      return await driver.create(objectName, data, {});
    }
    return data;
  }

  async update(objectName: string, id: string, data: any): Promise<Record<string, any>> {
    const driver = this.getDriver();
    if (driver) {
      return await driver.update(objectName, id, data, {});
    }
    return data;
  }

  async delete(objectName: string, id: string): Promise<boolean> {
    const driver = this.getDriver();
    if (driver) {
      const result = await driver.delete(objectName, id, {});
      return result > 0;
    }
    return true;
  }

  getMetadata(_objectName: string): any {
    return {};
  }

  getView(_objectName: string, _viewType?: 'list' | 'form'): any {
    return null;
  }
}

export class ObjectStackProtocolImplementation {}

export interface PluginContext {
  engine: ObjectKernel;
}

export interface ObjectQLPlugin {
  name: string;
  install?: (ctx: PluginContext) => void | Promise<void>;
  onStart?: (ctx: PluginContext) => void | Promise<void>;
}

export { MockMetadataRegistry as MetadataRegistry };

export const LiteKernel = jest.fn();
export const createApiRegistryPlugin = jest.fn();
