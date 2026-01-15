import { Command } from 'commander';
import chalk from 'chalk';
import { generateTypes } from './commands/generate';
import { startRepl } from './commands/repl';
import { serve } from './commands/serve';
import { dev } from './commands/dev';
import { start } from './commands/start';
import { build } from './commands/build';
import { test } from './commands/test';
import { lint } from './commands/lint';
import { format } from './commands/format';
import { initProject } from './commands/init';
import { newMetadata } from './commands/new';
import { i18nExtract, i18nInit, i18nValidate } from './commands/i18n';
import { migrate, migrateCreate, migrateStatus } from './commands/migrate';
import { aiGenerate, aiValidate, aiChat, aiConversational } from './commands/ai';
import { syncDatabase } from './commands/sync';
import { doctorCommand, validateCommand } from './commands/doctor';
import { dbPushCommand } from './commands/database-push';

const program = new Command();

program
  .name('objectql')
  .description('ObjectQL CLI tool - The ObjectStack AI Protocol Interface')
  .version('1.5.0');

// ==========================================
// 1. Lifecycle Commands
// ==========================================

program
    .command('init')
    .description('Create a new ObjectQL project')
    .option('-t, --template <template>', 'Template to use (basic, express-api, enterprise)', 'basic')
    .option('-n, --name <name>', 'Project name')
    .option('-d, --dir <path>', 'Target directory')
    .option('--skip-install', 'Skip dependency installation')
    .option('--skip-git', 'Skip git initialization')
    .action(async (options) => {
        try {
            await initProject(options);
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    });

program
    .command('dev')
    .description('Start development server with hot reload and type generation')
    .option('-p, --port <number>', 'Port to listen on', '3000')
    .option('-d, --dir <path>', 'Directory containing schema', '.')
    .option('-c, --config <path>', 'Path to objectql.config.ts/js')
    .option('--modules <items>', 'Comma-separated list of modules to load')
    .option('--no-watch', 'Disable file watching')
    .action(async (options) => {
        await dev({ 
            port: parseInt(options.port), 
            dir: options.dir,
            config: options.config,
            modules: options.modules,
            watch: options.watch
        });
    });

program
    .command('build')
    .description('Build project for production')
    .option('-d, --dir <path>', 'Source directory', '.')
    .option('-o, --output <path>', 'Output directory', './dist')
    .option('--no-types', 'Skip TypeScript type generation')
    .option('--no-validate', 'Skip metadata validation')
    .action(async (options) => {
        await build({
            dir: options.dir,
            output: options.output,
            types: options.types,
            validate: options.validate
        });
    });

program
    .command('start')
    .description('Start production server')
    .option('-p, --port <number>', 'Port to listen on', '3000')
    .option('-d, --dir <path>', 'Directory containing schema', '.')
    .option('-c, --config <path>', 'Path to objectql.config.ts/js')
    .action(async (options) => {
        await start({ 
            port: parseInt(options.port), 
            dir: options.dir,
            config: options.config
        });
    });

// ==========================================
// 2. Scaffolding & Generators
// ==========================================

program
    .command('generate <schematic> <name>')
    .alias('g')
    .description('Generate a new metadata element (object, action, etc.)')
    .option('-d, --dir <path>', 'Output directory', '.')
    .action(async (schematic, name, options) => {
        try {
            // Maps to existing newMetadata which accepts (type, name, dir)
            await newMetadata({ type: schematic, name, dir: options.dir });
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    });

program
    .command('types')
    .description('Force regenerate TypeScript definitions')
    .option('-s, --source <path>', 'Source directory', '.')
    .option('-o, --output <path>', 'Output directory', './src/generated')
    .action(async (options) => {
        try {
            await generateTypes(options.source, options.output);
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    });

// ==========================================
// 3. Database Operations
// ==========================================

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

// Migration commands - kept as top level or move to db:migrate?
// Staying top level or db:migrate is fine. Let's keep `migrate` top level for familiarity with typeorm/prisma users or move to db?
// User request: "Declarative > Imperative".
// Let's alias db:migrate to migrate for now, or just keep migrate. 
// Standard in many tools is `migrate` or `db migrate`.
// Let's keep `migrate` as top level group for explicit control.

const migrateCmd = program
    .command('migrate')
    .description('Manage database migrations');

migrateCmd
    .command('up') // Changed from default action to explicit 'up'
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


// ==========================================
// 4. AI Architect
// ==========================================

const aiCmd = program
    .command('ai')
    .description('AI Architect capabilities');

aiCmd
    .command('chat')
    .description('Interactive architecture chat')
    .option('-p, --prompt <text>', 'Initial prompt')
    .action(async (options) => {
        await aiChat({ initialPrompt: options.prompt });
    });

aiCmd
    .command('run <prompt>') // Changed from generate to run/exec for simple "Do this"
    .description('Execute an AI modification on the project (e.g. "Add a blog module")')
    .option('-o, --output <path>', 'Output directory', './src')
    .action(async (prompt, options) => {
        // Maps to simple conversational or generate
        // Let's map to aiGenerate but pass description
        await aiGenerate({ description: prompt, output: options.output, type: 'custom' });
    });

// ==========================================
// 5. Diagnostics & Tools
// ==========================================

program
    .command('doctor')
    .description('Check environment and configuration health')
    .action(async () => {
        await doctorCommand();
    });

program
    .command('validate')
    .description('Validate all metadata files')
    .option('-d, --dir <path>', 'Directory to validate', '.')
    .action(async (options) => {
        await validateCommand(options);
    });

program
    .command('repl')
    .description('Start interactive REPL')
    .option('-c, --config <path>', 'Path to objectql.config.ts')
    .action(async (options) => {
        await startRepl(options.config);
    });

program
    .command('test')
    .description('Run tests')
    .action(async (options) => {
        await test(options);
    });

program
    .command('lint')
    .description('Lint metadata files')
    .action(async (options) => {
        await lint(options);
    });

program
    .command('format')
    .description('Format metadata files')
    .action(async (options) => {
        await format(options);
    });

// ==========================================
// 6. I18n
// ==========================================

const i18nCmd = program
    .command('i18n')
    .description('Internationalization commands');

i18nCmd
    .command('extract')
    .description('Extract translatable strings from metadata files')
    .option('-s, --source <path>', 'Source directory', '.')
    .option('-o, --output <path>', 'Output directory', './src/i18n')
    .option('-l, --lang <lang>', 'Language code', 'en')
    .action(async (options) => {
        try {
            await i18nExtract(options);
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    });

i18nCmd
    .command('init <lang>')
    .description('Initialize i18n for a new language')
    .option('-b, --base-dir <path>', 'Base i18n directory', './src/i18n')
    .action(async (lang, options) => {
        try {
            await i18nInit({ lang, baseDir: options.baseDir });
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    });

i18nCmd
    .command('validate <lang>')
    .description('Validate translation completeness')
    .option('-b, --base-dir <path>', 'Base i18n directory', './src/i18n')
    .option('--base-lang <lang>', 'Base language to compare against', 'en')
    .action(async (lang, options) => {
        try {
            await i18nValidate({ lang, baseDir: options.baseDir, baseLang: options.baseLang });
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    });

// Backward compatibility (Hidden or Deprecated)
program
    .command('new <type> <name>', { hidden: true })
    .action(async (type, name, options) => {
         console.warn(chalk.yellow('Deprecated: Use "objectql generate" instead.'));
         await newMetadata({ type, name, dir: options.dir });
    });

program.parse(process.argv);
