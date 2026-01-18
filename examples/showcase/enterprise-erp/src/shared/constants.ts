/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Shared constants used across the application
 */

export const OBJECT_PREFIXES = {
  CRM: 'crm_',
  HR: 'hr_',
  FINANCE: 'finance_',
  PROJECT: 'project_',
} as const;

export const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export const CURRENCIES = {
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  CNY: 'CNY',
  JPY: 'JPY',
} as const;

export const DEFAULT_PAGE_SIZE = 30;
export const MAX_PAGE_SIZE = 100;
