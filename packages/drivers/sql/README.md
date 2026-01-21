# @objectql/driver-sql

Knex.js based SQL driver for ObjectQL. Supports PostgreSQL, MySQL, SQLite, and simpler databases.

## Installation

```bash
npm install @objectql/driver-sql
```

## Usage

All drivers must be registered as plugins following the @objectstack/spec protocol:

```typescript
import { ObjectQL } from '@objectql/core';
import { createSqlDriverPlugin } from '@objectql/driver-sql';

const app = new ObjectQL({
    plugins: [
        createSqlDriverPlugin({
            name: 'default',
            config: {
                client: 'sqlite3',
                connection: {
                    filename: './data.db'
                },
                useNullAsDefault: true
            }
        })
    ]
});

await app.init();
```

## Plugin Protocol

The SQL driver follows the @objectstack/spec plugin protocol strictly. See [PLUGIN_PROTOCOL.md](../PLUGIN_PROTOCOL.md) for more details.

