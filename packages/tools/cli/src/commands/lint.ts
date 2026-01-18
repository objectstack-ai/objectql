/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ObjectQL } from '@objectql/core';
import { ObjectLoader } from '@objectql/platform-node';
import { ObjectConfig, FieldConfig } from '@objectql/types';
import * as path from 'path';
import chalk from 'chalk';

// Naming convention regex
const VALID_NAME_REGEX = /^[a-z][a-z0-9_]*$/;

interface LintOptions {
    dir?: string;
    fix?: boolean;
}

/**
 * Lint command - validates metadata files for correctness and best practices
 */
export async function lint(options: LintOptions) {
    console.log(chalk.blue('🔍 Linting ObjectQL metadata files...\n'));
    
    const rootDir = path.resolve(process.cwd(), options.dir || '.');
    let hasErrors = false;
    let hasWarnings = false;
    
    try {
        const app = new ObjectQL({ datasources: {} });
        const loader = new ObjectLoader(app.metadata);
        
        console.log(chalk.cyan('Loading metadata files...'));
        loader.load(rootDir);
        
        const objects = app.metadata.list('object');
        
        console.log(chalk.green(`✅ Found ${objects.length} object(s)\n`));
        
        // Validate each object
        for (const obj of objects) {
            const objectConfig = obj as ObjectConfig;
            const name = objectConfig.name;
            console.log(chalk.cyan(`Checking object: ${name}`));
            
            // Check naming convention (lowercase with underscores)
            if (!VALID_NAME_REGEX.test(name)) {
                console.log(chalk.red(`  ❌ Invalid name format: "${name}" should be lowercase with underscores`));
                hasErrors = true;
            }
            
            // Check if label exists
            if (!objectConfig.label) {
                console.log(chalk.yellow(`  ⚠️  Missing label for object "${name}"`));
                hasWarnings = true;
            }
            
            // Check fields
            const fieldCount = Object.keys(objectConfig.fields || {}).length;
            if (fieldCount === 0) {
                console.log(chalk.yellow(`  ⚠️  Object "${name}" has no fields defined`));
                hasWarnings = true;
            } else {
                console.log(chalk.gray(`  ℹ️  ${fieldCount} field(s) defined`));
            }
            
            // Validate field names
            for (const [fieldName, field] of Object.entries(objectConfig.fields || {})) {
                if (!VALID_NAME_REGEX.test(fieldName)) {
                    console.log(chalk.red(`  ❌ Invalid field name: "${fieldName}" should be lowercase with underscores`));
                    hasErrors = true;
                }
                
                const fieldConfig = field as FieldConfig;
                // Check for required label on fields
                if (!fieldConfig.label) {
                    console.log(chalk.yellow(`  ⚠️  Field "${fieldName}" missing label`));
                    hasWarnings = true;
                }
            }
            
            console.log('');
        }
        
        // Summary
        if (hasErrors) {
            console.log(chalk.red.bold('❌ Linting failed with errors\n'));
            process.exit(1);
        } else if (hasWarnings) {
            console.log(chalk.yellow.bold('⚠️  Linting completed with warnings\n'));
        } else {
            console.log(chalk.green.bold('✅ Linting passed - no issues found!\n'));
        }
        
    } catch (e: any) {
        console.error(chalk.red('❌ Linting failed:'), e.message);
        if (e.stack) {
            console.error(chalk.gray(e.stack));
        }
        process.exit(1);
    }
}
