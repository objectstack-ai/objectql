# ObjectStack Official Migration Plan

## Objective
Transition the current `objectql` monorepo from a custom hybrid implementation to a fully standard, official `@objectstack` architecture. This involves decoupling plugins, standardizing drivers, and eventually switching the execution engine to the official runtime.

## Phases

### Phase 1: Decouple Plugins (Event-Driven Architecture)
**Goal:** Remove hard-coded dependencies between Core and Plugins (Validator, Formula).
**Rationale:** The official architecture relies on an event-driven hook system. Core should not know about specific plugins.
**Tasks:**
1. [ ] **Refactor ValidatorPlugin**: Ensure `beforeMutation` and `beforeQuery` hooks are strictly registered via `kernel.hooks.register` in the `install()` method. Implement the actual validation logic within these hooks.
2. [ ] **Refactor FormulaPlugin**: Ensure formula calculation hooks are registered via `kernel.hooks.register`.
3. [ ] **Clean up ObjectRepository**: Remove `import { Validator }` and `import { FormulaEngine }`. Remove manual method calls like `validator.validate()` and `formula.run()`. Rely entirely on `this.triggerHook('beforeCreate', ...)` etc.

### Phase 2: Standardize Driver Interfaces
**Goal:** Ensure all drivers in `packages/drivers/*` comply with `@objectstack/spec`.
**Rationale:** The official `RuntimeObjectQL` engine requires strict adherence to the `DriverInterface` protocol.
**Tasks:**
1. [ ] Audit `packages/drivers/sql` against the official `DriverInterface`.
2. [ ] Ensure `execute(ast)` signature matches the spec.

### Phase 3: Switch to Official Runtime Engine
**Goal:** Replace local query compilation with `RuntimeObjectQL`.
**Rationale:** Leverage official performance, caching, and security features.
**Tasks:**
1. [ ] **Delegate CRUD**: Update `ObjectRepository` to delegate `find`, `create`, `update`, `delete` operations directly to `this.app.ql` (the official engine instance).
2. [ ] **Retire Local Logic**: Deprecate and remove local `QueryBuilder`, `QueryCompiler`, and `ObjectRepository`'s internal logic.

---

**Execution Strategy:**
We will execute Phase 1 immediately to achieve architectural decoupling.
