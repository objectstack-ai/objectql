# @objectql/driver-knex

Knex.js based SQL driver for ObjectQL. Supports PostgreSQL, MySQL, SQLite, and simpler databases.

## Installation

```bash
npm install @objectql/driver-knex
```

## Usage

```typescript
import { KnexDriver } from '@objectql/driver-knex';

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
