# ObjectQL Migration Roadmap - Actionable Implementation Guide

This document provides concrete, actionable tasks for each phase of the migration to @objectstack/runtime architecture.

---

## Phase 1: Dependency Alignment (Week 1-2)

### Day 1-2: Audit Current Dependencies

**Task 1.1: Create Dependency Inventory**
```bash
# Generate current dependency tree
pnpm list --depth=0 > docs/migration/current-dependencies.txt
pnpm list @objectstack/spec @objectstack/runtime @objectstack/objectql --depth=0
```

**Task 1.2: Check Latest Versions**
```bash
npm view @objectstack/runtime versions
npm view @objectstack/spec versions  
npm view @objectstack/objectql versions
```

**Deliverable**: Document with current vs. target versions

### Day 3-5: Update Package.json Files

**Task 1.3: Update Foundation Packages**

File: `/home/runner/work/objectql/objectql/packages/foundation/types/package.json`
```json
{
  "dependencies": {
    "@objectstack/spec": "^0.2.0"  // Update to latest
  },
  "peerDependencies": {
    "@objectstack/spec": "^0.2.0"
  }
}
```

File: `/home/runner/work/objectql/objectql/packages/foundation/core/package.json`
```json
{
  "dependencies": {
    "@objectql/types": "workspace:*",
    "@objectstack/spec": "^0.2.0",
    "@objectstack/runtime": "^0.2.0",
    "@objectstack/objectql": "^0.2.0"
  },
  "peerDependencies": {
    "@objectstack/runtime": "^0.2.0"
  }
}
```

File: `/home/runner/work/objectql/objectql/packages/foundation/platform-node/package.json`
```json
{
  "dependencies": {
    "@objectql/types": "workspace:*",
    "@objectql/core": "workspace:*",
    "@objectstack/spec": "^0.2.0"
  }
}
```

**Task 1.4: Update All Driver Packages**

For each driver in `packages/drivers/*`:
```json
{
  "peerDependencies": {
    "@objectstack/spec": "^0.2.0",
    "@objectstack/runtime": "^0.2.0"
  }
}
```

**Commands to Execute**:
```bash
cd /home/runner/work/objectql/objectql
pnpm update @objectstack/runtime @objectstack/spec @objectstack/objectql
pnpm install
```

### Day 6-7: Build and Test

**Task 1.5: Clean Build**
```bash
pnpm clean
pnpm build
```

**Task 1.6: Run Tests**
```bash
pnpm test
```

**Task 1.7: Document Build Errors**
- Create file: `docs/migration/phase1-build-errors.md`
- List all compilation errors
- Categorize by package

### Day 8-10: Fix Build Errors

**Task 1.8: Fix Type Incompatibilities**
- For each error, determine if it's:
  - Type mismatch (needs type update)
  - Missing import (needs import update)
  - Breaking API change (needs code refactor)

**Task 1.9: Update Imports**
```typescript
// Find and replace across codebase
// Before:
import { SomeType } from '@objectstack/spec';

// After (if API changed):
import { NewSomeType as SomeType } from '@objectstack/spec';
```

**Checklist**:
- [ ] All packages build without errors
- [ ] No TypeScript compilation errors
- [ ] No missing dependency warnings
- [ ] Tests run (may fail, but should run)

---

## Phase 2: Types Consolidation (Week 2-3)

### Day 1-3: Type Mapping Analysis

**Task 2.1: Create Type Mapping Document**

Create file: `docs/migration/type-mapping.md`

| ObjectQL Type | @objectstack Equivalent | Action | Notes |
|--------------|-------------------------|--------|-------|
| `ObjectConfig` | `ServiceObject` from @objectstack/spec | Replace | Core object definition |
| `FieldConfig` | `Field` from @objectstack/spec | Replace | Field definition |
| `QueryFilter` | `QueryFilter` from @objectstack/objectql | Replace | Query filtering |
| `ValidationRule` | Custom | Keep | ObjectQL-specific |
| `FormulaDefinition` | Custom | Keep | ObjectQL-specific |

**Task 2.2: Identify ObjectQL-Specific Types**

Types to KEEP in @objectql/types:
- Repository pattern interfaces
- Validator-specific types
- Formula engine types
- AI agent types
- Hook and action types

Types to REMOVE (use @objectstack instead):
- Basic object/field definitions
- Standard query types
- Common driver interfaces

### Day 4-7: Refactor @objectql/types

**Task 2.3: Update packages/foundation/types/src/index.ts**

