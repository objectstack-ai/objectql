/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { UnifiedQuery, QueryAST } from '@objectql/types';
// import { QueryAST } from './types'; (Removed)

// Local QueryAST type extension to include all properties we need
// interface QueryAST extends Data.QueryAST {
//    top?: number;
//    expand?: Record<string, any>;
//    aggregations?: any[];
//    having?: any;
// }

import { FilterTranslator } from './filter-translator';

/**
 * Query Builder
 * 
 * Builds ObjectStack QueryAST from ObjectQL UnifiedQuery.
 * Since UnifiedQuery now uses the standard protocol format directly,
 * this is now a simple pass-through with object name injection.
 */
export class QueryBuilder {
    private filterTranslator: FilterTranslator;

    constructor() {
        this.filterTranslator = new FilterTranslator();
    }

    /**
     * Build a QueryAST from a UnifiedQuery
     * 
     * @param objectName - Target object name
     * @param query - ObjectQL UnifiedQuery (now in standard QueryAST format)
     * @returns ObjectStack QueryAST
     */
    build(objectName: string, query: UnifiedQuery): QueryAST {
        // UnifiedQuery now uses the same format as QueryAST
        // Just add the object name and pass through
        const ast: QueryAST = {
            object: objectName
        };

        // Map UnifiedQuery properties to QueryAST
        if (query.fields) ast.fields = query.fields;
        if (query.where) ast.where = this.filterTranslator.translate(query.where);
        if (query.orderBy) ast.orderBy = query.orderBy;
        if (query.offset !== undefined) ast.offset = query.offset;
        if (query.limit !== undefined) ast.top = query.limit; // UnifiedQuery uses 'limit', QueryAST uses 'top'
        if (query.expand) ast.expand = query.expand;
        if (query.groupBy) ast.groupBy = query.groupBy;
        if (query.aggregations) ast.aggregations = query.aggregations;
        if (query.having) ast.having = query.having;
        if (query.distinct) ast.distinct = query.distinct;

        return ast;
    }
}
