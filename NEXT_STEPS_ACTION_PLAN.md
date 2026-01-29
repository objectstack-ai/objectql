# ObjectQL Next Steps Action Plan / 下一步行动计划

> **Generated**: 2026-01-29  
> **Based on**: PROTOCOL_GAP_ANALYSIS.md  
> **Status**: Ready for Implementation

---

## Executive Summary / 执行摘要

### English

This document provides a concrete, actionable plan to address the gaps identified in the protocol gap analysis. The plan is organized into 4 phases over 6 weeks, with clear tasks, file changes, and success criteria.

**Current State**: ObjectQL is ~80% complete with excellent core features but has architectural compliance issues and missing production features.

**Goal**: Reach 95% completion and full production readiness.

### 中文

本文档提供了一个具体可行的计划，以解决协议差距分析中发现的问题。该计划分为4个阶段，为期6周，包含明确的任务、文件更改和成功标准。

**当前状态**: ObjectQL 约 80% 完成，核心功能优秀，但存在架构合规性问题和缺少生产功能。

**目标**: 达到 95% 完成度和完全生产就绪。

---

## Phase 1: Critical Architecture Compliance / 第一阶段：关键架构合规性

**Duration / 工期**: 1-2 weeks / 1-2 周  
**Priority / 优先级**: 🔥 URGENT / 紧急

### Background / 背景

The current protocol plugins (GraphQL, OData V4, JSON-RPC) reference packages (`@objectstack/objectql`, `@objectstack/runtime`) that should contain the RuntimePlugin interface and ObjectStackRuntimeProtocol bridge. However, there are import issues that need to be resolved first.

当前的协议插件（GraphQL、OData V4、JSON-RPC）引用了应包含 RuntimePlugin 接口和 ObjectStackRuntimeProtocol 桥接器的包（`@objectstack/objectql`、`@objectstack/runtime`）。但是，首先需要解决导入问题。

### Task 1.1: Verify External Package Dependencies / 验证外部包依赖

**Files to Check**:
- `packages/protocols/graphql/package.json`
- `packages/protocols/odata-v4/package.json`
- `packages/protocols/json-rpc/package.json`

**Actions**:
1. Verify that `@objectstack/runtime` and `@objectstack/objectql` are properly installed
2. Check if these packages are from the separate spec repository
3. If missing, determine if they should be:
   - Added as workspace dependencies
   - Imported from external published packages
   - Or if the architecture should use `@objectql/core` instead

**Success Criteria**:
- [ ] All protocol plugins can successfully import required types
- [ ] Build passes without import errors
- [ ] Clear documentation on which package provides what interface

### Task 1.2: Define or Locate RuntimePlugin Interface / 定义或定位 RuntimePlugin 接口

**Option A: If @objectstack/runtime exists**

Verify the interface is exported:
```typescript
// Expected in @objectstack/runtime
export interface RuntimePlugin {
  name: string;
  version: string;
  install(ctx: RuntimeContext): Promise<void>;
  onStart(ctx: RuntimeContext): Promise<void>;
  onStop(ctx: RuntimeContext): Promise<void>;
}

export interface RuntimeContext {
  engine: ObjectKernel;
  // ... other context properties
}
```

**Option B: If interface is missing**

Create it in `packages/foundation/types/src/plugin.ts`:
```typescript
/**
 * Runtime Plugin Interface
 * All protocol and feature plugins must implement this interface
 */
export interface RuntimePlugin {
  /** Plugin name (e.g., '@objectql/protocol-graphql') */
  name: string;
  
  /** Plugin version (semantic versioning) */
  version: string;
  
  /**
   * Install hook - called during kernel initialization
   * Initialize resources, create bridges, but don't start services
   */
  install(ctx: RuntimeContext): Promise<void>;
  
  /**
   * Start hook - called when kernel starts
   * Start servers, begin processing, activate services
   */
  onStart(ctx: RuntimeContext): Promise<void>;
  
  /**
   * Stop hook - called when kernel stops
   * Cleanup resources, stop servers, close connections
   */
  onStop(ctx: RuntimeContext): Promise<void>;
}

export interface RuntimeContext {
  engine: any; // ObjectKernel from @objectstack/core
  config?: any;
}
```

**Success Criteria**:
- [ ] RuntimePlugin interface is accessible from protocol plugins
- [ ] Interface matches architecture specification
- [ ] TypeScript compilation succeeds

