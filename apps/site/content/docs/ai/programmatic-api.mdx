# Programmatic AI API

The ObjectQL AI Agent provides a programmatic API for generating and validating applications in your Node.js code.

## Overview

The AI Agent is available in `@objectql/core` package and can be used to:
- Generate applications from natural language
- Validate metadata programmatically
- Build interactive application builders
- Create AI-powered development tools

## Installation

The AI Agent is part of the core package:

```bash
npm install @objectql/core
```

## Basic Usage

### Creating an Agent

```typescript
import { ObjectQLAgent } from '@objectql/core';

const agent = new ObjectQLAgent({
  apiKey: process.env.OPENAI_API_KEY!,
  model: process.env.OPENAI_MODEL || 'gpt-4', // optional, default: 'gpt-4'
  temperature: 0.7, // optional, default: 0.7
  language: 'en' // optional, default: 'en'
});
```

### Generating Applications

```typescript
const result = await agent.generateApp({
  description: 'A task management system with projects and tasks',
  type: 'complete', // 'basic' | 'complete' | 'custom'
  maxTokens: 4000 // optional
});

if (result.success) {
  console.log(`Generated ${result.files.length} files:`);
  
  for (const file of result.files) {
    console.log(`- ${file.filename} (${file.type})`);
    
    // Write to disk
    fs.writeFileSync(
      path.join('./src', file.filename),
      file.content
    );
  }
} else {
  console.error('Errors:', result.errors);
}
```

### Validating Metadata

```typescript
const yamlContent = fs.readFileSync('./user.object.yml', 'utf8');

const validation = await agent.validateMetadata({
  metadata: yamlContent,
  filename: 'user.object.yml',
  checkBusinessLogic: true,
  checkPerformance: true,
  checkSecurity: true
});

if (!validation.valid) {
  console.log('Errors:');
  validation.errors.forEach(err => {
    console.log(`  - ${err.message} (${err.location})`);
  });
}

if (validation.warnings.length > 0) {
  console.log('Warnings:');
  validation.warnings.forEach(warn => {
    console.log(`  - ${warn.message}`);
    if (warn.suggestion) {
      console.log(`    Suggestion: ${warn.suggestion}`);
    }
  });
}
```

### Interactive Conversational Generation

Build applications through multi-turn conversation:

```typescript
let conversationHistory: ConversationMessage[] = [];
let currentApp: GenerateAppResult | undefined;

// First turn
const result1 = await agent.generateConversational({
  message: 'Create a blog system with posts and comments',
  conversationHistory,
  currentApp
});

conversationHistory = result1.conversationHistory;
currentApp = result1;

console.log('Generated files:', result1.files.map(f => f.filename));
console.log('Suggestions:', result1.suggestions);

// Second turn - refine based on user feedback
const result2 = await agent.generateConversational({
  message: 'Add tags to posts and categories for organization',
  conversationHistory,
  currentApp
});

conversationHistory = result2.conversationHistory;
currentApp = result2;

console.log('Updated files:', result2.files.map(f => f.filename));
```

### Refining Metadata

Iteratively improve metadata based on feedback:

```typescript
const initialMetadata = `
label: User
fields:
  name:
    type: string  # Wrong - should be 'text'
  email:
    type: text
`;

const refined = await agent.refineMetadata(
  initialMetadata,
  'Fix field types and add email validation',
  2 // number of refinement iterations
);

console.log('Refined metadata:', refined.files[0].content);
```

## TypeScript Types

### AgentConfig

```typescript
interface AgentConfig {
  /** OpenAI API key */
  apiKey: string;
  /** OpenAI model to use (default: gpt-4) */
  model?: string;
  /** Temperature for generation (0-1, default: 0.7) */
  temperature?: number;
  /** Preferred language for messages (default: en) */
  language?: string;
}
```

### GenerateAppOptions

```typescript
interface GenerateAppOptions {
  /** Natural language description of the application */
  description: string;
  /** Type of generation: basic (minimal), complete (comprehensive), or custom */
  type?: 'basic' | 'complete' | 'custom';
  /** Maximum tokens for generation */
  maxTokens?: number;
}
```

### GenerateAppResult

```typescript
interface GenerateAppResult {
  /** Whether generation was successful */
  success: boolean;
  /** Generated metadata files */
  files: Array<{
    filename: string;
    content: string;
    type: 'object' | 'validation' | 'form' | 'view' | 'page' | 
          'menu' | 'action' | 'hook' | 'permission' | 'workflow' | 
          'report' | 'data' | 'application' | 'typescript' | 'test' | 'other';
  }>;
  /** Any errors encountered */
  errors?: string[];
  /** AI model response (raw) */
  rawResponse?: string;
}
```

### ValidateMetadataOptions

```typescript
interface ValidateMetadataOptions {
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
```

### ValidateMetadataResult

```typescript
interface ValidateMetadataResult {
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
```

### ConversationMessage

```typescript
interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
```

### ConversationalGenerateOptions

```typescript
interface ConversationalGenerateOptions {
  /** Initial description or follow-up request */
  message: string;
  /** Previous conversation history */
  conversationHistory?: ConversationMessage[];
  /** Current application state (already generated files) */
  currentApp?: GenerateAppResult;
}
```

### ConversationalGenerateResult

```typescript
interface ConversationalGenerateResult extends GenerateAppResult {
  /** Updated conversation history */
  conversationHistory: ConversationMessage[];
  /** Suggested next steps or questions */
  suggestions?: string[];
}
```

## Advanced Examples

