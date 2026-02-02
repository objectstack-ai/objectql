/**
 * FilterCondition Evaluation and Conversion Utilities
 * 
 * Provides utilities to evaluate and convert filter conditions:
 * - MongoDB-style query evaluation
 * - SQL WHERE clause conversion
 * - Legacy filter format conversion
 */

/**
 * Filter condition in MongoDB-style format
 */
export interface FilterCondition {
    [key: string]: any;
    $and?: FilterCondition[];
    $or?: FilterCondition[];
    $not?: FilterCondition;
}

/**
 * Comparison operators mapping
 */
export const COMPARISON_OPERATORS = {
    $eq: '=',
    $ne: '!=',
    $gt: '>',
    $gte: '>=',
    $lt: '<',
    $lte: '<=',
    $in: 'IN',
    $nin: 'NOT IN',
    $like: 'LIKE',
    $regex: 'REGEX'
} as const;

/**
 * Evaluate a filter condition against a record
 * 
 * @param record - The record to evaluate
 * @param condition - The filter condition (MongoDB-style)
 * @returns true if record matches the condition
 */
export function evaluateFilter(record: any, condition: FilterCondition): boolean {
    if (!condition || Object.keys(condition).length === 0) {
        return true;
    }
    
    // Handle logical operators
    if (condition.$and) {
        return condition.$and.every(cond => evaluateFilter(record, cond));
    }
    
    if (condition.$or) {
        return condition.$or.some(cond => evaluateFilter(record, cond));
    }
    
    if (condition.$not) {
        return !evaluateFilter(record, condition.$not);
    }
    
    // Handle field comparisons
    for (const [field, value] of Object.entries(condition)) {
        if (field.startsWith('$')) {
            continue; // Skip logical operators already handled
        }
        
        const recordValue = getNestedValue(record, field);
        
        // Direct equality
        if (typeof value !== 'object' || value === null) {
            if (recordValue !== value) {
                return false;
            }
            continue;
        }
        
        // Comparison operators
        for (const [operator, operatorValue] of Object.entries(value)) {
            if (!evaluateComparison(recordValue, operator, operatorValue)) {
                return false;
            }
        }
    }
    
    return true;
}

/**
 * Evaluate a single comparison operation
 * 
 * @param value - The value from the record
 * @param operator - The comparison operator ($eq, $gt, etc.)
 * @param targetValue - The value to compare against
 * @returns true if comparison is satisfied
 */
function evaluateComparison(value: any, operator: string, targetValue: any): boolean {
    switch (operator) {
        case '$eq':
            return value === targetValue;
        case '$ne':
            return value !== targetValue;
        case '$gt':
            return value > targetValue;
        case '$gte':
            return value >= targetValue;
        case '$lt':
            return value < targetValue;
        case '$lte':
            return value <= targetValue;
        case '$in':
            return Array.isArray(targetValue) && targetValue.includes(value);
        case '$nin':
            return Array.isArray(targetValue) && !targetValue.includes(value);
        case '$like':
            if (typeof value !== 'string') return false;
            const pattern = targetValue.replace(/%/g, '.*');
            return new RegExp(pattern, 'i').test(value);
        case '$regex':
            if (typeof value !== 'string') return false;
            return new RegExp(targetValue).test(value);
        default:
            return true;
    }
}

/**
 * Get nested value from an object using dot notation
 * 
 * @param obj - The object to extract from
 * @param path - The path in dot notation (e.g., 'user.address.city')
 * @returns The value at the path, or undefined
 */
function getNestedValue(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
        if (current === null || current === undefined) {
            return undefined;
        }
        current = current[part];
    }
    
    return current;
}

/**
 * Check if a value is a FilterCondition object (MongoDB-style query)
 * 
 * @param value - Value to check
 * @returns true if value is a FilterCondition
 */
export function isFilterCondition(value: any): value is FilterCondition {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }
    
    // Check for MongoDB-style operators
    const keys = Object.keys(value);
    if (keys.length === 0) {
        return true; // Empty object is valid
    }
    
    // Has logical operators
    if (value.$and || value.$or || value.$not) {
        return true;
    }
    
    // Has field with comparison operators
    for (const key of keys) {
        const fieldValue = value[key];
        if (typeof fieldValue === 'object' && fieldValue !== null) {
            const fieldKeys = Object.keys(fieldValue);
            if (fieldKeys.some(k => k.startsWith('$'))) {
                return true;
            }
        }
    }
    
    // Simple equality conditions are also valid
    return true;
}

/**
 * Convert legacy filter array to FilterCondition
 * 
 * Legacy format: [['field', 'operator', value], 'or', ['field2', 'operator', value2]]
 * 
 * @param filters - Filter array in legacy format
 * @returns FilterCondition object
 */
export function convertLegacyFilters(filters: any[]): FilterCondition {
    if (!Array.isArray(filters) || filters.length === 0) {
        return {};
    }
    
    const conditions: FilterCondition[] = [];
    let currentLogic: '$and' | '$or' = '$and';
    
    for (let i = 0; i < filters.length; i++) {
        const item = filters[i];
        
        // Logical operator
        if (typeof item === 'string' && (item === 'and' || item === 'or')) {
            currentLogic = item === 'or' ? '$or' : '$and';
            continue;
        }
        
        // Filter condition
        if (Array.isArray(item) && item.length === 3) {
            const [field, operator, value] = item;
            const mongoOperator = `$${operator}` as keyof typeof COMPARISON_OPERATORS;
            
            conditions.push({
                [field]: { [mongoOperator]: value }
            });
        }
    }
    
    if (conditions.length === 0) {
        return {};
    }
    
    if (conditions.length === 1) {
        return conditions[0];
    }
    
    return { [currentLogic]: conditions };
}

/**
 * Filter an array of records using a FilterCondition
 * 
 * @param records - Array of records to filter
 * @param condition - Filter condition to apply
 * @returns Filtered array
 */
export function filterRecords<T>(records: T[], condition: FilterCondition): T[] {
    if (!condition || Object.keys(condition).length === 0) {
        return records;
    }
    
    return records.filter(record => evaluateFilter(record, condition));
}
