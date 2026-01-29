/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import { spawn } from 'child_process';

interface TestOptions {
    dir?: string;
    watch?: boolean;
    coverage?: boolean;
    runner?: string;
}

/**
 * Test command - runs tests for the ObjectQL project
 */
export async function test(options: TestOptions) {
    console.log(chalk.blue('🧪 Running tests...\n'));
    
    const rootDir = path.resolve(process.cwd(), options.dir || '.');
    
    // Look for package.json to determine test runner
    const packageJsonPath = path.join(rootDir, 'package.json');
    
    try {
        if (!fs.existsSync(packageJsonPath)) {
            showNoTestConfig();
            return;
        }
        
        let packageJson: any;
        try {
            packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        } catch (parseError: any) {
            console.error(chalk.yellow(`⚠️  Failed to parse package.json: ${parseError.message}`));
            showNoTestConfig();
            return;
        }
        
        // Detect test runner or use specified one
        const hasJest = packageJson.devDependencies?.jest || packageJson.dependencies?.jest || packageJson.jest;
        const hasVitest = packageJson.devDependencies?.vitest || packageJson.dependencies?.vitest;
        
        let runner = options.runner;
        if (!runner) {
            // Auto-detect test runner
            if (hasVitest) {
                runner = 'vitest';
            } else if (hasJest) {
                runner = 'jest';
            }
        }
        
        // Run Jest
        if (runner === 'jest' && hasJest) {
            const jestArgs = ['jest'];
            
            if (options.watch) {
                jestArgs.push('--watch');
            }
            
            if (options.coverage) {
                jestArgs.push('--coverage');
            }
            
            console.log(chalk.cyan(`Running: ${jestArgs.join(' ')}\n`));
            
            const jestProcess = spawn('npx', jestArgs, {
                cwd: rootDir,
                stdio: 'inherit',
                shell: true
            });
            
            jestProcess.on('exit', (code) => {
                if (code !== 0) {
                    console.error(chalk.red(`\n❌ Tests failed with exit code ${code}`));
                    process.exit(code || 1);
                } else {
                    console.log(chalk.green('\n✅ All tests passed!'));
                }
            });
            
            return;
        }
        
        // Run Vitest
        if (runner === 'vitest' && hasVitest) {
            const vitestArgs = ['vitest'];
            
            if (options.watch) {
                vitestArgs.push('--watch');
            } else {
                vitestArgs.push('run');
            }
            
            if (options.coverage) {
                vitestArgs.push('--coverage');
            }
            
            console.log(chalk.cyan(`Running: ${vitestArgs.join(' ')}\n`));
            
            const vitestProcess = spawn('npx', vitestArgs, {
                cwd: rootDir,
                stdio: 'inherit',
                shell: true
            });
            
            vitestProcess.on('exit', (code) => {
                if (code !== 0) {
                    console.error(chalk.red(`\n❌ Tests failed with exit code ${code}`));
                    process.exit(code || 1);
                } else {
                    console.log(chalk.green('\n✅ All tests passed!'));
                }
            });
            
            return;
        }
        
        // Fall back to package.json test script
        if (packageJson.scripts?.test) {
            console.log(chalk.cyan(`Running: npm test\n`));
            
            const npmProcess = spawn('npm', ['test'], {
                cwd: rootDir,
                stdio: 'inherit',
                shell: true
            });
            
            npmProcess.on('exit', (code) => {
                if (code !== 0) {
                    console.error(chalk.red(`\n❌ Tests failed with exit code ${code}`));
                    process.exit(code || 1);
                } else {
                    console.log(chalk.green('\n✅ All tests passed!'));
                }
            });
            
            return;
        }
        
        // No test configuration found
        showNoTestConfig();
        
    } catch (e: any) {
        console.error(chalk.red('❌ Test execution failed:'), e.message);
        process.exit(1);
    }
}

function showNoTestConfig() {
    console.log(chalk.yellow('⚠️  No test configuration found'));
    console.log(chalk.gray('To add tests to your project:'));
    console.log(chalk.gray('  1. Install jest: npm install --save-dev jest @types/jest ts-jest'));
    console.log(chalk.gray('     Or install vitest: npm install --save-dev vitest'));
    console.log(chalk.gray('  2. Create a jest.config.js or vitest.config.ts file'));
    console.log(chalk.gray('  3. Add a test script to package.json'));
}