### Building a Web UI for App Generation

```typescript
import express from 'express';
import { ObjectQLAgent } from '@objectql/core';

const app = express();
const agent = new ObjectQLAgent({ apiKey: process.env.OPENAI_API_KEY! });

// Store conversations per session
const sessions = new Map<string, ConversationMessage[]>();

app.post('/api/generate', async (req, res) => {
  const { sessionId, message, currentApp } = req.body;
  
  const conversationHistory = sessions.get(sessionId) || [];
  
  const result = await agent.generateConversational({
    message,
    conversationHistory,
    currentApp
  });
  
  sessions.set(sessionId, result.conversationHistory);
  
  res.json(result);
});

app.listen(3000);
```

### Automated Testing of Generated Apps

```typescript
import { ObjectQLAgent } from '@objectql/core';
import { ObjectQL } from '@objectql/core';

async function generateAndTest(description: string) {
  const agent = new ObjectQLAgent({ apiKey: process.env.OPENAI_API_KEY! });
  
  // Generate app
  const result = await agent.generateApp({
    description,
    type: 'complete'
  });
  
  if (!result.success) {
    throw new Error('Generation failed');
  }
  
  // Write files
  for (const file of result.files) {
    fs.writeFileSync(`./test-app/${file.filename}`, file.content);
  }
  
  // Validate all metadata
  for (const file of result.files.filter(f => f.filename.endsWith('.yml'))) {
    const validation = await agent.validateMetadata({
      metadata: file.content,
      filename: file.filename,
      checkBusinessLogic: true,
      checkSecurity: true
    });
    
    if (!validation.valid) {
      console.error(`Validation failed for ${file.filename}:`, validation.errors);
    }
  }
  
  // Start ObjectQL instance and test
  const objectql = new ObjectQL({
    metadataPath: './test-app',
    driver: 'sqlite',
    connection: { filename: ':memory:' }
  });
  
  await objectql.connect();
  
  // Run tests
  // ...
  
  await objectql.disconnect();
}
```

### CI/CD Integration

```typescript
// In your CI pipeline
import { ObjectQLAgent } from '@objectql/core';

async function validateAllMetadata(metadataDir: string): Promise<boolean> {
  const agent = new ObjectQLAgent({ apiKey: process.env.OPENAI_API_KEY! });
  
  const files = glob.sync(`${metadataDir}/**/*.yml`);
  let hasErrors = false;
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    
    const result = await agent.validateMetadata({
      metadata: content,
      filename: path.basename(file),
      checkBusinessLogic: true,
      checkSecurity: true,
      checkPerformance: true
    });
    
    if (!result.valid) {
      console.error(`❌ ${file}:`);
      result.errors.forEach(e => console.error(`  ${e.message}`));
      hasErrors = true;
    }
    
    result.warnings.forEach(w => {
      console.warn(`⚠️  ${file}: ${w.message}`);
    });
  }
  
  return !hasErrors;
}

// In GitHub Actions workflow
const success = await validateAllMetadata('./src/metadata');
process.exit(success ? 0 : 1);
```

### Custom Metadata Generator

```typescript
class CustomAppGenerator {
  private agent: ObjectQLAgent;
  
  constructor(apiKey: string) {
    this.agent = new ObjectQLAgent({ apiKey });
  }
  
  async generateFromTemplate(
    template: string,
    variables: Record<string, string>
  ): Promise<GenerateAppResult> {
    // Replace variables in template
    let description = template;
    for (const [key, value] of Object.entries(variables)) {
      description = description.replace(`{{${key}}}`, value);
    }
    
    // Generate
    const result = await this.agent.generateApp({
      description,
      type: 'complete'
    });
    
    // Post-process files
    if (result.success) {
      result.files = result.files.map(file => ({
        ...file,
        content: this.postProcess(file.content, variables)
      }));
    }
    
    return result;
  }
  
  private postProcess(content: string, variables: Record<string, string>): string {
    // Custom post-processing logic
    return content;
  }
}

// Usage
const generator = new CustomAppGenerator(process.env.OPENAI_API_KEY!);

const result = await generator.generateFromTemplate(
  'A {{industry}} management system with {{entities}}',
  {
    industry: 'healthcare',
    entities: 'patients, appointments, and medical records'
  }
);
```

## Error Handling

Always handle errors when using the AI Agent:

```typescript
try {
  const result = await agent.generateApp({
    description: 'My application'
  });
  
  if (!result.success) {
    // Handle generation failure
    console.error('Generation failed:', result.errors);
    
    // You might want to retry or provide feedback to user
    if (result.rawResponse) {
      console.log('Raw response:', result.rawResponse);
    }
  }
  
} catch (error) {
  // Handle API errors (network, auth, etc.)
  if (error instanceof Error) {
    console.error('API error:', error.message);
  }
}
```

## Best Practices

1. **API Key Security**: Never hardcode API keys. Use environment variables.

2. **Rate Limiting**: Implement rate limiting when exposing the agent in a web API.

3. **Caching**: Cache generation results to avoid redundant API calls.

4. **Validation**: Always validate generated metadata before using in production.

5. **Error Recovery**: Implement retry logic with exponential backoff for API failures.

6. **Type Safety**: Use TypeScript for type safety with the agent API.

7. **Testing**: Test generated applications thoroughly before deployment.

## Next Steps

- See [CLI Usage](/ai/cli-usage) for command-line tools
- Read [Generating Apps](/ai/generating-apps) for prompting best practices
- Check [Building Apps](/ai/building-apps) for using ObjectQL in AI applications
