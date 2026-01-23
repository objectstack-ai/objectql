## 🚀 Next Steps: Detailed Development Plan

Based on the re-evaluation findings, we have refined the development plan for the immediate future (Weeks 3-5).

### 📅 Week 3: Audit, Measurement & Alignment (Immediate)

**Goal**: Establish precise baselines and synchronize documentation with code reality.

1.  **Deep Code Audit**
    - **Task**: Analyze `packages/foundation/core` to map existing `ObjectQLPlugin` implementation against `@objectstack/runtime` requirements.
    - **Deliverable**: `packages/foundation/core/IMPLEMENTATION_STATUS.md` (Feature-by-feature completion matrix).
    - **Focus**: Identify which methods are production-ready vs. experimental stubs.

2.  **Size & Performance Baselines**
    - **Task**: Implement automated size monitoring.
    - **Action**: Create `scripts/measure-size.sh` to track `@objectql/core` bundle size.
    - **Target**: Establish current baseline (verify if >950KB) to track progress toward <400KB goal.

3.  **Documentation Synchronization**
    - **Task**: Update `MIGRATION_TO_OBJECTSTACK_RUNTIME.md` and `docs/implementation-roadmap.md`.
    - **Action**: Mark Plugin System as 70% complete and adjust subsequent timelines.

### 📅 Week 4: Query Engine & Core Refactoring

**Goal**: Complete the separation of "Query Logic" from "Runtime Logic".

1.  **Extract QueryService**
    - **Task**: Decouple query execution logic from the main `App` class.
    - **Action**: Create `QueryService` that handles `find`, `findOne`, `count`, `aggregate`.
    - **Integration**: Register `QueryService` as a service within the `ObjectQLPlugin`.

2.  **Legacy Cleanup**
    - **Task**: Remove code that now belongs to `@objectstack/runtime`.
    - **Action**: Deprecate/Remove internal validation logic, hook triggers, and transaction management that duplicates ObjectStack functionality.

3.  **Query Analysis Tools**
    - **Task**: Implement `QueryAnalyzer`.
    - **Action**: Add tooling to inspect query plans and execution time (profiling).

### 📅 Week 5: Driver Ecosystem Preparation

**Goal**: Prepare the 8 drivers for the new `DriverInterface` standard.

1.  **Driver Compliance Audit**
    - **Task**: Review all 8 driver packages.
    - **Action**: Create a "Driver Compliance Matrix" checking for:
        - `@objectstack/spec` dependency.
        - `DriverInterface` implementation.
        - Test suite status.

2.  **Pilot Driver Update**
    - **Task**: Fully migrate one SQL driver (e.g., `@objectql/driver-sql` or `driver-postgres`).
    - **Action**: Use this as the reference implementation for other drivers in Weeks 6-8.

### ⏱️ Timeline Adjustment

**Original**: 17 weeks (4 months)
**Revised Estimate**: 12-14 weeks (3-3.5 months)

**Rationale**: Significant work already complete in core package. Plugin architecture already implemented. Focus now on:
- Query-specific features (QueryService, profiling)
- Driver updates (8 drivers)
- Documentation and examples
- Testing and release