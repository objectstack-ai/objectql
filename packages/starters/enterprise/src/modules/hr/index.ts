/**
 * HR Module - Human Resources Management
 * 
 * Exports all HR objects, actions, and hooks
 */

export const HR_OBJECTS = [
  'hr_employee',
  'hr_department',
  'hr_position',
  'hr_timesheet',
] as const;

export type HRObject = typeof HR_OBJECTS[number];

/**
 * Module metadata
 */
export const HR_MODULE = {
  name: 'hr',
  label: 'Human Resources',
  description: 'Manage employees, departments, and time tracking',
  version: '1.0.0',
  objects: HR_OBJECTS,
  icon: 'team-line',
} as const;
