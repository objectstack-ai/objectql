# @objectql/driver-mongo

MongoDB driver for ObjectQL. Supports basic CRUD, filtering, and aggregation pipelines on MongoDB.

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
