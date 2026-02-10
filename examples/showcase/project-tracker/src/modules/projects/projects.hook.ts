/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ObjectHookDefinition } from '@objectql/types';
import { Projects } from '../../types/projects';

/**
 * Project Hooks - Business Logic Implementation
 * 
 * This file implements all lifecycle hooks for the Project object.
 * Hooks are automatically triggered during CRUD operations.
 */
const hooks: ObjectHookDefinition<Projects> = {
    /**
     * beforeCreate Hook
     * 
     * Executed before creating a new project.
     * Used for: validation, default values, and data enrichment.
     */
    beforeCreate: async (ctx) => {
        const { data, user } = ctx;

        // Ensure data exists
        if (!data) {
            throw new Error('Data is required');
        }

        // Validate project name is required
        if (!data.name || data.name.trim() === '') {
            throw new Error('Project name is required');
        }

        // Validate project name length
        if (data.name.length > 100) {
            throw new Error('Project name must be 100 characters or less');
        }

        // Auto-assign owner from user context
        // Note: Framework automatically sets created_by, but we also need owner field
        if (user?.id) {
            data.owner = String(user.id);
        }

        // Set default status to planned if not provided
        if (!data.status) {
            data.status = 'planned';
        }

        // Set default budget to 0 if not provided
        if (data.budget === undefined || data.budget === null) {
            data.budget = 0;
        }
    },

    /**
     * afterCreate Hook
     * 
     * Executed after a project is successfully created.
     * Used for: notifications, logging, downstream sync.
     */
    afterCreate: async (ctx) => {
        // Hook is available for future use (notifications, etc.)
        // Currently no implementation needed for the tests
    },

    /**
     * beforeFind Hook
     * 
     * Executed before querying projects.
     * Used for: row-level security, forced filters.
     */
    beforeFind: async (ctx) => {
        // Hook is available for future use (RLS, filtering, etc.)
        // Currently no implementation needed for the tests
    },

    /**
     * afterFind Hook
     * 
     * Executed after fetching project records.
     * Used for: computed fields, data enrichment, decryption.
     */
    afterFind: async (ctx) => {
        const { result } = ctx;

        // Add computed progress field based on status
        if (result && Array.isArray(result)) {
            result.forEach((project: any) => {
                if (project.status === 'planned') {
                    project.progress = 0;
                } else if (project.status === 'in_progress') {
                    project.progress = 50;
                } else if (project.status === 'completed') {
                    project.progress = 100;
                } else {
                    project.progress = 0;
                }
            });
        }
    },

    /**
     * beforeUpdate Hook
     * 
     * Executed before updating a project.
     * Used for: validation, business rules, state transitions.
     */
    beforeUpdate: async (ctx) => {
        const { data, previousData } = ctx;

        // Ensure data exists
        if (!data) {
            return;
        }

        // Validate budget is not negative
        if (data.budget !== undefined && data.budget < 0) {
            throw new Error('Budget cannot be negative');
        }

        // Validate status transitions
        if (data.status && previousData?.status) {
            const currentStatus = previousData.status;
            const newStatus = data.status;

            // Cannot transition from completed back to other states
            if (currentStatus === 'completed' && newStatus !== 'completed') {
                throw new Error('Invalid status transition');
            }
        }

        // Require end_date when marking as completed
        if (data.status === 'completed') {
            if (!data.end_date && !previousData?.end_date) {
                throw new Error('End date is required when completing a project');
            }
        }
    },

    /**
     * afterUpdate Hook
     * 
     * Executed after a project is successfully updated.
     * Used for: audit logging, notifications, history tracking.
     */
    afterUpdate: async (ctx) => {
        // Hook is available for future use (audit log, notifications, etc.)
        // Currently no implementation needed for the tests
    },

    /**
     * beforeDelete Hook
     * 
     * Executed before deleting a project.
     * Used for: referential integrity checks, soft delete logic.
     */
    beforeDelete: async (ctx) => {
        const { previousData } = ctx;

        // Prevent deletion of completed projects
        if (previousData?.status === 'completed') {
            throw new Error('Cannot delete completed projects');
        }
    },

    /**
     * afterDelete Hook
     * 
     * Executed after a project is successfully deleted.
     * Used for: cleanup, cascading deletes, notifications.
     */
    afterDelete: async (ctx) => {
        // Hook is available for future use (cleanup, notifications, etc.)
        // Currently no implementation needed for the tests
    }
};

export default hooks;
