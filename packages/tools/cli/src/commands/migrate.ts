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

interface MigrateOptions {
    config?: string;
    dir?: string;
}

interface MigrateCreateOptions {
    name: string;
    dir?: string;
}

interface MigrateStatusOptions {
    config?: string;
    dir?: string;
}

const MIGRATION_TEMPLATE = `import { ObjectQL } from '@objectql/core';

/**
 * Migration: {{name}}
 * Created: {{timestamp}}
 */
export async function up(app: ObjectQL) {
    // TODO: Implement migration logic
    console.log('Running migration: {{name}}');
    
    // Example: Add a new field to an object
    // const tasks = app.getObject('tasks');
    // await tasks.updateSchema({
    //     fields: {
    //         new_field: { type: 'text', label: 'New Field' }
    //     }
    // });
}

export async function down(app: ObjectQL) {
    // TODO: Implement rollback logic
    console.log('Rolling back migration: {{name}}');
    
    // Example: Remove the field
    // const tasks = app.getObject('tasks');
    // await tasks.updateSchema({
    //     fields: {
    //         new_field: undefined
    //     }
    // });
}
`;

/**
 * Run pending migrations
 */
export async function migrate(options: MigrateOptions) {
    const migrationsDir = path.resolve(process.cwd(), options.dir || './migrations');
    
    console.log(chalk.blue('🔄 Running migrations...'));
    console.log(chalk.gray(`Migrations directory: ${migrationsDir}\n`));

    if (!fs.existsSync(migrationsDir)) {
        console.log(chalk.yellow('⚠ No migrations directory found'));
        console.log(chalk.gray('Create one with: objectql migrate:create --name init'));
        return;
    }

    try {
        // Load ObjectQL instance from config
        const app = await loadObjectQLInstance(options.config);

        // Get list of migration files
        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.ts') || f.endsWith('.js'))
            .sort();

        if (files.length === 0) {
            console.log(chalk.yellow('⚠ No migration files found'));
            return;
        }

        // Get already run migrations
        const migrations = app.getObject('_migrations');
        let runMigrations: string[] = [];
        
        try {
            const result = await migrations.find({
                fields: ['name'],
                sort: [['created_at', 'asc']]
            });
            runMigrations = result.records.map((r: any) => r.name);
        } catch (err) {
            // Migrations table doesn't exist yet, create it
            console.log(chalk.gray('Creating migrations tracking table...'));
            await createMigrationsTable(app);
        }

        // Run pending migrations
        let ranCount = 0;
        for (const file of files) {
            const migrationName = file.replace(/\.(ts|js)$/, '');
            
            if (runMigrations.includes(migrationName)) {
                console.log(chalk.gray(`⊘ ${migrationName} (already run)`));
                continue;
            }

            console.log(chalk.blue(`▶ ${migrationName}`));

            const migrationPath = path.join(migrationsDir, file);
            const migration = require(migrationPath);

            if (!migration.up) {
                console.log(chalk.red(`  ✗ No 'up' function found`));
                continue;
            }

            try {
                await migration.up(app);
                
                // Record migration
                await migrations.insert({
                    name: migrationName,
                    run_at: new Date()
                });

                console.log(chalk.green(`  ✓ Complete`));
                ranCount++;
            } catch (error: any) {
                console.log(chalk.red(`  ✗ Failed: ${error.message}`));
                throw error;
            }
        }

        console.log(chalk.green(`\n✅ Ran ${ranCount} migration(s)`));

    } catch (error: any) {
        console.error(chalk.red(`❌ Migration failed: ${error.message}`));
        process.exit(1);
    }
}

/**
 * Create a new migration file with boilerplate code
 */
