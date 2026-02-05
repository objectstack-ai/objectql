/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

interface DependencyCheck {
    name: string;
    required?: string;
    installed?: string;
    status: 'ok' | 'missing' | 'outdated' | 'warning';
}

interface DoctorOptions {
    cwd?: string;
}

export async function doctorCommand(options: DoctorOptions = {}) {
    console.log(chalk.blue('🩺 ObjectQL Doctor'));
    console.log(chalk.gray('Checking environment health...\n'));

    const cwd = options.cwd || process.cwd();

    let hasErrors = false;
    let hasWarnings = false;

    // 1. Check Node Version
    const nodeVersion = process.version;
    const nodeVersionMatch = nodeVersion.match(/^v(\d+)/);
    const nodeMajor = nodeVersionMatch ? parseInt(nodeVersionMatch[1]) : 0;
    
    if (nodeMajor >= 18) {
        console.log(`${chalk.green('✓')} Node.js: ${chalk.green(nodeVersion)}`);
    } else if (nodeMajor >= 16) {
        console.log(`${chalk.yellow('⚠')} Node.js: ${chalk.yellow(nodeVersion)} (recommended: v18 or higher)`);
        hasWarnings = true;
    } else {
        console.log(`${chalk.red('✗')} Node.js: ${chalk.red(nodeVersion)} (required: v16 or higher)`);
        hasErrors = true;
    }

    // 2. Check TypeScript
    try {
        const tsVersion = await getCommandVersion('tsc', '--version');
        if (tsVersion) {
            console.log(`${chalk.green('✓')} TypeScript: ${chalk.green(tsVersion)}`);
        } else {
            console.log(`${chalk.yellow('⚠')} TypeScript: ${chalk.yellow('Not found (optional)')}`);
            hasWarnings = true;
        }
    } catch (e) {
        console.log(`${chalk.yellow('⚠')} TypeScript: ${chalk.yellow('Not found (optional)')}`);
        hasWarnings = true;
    }

    // 3. Check Configuration
    const configPaths = [
        'objectql.config.ts',
        'objectql.config.js',
        'src/objectql.config.ts',
        'src/objectql.config.js'
    ];
    
    let configFound = false;
    for (const configPath of configPaths) {
        if (fs.existsSync(configPath)) {
            console.log(`${chalk.green('✓')} Configuration: ${chalk.green(configPath)}`);
            configFound = true;
            break;
        }
    }
    
    if (!configFound) {
        console.log(`${chalk.yellow('⚠')} Configuration: ${chalk.yellow('No objectql.config file found')}`);
        hasWarnings = true;
    }

    // 4. Check package.json
    const packageJsonPath = path.join(cwd, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
        console.log(`${chalk.green('✓')} package.json: ${chalk.green('Found')}`);
        
        try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            
            // Check for ObjectQL dependencies
            console.log(chalk.gray('\nDependency Check:'));
            const checks = await checkDependencies(packageJson);
            
            for (const check of checks) {
                if (check.status === 'ok') {
                    console.log(`  ${chalk.green('✓')} ${check.name}: ${chalk.green(check.installed || 'ok')}`);
                } else if (check.status === 'missing') {
                    console.log(`  ${chalk.red('✗')} ${check.name}: ${chalk.red('Missing')}`);
                    hasErrors = true;
                } else if (check.status === 'outdated') {
                    console.log(`  ${chalk.yellow('⚠')} ${check.name}: ${chalk.yellow(check.installed || 'outdated')} (recommended: ${check.required})`);
                    hasWarnings = true;
                } else if (check.status === 'warning') {
                    console.log(`  ${chalk.yellow('⚠')} ${check.name}: ${chalk.yellow(check.installed || 'warning')}`);
                    hasWarnings = true;
                }
            }
        } catch (e: any) {
            console.log(`${chalk.red('✗')} package.json: ${chalk.red('Invalid JSON')}`);
            hasErrors = true;
        }
    } else {
        console.log(`${chalk.yellow('⚠')} package.json: ${chalk.yellow('Not found')}`);
        hasWarnings = true;
    }

    // 5. Check tsconfig.json
    const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
        console.log(chalk.gray('\nTypeScript Configuration:'));
        try {
            const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
            
            // Check for recommended settings
            const compilerOptions = tsconfig.compilerOptions || {};
            
            if (compilerOptions.strict) {
                console.log(`  ${chalk.green('✓')} Strict mode: ${chalk.green('enabled')}`);
            } else {
                console.log(`  ${chalk.yellow('⚠')} Strict mode: ${chalk.yellow('disabled (recommended: enable)')}`);
                hasWarnings = true;
            }
            
            if (compilerOptions.esModuleInterop) {
                console.log(`  ${chalk.green('✓')} ES Module Interop: ${chalk.green('enabled')}`);
            }
            
            const target = compilerOptions.target || 'ES5';
            if (target.toLowerCase() === 'esnext' || target.toLowerCase().startsWith('es20')) {
                console.log(`  ${chalk.green('✓')} Target: ${chalk.green(target)}`);
            } else {
                console.log(`  ${chalk.yellow('⚠')} Target: ${chalk.yellow(target)} (recommended: ESNext or ES2020+)`);
                hasWarnings = true;
            }
        } catch (e: any) {
            console.log(`  ${chalk.red('✗')} tsconfig.json: ${chalk.red('Invalid JSON')}`);
            hasErrors = true;
        }
    }
    
    // Summary
    console.log();
    if (hasErrors) {
        console.log(chalk.red('❌ Some critical issues found. Please fix them before continuing.'));
        process.exit(1);
    } else if (hasWarnings) {
        console.log(chalk.yellow('⚠️  Everything works, but some improvements are recommended.'));
    } else {
        console.log(chalk.green('✅ Everything looks good!'));
    }
}

