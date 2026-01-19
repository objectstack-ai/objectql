/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import * as yaml from 'js-yaml';
import { IntrospectedSchema, IntrospectedTable, IntrospectedColumn, ObjectConfig, IObjectQL, FieldConfig, FieldType } from '@objectql/types';

interface SyncOptions {
    config?: string;
    output?: string;
    tables?: string[];
    force?: boolean;
    app?: IObjectQL; // Allow passing app instance directly for testing
}

/**
 * Sync database schema to ObjectQL .object.yml files
 * Introspects existing SQL database and generates object definitions
 */
export async function syncDatabase(options: SyncOptions) {
    const outputDir = path.resolve(process.cwd(), options.output || './src/objects');
    
    console.log(chalk.blue('🔄 Syncing database schema to ObjectQL...'));
    console.log(chalk.gray(`Output directory: ${outputDir}\n`));
    
    let app: IObjectQL | undefined = options.app;
    const shouldClose = !options.app; // Only close if we loaded it ourselves

    try {
        // Load ObjectQL instance from config if not provided
        if (!app) {
            app = await loadObjectQLInstance(options.config);
        }
        
        // Check if driver supports introspection
        const driver = app.datasource('default');
        if (!driver || !driver.introspectSchema) {
            const errorMsg = 'The configured driver does not support schema introspection. Only SQL drivers (PostgreSQL, MySQL, SQLite) support this feature.';
            console.error(chalk.red(`❌ ${errorMsg}`));
            throw new Error(errorMsg);
        }

        // Introspect database schema
        console.log(chalk.blue('📊 Introspecting database schema...'));
        const schema: IntrospectedSchema = await driver.introspectSchema();
        
        const tableNames = Object.keys(schema.tables);
        if (tableNames.length === 0) {
            console.log(chalk.yellow('⚠ No tables found in database'));
            return;
        }

        console.log(chalk.green(`✓ Found ${tableNames.length} table(s)\n`));

        // Filter tables if specified
        let tablesToSync = tableNames;
        if (options.tables && options.tables.length > 0) {
            tablesToSync = tableNames.filter(t => options.tables!.includes(t));
            if (tablesToSync.length === 0) {
                console.log(chalk.yellow('⚠ No matching tables found'));
                return;
            }
        }

        // Create output directory if it doesn't exist
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
            console.log(chalk.gray(`Created directory: ${outputDir}\n`));
        }

        // Generate .object.yml files
        let createdCount = 0;
        let skippedCount = 0;

        for (const tableName of tablesToSync) {
            const table = schema.tables[tableName];
            const filename = `${tableName}.object.yml`;
            const filePath = path.join(outputDir, filename);

            // Check if file already exists
            if (fs.existsSync(filePath) && !options.force) {
                console.log(chalk.yellow(`⊘ ${tableName} (file exists, use --force to overwrite)`));
                skippedCount++;
                continue;
            }

            // Generate object definition
            const objectDef = generateObjectDefinition(table, schema);
            
            // Write to file
            const yamlContent = yaml.dump(objectDef, {
                indent: 2,
                lineWidth: -1,
                noRefs: true,
                sortKeys: false
            });
            
            fs.writeFileSync(filePath, yamlContent, 'utf-8');
            
            console.log(chalk.green(`✓ ${tableName} → ${filename}`));
            createdCount++;
        }

        console.log(chalk.blue('\n📊 Summary:'));
        console.log(chalk.gray(`Total tables: ${tablesToSync.length}`));
        console.log(chalk.gray(`Created: ${createdCount}`));
        console.log(chalk.gray(`Skipped: ${skippedCount}`));
        
        if (createdCount > 0) {
            console.log(chalk.green(`\n✅ Successfully synced ${createdCount} table(s) to ${outputDir}`));
        }

    } catch (error: any) {
        console.error(chalk.red(`❌ Sync failed: ${error.message}`));
        if (error.stack) {
            console.error(chalk.gray(error.stack));
        }
        throw error;
    } finally {
        // Ensure connection is closed if we opened it
        if (shouldClose && app) {
            if (app.close) {
                await app.close();
            } else {
                // Fallback for older versions if close isn't available
                const driver = app.datasource('default');
                if (driver && (driver as any).disconnect) {
                    await (driver as any).disconnect();
                }
            }
        }
    }
}

/**
 * Generate ObjectQL object definition from introspected table
 */