export async function migrateCreate(options: MigrateCreateOptions) {
    const { name } = options;
    const migrationsDir = path.resolve(process.cwd(), options.dir || './migrations');

    // Validate name
    if (!name || !/^[a-z][a-z0-9_]*$/.test(name)) {
        console.error(chalk.red('❌ Invalid migration name. Use lowercase with underscores (e.g., add_status_field)'));
        process.exit(1);
    }

    // Create migrations directory if it doesn't exist
    if (!fs.existsSync(migrationsDir)) {
        fs.mkdirSync(migrationsDir, { recursive: true });
        console.log(chalk.gray(`Created directory: ${migrationsDir}`));
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:\-T.]/g, '').slice(0, 14);
    const filename = `${timestamp}_${name}.ts`;
    const filePath = path.join(migrationsDir, filename);

    // Create migration file from template
    const content = MIGRATION_TEMPLATE
        .replace(/\{\{name\}\}/g, name)
        .replace(/\{\{timestamp\}\}/g, new Date().toISOString());

    fs.writeFileSync(filePath, content, 'utf-8');

    console.log(chalk.green(`✅ Created migration: ${filename}`));
    console.log(chalk.gray(`Path: ${filePath}`));
    console.log(chalk.gray(`\nNext steps:`));
    console.log(chalk.gray(`  1. Edit the migration file to add your changes`));
    console.log(chalk.gray(`  2. Run: objectql migrate`));
}

/**
 * Show migration status - displays pending and completed migrations
 * @param options - Configuration options including config path and migrations directory
 */
export async function migrateStatus(options: MigrateStatusOptions) {
    const migrationsDir = path.resolve(process.cwd(), options.dir || './migrations');

    console.log(chalk.blue('📊 Migration Status\n'));

    if (!fs.existsSync(migrationsDir)) {
        console.log(chalk.yellow('⚠ No migrations directory found'));
        return;
    }

    try {
        // Load ObjectQL instance
        const app = await loadObjectQLInstance(options.config);

        // Get list of migration files
        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.ts') || f.endsWith('.js'))
            .sort();

        if (files.length === 0) {
            console.log(chalk.gray('No migration files found'));
            return;
        }

        // Get run migrations
        const migrations = app.getObject('_migrations');
        let runMigrations: string[] = [];
        
        try {
            const result = await migrations.find({
                fields: ['name', 'run_at'],
                sort: [['run_at', 'asc']]
            });
            runMigrations = result.records.map((r: any) => r.name);
        } catch (err) {
            // Migrations table doesn't exist
            runMigrations = [];
        }

        // Display status
        let pendingCount = 0;
        for (const file of files) {
            const migrationName = file.replace(/\.(ts|js)$/, '');
            const isRun = runMigrations.includes(migrationName);

            if (isRun) {
                console.log(chalk.green(`✓ ${migrationName}`));
            } else {
                console.log(chalk.yellow(`○ ${migrationName} (pending)`));
                pendingCount++;
            }
        }

        console.log(chalk.blue(`\n📊 Summary:`));
        console.log(chalk.gray(`Total migrations: ${files.length}`));
        console.log(chalk.gray(`Run: ${files.length - pendingCount}`));
        console.log(chalk.gray(`Pending: ${pendingCount}`));

    } catch (error: any) {
        console.error(chalk.red(`❌ Failed to get status: ${error.message}`));
        process.exit(1);
    }
}

async function loadObjectQLInstance(configPath?: string): Promise<any> {
    const cwd = process.cwd();
    
    // Try to load from config file
    let configFile = configPath;
    if (!configFile) {
        const potentialFiles = ['objectql.config.ts', 'objectql.config.js'];
        for (const file of potentialFiles) {
            if (fs.existsSync(path.join(cwd, file))) {
                configFile = file;
                break;
            }
        }
    }

    if (!configFile) {
        throw new Error('No configuration file found (objectql.config.ts/js)');
    }

    // Register ts-node for TypeScript support
    try {
        require('ts-node').register({
            transpileOnly: true,
            compilerOptions: {
                module: 'commonjs'
            }
        });
    } catch (err) {
        // ts-node not available, try to load JS directly
    }

    const configModule = require(path.join(cwd, configFile));
    const app = configModule.default || configModule.app || configModule.objectql || configModule.db;

    if (!app) {
        throw new Error('Config file must export an ObjectQL instance');
    }

    await app.init();
    return app;
}

async function createMigrationsTable(app: any) {
    // Create a system object to track migrations
    app.metadata.register('object', {
        name: '_migrations',
        label: 'Migrations',
        system: true,
        fields: {
            name: {
                type: 'text',
                label: 'Migration Name',
                required: true,
                unique: true
            },
            run_at: {
                type: 'datetime',
                label: 'Run At',
                required: true
            }
        }
    });

    // Sync to database
    await app.getObject('_migrations').sync();
}
