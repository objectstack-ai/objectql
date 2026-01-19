# Client SDK Usage Guide

This guide demonstrates how to use the ObjectQL TypeScript client SDK to interact with Data API and Metadata API from frontend applications.

## Installation

```bash
npm install @objectql/sdk @objectql/types
```

## Overview

The `@objectql/sdk` package provides two main client classes:

1. **`DataApiClient`** - For CRUD operations on data records
2. **`MetadataApiClient`** - For reading object schemas and metadata

All types are defined in `@objectql/types` to maintain zero dependencies and enable frontend usage.

---

## Data API Client

### Basic Setup

```typescript
import { DataApiClient } from '@objectql/sdk';

const dataClient = new DataApiClient({
  baseUrl: 'http://localhost:3000',
  token: 'your-auth-token', // Optional
  timeout: 30000 // Optional, defaults to 30s
});
```

### List Records

```typescript
// Simple list
const response = await dataClient.list('users');
console.log(response.items); // Array of user records
console.log(response.meta);  // Pagination metadata

// With filters and pagination
const activeUsers = await dataClient.list('users', {
  filter: [['status', '=', 'active']],
  sort: [['created_at', 'desc']],
  limit: 20,
  skip: 0,
  fields: ['name', 'email', 'status']
});

// TypeScript with generics
interface User {
  _id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  created_at: string;
}

const users = await dataClient.list<User>('users', {
  filter: [['status', '=', 'active']]
});

users.items?.forEach(user => {
  console.log(user.name); // Type-safe!
});
```

### Get Single Record

```typescript
const user = await dataClient.get('users', 'user_123');
console.log(user.name);
console.log(user.email);

// With TypeScript types
const user = await dataClient.get<User>('users', 'user_123');
```

### Create Record

```typescript
// Create single record
const newUser = await dataClient.create('users', {
  name: 'Alice Johnson',
  email: 'alice@example.com',
  role: 'admin'
});

console.log(newUser._id); // Generated ID
console.log(newUser.created_at); // Timestamp

// With TypeScript
const newUser = await dataClient.create<User>('users', {
  name: 'Alice Johnson',
  email: 'alice@example.com',
  status: 'active'
});
```

### Create Multiple Records

```typescript
const newUsers = await dataClient.createMany('users', [
  { name: 'Bob', email: 'bob@example.com' },
  { name: 'Charlie', email: 'charlie@example.com' }
]);

console.log(newUsers.items); // Array of created users
```

### Update Record

```typescript
const updated = await dataClient.update('users', 'user_123', {
  status: 'inactive'
});

console.log(updated.updated_at); // New timestamp
```

### Bulk Update

```typescript
const result = await dataClient.updateMany('users', {
  filters: [['status', '=', 'pending']],
  data: { status: 'active' }
});
```

### Delete Record

```typescript
const result = await dataClient.delete('users', 'user_123');
console.log(result.success);
```

### Bulk Delete

```typescript
const result = await dataClient.deleteMany('users', {
  filters: [['created_at', '<', '2023-01-01']]
});

console.log(result.deleted_count);
```

### Count Records

```typescript
const countResult = await dataClient.count('users', [
  ['status', '=', 'active']
]);

console.log(countResult.count);
```

---

## Metadata API Client

### Basic Setup

```typescript
import { MetadataApiClient } from '@objectql/sdk';

const metadataClient = new MetadataApiClient({
  baseUrl: 'http://localhost:3000',
  token: 'your-auth-token' // Optional
});
```

### List All Objects

```typescript
const objectsResponse = await metadataClient.listObjects();

objectsResponse.items.forEach(obj => {
  console.log(`${obj.name}: ${obj.label}`);
  console.log(`  Icon: ${obj.icon}`);
  console.log(`  Description: ${obj.description}`);
});
```

### Get Object Schema

```typescript
const userSchema = await metadataClient.getObject('users');

console.log(userSchema.name);
console.log(userSchema.label);
console.log(userSchema.description);

// Iterate through fields
Object.entries(userSchema.fields).forEach(([key, field]) => {
  console.log(`${field.name} (${field.type})`);
  if (field.required) console.log('  - Required');
  if (field.unique) console.log('  - Unique');
});

// Check available actions
if (userSchema.actions) {
  Object.keys(userSchema.actions).forEach(actionName => {
    console.log(`Action: ${actionName}`);
  });
}
```

