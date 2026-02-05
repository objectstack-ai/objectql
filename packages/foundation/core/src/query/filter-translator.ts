/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Filter } from '@objectql/types';
import { Data } from '@objectstack/spec';
import { z } from 'zod';
import { ObjectQLError } from '@objectql/types';

/**
 * Filter Translator
 * 
 * Translates ObjectQL Filter to ObjectStack FilterCondition format.
 * Since both now use the same format, this is mostly a pass-through.
 * 
 * @example
 * Input:  { age: { $gte: 18 }, $or: [{ status: "active" }, { role: "admin" }] }
 * Output: { age: { $gte: 18 }, $or: [{ status: "active" }, { role: "admin" }] }
 */
export class FilterTranslator {
    /**
     * Translate filters from ObjectQL format to ObjectStack FilterCondition format
     */
    translate(filters?: Filter): Filter | undefined {
        if (!filters) {
            return undefined;
        }

        // If it's an empty object, return undefined
        if (typeof filters === 'object' && Object.keys(filters).length === 0) {
            return undefined;
        }

        // Both ObjectQL Filter and ObjectStack FilterCondition use the same format now
        return filters;
    }
}
