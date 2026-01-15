import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import * as yaml from 'js-yaml';

interface FormatOptions {
    dir?: string;
    check?: boolean;
}

/**
 * Format command - formats metadata files using Prettier
 */
export async function format(options: FormatOptions) {
    console.log(chalk.blue('🎨 Formatting ObjectQL metadata files...\n'));
    
    const rootDir = path.resolve(process.cwd(), options.dir || '.');
    let formattedCount = 0;
    let unchangedCount = 0;
    let errorCount = 0;
    
    try {
        const glob = require('fast-glob');
        const files = await glob(['**/*.yml', '**/*.yaml'], { 
            cwd: rootDir,
            ignore: ['node_modules/**', 'dist/**', 'build/**']
        });
        
        console.log(chalk.cyan(`Found ${files.length} YAML file(s)\n`));
        
        for (const file of files) {
            const filePath = path.join(rootDir, file);
            
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                
                // Parse to validate YAML
                yaml.load(content);
                
                // Format with Prettier (using require instead of import for better compatibility)
                const prettierFormat = require('prettier').format;
                const formatted = await prettierFormat(content, {
                    parser: 'yaml',
                    printWidth: 80,
                    tabWidth: 2,
                    singleQuote: true
                });
                
                if (content !== formatted) {
                    if (options.check) {
                        console.log(chalk.yellow(`  ⚠️  ${file} needs formatting`));
                        formattedCount++;
                    } else {
                        fs.writeFileSync(filePath, formatted, 'utf-8');
                        console.log(chalk.green(`  ✅ ${file}`));
                        formattedCount++;
                    }
                } else {
                    unchangedCount++;
                    if (!options.check) {
                        console.log(chalk.gray(`  ✓  ${file}`));
                    }
                }
            } catch (e: any) {
                console.error(chalk.red(`  ❌ ${file}: ${e.message}`));
                errorCount++;
            }
        }
        
        console.log('');
        
        // Summary
        if (options.check) {
            if (formattedCount > 0) {
                console.log(chalk.yellow.bold(`⚠️  ${formattedCount} file(s) need formatting`));
                console.log(chalk.gray('Run without --check to format files\n'));
                process.exit(1);
            } else {
                console.log(chalk.green.bold('✅ All files are properly formatted!\n'));
            }
        } else {
            console.log(chalk.cyan('Summary:'));
            console.log(chalk.green(`  ✅ Formatted: ${formattedCount}`));
            console.log(chalk.gray(`  ✓  Unchanged: ${unchangedCount}`));
            if (errorCount > 0) {
                console.log(chalk.red(`  ❌ Errors: ${errorCount}`));
            }
            console.log('');
            
            if (errorCount > 0) {
                process.exit(1);
            }
        }
        
    } catch (e: any) {
        console.error(chalk.red('❌ Format failed:'), e.message);
        process.exit(1);
    }
}
