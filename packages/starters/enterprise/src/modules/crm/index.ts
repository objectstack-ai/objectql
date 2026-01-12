/**
 * CRM Module - Customer Relationship Management
 * 
 * Exports all CRM objects, actions, and hooks
 */

// Re-export all CRM objects
// In a real implementation, these would be loaded from .object.yml files

export const CRM_OBJECTS = [
  'crm_account',
  'crm_contact',
  'crm_opportunity',
  'crm_lead',
] as const;

export type CRMObject = typeof CRM_OBJECTS[number];

/**
 * Module metadata
 */
export const CRM_MODULE = {
  name: 'crm',
  label: 'Customer Relationship Management',
  description: 'Manage customers, contacts, and sales opportunities',
  version: '1.0.0',
  objects: CRM_OBJECTS,
  icon: 'briefcase-line',
} as const;
