# AI Integration Guide

## Overview

ObjectQL is designed from the ground up to be **AI-native**, making it the ideal data layer for AI agents, low-code platforms, and intelligent applications. This guide explains how to leverage ObjectQL's unique capabilities for AI integration.

## Why ObjectQL is AI-Ready

### 1. JSON-Based Query Language

Unlike traditional databases that use string-based SQL, ObjectQL uses **structured JSON AST (Abstract Syntax Tree)** for queries. This makes it:

- **Safe from injection attacks**: No SQL string concatenation
- **Easy for LLMs to generate**: Structured format is predictable and learnable
- **Validatable**: Can be validated against a schema before execution
- **Type-safe**: TypeScript definitions provide compile-time safety

### 2. Schema-First Design

ObjectQL's metadata-driven architecture means:

- AI agents can query the schema to understand data structure
- Field types, validations, and relationships are machine-readable
- LLMs can generate accurate queries based on schema context

### 3. Universal Protocol

The same query works on both MongoDB and PostgreSQL:

- AI agents don't need to learn database-specific syntax
- Switching databases doesn't require retraining AI models
- Consistent behavior across different storage backends

## Use Cases

### 1. Natural Language to Query

Convert natural language requests into ObjectQL queries:

```typescript
// User: "Find all high-priority tasks assigned to John"
// AI generates:
{
  entity: 'tasks',
  fields: ['id', 'name', 'priority', 'assignee.name'],
  filters: [
    ['priority', '=', 'High'],
    'and',
    ['assignee.name', '=', 'John']
  ],
  sort: [['created_at', 'desc']]
}
```

### 2. Automated Data Analysis

AI agents can analyze data and generate reports:

```typescript
// User: "Show me sales trends by region"
// AI generates aggregation query:
{
  entity: 'sales',
  fields: ['region', 'total_amount'],
  groupBy: ['region'],
  sort: [['total_amount', 'desc']]
}
```

### 3. Intelligent Form Generation

AI can create forms based on business requirements:

```typescript
// User: "Create a customer feedback form"
// AI generates object definition and form view
```

### 4. Smart Automations

AI can create workflow automations:

```typescript
// User: "Notify manager when task is overdue"
// AI generates automation rules
```

## Integration Patterns

### Pattern 1: Schema-Aware AI Agent

Provide the AI with schema context to generate accurate queries:

```typescript
import { ObjectQL } from '@objectql/core';

async function getSchemaContext(objectName: string) {
  const objectDef = await app.metadata.getObject(objectName);
  
  return {
    name: objectDef.name,
    label: objectDef.label,
    fields: objectDef.fields.map(f => ({
      name: f.name,
      type: f.type,
      label: f.label,
      required: f.required,
      reference_to: f.reference_to
    }))
  };
}

// Send schema context to LLM
const context = await getSchemaContext('tasks');
const prompt = `Given this schema: ${JSON.stringify(context)}
Generate a query to find all tasks due this week.`;
```

### Pattern 2: Query Validation Pipeline

Always validate AI-generated queries before execution:

```typescript
import { validateQuery } from '@objectql/core';

async function executeSafeAIQuery(aiGeneratedQuery: any) {
  // 1. Validate structure
  const validation = validateQuery(aiGeneratedQuery);
  if (!validation.valid) {
    throw new Error(`Invalid query: ${validation.errors.join(', ')}`);
  }
  
  // 2. Check permissions
  if (!hasPermission(currentUser, aiGeneratedQuery.entity)) {
    throw new Error('Access denied');
  }
  
  // 3. Execute
  return await app.datasource('default').find(aiGeneratedQuery);
}
```

### Pattern 3: Iterative Refinement

Allow AI to refine queries based on results:

```typescript
async function aiQueryWithFeedback(userRequest: string) {
  let attempt = 0;
  const maxAttempts = 3;
  
  while (attempt < maxAttempts) {
    const query = await llm.generateQuery(userRequest, schemaContext);
    
    try {
      const results = await executeSafeAIQuery(query);
      
      // If results are empty or unexpected, let AI refine
      if (results.length === 0 && attempt < maxAttempts - 1) {
        userRequest += " (Previous query returned no results. Try a different approach)";
        attempt++;
        continue;
      }
      
      return results;
    } catch (error) {
      if (attempt === maxAttempts - 1) throw error;
      userRequest += ` (Previous query failed: ${error.message})`;
      attempt++;
    }
  }
}
```

