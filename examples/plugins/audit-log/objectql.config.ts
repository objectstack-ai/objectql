import { ObjectQL } from '@objectql/core';
import { KnexDriver } from '@objectql/driver-sql';
import { ObjectLoader, createDriverFromConnection } from '@objectql/platform-node';
import { AuditLogPlugin } from './src';
import * as path from 'path';

const db = new ObjectQL({
    datasources: {
        default: createDriverFromConnection(`sqlite://${path.join(__dirname, 'audit.sqlite3')}`)
    },
    plugins: [
        new AuditLogPlugin()
    ]
});

// Load Schema for testing only
const loader = new ObjectLoader(db.metadata);
loader.load(path.join(__dirname, 'src'));

export default db;
