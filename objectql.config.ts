export default {
    datasource: {
        default: {
            type: 'sqlite',
            filename: 'objectos.db'
        }
    },
    presets: [
        '@objectql/starter-basic',
        '@objectql/starter-enterprise'
    ]
};
