/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ActionDefinition } from '@objectql/types';
import { Projects } from '../../types';

/**
 * Project Actions - Comprehensive Examples
 * 
 * This file demonstrates action patterns according to the ObjectQL specification:
 * 1. Record actions (operate on specific records)
 * 2. Global actions (operate on collections)
 * 3. Input validation
 * 4. Multi-step business logic
 * 5. Error handling
 */

/**
 * Input type for the complete action
 */
interface CompleteInput {
    comment?: string;
    completion_date?: Date;
}

/**
 * complete - Record Action Example
 * 
 * Demonstrates:
 * - Fetching and validating current state
 * - Performing atomic updates
 * - Returning structured results
 * - Input parameter usage
 */
export const complete: ActionDefinition<Projects, CompleteInput> = {
    handler: async ({ id, input, api, user }) => {
        const { comment, completion_date } = input;
        
        console.log(`[Action] Completing project ${id} by ${user?.id}`);
        
        // 1. Validate - Fetch current state
        const project = await api.findOne('projects', id!);
        
        if (!project) {
            throw new Error('Project not found');
        }
        
        if (project.status === 'completed') {
            throw new Error('Project is already completed');
        }
        
        // 2. Validate - Check if user has permission
        /*
        if (!user?.isAdmin && project.owner !== user?.id) {
            throw new Error('Only the project owner or admin can complete the project');
        }
        */
        
        // 3. Perform update with atomic operation
        const updateData: any = { 
            status: 'completed',
            end_date: completion_date || new Date()
        };
        
        // Add completion comment to description
        if (comment) {
            updateData.description = project.description 
                ? `${project.description}\n\n[Completed on ${new Date().toISOString()}]: ${comment}`
                : `[Completed on ${new Date().toISOString()}]: ${comment}`;
        }
        
        await api.update('projects', id!, updateData);
        
        // 4. Optional: Create completion record or notification
        /*
        await api.create('project_completions', {
            project_id: id,
            completed_by: user?.id,
            completed_at: new Date(),
            comment: comment
        });
        */
        
        // 5. Return structured result
        return { 
            success: true, 
            message: "Project completed successfully",
            project_id: id,
            completed_at: updateData.end_date
        };
    }
};

/**
 * Input type for the approve action
 */
interface ApproveInput {
    comment: string;
}

/**
 * approve - Record Action with State Transition
 * 
 * Demonstrates:
 * - State machine validation
 * - Required input parameters
 * - Business logic enforcement
 */
export const approve: ActionDefinition<Projects, ApproveInput> = {
    handler: async ({ id, input, api, user }) => {
        const { comment } = input;
        
        // 1. Validate input
        if (!comment || comment.trim().length === 0) {
            throw new Error('Approval comment is required');
        }
        
        // 2. Fetch and validate current state
        const project = await api.findOne('projects', id!);
        
        if (!project) {
            throw new Error('Project not found');
        }
        
        if (project.status !== 'planned') {
            throw new Error('Only projects in "planned" status can be approved');
        }
        
        // 3. Check budget threshold
        if (project.budget > 100000 && !user?.isAdmin) {
            throw new Error('Projects with budget over $100,000 require admin approval');
        }
        
        // 4. Perform approval
        await api.update('projects', id!, {
            status: 'in_progress',
            approved_by: user?.id,
            approved_at: new Date(),
            approval_comment: comment
        });
        
        // 5. Log approval
        console.log(`[Action] Project ${project.name} approved by ${user?.id}`);
        
        return {
            success: true,
            message: 'Project approved and moved to in_progress',
            new_status: 'in_progress'
        };
    }
};

/**
 * Input type for clone action
 */
interface CloneInput {
    new_name: string;
    copy_tasks?: boolean;
}

/**
 * clone - Record Action with Related Data
 * 
 * Demonstrates:
 * - Creating new records based on existing ones
 * - Copying related data
 * - Complex multi-step operations
 */