## LLM Prompt Templates

### For Query Generation

```
You are an expert in ObjectQL, a universal query language.

SCHEMA:
{schema_json}

QUERY SYNTAX:
{
  entity: string,
  fields: string[],
  filters: Array<[field, operator, value] | 'and' | 'or'>,
  sort: Array<[field, 'asc' | 'desc']>,
  limit?: number,
  skip?: number
}

OPERATORS: =, !=, >, >=, <, <=, in, nin, contains

USER REQUEST: {user_request}

Generate a valid ObjectQL query (JSON only, no explanation):
```

### For Schema Generation

```
You are an expert data modeler using ObjectQL.

BUSINESS REQUIREMENT: {requirement}

FIELD TYPES AVAILABLE:
- text, textarea, markdown, html
- number, currency, percent
- date, datetime, time
- email, phone, url
- boolean, select
- lookup (reference to another object)
- file, image

Generate an object definition in YAML format following this structure:
name: object_name
label: Display Name
fields:
  field_name:
    type: field_type
    required: true/false
    # other attributes
```

## Best Practices

### 1. Always Validate

Never execute AI-generated queries without validation:

```typescript
// ❌ DON'T
const query = JSON.parse(aiResponse);
const results = await db.find(query);

// ✅ DO
const query = JSON.parse(aiResponse);
if (!isValidQuery(query)) throw new Error('Invalid query');
const results = await db.find(query);
```

### 2. Limit Query Complexity

Restrict what AI can query to prevent abuse:

```typescript
function validateComplexity(query: any) {
  // Limit number of filters
  if (query.filters && countFilters(query.filters) > 10) {
    throw new Error('Too many filters');
  }
  
  // Limit fields
  if (query.fields && query.fields.length > 50) {
    throw new Error('Too many fields');
  }
  
  // Limit results
  if (!query.limit || query.limit > 1000) {
    query.limit = 1000;
  }
  
  return query;
}
```

### 3. Use Sandboxing

For AI-generated code (hooks, actions), use sandboxing:

```typescript
import { VM } from 'vm2';

function executeAIGeneratedHook(code: string, context: any) {
  const vm = new VM({
    timeout: 5000,
    sandbox: {
      doc: context.doc,
      ctx: context.ctx,
      // Whitelist safe functions
    }
  });
  
  return vm.run(code);
}
```

### 4. Log AI Operations

Track all AI-generated operations for auditing:

```typescript
async function logAIOperation(operation: {
  type: 'query' | 'mutation' | 'schema',
  input: string,
  output: any,
  userId: string,
  timestamp: Date
}) {
  await db.object('ai_operations').create(operation);
}
```

### 5. Rate Limiting

Prevent AI from overwhelming the system:

```typescript
import rateLimit from 'express-rate-limit';

const aiQueryLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: 'Too many AI queries, please try again later'
});

app.use('/api/ai/query', aiQueryLimiter);
```

## Security Considerations

### 1. Permission Checking

AI queries must respect user permissions:

```typescript
async function checkPermissions(query: any, user: User) {
  const object = await metadata.getObject(query.entity);
  
  // Check read permission
  if (!user.canRead(object.name)) {
    throw new Error('Permission denied');
  }
  
  // Check field-level permissions
  for (const field of query.fields || []) {
    if (!user.canReadField(object.name, field)) {
      throw new Error(`Cannot read field: ${field}`);
    }
  }
}
```

### 2. Data Sanitization

Sanitize AI-generated content before storing:

```typescript
import DOMPurify from 'isomorphic-dompurify';

function sanitizeAIContent(content: any) {
  if (typeof content === 'string') {
    return DOMPurify.sanitize(content);
  }
  // Handle objects, arrays, etc.
  return content;
}
```

### 3. Prevent Data Leakage

Don't send sensitive schema information to external AI:

```typescript
function getSafeSchemaContext(objectName: string, user: User) {
  const schema = getSchemaContext(objectName);
  
  // Remove sensitive fields
  schema.fields = schema.fields.filter(f => 
    !f.sensitive && user.canReadField(objectName, f.name)
  );
  
  return schema;
}
```

