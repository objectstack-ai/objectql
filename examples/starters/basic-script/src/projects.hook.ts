import { ObjectHookDefinition } from '@objectql/types';
import { Project } from './types';

/**
 * Project Hooks - Comprehensive Example
 * 
 * This file demonstrates all major hook patterns according to the ObjectQL specification:
 * 1. Data validation and defaulting (beforeCreate)
 * 2. Query modification for security (beforeFind)
 * 3. State transition validation (beforeUpdate)
 * 4. Change tracking and notifications (afterUpdate)
 * 5. Dependency checking (beforeDelete)
 * 6. Side effects and cleanup (afterDelete)
 */
const hooks: ObjectHookDefinition<Project> = {
    
    /**
     * beforeCreate - Data Validation & Defaulting
     * 
     * Use case:
     * - Set default values
     * - Auto-assign ownership
     * - Validate business rules
     * - Check for duplicates
     */
    beforeCreate: async ({ data, user, api }) => {
        // 1. Auto-assign owner if not specified
        if (data && !data.owner && user?.id) {
            console.log(`[Hook] Projects: Auto-assigning owner ${user.id}`);
            data.owner = String(user.id);
        }

        // 2. Set default status if not provided
        if (data && !data.status) {
            data.status = 'planned';
        }

        // 3. Validate required fields
        if (data && (!data.name || data.name.trim().length === 0)) {
            throw new Error('Project name is required');
        }

        // 4. Validate name length
        if (data && data.name && data.name.length > 100) {
            throw new Error('Project name must be 100 characters or less');
        }

        // 5. Check for duplicate names (using API)
        if (data && data.name) {
            const existing = await api.count('projects', { 
                filters: [['name', '=', data.name]] 
            });
            if (existing > 0) {
                throw new Error(`A project named "${data.name}" already exists`);
            }
        }

        // 6. Set initial budget if not provided
        if (data && !data.budget) {
            data.budget = 0;
        }
    },

    /**
     * afterCreate - Side Effects
     * 
     * Use case:
     * - Send notifications
     * - Create related records
     * - Log audit trail
     * - Trigger workflows
     */
    afterCreate: async ({ result, user, api, state }) => {
        console.log(`[Hook] Projects: Project created - ${result?.name} by ${user?.id}`);
        
        // Example: Create a default task for new projects
        // Uncomment if tasks object exists
        /*
        if (result) {
            await api.create('tasks', {
                name: 'Setup Project',
                project_id: result._id,
                status: 'pending',
                description: 'Initial project setup task'
            });
        }
        */
    },

    /**
     * beforeFind - Query Filtering for Security
     * 
     * Use case:
     * - Enforce multi-tenancy
     * - Apply row-level security
     * - Add default filters
     * - Restrict data access based on user role
     */
    beforeFind: async ({ query, user, api }) => {
        // Example: If not admin, restrict to own projects
        // Uncomment to enable row-level security
        /*
        if (user && !user.isAdmin) {
            // Add filter to only show projects owned by current user
            if (!query.filters) {
                query.filters = [];
            }
            query.filters.push(['owner', '=', user.id]);
            console.log(`[Hook] Projects: Filtering to user ${user.id}'s projects`);
        }
        */
        
        // Example: Add default sort
        if (!query.sort) {
            query.sort = [{ field: 'created_at', direction: 'desc' }];
        }
    },

    /**
     * afterFind - Result Transformation
     * 
     * Use case:
     * - Add computed fields
     * - Mask sensitive data
     * - Enrich data from external sources
     * - Transform dates/formats
     */
    afterFind: async ({ result, user }) => {
        // Example: Add computed progress field based on status
        if (Array.isArray(result)) {
            result.forEach((project: any) => {
                switch (project.status) {
                    case 'planned':
                        project.progress = 0;
                        break;
                    case 'in_progress':
                        project.progress = 50;
                        break;
                    case 'completed':
                        project.progress = 100;
                        break;
                    default:
                        project.progress = 0;
                }
            });
        }
    },

    /**
     * beforeUpdate - State Transition Validation
     * 
     * Use case:
     * - Validate state machine transitions
     * - Check permissions for specific updates
     * - Validate budget changes
     * - Track modifications
     */
    beforeUpdate: async ({ data, previousData, isModified, user, state }) => {
        // 1. Check budget constraints
        if (isModified('budget')) {
            if (data && data.budget != undefined && data.budget < 0) {
                throw new Error('Budget cannot be negative');
            }
            
            if (data && data.budget != undefined && previousData && data.budget < (previousData.budget || 0)) {
                console.warn(`[Hook] Projects: Budget reduced from ${previousData.budget} to ${data.budget}`);
                
                // Optional: Require approval for budget reduction
                /*
                if ((previousData.budget || 0) - data.budget > 10000) {
                    throw new Error('Budget reductions over $10,000 require approval');
                }
                */
            }
        }

        // 2. Validate status transitions
        if (isModified('status') && previousData) {
            const oldStatus = previousData.status;
            const newStatus = data?.status;

            // Define valid transitions
            const validTransitions: Record<string, string[]> = {
                'planned': ['in_progress'],
                'in_progress': ['completed', 'planned'],  // Can go back to planning
                'completed': []  // Cannot change from completed
            };

            if (oldStatus && newStatus) {
                const allowed = validTransitions[oldStatus] || [];
                if (!allowed.includes(newStatus)) {
                    throw new Error(
                        `Invalid status transition: cannot change from "${oldStatus}" to "${newStatus}"`
                    );
                }
            }
        }

        // 3. Require end_date when marking as completed
        if (isModified('status') && data?.status === 'completed') {
            if (!data.end_date && !previousData?.end_date) {
                throw new Error('End date is required when completing a project');
            }
        }

        // 4. Store change summary in state for afterUpdate hook
        if (isModified('status')) {
            state.statusChanged = true;
            state.oldStatus = previousData?.status;
            state.newStatus = data?.status;
        }
    },

    /**
     * afterUpdate - Change Notifications & Side Effects
     * 
     * Use case:
     * - Send notifications based on changes
     * - Update related records
     * - Trigger workflows
     * - Log audit trail
     */
    afterUpdate: async ({ isModified, data, previousData, result, state, api, user }) => {
        // 1. Notify on status change
        if (state.statusChanged) {
            console.log(
                `[Hook] Projects: Status changed from "${state.oldStatus}" to "${state.newStatus}" by ${user?.id}`
            );
            
            // Example: Create notification record
            /*
            if (data.status === 'completed' && previousData?.owner) {
                await api.create('notifications', {
                    user_id: previousData.owner,
                    message: `Project "${result?.name}" has been completed!`,
                    type: 'project_completed',
                    link: `/projects/${result?._id}`
                });
            }
            */
        }

        // 2. Notify on budget changes over threshold
        if (isModified('budget') && previousData) {
            const oldBudget = previousData.budget || 0;
            const newBudget = data?.budget || 0;
            const change = Math.abs(newBudget - oldBudget);
            
            if (change > 5000) {
                console.log(
                    `[Hook] Projects: Significant budget change detected: ${oldBudget} -> ${newBudget}`
                );
            }
        }

        // 3. Update related tasks when project is completed
        /*
        if (data.status === 'completed') {
            await api.updateMany('tasks', 
                { filters: [['project_id', '=', result._id]] },
                { status: 'completed' }
            );
        }
        */
    },

    /**
     * beforeDelete - Dependency Checking
     * 
     * Use case:
     * - Prevent deletion if dependencies exist
     * - Check permissions
     * - Validate business rules
     */
    beforeDelete: async ({ id, previousData, api, user }) => {
        // 1. Prevent deletion of completed projects
        if (previousData?.status === 'completed') {
            throw new Error('Cannot delete completed projects. Please archive instead.');
        }

        // 2. Check for dependent tasks
        /*
        const taskCount = await api.count('tasks', {
            filters: [['project_id', '=', id]]
        });
        
        if (taskCount > 0) {
            throw new Error(
                `Cannot delete project: ${taskCount} tasks are still associated with it. ` +
                'Please delete or reassign tasks first.'
            );
        }
        */

        // 3. Require admin permission for deletion
        /*
        if (!user?.isAdmin) {
            throw new Error('Only administrators can delete projects');
        }
        */

        console.log(`[Hook] Projects: Preparing to delete project ${id}`);
    },

    /**
     * afterDelete - Cleanup & Side Effects
     * 
     * Use case:
     * - Delete related records (cascade)
     * - Clean up external resources
     * - Send notifications
     * - Log audit trail
     */
    afterDelete: async ({ id, previousData, api, user }) => {
        console.log(`[Hook] Projects: Project deleted - ${previousData?.name} by ${user?.id}`);
        
        // Example: Clean up related data
        /*
        // Delete associated tasks
        await api.deleteMany('tasks', {
            filters: [['project_id', '=', id]]
        });
        
        // Delete associated files from S3
        if (previousData?.attachments) {
            for (const attachment of previousData.attachments) {
                await deleteFromS3(attachment.key);
            }
        }
        
        // Create audit log
        await api.create('audit_logs', {
            action: 'project_deleted',
            entity_id: id,
            entity_name: previousData?.name,
            user_id: user?.id,
            timestamp: new Date()
        });
        */
    }
};

export default hooks;