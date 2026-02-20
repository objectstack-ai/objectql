/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Result Mapper — libSQL rows → ObjectStack records
 *
 * Handles deserialization of SQLite values back to ObjectStack types,
 * including JSON parsing and boolean conversion.
 */

/**
 * Convert a libSQL result row to an ObjectStack record.
 *
 * @param row - Raw row object from libSQL result
 * @param jsonFields - Set of field names that contain JSON data
 * @param booleanFields - Set of field names that contain boolean data
 * @returns Deserialized record
 */
export function mapRow(
    row: Record<string, unknown>,
    jsonFields?: ReadonlySet<string>,
    booleanFields?: ReadonlySet<string>
): Record<string, unknown> {
    const record: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(row)) {
        if (jsonFields?.has(key) && typeof value === 'string') {
            try {
                record[key] = JSON.parse(value);
            } catch {
                record[key] = value;
            }
        } else if (booleanFields?.has(key)) {
            record[key] = value === 1 || value === true;
        } else {
            record[key] = value;
        }
    }

    return record;
}

/**
 * Convert multiple libSQL result rows to ObjectStack records.
 */
export function mapRows(
    rows: Record<string, unknown>[],
    jsonFields?: ReadonlySet<string>,
    booleanFields?: ReadonlySet<string>
): Record<string, unknown>[] {
    return rows.map(row => mapRow(row, jsonFields, booleanFields));
}

/**
 * Serialize a record value for insertion into SQLite.
 *
 * @param value - The value to serialize
 * @param fieldName - The field name (for JSON/boolean detection)
 * @param jsonFields - Set of field names that should be JSON-serialized
 * @param booleanFields - Set of field names that should be 0/1
 * @returns The serialized value suitable for libSQL parameter binding
 */
export function serializeValue(
    value: unknown,
    fieldName: string,
    jsonFields?: ReadonlySet<string>,
    booleanFields?: ReadonlySet<string>
): unknown {
    if (value === null || value === undefined) {
        return null;
    }

    if (jsonFields?.has(fieldName)) {
        return typeof value === 'string' ? value : JSON.stringify(value);
    }

    if (booleanFields?.has(fieldName)) {
        return value ? 1 : 0;
    }

    return value;
}

/**
 * Serialize an entire record for insertion/update.
 */
export function serializeRecord(
    data: Record<string, unknown>,
    jsonFields?: ReadonlySet<string>,
    booleanFields?: ReadonlySet<string>
): Record<string, unknown> {
    const serialized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
        serialized[key] = serializeValue(value, key, jsonFields, booleanFields);
    }

    return serialized;
}
