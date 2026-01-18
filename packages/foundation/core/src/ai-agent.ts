/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * ObjectQL AI Agent - Programmatic API for AI-powered application generation
 * 
 * This module provides a high-level API for using AI to generate and validate
 * ObjectQL metadata programmatically.
 */

import OpenAI from 'openai';
import * as yaml from 'js-yaml';
import { Validator } from './validator';
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
        type: 'object' | 'validation' | 'action' | 'hook' | 'permission' | 'workflow' | 'data' | 'application' | 'typescript' | 'test' | 'other';
    }>;
    /** Any errors encountered */
    errors?: string[];
    /** AI model response (raw) */
    rawResponse?: string;
}

/**
 * Conversation message for step-by-step generation
 */
export interface ConversationMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

/**
 * Options for conversational generation
 */
export interface ConversationalGenerateOptions {
    /** Initial description or follow-up request */
    message: string;
    /** Previous conversation history */
    conversationHistory?: ConversationMessage[];
    /** Current application state (already generated files) */
    currentApp?: GenerateAppResult;
}

/**
 * Result of conversational generation
 */
export interface ConversationalGenerateResult extends GenerateAppResult {
    /** Updated conversation history */
    conversationHistory: ConversationMessage[];
    /** Suggested next steps or questions */
    suggestions?: string[];
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
    FILE_BLOCK_YAML: /(?:^|\n)(?:#|File:)\s*([a-zA-Z0-9_-]+\.[a-z]+\.yml)\s*\n```(?:yaml|yml)?\n([\s\S]*?)```/gi,
    
    /**
     * Matches TypeScript file blocks with explicit headers in the format:
     * // filename.action.ts or File: filename.hook.ts or filename.test.ts
     * followed by a TypeScript code block
     * 
     * Groups:
     * 1. filename (e.g., "approve_order.action.ts", "user.hook.ts", "user.test.ts")
     * 2. TypeScript content
     */
    FILE_BLOCK_TS: /(?:^|\n)(?:\/\/|File:)\s*([a-zA-Z0-9_-]+\.(?:action|hook|test|spec)\.ts)\s*\n```(?:typescript|ts)?\n([\s\S]*?)```/gi,
    
    /**
     * Matches generic YAML/YML code blocks without explicit headers
     * 
     * Groups:
     * 1. YAML content
     */
    CODE_BLOCK_YAML: /```(?:yaml|yml)\n([\s\S]*?)```/g,
    
    /**
     * Matches generic TypeScript code blocks without explicit headers
     * 
     * Groups:
     * 1. TypeScript content
     */
    CODE_BLOCK_TS: /```(?:typescript|ts)\n([\s\S]*?)```/g,
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
     * Conversational generation with step-by-step refinement
     * This allows users to iteratively improve the application through dialogue
     */
    async generateConversational(
        options: ConversationalGenerateOptions
    ): Promise<ConversationalGenerateResult> {
        const systemPrompt = this.getSystemPrompt();
        
        // Initialize or continue conversation
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: 'system', content: systemPrompt }
        ];

        // Add conversation history if provided
        if (options.conversationHistory) {
            messages.push(...options.conversationHistory.filter(m => m.role !== 'system'));
        }

        // Build the user message
        let userMessage = options.message;
        
        // If there's a current app state, include it in context
        if (options.currentApp && options.currentApp.files.length > 0) {
            const currentState = options.currentApp.files
                .map(f => `# ${f.filename}\n${f.content}`)
                .join('\n\n---\n\n');
            
            userMessage = `Current application state:\n\n${currentState}\n\n---\n\nUser request: ${options.message}\n\nPlease update the application according to the user's request. Provide the complete updated files.`;
        }

        messages.push({ role: 'user', content: userMessage });

        try {
            const completion = await this.openai.chat.completions.create({
                model: this.config.model,
                messages,
                temperature: this.config.temperature,
                max_tokens: 4000,
            });

            const response = completion.choices[0]?.message?.content;
            if (!response) {
                return {
                    success: false,
                    files: [],
                    conversationHistory: [...(options.conversationHistory || []), 
                        { role: 'user', content: options.message }],
                    errors: ['No response from AI model'],
                };
            }

            // Parse the response
            const files = this.parseGenerationResponse(response);

            // Update conversation history
            const updatedHistory: ConversationMessage[] = [
                ...(options.conversationHistory || []),
                { role: 'user', content: options.message },
                { role: 'assistant', content: response }
            ];

            // Generate suggestions for next steps
            const suggestions = this.generateSuggestions(files, options.currentApp);

            return {
                success: files.length > 0,
                files,
                rawResponse: response,
                conversationHistory: updatedHistory,
                suggestions,
                errors: files.length === 0 ? ['Failed to extract metadata files from response'] : undefined,
            };

        } catch (error) {
            return {
                success: false,
                files: [],
                conversationHistory: [...(options.conversationHistory || []), 
                    { role: 'user', content: options.message }],
                errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
        }
    }

