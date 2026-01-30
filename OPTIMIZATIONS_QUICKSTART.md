# Quick Start: ObjectQL Kernel Optimizations

This guide helps you quickly adopt the new kernel optimizations in your ObjectQL application.

## Installation

The optimizations are included in `@objectql/core`. Make sure you have the latest version:

```bash
npm install @objectql/core@latest
```

## Quick Examples

### 1. Optimized Metadata Registry

Replace your existing registry for faster package operations:

```typescript
import { OptimizedMetadataRegistry } from '@objectql/core';

// Create optimized registry
const registry = new OptimizedMetadataRegistry();

// Use it normally
registry.register('object', { 
  name: 'user',
  package: 'crm',
  fields: { /* ... */ }
});

// Fast package uninstall (10x faster!)
registry.unregisterPackage('crm');
```

### 2. Query Compiler with Cache

Speed up repeated queries:

```typescript
import { QueryCompiler } from '@objectql/core';

// Create compiler with cache
const compiler = new QueryCompiler(1000);

// Compile queries - automatically cached
const compiled = compiler.compile('user', {
  filters: { status: 'active' },
  sort: [{ field: 'created', order: 'desc' }]
});

// Use compiled.plan for execution
console.log(compiled.plan.useIndex); // Suggested indexes
```

### 3. Compiled Hook Manager

Faster hook execution with pre-compilation:

```typescript
import { CompiledHookManager } from '@objectql/core';

const hookManager = new CompiledHookManager();

// Register hooks - wildcards expanded at registration time
hookManager.registerHook('before*', 'user', async (ctx) => {
  console.log('Before operation:', ctx.operation);
});

// Execute hooks - instant lookup, no pattern matching
await hookManager.runHooks('beforeCreate', 'user', context);
```

### 4. Global Connection Pool

Manage database connections efficiently:

```typescript
import { GlobalConnectionPool } from '@objectql/core';

// Create pool with limits
const pool = new GlobalConnectionPool({
  total: 50,
  perDriver: 20
});

// Acquire and use connection
const conn = await pool.acquire('postgres');
try {
  // Use connection
  await conn.execute(query);
} finally {
  await pool.release(conn);
}

// Check pool status
console.log(pool.getStats());
```

### 5. Validation Engine

Compile validation rules for faster validation:

```typescript
import { OptimizedValidationEngine } from '@objectql/core';

const validator = new OptimizedValidationEngine();

// Compile schema once
validator.compile('user', {
  type: 'object',
  properties: {
    email: { 
      type: 'string',
      pattern: '^[^@]+@[^@]+\\.[^@]+$'
    },
    age: {
      type: 'number',
      minimum: 0,
      maximum: 120
    }
  }
});

// Fast validation
const result = validator.validate('user', userData);
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

### 6. Lazy Metadata Loader

Load metadata on-demand for faster startup:

```typescript
import { LazyMetadataLoader } from '@objectql/core';

// Create loader with async loader function
const loader = new LazyMetadataLoader(async (objectName) => {
  return await fs.readFile(`./metadata/${objectName}.json`, 'utf8');
});

// Metadata loads on first access
const metadata = await loader.get('user');

// Preload related objects in background
await loader.preload(['account', 'contact']);
```

### 7. Dependency Graph

Automatic cascade operations:

```typescript
import { DependencyGraph } from '@objectql/core';

const graph = new DependencyGraph();

// Build dependency graph
graph.addDependency('account', 'contact', 'lookup', 'account_id');
graph.addDependency('contact', 'task', 'master_detail', 'contact_id');

// Get correct deletion order
const order = graph.getCascadeDeleteOrder('account');
console.log(order); // ['task', 'contact', 'account']

// Automatic cascade delete
await graph.cascadeDelete('account', '123', async (obj, id) => {
  await db.delete(obj, id);
});
```

### 8. SQL Query Optimizer

Generate optimized SQL with index hints:

```typescript
import { SQLQueryOptimizer } from '@objectql/core';

const optimizer = new SQLQueryOptimizer();

// Register schema with indexes
optimizer.registerSchema({
  name: 'users',
  fields: { id: {}, email: {}, status: {} },
  indexes: [
    { name: 'idx_email', fields: ['email'], unique: true },
    { name: 'idx_status', fields: ['status'], unique: false }
  ]
});

// Generate optimized SQL
const sql = optimizer.optimize({
  object: 'users',
  filters: { status: 'active' },
  sort: [{ field: 'created_at', order: 'desc' }],
  limit: 10
});

