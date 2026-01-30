# @objectql/plugin-ai-agent

AI Agent plugin for ObjectQL - AI-powered application generation and validation using OpenAI.

## Features

- **Application Generation**: Generate complete ObjectQL applications from natural language descriptions
- **Metadata Validation**: AI-powered validation of ObjectQL metadata files
- **Conversational Generation**: Iterative application refinement through dialogue
- **Metadata Refinement**: Improve existing metadata based on feedback

## Installation

```bash
npm install @objectql/plugin-ai-agent
```

## Usage

```typescript
import { ObjectQLAgent, createAgent } from '@objectql/plugin-ai-agent';

// Create an agent instance
const agent = createAgent(process.env.OPENAI_API_KEY);

// Generate an application
const result = await agent.generateApp({
  description: 'A CRM system with contacts, companies, and opportunities',
  type: 'complete'
});

// Validate metadata
const validation = await agent.validateMetadata({
  metadata: myMetadataContent,
  filename: 'contact.object.yml',
  checkBusinessLogic: true
});
```

## API

### `ObjectQLAgent`

Main class for AI-powered application generation and validation.

#### Methods

- `generateApp(options)`: Generate application metadata from natural language
- `validateMetadata(options)`: Validate metadata using AI
- `refineMetadata(metadata, feedback)`: Refine metadata based on feedback
- `generateConversational(options)`: Conversational generation with step-by-step refinement

### `createAgent(apiKey, options?)`

Convenience function to create an `ObjectQLAgent` instance.

## License

MIT