/**
 * Get version of a command-line tool
 */
async function getCommandVersion(command: string, versionFlag: string = '--version'): Promise<string | null> {
    return new Promise((resolve) => {
        const proc = spawn(command, [versionFlag], { shell: true });
        let output = '';
        
        proc.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        proc.stderr.on('data', (data) => {
            output += data.toString();
        });
        
        proc.on('close', (code) => {
            if (code === 0 && output.trim()) {
                // Extract version number
                const versionMatch = output.match(/(\d+\.\d+\.\d+)/);
                resolve(versionMatch ? versionMatch[1] : output.trim().split('\n')[0]);
            } else {
                resolve(null);
            }
        });
        
        proc.on('error', () => {
            resolve(null);
        });
    });
}

/**
 * Check ObjectQL and related dependencies
 */
async function checkDependencies(packageJson: any): Promise<DependencyCheck[]> {
    const checks: DependencyCheck[] = [];
    const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
    };
    
    // Check for ObjectQL core packages
    const corePackages = [
        '@objectql/core',
        '@objectql/types',
        '@objectql/server',
        '@objectql/cli'
    ];
    
    for (const pkg of corePackages) {
        const version = allDeps[pkg];
        if (version) {
            checks.push({
                name: pkg,
                installed: version,
                status: 'ok'
            });
        }
    }
    
    // Check for driver packages
    const drivers = Object.keys(allDeps).filter(dep => dep.startsWith('@objectql/driver-'));
    if (drivers.length === 0) {
        checks.push({
            name: 'Database Driver',
            status: 'warning',
            installed: 'No driver found (optional)'
        });
    } else {
        for (const driver of drivers) {
            checks.push({
                name: driver,
                installed: allDeps[driver],
                status: 'ok'
            });
        }
    }
    
    // Check TypeScript
    const tsVersion = allDeps['typescript'];
    if (tsVersion) {
        checks.push({
            name: 'typescript',
            installed: tsVersion,
            status: 'ok'
        });
    } else {
        checks.push({
            name: 'typescript',
            status: 'warning',
            installed: 'Not found (recommended for development)'
        });
    }
    
    return checks;
}

export async function validateCommand(options: { dir?: string }) {
    console.log(chalk.blue('🔍 Validating Metadata...'));
    // This would invoke the core validator
    console.log(chalk.gray('Feature coming soon: Will validate all .object.yml files against schema.'));
}

async function loadObjectQLInstance(configPath?: string) {
    // Placeholder for actual loader logic if not exported from elsewhere
    return {};
}
