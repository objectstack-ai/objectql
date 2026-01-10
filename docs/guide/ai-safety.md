# AI Safety Guidelines

## Overview

This document provides comprehensive guidelines for safely integrating AI capabilities into ObjectQL applications. Following these guidelines is essential to prevent security vulnerabilities, data breaches, and system abuse.

## Core Safety Principles

### 1. Never Trust AI Output

**Principle**: Treat all AI-generated content as potentially malicious until validated.

```typescript
// ❌ NEVER DO THIS
async function executeAIQuery(userInput: string) {
  const aiResponse = await llm.generate(userInput);
  const query = JSON.parse(aiResponse);
  return await db.find(query); // UNSAFE!
}

// ✅ DO THIS
async function executeAIQuery(userInput: string) {
  const aiResponse = await llm.generate(userInput);
  const query = JSON.parse(aiResponse);
  
  // Validate structure
  if (!validateQueryStructure(query)) {
    throw new Error('Invalid query structure');
  }
  
  // Validate permissions
  if (!checkPermissions(query, currentUser)) {
    throw new Error('Permission denied');
  }
  
  // Validate complexity
  if (!validateComplexity(query)) {
    throw new Error('Query too complex');
  }
  
  return await db.find(query);
}
```

### 2. Defense in Depth

Implement multiple layers of security:

1. **Input Validation**: Validate user input before sending to AI
2. **AI Output Validation**: Validate AI responses before execution
3. **Permission Checking**: Verify user permissions for requested operations
4. **Rate Limiting**: Prevent abuse through excessive requests
5. **Audit Logging**: Track all AI operations for forensics

### 3. Least Privilege

AI operations should have minimal permissions:

```typescript
const aiUser = {
  id: 'ai-agent',
  role: 'ai-limited',
  permissions: {
    // Only allow reads, no writes
    read: ['tasks', 'projects'],
    write: [],
    delete: []
  }
};

async function executeAIQuery(query: any) {
  // Execute with limited permissions
  return await db.find(query, { user: aiUser });
}
```

## Query Validation

### Structural Validation

Ensure the query has valid structure:

```typescript
import { z } from 'zod';

const QuerySchema = z.object({
  entity: z.string(),
  fields: z.array(z.string()).optional(),
  filters: z.array(z.any()).optional(),
  sort: z.array(z.tuple([z.string(), z.enum(['asc', 'desc'])])).optional(),
  limit: z.number().int().positive().max(1000).optional(),
  skip: z.number().int().nonnegative().optional()
});

function validateQueryStructure(query: any): boolean {
  try {
    QuerySchema.parse(query);
    return true;
  } catch (error) {
    console.error('Query validation failed:', error);
    return false;
  }
}
```

### Semantic Validation

Verify the query makes semantic sense:

```typescript
async function validateQuerySemantic(query: any): Promise<boolean> {
  // Check if entity exists
  const objectDef = await metadata.getObject(query.entity);
  if (!objectDef) {
    throw new Error(`Unknown entity: ${query.entity}`);
  }
  
  // Check if all fields exist
  if (query.fields) {
    for (const field of query.fields) {
      const fieldName = field.split('.')[0]; // Handle nested fields
      if (!objectDef.fields.find(f => f.name === fieldName)) {
        throw new Error(`Unknown field: ${field}`);
      }
    }
  }
  
  // Validate filters
  if (query.filters) {
    for (const filter of query.filters) {
      if (Array.isArray(filter)) {
        const [field, operator, value] = filter;
        
        // Check field exists
        const fieldDef = objectDef.fields.find(f => f.name === field);
        if (!fieldDef) {
          throw new Error(`Unknown filter field: ${field}`);
        }
        
        // Check operator is valid
        const validOperators = ['=', '!=', '>', '>=', '<', '<=', 'in', 'nin', 'contains'];
        if (!validOperators.includes(operator)) {
          throw new Error(`Invalid operator: ${operator}`);
        }
      }
    }
  }
  
  return true;
}
```

### Complexity Validation

Prevent resource-intensive queries:

```typescript
interface ComplexityLimits {
  maxFilters: number;
  maxFields: number;
  maxLimit: number;
  maxNestedDepth: number;
  maxSortFields: number;
}

const DEFAULT_LIMITS: ComplexityLimits = {
  maxFilters: 10,
  maxFields: 50,
  maxLimit: 1000,
  maxNestedDepth: 3,
  maxSortFields: 5
};

function validateComplexity(
  query: any, 
  limits: ComplexityLimits = DEFAULT_LIMITS
): boolean {
  // Check filter count
  if (query.filters) {
    const filterCount = countFilters(query.filters);
    if (filterCount > limits.maxFilters) {
      throw new Error(`Too many filters: ${filterCount} (max: ${limits.maxFilters})`);
    }
  }
  
  // Check field count
  if (query.fields && query.fields.length > limits.maxFields) {
    throw new Error(`Too many fields: ${query.fields.length} (max: ${limits.maxFields})`);
  }
  
  // Check limit
  if (query.limit && query.limit > limits.maxLimit) {
    query.limit = limits.maxLimit; // Auto-cap
  }
  
  // Check nested depth
  if (query.fields) {
    for (const field of query.fields) {
      const depth = (field.match(/\./g) || []).length;
      if (depth > limits.maxNestedDepth) {
        throw new Error(`Field too nested: ${field} (max depth: ${limits.maxNestedDepth})`);
      }
    }
  }
  
  // Check sort count
  if (query.sort && query.sort.length > limits.maxSortFields) {
    throw new Error(`Too many sort fields: ${query.sort.length} (max: ${limits.maxSortFields})`);
  }
  
  return true;
}

function countFilters(filters: any[]): number {
  let count = 0;
  for (const filter of filters) {
    if (Array.isArray(filter)) {
      count++;
    }
  }
  return count;
}
```

## Permission Checking

### Object-Level Permissions

```typescript
async function checkObjectPermission(
  objectName: string, 
  action: 'read' | 'create' | 'update' | 'delete',
  user: User
): Promise<boolean> {
  const objectDef = await metadata.getObject(objectName);
  
  // Check if user has permission for this object
  const hasPermission = await permissionService.check({
    user: user.id,
    object: objectName,
    action
  });
  
  if (!hasPermission) {
    throw new Error(`Permission denied: Cannot ${action} ${objectName}`);
  }
  
  return true;
}
```

### Field-Level Permissions

```typescript
async function checkFieldPermissions(
  objectName: string,
  fields: string[],
  user: User
): Promise<boolean> {
  const objectDef = await metadata.getObject(objectName);
  
  for (const fieldPath of fields) {
    const fieldName = fieldPath.split('.')[0];
    const fieldDef = objectDef.fields.find(f => f.name === fieldName);
    
    // Check if field exists
    if (!fieldDef) {
      throw new Error(`Unknown field: ${fieldPath}`);
    }
    
    // Check if field is accessible
    if (fieldDef.hidden && !user.isAdmin) {
      throw new Error(`Field not accessible: ${fieldPath}`);
    }
    
    // Check sensitive fields
    if (fieldDef.sensitive && !user.canAccessSensitive) {
      throw new Error(`Cannot access sensitive field: ${fieldPath}`);
    }
  }
  
  return true;
}
```

### Filter Permissions

Ensure users can only filter on allowed fields:

```typescript
function validateFilterPermissions(
  filters: any[],
  user: User,
  objectDef: any
): boolean {
  for (const filter of filters) {
    if (Array.isArray(filter)) {
      const [field] = filter;
      const fieldDef = objectDef.fields.find(f => f.name === field);
      
      if (fieldDef?.sensitive && !user.canAccessSensitive) {
        throw new Error(`Cannot filter on sensitive field: ${field}`);
      }
    }
  }
  
  return true;
}
```

## Rate Limiting

### Per-User Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Rate limiter for AI queries
export const aiQueryLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:ai:query:'
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per user
  keyGenerator: (req) => req.user.id,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many AI queries. Please try again later.',
      retryAfter: 60
    });
  }
});

// Apply to AI routes
app.use('/api/ai', aiQueryLimiter);
```

### Token-Based Rate Limiting

```typescript
interface TokenBucket {
  tokens: number;
  lastRefill: Date;
  maxTokens: number;
  refillRate: number; // tokens per second
}

class TokenBucketRateLimiter {
  private buckets = new Map<string, TokenBucket>();
  
  async consume(userId: string, cost: number = 1): Promise<boolean> {
    const bucket = this.getBucket(userId);
    
    // Refill tokens
    this.refillBucket(bucket);
    
    // Check if enough tokens
    if (bucket.tokens >= cost) {
      bucket.tokens -= cost;
      return true;
    }
    
    throw new Error('Rate limit exceeded. Please wait before making more requests.');
  }
  
  private getBucket(userId: string): TokenBucket {
    if (!this.buckets.has(userId)) {
      this.buckets.set(userId, {
        tokens: 100,
        lastRefill: new Date(),
        maxTokens: 100,
        refillRate: 1 // 1 token per second
      });
    }
    return this.buckets.get(userId)!;
  }
  
  private refillBucket(bucket: TokenBucket): void {
    const now = new Date();
    const elapsed = (now.getTime() - bucket.lastRefill.getTime()) / 1000;
    const tokensToAdd = elapsed * bucket.refillRate;
    
    bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }
}

const rateLimiter = new TokenBucketRateLimiter();