export const clone: ActionDefinition<Projects, CloneInput> = {
    handler: async ({ id, input, api, user }) => {
        const { new_name, copy_tasks = false } = input;
        
        // 1. Validate input
        if (!new_name || new_name.trim().length === 0) {
            throw new Error('New project name is required');
        }
        
        // 2. Fetch source project
        const sourceProject = await api.findOne('projects', id!);
        
        if (!sourceProject) {
            throw new Error('Source project not found');
        }
        
        // 3. Create cloned project
        const clonedData = {
            name: new_name,
            description: `Cloned from: ${sourceProject.name}\n\n${sourceProject.description || ''}`,
            status: 'planned',  // Always start as planned
            priority: sourceProject.priority,
            owner: user?.id || sourceProject.owner,  // Assign to current user
            budget: sourceProject.budget,
            start_date: sourceProject.start_date
            // Don't copy: end_date, completed status
        };
        
        const newProject = await api.create('projects', clonedData);
        
        // 4. Optional: Copy related tasks
        if (copy_tasks) {
            /*
            const tasks = await api.find('tasks', {
                filters: [['project_id', '=', id]]
            });
            
            for (const task of tasks) {
                await api.create('tasks', {
                    name: task.name,
                    description: task.description,
                    project_id: newProject._id,
                    status: 'pending',  // Reset status
                    priority: task.priority
                });
            }
            */
        }
        
        console.log(`[Action] Project cloned: ${sourceProject.name} -> ${new_name}`);
        
        return {
            success: true,
            message: 'Project cloned successfully',
            original_id: id,
            new_project_id: newProject._id,
            tasks_copied: copy_tasks
        };
    }
};

/**
 * Input type for bulk import
 */
interface ImportProjectsInput {
    source: 'csv' | 'json' | 'api';
    data?: any[];
    file_url?: string;
}

/**
 * import_projects - Global Action Example
 * 
 * Demonstrates:
 * - Batch operations
 * - Data transformation
 * - Error collection
 * - Progress reporting
 */
export const import_projects: ActionDefinition<Projects, ImportProjectsInput> = {
    handler: async ({ input, api, user }) => {
        const { source, data, file_url } = input;
        
        console.log(`[Action] Importing projects from ${source} by ${user?.id}`);
        
        // 1. Validate input
        if (!data && !file_url) {
            throw new Error('Either data array or file_url must be provided');
        }
        
        // 2. Fetch data based on source
        let projectsData: any[] = data || [];
        
        if (file_url) {
            // Example: Fetch from URL
            /*
            const response = await fetch(file_url);
            projectsData = await response.json();
            */
            throw new Error('file_url import not yet implemented');
        }
        
        // 3. Validate and import each project
        const results = {
            successCount: 0,
            failed: 0,
            errors: [] as any[]
        };
        
        for (let i = 0; i < projectsData.length; i++) {
            const projectData = projectsData[i];
            
            try {
                // Validate required fields
                if (!projectData.name) {
                    throw new Error('Project name is required');
                }
                
                // Set defaults
                const importData = {
                    name: projectData.name,
                    description: projectData.description || '',
                    status: projectData.status || 'planned',
                    priority: projectData.priority || 'normal',
                    budget: projectData.budget || 0,
                    owner: projectData.owner || user?.id,
                    start_date: projectData.start_date
                };
                
                // Create project
                await api.create('projects', importData);
                results.successCount++;
                
            } catch (error: any) {
                results.failed++;
                results.errors.push({
                    row: i + 1,
                    name: projectData.name || 'Unknown',
                    error: error.message
                });
            }
        }
        
        console.log(`[Action] Import completed: ${results.successCount} succeeded, ${results.failed} failed`);
        
        return {
            success: results.failed === 0,
            message: `Imported ${results.successCount} projects, ${results.failed} failed`,
            ...results
        };
    }
};

