# Feature Migration Matrix: ObjectQL → @objectstack/runtime

This matrix maps current ObjectQL features to their destinations in the @objectstack/runtime architecture.

## Legend
- ✅ **Keep in @objectql** - Query-specific, stays in this repository as plugin
- ⬆️ **Move to @objectstack/runtime** - Core functionality, should be in base runtime
- 🔄 **Refactor as Plugin** - Convert to plugin architecture
- 🗑️ **Deprecate** - Remove or replace with runtime equivalent

## Feature Comparison Matrix

| Feature | Current Location | Decision | Target Location | Priority | Effort | Notes |
|---------|-----------------|----------|-----------------|----------|--------|-------|
| **Application Lifecycle** |
| App initialization | @objectql/core/app.ts | ⬆️ | @objectstack/runtime | P0 | High | Core runtime responsibility |
| App context management | @objectql/core/app.ts | ⬆️ | @objectstack/runtime | P0 | High | Unified context across all plugins |
| Plugin system | @objectql/core/app.ts | ⬆️ | @objectstack/runtime | P0 | High | Standard plugin architecture |
| Lifecycle hooks | @objectql/core/app.ts | ⬆️ | @objectstack/runtime | P0 | Medium | Standardize lifecycle events |
| **Metadata & Schema** |
| Metadata registry | @objectql/types | ⬆️ | @objectstack/runtime | P0 | High | Central schema registry |
| Object registration | @objectql/core/object.ts | ⬆️ | @objectstack/runtime | P0 | Medium | Runtime manages all objects |
| Field definitions | @objectql/types | ⬆️ | @objectstack/runtime | P0 | Medium | Standard field types |
| Relationship definitions | @objectql/types | ⬆️ | @objectstack/runtime | P0 | Medium | Standard relationship model |
| Index definitions | @objectql/types | ⬆️ | @objectstack/runtime | P1 | Low | Database-agnostic indexes |
| **Driver Management** |
| Driver interface | @objectstack/spec | ✅ | @objectstack/spec | P0 | Low | Already using spec |
| Driver registration | @objectql/core/app.ts | ⬆️ | @objectstack/runtime | P0 | Medium | Runtime orchestrates drivers |
| Driver lifecycle | @objectql/core/app.ts | ⬆️ | @objectstack/runtime | P0 | Medium | Connect/disconnect management |
| Multi-datasource support | @objectql/core/app.ts | ⬆️ | @objectstack/runtime | P0 | Medium | Runtime feature |
| **Query Functionality** |
| Query AST definition | @objectstack/spec | ✅ | @objectstack/spec | P0 | Low | Standard protocol |
| Query validation | @objectql/core/validator.ts | 🔄 | @objectql/query-validation | P0 | High | Query-specific validation plugin |
| Query optimization | Not implemented | 🔄 | @objectql/query-optimizer | P2 | High | New plugin capability |
| Query caching | Not implemented | 🔄 | @objectql/query-cache | P2 | Medium | New plugin capability |
| Query builder | @objectql/core/repository.ts | 🔄 | @objectql/query-builder | P1 | Medium | Fluent query construction |
| **Repository Pattern** |
| ObjectRepository class | @objectql/core/repository.ts | 🔄 | @objectql/advanced-repository | P0 | High | Enhanced repository as plugin |
| CRUD operations | @objectql/core/repository.ts | ✅ | @objectql/advanced-repository | P0 | Medium | Query-specific operations |
| Batch operations | @objectql/core/repository.ts | ✅ | @objectql/advanced-repository | P1 | Low | Advanced query feature |
| Transaction support | @objectql/core/repository.ts | ⬆️ | @objectstack/runtime | P0 | High | Runtime manages transactions |
| **Validation Engine** |
| Field validators | @objectql/core/validator.ts | 🔄 | @objectql/query-validation | P0 | Medium | Query data validation |
| Cross-field validation | @objectql/core/validator.ts | 🔄 | @objectql/query-validation | P1 | Medium | Query-level validation |
| Custom validators | @objectql/core/validator.ts | 🔄 | @objectql/query-validation | P1 | Low | Plugin extensibility |
| Validation messages | @objectql/core/validator.ts | 🔄 | @objectql/query-validation | P1 | Low | Error formatting |
| Validation rules YAML | @objectql/types | ⬆️ | @objectstack/runtime | P1 | Medium | Metadata-driven validation |
| **Hooks System** |
| Hook registration | @objectql/core/hook.ts | ⬆️ | @objectstack/runtime | P0 | Medium | Standard event system |
| Hook execution | @objectql/core/hook.ts | ⬆️ | @objectstack/runtime | P0 | Medium | Runtime event dispatcher |
| CRUD hooks | @objectql/core/hook.ts | ✅ | @objectql/advanced-repository | P0 | Low | Query lifecycle events |
| Validation hooks | @objectql/core/hook.ts | 🔄 | @objectql/query-validation | P1 | Low | Validation lifecycle |
| **Actions System** |
| Action registration | @objectql/core/action.ts | ⬆️ | @objectstack/runtime | P0 | Medium | Runtime command pattern |
| Action execution | @objectql/core/action.ts | ⬆️ | @objectstack/runtime | P0 | Medium | Runtime dispatcher |
| Custom actions | @objectql/core/action.ts | 🔄 | Plugin-based | P1 | Low | Plugin actions |
| **Formula Engine** |
| Formula parsing | @objectql/core/formula-engine.ts | 🔄 | @objectql/formula-engine | P1 | Medium | Specialized plugin |
| Expression evaluation | @objectql/core/formula-engine.ts | 🔄 | @objectql/formula-engine | P1 | Medium | Query expression support |
| Built-in functions | @objectql/core/formula-engine.ts | 🔄 | @objectql/formula-engine | P1 | Low | Standard function library |
| Custom functions | @objectql/core/formula-engine.ts | 🔄 | @objectql/formula-engine | P2 | Low | Plugin extensibility |
| **AI Integration** |
| AI agent interface | @objectql/core/ai-agent.ts | 🔄 | @objectql/ai-query-generator | P2 | Medium | AI query generation plugin |
| Natural language to query | @objectql/core/ai-agent.ts | 🔄 | @objectql/ai-query-generator | P2 | High | LLM integration |
| Query suggestions | Not implemented | 🔄 | @objectql/ai-query-generator | P3 | High | AI-powered suggestions |
| **Type System** |
| Core types | @objectql/types | ⬆️ | @objectstack/spec | P0 | High | Standard protocol types |
| Driver types | @objectql/types | ✅ | @objectstack/spec | P0 | Low | Already using spec |
| Query types | @objectql/types | ✅ | @objectstack/spec | P0 | Low | Standard QueryAST |
| Repository types | @objectql/types | ✅ | @objectql/types | P1 | Low | Query-specific types |
| **Drivers** |
| SQL Driver | @objectql/driver-sql | 🔄 | @objectql/driver-sql | P0 | Medium | Convert to plugin |
| MongoDB Driver | @objectql/driver-mongo | 🔄 | @objectql/driver-mongo | P0 | Medium | Convert to plugin |
| Memory Driver | @objectql/driver-memory | 🔄 | @objectql/driver-memory | P0 | Medium | Convert to plugin |
| LocalStorage Driver | @objectql/driver-localstorage | 🔄 | @objectql/driver-localstorage | P1 | Medium | Convert to plugin |
| FS Driver | @objectql/driver-fs | 🔄 | @objectql/driver-fs | P1 | Low | Convert to plugin |
| Excel Driver | @objectql/driver-excel | 🔄 | @objectql/driver-excel | P2 | Low | Convert to plugin |
| Redis Driver | @objectql/driver-redis | 🔄 | @objectql/driver-redis | P2 | Low | Convert to plugin |
| SDK Driver | @objectql/driver-sdk | 🔄 | @objectql/driver-sdk | P0 | Medium | Convert to plugin |
| **Platform Integration** |
| Node.js utilities | @objectql/platform-node | ⬆️ | @objectstack/platform-node | P0 | Medium | Platform-specific runtime |
| File system integration | @objectql/platform-node | ⬆️ | @objectstack/platform-node | P0 | Low | Runtime filesystem access |
| YAML loader | @objectql/platform-node | ⬆️ | @objectstack/platform-node | P0 | Low | Metadata loading |
| Plugin loader | @objectql/platform-node | ⬆️ | @objectstack/platform-node | P0 | Medium | Dynamic plugin loading |
| **Server & Runtime** |
| HTTP server | @objectql/server | 🔄 | @objectql/server | P1 | Medium | Query API server plugin |
| REST API | @objectql/server | 🔄 | @objectql/server | P1 | Low | REST query endpoints |
| GraphQL API | Not implemented | 🔄 | @objectql/graphql-server | P2 | High | GraphQL query plugin |
| Metadata API | @objectql/server | ⬆️ | @objectstack/runtime | P1 | Medium | Runtime metadata API |
| **Developer Tools** |
| CLI | @objectql/cli | 🔄 | @objectql/cli | P1 | High | Generate runtime-compatible code |
| Project scaffolding | @objectql/create | 🔄 | @objectql/create | P1 | Medium | Runtime-based templates |
| VSCode extension | @objectql/vscode-objectql | 🔄 | @objectql/vscode-objectql | P1 | Medium | Update for runtime |
| Dev server | @objectql/cli | 🔄 | @objectql/cli | P1 | Low | Runtime dev mode |
| **Security & Permissions** |
| RBAC system | Not implemented | ⬆️ | @objectstack/runtime | P0 | High | Core security feature |
| Permission checking | Not implemented | ⬆️ | @objectstack/runtime | P0 | High | Runtime authorization |
| Field-level security | Not implemented | ⬆️ | @objectstack/runtime | P1 | Medium | Metadata-driven security |
| Row-level security | Not implemented | 🔄 | @objectql/query-security | P1 | High | Query-level security plugin |
| **Performance** |
| Connection pooling | Driver-specific | ⬆️ | @objectstack/runtime | P0 | Medium | Runtime manages pools |
| Query caching | Not implemented | 🔄 | @objectql/query-cache | P2 | Medium | Query optimization plugin |
| Result caching | Not implemented | 🔄 | @objectql/query-cache | P2 | Low | Query optimization plugin |
| Lazy loading | Partial | 🔄 | @objectql/advanced-repository | P2 | Low | Repository feature |
| **Testing & Quality** |
| Test utilities | Various | ⬆️ | @objectstack/testing | P1 | Medium | Standard test helpers |
| Mock drivers | @objectql/driver-memory | ⬆️ | @objectstack/testing | P1 | Low | Testing infrastructure |
| Test fixtures | Various | ⬆️ | @objectstack/testing | P2 | Low | Reusable test data |

