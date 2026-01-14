# Schema Introspection - Connect to Existing Databases

ObjectQL now supports **automatic schema introspection**, allowing you to connect to an existing database without defining any metadata. The system will automatically discover tables, columns, data types, and relationships.

## Features

- ✅ **Zero Metadata Required**: Connect to any existing SQL database instantly
- ✅ **Automatic Type Mapping**: Database types are automatically mapped to ObjectQL field types
- ✅ **Relationship Discovery**: Foreign keys are automatically detected and converted to lookup fields
- ✅ **Selective Introspection**: Choose which tables to include or exclude
- ✅ **Non-Destructive**: Introspection never modifies your existing database schema

## Supported Databases

- PostgreSQL
- MySQL / MySQL2
- SQLite3

## Quick Start

### 1. Connect to Existing Database

```typescript
import { ObjectQL } from '@objectql/core';
import { SqlDriver } from '@objectql/driver-sql';

// Create driver for your existing database
const driver = new SqlDriver({
    client: 'postgresql',
    connection: {
        host: 'localhost',
        database: 'my_existing_db',
        user: 'username',
        password: 'password'
    }
});

// Initialize ObjectQL
const app = new ObjectQL({
    datasources: { default: driver }
});
```

### 2. Introspect and Register Tables

```typescript
// Automatically discover all tables
const objects = await app.introspectAndRegister();

console.log(`Discovered ${objects.length} tables`);
```

### 3. Use Discovered Objects

```typescript
await app.init();

const ctx = app.createContext({ isSystem: true });

// Query existing data
const users = await ctx.object('users').find({});

// Insert new records
const newUser = await ctx.object('users').create({
    name: 'Alice',
    email: 'alice@example.com'
});
```

## Options

### Selective Table Introspection

```typescript
// Only include specific tables
await app.introspectAndRegister('default', {
    includeTables: ['users', 'orders', 'products']
});

// Or exclude certain tables
await app.introspectAndRegister('default', {
    excludeTables: ['migrations', 'sessions', 'logs']
});
```

### System Columns

By default, ObjectQL skips standard system columns (`id`, `created_at`, `updated_at`) during introspection since they're automatically handled by the framework.

```typescript
// Include system columns in field definitions
await app.introspectAndRegister('default', {
    skipSystemColumns: false
});
```

## Type Mapping

Database types are automatically mapped to ObjectQL field types:

| Database Type | ObjectQL Type |
|--------------|---------------|
| `VARCHAR`, `CHAR` | `text` |
| `TEXT`, `LONGTEXT` | `textarea` |
| `INTEGER`, `BIGINT`, `INT` | `number` |
| `FLOAT`, `DOUBLE`, `DECIMAL` | `number` |
| `BOOLEAN`, `BOOL` | `boolean` |
| `DATE` | `date` |
| `DATETIME`, `TIMESTAMP` | `datetime` |
| `TIME` | `time` |
| `JSON`, `JSONB` | `object` |

## Relationship Detection

Foreign key constraints are automatically detected and converted to `lookup` fields:

**Database Schema:**
```sql
CREATE TABLE orders (
    id VARCHAR PRIMARY KEY,
    customer_id VARCHAR NOT NULL,
    total DECIMAL(10, 2),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);
```

**Discovered ObjectQL Schema:**
```typescript
{
    name: 'orders',
    fields: {
        customer_id: {
            type: 'lookup',
            reference_to: 'customers',
            required: true
        },
        total: {
            type: 'number'
        }
    }
}
```

## Advanced Usage

### Inspect Schema Without Registering

```typescript
const driver = app.datasource('default');
const schema = await driver.introspectSchema();

// schema.tables contains all discovered table metadata
console.log(schema.tables['users'].columns);
console.log(schema.tables['users'].foreignKeys);
```

### Convert Schema Manually

```typescript
import { convertIntrospectedSchemaToObjects } from '@objectql/core';

const schema = await driver.introspectSchema();
const objects = convertIntrospectedSchemaToObjects(schema, {
    excludeTables: ['temp_tables']
});

// Register manually
objects.forEach(obj => app.registerObject(obj));
```

