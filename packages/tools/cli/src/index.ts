import { Command } from 'commander';
import { generateTypes } from './commands/generate';
import { startRepl } from './commands/repl';
import { serve } from './commands/serve';
import { startStudio } from './commands/studio';
import { initProject } from './commands/init';
import { newMetadata } from './commands/new';
import { i18nExtract, i18nInit, i18nValidate } from './commands/i18n';
import { migrate, migrateCreate, migrateStatus } from './commands/migrate';
import { aiGenerate, aiValidate, aiChat, aiConversational } from './commands/ai';

const program = new Command();

program
  .name('objectql')
  .description('ObjectQL CLI tool')
  .version('1.5.0');

// Init command - Create new project
program
    .command('init')
    .description('Create a new ObjectQL project from template')
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

// New command - Generate metadata files
program
    .command('new <type> <name>')
    .description('Generate a new metadata file (object, view, form, etc.)')
    .option('-d, --dir <path>', 'Output directory', '.')
    .action(async (type, name, options) => {
        try {
            await newMetadata({ type, name, dir: options.dir });
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    });

// Generate command - Generate TypeScript types
program
    .command('generate')
    .alias('g')
    .description('Generate TypeScript interfaces from ObjectQL schema files')
    .option('-s, --source <path>', 'Source directory containing *.object.yml', '.')
    .option('-o, --output <path>', 'Output directory for generated types', './src/generated')
    .action(async (options) => {
        try {
            await generateTypes(options.source, options.output);
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    });

// I18n commands
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

// Migration commands
const migrateCmd = program
    .command('migrate')
    .description('Run pending database migrations')
    .option('-c, --config <path>', 'Path to objectql.config.ts/js')
    .option('-d, --dir <path>', 'Migrations directory', './migrations')
    .action(async (options) => {
        try {
            await migrate(options);
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    });

migrateCmd
    .command('create <name>')
    .description('Create a new migration file')
    .option('-d, --dir <path>', 'Migrations directory', './migrations')
    .action(async (name, options) => {
        try {
            await migrateCreate({ name, dir: options.dir });
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    });

migrateCmd
    .command('status')
    .description('Show migration status')
    .option('-c, --config <path>', 'Path to objectql.config.ts/js')
    .option('-d, --dir <path>', 'Migrations directory', './migrations')
    .action(async (options) => {
        try {
            await migrateStatus(options);
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    });

// REPL command
program
    .command('repl')
    .alias('r')
    .description('Start an interactive shell (REPL) to query the database')
    .option('-c, --config <path>', 'Path to objectql.config.ts/js')
    .action(async (options) => {
        await startRepl(options.config);
    });

// Serve command
program
    .command('serve')
    .alias('s')
    .description('Start a development server')
    .option('-p, --port <number>', 'Port to listen on', '3000')
    .option('-d, --dir <path>', 'Directory containing schema', '.')
    .action(async (options) => {
        await serve({ port: parseInt(options.port), dir: options.dir });
    });

// Studio command
program
    .command('studio')
    .alias('ui')
    .description('Start the ObjectQL Studio')
    .option('-p, --port <number>', 'Port to listen on', '5555')
    .option('-d, --dir <path>', 'Directory containing schema', '.')
    .option('--no-open', 'Do not open browser automatically')
    .action(async (options) => {
        await startStudio({ 
            port: parseInt(options.port), 
            dir: options.dir,
            open: options.open
        });
    });

// AI command - Interactive by default, with specific subcommands for other modes
const aiCmd = program
    .command('ai')
    .description('AI-powered interactive application builder (starts conversational mode by default)');

// Default action: Interactive conversational mode
aiCmd
    .argument('[output-dir]', 'Output directory for generated files', './src')
    .action(async (outputDir) => {
        try {
            await aiConversational({ output: outputDir });
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    });

// Subcommand: Generate (one-shot generation)
aiCmd
    .command('generate')
    .description('Generate application from description (one-shot, non-interactive)')
    .requiredOption('-d, --description <text>', 'Application description')
    .option('-o, --output <path>', 'Output directory', './src')
    .option('-t, --type <type>', 'Generation type: basic, complete, or custom', 'custom')
    .action(async (options) => {
        try {
            await aiGenerate(options);
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    });

// Subcommand: Validate
aiCmd
    .command('validate')
    .description('Validate metadata files with AI analysis')
    .argument('<path>', 'Path to metadata files directory')
    .option('--fix', 'Automatically fix issues')
    .option('-v, --verbose', 'Detailed output')
    .action(async (pathArg, options) => {
        try {
            await aiValidate({ path: pathArg, ...options });
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    });

// Subcommand: Chat
aiCmd
    .command('chat')
    .description('AI assistant for questions and guidance')
    .option('-p, --prompt <text>', 'Initial prompt')
    .action(async (options) => {
        try {
            await aiChat({ initialPrompt: options.prompt });
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    });

program.parse();
