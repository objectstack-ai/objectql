/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { UnifiedQuery } from "./query";

export interface IObjectRepository {
    find(query?: UnifiedQuery): Promise<any[]>;
    findOne(idOrQuery: string | number | UnifiedQuery): Promise<any>;
    count(filters: any): Promise<number>;
    create(doc: any): Promise<any>;
    update(id: string | number, doc: any, options?: any): Promise<any>;
    delete(id: string | number): Promise<any>;
    aggregate(query: any): Promise<any>;
    distinct(field: string, filters?: any): Promise<any[]>;
    findOneAndUpdate?(filters: any, update: any, options?: any): Promise<any>;
    createMany(data: any[]): Promise<any>;
    updateMany(filters: any, data: any): Promise<any>;
    deleteMany(filters: any): Promise<any>;
    execute(actionName: string, id: string | number | undefined, params: any): Promise<any>;
}
