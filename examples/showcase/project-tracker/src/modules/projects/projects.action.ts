/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ActionDefinition } from '@objectql/types';

/**
 * Project Actions - Custom Business Operations
 * 
 * This file implements custom RPC actions for the Project object.
 * Actions are explicitly invoked by users or systems (not triggered by CRUD).
 */

// ===== RECORD ACTIONS =====
// These actions operate on a specific project record (require ID)

/**
 * Complete Action
 * 
 * Marks a project as completed.
 * Type: Record Action (operates on a single project)
 */
interface CompleteInput {
    comment?: string;
}

export const complete: ActionDefinition<any, CompleteInput> = {
    handler: async ({ id, input, api, user, objectName }) => {
        // Validate id is provided
        if (!id) {
            throw new Error('Project ID is required');
        }

        // Fetch current project state
        const project = await api.findOne(objectName, id);
        if (!project) {
            throw new Error('Project not found');
        }

        // Validate project is not already completed
        if (project.status === 'completed') {
            throw new Error('Project is already completed');
        }

        // Update project status to completed
        await api.update(objectName, id, {
            status: 'completed',
            completed_by: user?.id || 'system',
            completed_at: new Date(),
            completion_comment: input.comment
        });

        return {
            success: true,
            message: `Project "${project.name}" completed successfully`
        };
    }
};

/**
 * Approve Action
 * 
 * Approves a planned project and moves it to in_progress status.
 * Type: Record Action (operates on a single project)
 */
interface ApproveInput {
    comment: string;
}

export const approve: ActionDefinition<any, ApproveInput> = {
    handler: async ({ id, input, api, user, objectName }) => {
        // Validate id is provided
        if (!id) {
            throw new Error('Project ID is required');
        }

        // Validate approval comment is required
        if (!input.comment || input.comment.trim() === '') {
            throw new Error('Approval comment is required');
        }

        // Fetch current project state
        const project = await api.findOne(objectName, id);
        if (!project) {
            throw new Error('Project not found');
        }

        // Update project to in_progress status
        await api.update(objectName, id, {
            status: 'in_progress',
            approved_by: user?.id || 'system',
            approved_at: new Date(),
            approval_comment: input.comment
        });

        return {
            success: true,
            message: `Project "${project.name}" approved`,
            new_status: 'in_progress'
        };
    }
};

/**
 * Clone Action
 * 
 * Creates a copy of an existing project.
 * Type: Record Action (operates on a single project)
 */
interface CloneInput {
    new_name: string;
    copy_tasks?: boolean;
}

export const clone: ActionDefinition<any, CloneInput> = {
    handler: async ({ id, input, api, user, objectName }) => {
        // Validate id is provided
        if (!id) {
            throw new Error('Project ID is required');
        }

        // Fetch source project
        const sourceProject = await api.findOne(objectName, id);
        if (!sourceProject) {
            throw new Error('Source project not found');
        }

        // Create new project with cloned data
        const newProject = await api.create(objectName, {
            name: input.new_name,
            description: sourceProject.description,
            priority: sourceProject.priority,
            budget: sourceProject.budget,
            status: 'planned', // Always start cloned projects as planned
            owner: user?.id || 'system',    // Assign to current user
            cloned_from: id,
            cloned_at: new Date()
        });

        // TODO: Copy tasks if requested (when tasks functionality is implemented)
        if (input.copy_tasks) {
            // This would copy related tasks
        }

        return {
            success: true,
            message: `Project cloned successfully`,
            new_project_id: newProject._id
        };
    }
};

// ===== GLOBAL ACTIONS =====
// These actions operate on the collection (no specific ID required)

/**
 * Import Projects Action
 * 
 * Bulk imports projects from external data sources.
 * Type: Global Action (operates on the collection)
 */
interface ImportProjectsInput {
    source: string;
    data: Array<{
        name?: string;
        description?: string;
        status?: string;
        priority?: string;
        budget?: number;
    }>;
}

export const import_projects: ActionDefinition<any, ImportProjectsInput> = {
    handler: async ({ input, api, user, objectName }) => {
        const errors: Array<{ index: number; error: string }> = [];
        let successCount = 0;

        // Process each project in the data array
        for (let i = 0; i < input.data.length; i++) {
            const projectData = input.data[i];

            try {
                // Validate required fields
                if (!projectData.name || projectData.name.trim() === '') {
                    throw new Error('Project name is required');
                }

                // Create the project
                await api.create(objectName, {
                    ...projectData,
                    imported_from: input.source,
                    imported_by: user?.id || 'system',
                    imported_at: new Date()
                });

                successCount++;
            } catch (error: any) {
                errors.push({
                    index: i,
                    error: error.message || 'Unknown error'
                });
            }
        }

        return {
            success: true,
            message: `Imported ${successCount} projects`,
            successCount,
            failed: errors.length,
            errors
        };
    }
};

/**
 * Bulk Update Status Action
 * 
 * Updates the status of multiple projects at once.
 * Type: Global Action (operates on multiple records)
 */
interface BulkUpdateStatusInput {
    project_ids: string[];
    new_status: string;
}

export const bulk_update_status: ActionDefinition<any, BulkUpdateStatusInput> = {
    handler: async ({ input, api, objectName }) => {
        let updated = 0;
        let skipped = 0;

        // Process each project
        for (const projectId of input.project_ids) {
            try {
                const project = await api.findOne(objectName, projectId);
                
                if (!project) {
                    skipped++;
                    continue;
                }

                // Skip completed projects (they cannot be changed)
                if (project.status === 'completed') {
                    skipped++;
                    continue;
                }

                // Update the status
                await api.update(objectName, projectId, {
                    status: input.new_status
                });

                updated++;
            } catch (error) {
                skipped++;
            }
        }

        return {
            success: true,
            message: `Updated ${updated} projects`,
            updated,
            skipped
        };
    }
};

/**
 * Generate Report Action
 * 
 * Generates statistical reports about projects.
 * Type: Global Action (analytics on the collection)
 */
interface GenerateReportInput {
    // Optional filters could be added here
}

export const generate_report: ActionDefinition<any, GenerateReportInput> = {
    handler: async ({ api, objectName }) => {
        // Fetch all projects
        const projects = await api.find(objectName, {});

        // Calculate statistics
        const report = {
            total_projects: projects.length,
            by_status: {
                planned: 0,
                in_progress: 0,
                completed: 0
            } as Record<string, number>,
            by_priority: {} as Record<string, number>,
            total_budget: 0,
            average_budget: 0
        };

        // Aggregate data
        projects.forEach((project: any) => {
            // Count by status
            if (project.status) {
                report.by_status[project.status] = (report.by_status[project.status] || 0) + 1;
            }

            // Count by priority
            if (project.priority) {
                report.by_priority[project.priority] = (report.by_priority[project.priority] || 0) + 1;
            }

            // Sum budgets
            if (project.budget) {
                report.total_budget += project.budget;
            }
        });

        // Calculate average budget
        if (projects.length > 0) {
            report.average_budget = report.total_budget / projects.length;
        }

        return {
            success: true,
            message: 'Report generated successfully',
            report,
            generated_at: new Date()
        };
    }
};
