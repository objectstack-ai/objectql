# @objectql/plugin-workflow

State machine workflow engine plugin for ObjectQL. Provides full XState-level state machine execution with guards, actions, and compound states.

## Overview

The Workflow Plugin implements a powerful state machine engine that manages complex business workflows through declarative configuration. It operates at the **Hook/Validation layer**, intercepting state field changes via `beforeUpdate` hooks to evaluate guards, execute actions, and enforce state transition rules.

### Key Features

- ✅ **XState-Compatible**: Full support for XState state machine patterns
- ✅ **Guard Conditions**: Declarative conditions that control transitions
- ✅ **Entry/Exit Actions**: Execute side effects during state transitions
- ✅ **Compound States**: Hierarchical state nesting with automatic resolution
- ✅ **Audit Trail**: Optional persistence of all state transitions
- ✅ **Type-Safe**: Full TypeScript support with protocol-derived types
- ✅ **Zero SQL Impact**: Operates at hook layer, no changes to query generation

## Installation

```bash
pnpm add @objectql/plugin-workflow
```

## Quick Start

### 1. Define State Machine in Object Metadata

```yaml
# project.object.yml
name: project
fields:
  status:
    type: select
    options: [draft, active, done]
    default: draft

stateMachine:
  initial: draft
  states:
    draft:
      on:
        submit:
          target: active
    active:
      on:
        complete:
          target: done
    done:
      type: final
```

### 2. Install the Plugin

```typescript
import { WorkflowPlugin } from '@objectql/plugin-workflow';
import { ObjectStackKernel } from '@objectstack/runtime';

const kernel = new ObjectStackKernel([
  new WorkflowPlugin({
    enableAuditTrail: true,
  }),
  // ... other plugins
]);

await kernel.start();
```

### 3. State Transitions Work Automatically

```typescript
// Valid transition - allowed
await api.update('project', 'p1', { status: 'active' });
// ✅ Success

// Invalid transition - denied
await api.update('project', 'p1', { status: 'done' });
// ❌ ObjectQLError: TRANSITION_DENIED
```

## Features

### Guards (Conditions)

Control which transitions are allowed:

```yaml
stateMachine:
  states:
    draft:
      on:
        submit:
          target: pending_approval
          cond:
            field: complete
            operator: equals
            value: true
```

Built-in guards:

- `hasRole:roleName` - User has specific role
- `hasPermission:permission` - User has permission
- `isOwner` - User owns the record
- `isCreator` - User created the record
- `field:expression` - Field-based conditions

### Actions

Execute side effects during transitions:

```yaml
stateMachine:
  states:
    draft:
      exit:
        - timestamp:submitted_at
    active:
      entry:
        - notifyStakeholders
        - setField:active_at=$now
```

Built-in actions:

- `setField:field=value` - Update field value
- `increment:field` - Increment numeric field
- `timestamp:field` - Set timestamp
- `log:message` - Console log

### Compound States

Hierarchical state nesting:

```yaml
stateMachine:
  initial: editing
  states:
    editing:
      initial: draft
      states:
        draft: {}
        review: {}
      on:
        publish:
          target: published
    published:
      type: final
```

### Audit Trail

Track all state transitions:

```typescript
const plugin = new WorkflowPlugin({ enableAuditTrail: true });

// Query audit trail
const trail = plugin.getAuditTrail({
  objectName: 'project',
  recordId: 'p123',
});

console.log(trail);
// [
//   {
//     id: '...',
//     objectName: 'project',
//     recordId: 'p123',
//     currentState: 'active',
//     previousState: 'draft',
//     timestamp: '2026-02-07T...',
//     actionsExecuted: ['onExitDraft', 'onEnterActive'],
//   }
// ]
```

## Configuration

### WorkflowPluginConfig

```typescript
interface WorkflowPluginConfig {
  /** Enable audit trail persistence. Default: false */
  enableAuditTrail?: boolean;

  /** Custom guard resolver for external guards */
  guardResolver?: (guardRef: string, context: ExecutionContext) => Promise<boolean>;

  /** Custom action executor for external actions */
  actionExecutor?: (actionRef: string, context: ExecutionContext) => Promise<void>;
}
```

