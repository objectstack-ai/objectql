/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Command } from 'commander';
import { syncDatabase } from '../commands/sync';
import { dbPushCommand } from '../commands/database-push';
import { migrate, migrateCreate, migrateStatus } from '../commands/migrate';

export function registerDatabaseCommands(program: Command) {
    const dbCmd = program.command('db').description('Database operations');

    dbCmd
        .command('push')
        .description('Push metadata schema changes to the database')
        .option('--force', 'Bypass safety checks')
        .action(async (options) => {
            try {
                await dbPushCommand(options);
            } catch (error) {
                console.error(error);
                process.exit(1);
            }
        });

    dbCmd
        .command('pull')
        .description('Introspect database and generate metadata (Reverse Engineering)')
        .option('-c, --config <path>', 'Path to objectql.config.ts/js')
        .option('-o, --output <path>', 'Output directory', './src/objects')
        .option('-t, --tables <tables...>', 'Specific tables to sync')
        .option('-f, --force', 'Overwrite existing files')
        .action(async (options) => {
            try {
                // Maps to existing syncDatabase
                await syncDatabase(options);
            } catch (error) {
                console.error(error);
                process.exit(1);
            }
        });

    const migrateCmd = program
        .command('migrate')
        .description('Manage database migrations');

    migrateCmd
        .command('up')
        .description('Run pending migrations')
        .option('-c, --config <path>', 'Path to objectql.config.ts/js')
        .option('-d, --dir <path>', 'Migrations directory', './migrations')
        .action(async (options) => {
            await migrate(options);
        });

    migrateCmd
        .command('create <name>')
        .description('Create a new migration file')
        .option('-d, --dir <path>', 'Migrations directory', './migrations')
        .action(async (name, options) => {
            await migrateCreate({ name, dir: options.dir });
        });

    migrateCmd
        .command('status')
        .description('Show migration status')
        .action(async (options) => {
            await migrateStatus(options);
        });
}
