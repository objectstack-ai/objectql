# @objectql/driver-sql

Knex.js based SQL driver for ObjectQL. Supports PostgreSQL, MySQL, SQLite, and simpler databases.

## Installation

```bash
npm install @objectql/driver-sql
```

## Usage

```typescript
import { KnexDriver } from '@objectql/driver-sql';

const driver = new KnexDriver({
    client: 'sqlite3',
    connection: {
        filename: './data.db'
    },
    useNullAsDefault: true
});

const objectql = new ObjectQL({
    datasources: {
        default: driver
    }
});
```
