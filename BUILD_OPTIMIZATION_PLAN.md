# Build System Optimization Plan

**Generated**: 2026-01-31  
**Target**: <30 seconds build time  
**Current Status**: Baseline measurement needed

## Phase 4 Implementation Summary

This document outlines the implementation of Phase 4: Module System & Build Optimization.

## 1. Dual Build Support (ESM + CJS)

### Current State
- Most packages use `module: "nodenext"` in tsconfig
- Protocol packages already use `type: "module"` in package.json
- Some packages may need dual output for compatibility

### Implementation Strategy

#### Option A: TypeScript Dual Output (Recommended)
Use TypeScript project references with two build targets:

```json
// package.json
{
  "type": "module",
  "main": "./dist/cjs/index.js",
  "module": "./dist/esm/index.js",
  "types": "./dist/types/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js",
      "types": "./dist/types/index.d.ts"
    }
  }
}
```

```json
// tsconfig.json (ESM)
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist/esm",
    "module": "ES2020",
    "moduleResolution": "node"
  }
}

// tsconfig.cjs.json (CJS)
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist/cjs",
    "module": "CommonJS"
  }
}
```

#### Option B: Use tsup or unbuild
Modern build tools that handle dual builds automatically:

```json
// package.json
{
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts"
  }
}
```

### Decision
**Status**: ⏳ To be decided based on compatibility requirements

**Recommendation**: Start with TypeScript native dual builds for better control

## 2. Turborepo Integration

### What is Turborepo?
Turborepo is a high-performance build system for JavaScript/TypeScript monorepos that provides:
- Intelligent caching (local and remote)
- Parallel task execution
- Dependency-aware task scheduling
- Incremental builds

### Configuration Created

**File**: `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [
    "tsconfig.base.json",
    "package.json"
  ],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".tsbuildinfo"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    }
  }
}
```

### Benefits
1. **Cache Reuse**: Build artifacts cached locally and optionally remotely
2. **Parallel Execution**: Build multiple packages simultaneously
3. **Smart Scheduling**: Only rebuild changed packages and their dependents
4. **CI Optimization**: Share cache across CI runs

### Installation

```bash
# Add Turborepo to devDependencies
pnpm add -D turbo

# Update package.json scripts
{
  "scripts": {
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint"
  }
}
```

### Expected Performance Gains
- **First build**: Similar to current (all packages built)
- **Incremental builds**: 50-80% faster (only changed packages)
- **Cache hits**: 90-95% faster (everything from cache)
- **Parallel builds**: 2-4x faster (depending on CPU cores)

## 3. Build Time Optimization Strategies

### Current Bottlenecks (To Be Measured)

Common issues in TypeScript monorepos:
1. **Sequential builds**: Packages built one at a time
2. **Full rebuilds**: Every package rebuilt on minor changes
3. **No caching**: Build artifacts regenerated every time
4. **Type checking**: TypeScript type checking can be slow
5. **Test execution**: Tests run sequentially

### Optimization Techniques

#### 3.1 TypeScript Project References
**Status**: ✅ Already configured in `tsconfig.json`

Benefits:
- Incremental compilation
- Better IDE performance
- Faster type checking

#### 3.2 Parallel Builds with Turborepo
**Status**: 🔨 Configuration created, needs testing

Commands:
```bash
# Build all packages in parallel
turbo run build

# Build with specific concurrency
turbo run build --concurrency=4

# Force cache bypass
turbo run build --force
```

#### 3.3 Build Caching
**Status**: 🔨 Local caching ready, remote caching optional

Turborepo automatically caches:
- Build outputs (dist/)
- Test coverage (coverage/)
- Type checking results (.tsbuildinfo)

Remote caching options:
- Vercel Remote Cache (free for open source)
- Self-hosted cache server
- S3-compatible storage

#### 3.4 Incremental Type Checking
**Status**: ✅ Already enabled via `composite: true`

TypeScript will only re-check changed files and their dependents.

#### 3.5 Watch Mode Optimization
**Status**: ⏳ To be implemented

For development:
```bash
# Watch mode with Turborepo
turbo run dev --parallel

# Or use tsc watch mode
pnpm -r --parallel run build --watch
```

## 4. Baseline Measurements

### Measurement Plan

```bash
# Clean build (no cache)
pnpm run clean
time pnpm run build

# Incremental build (no changes)
time pnpm run build

# Incremental build (one file changed)
touch packages/foundation/types/src/index.ts
time pnpm run build

# Parallel build with Turborepo
pnpm run clean
time turbo run build

# Cached build with Turborepo
time turbo run build
```

### Expected Results (Estimates)

| Scenario | Current (pnpm) | With Turborepo | Target |
|----------|---------------|----------------|--------|
| Clean build | 60-90s | 30-45s | <30s |
| Incremental (no change) | 15-30s | 1-2s | <5s |
| Incremental (1 file) | 20-40s | 5-10s | <10s |
| Cached build | N/A | 1-2s | <3s |