## Summary Statistics

### By Decision Type
- ⬆️ **Move to @objectstack/runtime**: 25 features (42%)
- 🔄 **Refactor as Plugin**: 28 features (47%)
- ✅ **Keep in @objectql**: 7 features (11%)
- 🗑️ **Deprecate**: 0 features (0%)

### By Priority
- **P0 (Critical)**: 35 features (58%)
- **P1 (High)**: 18 features (30%)
- **P2 (Medium)**: 6 features (10%)
- **P3 (Low)**: 1 feature (2%)

### By Effort
- **High**: 18 features (30%)
- **Medium**: 30 features (50%)
- **Low**: 12 features (20%)

## Migration Waves

### Wave 1: Foundation (Weeks 1-4)
**Dependencies:** None  
**Features:** Core runtime integration, metadata registry, driver management, plugin system

**Includes:**
- App initialization → @objectstack/runtime
- Context management → @objectstack/runtime
- Metadata registry → @objectstack/runtime
- Driver registration → @objectstack/runtime
- Plugin system → @objectstack/runtime

### Wave 2: Drivers (Weeks 5-6)
**Dependencies:** Wave 1  
**Features:** Convert all drivers to plugin architecture

**Includes:**
- SQL Driver → Plugin
- MongoDB Driver → Plugin
- Memory Driver → Plugin
- SDK Driver → Plugin
- All other drivers → Plugins