// Usage
async function executeAIQuery(query: any, userId: string) {
  // Complex queries cost more tokens
  const cost = calculateQueryCost(query);
  await rateLimiter.consume(userId, cost);
  
  return await db.find(query);
}
```

## Sandboxing AI-Generated Code

### For Hooks and Actions

```typescript
import { VM } from 'vm2';

function executeSandboxedCode(code: string, context: any): any {
  const vm = new VM({
    timeout: 5000, // 5 seconds max
    sandbox: {
      // Provide safe context
      doc: context.doc,
      ctx: {
        userId: context.userId,
        // Limited API access
        object: (name: string) => ({
          find: safeFind,
          findOne: safeFindOne
          // No create, update, delete
        })
      },
      // Whitelist safe functions
      console: {
        log: (...args: any[]) => logger.debug('Sandbox:', ...args)
      },
      // No access to dangerous globals
      require: undefined,
      process: undefined,
      global: undefined,
      eval: undefined
    }
  });
  
  try {
    return vm.run(code);
  } catch (error) {
    logger.error('Sandboxed code execution failed:', error);
    throw new Error('Code execution failed');
  }
}
```

### Safe Function Wrappers

```typescript
// Safe find that enforces limits
async function safeFind(query: any) {
  // Force limits
  query.limit = Math.min(query.limit || 100, 100);
  
  // Validate
  await validateQuery(query);
  
  return await db.find(query);
}

// Safe findOne
async function safeFindOne(id: string) {
  // Only allow finding by ID
  return await db.findOne({ _id: id });
}
```

## Data Sanitization

### Input Sanitization

```typescript
import DOMPurify from 'isomorphic-dompurify';

function sanitizeUserInput(input: string): string {
  // Remove potentially dangerous content
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
}

function sanitizeQuery(query: any): any {
  // Sanitize string values in filters
  if (query.filters) {
    query.filters = query.filters.map((filter: any) => {
      if (Array.isArray(filter)) {
        const [field, operator, value] = filter;
        if (typeof value === 'string') {
          return [field, operator, sanitizeUserInput(value)];
        }
      }
      return filter;
    });
  }
  
  return query;
}
```

### Output Sanitization

```typescript
function sanitizeOutput(data: any): any {
  if (Array.isArray(data)) {
    return data.map(sanitizeOutput);
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Remove sensitive fields
      if (key.startsWith('_') || key === 'password' || key === 'secret') {
        continue;
      }
      sanitized[key] = sanitizeOutput(value);
    }
    return sanitized;
  }
  
  // Sanitize HTML content
  if (typeof data === 'string' && data.includes('<')) {
    return DOMPurify.sanitize(data);
  }
  
  return data;
}
```

## Preventing Data Leakage

### Schema Context Filtering

```typescript
function getSafeSchemaContext(
  objectName: string,
  user: User
): SchemaContext {
  const schema = getSchemaContext(objectName);
  
  // Filter fields based on permissions
  schema.fields = schema.fields.filter(field => {
    // Remove hidden fields
    if (field.hidden && !user.isAdmin) {
      return false;
    }
    
    // Remove sensitive fields
    if (field.sensitive && !user.canAccessSensitive) {
      return false;
    }
    
    return true;
  });
  
  // Remove internal metadata
  delete schema.internal;
  delete schema.systemFields;
  
  return schema;
}
```

### Prevent Schema Enumeration

```typescript
// Don't allow AI to enumerate all objects
function listAvailableObjects(user: User): string[] {
  // Only return objects user has access to
  return metadata.objects
    .filter(obj => user.canRead(obj.name))
    .map(obj => obj.name);
}

// Don't expose internal objects
const INTERNAL_OBJECTS = ['_migrations', '_logs', '_system'];

function isInternalObject(objectName: string): boolean {
  return INTERNAL_OBJECTS.includes(objectName) || objectName.startsWith('_');
}
```

## Audit Logging

### Comprehensive Logging

```typescript
interface AIAuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  type: 'query' | 'schema' | 'code' | 'automation';
  input: string;
  output: any;
  success: boolean;
  error?: string;
  metadata: {
    ip: string;
    userAgent: string;
    sessionId: string;
  };
}

