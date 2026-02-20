/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Type Mapper — ObjectStack field types → SQLite/libSQL column types
 *
 * Turso/libSQL is SQLite-compatible, so we map ObjectStack field types
 * to the standard SQLite affinity types.
 */

/**
 * Map ObjectStack field type to SQLite column type.
 *
 * SQLite uses type affinity — the actual storage class is inferred from
 * the declared column type. We use standard SQL type names that SQLite
 * recognizes for correct affinity.
 */
export function fieldTypeToSqlite(fieldType: string): string {
    switch (fieldType) {
        // Text types
        case 'text':
        case 'string':
        case 'textarea':
        case 'richtext':
        case 'html':
        case 'markdown':
        case 'url':
        case 'email':
        case 'phone':
        case 'select':
        case 'lookup':
        case 'master_detail':
        case 'autonumber':
            return 'TEXT';

        // Numeric types
        case 'number':
        case 'integer':
        case 'int':
            return 'INTEGER';

        case 'float':
        case 'decimal':
        case 'currency':
        case 'percent':
            return 'REAL';

        // Boolean
        case 'boolean':
        case 'toggle':
            return 'INTEGER'; // SQLite stores booleans as 0/1

        // Date/Time
        case 'date':
        case 'datetime':
        case 'timestamp':
        case 'time':
            return 'TEXT'; // ISO 8601 strings

        // JSON/Complex
        case 'json':
        case 'object':
        case 'array':
        case 'multiselect':
            return 'TEXT'; // JSON serialized

        // Binary
        case 'blob':
        case 'binary':
        case 'image':
        case 'file':
            return 'BLOB';

        default:
            return 'TEXT';
    }
}

/**
 * JSON field types — fields that should be JSON serialized/deserialized.
 */
const JSON_FIELD_TYPES = new Set([
    'json', 'object', 'array', 'multiselect'
]);

/**
 * Boolean field types — fields stored as INTEGER 0/1 in SQLite.
 */
const BOOLEAN_FIELD_TYPES = new Set([
    'boolean', 'toggle'
]);

/**
 * Check if a field type requires JSON serialization.
 */
export function isJsonFieldType(fieldType: string): boolean {
    return JSON_FIELD_TYPES.has(fieldType);
}

/**
 * Check if a field type is stored as a boolean (INTEGER 0/1).
 */
export function isBooleanFieldType(fieldType: string): boolean {
    return BOOLEAN_FIELD_TYPES.has(fieldType);
}
