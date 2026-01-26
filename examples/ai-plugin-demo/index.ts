/**
 * AI Plugin Usage Example
 * 
 * This example demonstrates how to use the AI Plugin with ObjectQL
 */

import { ObjectQL } from '@objectql/core';
import { createAIPlugin } from '@objectql/plugin-ai';
import { MemoryDriver } from '@objectql/driver-memory';

async function main() {
    console.log('🤖 ObjectQL AI Plugin Example\n');
    
    // Create ObjectQL instance with AI plugin
    const app = new ObjectQL({
        datasources: {
            default: new MemoryDriver()
        },
        plugins: [
            createAIPlugin({
                enabled: true,
                provider: {
                    name: 'openai',
                    apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here',
                    model: 'gpt-4',
                    temperature: 0.7
                },
                enableGeneration: true,
                enableValidation: true,
                enableSuggestions: true,
                language: 'en'
            })
        ]
    });

    await app.init();
    
    const kernel = app.getKernel();
    const aiService = (kernel as any).aiService;
    
    if (!aiService) {
        console.error('❌ AI Service not available. Please configure AI provider.');
        return;
    }

    console.log('✅ AI Service initialized\n');
    console.log('Available providers:', aiService.getProviders());
    console.log('Default provider:', aiService.getDefaultProvider());
    console.log('\n---\n');

    console.log('📝 Examples require OPENAI_API_KEY to be set in environment');
    console.log('ℹ️  Plugin is successfully integrated and ready to use!');
}

// Run the example
main().catch(console.error);