/**
 * Input type for bulk update
 */
interface BulkUpdateStatusInput {
    project_ids: string[];
    new_status: 'planned' | 'in_progress' | 'completed';
}

/**
 * bulk_update_status - Global Action for Batch Updates
 * 
 * Demonstrates:
 * - Operating on multiple records
 * - Validation across multiple items
 * - Transactional operations (if supported)
 */
export const bulk_update_status: ActionDefinition<Projects, BulkUpdateStatusInput> = {
    handler: async ({ input, api, user }) => {
        const { project_ids, new_status } = input;
        
        // 1. Validate input
        if (!project_ids || project_ids.length === 0) {
            throw new Error('At least one project ID must be provided');
        }
        
        if (project_ids.length > 100) {
            throw new Error('Cannot update more than 100 projects at once');
        }
        
        // 2. Update each project
        // Note: This uses an N+1 query pattern (fetching each project individually)
        // For production with large batches, consider fetching all projects at once:
        // const projects = await api.find('projects', { filters: [['_id', 'in', project_ids]] });
        // However, for this example with a 100-project limit, the current approach
        // provides clearer per-record validation and error handling.
        const results = {
            updated: 0,
            skipped: 0,
            errors: [] as any[]
        };
        
        for (const id of project_ids) {
            try {
                const project = await api.findOne('projects', id);
                
                if (!project) {
                    results.errors.push({
                        project_id: id,
                        error: 'Project not found'
                    });
                    results.skipped++;
                    continue;
                }
                
                // Validate transition (simplified)
                if (project.status === 'completed' && new_status !== 'completed') {
                    results.errors.push({
                        project_id: id,
                        name: project.name,
                        error: 'Cannot change status of completed projects'
                    });
                    results.skipped++;
                    continue;
                }
                
                // Perform update
                await api.update('projects', id, { status: new_status });
                results.updated++;
                
            } catch (error: any) {
                results.errors.push({
                    project_id: id,
                    error: error.message
                });
                results.skipped++;
            }
        }
        
        console.log(`[Action] Bulk update: ${results.updated} updated, ${results.skipped} skipped`);
        
        return {
            success: results.skipped === 0,
            message: `Updated ${results.updated} projects, skipped ${results.skipped}`,
            ...results
        };
    }
};

/**
 * generate_report - Global Action for Reporting
 * 
 * Demonstrates:
 * - Aggregation and analysis
 * - Data collection across records
 * - Computed results
 */
export const generate_report: ActionDefinition<Projects, {}> = {
    handler: async ({ api, user }) => {
        console.log(`[Action] Generating project report for ${user?.id}`);
        
        // 1. Fetch all projects (or apply filters)
        const allProjects = await api.find('projects', {});
        
        // 2. Calculate statistics
        const report = {
            total_projects: allProjects.length,
            by_status: {
                planned: 0,
                in_progress: 0,
                completed: 0
            },
            by_priority: {
                low: 0,
                normal: 0,
                high: 0
            },
            total_budget: 0,
            average_budget: 0,
            generated_at: new Date(),
            generated_by: user?.id
        };
        
        // 3. Aggregate data
        allProjects.forEach(project => {
            // Count by status
            const status = project.status || 'planned';
            if (status in report.by_status) {
                report.by_status[status as keyof typeof report.by_status]++;
            }
            
            // Count by priority
            const priority = project.priority || 'normal';
            if (priority in report.by_priority) {
                report.by_priority[priority as keyof typeof report.by_priority]++;
            }
            
            // Sum budget
            report.total_budget += project.budget || 0;
        });
        
        // 4. Calculate averages
        report.average_budget = allProjects.length > 0 
            ? report.total_budget / allProjects.length 
            : 0;
        
        console.log(`[Action] Report generated: ${report.total_projects} projects analyzed`);
        
        return {
            success: true,
            message: 'Report generated successfully',
            report
        };
    }
};
