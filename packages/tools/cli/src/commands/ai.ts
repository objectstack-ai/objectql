import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import * as readline from 'readline';
import chalk from 'chalk';
import OpenAI from 'openai';
import { Validator } from '@objectql/core';
import { ObjectQLAgent, createAgent } from '../agent';
import { glob } from 'fast-glob';

interface GenerateOptions {
    description: string;
    output?: string;
    type?: 'basic' | 'complete' | 'custom';
}

interface ValidateOptions {
    path: string;
    fix?: boolean;
    verbose?: boolean;
}

interface ChatOptions {
    initialPrompt?: string;
}

/**
 * Generate application metadata using AI
 */
export async function aiGenerate(options: GenerateOptions): Promise<void> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error(chalk.red('Error: OPENAI_API_KEY environment variable is not set.'));
        console.log(chalk.yellow('\nPlease set your OpenAI API key:'));
        console.log(chalk.cyan('  export OPENAI_API_KEY=your-api-key-here'));
        process.exit(1);
    }

    const outputDir = options.output || './src';

    console.log(chalk.blue('🤖 ObjectQL AI Generator\n'));
    console.log(chalk.gray(`Description: ${options.description}`));
    console.log(chalk.gray(`Output directory: ${outputDir}\n`));

    console.log(chalk.yellow('⏳ Generating metadata...'));

    try {
        const agent = createAgent(apiKey);
        const result = await agent.generateApp({
            description: options.description,
            type: options.type || 'custom',
        });

        if (!result.success || result.files.length === 0) {
            console.log(chalk.yellow('\n⚠️  No valid metadata files generated.'));
            if (result.errors) {
                result.errors.forEach(err => console.error(chalk.red(`  Error: ${err}`)));
            }
            if (result.rawResponse) {
                console.log(chalk.gray('\nResponse:'));
                console.log(result.rawResponse);
            }
            return;
        }

        // Create output directory if it doesn't exist
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Write files
        console.log(chalk.green('\n✅ Generated files:'));
        for (const file of result.files) {
            const filePath = path.join(outputDir, file.filename);
            const fileDir = path.dirname(filePath);
            
            if (!fs.existsSync(fileDir)) {
                fs.mkdirSync(fileDir, { recursive: true });
            }

            fs.writeFileSync(filePath, file.content);
            console.log(chalk.green(`  ✓ ${file.filename} (${file.type})`));
        }

        console.log(chalk.blue(`\n📁 Files written to: ${outputDir}`));
        console.log(chalk.gray('\nNext steps:'));
        console.log(chalk.cyan('  1. Review the generated files'));
        console.log(chalk.cyan('  2. Run: objectql ai validate <path>'));
        console.log(chalk.cyan('  3. Test with: objectql serve'));

    } catch (error) {
        console.error(chalk.red('\n❌ Error generating metadata:'));
        if (error instanceof Error) {
            console.error(chalk.red(error.message));
        }
        process.exit(1);
    }
}

/**
 * Validate metadata files using AI
 */
export async function aiValidate(options: ValidateOptions): Promise<void> {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
        console.error(chalk.red('Error: OPENAI_API_KEY environment variable is not set.'));
        console.log(chalk.yellow('\nNote: AI validation requires OpenAI API key.'));
        console.log(chalk.yellow('Falling back to basic validation...\n'));
        await basicValidate(options);
        return;
    }

    console.log(chalk.blue('🔍 ObjectQL AI Validator\n'));

    // Find all metadata files
    const patterns = [
        '**/*.object.yml',
        '**/*.validation.yml',
        '**/*.form.yml',
        '**/*.view.yml',
        '**/*.page.yml',
        '**/*.action.yml',
    ];

    const files = await glob(patterns, {
        cwd: options.path,
        absolute: true,
        ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
    });

    if (files.length === 0) {
        console.log(chalk.yellow('No metadata files found.'));
        return;
    }

    console.log(chalk.gray(`Found ${files.length} metadata file(s)\n`));

    const agent = createAgent(apiKey);
    let errorCount = 0;
    let warningCount = 0;

    for (const filePath of files) {
        const relativePath = path.relative(options.path, filePath);
        console.log(chalk.cyan(`\n📄 ${relativePath}`));

        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            
            // Validate using AI agent
            const result = await agent.validateMetadata({
                metadata: content,
                filename: relativePath,
                checkBusinessLogic: true,
                checkPerformance: true,
                checkSecurity: true,
            });

            // Display results
            if (result.errors.length > 0) {
                result.errors.forEach(error => {
                    console.log(chalk.red(`  ❌ ERROR: ${error.message}`));
                    if (error.location) {
                        console.log(chalk.gray(`     Location: ${error.location}`));
                    }
                });
                errorCount += result.errors.length;
            }

            if (result.warnings.length > 0) {
                result.warnings.forEach(warning => {
                    console.log(chalk.yellow(`  ⚠️  WARNING: ${warning.message}`));
                    if (warning.suggestion) {
                        console.log(chalk.gray(`     Suggestion: ${warning.suggestion}`));
                    }
                });
                warningCount += result.warnings.length;
            }

            if (options.verbose && result.info.length > 0) {
                result.info.forEach(info => {
                    console.log(chalk.blue(`  ℹ️  INFO: ${info.message}`));
                });
            }

            if (result.valid && result.warnings.length === 0) {
                console.log(chalk.green('  ✓ No issues found'));
            }

        } catch (error) {
            console.log(chalk.red(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
            errorCount++;
        }
    }

    // Summary
    console.log(chalk.blue('\n' + '='.repeat(60)));
    console.log(chalk.blue('Validation Summary:'));
    console.log(chalk.gray(`  Files checked: ${files.length}`));
    
    if (errorCount > 0) {
        console.log(chalk.red(`  Errors: ${errorCount}`));
    }
    if (warningCount > 0) {
        console.log(chalk.yellow(`  Warnings: ${warningCount}`));
    }
    if (errorCount === 0 && warningCount === 0) {
        console.log(chalk.green('  ✓ All files validated successfully!'));
    }

    if (errorCount > 0) {
        process.exit(1);
    }
}

