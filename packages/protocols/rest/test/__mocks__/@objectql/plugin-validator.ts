/**
 * Mock for @objectql/plugin-validator
 * Used in tests to avoid importing the actual plugin
 */

export class Validator {
    constructor(options: any = {}) {}
    
    async validate(context: any): Promise<any> {
        return { isValid: true, errors: [] };
    }
}

export class ValidatorPlugin {
    name = 'validator';
    
    async install(ctx: any): Promise<void> {}
    async onStart(ctx: any): Promise<void> {}
}

export interface ValidatorPluginConfig {
    language?: string;
    languageFallback?: string[];
}
