/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Project Module - Project Management
 * 
 * Exports all Project objects, actions, and hooks
 */

export const PROJECT_OBJECTS = [
  'project_project',
  'project_task',
  'project_milestone',
  'project_timesheet_entry',
] as const;

export type ProjectObject = typeof PROJECT_OBJECTS[number];

/**
 * Module metadata
 */
export const PROJECT_MODULE = {
  name: 'project',
  label: 'Project Management',
  description: 'Manage projects, tasks, milestones, and time tracking',
  version: '1.0.0',
  objects: PROJECT_OBJECTS,
  icon: 'folder-line',
} as const;
