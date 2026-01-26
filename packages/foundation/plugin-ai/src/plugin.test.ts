/**
 * AI Plugin Tests
 * Basic tests to verify plugin functionality
 */

import { AIPlugin, createAIPlugin } from './plugin';

describe('AIPlugin', () => {
    it('should create plugin instance', () => {
        const plugin = new AIPlugin({
            enabled: true,
            provider: {
                name: 'test',
                apiKey: 'test-key'
            }
        });

        expect(plugin).toBeDefined();
        expect(plugin.name).toBe('@objectql/plugin-ai');
        expect(plugin.version).toBe('4.0.1');
    });

    it('should create plugin with createAIPlugin helper', () => {
        const plugin = createAIPlugin({
            provider: {
                name: 'test',
                apiKey: 'test-key'
            }
        });

        expect(plugin).toBeInstanceOf(AIPlugin);
    });

    it('should accept disabled configuration', () => {
        const plugin = new AIPlugin({
            enabled: false
        });

        expect(plugin).toBeDefined();
    });

    it('should accept multiple providers', () => {
        const plugin = new AIPlugin({
            provider: [
                { name: 'openai', apiKey: 'key1' },
                { name: 'anthropic', apiKey: 'key2' }
            ],
            defaultProvider: 'openai'
        });

        expect(plugin).toBeDefined();
    });
});
