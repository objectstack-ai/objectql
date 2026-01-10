# AI Quick Start Guide

Get started with ObjectQL AI capabilities in 5 minutes.

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
npm install @objectql/core @objectql/ai openai
```

### 2. Configure AI Provider

```typescript
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
```

### 3. Your First AI Query

```typescript
import { ObjectQL } from '@objectql/core';
import { AIQueryGenerator } from '@objectql/ai';

const app = new ObjectQL({ /* your config */ });
const aiQuery = new AIQueryGenerator(openai, app);

// Natural language to query
const result = await aiQuery.execute(
  "Find all tasks assigned to me",
  "tasks",
  { userId: currentUser.id }
);

console.log(result);
```

## 📝 Common Patterns

### Pattern 1: Natural Language Search

```typescript
async function searchWithNL(question: string, objectName: string) {
  // Generate query
  const query = await aiQuery.generate(question, objectName);
  
  // Validate
  if (!validateQuery(query)) {
    throw new Error('Invalid query');
  }
  
  // Execute
  return await db.find(query);
}

// Usage
const tasks = await searchWithNL("High priority tasks due this week", "tasks");
```

### Pattern 2: Schema Generation

```typescript
async function generateSchema(description: string) {
  const schema = await aiSchema.generate(description);
  
  // Validate and save
  await metadata.createObject(schema);
  
  return schema;
}

// Usage
await generateSchema(`
  I need a customer object with:
  - name (required)
  - email (required, unique)
  - company
  - status (active/inactive)
`);
```

### Pattern 3: AI-Powered Analytics

```typescript
async function getInsights(objectName: string) {
  const insights = await aiAnalytics.analyze(objectName);
  
  return {
    trends: insights.trends,
    anomalies: insights.anomalies,
    recommendations: insights.recommendations
  };
}

// Usage
const insights = await getInsights("sales");
console.log(insights.trends); // "Sales increased 15% this month"
```

## 🔒 Security Checklist

Before deploying AI features:

- [ ] Query validation is enabled
- [ ] Rate limiting is configured
- [ ] Permissions are checked
- [ ] Audit logging is active
- [ ] Environment variables are set
- [ ] Error handling is implemented

## 🎯 Next Steps

1. **Read the full guide**: [AI Integration Guide](./ai-integration.md)
2. **Review security**: [AI Safety Guidelines](./ai-safety.md)
3. **Check roadmap**: [AI Capabilities Roadmap](../AI_CAPABILITIES_ROADMAP.md)
4. **Browse examples**: [GitHub Issues](../AI_GITHUB_ISSUES.md)

## 💡 Tips

### Improve Accuracy

```typescript
// Include schema context in prompts
const schema = await getSchemaContext(objectName);
const prompt = buildPrompt(userQuestion, schema);
```

### Handle Errors Gracefully

```typescript
try {
  const query = await generateQuery(userInput);
  return await db.find(query);
} catch (error) {
  logger.error('AI query failed', error);
  return { error: 'Could not process your request' };
}
```

### Cache Frequent Queries

```typescript
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

async function cachedAIQuery(question: string) {
  const cached = cache.get(question);
  if (cached) return cached;
  
  const result = await aiQuery.execute(question);
  cache.set(question, result);
  return result;
}
```

## 📚 Resources

- [AI Index](../AI_INDEX.md) - Complete documentation index
- [Examples](../../examples/) - Code examples
- [API Reference](../api/) - Detailed API docs

## 🆘 Troubleshooting

### Common Issues

**Issue**: "Query validation failed"
```typescript
// Solution: Check query structure
console.log(JSON.stringify(query, null, 2));
validateQueryStructure(query);
```

**Issue**: "Rate limit exceeded"
```typescript
// Solution: Implement exponential backoff
await sleep(Math.pow(2, retryCount) * 1000);
```

**Issue**: "Permission denied"
```typescript
// Solution: Check user permissions
const canAccess = await checkPermissions(query, user);
console.log('Has access:', canAccess);
```

## 🎓 Learning Resources

### Beginner
- Start with simple query generation
- Add validation layer
- Test with example data

### Intermediate
- Implement caching
- Add rate limiting
- Build custom prompts

### Advanced
- Create AI-powered features
- Optimize performance
- Build custom integrations

---

**Need help?** Check the [AI Index](../AI_INDEX.md) or open an issue on GitHub.
