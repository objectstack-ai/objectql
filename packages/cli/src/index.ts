import { Command } from 'commander';
import { generateTypes } from './commands/generate';
import { startRepl } from './commands/repl';

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

program.parse();
