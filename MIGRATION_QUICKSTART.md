# Migration Quick Start Guide

**Objective**: Migrate ObjectQL from standalone ORM to @objectstack plugin ecosystem

**Status**: Planning Complete ✅ | Implementation Ready 📅

---

## 📋 Pre-Reading (5 minutes)

Read these in order:

1. **[MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md)** ← Start here! Executive summary
2. **[MIGRATION_TO_OBJECTSTACK.md](./MIGRATION_TO_OBJECTSTACK.md)** ← Full plan
3. **[WORK_BREAKDOWN.md](./WORK_BREAKDOWN.md)** ← Task list

For implementation details, see [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md)

---

## 🎯 What Are We Doing?

**Before (v3.x)**: ObjectQL is a standalone ORM framework  
**After (v4.x)**: ObjectQL is a plugin ecosystem for @objectstack/runtime

### What Changes?

```typescript
// OLD (v3.x) - Standalone
import { ObjectQL } from '@objectql/core';
const app = new ObjectQL({ datasources: {...} });

// NEW (v4.x) - Plugin
import { ObjectStackKernel } from '@objectstack/runtime';
import { ObjectQLPlugin } from '@objectql/core';
const kernel = new ObjectStackKernel({ datasources: {...} });
kernel.use(new ObjectQLPlugin());
```

### What Stays the Same?

✅ All database drivers (SQL, Mongo, Memory, etc.)  
✅ Repository API (`find()`, `create()`, `update()`, `delete()`)  
✅ Validation engine  
✅ Formula engine  
✅ CLI and VSCode extension  
✅ Backward compatibility (v3.x API still works!)

---

## 📅 Timeline at a Glance

| Phase | Weeks | Focus | Status |
|-------|-------|-------|--------|
| 1. Dependencies | 1-2 | Update @objectstack to 0.2.0 | 📅 Next |
| 2. Types | 2-3 | Remove duplicates | 📅 Planned |
| 3. Core | 3-5 | Plugin architecture | 📅 Planned |
| 4. Drivers | 5-7 | DriverInterface impl | 📅 Planned |
| 5. Tools | 7-8 | CLI/VSCode/Server | 📅 Planned |
| 6. Docs | 8-9 | Documentation | 📅 Planned |
| 7. Testing | 9-10 | Validation | 📅 Planned |
| 8. Release | 10-11 | Publish v4.0.0 | 📅 Planned |

**Total**: 11 weeks | **Tasks**: 41 | **Effort**: 77 person-days

---

## 🚀 Getting Started (Week 1, Day 1)

### Step 1: Set Up Tracking (30 minutes)

```bash
# Create GitHub project for tracking
gh project create "ObjectQL Migration to ObjectStack"

# Create feature branch
git checkout -b feature/objectstack-migration

# Create issues from work breakdown
# Use .github/ISSUE_TEMPLATE/migration-task.md
```

### Step 2: Run Current Build (30 minutes)

```bash
cd /home/runner/work/objectql/objectql

# Install dependencies
pnpm install

# Build current version
pnpm build

# Run tests
pnpm test

# Document baseline
echo "Build: $(pnpm build 2>&1 | grep -c 'error')" > migration-baseline.txt
echo "Tests: $(pnpm test 2>&1 | grep -c 'passed')" >> migration-baseline.txt
```

### Step 3: Update Dependencies (Day 1)

Edit each `package.json`:

```json
{
  "dependencies": {
    "@objectstack/spec": "^0.2.0",
    "@objectstack/runtime": "^0.2.0",
    "@objectstack/objectql": "^0.2.0"
  }
}
```

Packages to update:
- `packages/foundation/types/package.json`
- `packages/foundation/core/package.json`
- `packages/foundation/platform-node/package.json`
- All driver packages (9 files)
- `packages/runtime/server/package.json`

```bash
# Update dependencies
pnpm update @objectstack/runtime @objectstack/spec @objectstack/objectql

# Install
pnpm install

# Try to build
pnpm build 2>&1 | tee migration-build-errors.log
```

---

## 📊 Progress Tracking

### Daily Checklist

At the end of each day:
- [ ] Update GitHub issues with progress
- [ ] Commit code changes
- [ ] Document any blockers
- [ ] Update work breakdown status
- [ ] Communicate with team

### Weekly Review

Every Friday:
- [ ] Review completed tasks
- [ ] Adjust timeline if needed
- [ ] Update stakeholders
- [ ] Plan next week's tasks

---

## 🔧 Common Tasks

### Creating a Migration Issue