### Task 1.3: Verify or Create ObjectStackRuntimeProtocol Bridge / 验证或创建 ObjectStackRuntimeProtocol 桥接

**Expected Location**: Should be in `@objectstack/objectql` or `@objectstack/runtime`

**If Missing**, create in `packages/foundation/core/src/protocol-bridge.ts`:

```typescript
/**
 * ObjectStack Runtime Protocol Bridge
 * 
 * Provides a standard API for protocol plugins to interact with the kernel
 * without direct database access. All data operations flow through this bridge.
 */
export class ObjectStackRuntimeProtocol {
  constructor(private kernel: any) {}
  
  // Metadata Methods
  getMetaTypes(): string[] {
    return this.kernel.metadata?.list('object') || [];
  }
  
  getMetaItem(type: string, name: string): unknown {
    return this.kernel.metadata?.get(type, name);
  }
  
  getAllMetaItems(type: string): Map<string, any> {
    const items = this.kernel.metadata?.list(type) || [];
    const map = new Map();
    items.forEach((name: string) => {
      map.set(name, this.getMetaItem(type, name));
    });
    return map;
  }
  
  hasObject(objectName: string): boolean {
    return !!this.kernel.metadata?.get('object', objectName);
  }
  
  // Query Methods
  async findData(objectName: string, query?: any): Promise<{ value: any[]; count: number }> {
    if (!this.kernel.find) {
      throw new Error('Kernel does not support find operation');
    }
    return await this.kernel.find(objectName, query || {});
  }
  
  async getData(objectName: string, id: string): Promise<any> {
    if (!this.kernel.get) {
      throw new Error('Kernel does not support get operation');
    }
    return await this.kernel.get(objectName, id);
  }
  
  async countData(objectName: string, filters?: any): Promise<number> {
    const result = await this.findData(objectName, filters ? { where: filters } : {});
    return result.count;
  }
  
  // Mutation Methods
  async createData(objectName: string, data: any): Promise<any> {
    if (!this.kernel.create) {
      throw new Error('Kernel does not support create operation');
    }
    return await this.kernel.create(objectName, data);
  }
  
  async updateData(objectName: string, id: string, data: any): Promise<any> {
    if (!this.kernel.update) {
      throw new Error('Kernel does not support update operation');
    }
    return await this.kernel.update(objectName, id, data);
  }
  
  async deleteData(objectName: string, id: string): Promise<boolean> {
    if (!this.kernel.delete) {
      throw new Error('Kernel does not support delete operation');
    }
    return await this.kernel.delete(objectName, id);
  }
  
  // View & Action Methods
  getViewConfig(objectName: string, viewType?: string): unknown {
    // Implement view config retrieval
    return this.kernel.metadata?.get('view', `${objectName}.${viewType || 'default'}`);
  }
  
  async executeAction(actionName: string, params?: any): Promise<any> {
    if (!this.kernel.executeAction) {
      throw new Error('Kernel does not support action execution');
    }
    return await this.kernel.executeAction(actionName, params);
  }
  
  getActions(): string[] {
    return this.kernel.metadata?.list('action') || [];
  }
  
  // Utility
  getKernel(): any {
    return this.kernel;
  }
}
```

**Success Criteria**:
- [ ] ObjectStackRuntimeProtocol class is accessible
- [ ] All required methods are implemented
- [ ] Protocol plugins can instantiate the bridge

### Task 1.4: Update Protocol Plugin Implementations / 更新协议插件实现

Once the interface and bridge are available, update each protocol plugin:

#### GraphQL Plugin
**File**: `packages/protocols/graphql/src/index.ts`

