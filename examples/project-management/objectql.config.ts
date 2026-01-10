import { ObjectQL } from '@objectql/core';
import * as path from 'path';

const db = new ObjectQL({
    connection: `sqlite://${path.join(__dirname, 'dev.sqlite3')}`,
    source: path.join(__dirname, 'src')
});

export default db;