console.log(sql);
// SELECT * FROM users USE INDEX (idx_status) WHERE status = 'active' ...
```

## Integration Patterns

### Pattern 1: Drop-in Replacement

Replace existing components directly:

```typescript
// Before
import { MetadataRegistry } from '@objectql/types';
const registry = new MetadataRegistry();

// After
import { OptimizedMetadataRegistry } from '@objectql/core';
const registry = new OptimizedMetadataRegistry();
```

### Pattern 2: Wrapper Integration

Wrap existing functionality:

```typescript
class MyApp {
  private queryCompiler = new QueryCompiler(1000);
  
  async executeQuery(objectName: string, query: any) {
    // Compile and cache
    const compiled = this.queryCompiler.compile(objectName, query);
    
    // Execute with optimized plan
    return this.driver.execute(compiled.plan);
  }
}
```

### Pattern 3: Progressive Enhancement

Use optimizations selectively:

```typescript
const useOptimizations = process.env.ENABLE_OPTIMIZATIONS === 'true';

const registry = useOptimizations
  ? new OptimizedMetadataRegistry()
  : new MetadataRegistry();
```

## Performance Tips

### 1. Cache Sizing

Adjust cache sizes based on your workload:

```typescript
// Small app with few queries
const compiler = new QueryCompiler(100);

// Large app with many unique queries
const compiler = new QueryCompiler(5000);
```

### 2. Preloading Strategy

Preload commonly used metadata:

```typescript
// Preload core objects at startup
await loader.preload(['user', 'account', 'contact']);

// Let others load on-demand
```

### 3. Connection Pool Tuning

Set limits based on database and server capacity:

```typescript
const pool = new GlobalConnectionPool({
  total: Math.min(dbMaxConnections * 0.8, serverCPUs * 10),
  perDriver: Math.floor(total / numberOfDrivers)
});
```

### 4. Validation Compilation

Compile validation rules at startup, not runtime:

```typescript
// In initialization
for (const objectName of Object.keys(schemas)) {
  validator.compile(objectName, schemas[objectName]);
}

// At runtime - just validate
const result = validator.validate(objectName, data);
```

## Troubleshooting

### Issue: Cache not hitting

**Problem:** Query compiler always compiling  
**Solution:** Ensure queries are structurally identical (same object keys order)

```typescript
// These are different cache keys:
{ status: 'active', type: 'premium' }
{ type: 'premium', status: 'active' }

// Normalize before caching
const normalized = sortKeys(query);
```

### Issue: Pool exhaustion

**Problem:** Wait queue filling up  
**Solution:** Increase limits or improve connection release

```typescript
// Always use try-finally
const conn = await pool.acquire('postgres');
try {
  await useConnection(conn);
} finally {
  await pool.release(conn); // Critical!
}
```

### Issue: Memory usage increasing

**Problem:** Metadata cache growing unbounded  
**Solution:** Use cache invalidation

```typescript
// After schema changes
loader.invalidate('user');

// Or clear all
loader.clearAll();
```

## Monitoring

### Get Statistics

All optimizations provide statistics:

```typescript
// Query compiler
console.log(compiler.cache.size);

// Hook manager
console.log(hookManager.getStats());

// Connection pool
console.log(pool.getStats());

// Validation engine
console.log(validator.getStats());

// Lazy loader
console.log(loader.getStats());

// Dependency graph
console.log(graph.getStats());
```

### Performance Metrics

Track key metrics:

```typescript
// Measure query compilation time
console.time('compile');
const compiled = compiler.compile('user', query);
console.timeEnd('compile');

// Measure hook execution
console.time('hooks');
await hookManager.runHooks('beforeCreate', 'user', ctx);
console.timeEnd('hooks');
```

## Next Steps

1. Read full documentation: [KERNEL_OPTIMIZATIONS.md](./KERNEL_OPTIMIZATIONS.md)
2. Review implementation details: [IMPLEMENTATION_SUMMARY_OPTIMIZATIONS.md](./IMPLEMENTATION_SUMMARY_OPTIMIZATIONS.md)
3. Run tests: `npm test optimizations.test.ts`
4. Profile your application to identify bottlenecks
5. Apply optimizations incrementally

## Support

- 📚 Documentation: See [KERNEL_OPTIMIZATIONS.md](./KERNEL_OPTIMIZATIONS.md)
- 🐛 Issues: Report on GitHub
- 💬 Discussions: Community forums
- 📧 Contact: support@objectstack.ai

## License

MIT License - See LICENSE file
