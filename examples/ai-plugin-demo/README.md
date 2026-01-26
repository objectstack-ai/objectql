# AI Plugin Demo

This example demonstrates how to use the `@objectql/plugin-ai` with ObjectQL.

## Features Demonstrated

- **AI Plugin Integration**: How to configure and use the AI plugin with ObjectQL
- **Provider Configuration**: Setting up OpenAI as an AI provider
- **AI Service Access**: Accessing the AI service from the kernel

## Prerequisites

- Node.js 18+
- OpenAI API key (optional for demo, required for actual AI features)

## Setup

1. Install dependencies from the monorepo root:
   ```bash
   pnpm install
   ```

2. Build the packages:
   ```bash
   pnpm build
   ```

## Running the Example

### Without API Key (Demo Mode)
```bash
cd examples/ai-plugin-demo
npx ts-node index.ts
```

This will demonstrate the plugin initialization without making actual API calls.

### With API Key (Full Features)
```bash
export OPENAI_API_KEY=your-api-key-here
cd examples/ai-plugin-demo
npx ts-node index.ts
```

With a valid API key, the example will demonstrate:
- AI-powered code generation
- Intelligent metadata validation
- Smart suggestions

## Code Overview

The example shows:

1. **Plugin Configuration**:
   ```typescript
   createAIPlugin({
       enabled: true,
       provider: {
           name: 'openai',
           apiKey: process.env.OPENAI_API_KEY,
           model: 'gpt-4'
       },
       enableGeneration: true,
       enableValidation: true,
       enableSuggestions: true
   })
   ```

2. **Service Access**:
   ```typescript
   const kernel = app.getKernel();
   const aiService = kernel.aiService;
   ```

3. **Using AI Features**:
   - Generate complete applications from descriptions
   - Validate metadata with AI-powered analysis
   - Get intelligent suggestions for improvements

## Learn More

- [AI Plugin Documentation](../../packages/foundation/plugin-ai/README.md)
- [ObjectQL Documentation](../../README.md)
- [Plugin Development Guide](../../docs/plugins.md)
