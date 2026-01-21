# Driver Plugin Protocol

## Overview

According to @objectstack/spec, all drivers in ObjectQL have been enhanced to support the plugin protocol. This allows drivers to be registered as plugins, providing a more flexible and consistent way to configure datasources.

## Plugin Protocol

Each driver now exports a plugin factory function following the pattern:

```typescript
export function create{DriverName}Plugin(options: {
  name: string;
  config: DriverConfig;
}): ObjectQLPlugin;
```

## Available Driver Plugins

### 1. SQL Driver Plugin

```typescript
import { ObjectQL } from '@objectql/core';
import { createSqlDriverPlugin } from '@objectql/driver-sql';

const app = new ObjectQL({
  plugins: [
    createSqlDriverPlugin({
      name: 'default',
      config: {
        client: 'sqlite3',
        connection: { filename: ':memory:' },
        useNullAsDefault: true
      }
    })
  ]
});
```

### 2. MongoDB Driver Plugin

```typescript
import { createMongoDriverPlugin } from '@objectql/driver-mongo';

const app = new ObjectQL({
  plugins: [
    createMongoDriverPlugin({
      name: 'default',
      config: {
        url: 'mongodb://localhost:27017',
        dbName: 'mydb'
      }
    })
  ]
});
```

### 3. Memory Driver Plugin

```typescript
import { createMemoryDriverPlugin } from '@objectql/driver-memory';

const app = new ObjectQL({
  plugins: [
    createMemoryDriverPlugin({
      name: 'default',
      config: {
        strictMode: true,
        initialData: {
          users: [{ id: '1', name: 'Alice' }]
        }
      }
    })
  ]
});
```

### 4. Redis Driver Plugin

```typescript
import { createRedisDriverPlugin } from '@objectql/driver-redis';

const app = new ObjectQL({
  plugins: [
    createRedisDriverPlugin({
      name: 'cache',
      config: {
        url: 'redis://localhost:6379'
      }
    })
  ]
});
```

### 5. LocalStorage Driver Plugin

```typescript
import { createLocalStorageDriverPlugin } from '@objectql/driver-localstorage';

const app = new ObjectQL({
  plugins: [
    createLocalStorageDriverPlugin({
      name: 'default',
      config: {
        namespace: 'myapp',
        strictMode: true
      }
    })
  ]
});
```

### 6. FileSystem Driver Plugin

```typescript
import { createFileSystemDriverPlugin } from '@objectql/driver-fs';

const app = new ObjectQL({
  plugins: [
    createFileSystemDriverPlugin({
      name: 'default',
      config: {
        dataDir: './data',
        prettyPrint: true,
        enableBackup: true
      }
    })
  ]
});
```

### 7. SDK Driver Plugin (Remote API)

```typescript
import { createSdkDriverPlugin } from '@objectql/driver-sdk';

const app = new ObjectQL({
  plugins: [
    createSdkDriverPlugin({
      name: 'remote',
      config: {
        baseUrl: 'https://api.example.com',
        rpcPath: '/api/objectql'
      }
    })
  ]
});
```

### 8. Excel Driver Plugin

```typescript
import { createExcelDriverPlugin } from '@objectql/driver-excel';

const app = new ObjectQL({
  plugins: [
    createExcelDriverPlugin({
      name: 'default',
      config: {
        filePath: './data.xlsx',
        storageMode: 'single-file'
      }
    })
  ]
});
```

## Multiple Datasources

You can register multiple datasources using different plugins:

```typescript
import { ObjectQL } from '@objectql/core';
import { createSqlDriverPlugin } from '@objectql/driver-sql';
import { createRedisDriverPlugin } from '@objectql/driver-redis';

const app = new ObjectQL({
  plugins: [
    // Primary database
    createSqlDriverPlugin({
      name: 'default',
      config: {
        client: 'postgresql',
        connection: process.env.DATABASE_URL
      }
    }),
    
    // Cache layer
    createRedisDriverPlugin({
      name: 'cache',
      config: {
        url: process.env.REDIS_URL
      }
    })
  ]
});

await app.init();

// Use different datasources
const ctx = app.createContext({ isSystem: true });

// Default datasource
const users = ctx.object('users');
await users.find({});

// Access cache datasource
const cacheDriver = app.datasource('cache');
```

## Backward Compatibility

The old approach of passing drivers directly to `datasources` config is still supported:

```typescript
import { ObjectQL } from '@objectql/core';
import { SqlDriver } from '@objectql/driver-sql';

const driver = new SqlDriver({
  client: 'sqlite3',
  connection: { filename: ':memory:' },
  useNullAsDefault: true
});

const app = new ObjectQL({
  datasources: {
    default: driver
  }
});
```

## Benefits of Plugin-Based Approach

1. **Consistency**: All drivers follow the same plugin protocol from @objectstack/spec
2. **Flexibility**: Easy to swap drivers without changing application code
3. **Composability**: Mix and match multiple drivers as plugins
4. **Testability**: Easier to mock and test with plugin-based configuration
5. **Type Safety**: Plugin configurations are fully typed

## Migration Guide

### Old Approach

```typescript
import { ObjectQL } from '@objectql/core';
import { SqlDriver } from '@objectql/driver-sql';

const driver = new SqlDriver(config);
const app = new ObjectQL({ datasources: { default: driver } });
```

### New Plugin-Based Approach

```typescript
import { ObjectQL } from '@objectql/core';
import { createSqlDriverPlugin } from '@objectql/driver-sql';

const app = new ObjectQL({
  plugins: [
    createSqlDriverPlugin({ name: 'default', config })
  ]
});
```

## Implementation Details

Each driver plugin:

1. Implements the `ObjectQLPlugin` interface from `@objectql/types`
2. Has a unique `name` in the format `{driver-type}-driver:{datasource-name}`
3. Registers the driver using `app.registerDatasource(name, driver)` in its `setup` method
4. Fully typed configuration options specific to each driver type

## See Also

- [ObjectQL Plugin Protocol](../../packages/foundation/types/src/plugin.ts)
- [Driver Interface](../../packages/foundation/types/src/driver.ts)
- [Example: Hello World with Plugins](../../examples/quickstart/hello-world/src/index-plugin.ts)
