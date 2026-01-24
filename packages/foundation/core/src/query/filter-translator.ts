/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Filter } from '@objectql/types';
import type { FilterNode } from '@objectstack/spec/data';
import { ObjectQLError } from '@objectql/types';

/**
 * Filter Translator
 * 
 * Translates ObjectQL Filter (FilterCondition) to ObjectStack FilterNode format.
 * Converts modern object-based syntax to legacy array-based syntax for backward compatibility.
 * 
 * @example
 * Input:  { age: { $gte: 18 }, $or: [{ status: "active" }, { role: "admin" }] }
 * Output: [["age", ">=", 18], "or", [["status", "=", "active"], "or", ["role", "=", "admin"]]]
 */
export class FilterTranslator {
    /**
     * Translate filters from ObjectQL format to ObjectStack FilterNode format
     */
    translate(filters?: Filter): FilterNode | undefined {
        if (!filters) {
            return undefined;
        }

        // Backward compatibility: if it's already an array (old format), pass through
        if (Array.isArray(filters)) {
            return filters as unknown as FilterNode;
        }

        // If it's an empty object, return undefined
        if (typeof filters === 'object' && Object.keys(filters).length === 0) {
            return undefined;
        }

        return this.convertToNode(filters);
    }

    /**
     * Recursively converts FilterCondition to FilterNode array format
     */
    private convertToNode(filter: Filter): FilterNode {
        const nodes: any[] = [];
        
        // Process logical operators first
        if (filter.$and) {
            const andNodes = filter.$and.map((f: Filter) => this.convertToNode(f));
            nodes.push(...this.interleaveWithOperator(andNodes, 'and'));
        }
        
        if (filter.$or) {
            const orNodes = filter.$or.map((f: Filter) => this.convertToNode(f));
            if (nodes.length > 0) {
                nodes.push('and');
            }
            nodes.push(...this.interleaveWithOperator(orNodes, 'or'));
        }
        
        // Note: $not operator is not currently supported in the legacy FilterNode format
        if (filter.$not) {
            throw new ObjectQLError({
                code: 'UNSUPPORTED_OPERATOR',
                message: '$not operator is not supported. Use $ne for field negation instead.'
            });
        }
        
        // Process field conditions
        for (const [field, value] of Object.entries(filter)) {
            if (field.startsWith('$')) {
                continue; // Skip logical operators (already processed)
            }
            
            if (nodes.length > 0) {
                nodes.push('and');
            }
            
            // Handle field value
            if (value === null || value === undefined) {
                nodes.push([field, '=', value]);
            } else if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
                // Explicit operators - multiple operators on same field are AND-ed together
                const entries = Object.entries(value);
                for (let i = 0; i < entries.length; i++) {
                    const [op, opValue] = entries[i];
                    
                    // Add 'and' before each operator (except the very first node)
                    if (nodes.length > 0 || i > 0) {
                        nodes.push('and');
                    }
                    
                    const legacyOp = this.mapOperatorToLegacy(op);
                    nodes.push([field, legacyOp, opValue]);
                }
            } else {
                // Implicit equality
                nodes.push([field, '=', value]);
            }
        }
        
        // Return as FilterNode (type assertion for backward compatibility)
        return (nodes.length === 1 ? nodes[0] : nodes) as unknown as FilterNode;
    }
    
    /**
     * Interleaves filter nodes with a logical operator
     */
    private interleaveWithOperator(nodes: FilterNode[], operator: string): any[] {
        if (nodes.length === 0) return [];
        if (nodes.length === 1) return [nodes[0]];
        
        const result: any[] = [nodes[0]];
        for (let i = 1; i < nodes.length; i++) {
            result.push(operator, nodes[i]);
        }
        return result;
    }
    
    /**
     * Maps modern $-prefixed operators to legacy format
     */
    private mapOperatorToLegacy(operator: string): string {
        const mapping: Record<string, string> = {
            '$eq': '=',
            '$ne': '!=',
            '$gt': '>',
            '$gte': '>=',
            '$lt': '<',
            '$lte': '<=',
            '$in': 'in',
            '$nin': 'nin',
            '$contains': 'contains',
            '$startsWith': 'startswith',
            '$endsWith': 'endswith',
            '$null': 'is_null',
            '$exist': 'is_not_null',
            '$between': 'between',
        };
        
        return mapping[operator] || operator.replace('$', '');
    }
}
