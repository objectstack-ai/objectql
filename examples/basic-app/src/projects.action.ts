import { ActionDefinition } from '@objectql/types';
import { Project } from './types';

interface CompleteInput {
    comment?: string;
}

export const complete: ActionDefinition<Project, CompleteInput> = {
    handler: async ({ id, input, api, user }) => {
        const { comment } = input;
        console.log(`[Action] Completing project ${id} by ${user?.id}. Comment: ${comment}`);
        
        // 1. Validate
        const project = await api.findOne('projects', id!);
        if (project.status === 'completed') {
            throw new Error("Project is already completed");
        }

        // 2. Perform Update
        await api.update('projects', id!, { 
            status: 'completed',
            description: comment ? `${project.description}\n[Completed]: ${comment}` : project.description
        });
        
        return { success: true, message: "Project completed" };
    }
};
