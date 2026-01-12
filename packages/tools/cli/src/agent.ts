/**
 * ObjectQL AI Agent - Programmatic API for AI-powered application generation
 * 
 * This module provides a high-level API for using AI to generate and validate
 * ObjectQL metadata programmatically.
 */

import OpenAI from 'openai';
import * as yaml from 'js-yaml';
import { Validator } from '@objectql/core';
import { 
    ObjectConfig, 
    AnyValidationRule, 
    ValidationContext,
    ValidationResult 
} from '@objectql/types';

/**
 * Configuration for the ObjectQL AI Agent
 */
export interface AgentConfig {
    /** OpenAI API key */
    apiKey: string;
    /** OpenAI model to use (default: gpt-4) */
    model?: string;
    /** Temperature for generation (0-1, default: 0.7) */
    temperature?: number;
    /** Preferred language for messages (default: en) */
    language?: string;
}

/**
 * Options for generating application metadata
 */
export interface GenerateAppOptions {
    /** Natural language description of the application */
    description: string;
    /** Type of generation: basic (minimal), complete (comprehensive), or custom */
    type?: 'basic' | 'complete' | 'custom';
    /** Maximum tokens for generation */
    maxTokens?: number;
}

/**
 * Result of application generation
 */
export interface GenerateAppResult {
    /** Whether generation was successful */
    success: boolean;
    /** Generated metadata files */
    files: Array<{
        filename: string;
        content: string;
        type: 'object' | 'validation' | 'form' | 'view' | 'page' | 'other';
    }>;
    /** Any errors encountered */
    errors?: string[];
    /** AI model response (raw) */
    rawResponse?: string;
}

/**
 * Options for validating metadata
 */
export interface ValidateMetadataOptions {
    /** Metadata content (YAML string or parsed object) */
    metadata: string | any;
    /** Filename (for context) */
    filename?: string;
    /** Whether to check business logic consistency */
    checkBusinessLogic?: boolean;
    /** Whether to check performance considerations */
    checkPerformance?: boolean;
    /** Whether to check security issues */
    checkSecurity?: boolean;
}

/**
 * Result of metadata validation
 */
export interface ValidateMetadataResult {
    /** Whether validation passed (no errors) */
    valid: boolean;
    /** Errors found */
    errors: Array<{
        message: string;
        location?: string;
        code?: string;
    }>;
    /** Warnings found */
    warnings: Array<{
        message: string;
        location?: string;
        suggestion?: string;
    }>;
    /** Informational messages */
    info: Array<{
        message: string;
        location?: string;
    }>;
}

/**
 * Regular expression patterns for parsing AI responses
 */
