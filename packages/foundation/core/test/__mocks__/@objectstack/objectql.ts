/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Mock for @objectstack/objectql to enable Jest testing
 */

export class ObjectQL {
  private drivers = new Map<string, any>();
  private defaultDriver: any = null;
  private hooks = new Map<string, any[]>();
  private middlewares: Array<{ fn: any; object?: string }> = [];
  
  constructor(public config: any) {}
  
  async connect() {}
  async disconnect() {}
  async init() {}
  
  registerDriver(driver: any, isDefault: boolean = false) {
    if (!driver.name) {
      throw new Error('Driver must have a name');
    }
    this.drivers.set(driver.name, driver);
    if (isDefault) {
      this.defaultDriver = driver.name;
    }
  }
  
  registerObject(schema: any, packageId: string = '__runtime__', namespace?: string): string {
    // Auto-assign field names from keys
    if (schema.fields) {
      for (const [key, field] of Object.entries(schema.fields)) {
        if (field && typeof field === 'object' && !('name' in field)) {
          (field as any).name = key;
        }
      }
    }
    return SchemaRegistry.registerObject(schema, packageId, namespace);
  }
  
  getObject(name: string) {
    return SchemaRegistry.getObject(name);
  }
  
  getConfigs(): Record<string, any> {
    return SchemaRegistry.getAllObjects().reduce((acc: any, obj: any) => {
      if (obj.name) {
        acc[obj.name] = obj;
      }
      return acc;
    }, {});
  }
  
  removePackage(packageId: string) {
    SchemaRegistry.unregisterObjectsByPackage(packageId);
  }
  
  registerHook(event: string, handler: any, options?: any) {
    if (!this.hooks.has(event)) {
      this.hooks.set(event, []);
    }
    this.hooks.get(event)!.push({ handler, options });
  }

  registerMiddleware(fn: any, options?: { object?: string }) {
    this.middlewares.push({ fn, object: options?.object });
  }

  private async executeWithMiddleware(opCtx: any, executor: () => Promise<any>) {
    const applicable = this.middlewares.filter(
      (m) => !m.object || m.object === '*' || m.object === opCtx.object
    );
    let index = 0;
    const next = async () => {
      if (index < applicable.length) {
        const mw = applicable[index++];
        await mw.fn(opCtx, next);
      } else {
        opCtx.result = await executor();
      }
    };
    await next();
    return opCtx.result;
  }

  private async triggerHooks(event: string, context: any) {
    const entries = this.hooks.get(event) || [];
    for (const entry of entries) {
      if (entry.options?.object) {
        const targets = Array.isArray(entry.options.object) ? entry.options.object : [entry.options.object];
        if (!targets.includes('*') && !targets.includes(context.object)) {
          continue;
        }
      }
      await entry.handler(context);
    }
  }
  
  createContext(options: any = {}) {
    return {
      isSystem: options.isSystem || false,
      object: (name: string) => ({
        find: async (filter: any) => {
          const driver = this.drivers.get(this.defaultDriver || this.drivers.keys().next().value);
          const opCtx = { object: name, operation: 'find', options: filter, context: options, result: undefined as any };
          await this.executeWithMiddleware(opCtx, async () => {
            const hookContext = { object: name, event: 'beforeFind', input: { options: filter }, session: options };
            await this.triggerHooks('beforeFind', hookContext);
            const result = driver?.find ? await driver.find(name, filter) : [];
            hookContext.event = 'afterFind';
            (hookContext as any).result = result;
            await this.triggerHooks('afterFind', hookContext);
            return (hookContext as any).result;
          });
          return opCtx.result;
        },
        findOne: async (filter: any) => {
          const driver = this.drivers.get(this.defaultDriver || this.drivers.keys().next().value);
          const opCtx = { object: name, operation: 'findOne', options: filter, context: options, result: undefined as any };
          await this.executeWithMiddleware(opCtx, async () => {
            return driver?.findOne ? await driver.findOne(name, filter) : null;
          });
          return opCtx.result;
        },
        insert: async (data: any) => {
          const driver = this.drivers.get(this.defaultDriver || this.drivers.keys().next().value);
          if (driver && driver.insert) {
            return driver.insert(name, data);
          }
          return data;
        },
        update: async (id: string, data: any) => {
          const driver = this.drivers.get(this.defaultDriver || this.drivers.keys().next().value);
          if (driver && driver.update) {
            return driver.update(name, id, data);
          }
          return data;
        },
        delete: async (id: string) => {
          const driver = this.drivers.get(this.defaultDriver || this.drivers.keys().next().value);
          if (driver && driver.delete) {
            return driver.delete(name, id);
          }
        }
      })
    };
  }
}

const mockStore = new Map<string, Map<string, any>>();

export const SchemaRegistry = {
  register: jest.fn(),
  get: jest.fn(),
  registerItem: jest.fn((type: string, item: any, keyField: string = 'name') => {
    if (!mockStore.has(type)) {
      mockStore.set(type, new Map());
    }
    const key = item[keyField];
    mockStore.get(type)!.set(key, item);
  }),
  unregisterItem: jest.fn((type: string, name: string) => {
    const collection = mockStore.get(type);
    if (collection) {
      collection.delete(name);
    }
  }),
  getItem: jest.fn((type: string, name: string) => {
    return mockStore.get(type)?.get(name);
  }),
  listItems: jest.fn((type: string) => {
    const items = mockStore.get(type);
    return items ? Array.from(items.values()) : [];
  }),
  metadata: mockStore,
  
  // Additional methods needed for ObjectQL compatibility
  registerObject: jest.fn((schema: any, packageId?: string, namespace?: string) => {
    if (!mockStore.has('object')) {
      mockStore.set('object', new Map());
    }
    const name = schema.name || 'unnamed';
    mockStore.get('object')!.set(name, schema);
    return namespace ? `${namespace}.${name}` : name;
  }),
  
  getObject: jest.fn((name: string) => {
    return mockStore.get('object')?.get(name);
  }),
  
  getAllObjects: jest.fn(() => {
    const objects = mockStore.get('object');
    return objects ? Array.from(objects.values()) : [];
  }),
  
  unregisterObjectsByPackage: jest.fn((packageId: string) => {
    // In mock, just clear the objects store
    const objects = mockStore.get('object');
    if (objects) {
      const toDelete: string[] = [];
      objects.forEach((obj, key) => {
        if ((obj as any).__packageId === packageId) {
          toDelete.push(key);
        }
      });
      toDelete.forEach(key => objects.delete(key));
    }
  }),
};
