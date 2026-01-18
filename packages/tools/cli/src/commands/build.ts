/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ObjectQL } from '@objectql/core';
import { ObjectLoader } from '@objectql/platform-node';
import { generateTypes } from './generate';
import * as path from 'path';
import * as fs from 'fs';
import glob from 'fast-glob';
import chalk from 'chalk';

interface BuildOptions {
    dir?: string;
    output?: string;
    types?: boolean;
    validate?: boolean;
}

/**
 * Build command - validates metadata and generates TypeScript types
 * Prepares the project for production deployment
 */
export async function build(options: BuildOptions) {
    console.log(chalk.blue('🔨 Building ObjectQL project...\n'));
    
    const rootDir = path.resolve(process.cwd(), options.dir || '.');
    const outputDir = path.resolve(process.cwd(), options.output || './dist');
    
    // Step 1: Validate metadata
    if (options.validate !== false) {
        console.log(chalk.cyan('1️⃣  Validating metadata files...'));
        
        try {
            const app = new ObjectQL({ datasources: {} });
            const loader = new ObjectLoader(app.metadata);
            loader.load(rootDir);
            console.log(chalk.green('   ✅ Metadata validation passed\n'));
        } catch (e: any) {
            console.error(chalk.red('   ❌ Metadata validation failed:'), e.message);
            process.exit(1);
        }
    }
    
    // Step 2: Generate TypeScript types
    if (options.types !== false) {
        console.log(chalk.cyan('2️⃣  Generating TypeScript types...'));
        
        try {
            const typesOutput = path.join(outputDir, 'types');
            await generateTypes(rootDir, typesOutput);
            console.log(chalk.green(`   ✅ Types generated at ${typesOutput}\n`));
        } catch (e: any) {
            console.error(chalk.red('   ❌ Type generation failed:'), e.message);
            process.exit(1);
        }
    }
    
    // Step 3: Copy metadata files to dist
    console.log(chalk.cyan('3️⃣  Copying metadata files...'));
    
    try {
        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Copy .yml files
        const metadataPatterns = [
            '**/*.object.yml',
            '**/*.validation.yml',
            '**/*.permission.yml',
            '**/*.hook.yml',
            '**/*.action.yml',
            '**/*.app.yml'
        ];
        
        let fileCount = 0;
        const files = await glob(metadataPatterns, { cwd: rootDir });
        
        for (const file of files) {
            const srcPath = path.join(rootDir, file);
            const destPath = path.join(outputDir, file);
            const destDir = path.dirname(destPath);
            
            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }
            
            fs.copyFileSync(srcPath, destPath);
            fileCount++;
        }
        
        console.log(chalk.green(`   ✅ Copied ${fileCount} metadata files\n`));
    } catch (e: any) {
        console.error(chalk.red('   ❌ Failed to copy metadata files:'), e.message);
        process.exit(1);
    }
    
    console.log(chalk.green.bold('✨ Build completed successfully!\n'));
    console.log(chalk.gray(`Output directory: ${outputDir}`));
}
