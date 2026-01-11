import { ObjectQL } from '@objectql/core';
import { KnexDriver } from '@objectql/driver-knex';
import * as path from 'path';

const db = new ObjectQL({
    datasources: {
        default: new KnexDriver({
            client: 'sqlite3',
            connection: {
                filename: path.join(__dirname, 'dev.sqlite3')
            },
            useNullAsDefault: true
        })
    },
    source: [path.join(__dirname, 'src')],
    presets: []
});

export default db;
