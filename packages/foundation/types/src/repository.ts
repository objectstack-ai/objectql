/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { UnifiedQuery, Filter } from "./query";

/**
 * Repository interface for CRUD operations on a single object type.
 * 
 * Note: `object` is used for filter/query parameters instead of `Record<string, unknown>`
 * because named TypeScript interfaces (e.g., UnifiedQuery, Filter) lack implicit index
 * signatures and are not assignable to `Record<string, unknown>`.
 * 
 * @typeParam T - The document shape returned by queries. Defaults to `Record<string, unknown>`.
 */
export interface IObjectRepository<T = Record<string, unknown>> {
    find(query?: UnifiedQuery): Promise<T[]>;
    findOne(idOrQuery: string | number | UnifiedQuery): Promise<T | null>;
    count(filters: Filter | object): Promise<number>;
    create(doc: Record<string, unknown>): Promise<T>;
    update(id: string | number, doc: Record<string, unknown>, options?: Record<string, unknown>): Promise<T>;
    delete(id: string | number): Promise<T>;
    aggregate(query: object): Promise<unknown[]>;
    distinct(field: string, filters?: Filter | object): Promise<unknown[]>;
    findOneAndUpdate?(filters: Filter | object, update: Record<string, unknown>, options?: Record<string, unknown>): Promise<T | null>;
    createMany(data: Record<string, unknown>[]): Promise<T[]>;
    updateMany(filters: Filter | object, data: Record<string, unknown>): Promise<unknown>;
    deleteMany(filters: Filter | object): Promise<unknown>;
    execute(actionName: string, id: string | number | undefined, params: Record<string, unknown>): Promise<unknown>;
}