```bash
# Use the template
gh issue create --template migration-task.md \
  --title "[MIGRATION] Update @objectql/types to use @objectstack/spec" \
  --label migration,phase-2
```

### Running Tests for One Package

```bash
cd packages/foundation/core
pnpm test
```

### Building One Package

```bash
cd packages/foundation/core
pnpm build
```

### Checking Type Compatibility

```bash
cd packages/foundation/core
npx tsc --noEmit
```

---

## 🆘 When You're Stuck

### Build Errors

1. Read error message carefully
2. Check [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md) for similar cases
3. Create issue with `migration-help` label
4. Tag maintainers

### Design Questions

1. Check [MIGRATION_TO_OBJECTSTACK.md](./MIGRATION_TO_OBJECTSTACK.md) architecture section
2. Review @objectstack package docs on npm
3. Create discussion in GitHub
4. Tag architects

### Timeline Concerns

1. Update [WORK_BREAKDOWN.md](./WORK_BREAKDOWN.md) with actual time
2. Identify critical path impact
3. Discuss with team lead
4. Adjust phase timelines if needed

---

## 📚 Reference Links

### ObjectStack Packages
- [@objectstack/runtime](https://www.npmjs.com/package/@objectstack/runtime) - Core runtime
- [@objectstack/spec](https://www.npmjs.com/package/@objectstack/spec) - Protocol specs
- [@objectstack/objectql](https://www.npmjs.com/package/@objectstack/objectql) - Query engine

### Repository
- [GitHub Issues](https://github.com/objectstack-ai/objectql/issues)
- [Discussions](https://github.com/objectstack-ai/objectql/discussions)
- [Pull Requests](https://github.com/objectstack-ai/objectql/pulls)

### Migration Docs
- [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md) - Quick overview
- [MIGRATION_TO_OBJECTSTACK.md](./MIGRATION_TO_OBJECTSTACK.md) - Full plan
- [MIGRATION_TO_OBJECTSTACK.zh-CN.md](./MIGRATION_TO_OBJECTSTACK.zh-CN.md) - 中文版
- [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md) - Implementation guide
- [WORK_BREAKDOWN.md](./WORK_BREAKDOWN.md) - Task breakdown

---

## ✅ Definition of Done

A migration phase is complete when:

1. **Code**
   - [ ] All planned changes implemented
   - [ ] Code compiles with no errors
   - [ ] No linter warnings

2. **Tests**
   - [ ] All existing tests pass
   - [ ] New tests added for new functionality
   - [ ] Test coverage maintained ≥80%

3. **Documentation**
   - [ ] Code comments updated
   - [ ] README.md updated (if applicable)
   - [ ] Migration guide updated

4. **Review**
   - [ ] Code reviewed by peer
   - [ ] Architecture reviewed by lead
   - [ ] Changes approved

5. **Integration**
   - [ ] Merged to feature branch
   - [ ] CI/CD passes
   - [ ] No conflicts with other work

---

## 🎓 Learning Resources

### Understanding @objectstack

1. Read @objectstack/spec README
2. Review @objectstack/runtime examples
3. Check @objectstack/objectql API docs

### Plugin Architecture

1. Review Plugin interface in @objectstack/runtime
2. Study existing @objectstack plugins
3. Read plugin development guide (when available)

### Driver Development

1. Review DriverInterface in @objectstack/spec
2. Study existing driver implementations
3. See driver development guide in docs/

---

## 📞 Communication

### Channels

- **GitHub Issues**: Bug reports, feature requests
- **GitHub Discussions**: Design questions, RFCs
- **Pull Requests**: Code reviews
- **Team Chat**: Daily coordination (if available)

### Tagging

Use labels consistently:
- `migration` - All migration work
- `phase-1` through `phase-8` - Phase tracking
- `bug` - Issues discovered during migration
- `documentation` - Doc updates
- `help-wanted` - Need assistance

---

## 🏁 First Week Goals

By end of Week 1, we should have:

1. ✅ All documentation read by team
2. ✅ GitHub project set up
3. ✅ All 41 issues created
4. ✅ Feature branch created
5. ✅ Current build baseline documented
6. ✅ Phase 1 started: Dependencies updated
7. ✅ Build errors documented
8. ✅ Initial fixes committed

---

**Ready to start?** → Begin with [WORK_BREAKDOWN.md](./WORK_BREAKDOWN.md) Task 1.1

**Questions?** → Create a [GitHub Discussion](https://github.com/objectstack-ai/objectql/discussions)

**Good luck! 🚀**
