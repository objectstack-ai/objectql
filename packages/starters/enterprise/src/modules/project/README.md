# Project Management Module

## Overview
The Project Management module handles project planning, task tracking, milestones, and time tracking against projects.

## Objects

### project_project
Main project or initiative records.

**Key Features:**
- Status tracking (planning → active → completed)
- Priority classification
- Budget and hour estimation
- Customer project linkage
- Completion percentage tracking

### project_task
Individual tasks and work items within projects.

**Key Features:**
- Hierarchical task structure (parent-child)
- Status workflow (todo → in progress → review → completed)
- Assignment and due date tracking
- Hour estimation and actuals
- Milestone linkage

### project_milestone
Project milestones and checkpoints.

**Key Features:**
- Deliverables definition
- Success criteria
- Target vs. actual completion dates
- Status tracking

### project_timesheet_entry
Time entries logged against projects and tasks.

**Key Features:**
- Billable/non-billable classification
- Approval workflow
- Project and task association
- Work description

## Relationships

```
Project <--has many-- Task
Project <--has many-- Milestone
Project <--has many-- TimesheetEntry
Task <--has many-- TimesheetEntry
Task <--belongs to-- Milestone
Task <--parent of--> Task (self-referencing)
Account <--has many-- Project
```

## Team Ownership
**Owner:** PMO (Project Management Office)
**Primary Contact:** pmo@example.com

## Dependencies
- **Core Objects:** `user` (for project ownership and task assignment)
- **Cross-Module:** `crm_account` (customer projects), `hr_employee` (timesheet entries), `hr_department` (project departments)

## Custom Actions
- `Project.complete` - Mark project as completed
- `Task.start` - Start working on task
- `Task.complete` - Complete task with actual hours
- `Milestone.mark_completed` - Mark milestone as completed
- `TimesheetEntry.submit` - Submit time entry for approval
- `TimesheetEntry.approve` - Approve time entry

## Indexes Strategy
- Project-based indexes for task and timesheet queries
- Status + priority for project portfolio views
- Date-based indexes for timeline and deadline tracking
- Assignee indexes for personal task lists
- Billable indexes for invoicing workflows

## Usage Examples

### Get active projects by priority
```typescript
const projects = await app.find({
  object: 'project_project',
  filters: [
    ['status', 'in', ['planning', 'active']],
    'and',
    ['priority', 'in', ['high', 'critical']]
  ],
  sort: [['priority', 'desc'], ['start_date', 'asc']]
});
```

### My open tasks
```typescript
const myTasks = await app.find({
  object: 'project_task',
  filters: [
    ['assigned_to', '=', userId],
    'and',
    ['status', 'not in', ['completed']]
  ],
  sort: [['due_date', 'asc']]
});
```

### Project time summary
```typescript
const timeEntries = await app.find({
  object: 'project_timesheet_entry',
  filters: [
    ['project', '=', projectId],
    'and',
    ['status', '=', 'approved']
  ]
});
```

### Upcoming milestones
```typescript
const milestones = await app.find({
  object: 'project_milestone',
  filters: [
    ['status', 'in', ['pending', 'in_progress']],
    'and',
    ['due_date', '<=', nextMonth]
  ],
  sort: [['due_date', 'asc']]
});
```
