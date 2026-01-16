/**
 * Finance Module - Finance & Accounting
 * 
 * Exports all Finance objects, actions, and hooks
 */

export const FINANCE_OBJECTS = [
  'finance_invoice',
  'finance_payment',
  'finance_expense',
  'finance_budget',
] as const;

export type FinanceObject = typeof FINANCE_OBJECTS[number];

/**
 * Module metadata
 */
export const FINANCE_MODULE = {
  name: 'finance',
  label: 'Finance & Accounting',
  description: 'Manage invoices, payments, expenses, and budgets',
  version: '1.0.0',
  objects: FINANCE_OBJECTS,
  icon: 'money-dollar-circle-line',
} as const;