```typescript
/**
 * @objectql/types
 * Query Extensions for ObjectStack
 */

// Re-export base types from @objectstack
export type { 
  ServiceObject as ObjectConfig,
  Field as FieldConfig,
  IndexSchema,
  PluginDefinition
} from '@objectstack/spec';

export type {
  QueryFilter,
  QuerySort,
  QueryAST
} from '@objectstack/objectql';

// ObjectQL-specific extensions
export * from './repository';
export * from './validator';
export * from './formula';
export * from './ai-agent';
export * from './hooks';
export * from './actions';
```

**Task 2.4: Create New Type Files**

File: `packages/foundation/types/src/repository.ts`
```typescript
import type { QueryFilter } from '@objectstack/objectql';

export interface RepositoryOptions {
  transaction?: any;
}

export interface FindOptions {
  filters?: QueryFilter[];
  fields?: string[];
  sort?: string;
  skip?: number;
  limit?: number;
}

// ... rest of repository-specific types
```

File: `packages/foundation/types/src/validator.ts`
```typescript
export interface ValidationRule {
  field: string;
  type: 'required' | 'unique' | 'range' | 'pattern' | 'custom';
  // ... ObjectQL-specific validation types
}
```

### Day 8-10: Update Imports Across Codebase

**Task 2.5: Automated Import Updates**

```bash
# Find all files importing from @objectql/types
find packages -name "*.ts" -exec grep -l "from '@objectql/types'" {} \;

# For each file, update imports
# Use IDE refactoring or manual updates
```

**Task 2.6: Update Core Package**

File: `packages/foundation/core/src/app.ts`
```typescript
// Before:
import { ObjectConfig, FieldConfig } from '@objectql/types';

// After:
import type { ServiceObject as ObjectConfig } from '@objectstack/spec';
import { RepositoryOptions, FindOptions } from '@objectql/types';
```

**Checklist**:
- [ ] @objectql/types exports only ObjectQL-specific types
- [ ] All base types use @objectstack imports
- [ ] No duplicate type definitions
- [ ] All packages compile
- [ ] All tests pass

---

## Phase 3: Core Engine Refactoring (Week 3-5)

### Week 3, Day 1-3: Plugin Architecture Design

**Task 3.1: Define Plugin Interface**

Create file: `packages/foundation/core/src/plugin.ts`
```typescript
import type { Plugin } from '@objectstack/runtime';
import type { ObjectStackKernel } from '@objectstack/runtime';

export interface ObjectQLPluginConfig {
  enableRepository?: boolean;
  enableValidator?: boolean;
  enableFormulas?: boolean;
  enableAI?: boolean;
}

export class ObjectQLPlugin implements Plugin {
  name = '@objectql/core';
  version = '4.0.0';
  
  constructor(private config: ObjectQLPluginConfig = {}) {}
  
  async install(kernel: ObjectStackKernel): Promise<void> {
    // Register components
    if (this.config.enableRepository !== false) {
      this.registerRepository(kernel);
    }
    if (this.config.enableValidator !== false) {
      this.registerValidator(kernel);
    }
    if (this.config.enableFormulas !== false) {
      this.registerFormulaEngine(kernel);
    }
    if (this.config.enableAI !== false) {
      this.registerAIAgent(kernel);
    }
  }
  
  private registerRepository(kernel: ObjectStackKernel) {
    // Implementation
  }
  
  // ... other registration methods
}
```

**Task 3.2: Update App.ts**

File: `packages/foundation/core/src/app.ts`
```typescript
import { ObjectStackKernel } from '@objectstack/runtime';
import { ObjectQLPlugin } from './plugin';

// Legacy API - for backward compatibility
export class ObjectQL {
  private kernel: ObjectStackKernel;
  
  constructor(config: ObjectQLConfig) {
    // Create kernel with ObjectQL plugin
    this.kernel = new ObjectStackKernel({
      datasources: config.datasources
    });
    
    // Install ObjectQL plugin
    this.kernel.use(new ObjectQLPlugin());
    
    // Migrate legacy config to plugin system
    this.migrateLegacyConfig(config);
  }
  
  async init() {
    await this.kernel.init();
  }
  
  // Proxy methods to kernel for backward compatibility
  getObject(name: string) {
    return this.kernel.getObject(name);
  }
  
  createContext(options: any) {
    return this.kernel.createContext(options);
  }
  
  // ... other proxy methods
}
```

### Week 3, Day 4-7: Repository Pattern Migration

**Task 3.3: Refactor Repository.ts**

