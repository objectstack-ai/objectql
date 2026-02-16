/**
 * ObjectQL Utility Functions
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Pure utility functions for ObjectQL metadata processing.
 * Moved from @objectql/core as part of the deprecation plan (Phase C).
 */

import { ObjectConfig, FieldConfig, FieldType, IntrospectedSchema } from './index';

export function toTitleCase(str: string): string {
    return str
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Convert database type to ObjectQL field type.
 */
function mapDatabaseTypeToFieldType(dbType: string): FieldType {
    const type = dbType.toLowerCase();
    
    // Text types
    if (type.includes('char') || type.includes('varchar') || type.includes('text')) {
        if (type.includes('text')) return 'textarea';
        return 'text';
    }
    
    // Numeric types
    if (type.includes('int') || type === 'integer' || type === 'bigint' || type === 'smallint') {
        return 'number';
    }
    if (type.includes('float') || type.includes('double') || type.includes('decimal') || type.includes('numeric') || type === 'real') {
        return 'number';
    }
    
    // Boolean
    if (type.includes('bool')) {
        return 'boolean';
    }
    
    // Date/Time types
    if (type.includes('timestamp') || type === 'datetime') {
        return 'datetime';
    }
    if (type === 'date') {
        return 'date';
    }
    if (type === 'time') {
        return 'time';
    }
    
    // JSON types
    if (type === 'json' || type === 'jsonb') {
        return 'object';
    }
    
    // Default to text
    return 'text';
}

/**
 * Convert an introspected database schema to ObjectQL object configurations.
 * This allows using existing database tables without manually defining metadata.
 * 
 * @param introspectedSchema - The schema returned from driver.introspectSchema()
 * @param options - Optional configuration for the conversion
 * @returns Array of ObjectConfig that can be registered with ObjectQL
 */
export function convertIntrospectedSchemaToObjects(
    introspectedSchema: IntrospectedSchema,
    options?: {
        /** Tables to exclude from conversion */
        excludeTables?: string[];
        /** Tables to include (if specified, only these will be converted) */
        includeTables?: string[];
        /** Whether to skip system columns like id, created_at, updated_at */
        skipSystemColumns?: boolean;
    }
): ObjectConfig[] {
    const objects: ObjectConfig[] = [];
    const excludeTables = options?.excludeTables || [];
    const includeTables = options?.includeTables;
    const skipSystemColumns = options?.skipSystemColumns !== false;
    
    for (const [tableName, table] of Object.entries(introspectedSchema.tables)) {
        // Skip excluded tables
        if (excludeTables.includes(tableName)) {
            continue;
        }
        
        // If includeTables is specified, skip tables not in the list
        if (includeTables && !includeTables.includes(tableName)) {
            continue;
        }
        
        const fields: Record<string, FieldConfig> = {};
        
        // Convert columns to fields
        for (const column of table.columns) {
            // Skip system columns if requested
            if (skipSystemColumns && ['id', 'created_at', 'updated_at'].includes(column.name)) {
                continue;
            }
            
            // Check if this column is a foreign key
            const foreignKey = table.foreignKeys.find(fk => fk.columnName === column.name);
            
            let fieldConfig: FieldConfig;
            
            if (foreignKey) {
                // This is a lookup field
                // Note: name must be set explicitly here since we're creating the config programmatically.
                // When defined in YAML (ObjectConfig.fields Record), the name is auto-populated from the key.
                fieldConfig = {
                    name: column.name,
                    type: 'lookup',
                    reference_to: foreignKey.referencedTable,
                    label: toTitleCase(column.name),
                    required: !column.nullable,
                    searchable: false,
                    sortable: false
                };
            } else {
                // Regular field
                const fieldType = mapDatabaseTypeToFieldType(column.type);
                
                // Note: name must be set explicitly here since we're creating the config programmatically.
                // When defined in YAML (ObjectConfig.fields Record), the name is auto-populated from the key.
                fieldConfig = {
                    name: column.name,
                    type: fieldType,
                    label: toTitleCase(column.name),
                    required: !column.nullable,
                    searchable: false,
                    sortable: false
                };
                
                // Add unique constraint
                if (column.isUnique) {
                    fieldConfig.unique = true;
                }
                
                // Add max length for text fields
                if (column.maxLength && (fieldType === 'text' || fieldType === 'textarea')) {
                    fieldConfig.maxLength = column.maxLength;
                }
                
                // Add default value
                if (column.defaultValue != null) {
                    fieldConfig.defaultValue = column.defaultValue;
                }
            }
            
            fields[column.name] = fieldConfig;
        }
        
        // Create the object configuration
        const objectConfig: ObjectConfig = {
            name: tableName,
            label: toTitleCase(tableName),
            fields
        };
        
        objects.push(objectConfig);
    }
    
    return objects;
}
