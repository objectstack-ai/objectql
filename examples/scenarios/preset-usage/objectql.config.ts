import { ObjectQL } from '@objectql/core';
import { KnexDriver } from '@objectql/driver-sql';
import { ObjectLoader, createDriverFromConnection } from '@objectql/platform-node';
import * as path from 'path';

const db = new ObjectQL({
    datasources: { 
        default: createDriverFromConnection(`sqlite://${path.join(__dirname, 'preset.sqlite3')}`) 
    },
    // Load the project-management capabilities as a preset
    presets: ['@objectql/starter-basic-script'],
    plugins: ['@example/audit-log']
});

export default db;
