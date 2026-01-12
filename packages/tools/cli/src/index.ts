import { Command } from 'commander';
import { generateTypes } from './commands/generate';
import { startRepl } from './commands/repl';
import { serve } from './commands/serve';
import { startStudio } from './commands/studio';

const program = new Command();

program
  .name('objectql')
  .description('ObjectQL CLI tool')
  .version('0.1.0');

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

program
    .command('repl')
    .alias('r')
    .description('Start an interactive shell (REPL) to query the database')
    .option('-c, --config <path>', 'Path to objectql.config.ts/js')
    .action(async (options) => {
        await startRepl(options.config);
    });

program
    .command('serve')
    .alias('s')
    .description('Start a development server')
    .option('-p, --port <number>', 'Port to listen on', '3000')
    .option('-d, --dir <path>', 'Directory containing schema', '.')
    .action(async (options) => {
        await serve({ port: parseInt(options.port), dir: options.dir });
    });

program
    .command('studio')
    .alias('ui')
    .description('Start the ObjectQL Studio')
    .option('-p, --port <number>', 'Port to listen on', '3000')
    .option('-d, --dir <path>', 'Directory containing schema', '.')
    .option('--no-open', 'Do not open browser automatically')
    .action(async (options) => {
        await startStudio({ 
            port: parseInt(options.port), 
            dir: options.dir,
            open: options.open
        });
    });

program.parse();
