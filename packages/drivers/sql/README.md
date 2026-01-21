# @objectql/driver-sql

Knex.js based SQL driver for ObjectQL. Supports PostgreSQL, MySQL, SQLite, and simpler databases.

## Installation

```bash
npm install @objectql/driver-sql
```

## Usage

### Plugin-Based Usage (Recommended)

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

### Direct Driver Usage (Legacy)

```typescript
import { ObjectQL } from '@objectql/core';
import { SqlDriver } from '@objectql/driver-sql';

const driver = new SqlDriver({
    client: 'sqlite3',
    connection: {
        filename: './data.db'
    },
    useNullAsDefault: true
});

const app = new ObjectQL({
    datasources: {
        default: driver
    }
});
```

## Plugin Protocol

The SQL driver now supports the @objectstack/spec plugin protocol. See [PLUGIN_PROTOCOL.md](../PLUGIN_PROTOCOL.md) for more details.

