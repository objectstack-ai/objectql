# @objectql/plugin-ai

AI Plugin for ObjectQL - Brings AI-powered code generation, validation, and suggestions to your ObjectQL applications.

## 🌟 Features

- **🤖 AI-Powered Code Generation**: Generate complete ObjectQL applications from natural language descriptions
- **✅ Intelligent Validation**: AI-assisted validation of ObjectQL metadata with best practices
- **💡 Smart Suggestions**: Get contextual suggestions for improving your data models and business logic
- **🔌 Extensible Providers**: Support for multiple AI providers (OpenAI, Anthropic, etc.)
- **🌍 Protocol-Compliant**: Built according to ObjectStack standard protocol specifications

## 📦 Installation

```bash
npm install @objectql/plugin-ai
# or
pnpm add @objectql/plugin-ai
```

## 🚀 Quick Start

### Basic Configuration

```typescript
import { ObjectQL } from '@objectql/core';
import { createAIPlugin } from '@objectql/plugin-ai';

const app = new ObjectQL({
  plugins: [
    createAIPlugin({
      provider: {
        name: 'openai',
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4',
        temperature: 0.7
      }
    })
  ]
});

await app.init();
```

### Multiple Providers

```typescript
const app = new ObjectQL({
  plugins: [
    createAIPlugin({
      provider: [
        {
          name: 'openai',
          apiKey: process.env.OPENAI_API_KEY,
          model: 'gpt-4'
        },
        {
          name: 'anthropic',
          apiKey: process.env.ANTHROPIC_API_KEY,
          model: 'claude-3-opus'
        }
      ],
      defaultProvider: 'openai'
    })
  ]
});
```

## 🎯 Usage

### AI Code Generation

```typescript
const kernel = app.getKernel();
const aiService = kernel.aiService;

// Generate a complete application
const result = await aiService.generate({
  description: 'Create a CRM system with contacts, companies, and deals',
  type: 'complete'
});

if (result.success) {
  result.files.forEach(file => {
    console.log(`Generated: ${file.filename} (${file.type})`);
    // Save file.content to disk
  });
}
```

### AI-Powered Validation

```typescript
const validationResult = await aiService.validate({
  metadata: yamlContent,
  filename: 'user.object.yml',
  checkBusinessLogic: true,
  checkSecurity: true,
  checkPerformance: true
});

if (!validationResult.valid) {
  validationResult.errors.forEach(error => {
    console.error(`Error: ${error.message}`);
  });
}

validationResult.warnings.forEach(warning => {
  console.warn(`Warning: ${warning.message}`);
  if (warning.suggestion) {
    console.log(`Suggestion: ${warning.suggestion}`);
  }
});
```

### Get AI Suggestions

```typescript
const suggestions = await aiService.suggest({
  context: {
    objectName: 'user',
    currentMetadata: userObjectConfig,
    userInput: 'I need to add email validation'
  },
  type: 'validations'
});

suggestions.suggestions.forEach(s => {
  console.log(`${s.title} (${s.priority})`);
  console.log(s.description);
  if (s.code) {
    console.log('Code:', s.code);
  }
});
```

## ⚙️ Configuration

### AIPluginConfig

```typescript
interface AIPluginConfig {
  // Enable/disable the plugin
  enabled?: boolean;
  
  // AI provider configuration
  provider?: AIProvider | AIProvider[];
  
  // Default provider when multiple are configured
  defaultProvider?: string;
  
  // Enable specific features
  enableGeneration?: boolean;
  enableValidation?: boolean;
  enableSuggestions?: boolean;
  
  // Preferred language for AI responses
  language?: string;
  
  // Custom system prompts
  customPrompts?: {
    generation?: string;
    validation?: string;
    suggestions?: string;
  };
}
```

### AIProvider

```typescript
interface AIProvider {
  name: string;           // Provider identifier
  apiKey: string;         // API key for authentication
  endpoint?: string;      // Optional custom endpoint
  model?: string;         // Model to use (e.g., 'gpt-4')
  temperature?: number;   // Generation temperature (0-1)
  maxTokens?: number;     // Maximum tokens per request
}
```

## 🔧 Advanced Usage

### Custom Prompts

Customize AI behavior with custom system prompts:

```typescript
createAIPlugin({
  provider: { /* ... */ },
  customPrompts: {
    generation: `You are an expert in building e-commerce systems.
Generate ObjectQL metadata following these patterns:
- Always include created_at and updated_at fields
- Use proper indexing for lookup fields
- Include comprehensive validation rules`,
    
    validation: `Focus on e-commerce best practices:
- Check for proper inventory management
- Validate pricing logic
- Ensure proper order workflow`,
    
    suggestions: `Provide suggestions specific to e-commerce:
- Performance optimization for product catalogs
- Security for payment processing
- SEO-friendly field structures`
  }
})
```

### Selective Feature Enabling

Enable only specific AI features:

```typescript
createAIPlugin({
  provider: { /* ... */ },
  enableGeneration: true,
  enableValidation: true,
  enableSuggestions: false  // Disable suggestions
})
```

## 🏗️ Architecture

The AI Plugin follows the ObjectStack standard protocol and integrates seamlessly with the ObjectQL ecosystem:

```
┌─────────────────────────────────────┐
│      @objectql/plugin-ai            │
│                                     │
│  ┌─────────────────────────────┐   │
│  │      AIPlugin               │   │
│  │  (RuntimePlugin)            │   │
│  └──────────┬──────────────────┘   │
│             │                       │
│             │ manages               │
│             ▼                       │
│  ┌─────────────────────────────┐   │
│  │      AIServiceImpl          │   │
│  │  (AIService)                │   │
│  └──────────┬──────────────────┘   │
│             │                       │
│             │ uses                  │
│             ▼                       │
│  ┌─────────────────────────────┐   │
│  │   OpenAI / AI Providers     │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
         │
         │ integrates with
         ▼
┌─────────────────────────────────────┐
│    ObjectStack Kernel               │
│                                     │
│  kernel.aiService → AIService       │
└─────────────────────────────────────┘
```

## 🧪 Testing

```bash
# Install dependencies
pnpm install

# Build the plugin
pnpm build

# Run tests
pnpm test
```

## 📝 License

MIT License - Copyright (c) 2026-present ObjectStack Inc.

## 🤝 Contributing

Contributions are welcome! Please ensure your changes follow the ObjectQL coding standards and include appropriate tests.

## 📚 Related Packages

- [@objectql/core](../core) - ObjectQL core engine
- [@objectql/types](../types) - TypeScript type definitions
- [@objectql/runtime](../../objectstack/runtime) - Runtime protocol
- [@objectql/cli](../../tools/cli) - CLI with AI commands

## 🔗 Links

- [ObjectQL Documentation](https://objectql.org)
- [ObjectStack Protocol](https://protocol.objectstack.ai)
- [GitHub Repository](https://github.com/objectql/objectql)
