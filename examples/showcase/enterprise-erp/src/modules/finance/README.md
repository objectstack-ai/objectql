# Finance Module

## Overview
The Finance & Accounting module handles invoicing, payments, expenses, and budget management.

## Objects

### finance_invoice
Customer invoices and billing.

**Key Features:**
- Multiple payment statuses (draft, sent, paid, overdue)
- Multi-currency support
- Payment terms configuration
- Automatic balance calculation

### finance_payment
Payment transaction records linked to invoices.

**Key Features:**
- Multiple payment methods
- Transaction reference tracking
- Status workflow (pending, completed, failed, refunded)

### finance_expense
Employee expense reports and reimbursements.

**Key Features:**
- Category-based classification
- Receipt attachment support
- Approval workflow
- Department and project allocation

### finance_budget
Department and project budgets.

**Key Features:**
- Fiscal year planning
- Period-based budgets (annual/quarterly/monthly)
- Spent vs. allocated tracking
- Category breakdowns

## Relationships

```
Invoice <--has many-- Payment
Account <--has many-- Invoice
Account <--has many-- Payment
Employee --submits--> Expense
Department <--has-- Budget
Project <--has-- Budget
```

## Team Ownership
**Owner:** Finance Team
**Primary Contact:** finance-team@example.com

## Dependencies
- **Core Objects:** `user` (for approvals)
- **Cross-Module:** `crm_account` (invoices), `hr_employee` (expenses), `hr_department` (budgets), `project_project` (budgets)

## Custom Actions
- `Invoice.send` - Send invoice to customer
- `Invoice.mark_paid` - Mark invoice as paid
- `Expense.submit` - Submit for approval
- `Expense.approve` - Approve expense
- `Expense.reject` - Reject expense
- `Expense.reimburse` - Mark as reimbursed

## Indexes Strategy
- Account-based indexes for customer financial history
- Date-based indexes for aging reports and period analysis
- Status indexes for workflow management
- Category indexes for expense analysis

## Usage Examples

### Find overdue invoices
```typescript
const overdueInvoices = await app.find({
  object: 'finance_invoice',
  filters: [
    ['due_date', '<', new Date()],
    'and',
    ['status', 'not in', ['paid', 'cancelled']]
  ],
  sort: [['due_date', 'asc']]
});
```

### Get pending expense approvals
```typescript
const pendingExpenses = await app.find({
  object: 'finance_expense',
  filters: [
    ['status', '=', 'submitted']
  ],
  sort: [['expense_date', 'desc']]
});
```

### Budget utilization report
```typescript
const budgets = await app.find({
  object: 'finance_budget',
  filters: [
    ['fiscal_year', '=', currentYear],
    'and',
    ['status', '=', 'active']
  ]
});
```