    /**
     * Generate suggestions for next steps based on current application state
     */
    private generateSuggestions(
        currentFiles: GenerateAppResult['files'],
        previousApp?: GenerateAppResult
    ): string[] {
        const suggestions: string[] = [];
        
        // Check what metadata types are missing
        const fileTypes = new Set(currentFiles.map(f => f.type));
        
        const allTypes = [
            'object', 'validation', 'action', 'hook', 'permission', 'workflow', 'data'
        ];
        
        const missingTypes = allTypes.filter(t => !fileTypes.has(t as any));
        
        if (missingTypes.length > 0) {
            suggestions.push(`Consider adding: ${missingTypes.join(', ')}`);
        }
        
        if (!fileTypes.has('permission')) {
            suggestions.push('Add permissions to control access');
        }
        
        if (!fileTypes.has('workflow') && fileTypes.has('object')) {
            suggestions.push('Add workflows for approval processes');
        }

        return suggestions;
    }

    /**
     * Get system prompt for metadata generation
     */
    private getSystemPrompt(): string {
        return `You are an expert ObjectQL architect. Generate valid ObjectQL metadata in YAML format AND TypeScript implementation files for business logic.

Follow ObjectQL metadata standards for ALL metadata types:

**1. Core Data Layer:**
- Objects (*.object.yml): entities, fields, relationships, indexes
- Validations (*.validation.yml): validation rules, business constraints
- Data (*.data.yml): seed data and initial records

**2. Business Logic Layer (YAML + TypeScript):**
- Actions (*.action.yml + *.action.ts): custom RPC operations with TypeScript implementation
- Hooks (*.hook.yml + *.hook.ts): lifecycle triggers with TypeScript implementation
  - beforeCreate, afterCreate, beforeUpdate, afterUpdate, beforeDelete, afterDelete
- Workflows (*.workflow.yml): approval processes, automation

**3. Security Layer:**
- Permissions (*.permission.yml): access control rules
- Application (*.application.yml): app-level configuration

**Field Types:** text, number, boolean, select, date, datetime, lookup, currency, email, phone, url, textarea, formula, file, image

**For Actions - Generate BOTH files:**
Example:
# approve_order.action.yml
\`\`\`yaml
label: Approve Order
type: record
params:
  comment:
    type: textarea
    label: Comment
\`\`\`

# approve_order.action.ts
\`\`\`typescript
import { ActionContext } from '@objectql/types';

export default async function approveOrder(context: ActionContext) {
  const { recordId, params, user, app } = context;
  
  // Business logic here
  const record = await app.findOne('orders', { _id: recordId });
  
  if (!record) {
    throw new Error('Order not found');
  }
  
  await app.update('orders', recordId, {
    status: 'approved',
    approved_by: user.id,
    approved_at: new Date(),
    approval_comment: params.comment
  });
  
  return { success: true, message: 'Order approved successfully' };
}
\`\`\`

**For Hooks - Generate BOTH files:**
Example:
# user.hook.yml
\`\`\`yaml
triggers:
  - beforeCreate
  - beforeUpdate
\`\`\`

# user.hook.ts
\`\`\`typescript
import { HookContext } from '@objectql/types';

export async function beforeCreate(context: HookContext) {
  const { data, user } = context;
  
  // Auto-assign creator
  data.created_by = user.id;
  data.created_at = new Date();
  
  // Validate email uniqueness (example)
  const existing = await context.app.findOne('users', { email: data.email });
  if (existing) {
    throw new Error('Email already exists');
  }
}

export async function beforeUpdate(context: HookContext) {
  const { data, previousData, user } = context;
  
  data.updated_by = user.id;
  data.updated_at = new Date();
}
\`\`\`

**For Tests - Generate test files:**
Example:
// approve_order.test.ts
\`\`\`typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { ObjectQL } from '@objectql/core';
import approveOrder from './approve_order.action';

describe('approve_order action', () => {
  let app: ObjectQL;
  let testUser: any;
  
  beforeEach(async () => {
    // Setup test environment
    app = new ObjectQL(/* test config */);
    await app.connect();
    testUser = { id: 'user123', name: 'Test User' };
  });
  
  it('should approve an order successfully', async () => {
    // Create test order
    const order = await app.create('orders', {
      status: 'pending',
      total: 100
    });
    
    // Execute action
    const result = await approveOrder({
      recordId: order.id,
      params: { comment: 'Approved' },
      user: testUser,
      app
    });
    
    // Verify
    expect(result.success).toBe(true);
    const updated = await app.findOne('orders', { _id: order.id });
    expect(updated.status).toBe('approved');
  });
  
  it('should reject if order not found', async () => {
    await expect(approveOrder({
      recordId: 'invalid_id',
      params: { comment: 'Test' },
      user: testUser,
      app
    })).rejects.toThrow('Order not found');
  });
});
\`\`\`

**Best Practices:**
- Use snake_case for names
- Clear, business-friendly labels
- Include validation rules
- Add help text for clarity
- Define proper relationships
- Consider security from the start
- Implement actual business logic in TypeScript files
- Include error handling in implementations
- Add comments explaining complex logic
- Write comprehensive tests for all business logic
- Test both success and failure cases

Output format: Provide each file in code blocks with filename headers (e.g., "# filename.object.yml" or "// filename.action.ts").`;
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
- At least one action with TypeScript implementation
- At least one hook with TypeScript implementation

Output: Provide each file separately with clear filename headers (e.g., "# filename.object.yml" or "// filename.action.ts").`;

            case 'complete':
                return `Generate a complete ObjectQL enterprise application for: ${description}

Include ALL necessary metadata types WITH implementations:
1. **Objects**: All entities with comprehensive fields
2. **Validations**: Business rules and constraints
3. **Actions WITH TypeScript implementations**: Common operations (approve, export, etc.) - Generate BOTH .yml metadata AND .action.ts implementation files
4. **Hooks WITH TypeScript implementations**: Lifecycle triggers - Generate .hook.ts implementation files
5. **Permissions**: Basic access control
6. **Data**: Sample seed data (optional)
7. **Workflows**: Approval processes if applicable
8. **Tests**: Generate test files (.test.ts) for actions and hooks to validate business logic

Consider:
- Security and permissions from the start
- Business processes and workflows
- Data integrity and validation
- Complete TypeScript implementations for all actions and hooks
- Test coverage for business logic

Output: Provide each file separately with clear filename headers (e.g., "# filename.object.yml" or "// filename.action.ts").`;

            default:
                return `Generate ObjectQL metadata for: ${description}

Analyze the requirements and create appropriate metadata across ALL relevant types:
- Objects, Validations, Forms, Views, Pages, Menus, Actions, Hooks, Permissions, Workflows, Reports, Data, Application
- For Actions and Hooks: Generate BOTH YAML metadata AND TypeScript implementation files
- Include test files to validate business logic

Output: Provide each file separately with clear filename headers (e.g., "# filename.object.yml" or "// filename.action.ts").`;
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
        let match;
        
        // Extract YAML files with explicit headers
        while ((match = AI_RESPONSE_PATTERNS.FILE_BLOCK_YAML.exec(response)) !== null) {
            const filename = match[1];
            const content = match[2].trim();
            const type = this.inferFileType(filename);
            
            files.push({ filename, content, type });
        }
        
        // Extract TypeScript files with explicit headers
        while ((match = AI_RESPONSE_PATTERNS.FILE_BLOCK_TS.exec(response)) !== null) {
            const filename = match[1];
            const content = match[2].trim();
            const type = this.inferFileType(filename);
            
            files.push({ filename, content, type });
        }

        // Fallback: Generic code blocks if no explicit headers found
        if (files.length === 0) {
            let yamlIndex = 0;
            let tsIndex = 0;
            
            // Try to extract generic YAML blocks
            while ((match = AI_RESPONSE_PATTERNS.CODE_BLOCK_YAML.exec(response)) !== null) {
                const content = match[1].trim();
                const filename = `generated_${yamlIndex}.object.yml`;
                
                files.push({ filename, content, type: 'object' });
                yamlIndex++;
            }
            
            // Try to extract generic TypeScript blocks
            while ((match = AI_RESPONSE_PATTERNS.CODE_BLOCK_TS.exec(response)) !== null) {
                const content = match[1].trim();
                // Use generic .ts extension since we can't determine the specific type
                const filename = `generated_${tsIndex}.ts`;
                
                files.push({ filename, content, type: 'typescript' });
                tsIndex++;
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
 * Convenience function to create an agent instance
 */
export function createAgent(apiKey: string, options?: Partial<AgentConfig>): ObjectQLAgent {
    return new ObjectQLAgent({ apiKey, ...options });
}
