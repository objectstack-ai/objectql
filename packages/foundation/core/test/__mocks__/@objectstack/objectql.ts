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
  constructor(public config: any) {}
  async connect() {}
  async disconnect() {}
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
  getItem: jest.fn((type: string, name: string) => {
    return mockStore.get(type)?.get(name);
  }),
  listItems: jest.fn((type: string) => {
    const items = mockStore.get(type);
    return items ? Array.from(items.values()) : [];
  }),
  metadata: {},
};