**Changes**:
```typescript
import { RuntimePlugin, RuntimeContext } from '@objectql/types'; // or correct package
import { ObjectStackRuntimeProtocol } from '@objectql/core'; // or correct package

export class GraphQLPlugin implements RuntimePlugin {
  name = '@objectql/protocol-graphql';
  version = '1.0.0';
  
  private server?: ApolloServer;
  private protocol?: ObjectStackRuntimeProtocol;
  private config: Required<GraphQLPluginConfig>;

  constructor(config: GraphQLPluginConfig = {}) {
    this.config = {
      port: config.port || 4000,
      introspection: config.introspection !== false,
      typeDefs: config.typeDefs || ''
    };
  }

  async install(ctx: RuntimeContext): Promise<void> {
    console.log(`[${this.name}] Installing...`);
    this.protocol = new ObjectStackRuntimeProtocol(ctx.engine);
    console.log(`[${this.name}] Protocol bridge initialized`);
  }

  async onStart(ctx: RuntimeContext): Promise<void> {
    if (!this.protocol) {
      throw new Error('Protocol not initialized');
    }
    
    console.log(`[${this.name}] Starting GraphQL server...`);
    
    const typeDefs = this.generateSchema();
    const resolvers = this.generateResolvers();
    
    this.server = new ApolloServer({
      typeDefs,
      resolvers,
      introspection: this.config.introspection,
      includeStacktraceInErrorResponses: process.env.NODE_ENV !== 'production',
    });
    
    const { url } = await startStandaloneServer(this.server, {
      listen: { port: this.config.port }
    });
    
    console.log(`[${this.name}] 🚀 Server ready at ${url}`);
  }

  async onStop(ctx: RuntimeContext): Promise<void> {
    if (this.server) {
      console.log(`[${this.name}] Stopping...`);
      await this.server.stop();
      this.server = undefined;
    }
  }
  
  // Keep existing generateSchema(), generateResolvers(), etc.
  // But ensure they use this.protocol for all data access
}
```

#### OData V4 Plugin
**File**: `packages/protocols/odata-v4/src/index.ts`

Apply same pattern (details omitted for brevity - follow GraphQL example)

#### JSON-RPC Plugin
**File**: `packages/protocols/json-rpc/src/index.ts`

Apply same pattern (details omitted for brevity - follow GraphQL example)

**Success Criteria**:
- [ ] All three plugins implement RuntimePlugin interface
- [ ] All plugins have install(), onStart(), onStop() hooks
- [ ] All plugins use ObjectStackRuntimeProtocol for data access
- [ ] Build passes
- [ ] Example applications still work

---

## Phase 2: Production-Ready Features / 第二阶段：生产就绪功能

**Duration / 工期**: 2-3 weeks / 2-3 周  
**Priority / 优先级**: 🔴 HIGH / 高

### Task 2.1: Redis Permission Storage Backend / Redis 权限存储后端

**File**: Create `packages/foundation/plugin-security/src/storage/redis.ts`