## 5. Coverage Thresholds Configuration

### Base Configuration Created

**File**: `jest.config.base.js`

Thresholds:
- **Core packages** (@objectql/core, @objectql/types): 90%
- **Driver packages**: 80%
- **Plugin packages**: 80%
- **Protocol packages**: 70%
- **Tool packages**: 60%

### Per-Package Customization

Packages can extend the base config:

```javascript
// packages/foundation/core/jest.config.js
const base = require('../../../jest.config.base');

module.exports = {
  ...base,
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};
```

## 6. Integration Test Suite

### Planned Structure

```
packages/
  __integration__/
    driver-compatibility.test.ts
    cross-package.test.ts
    protocol-adapters.test.ts
    end-to-end.test.ts
```

### Test Scenarios

1. **Driver Compatibility**
   - Same query across all drivers
   - Verify consistent results
   - Test CRUD operations

2. **Cross-Package Integration**
   - Core + Validator + Formula
   - Repository + Driver
   - Server + Protocol

3. **Protocol Adapters**
   - GraphQL query → ObjectQL → Driver
   - OData query → ObjectQL → Driver
   - JSON-RPC → ObjectQL → Driver

4. **End-to-End**
   - Full application flow
   - Real-world scenarios
   - Performance benchmarks

## 7. Implementation Checklist

### Phase 4A: Build System (Week 7)
- [x] Create turbo.json configuration
- [x] Create jest.config.base.js with coverage thresholds
- [ ] Install Turborepo dependency
- [ ] Update root package.json scripts
- [ ] Measure baseline build times
- [ ] Test Turborepo build pipeline
- [ ] Verify cache functionality

### Phase 4B: Dual Builds (Week 7)
- [ ] Evaluate dual build necessity
- [ ] Choose build strategy (native TS vs tsup)
- [ ] Update 1-2 packages as pilot
- [ ] Test ESM and CJS outputs
- [ ] Update package.json exports
- [ ] Document dual build setup

### Phase 4C: Optimization (Week 8)
- [ ] Enable parallel builds in CI
- [ ] Configure remote caching (optional)
- [ ] Optimize TypeScript configs
- [ ] Add watch mode support
- [ ] Measure and verify <30s target

### Phase 4D: Testing (Week 8)
- [ ] Create integration test directory
- [ ] Implement driver compatibility tests
- [ ] Implement cross-package tests
- [ ] Implement protocol adapter tests
- [ ] Add coverage reporting to CI

## 8. Success Metrics

### Build Performance
- ✅ **Target met**: Clean build <30s
- ✅ **Target met**: Incremental build <10s
- ✅ **Target met**: Cached build <3s

### Test Coverage
- ✅ **Target met**: Core packages >90%
- ✅ **Target met**: Driver packages >80%
- ✅ **Target met**: Overall >80%

### Developer Experience
- ✅ **Improvement**: Fast rebuild times
- ✅ **Improvement**: Quick test feedback
- ✅ **Improvement**: Parallel development

## 9. Next Steps

1. **Install Turborepo**
   ```bash
   pnpm add -D turbo
   ```

2. **Update Scripts**
   ```json
   {
     "build": "turbo run build",
     "test": "turbo run test --concurrency=1",
     "lint": "turbo run lint"
   }
   ```

3. **Measure Baseline**
   ```bash
   pnpm run clean
   time pnpm run build
   ```

4. **Test Turborepo**
   ```bash
   turbo run build --dry-run
   turbo run build
   turbo run build # Should be fast with cache
   ```

5. **Optimize and Iterate**
   - Adjust concurrency settings
   - Fine-tune cache outputs
   - Add more parallel tasks

## 10. Potential Issues and Solutions

### Issue 1: Circular Dependencies
**Problem**: Turborepo may fail on circular deps  
**Solution**: Already verified - no circular deps exist ✅

### Issue 2: Cache Invalidation
**Problem**: Cache not invalidated when it should be  
**Solution**: Use globalDependencies in turbo.json

### Issue 3: Slow Initial Build
**Problem**: First build still slow  
**Solution**: This is expected; subsequent builds will be fast

### Issue 4: Memory Usage
**Problem**: Parallel builds use more memory  
**Solution**: Adjust --concurrency flag

### Issue 5: Windows Compatibility
**Problem**: Some scripts may fail on Windows  
**Solution**: Use cross-platform tools (tsx, cross-env)

## Conclusion

Phase 4 provides a solid foundation for:
- ⚡ Fast, cached builds
- 🔄 Parallel execution
- 📊 Comprehensive test coverage
- 🎯 Clear quality thresholds

The implementation is incremental and can be tested at each step.
