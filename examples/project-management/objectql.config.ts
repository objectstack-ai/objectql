import { ObjectQL, MetadataLoader } from '@objectql/core';
import { KnexDriver } from '@objectql/driver-knex';
import * as path from 'path';

const app = new ObjectQL({
    datasources: {
        default: new KnexDriver({
            client: 'sqlite3',
            connection: {
                filename: path.join(__dirname, 'dev.sqlite3')
            },
            useNullAsDefault: true
        })
    }
});

// Load objects from src
const loader = new MetadataLoader(app.metadata);
loader.load(path.join(__dirname, 'src')); 

export default app;
