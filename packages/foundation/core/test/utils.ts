/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Driver } from '@objectql/types';

export class MockDriver implements Driver {
    private data: Record<string, any[]> = {};
    
    constructor() {}

    private getData(objectName: string) {
        if (!this.data[objectName]) {
            this.data[objectName] = [];
        }
        return this.data[objectName];
    }

    async find(objectName: string, query: any, options?: any): Promise<any[]> {
        return this.getData(objectName);
    }

    async findOne(objectName: string, id: string | number, query?: any, options?: any): Promise<any> {
        return this.getData(objectName).find(item => item.id == id);
    }

    async create(objectName: string, data: any, options?: any): Promise<any> {
        const list = this.getData(objectName);
        if (!data.id) data.id = list.length + 1;
        list.push(data);
        return data;
    }

    async update(objectName: string, id: string | number, data: any, options?: any): Promise<any> {
        const list = this.getData(objectName);
        const idx = list.findIndex(item => item.id == id);
        if (idx >= 0) {
            list[idx] = { ...list[idx], ...data };
            return list[idx];
        }
        return null;
    }

    async delete(objectName: string, id: string | number, options?: any): Promise<any> {
        const list = this.getData(objectName);
        const idx = list.findIndex(item => item.id == id);
        if (idx >= 0) {
            const deleted = list[idx];
            list.splice(idx, 1);
            return deleted;
        }
        return null;
    }

    async count(objectName: string, filters: any, options?: any): Promise<number> {
        return this.getData(objectName).length;
    }
}
