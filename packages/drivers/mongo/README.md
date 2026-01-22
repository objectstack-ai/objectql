# @objectql/driver-mongo

MongoDB driver for ObjectQL. Supports basic CRUD, filtering, and aggregation pipelines on MongoDB.

**Now with ObjectStack QueryAST support!** This driver implements both the legacy `Driver` interface and the new `DriverInterface` from `@objectstack/spec` for seamless integration with the ObjectStack ecosystem.

## Installation

```bash
npm install @objectql/driver-mongo
```

## Usage

```typescript
import { MongoDriver } from '@objectql/driver-mongo';

const driver = new MongoDriver({
    url: 'mongodb://localhost:27017',
    dbName: 'my_app'
});

const objectql = new ObjectQL({
    datasources: {
        default: driver
    }
});
```

## Features

- ✅ **100% Backward Compatible** - All existing code continues to work
- ✅ **QueryAST Support** - Supports the new `@objectstack/spec` query format
- ✅ **Smart ID Mapping** - Automatic conversion between `id` (API) and `_id` (MongoDB)
- ✅ **Full-Text Search** - MongoDB text search capabilities
- ✅ **Array & JSON Fields** - Native BSON support for complex data types
- ✅ **Aggregation Pipelines** - Native MongoDB aggregation support

## Driver Metadata

```typescript
console.log(driver.name);     // 'MongoDriver'
console.log(driver.version);  // '3.0.1'
console.log(driver.supports); 
// {
//   transactions: true,
//   joins: false,
//   fullTextSearch: true,
//   jsonFields: true,
//   arrayFields: true
// }
```

## QueryAST Format

The driver now supports both legacy and QueryAST formats:

### Legacy Format
```typescript
const results = await driver.find('users', {
    filters: [['age', '>', 18]],
    sort: [['name', 'asc']],
    limit: 10,
    skip: 0
});
```

### QueryAST Format
```typescript
const results = await driver.find('users', {
    filters: [['age', '>', 18]],
    sort: [{ field: 'name', order: 'asc' }],
    top: 10,  // Instead of 'limit'
    skip: 0
});
```

## Migration Guide

See [MIGRATION.md](./MIGRATION.md) for detailed information about the ObjectStack migration and QueryAST format support.

## License

MIT
