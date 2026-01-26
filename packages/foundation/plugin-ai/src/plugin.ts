/**
 * @objectql/plugin-ai
 * AI Plugin for ObjectQL
 * 
 * Copyright (c) 2026-present ObjectStack Inc.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { RuntimePlugin, RuntimeContext } from '@objectql/runtime';
import type { 
    AIPluginConfig, 
    AIService,
    AIProvider,
    AIGenerationRequest,
    AIGenerationResult,
    AIValidationRequest,
    AIValidationResult,
    AISuggestionRequest,
    AISuggestionResult
} from '@objectql/types';
import OpenAI from 'openai';
import * as yaml from 'js-yaml';

/**
 * AI Service Implementation
 * Handles AI operations using configured providers
 */
export class AIServiceImpl implements AIService {
    private providers: Map<string, OpenAI> = new Map();
    private defaultProvider: string = 'default';
    private config: AIPluginConfig;

    constructor(config: AIPluginConfig) {
        this.config = config;
        this.initializeProviders();
    }

    /**
     * Initialize AI providers from configuration
     */
    private initializeProviders(): void {
        const providerConfig = this.config.provider;
        
        if (!providerConfig) {
            console.warn('[AI Plugin] No AI provider configured');
            return;
        }

        // Handle single provider
        if (!Array.isArray(providerConfig)) {
            const client = new OpenAI({ apiKey: providerConfig.apiKey });
            this.providers.set(providerConfig.name || 'default', client);
            this.defaultProvider = providerConfig.name || 'default';
            return;
        }

        // Handle multiple providers
        for (const provider of providerConfig) {
            const client = new OpenAI({ apiKey: provider.apiKey });
            this.providers.set(provider.name, client);
        }

        // Set default provider
        if (this.config.defaultProvider) {
            this.defaultProvider = this.config.defaultProvider;
        } else if (providerConfig.length > 0) {
            this.defaultProvider = providerConfig[0].name;
        }
    }

    /**
     * Get OpenAI client for a provider
     */
    private getClient(providerName?: string): OpenAI {
        const name = providerName || this.defaultProvider;
        const client = this.providers.get(name);
        
        if (!client) {
            throw new Error(`AI provider '${name}' not configured`);
        }
        
        return client;
    }

    /**
     * Get provider configuration
     */
    private getProviderConfig(providerName?: string): AIProvider {
        const name = providerName || this.defaultProvider;
        const providerConfig = this.config.provider;
        
        if (!providerConfig) {
            throw new Error('No AI provider configured');
        }

        if (!Array.isArray(providerConfig)) {
            return providerConfig;
        }

        const provider = providerConfig.find(p => p.name === name);
        if (!provider) {
            throw new Error(`Provider '${name}' not found in configuration`);
        }

        return provider;
    }

