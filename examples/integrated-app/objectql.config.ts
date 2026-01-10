import { ObjectQL } from '@objectql/core';
import * as path from 'path';

const db = new ObjectQL({
    connection: `sqlite://${path.join(__dirname, 'preset.sqlite3')}`,
    // Load the project-management capabilities as a preset
    presets: ['@example/basic-app'],
    plugins: ['@example/audit-plugin']
});

export default db;
