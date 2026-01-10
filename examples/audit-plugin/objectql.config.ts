import { ObjectQL } from '@objectql/core';
import * as path from 'path';
import { AuditLogPlugin } from './src/audit.plugin';

const db = new ObjectQL({
    connection: `sqlite://${path.join(__dirname, 'audit.sqlite3')}`,
    source: ['src'],
    plugins: [
        new AuditLogPlugin()
    ]
});

export default db;