### Get Field Metadata

```typescript
const emailField = await metadataClient.getField('users', 'email');

console.log(emailField.type);        // "email"
console.log(emailField.required);    // true
console.log(emailField.unique);      // true
console.log(emailField.label);       // "Email Address"
```

### List Object Actions

```typescript
const actionsResponse = await metadataClient.listActions('users');

actionsResponse.items.forEach(action => {
  console.log(`${action.name} (${action.type})`);
  console.log(`  Label: ${action.label}`);
  console.log(`  Description: ${action.description}`);
});
```

### List Custom Metadata

```typescript
// List all views
const views = await metadataClient.listByType('view');

// List all forms
const forms = await metadataClient.listByType('form');

// List all pages
const pages = await metadataClient.listByType('page');
```

### Get Specific Metadata

```typescript
const userListView = await metadataClient.getMetadata('view', 'user_list');
console.log(userListView);

const userForm = await metadataClient.getMetadata('form', 'user_create');
console.log(userForm);
```

---

## Error Handling

All API methods throw errors with structured information:

```typescript
import { ApiErrorCode } from '@objectql/types';

try {
  const user = await dataClient.get('users', 'invalid_id');
} catch (error) {
  if (error instanceof Error) {
    // Error message format: "ERROR_CODE: Error message"
    console.error(error.message);
    
    if (error.message.includes(ApiErrorCode.NOT_FOUND)) {
      console.log('User not found');
    } else if (error.message.includes(ApiErrorCode.VALIDATION_ERROR)) {
      console.log('Validation failed');
    } else if (error.message.includes(ApiErrorCode.UNAUTHORIZED)) {
      console.log('Authentication required');
    }
  }
}
```

---

## React Example

### Custom Hook for Data Fetching

```typescript
import { useState, useEffect } from 'react';
import { DataApiClient } from '@objectql/sdk';

const dataClient = new DataApiClient({
  baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000'
});

export function useObjectData<T>(objectName: string, params?: any) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await dataClient.list<T>(objectName, params);
        setData(response.items || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [objectName, JSON.stringify(params)]);

  return { data, loading, error };
}
```

### Using the Hook

```typescript
import { useObjectData } from './hooks/useObjectData';

interface User {
  _id: string;
  name: string;
  email: string;
  status: string;
}

function UserList() {
  const { data: users, loading, error } = useObjectData<User>('users', {
    filter: [['status', '=', 'active']],
    sort: [['name', 'asc']]
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {users.map(user => (
        <li key={user._id}>
          {user.name} - {user.email}
        </li>
      ))}
    </ul>
  );
}
```

### Custom Hook for Metadata

```typescript
import { useState, useEffect } from 'react';
import { MetadataApiClient, ObjectMetadataDetail } from '@objectql/sdk';

const metadataClient = new MetadataApiClient({
  baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000'
});

export function useObjectSchema(objectName: string) {
  const [schema, setSchema] = useState<ObjectMetadataDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchSchema() {
      try {
        setLoading(true);
        const data = await metadataClient.getObject(objectName);
        setSchema(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchSchema();
  }, [objectName]);

  return { schema, loading, error };
}
```

### Dynamic Form Generator

```typescript
import { useObjectSchema } from './hooks/useObjectSchema';

function DynamicForm({ objectName }: { objectName: string }) {
  const { schema, loading, error } = useObjectSchema(objectName);
  
  if (loading) return <div>Loading form...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!schema) return null;

  return (
    <form>
      <h2>Create {schema.label}</h2>
      {Object.entries(schema.fields).map(([key, field]) => (
        <div key={key}>
          <label>
            {field.label || field.name}
            {field.required && <span>*</span>}
          </label>
          {field.type === 'text' && <input type="text" name={key} />}
          {field.type === 'email' && <input type="email" name={key} />}
          {field.type === 'number' && (
            <input 
              type="number" 
              name={key}
              min={field.min}
              max={field.max}
            />
          )}
          {field.type === 'select' && (
            <select name={key}>
              {field.options?.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          )}
        </div>
      ))}
      <button type="submit">Create</button>
    </form>
  );
}
```