/**
 * Basic validation without AI (fallback)
 */
async function basicValidate(options: ValidateOptions): Promise<void> {
    const patterns = [
        '**/*.object.yml',
        '**/*.validation.yml',
    ];

    const files = await glob(patterns, {
        cwd: options.path,
        absolute: true,
        ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
    });

    if (files.length === 0) {
        console.log(chalk.yellow('No metadata files found.'));
        return;
    }

    console.log(chalk.gray(`Found ${files.length} metadata file(s)\n`));

    let errorCount = 0;
    const validator = new Validator({ language: 'en' });

    for (const filePath of files) {
        const relativePath = path.relative(options.path, filePath);
        console.log(chalk.cyan(`📄 ${relativePath}`));

        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const data = yaml.load(content) as any;

            // Validate YAML structure
            if (!data || typeof data !== 'object') {
                console.log(chalk.red('  ❌ Invalid YAML structure'));
                errorCount++;
                continue;
            }

            // Validate based on file type
            if (filePath.endsWith('.validation.yml')) {
                if (!data.rules || !Array.isArray(data.rules)) {
                    console.log(chalk.yellow('  ⚠️  No validation rules found'));
                } else {
                    console.log(chalk.green(`  ✓ ${data.rules.length} validation rule(s) found`));
                }
            } else if (filePath.endsWith('.object.yml')) {
                if (!data.fields || typeof data.fields !== 'object') {
                    console.log(chalk.red('  ❌ No fields defined'));
                    errorCount++;
                } else {
                    const fieldCount = Object.keys(data.fields).length;
                    console.log(chalk.green(`  ✓ ${fieldCount} field(s) defined`));
                }
            }

        } catch (error) {
            console.log(chalk.red(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
            errorCount++;
        }
    }

    console.log(chalk.blue('\n' + '='.repeat(60)));
    if (errorCount === 0) {
        console.log(chalk.green('✓ Basic validation passed'));
    } else {
        console.log(chalk.red(`❌ Found ${errorCount} error(s)`));
        process.exit(1);
    }
}

/**
 * Interactive AI chat for metadata assistance
 */
export async function aiChat(options: ChatOptions): Promise<void> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error(chalk.red('Error: OPENAI_API_KEY environment variable is not set.'));
        process.exit(1);
    }

    const openai = new OpenAI({ apiKey });

    console.log(chalk.blue('💬 ObjectQL AI Assistant\n'));
    console.log(chalk.gray('Ask me anything about ObjectQL metadata, data modeling, or best practices.'));
    console.log(chalk.gray('Type "exit" to quit.\n'));

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const systemPrompt = `You are an expert ObjectQL architect and consultant. Help users with:
- ObjectQL metadata specifications
- Data modeling best practices
- Validation rules and business logic
- Relationships and field types
- Application architecture
- Performance and security considerations

Provide clear, actionable advice with examples when appropriate.`;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt }
    ];

    if (options.initialPrompt) {
        messages.push({ role: 'user', content: options.initialPrompt });
    }

    const askQuestion = () => {
        rl.question(chalk.cyan('You: '), async (input: string) => {
            if (input.toLowerCase() === 'exit') {
                console.log(chalk.blue('\nGoodbye! 👋'));
                rl.close();
                return;
            }

            if (!input.trim()) {
                askQuestion();
                return;
            }

            messages.push({ role: 'user', content: input });

            try {
                const completion = await openai.chat.completions.create({
                    model: 'gpt-4',
                    messages: messages,
                    temperature: 0.7,
                });

                const response = completion.choices[0]?.message?.content || 'No response';
                messages.push({ role: 'assistant', content: response });

                console.log(chalk.green('\nAssistant: ') + response + '\n');
            } catch (error) {
                console.error(chalk.red('\nError: ') + (error instanceof Error ? error.message : 'Unknown error') + '\n');
            }

            askQuestion();
        });
    };

    askQuestion();
}
