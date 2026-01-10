import { Command } from 'commander';
import { generateTypes } from './commands/generate';

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

program.parse();
