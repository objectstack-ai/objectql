# CRM Module

## Overview
The Customer Relationship Management (CRM) module handles all customer-facing business processes including lead management, account management, contact management, and opportunity tracking.

## Objects

### crm_account
Company or organization customers. Stores company information, industry classification, and revenue data.

**Key Features:**
- Hierarchical account structure (parent-child accounts)
- Industry classification
- Revenue tracking
- AI-powered search on company name and description

### crm_contact
Individual contacts associated with accounts.

**Key Features:**
- Linked to accounts
- Lead source tracking
- Full name formula field
- AI-powered search

### crm_opportunity
Sales opportunities and deals.

**Key Features:**
- Stage-based pipeline management
- Probability and amount tracking
- Custom actions for won/lost marking
- Forecasting support via indexes

### crm_lead
Potential sales leads before conversion.

**Key Features:**
- Lead qualification workflow
- Rating system (hot/warm/cold)
- Convert action to create Account, Contact, and Opportunity
- Lead source attribution

## Relationships

```
Lead --converts to--> Account + Contact + Opportunity
Account <--has many-- Contact
Account <--has many-- Opportunity
```

## Team Ownership
**Owner:** Sales Team
**Primary Contact:** sales-team@example.com

## Dependencies
- **Core Objects:** `user` (for ownership tracking)
- **External:** None

## Custom Actions
- `Lead.convert` - Convert lead to account/contact/opportunity
- `Opportunity.mark_won` - Mark opportunity as won
- `Opportunity.mark_lost` - Mark opportunity as lost

## Indexes Strategy
- Composite indexes on `owner + status` for sales rep dashboards
- Date-based indexes for pipeline reporting
- Industry indexes for market analysis

## Usage Examples

### Find hot leads for a sales rep
```typescript
const leads = await app.find({
  object: 'crm_lead',
  filters: [
    ['owner', '=', userId],
    'and',
    ['rating', '=', 'hot'],
    'and',
    ['status', '!=', 'converted']
  ]
});
```

### Pipeline report for current quarter
```typescript
const opportunities = await app.find({
  object: 'crm_opportunity',
  filters: [
    ['close_date', '>=', quarterStart],
    'and',
    ['close_date', '<=', quarterEnd],
    'and',
    ['stage', 'not in', ['closed_won', 'closed_lost']]
  ],
  sort: [['amount', 'desc']]
});
```
