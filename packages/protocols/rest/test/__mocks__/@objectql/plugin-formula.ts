/**
 * Mock for @objectql/plugin-formula
 * Used in tests to avoid importing the actual plugin
 */

export class FormulaEngine {
    constructor(config: any = {}) {}
    
    async evaluate(context: any): Promise<any> {
        return { value: null, type: 'unknown' };
    }
}

export class FormulaPlugin {
    name = 'formula';
    
    async install(ctx: any): Promise<void> {}
    async onStart(ctx: any): Promise<void> {}
}

export interface FormulaPluginConfig {
    enable_cache?: boolean;
    cache_ttl?: number;
}
