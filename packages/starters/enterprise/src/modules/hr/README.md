# HR Module

## Overview
The Human Resources (HR) module manages employee information, organizational structure, positions, and time tracking.

## Objects

### hr_employee
Core employee records with personal and employment information.

**Key Features:**
- Links to system user accounts
- Manager hierarchy
- Employment type classification
- Emergency contact information

### hr_department
Organizational departments and teams.

**Key Features:**
- Hierarchical structure (parent-child)
- Cost center tracking
- Department manager assignment

### hr_position
Job positions and roles within the organization.

**Key Features:**
- Position levels (entry to executive)
- Salary ranges
- Job descriptions and requirements
- Reports-to hierarchy

### hr_timesheet
Daily employee time tracking.

**Key Features:**
- Clock in/out tracking
- Overtime calculation
- Work type classification (office/remote/field)
- Approval workflow

## Relationships

```
Department <--has many-- Employee
Position <--has many-- Employee
Employee <--has many-- Timesheet
Employee <--manages--> Employee (self-referencing)
```

## Team Ownership
**Owner:** HR Team
**Primary Contact:** hr-team@example.com

## Dependencies
- **Core Objects:** `user` (for system access)
- **Cross-Module:** Used by `finance_expense`, `project_timesheet_entry`

## Custom Actions
- `Timesheet.submit` - Submit timesheet for approval
- `Timesheet.approve` - Approve timesheet
- `Timesheet.reject` - Reject timesheet with reason

## Indexes Strategy
- Composite indexes on `department + status` for roster views
- Manager indexes for org chart queries
- Date-based indexes for attendance reports

## Usage Examples

### Get active employees in a department
```typescript
const employees = await app.find({
  object: 'hr_employee',
  filters: [
    ['department', '=', deptId],
    'and',
    ['status', '=', 'active']
  ],
  sort: [['last_name', 'asc']]
});
```

### Find pending timesheets for approval
```typescript
const timesheets = await app.find({
  object: 'hr_timesheet',
  filters: [
    ['status', '=', 'submitted'],
    'and',
    ['work_date', '>=', periodStart]
  ]
});
```
