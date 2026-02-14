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
  async init() {
    // Initialize drivers (connect + sync schema)
    for (const [_name, driver] of this.drivers) {
      if (driver.connect) {
        await driver.connect();
      }
      if (driver.init) {
        const objects = SchemaRegistry.getAllObjects();
        await driver.init(objects);
      }
    }
  }
  
  registerDriver(driver: any, isDefault: boolean = false) {
    if (!driver.name) {
      throw new Error('Driver must have a name');
    }
    this.drivers.set(driver.name, driver);
    if (isDefault) {
      this.defaultDriver = driver.name;
    }
  }

  datasource(name: string): any {
    const driver = this.drivers.get(name);
    if (!driver) {
      throw new Error(`[ObjectQL] Datasource '${name}' not found`);
    }
    return driver;
  }

  getDriverByName(name: string): any {
    return this.drivers.get(name);
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

  on(event: string, objectName: string, handler: any, packageId?: string) {
    this.registerHook(event, handler, { object: objectName, packageId });
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
        create: async (data: any) => {
          const driver = this.drivers.get(this.defaultDriver || this.drivers.keys().next().value);
          const opCtx = { object: name, operation: 'insert', data, context: options, result: undefined as any };
          await this.executeWithMiddleware(opCtx, async () => {
            const hookContext: any = {
              object: name, event: 'beforeCreate',
              input: { data: opCtx.data }, session: options,
              data: opCtx.data, user: options.userId ? { id: options.userId } : options.user
            };
            await this.triggerHooks('beforeCreate', hookContext);
            const finalData = hookContext.data || hookContext.input.data;
            const result = driver?.create ? await driver.create(name, finalData, options) : finalData;
            hookContext.event = 'afterCreate';
            hookContext.result = result;
            await this.triggerHooks('afterCreate', hookContext);
            return hookContext.result;
          });
          return opCtx.result;
        },
        insert: async (data: any) => {
          const driver = this.drivers.get(this.defaultDriver || this.drivers.keys().next().value);
          const opCtx = { object: name, operation: 'insert', data, context: options, result: undefined as any };
          await this.executeWithMiddleware(opCtx, async () => {
            const hookContext: any = {
              object: name, event: 'beforeCreate',
              input: { data: opCtx.data }, session: options,
              data: opCtx.data, user: options.userId ? { id: options.userId } : options.user
            };
            await this.triggerHooks('beforeCreate', hookContext);
            const finalData = hookContext.data || hookContext.input.data;
            const result = driver?.create ? await driver.create(name, finalData, options)
              : driver?.insert ? await driver.insert(name, finalData)
              : finalData;
            hookContext.event = 'afterCreate';
            hookContext.result = result;
            await this.triggerHooks('afterCreate', hookContext);
            return hookContext.result;
          });
          return opCtx.result;
        },
        update: async (id: string, data: any) => {
          const driver = this.drivers.get(this.defaultDriver || this.drivers.keys().next().value);
          const opCtx = { object: name, operation: 'update', data, context: options, result: undefined as any };
          await this.executeWithMiddleware(opCtx, async () => {
            // Fetch previous data for hooks that need it
            let previousData: any;
            if (driver?.findOne) {
              try { previousData = await driver.findOne(name, { _id: id }); } catch (_e) { /* ignore */ }
            }
            const hookContext: any = {
              object: name, event: 'beforeUpdate',
              input: { id, data: opCtx.data }, session: options,
              data: opCtx.data, previousData, user: options.userId ? { id: options.userId } : options.user
            };
            await this.triggerHooks('beforeUpdate', hookContext);
            const finalData = hookContext.data || hookContext.input.data;
            const result = driver?.update ? await driver.update(name, id, finalData, options) : finalData;
            hookContext.event = 'afterUpdate';
            hookContext.result = result;
            await this.triggerHooks('afterUpdate', hookContext);
            return hookContext.result;
          });
          return opCtx.result;
        },
        delete: async (id: string) => {
          const driver = this.drivers.get(this.defaultDriver || this.drivers.keys().next().value);
          const opCtx = { object: name, operation: 'delete', context: options, result: undefined as any };
          await this.executeWithMiddleware(opCtx, async () => {
            // Fetch current data for hooks that need it
            let previousData: any;
            if (driver?.findOne) {
              try { previousData = await driver.findOne(name, { _id: id }); } catch (_e) { /* ignore */ }
            }
            const hookContext: any = {
              object: name, event: 'beforeDelete',
              input: { id }, session: options,
              data: previousData, previousData, user: options.userId ? { id: options.userId } : options.user
            };
            await this.triggerHooks('beforeDelete', hookContext);
            const result = driver?.delete ? await driver.delete(name, id) : true;
            hookContext.event = 'afterDelete';
            hookContext.result = result;
            await this.triggerHooks('afterDelete', hookContext);
            return hookContext.result;
          });
          return opCtx.result;
        },
        count: async (filter?: any) => {
          const driver = this.drivers.get(this.defaultDriver || this.drivers.keys().next().value);
          if (driver?.count) {
            return driver.count(name, filter);
          }
          // Fallback: use find and count
          const results = driver?.find ? await driver.find(name, filter) : [];
          return Array.isArray(results) ? results.length : 0;
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