### Wave 3: Core Plugins (Weeks 7-10)
**Dependencies:** Wave 1, Wave 2  
**Features:** Essential query functionality as plugins

**Includes:**
- Query validation plugin
- Advanced repository plugin
- Query builder plugin
- Formula engine plugin

### Wave 4: Enhanced Plugins (Weeks 11-14)
**Dependencies:** Wave 3  
**Features:** Advanced query capabilities

**Includes:**
- Query optimizer plugin
- Query cache plugin
- AI query generator plugin
- Query security plugin

### Wave 5: Tools & Integration (Weeks 15-18)
**Dependencies:** All previous waves  
**Features:** Developer tools and integrations

**Includes:**
- CLI updates
- VSCode extension updates
- Server updates
- Create tool updates

### Wave 6: Polish & Release (Weeks 19-22)
**Dependencies:** All previous waves  
**Features:** Testing, documentation, migration support

**Includes:**
- Comprehensive testing
- Documentation updates
- Migration guides
- Example updates

## Critical Path Analysis

### Must-Have for MVP
1. Runtime kernel integration (Wave 1)
2. SQL/Memory driver plugins (Wave 2)
3. Query validation plugin (Wave 3)
4. Advanced repository plugin (Wave 3)
5. CLI updates (Wave 5)

### Can Be Deferred
1. Query optimizer plugin
2. Query cache plugin
3. AI query generator plugin
4. GraphQL server plugin
5. Non-critical drivers (Excel, Redis)

## Risk Assessment by Feature

### High Risk Features
1. **App initialization** - Complex state management
2. **Transaction support** - Distributed transaction complexity
3. **Natural language to query** - AI integration challenges
4. **RBAC system** - Security critical
5. **Connection pooling** - Performance critical

### Medium Risk Features
1. **Metadata registry migration** - Data migration needed
2. **Hook system refactor** - Event system compatibility
3. **Driver plugin conversion** - Multiple driver types
4. **Query validation** - Complex validation rules

### Low Risk Features
1. **Type exports** - Already using @objectstack/spec
2. **YAML loader** - Well-defined functionality
3. **Custom validators** - Clear plugin API
4. **File system integration** - Platform-specific utilities

## Backward Compatibility Strategy

### Deprecated APIs (v4.0.0)
```typescript
// OLD: Direct ObjectQL instantiation
const app = new ObjectQL({ datasources: {...} });

// NEW: Runtime-based
const runtime = createRuntime({
  plugins: [sqlDriverPlugin({...})]
});
```

### Compatibility Layer Duration
- **v4.0.x**: Full backward compatibility with warnings
- **v4.1.x**: Deprecated API warnings
- **v5.0.x**: Remove deprecated APIs

### Migration Tools
1. Automated code migration script
2. Configuration converter
3. Plugin wrapper generator
4. Compatibility checker CLI

## Next Steps

1. **Review & Approve** this matrix with the team
2. **Prioritize** features based on business needs
3. **Design** plugin interfaces for Wave 1
4. **Prototype** core runtime integration
5. **Plan** detailed sprints for each wave

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-01-21  
**Status:** Draft - Pending Review
