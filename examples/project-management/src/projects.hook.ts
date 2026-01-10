import { ObjectHookDefinition } from '@objectql/types';
import { Project } from './types';

const hooks: ObjectHookDefinition<Project> = {
    
    // Auto-assign owner on create
    beforeCreate: async ({ data, user }) => {
        if (data && !data.owner && user?.id) {
            console.log(`[Hook] Projects: Auto-assigning owner ${user.id}`);
            data.owner = String(user.id);
        }
    },

    // Restrict access using query filters
    beforeFind: async ({ query, user, api }) => {
        // Example: If not admin, restrict to own projects
        /*
        if (user && !user.isAdmin) {
             query.filters.push(['owner', '=', user.id]);
        }
        */
        console.log(`[Hook] Projects: beforeFind query on ${api}`);
    },

    // Example: Check budget constraints on update
    beforeUpdate: async ({ data, previousData, isModified }) => {
        if (isModified('budget')) {
            if (data && data.budget != undefined && data.budget < (previousData?.budget || 0)) {
                console.warn("Warning: Budget is being reduced!");
            }
        }
    }
};

export default hooks;