const AI_RESPONSE_PATTERNS = {
    /**
     * Matches YAML file blocks with explicit headers in the format:
     * # filename.object.yml or File: filename.object.yml
     * followed by a YAML code block
     * 
     * Groups:
     * 1. filename (e.g., "user.object.yml")
     * 2. YAML content
     */
    FILE_BLOCK: /(?:^|\n)(?:#|File:)\s*([a-zA-Z0-9_-]+\.[a-z]+\.yml)\s*\n```(?:yaml|yml)?\n([\s\S]*?)```/gi,
    
    /**
     * Matches generic YAML/YML code blocks without explicit headers
     * 
     * Groups:
     * 1. YAML content
     */
    CODE_BLOCK: /```(?:yaml|yml)\n([\s\S]*?)```/g,
};

/**
 * ObjectQL AI Agent for programmatic application generation and validation
 */
export class ObjectQLAgent {
    private openai: OpenAI;
    private validator: Validator;
    private config: Required<AgentConfig>;

    constructor(config: AgentConfig) {
        this.config = {
            apiKey: config.apiKey,
            model: config.model || 'gpt-4',
            temperature: config.temperature ?? 0.7,
            language: config.language || 'en',
        };

        this.openai = new OpenAI({ apiKey: this.config.apiKey });
        this.validator = new Validator({ language: this.config.language });
    }

    /**
     * Generate application metadata from natural language description
     */
    async generateApp(options: GenerateAppOptions): Promise<GenerateAppResult> {
        const systemPrompt = this.getSystemPrompt();
        const userPrompt = this.buildGenerationPrompt(options);

        try {
            const completion = await this.openai.chat.completions.create({
                model: this.config.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: this.config.temperature,
                max_tokens: options.maxTokens || 4000,
            });

            const response = completion.choices[0]?.message?.content;
            if (!response) {
                return {
                    success: false,
                    files: [],
                    errors: ['No response from AI model'],
                };
            }

            // Parse response and extract files
            const files = this.parseGenerationResponse(response);

            return {
                success: files.length > 0,
                files,
                rawResponse: response,
                errors: files.length === 0 ? ['Failed to extract metadata files from response'] : undefined,
            };

        } catch (error) {
            return {
                success: false,
                files: [],
                errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
        }
    }

    /**
     * Validate metadata using AI
     */
    async validateMetadata(options: ValidateMetadataOptions): Promise<ValidateMetadataResult> {
        // Parse metadata if it's a string
        let parsedMetadata: any;
        if (typeof options.metadata === 'string') {
            try {
                parsedMetadata = yaml.load(options.metadata);
            } catch (error) {
                return {
                    valid: false,
                    errors: [{
                        message: `YAML parsing error: ${error instanceof Error ? error.message : 'Invalid YAML'}`,
                        location: 'root',
                    }],
                    warnings: [],
                    info: [],
                };
            }
        } else {
            parsedMetadata = options.metadata;
        }

        // Build validation prompt
        const validationPrompt = this.buildValidationPrompt(options);

        try {
            const completion = await this.openai.chat.completions.create({
                model: this.config.model,
                messages: [
                    { role: 'system', content: this.getValidationSystemPrompt() },
                    { role: 'user', content: validationPrompt }
                ],
                temperature: 0.3, // Lower temperature for more consistent validation
                max_tokens: 2000,
            });

            const feedback = completion.choices[0]?.message?.content || '';

            // Parse feedback into structured result
            return this.parseFeedback(feedback);

        } catch (error) {
            return {
                valid: false,
                errors: [{
                    message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                }],
                warnings: [],
                info: [],
            };
        }
    }

    /**
     * Refine existing metadata based on feedback
     */
    async refineMetadata(
        metadata: string,
        feedback: string,
        iterations: number = 1
    ): Promise<GenerateAppResult> {
        const systemPrompt = this.getSystemPrompt();
        
        let currentMetadata = metadata;
        let messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Here is the current metadata:\n\n${metadata}\n\nPlease refine it based on this feedback: ${feedback}` }
        ];

        for (let i = 0; i < iterations; i++) {
            try {
                const completion = await this.openai.chat.completions.create({
                    model: this.config.model,
                    messages,
                    temperature: 0.5,
                    max_tokens: 4000,
                });

                const response = completion.choices[0]?.message?.content;
                if (!response) break;

                currentMetadata = response;
                messages.push({ role: 'assistant', content: response });

                // If this isn't the last iteration, validate and continue
                if (i < iterations - 1) {
                    const validation = await this.validateMetadata({
                        metadata: response,
                        checkBusinessLogic: true,
                    });

                    if (validation.valid) {
                        break; // Stop if validation passes
                    }

                    // Add validation feedback for next iteration
                    const validationFeedback = [
                        ...validation.errors.map(e => `ERROR: ${e.message}`),
                        ...validation.warnings.map(w => `WARNING: ${w.message}`)
                    ].join('\n');

                    messages.push({
                        role: 'user',
                        content: `Please address these issues:\n${validationFeedback}`
                    });
                }

            } catch (error) {
                return {
                    success: false,
                    files: [],
                    errors: [error instanceof Error ? error.message : 'Unknown error'],
                };
            }
        }

        const files = this.parseGenerationResponse(currentMetadata);

        return {
            success: files.length > 0,
            files,
            rawResponse: currentMetadata,
        };
    }

    /**
     * Get system prompt for metadata generation
     */
    private getSystemPrompt(): string {
        return `You are an expert ObjectQL architect. Generate valid ObjectQL metadata in YAML format.

Follow ObjectQL metadata standards:
- Use standard field types: text, number, boolean, select, date, datetime, lookup, currency, email, phone, url, textarea, formula
- For relationships, use type: lookup with reference_to: <object_name>
- Include required: true for mandatory fields
- Add validation rules for data quality
- Use clear, business-friendly labels
- Follow naming convention: lowercase with underscores (snake_case)

Output format: Provide each file in a YAML code block with a clear filename header.`;
    }

    /**
     * Get system prompt for validation
     */
    private getValidationSystemPrompt(): string {
        return `You are an expert ObjectQL metadata validator. Analyze metadata for:
1. YAML structure and syntax
2. ObjectQL specification compliance
3. Business logic consistency
4. Data modeling best practices
5. Security considerations
6. Performance implications

Provide feedback in this format:
- [ERROR] Location: Issue description
- [WARNING] Location: Issue description  
- [INFO] Location: Suggestion`;
    }

    /**
     * Build generation prompt based on options
     */
    private buildGenerationPrompt(options: GenerateAppOptions): string {
        const { description, type = 'custom' } = options;

        switch (type) {
            case 'basic':
                return `Generate a minimal ObjectQL application for: ${description}

Include:
- 2-3 core objects with essential fields
- Basic relationships between objects
- Simple validation rules

Output: Provide each file separately with clear filename headers (e.g., "# filename.object.yml").`;

            case 'complete':
                return `Generate a complete ObjectQL enterprise application for: ${description}

Include:
- All necessary objects with comprehensive fields
- Relationships and lookups
- Validation rules with business logic
- Consider security and data integrity

Output: Provide each file separately with clear filename headers (e.g., "# filename.object.yml").`;

            default:
                return `Generate ObjectQL metadata for: ${description}

Analyze the requirements and create appropriate objects, fields, relationships, and validation rules.

Output: Provide each file separately with clear filename headers (e.g., "# filename.object.yml").`;
        }
    }

    /**
     * Build validation prompt
     */
    private buildValidationPrompt(options: ValidateMetadataOptions): string {
        const metadataStr = typeof options.metadata === 'string' 
            ? options.metadata 
            : yaml.dump(options.metadata);

        const checks = [];
        if (options.checkBusinessLogic !== false) checks.push('Business logic consistency');
        if (options.checkPerformance) checks.push('Performance considerations');
        if (options.checkSecurity) checks.push('Security issues');

        return `Validate this ObjectQL metadata file:

${options.filename ? `Filename: ${options.filename}\n` : ''}
Content:
\`\`\`yaml
${metadataStr}
\`\`\`

Check for:
- YAML syntax and structure
- ObjectQL specification compliance
${checks.length > 0 ? '- ' + checks.join('\n- ') : ''}

Provide feedback in the specified format.`;
    }

    /**
     * Parse generation response and extract files
     */
    private parseGenerationResponse(response: string): GenerateAppResult['files'] {
        const files: GenerateAppResult['files'] = [];
        
        // Pattern: Files with explicit headers
        let match;
        
        while ((match = AI_RESPONSE_PATTERNS.FILE_BLOCK.exec(response)) !== null) {
            const filename = match[1];
            const content = match[2].trim();
            const type = this.inferFileType(filename);
            
            files.push({ filename, content, type });
        }

        // Fallback: Generic code blocks
        if (files.length === 0) {
            let blockIndex = 0;
            
            while ((match = AI_RESPONSE_PATTERNS.CODE_BLOCK.exec(response)) !== null) {
                const content = match[1].trim();
                const filename = `generated_${blockIndex}.object.yml`;
                
                files.push({ filename, content, type: 'object' });
                blockIndex++;
            }
        }

        return files;
    }

    /**
     * Parse validation feedback into structured result
     */
    private parseFeedback(feedback: string): ValidateMetadataResult {
        const errors: ValidateMetadataResult['errors'] = [];
        const warnings: ValidateMetadataResult['warnings'] = [];
        const info: ValidateMetadataResult['info'] = [];

        const lines = feedback.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.includes('[ERROR]')) {
                const message = line.replace(/^\s*-?\s*\[ERROR\]\s*/, '');
                errors.push({ message });
            } else if (line.includes('[WARNING]')) {
                const message = line.replace(/^\s*-?\s*\[WARNING\]\s*/, '');
                warnings.push({ message });
            } else if (line.includes('[INFO]')) {
                const message = line.replace(/^\s*-?\s*\[INFO\]\s*/, '');
                info.push({ message });
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings,
            info,
        };
    }

    /**
     * Infer file type from filename
     */
    private inferFileType(filename: string): GenerateAppResult['files'][0]['type'] {
        if (filename.includes('.object.yml')) return 'object';
        if (filename.includes('.validation.yml')) return 'validation';
        if (filename.includes('.form.yml')) return 'form';
        if (filename.includes('.view.yml')) return 'view';
        if (filename.includes('.page.yml')) return 'page';
        return 'other';
    }
}

/**
 * Convenience function to create an agent instance
 */
export function createAgent(apiKey: string, options?: Partial<AgentConfig>): ObjectQLAgent {
    return new ObjectQLAgent({ apiKey, ...options });
}