File: `packages/foundation/core/src/repository.ts`
```typescript
import type { ObjectStackKernel } from '@objectstack/runtime';
import type { QueryAST } from '@objectstack/spec';
import { Validator } from './validator';
import { FormulaEngine } from './formula-engine';

export class ObjectQLRepository {
  private validator: Validator;
  private formulaEngine: FormulaEngine;
  
  constructor(
    private kernel: ObjectStackKernel,
    private objectName: string,
    private context: any
  ) {
    this.validator = new Validator();
    this.formulaEngine = new FormulaEngine();
  }
  
  async find(query: any) {
    // Validation
    await this.validator.validate(query);
    
    // Formula processing
    const processedQuery = await this.formulaEngine.process(query);
    
    // Execute via kernel
    const ast: QueryAST = this.buildQueryAST(processedQuery);
    return this.kernel.query(ast);
  }
  
  private buildQueryAST(query: any): QueryAST {
    // Convert ObjectQL query to standard QueryAST
    return {
      type: 'query',
      object: this.objectName,
      filters: query.filters || [],
      fields: query.fields || [],
      // ...
    };
  }
  
  // ... other CRUD methods
}
```

### Week 4, Day 1-3: Validator Integration

**Task 3.4: Register Validator as Plugin**

File: `packages/foundation/core/src/validator-plugin.ts`
```typescript
import type { Plugin } from '@objectstack/runtime';
import { Validator } from './validator';

export class ValidatorPlugin implements Plugin {
  name = '@objectql/validator';
  
  async install(kernel: ObjectStackKernel) {
    // Register validation middleware
    kernel.use('beforeQuery', async (context) => {
      const validator = new Validator();
      await validator.validate(context.query);
    });
    
    kernel.use('beforeMutation', async (context) => {
      const validator = new Validator();
      await validator.validate(context.data);
    });
  }
}
```

### Week 4, Day 4-7: Formula Engine Integration

**Task 3.5: Register Formula Engine as Plugin**

File: `packages/foundation/core/src/formula-plugin.ts`
```typescript
import type { Plugin } from '@objectstack/runtime';
import { FormulaEngine } from './formula-engine';

export class FormulaPlugin implements Plugin {
  name = '@objectql/formulas';
  
  async install(kernel: ObjectStackKernel) {
    const engine = new FormulaEngine();
    
    // Register formula processor
    kernel.registerFormulaProvider({
      evaluate: (formula: string, context: any) => {
        return engine.evaluate(formula, context);
      }
    });
  }
}
```

### Week 5, Day 1-3: AI Agent Integration

**Task 3.6: Update AI Agent**

File: `packages/foundation/core/src/ai-agent-plugin.ts`
```typescript
import type { Plugin } from '@objectstack/runtime';
import { AIAgent } from './ai-agent';

export class AIAgentPlugin implements Plugin {
  name = '@objectql/ai';
  
  async install(kernel: ObjectStackKernel) {
    const agent = new AIAgent();
    
    // Register AI capabilities
    kernel.registerService('ai', {
      generateQuery: (prompt: string) => agent.generateQuery(prompt),
      explainQuery: (query: any) => agent.explainQuery(query)
    });
  }
}
```

### Week 5, Day 4-7: Integration Testing

**Task 3.7: Create Integration Tests**

File: `packages/foundation/core/test/integration.test.ts`
```typescript
import { ObjectStackKernel } from '@objectstack/runtime';
import { ObjectQLPlugin } from '../src/plugin';
import { MemoryDriver } from '@objectql/driver-memory';

describe('ObjectQL Plugin Integration', () => {
  test('loads into ObjectStack runtime', async () => {
    const kernel = new ObjectStackKernel({
      datasources: {
        default: new MemoryDriver()
      }
    });
    
    kernel.use(new ObjectQLPlugin());
    await kernel.init();
    
    expect(kernel.hasPlugin('@objectql/core')).toBe(true);
  });
  
  test('repository pattern works', async () => {
    const kernel = new ObjectStackKernel({
      datasources: { default: new MemoryDriver() }
    });
    
    kernel.use(new ObjectQLPlugin());
    await kernel.init();
    
    kernel.registerObject({
      name: 'users',
      fields: {
        name: { type: 'text' }
      }
    });
    
    const ctx = kernel.createContext({ isSystem: true });
    const users = ctx.object('users');
    
    const result = await users.create({ name: 'John' });
    expect(result.name).toBe('John');
  });
});
```

**Checklist**:
- [ ] ObjectQLPlugin class created
- [ ] App.ts provides backward compatibility
- [ ] Repository pattern works as plugin
- [ ] Validator integrated
- [ ] Formula engine integrated
- [ ] AI agent integrated
- [ ] Integration tests pass

---

## Phase 4: Driver Migration (Week 5-7)

### SQL Driver Migration (Week 5-6)

**Task 4.1: Update SQL Driver Interface**