    /**
     * Generate metadata from description
     */
    async generate(request: AIGenerationRequest): Promise<AIGenerationResult> {
        if (this.config.enableGeneration === false) {
            return {
                success: false,
                files: [],
                errors: ['AI generation is disabled in configuration']
            };
        }

        const client = this.getClient(request.provider);
        const providerConfig = this.getProviderConfig(request.provider);
        
        const systemPrompt = this.config.customPrompts?.generation || this.getDefaultGenerationPrompt();
        const userPrompt = this.buildGenerationPrompt(request);

        try {
            const completion = await client.chat.completions.create({
                model: providerConfig.model || 'gpt-4',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: providerConfig.temperature ?? 0.7,
                max_tokens: request.maxTokens || providerConfig.maxTokens || 4000,
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
    async validate(request: AIValidationRequest): Promise<AIValidationResult> {
        if (this.config.enableValidation === false) {
            return {
                valid: true,
                errors: [],
                warnings: [],
                info: [{ message: 'AI validation is disabled in configuration' }]
            };
        }

        const client = this.getClient(request.provider);
        const providerConfig = this.getProviderConfig(request.provider);

        // Parse metadata if it's a string
        let parsedMetadata: any;
        if (typeof request.metadata === 'string') {
            try {
                parsedMetadata = yaml.load(request.metadata);
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
            parsedMetadata = request.metadata;
        }

        const systemPrompt = this.config.customPrompts?.validation || this.getDefaultValidationPrompt();
        const userPrompt = this.buildValidationPrompt(request);

        try {
            const completion = await client.chat.completions.create({
                model: providerConfig.model || 'gpt-4',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
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
     * Get AI suggestions
     */
    async suggest(request: AISuggestionRequest): Promise<AISuggestionResult> {
        if (this.config.enableSuggestions === false) {
            return {
                success: false,
                suggestions: [],
                errors: ['AI suggestions are disabled in configuration']
            };
        }

        const client = this.getClient(request.provider);
        const providerConfig = this.getProviderConfig(request.provider);

        const systemPrompt = this.config.customPrompts?.suggestions || this.getDefaultSuggestionsPrompt();
        const userPrompt = this.buildSuggestionsPrompt(request);

        try {
            const completion = await client.chat.completions.create({
                model: providerConfig.model || 'gpt-4',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: providerConfig.temperature ?? 0.7,
                max_tokens: 1500,
            });

            const response = completion.choices[0]?.message?.content || '';
            const suggestions = this.parseSuggestions(response);

            return {
                success: suggestions.length > 0,
                suggestions,
                errors: suggestions.length === 0 ? ['No suggestions generated'] : undefined
            };

        } catch (error) {
            return {
                success: false,
                suggestions: [],
                errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
        }
    }

    /**
     * Get available providers
     */
    getProviders(): string[] {
        return Array.from(this.providers.keys());
    }

    /**
     * Get default provider
     */
    getDefaultProvider(): string {
        return this.defaultProvider;
    }

    /**
     * Get default generation system prompt
     */
    private getDefaultGenerationPrompt(): string {
        return `You are an expert ObjectQL architect. Generate valid ObjectQL metadata in YAML format AND TypeScript implementation files for business logic.

Follow ObjectQL metadata standards for ALL metadata types:

**1. Core Data Layer:**
- Objects (*.object.yml): entities, fields, relationships, indexes
- Validations (*.validation.yml): validation rules, business constraints
- Data (*.data.yml): seed data and initial records

**2. Business Logic Layer (YAML + TypeScript):**
- Actions (*.action.yml + *.action.ts): custom RPC operations with TypeScript implementation
- Hooks (*.hook.yml + *.hook.ts): lifecycle triggers with TypeScript implementation

**3. Security Layer:**
- Permissions (*.permission.yml): access control rules

**Field Types:** text, number, boolean, select, date, datetime, lookup, currency, email, phone, url, textarea, formula

Output format: Provide each file in code blocks with filename headers (e.g., "# filename.object.yml" or "// filename.action.ts").`;
    }

    /**
     * Get default validation system prompt
     */
    private getDefaultValidationPrompt(): string {
        return `You are an expert ObjectQL metadata validator. Analyze metadata for:
1. YAML structure and syntax
2. ObjectQL specification compliance
3. Business logic consistency
4. Data modeling best practices
5. Security considerations

Provide feedback in this format:
- [ERROR] Location: Issue description
- [WARNING] Location: Issue description  
- [INFO] Location: Suggestion`;
    }

    /**
     * Get default suggestions system prompt
     */
    private getDefaultSuggestionsPrompt(): string {
        return `You are an expert ObjectQL consultant. Provide helpful suggestions for improving ObjectQL metadata and implementations.

Focus on:
- Best practices
- Common patterns
- Performance optimizations
- Security improvements
- Code quality

Format each suggestion as:
TITLE: [Brief title]
DESCRIPTION: [Detailed explanation]
PRIORITY: [high|medium|low]
CODE: [Optional code snippet]`;
    }

    /**
     * Build generation prompt based on request
     */
    private buildGenerationPrompt(request: AIGenerationRequest): string {
        const { description, type = 'custom' } = request;

        switch (type) {
            case 'basic':
                return `Generate a minimal ObjectQL application for: ${description}

Include:
- 2-3 core objects with essential fields
- Basic relationships between objects
- Simple validation rules
- At least one action with TypeScript implementation

Output: Provide each file separately with clear filename headers.`;

            case 'complete':
                return `Generate a complete ObjectQL enterprise application for: ${description}

Include ALL necessary metadata types WITH implementations:
1. **Objects**: All entities with comprehensive fields
2. **Validations**: Business rules and constraints
3. **Actions WITH TypeScript implementations**: Common operations
4. **Hooks WITH TypeScript implementations**: Lifecycle triggers
5. **Permissions**: Basic access control

Output: Provide each file separately with clear filename headers.`;

            default:
                return `Generate ObjectQL metadata for: ${description}

Analyze the requirements and create appropriate metadata across relevant types.
Output: Provide each file separately with clear filename headers.`;
        }
    }

    /**
     * Build validation prompt
     */
    private buildValidationPrompt(request: AIValidationRequest): string {
        const metadataStr = typeof request.metadata === 'string' 
            ? request.metadata 
            : yaml.dump(request.metadata);

        const checks = [];
        if (request.checkBusinessLogic !== false) checks.push('Business logic consistency');
        if (request.checkPerformance) checks.push('Performance considerations');
        if (request.checkSecurity) checks.push('Security issues');

        return `Validate this ObjectQL metadata file:

${request.filename ? `Filename: ${request.filename}\n` : ''}
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
     * Build suggestions prompt
     */
    private buildSuggestionsPrompt(request: AISuggestionRequest): string {
        const { context, type } = request;

        let prompt = 'Provide suggestions for improving this ObjectQL implementation:\n\n';

        if (context.objectName) {
            prompt += `Object: ${context.objectName}\n`;
        }

        if (context.currentMetadata) {
            const metadataStr = typeof context.currentMetadata === 'string'
                ? context.currentMetadata
                : yaml.dump(context.currentMetadata);
            prompt += `\nCurrent Metadata:\n\`\`\`yaml\n${metadataStr}\n\`\`\`\n`;
        }

        if (context.userInput) {
            prompt += `\nUser Input: ${context.userInput}\n`;
        }

        if (type) {
            prompt += `\nFocus on: ${type}\n`;
        }

        return prompt;
    }

    /**
     * Parse generation response and extract files
     */
    private parseGenerationResponse(response: string): AIGenerationResult['files'] {
        const files: AIGenerationResult['files'] = [];
        
        // Pattern for YAML files with explicit headers
        const yamlFilePattern = /(?:^|\n)(?:#|File:)\s*([a-zA-Z0-9_-]+\.[a-z]+\.yml)\s*\n```(?:yaml|yml)?\n([\s\S]*?)```/gi;
        
        // Pattern for TypeScript files with explicit headers
        const tsFilePattern = /(?:^|\n)(?:\/\/|File:)\s*([a-zA-Z0-9_-]+\.(?:action|hook|test|spec)\.ts)\s*\n```(?:typescript|ts)?\n([\s\S]*?)```/gi;
        
        let match;
        
        // Extract YAML files
        while ((match = yamlFilePattern.exec(response)) !== null) {
            const filename = match[1];
            const content = match[2].trim();
            const type = this.inferFileType(filename);
            files.push({ filename, content, type });
        }
        
        // Extract TypeScript files
        while ((match = tsFilePattern.exec(response)) !== null) {
            const filename = match[1];
            const content = match[2].trim();
            const type = this.inferFileType(filename);
            files.push({ filename, content, type });
        }

        return files;
    }

    /**
     * Parse validation feedback
     */
    private parseFeedback(feedback: string): AIValidationResult {
        const errors: AIValidationResult['errors'] = [];
        const warnings: AIValidationResult['warnings'] = [];
        const info: AIValidationResult['info'] = [];

        const lines = feedback.split('\n');

        for (const line of lines) {
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
     * Parse suggestions response
     */
    private parseSuggestions(response: string): AISuggestionResult['suggestions'] {
        const suggestions: AISuggestionResult['suggestions'] = [];
        
        // Simple parsing - split by TITLE markers
        const sections = response.split(/TITLE:/i);
        
        for (let i = 1; i < sections.length; i++) {
            const section = sections[i];
            
            const titleMatch = section.match(/^([^\n]+)/);
            const descMatch = section.match(/DESCRIPTION:\s*([^\n]+(?:\n(?!PRIORITY:|CODE:)[^\n]+)*)/i);
            const priorityMatch = section.match(/PRIORITY:\s*(high|medium|low)/i);
            const codeMatch = section.match(/CODE:\s*```[\s\S]*?```/i);
            
            if (titleMatch) {
                suggestions.push({
                    title: titleMatch[1].trim(),
                    description: descMatch ? descMatch[1].trim() : '',
                    priority: (priorityMatch?.[1] as any) || 'medium',
                    code: codeMatch ? codeMatch[0].replace(/CODE:\s*```(?:typescript|ts|yaml|yml)?\n?/i, '').replace(/```$/, '').trim() : undefined
                });
            }
        }

        return suggestions;
    }

    /**
     * Infer file type from filename
     */
    private inferFileType(filename: string): AIGenerationResult['files'][0]['type'] {
        if (filename.includes('.object.yml')) return 'object';
        if (filename.includes('.validation.yml')) return 'validation';
        if (filename.includes('.action.yml')) return 'action';
        if (filename.includes('.hook.yml')) return 'hook';
        if (filename.includes('.permission.yml')) return 'permission';
        if (filename.includes('.workflow.yml')) return 'workflow';
        if (filename.includes('.data.yml')) return 'data';
        if (filename.includes('.application.yml') || filename.includes('.app.yml')) return 'application';
        if (filename.includes('.action.ts') || filename.includes('.hook.ts')) return 'typescript';
        if (filename.includes('.test.ts') || filename.includes('.spec.ts')) return 'test';
        return 'other';
    }
}

/**
 * AI Plugin for ObjectQL
 * 
 * Provides AI-powered features:
 * - Code generation from natural language
 * - Metadata validation
 * - Intelligent suggestions
 */
export class AIPlugin implements RuntimePlugin {
    name = '@objectql/plugin-ai';
    version = '4.0.1';
    
    private aiService?: AIService;
    
    constructor(private config: AIPluginConfig = {}) {
        // Set defaults
        this.config = {
            enabled: true,
            enableGeneration: true,
            enableValidation: true,
            enableSuggestions: true,
            language: 'en',
            ...config
        };
    }
    
    /**
     * Install the plugin
     */
    async install(ctx: RuntimeContext): Promise<void> {
        if (this.config.enabled === false) {
            console.log(`[${this.name}] Plugin is disabled`);
            return;
        }

        console.log(`[${this.name}] Installing AI plugin...`);
        
        // Initialize AI service
        if (this.config.provider) {
            this.aiService = new AIServiceImpl(this.config);
            
            // Register AI service in kernel
            (ctx.engine as any).aiService = this.aiService;
            
            console.log(`[${this.name}] AI service initialized with providers: ${this.aiService.getProviders().join(', ')}`);
        } else {
            console.warn(`[${this.name}] No AI provider configured. AI features will be unavailable.`);
        }
        
        console.log(`[${this.name}] Plugin installed successfully`);
    }
    
    /**
     * Called when kernel starts
     */
    async onStart(ctx: RuntimeContext): Promise<void> {
        if (this.config.enabled === false) {
            return;
        }

        console.log(`[${this.name}] AI plugin started`);
        
        if (this.aiService) {
            console.log(`[${this.name}] AI features available: generation=${this.config.enableGeneration}, validation=${this.config.enableValidation}, suggestions=${this.config.enableSuggestions}`);
        }
    }
    
    /**
     * Called when kernel stops
     */
    async onStop(ctx: RuntimeContext): Promise<void> {
        console.log(`[${this.name}] AI plugin stopped`);
    }
    
    /**
     * Get AI service instance
     */
    getService(): AIService | undefined {
        return this.aiService;
    }
}

/**
 * Convenience function to create an AI plugin instance
 */
export function createAIPlugin(config: AIPluginConfig): AIPlugin {
    return new AIPlugin(config);
}