async function logAIOperation(log: AIAuditLog): Promise<void> {
  // Store in dedicated audit table
  await db.object('ai_audit_log').create(log);
  
  // Also log to external system for compliance
  await externalLogger.log(log);
  
  // Alert on suspicious patterns
  if (await detectAnomalousActivity(log)) {
    await alertSecurityTeam(log);
  }
}
```

### Anomaly Detection

```typescript
async function detectAnomalousActivity(log: AIAuditLog): Promise<boolean> {
  const recent = await db.object('ai_audit_log').find({
    filters: [
      ['userId', '=', log.userId],
      'and',
      ['timestamp', '>', new Date(Date.now() - 60 * 1000)] // Last minute
    ]
  });
  
  // Too many requests in short time
  if (recent.length > 50) {
    return true;
  }
  
  // Too many failures
  const failures = recent.filter(r => !r.success);
  if (failures.length > 10) {
    return true;
  }
  
  // Unusual patterns (accessing many different objects)
  const uniqueObjects = new Set(recent.map(r => r.output?.entity));
  if (uniqueObjects.size > 20) {
    return true;
  }
  
  return false;
}
```

## Error Handling

### Safe Error Messages

```typescript
// ❌ DON'T expose internal details
throw new Error(`Query failed: ${internalError.stack}`);

// ✅ DO provide safe error messages
function getSafeErrorMessage(error: Error): string {
  // Map internal errors to safe messages
  const errorMap: Record<string, string> = {
    'ENTITY_NOT_FOUND': 'The requested resource does not exist',
    'PERMISSION_DENIED': 'You do not have permission to perform this action',
    'INVALID_QUERY': 'The query format is invalid',
    'RATE_LIMIT_EXCEEDED': 'Too many requests. Please try again later',
    'VALIDATION_FAILED': 'The request could not be validated'
  };
  
  const errorCode = (error as any).code || 'UNKNOWN_ERROR';
  return errorMap[errorCode] || 'An error occurred. Please try again';
}
```

### Error Recovery

```typescript
async function executeWithRetry(
  operation: () => Promise<any>,
  maxRetries: number = 3
): Promise<any> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on validation errors
      if (isValidationError(error)) {
        throw error;
      }
      
      // Exponential backoff
      if (attempt < maxRetries) {
        await sleep(Math.pow(2, attempt) * 1000);
      }
    }
  }
  
  throw lastError!;
}
```

## Security Checklist

Use this checklist before deploying AI features:

- [ ] All AI queries are validated (structural, semantic, complexity)
- [ ] Permission checking is enforced at object and field level
- [ ] Rate limiting is configured for all AI endpoints
- [ ] AI-generated code uses sandboxing
- [ ] Input and output sanitization is implemented
- [ ] Sensitive data is not sent to external AI providers
- [ ] Schema context is filtered based on permissions
- [ ] Comprehensive audit logging is active
- [ ] Anomaly detection is configured
- [ ] Error messages don't leak sensitive information
- [ ] Cost controls are in place
- [ ] Security team has reviewed implementation
- [ ] Penetration testing completed
- [ ] Privacy policy updated
- [ ] GDPR compliance verified

## Testing Safety Measures

### Security Test Cases

```typescript
describe('AI Safety', () => {
  describe('Query Validation', () => {
    it('should reject malformed queries', async () => {
      const badQuery = { invalid: 'structure' };
      await expect(executeAIQuery(badQuery)).rejects.toThrow('Invalid query');
    });
    
    it('should reject queries exceeding complexity limits', async () => {
      const complexQuery = {
        entity: 'users',
        filters: Array(100).fill(['id', '=', '1']) // Too many filters
      };
      await expect(executeAIQuery(complexQuery)).rejects.toThrow('Too many filters');
    });
  });
  
  describe('Permission Checking', () => {
    it('should deny access to unauthorized objects', async () => {
      const query = { entity: 'admin_users', fields: ['*'] };
      const regularUser = { role: 'user' };
      
      await expect(
        executeAIQuery(query, regularUser)
      ).rejects.toThrow('Permission denied');
    });
    
    it('should deny access to sensitive fields', async () => {
      const query = { entity: 'users', fields: ['password'] };
      await expect(executeAIQuery(query)).rejects.toThrow('sensitive field');
    });
  });
  
  describe('Rate Limiting', () => {
    it('should block after rate limit exceeded', async () => {
      const user = { id: 'test-user' };
      
      // Make 30 requests (the limit)
      for (let i = 0; i < 30; i++) {
        await executeAIQuery({ entity: 'tasks' }, user);
      }
      
      // 31st request should fail
      await expect(
        executeAIQuery({ entity: 'tasks' }, user)
      ).rejects.toThrow('Rate limit exceeded');
    });
  });
});
```

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP AI Security and Privacy Guide](https://owasp.org/www-project-ai-security-and-privacy-guide/)
- [CWE Top 25 Most Dangerous Software Weaknesses](https://cwe.mitre.org/top25/)
- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)

## Summary

AI integration requires careful attention to security. Always:

1. **Validate** everything from AI
2. **Check permissions** before execution
3. **Limit** complexity and rate
4. **Sandbox** code execution
5. **Sanitize** inputs and outputs
6. **Log** all operations
7. **Monitor** for anomalies

Following these guidelines will help you build safe, secure AI-powered applications with ObjectQL.