### Custom Guard Resolver

```typescript
const plugin = new WorkflowPlugin({
  guardResolver: async (guardRef, context) => {
    if (guardRef === 'budgetApproved') {
      const budget = await fetchBudgetStatus(context.record.id);
      return budget.approved;
    }
    return false;
  },
});
```

### Custom Action Executor

```typescript
const plugin = new WorkflowPlugin({
  actionExecutor: async (actionRef, context) => {
    if (actionRef === 'notifyApprover') {
      await sendEmail({
        to: context.record.approver_email,
        subject: 'Approval Required',
        body: `Project ${context.record.name} needs your approval`,
      });
    }
  },
});
```

## API Reference

### StateMachineEngine

```typescript
import { StateMachineEngine } from '@objectql/plugin-workflow';

const engine = new StateMachineEngine(config, guardEvaluator, actionExecutor);

const result = await engine.transition('draft', 'active', context);

if (result.allowed) {
  console.log('Transition allowed');
} else {
  console.error('Denied:', result.error);
}
```

### GuardEvaluator

```typescript
import { GuardEvaluator } from '@objectql/plugin-workflow';

const evaluator = new GuardEvaluator(customResolver);

const result = await evaluator.evaluate(
  { field: 'approved', operator: 'equals', value: true },
  context
);

console.log(result.passed); // true or false
```

### ActionExecutor

```typescript
import { ActionExecutor } from '@objectql/plugin-workflow';

const executor = new ActionExecutor(customExecutor);

await executor.execute('notifyApprover', context);
await executor.executeMultiple(['action1', 'action2'], context);
```

## Architecture

```
┌──────────────────────────────┐
│  plugin-workflow             │  ← beforeUpdate hook
│  (State Machine Executor)    │
├──────────────────────────────┤
│  plugin-validator            │  ← field/cross-field validation
├──────────────────────────────┤
│  QueryService → QueryAST     │  ← Core: query building
├──────────────────────────────┤
│  Driver → Knex → SQL         │  ← Driver: SQL generation (UNTOUCHED)
└──────────────────────────────┘
```

The Workflow Plugin:

1. Registers a `beforeUpdate` hook
2. Detects state field changes in the update payload
3. Evaluates guards against the state machine configuration
4. Executes entry/exit/transition actions
5. Either allows the update to proceed or throws `ObjectQLError`

## Examples

### Approval Workflow

```yaml
name: expense_report
stateMachine:
  initial: draft
  states:
    draft:
      on:
        submit:
          target: pending
          cond:
            field: amount
            operator: greater_than
            value: 0
    
    pending:
      entry:
        - notifyApprover
      on:
        approve:
          target: approved
          cond: hasRole:approver
          actions:
            - setField:approved_by=$user.id
            - timestamp:approved_at
        reject:
          target: rejected
    
    approved:
      type: final
    
    rejected:
      on:
        resubmit:
          target: draft
```

### Project Lifecycle

```yaml
name: project
stateMachine:
  initial: planning
  states:
    planning:
      on:
        start:
          target: active
          cond:
            all_of:
              - field: team_assigned
                operator: equals
                value: true
              - field: budget_approved
                operator: equals
                value: true
    
    active:
      entry:
        - setField:started_at=$now
        - notifyTeam
      on:
        pause:
          target: on_hold
        complete:
          target: completed
    
    on_hold:
      on:
        resume:
          target: active
    
    completed:
      type: final
```

## Testing

```typescript
import { describe, it, expect } from 'vitest';
import { WorkflowPlugin } from '@objectql/plugin-workflow';

describe('Project Workflow', () => {
  it('should allow valid transitions', async () => {
    const plugin = new WorkflowPlugin({ enableAuditTrail: true });
    
    // Test setup...
    
    const result = await engine.transition('draft', 'active', context);
    expect(result.allowed).toBe(true);
  });
});
```

Run tests:

```bash
pnpm test
```

## License

MIT

## Contributing

See the main [ObjectQL Contributing Guide](../../../CONTRIBUTING.md).

## Documentation

Full documentation: [ObjectQL Workflow Engine](https://objectql.dev/docs/logic/workflow)