## Performance Optimization

### 1. Cache Schema Context

Schema context changes infrequently - cache it:

```typescript
import NodeCache from 'node-cache';

const schemaCache = new NodeCache({ stdTTL: 3600 }); // 1 hour

async function getCachedSchema(objectName: string) {
  let schema = schemaCache.get(objectName);
  if (!schema) {
    schema = await getSchemaContext(objectName);
    schemaCache.set(objectName, schema);
  }
  return schema;
}
```

### 2. Query Result Caching

Cache common AI queries:

```typescript
import { createHash } from 'crypto';

function getQueryHash(query: any): string {
  return createHash('md5').update(JSON.stringify(query)).digest('hex');
}

async function getCachedQueryResult(query: any) {
  const hash = getQueryHash(query);
  let result = queryCache.get(hash);
  
  if (!result) {
    result = await db.find(query);
    queryCache.set(hash, result, 300); // 5 minutes
  }
  
  return result;
}
```

### 3. Streaming Results

For large datasets, stream results to AI:

```typescript
async function* streamQueryResults(query: any) {
  const pageSize = 100;
  let skip = 0;
  
  while (true) {
    const batch = await db.find({
      ...query,
      limit: pageSize,
      skip
    });
    
    if (batch.length === 0) break;
    
    yield batch;
    skip += pageSize;
  }
}
```

## Example: Building a Natural Language Interface

Here's a complete example of building an NL interface:

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class NaturalLanguageQueryEngine {
  private app: ObjectQL;
  
  constructor(app: ObjectQL) {
    this.app = app;
  }
  
  async query(userRequest: string, objectName: string): Promise<any[]> {
    // 1. Get schema context
    const schema = await getCachedSchema(objectName);
    
    // 2. Generate query using LLM
    const prompt = this.buildPrompt(userRequest, schema);
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an ObjectQL query expert.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1 // Low temperature for consistency
    });
    
    const queryText = response.choices[0].message.content;
    const query = JSON.parse(queryText);
    
    // 3. Validate
    query.entity = objectName; // Force entity to prevent injection
    validateComplexity(query);
    
    // 4. Execute
    const results = await this.app.datasource('default').find(query);
    
    // 5. Log
    await logAIOperation({
      type: 'query',
      input: userRequest,
      output: query,
      userId: 'current-user-id',
      timestamp: new Date()
    });
    
    return results;
  }
  
  private buildPrompt(request: string, schema: any): string {
    return `Given this schema:
${JSON.stringify(schema, null, 2)}

Generate a valid ObjectQL query for this request: "${request}"

Return ONLY the JSON query object, no explanation.`;
  }
}
```

## Testing AI Integration

### 1. Unit Tests

Test query generation logic:

```typescript
describe('NaturalLanguageQueryEngine', () => {
  it('should generate valid query for simple request', async () => {
    const engine = new NaturalLanguageQueryEngine(app);
    const query = await engine.generateQuery('Find all active users');
    
    expect(query).toMatchObject({
      entity: 'users',
      filters: expect.arrayContaining([
        ['status', '=', 'active']
      ])
    });
  });
});
```

### 2. Integration Tests

Test end-to-end flow:

```typescript
describe('AI Query Execution', () => {
  it('should execute AI-generated query safely', async () => {
    const results = await nlEngine.query('Show tasks due today', 'tasks');
    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBeGreaterThan(0);
  });
});
```

### 3. Prompt Testing

Test different prompt variations:

```typescript
const testCases = [
  'Find all users',
  'Show me tasks assigned to John',
  'List products under $100',
  'Get orders from last week'
];

for (const testCase of testCases) {
  const query = await generateQuery(testCase);
  expect(query).toHaveProperty('entity');
  expect(query).toHaveProperty('filters');
}
```

## Resources

- [ObjectQL Query Syntax Reference](./query-language.md)
- [Schema Definition Guide](./data-modeling.md)
- [Security Best Practices](./security-guide.md)
- [API Reference](./sdk-reference.md)

## Next Steps

1. Start with simple query generation
2. Add validation and safety checks
3. Implement caching for performance
4. Add monitoring and logging
5. Gradually expand to more complex use cases

---

For questions or contributions, see our [Contributing Guide](../../CONTRIBUTING.md).
