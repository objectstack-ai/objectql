export default {
    datasource: {
        default: {
            type: 'sqlite',
            filename: 'objectos.db'
        }
    },
    modules: [
        '@objectql/starter-basic',
        '@objectql/starter-enterprise'
    ]
};