---

## Vue.js Example

### Composable for Data Fetching

```typescript
import { ref, watchEffect } from 'vue';
import { DataApiClient } from '@objectql/sdk';

const dataClient = new DataApiClient({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000'
});

export function useObjectData<T>(objectName: string, params?: any) {
  const data = ref<T[]>([]);
  const loading = ref(true);
  const error = ref<Error | null>(null);

  watchEffect(async () => {
    try {
      loading.value = true;
      const response = await dataClient.list<T>(objectName, params);
      data.value = response.items || [];
    } catch (err) {
      error.value = err as Error;
    } finally {
      loading.value = false;
    }
  });

  return { data, loading, error };
}
```

---

## Advanced Filtering

### Complex Filter Expressions

```typescript
// AND condition
const result = await dataClient.list('orders', {
  filter: [
    'and',
    ['status', '=', 'pending'],
    ['total', '>', 100]
  ]
});

// OR condition
const result = await dataClient.list('users', {
  filter: [
    'or',
    ['role', '=', 'admin'],
    ['role', '=', 'manager']
  ]
});

// Nested conditions
const result = await dataClient.list('orders', {
  filter: [
    'and',
    ['status', '=', 'pending'],
    [
      'or',
      ['priority', '=', 'high'],
      ['total', '>', 1000]
    ]
  ]
});
```

### Expanding Relations

```typescript
const orders = await dataClient.list('orders', {
  expand: {
    customer: {
      fields: ['name', 'email']
    },
    items: {
      fields: ['product_name', 'quantity', 'price']
    }
  }
});

orders.items?.forEach(order => {
  console.log(order.customer.name);
  order.items.forEach(item => {
    console.log(`  - ${item.product_name} x${item.quantity}`);
  });
});
```

---

## Type Safety Benefits

By using the type definitions from `@objectql/types`, you get:

1. **Autocomplete** - IDEs provide intelligent suggestions
2. **Type Checking** - Catch errors at compile time
3. **Documentation** - Inline JSDoc comments explain each field
4. **Refactoring** - Safely rename and restructure code

```typescript
import type {
  DataApiListParams,
  DataApiListResponse,
  DataApiItemResponse,
  ApiErrorCode,
  MetadataApiObjectDetailResponse
} from '@objectql/types';

// These types ensure your frontend code stays in sync with the API
```

---

## Best Practices

1. **Centralize Client Instances**
   ```typescript
   // api-clients.ts
   export const dataClient = new DataApiClient({
     baseUrl: process.env.API_URL
   });
   
   export const metadataClient = new MetadataApiClient({
     baseUrl: process.env.API_URL
   });
   ```

2. **Use Generic Types**
   ```typescript
   interface Project {
     _id: string;
     name: string;
     status: string;
   }
   
   const projects = await dataClient.list<Project>('projects');
   ```

3. **Handle Errors Gracefully**
   ```typescript
   try {
     await dataClient.create('users', userData);
   } catch (error) {
     // Show user-friendly message
     toast.error('Failed to create user');
   }
   ```

4. **Cache Metadata**
   ```typescript
   // Metadata rarely changes, so cache it
   const schemaCache = new Map();
   
   async function getSchema(objectName: string) {
     if (!schemaCache.has(objectName)) {
       const schema = await metadataClient.getObject(objectName);
       schemaCache.set(objectName, schema);
     }
     return schemaCache.get(objectName);
   }
   ```

5. **Use Environment Variables**
   ```typescript
   const dataClient = new DataApiClient({
     baseUrl: process.env.NEXT_PUBLIC_API_URL,
     token: process.env.NEXT_PUBLIC_API_TOKEN
   });
   ```

---

## Summary

The ObjectQL client SDK provides:

- ✅ **Type-safe** API clients for Data and Metadata operations
- ✅ **Zero dependencies** in `@objectql/types` for frontend compatibility
- ✅ **RESTful interface** matching the server implementation
- ✅ **Framework agnostic** - works with React, Vue, Angular, etc.
- ✅ **Full TypeScript support** with generics and inference

For more information, see:
- [REST API Documentation](./rest.md)
- [Metadata API Documentation](./metadata.md)
- [Error Handling Guide](./error-handling.md)
