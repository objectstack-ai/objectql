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
            object: objectName,
            ...query
        };

        // Ensure where is properly formatted
        if (query.where) {
            ast.where = this.filterTranslator.translate(query.where);
        }

        return ast;
    }
}