function generateObjectDefinition(table: IntrospectedTable, schema: IntrospectedSchema): ObjectConfig {
    const obj: ObjectConfig = {
        name: table.name,
        label: formatLabel(table.name),
        fields: {}
    };

    // Process each column
    for (const column of table.columns) {
        // Skip system fields (id, created_at, updated_at) - they're automatic
        if (['id', 'created_at', 'updated_at'].includes(column.name)) {
            continue;
        }

        const field: Partial<FieldConfig> = {};
        
        // Check if this is a foreign key
        const fk = table.foreignKeys.find(fk => fk.columnName === column.name);
        if (fk) {
            // This is a lookup/relationship field
            field.type = 'lookup';
            field.reference_to = fk.referencedTable;
            
            // Add label
            field.label = formatLabel(column.name);
            
            // Add required constraint
            if (!column.nullable) {
                field.required = true;
            }
        } else {
            // Regular field - map SQL type to ObjectQL type
            const fieldType = mapSqlTypeToObjectQL(column.type, column);
            field.type = fieldType;
            
            // Add label
            field.label = formatLabel(column.name);
            
            // Add constraints
            if (!column.nullable) {
                field.required = true;
            }
            
            if (column.isUnique) {
                field.unique = true;
            }
            
            // Add maxLength for text-based fields
            if (column.maxLength && (fieldType === 'text' || fieldType === 'textarea')) {
                field.maxLength = column.maxLength;
            }
            
            if (column.defaultValue !== undefined && column.defaultValue !== null) {
                // Only include simple default values
                if (typeof column.defaultValue === 'string' || 
                    typeof column.defaultValue === 'number' || 
                    typeof column.defaultValue === 'boolean') {
                    field.defaultValue = column.defaultValue;
                }
            }
        }

        obj.fields[column.name] = field as FieldConfig;
    }

    return obj;
}

/**
 * Map SQL native type to ObjectQL field type
 */
function mapSqlTypeToObjectQL(sqlType: string, column: IntrospectedColumn): FieldType {
    const type = sqlType.toLowerCase();
    
    // Integer types - map to 'number'
    if (type.includes('int') || type.includes('serial') || type.includes('bigserial')) {
        return 'number';
    }
    
    // Float/Decimal types
    if (type.includes('float') || type.includes('double') || 
        type.includes('decimal') || type.includes('numeric') || type.includes('real')) {
        return 'number';
    }
    
    // Boolean
    if (type.includes('bool') || type === 'bit') {
        return 'boolean';
    }
    
    // Date/Time types
    if (type.includes('timestamp') || type.includes('datetime')) {
        return 'datetime';
    }
    if (type === 'date') {
        return 'date';
    }
    if (type === 'time') {
        return 'time';
    }
    
    // Text types
    if (type.includes('text') || type.includes('clob') || type.includes('long')) {
        return 'textarea';
    }
    
    // JSON types - map to 'object'
    if (type.includes('json') || type.includes('jsonb')) {
        return 'object';
    }
    
    // Binary/Blob types
    if (type.includes('blob') || type.includes('binary') || type.includes('bytea')) {
        return 'file';
    }
    
    // String types (varchar, char, etc.)
    // Default to 'text' for general string fields
    return 'text';
}

/**
 * Format table/column name to human-readable label
 * e.g., "user_profile" -> "User Profile"
 */
function formatLabel(name: string): string {
    return name
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Load ObjectQL instance from config file
 */
async function loadObjectQLInstance(configPath?: string): Promise<IObjectQL> {
    const cwd = process.cwd();
    
    // Try to load from config file
    let configFile = configPath;
    if (!configFile) {
        const potentialFiles = ['objectql.config.ts', 'objectql.config.js'];
        for (const file of potentialFiles) {
            if (fs.existsSync(path.join(cwd, file))) {
                configFile = path.join(cwd, file);
                break;
            }
        }
    } else if (!path.isAbsolute(configFile)) {
        // If configPath is provided but relative, make it absolute
        configFile = path.join(cwd, configFile);
    }

    if (!configFile) {
        throw new Error('No configuration file found (objectql.config.ts/js). Please create one with database connection.');
    }

    // Register ts-node for TypeScript support
    if (configFile.endsWith('.ts')) {
        try {
            require('ts-node').register({
                transpileOnly: true,
                compilerOptions: {
                    module: 'commonjs'
                }
            });
        } catch (err) {
            throw new Error('TypeScript config file detected but ts-node is not installed. Please run: npm install --save-dev ts-node');
        }
    }

    const configModule = require(configFile);
    
    // Clear cache to support multiple runs in same process (e.g. tests)
    try {
        const resolvedPath = require.resolve(configFile);
        delete require.cache[resolvedPath];
    } catch (e) {
        // Ignore resolution errors
    }

    // Support multiple export patterns: default, app, objectql, or db (in order of precedence)
    const app = configModule.default || configModule.app || configModule.objectql || configModule.db;

    if (!app) {
        throw new Error('Config file must export an ObjectQL instance as default export or named export (app/objectql/db)');
    }

    // Initialize app (but don't sync schema - we're reading it)
    await app.init();
    return app;
}
