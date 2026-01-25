/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { UnifiedQuery } from '@objectql/types';
import { Data } from '@objectstack/spec';
type QueryAST = Data.QueryAST;
import { FilterTranslator } from './filter-translator';

/**
 * Query Builder
 * 
 * Builds ObjectStack QueryAST from ObjectQL UnifiedQuery.
 * This is the central query construction module for ObjectQL.
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
     * @param query - ObjectQL UnifiedQuery
     * @returns ObjectStack QueryAST
     */
    build(objectName: string, query: UnifiedQuery): QueryAST {
        const ast: QueryAST = {
            object: objectName,
        };

        // Map fields
        if (query.fields) {
            ast.fields = query.fields;
        }

        // Map filters using FilterTranslator
        if (query.filters) {
            ast.where = this.filterTranslator.translate(query.filters);
        }

        // Map sort
        if (query.sort) {
            ast.orderBy = query.sort.map(([field, order]) => ({
                field,
                order: order as 'asc' | 'desc'
            }));
        }

        // Map pagination
        if (query.limit !== undefined) {
            ast.limit = query.limit;
        }
        if (query.skip !== undefined) {
            ast.offset = query.skip;
        }

        // Map groupBy
        if (query.groupBy) {
            ast.groupBy = query.groupBy;
        }

        // Map aggregations
        if (query.aggregate) {
            ast.aggregations = query.aggregate.map(agg => ({
                function: agg.func as any,
                field: agg.field,
                alias: agg.alias || `${agg.func}_${agg.field}`
            }));
        }

        return ast;
    }
}
