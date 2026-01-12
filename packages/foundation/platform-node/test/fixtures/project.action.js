module.exports = {
    listenTo: 'project',
    closeProject: {
        handler: async function(ctx) {
            return { success: true };
        }
    }
};
