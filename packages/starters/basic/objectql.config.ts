import { ObjectQL } from '@objectql/core';
import { KnexDriver } from '@objectql/driver-sql';
import { ObjectLoader } from '@objectql/platform-node';
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
    const loader = new ObjectLoader(app.metadata);
loader.load(path.join(__dirname, 'src'));

export default app;,
    presets: []
});

export default db;
