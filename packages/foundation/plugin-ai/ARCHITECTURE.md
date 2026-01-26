# AI Plugin Architecture

## Overview

The `@objectql/plugin-ai` package provides AI-powered capabilities for ObjectQL applications, following the ObjectStack standard protocol specifications. It enables developers to leverage large language models (LLMs) for code generation, validation, and intelligent suggestions.

## Design Principles

### 1. Protocol-Driven Architecture

The plugin follows ObjectStack's protocol-driven approach:
- **Type Safety**: All AI operations use strict TypeScript interfaces from `@objectql/types`
- **Runtime Plugin Interface**: Implements `RuntimePlugin` for seamless kernel integration
- **Separation of Concerns**: AI logic is completely decoupled from core engine

### 2. Provider Abstraction

The plugin uses a provider pattern for maximum flexibility:
- **Multi-Provider Support**: Single or multiple AI providers (OpenAI, Anthropic, etc.)
- **Provider-Agnostic API**: Same interface regardless of underlying provider
- **Configurable Fallbacks**: Automatic fallback to default provider

### 3. Service-Oriented Design

```
AIPlugin (RuntimePlugin)
    ↓ manages
AIServiceImpl (AIService)
    ↓ uses
OpenAI / Other Providers
```

## Core Components

### 1. Type Definitions (`@objectql/types/ai.ts`)

Defines the contract for AI operations:

```typescript
- AIProvider: Provider configuration
- AIPluginConfig: Plugin configuration
- AIService: Service interface
- AIGenerationRequest/Result: Code generation
- AIValidationRequest/Result: Metadata validation
- AISuggestionRequest/Result: Intelligent suggestions
```

### 2. AI Plugin (`plugin.ts`)

**AIPlugin Class**:
- Implements `RuntimePlugin` interface
- Lifecycle hooks: `install`, `onStart`, `onStop`
- Registers AI service with kernel
- Manages configuration and providers

**AIServiceImpl Class**:
- Implements `AIService` interface
- Manages multiple AI providers
- Handles all AI operations (generate, validate, suggest)
- Parses and structures AI responses

### 3. Provider Management

The service supports multiple providers:

```typescript
// Single provider
provider: {
    name: 'openai',
    apiKey: 'xxx',
    model: 'gpt-4'
}

// Multiple providers
provider: [
    { name: 'openai', apiKey: 'xxx' },
    { name: 'anthropic', apiKey: 'yyy' }
],
defaultProvider: 'openai'
```

## Feature Implementation

### 1. Code Generation

**Flow**:
1. User provides natural language description
2. Service builds prompt from description + type (basic/complete/custom)
3. Calls AI provider with system + user prompts
4. Parses response to extract files
5. Returns structured result with metadata + TypeScript files

**Output**:
- YAML metadata files (*.object.yml, *.validation.yml, etc.)
- TypeScript implementation files (*.action.ts, *.hook.ts)
- Test files (*.test.ts)

### 2. Metadata Validation

**Flow**:
1. Receives YAML metadata (string or object)
2. Builds validation prompt with metadata + check options
3. AI analyzes against ObjectQL spec + best practices
4. Parses feedback into structured errors/warnings/info
5. Returns validation result

**Checks**:
- YAML syntax and structure
- ObjectQL specification compliance
- Business logic consistency (optional)
- Performance considerations (optional)
- Security issues (optional)

### 3. Intelligent Suggestions

**Flow**:
1. Receives context (object, metadata, user input)
2. Builds suggestion prompt based on context + type
3. AI generates contextual suggestions
4. Parses and prioritizes suggestions
5. Returns structured recommendations

**Types**:
- Field suggestions
- Validation recommendations
- Action/hook patterns
- General improvements

## Integration with ObjectQL

### Kernel Integration

The plugin registers the AI service with the ObjectStack kernel:

```typescript
async install(ctx: RuntimeContext): Promise<void> {
    this.aiService = new AIServiceImpl(this.config);
    (ctx.engine as any).aiService = this.aiService;
}
```

### Usage Pattern

```typescript
const kernel = app.getKernel();
const aiService = kernel.aiService;

const result = await aiService.generate({
    description: 'Create a CRM system',
    type: 'complete'
});
```

## Configuration

### Plugin Configuration

```typescript
{
    enabled: true,              // Enable/disable plugin
    provider: AIProvider,       // Single or multiple providers
    defaultProvider: 'openai',  // Default when multiple
    enableGeneration: true,     // Code generation
    enableValidation: true,     // Metadata validation
    enableSuggestions: true,    // Intelligent suggestions
    language: 'en',            // Response language
    customPrompts: {           // Override system prompts
        generation: '...',
        validation: '...',
        suggestions: '...'
    }
}
```

### Provider Configuration

```typescript
{
    name: 'openai',           // Provider identifier
    apiKey: 'sk-xxx',         // API key
    endpoint: 'https://...',  // Optional custom endpoint
    model: 'gpt-4',          // Model to use
    temperature: 0.7,         // Generation randomness
    maxTokens: 4000          // Max tokens per request
}
```

## Security Considerations

1. **API Key Management**: Keys should be stored in environment variables
2. **Provider Isolation**: Each provider has isolated credentials
3. **Response Validation**: All AI outputs are parsed and validated
4. **Error Handling**: Graceful degradation when AI unavailable
5. **Rate Limiting**: Handled by provider SDKs

## Extensibility

### Adding New Providers

The architecture supports adding new AI providers:

1. Create provider-specific client
2. Map to standard `AIProvider` interface
3. Add to provider initialization logic
4. No changes needed to service interface

### Custom Prompts

Users can override system prompts for:
- Domain-specific generation patterns
- Custom validation rules
- Specialized suggestion types

### Future Enhancements

- [ ] Streaming responses for long generations
- [ ] Token usage tracking and optimization
- [ ] Multi-language prompt templates
- [ ] Fine-tuned models for ObjectQL
- [ ] Caching for common operations
- [ ] Batch operations for efficiency

## Testing Strategy

### Unit Tests

- Plugin initialization
- Configuration validation
- Provider management
- Error handling

### Integration Tests

- Kernel integration
- Service registration
- End-to-end workflows

### Manual Testing

- Example demonstrations
- CLI integration
- Real API calls (requires keys)

## Performance Characteristics

- **Initialization**: O(1) - Constant time plugin setup
- **Provider Lookup**: O(1) - Map-based provider access
- **AI Calls**: Network-dependent, 1-30 seconds typical
- **Response Parsing**: O(n) - Linear in response size
- **Memory**: Minimal - Stateless service design

## Dependencies

- `@objectql/types`: Type definitions
- `@objectql/runtime`: Plugin interface
- `openai`: OpenAI SDK
- `js-yaml`: YAML parsing

## Version Compatibility

- ObjectQL: 4.0.x
- Node.js: 18+
- TypeScript: 5.3+

## References

- [ObjectStack Protocol](https://protocol.objectstack.ai)
- [ObjectQL Documentation](https://objectql.org)
- [OpenAI API](https://platform.openai.com/docs)