File: `packages/drivers/sql/src/index.ts`
```typescript
import type { DriverInterface, QueryAST, DriverOptions } from '@objectstack/spec';
import Knex from 'knex';

export class SQLDriver implements DriverInterface {
  private knex: Knex.Knex;
  
  constructor(config: any) {
    this.knex = Knex(config);
  }
  
  async query(ast: QueryAST, options?: DriverOptions): Promise<any> {
    // Use @objectstack/objectql to parse AST
    const sql = this.translateASTToSQL(ast);
    return this.knex.raw(sql);
  }
  
  async mutate(ast: QueryAST, options?: DriverOptions): Promise<any> {
    // Similar implementation
  }
  
  private translateASTToSQL(ast: QueryAST): string {
    // Implementation using Knex query builder
    let query = this.knex(ast.object);
    
    // Apply filters
    if (ast.filters) {
      ast.filters.forEach(filter => {
        query = query.where(filter.field, filter.operator, filter.value);
      });
    }
    
    // Apply fields selection
    if (ast.fields) {
      query = query.select(ast.fields);
    }
    
    return query.toString();
  }
}
```

**Task 4.2: Create Driver Tests**

File: `packages/drivers/sql/test/objectstack-compatibility.test.ts`
```typescript
import { SQLDriver } from '../src';
import type { QueryAST } from '@objectstack/spec';

describe('SQLDriver ObjectStack Compatibility', () => {
  test('executes QueryAST', async () => {
    const driver = new SQLDriver({
      client: 'sqlite3',
      connection: ':memory:'
    });
    
    const ast: QueryAST = {
      type: 'query',
      object: 'users',
      filters: [
        { field: 'name', operator: '=', value: 'John' }
      ],
      fields: ['id', 'name']
    };
    
    const result = await driver.query(ast);
    expect(result).toBeDefined();
  });
});
```

### MongoDB Driver Migration (Week 6)

**Task 4.3: Update MongoDB Driver**

File: `packages/drivers/mongo/src/index.ts`
```typescript
import type { DriverInterface, QueryAST } from '@objectstack/spec';
import { MongoClient, Db } from 'mongodb';

export class MongoDriver implements DriverInterface {
  private db: Db;
  
  async query(ast: QueryAST): Promise<any> {
    const collection = this.db.collection(ast.object);
    
    // Translate AST to MongoDB query
    const mongoQuery = this.translateASTToMongo(ast);
    
    return collection.find(mongoQuery.filter)
      .project(mongoQuery.projection)
      .toArray();
  }
  
  private translateASTToMongo(ast: QueryAST) {
    // Implementation
    const filter: any = {};
    const projection: any = {};
    
    ast.filters?.forEach(f => {
      filter[f.field] = this.translateOperator(f.operator, f.value);
    });
    
    ast.fields?.forEach(field => {
      projection[field] = 1;
    });
    
    return { filter, projection };
  }
}
```

### Memory Driver Migration (Week 6-7)

**Task 4.4: Update Memory Driver**

File: `packages/drivers/memory/src/index.ts`
```typescript
import type { DriverInterface, QueryAST } from '@objectstack/spec';

export class MemoryDriver implements DriverInterface {
  private data: Map<string, any[]> = new Map();
  
  async query(ast: QueryAST): Promise<any> {
    const collection = this.data.get(ast.object) || [];
    
    // Apply filters
    let results = collection;
    if (ast.filters) {
      results = this.applyFilters(results, ast.filters);
    }
    
    // Apply field selection
    if (ast.fields) {
      results = this.selectFields(results, ast.fields);
    }
    
    return results;
  }
  
  private applyFilters(data: any[], filters: any[]): any[] {
    return data.filter(item => {
      return filters.every(filter => {
        return this.matchFilter(item, filter);
      });
    });
  }
}
```

**Checklist for Each Driver**:
- [ ] Implements DriverInterface from @objectstack/spec
- [ ] Translates QueryAST correctly
- [ ] Passes compatibility tests
- [ ] Documentation updated
- [ ] Examples provided

---

## Phase 5-8: Quick Reference

Due to length constraints, here's a quick checklist for remaining phases:

### Phase 5: Runtime & Tools (Week 7-8)
- [ ] Update @objectql/server to use @objectstack/runtime
- [ ] Update CLI commands for @objectstack projects
- [ ] Update VSCode extension schemas
- [ ] Create migration command in CLI

### Phase 6: Documentation (Week 8-9)
- [ ] Update README.md with new positioning
- [ ] Create MIGRATION_GUIDE.md
- [ ] Update all package READMEs
- [ ] Create plugin development guide
- [ ] Update examples

### Phase 7: Testing (Week 9-10)
- [ ] Write integration tests
- [ ] Run compatibility tests
- [ ] Performance benchmarking
- [ ] User acceptance testing

### Phase 8: Publishing (Week 10-11)
- [ ] Update versions to 4.0.0
- [ ] Update CHANGELOGs
- [ ] Publish to npm
- [ ] Announce release

---

**Next Action**: Start Phase 1, Task 1.1