## Use Cases

### 1. Legacy Database Integration

Connect ObjectQL to an existing legacy database without rewriting the schema:

```typescript
const app = new ObjectQL({ datasources: { legacy: legacyDriver } });
await app.introspectAndRegister('legacy');
await app.init();

// Now use ObjectQL's modern API with your legacy database
const records = await ctx.object('old_table_name').find({});
```

### 2. Database Migration

Introspect an existing database to generate ObjectQL metadata for version control:

```typescript
const schema = await driver.introspectSchema();
const objects = convertIntrospectedSchemaToObjects(schema);

// Export to YAML files for your project
objects.forEach(obj => {
    fs.writeFileSync(
        `src/objects/${obj.name}.object.yml`,
        yaml.dump(obj)
    );
});
```

### 3. Multi-Database Applications

Connect to multiple existing databases simultaneously:

```typescript
const app = new ObjectQL({
    datasources: {
        main: mainDbDriver,
        analytics: analyticsDbDriver,
        archive: archiveDbDriver
    }
});

await app.introspectAndRegister('main');
await app.introspectAndRegister('analytics', { 
    excludeTables: ['raw_logs'] 
});
await app.introspectAndRegister('archive', {
    includeTables: ['historical_orders']
});
```

## Limitations

1. **SQLite Foreign Keys**: SQLite requires `PRAGMA foreign_keys = ON` to properly detect foreign key constraints
2. **Complex Types**: Some database-specific types may be mapped to generic ObjectQL types
3. **Computed Columns**: Virtual/computed columns are introspected as regular fields
4. **Indexes**: While unique constraints are detected, regular indexes are not yet included in introspection

## API Reference

### `app.introspectAndRegister(datasourceName?, options?)`

Introspect a database and automatically register discovered tables as ObjectQL objects.

**Parameters:**
- `datasourceName` (string, optional): Name of the datasource (default: `'default'`)
- `options` (object, optional):
  - `includeTables` (string[]): Only include these tables
  - `excludeTables` (string[]): Exclude these tables  
  - `skipSystemColumns` (boolean): Skip `id`, `created_at`, `updated_at` (default: `true`)

**Returns:** `Promise<ObjectConfig[]>` - Array of registered object configurations

### `driver.introspectSchema()`

Low-level method to introspect the database schema.

**Returns:** `Promise<IntrospectedSchema>` - Complete schema metadata

### `convertIntrospectedSchemaToObjects(schema, options?)`

Convert introspected schema to ObjectQL object configurations.

**Parameters:**
- `schema` (IntrospectedSchema): Schema from `driver.introspectSchema()`
- `options` (object, optional): Same as `introspectAndRegister`

**Returns:** `ObjectConfig[]` - Array of object configurations

## Examples

See [examples/connect-existing-database.ts](../examples/connect-existing-database.ts) for a complete working example.

## Chinese Documentation (中文文档)

### 快速开始

```typescript
import { ObjectQL } from '@objectql/core';
import { SqlDriver } from '@objectql/driver-sql';

// 1. 连接到现有数据库
const driver = new SqlDriver({
    client: 'postgresql',
    connection: {
        host: 'localhost',
        database: '现有数据库',
        user: '用户名',
        password: '密码'
    }
});

const app = new ObjectQL({
    datasources: { default: driver }
});

// 2. 自动发现数据库表结构
const objects = await app.introspectAndRegister('default', {
    excludeTables: ['migrations'] // 排除不需要的表
});

console.log(`发现了 ${objects.length} 个表`);

// 3. 初始化并使用
await app.init();
const ctx = app.createContext({ isSystem: true });

// 查询现有数据
const users = await ctx.object('users').find({});

// 创建新记录
const newUser = await ctx.object('users').create({
    name: '张三',
    email: 'zhangsan@example.com'
});
```

**主要特性：**
- ✅ 无需定义任何元数据即可连接现有数据库
- ✅ 自动识别表、字段、数据类型和外键关系
- ✅ 支持 PostgreSQL、MySQL、SQLite
- ✅ 完全非破坏性操作，不修改现有数据库结构