```typescript
import type { Permission } from '@objectql/types';
import type Redis from 'ioredis';

export interface RedisPermissionStorageConfig {
  redis: Redis;
  keyPrefix?: string;
  ttl?: number; // Time to live in seconds
}

export class RedisPermissionStorage {
  private redis: Redis;
  private keyPrefix: string;
  private ttl: number;
  
  constructor(config: RedisPermissionStorageConfig) {
    this.redis = config.redis;
    this.keyPrefix = config.keyPrefix || 'perms:';
    this.ttl = config.ttl || 3600; // 1 hour default
  }
  
  async savePermissions(role: string, objectName: string, permissions: Permission[]): Promise<void> {
    const key = `${this.keyPrefix}${role}:${objectName}`;
    await this.redis.setex(key, this.ttl, JSON.stringify(permissions));
  }
  
  async loadPermissions(role: string, objectName: string): Promise<Permission[] | null> {
    const key = `${this.keyPrefix}${role}:${objectName}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }
  
  async deletePermissions(role: string, objectName?: string): Promise<void> {
    if (objectName) {
      const key = `${this.keyPrefix}${role}:${objectName}`;
      await this.redis.del(key);
    } else {
      // Delete all permissions for role
      const pattern = `${this.keyPrefix}${role}:*`;
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    }
  }
  
  async clear(): Promise<void> {
    const pattern = `${this.keyPrefix}*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

**Update**: `packages/foundation/plugin-security/package.json`
```json
{
  "dependencies": {
    "ioredis": "^5.3.0"
  },
  "peerDependencies": {
    "ioredis": "^5.0.0"
  },
  "peerDependenciesMeta": {
    "ioredis": {
      "optional": true
    }
  }
}
```

### Task 2.2: Database Permission Storage Backend / 数据库权限存储后端

**File**: Create `packages/foundation/plugin-security/src/storage/database.ts`

Similar implementation using driver interface to store permissions in a database table.

### Task 2.3: Session Management Middleware / 会话管理中间件

**File**: Create `packages/runtime/server/src/middleware/session.ts`

### Task 2.4: JWT Token Validation / JWT 令牌验证

**File**: Create `packages/runtime/server/src/middleware/jwt.ts`

### Task 2.5: CLI Migration System / CLI 迁移系统

**Files**:
- `packages/tools/cli/src/commands/migrate.ts`
- `packages/tools/cli/src/lib/migration-generator.ts`
- `packages/tools/cli/src/lib/schema-comparator.ts`

### Task 2.6: WebSocket Server for GraphQL Subscriptions

**File**: Update `packages/protocols/graphql/src/index.ts`

Add WebSocket support using `graphql-ws` for subscriptions.

---

## Phase 3: Feature Completion / 第三阶段：功能完善

**Duration / 工期**: 2-3 weeks / 2-3 周  
**Priority / 优先级**: 🟡 MEDIUM / 中

### Task 3.1-3.4: CLI Enhancements

Complete the `new`, `test`, and `doctor` commands.

### Task 3.5-3.6: RLS Query Trimmer Extensions

Extend support for formulas and lookups in Row-Level Security.

---

## Phase 4: Testing and Documentation / 第四阶段：测试和文档

**Duration / 工期**: 1-2 weeks / 1-2 周  
**Priority / 优先级**: 🟡 MEDIUM / 中

### Task 4.1-4.3: Test Coverage

Add comprehensive tests for all new features.

### Task 4.4-4.6: Documentation Updates

Update all README files and create migration guides.

---

## Immediate Next Steps / 立即采取的下一步

### Week 1 Actions / 第一周行动

**Day 1-2**: Resolve Import Issues
1. [ ] Determine if `@objectstack/runtime` and `@objectstack/objectql` should be:
   - External dependencies from spec repository
   - Workspace packages to be created
   - Or if architecture should be refactored to use `@objectql/core`
2. [ ] Update package.json files accordingly
3. [ ] Ensure all imports resolve correctly

**Day 3-4**: Define Interfaces
1. [ ] Locate or create RuntimePlugin interface
2. [ ] Locate or create ObjectStackRuntimeProtocol class
3. [ ] Export from appropriate packages
4. [ ] Update TypeScript configurations

**Day 5**: Update Protocol Plugins
1. [ ] Refactor GraphQL plugin to implement RuntimePlugin
2. [ ] Refactor OData V4 plugin
3. [ ] Refactor JSON-RPC plugin
4. [ ] Test all three plugins with examples

---

## Success Metrics / 成功指标

### Phase 1 Complete When:
- [ ] All protocol plugins implement RuntimePlugin interface
- [ ] All builds pass without import errors
- [ ] Example applications run successfully
- [ ] Integration tests pass

### Phase 2 Complete When:
- [ ] Redis and database permission storage backends work
- [ ] Session and JWT authentication integrated
- [ ] CLI migration system generates and runs migrations
- [ ] GraphQL subscriptions functional via WebSocket

### Phase 3 Complete When:
- [ ] All CLI commands fully functional
- [ ] RLS supports formulas and lookups
- [ ] No critical TODOs remain in core code

### Phase 4 Complete When:
- [ ] Test coverage >80% for new code
- [ ] All README files updated
- [ ] Migration guide published
- [ ] IMPLEMENTATION_STATUS.md shows 95%+

---

## Dependencies and Blockers / 依赖和阻碍

### Critical Blockers:
1. **Package Resolution**: Must resolve `@objectstack/runtime` and `@objectstack/objectql` imports
2. **Kernel API**: Must understand ObjectKernel API from `@objectstack/core`

### External Dependencies:
1. Access to `@objectstack/spec` repository (if separate)
2. Coordination with spec repository maintainers

### Technical Decisions Needed:
1. Should protocol plugins be in this monorepo or separate packages?
2. Which package should export RuntimePlugin interface?
3. Should ObjectStackRuntimeProtocol be in core or runtime package?

---

## Risk Mitigation / 风险缓解

### Risk 1: Breaking Changes
**Mitigation**: 
- Make changes in feature branch
- Run full test suite before merging
- Test with all example applications

### Risk 2: Import Resolution Issues
**Mitigation**:
- Document all import paths clearly
- Create tsconfig path mappings if needed
- Use workspace protocol in package.json

### Risk 3: Scope Creep
**Mitigation**:
- Stick to 4-phase plan
- Mark nice-to-have features as future work
- Focus on production readiness first

---

## Communication Plan / 沟通计划

### Weekly Updates:
- Report progress on each phase
- Document any blockers or changes
- Update IMPLEMENTATION_STATUS.md

### Milestone Reviews:
- End of Phase 1: Architecture compliance review
- End of Phase 2: Production readiness assessment
- End of Phase 3: Feature completeness check
- End of Phase 4: Final release preparation

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-29  
**Next Review**: After Phase 1 completion
