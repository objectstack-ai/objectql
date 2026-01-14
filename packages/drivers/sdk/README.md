# @objectql/sdk

> **Remote HTTP Driver for ObjectQL** - Universal client for browser, Node.js, and edge runtimes

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)
[![TypeScript](https://img.shields.io/badge/written%20in-TypeScript-3178C6.svg)](https://www.typescriptlang.org/)

The `@objectql/sdk` package provides a type-safe HTTP client for ObjectQL servers. It works seamlessly in browsers, Node.js, Deno, and edge runtimes like Cloudflare Workers.

---

## ✨ Features

* **🌍 Universal Runtime** - Works in browsers, Node.js, Deno, and edge environments
* **📦 Zero Dependencies** - Only depends on `@objectql/types` for type definitions
* **🔒 Type-Safe** - Full TypeScript support with generics
* **🚀 Modern APIs** - Uses native `fetch` API available in all modern JavaScript runtimes
* **🎯 RESTful Interface** - Clean, predictable API design

---

## 📦 Installation

```bash
npm install @objectql/sdk @objectql/types
```

For frontend projects:
```bash
# Using npm
npm install @objectql/sdk @objectql/types

# Using yarn
yarn add @objectql/sdk @objectql/types

# Using pnpm
pnpm add @objectql/sdk @objectql/types
```

---

## 🚀 Quick Start

### Browser Usage (ES Modules)

```html
<!DOCTYPE html>
<html>
<head>
    <title>ObjectQL SDK Browser Example</title>
</head>
<body>
    <h1>ObjectQL Browser Client</h1>
    <div id="users"></div>

    <script type="module">
        // Option 1: Using unpkg CDN
        import { DataApiClient } from 'https://unpkg.com/@objectql/sdk/dist/index.js';

        // Option 2: Using a bundler (Vite, Webpack, etc.)
        // import { DataApiClient } from '@objectql/sdk';

        const client = new DataApiClient({
            baseUrl: 'http://localhost:3000',
            token: 'your-auth-token' // Optional
        });

        // Fetch and display users
        async function loadUsers() {
            const response = await client.list('users', {
                filter: [['status', '=', 'active']],
                limit: 10
            });

            const usersDiv = document.getElementById('users');
            usersDiv.innerHTML = response.items
                .map(user => `<p>${user.name} - ${user.email}</p>`)
                .join('');
        }

        loadUsers().catch(console.error);
    </script>
</body>
</html>
```

### React / Vue / Angular

```typescript
import { DataApiClient, MetadataApiClient } from '@objectql/sdk';

// Initialize clients
const dataClient = new DataApiClient({
    baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000',
    token: localStorage.getItem('auth_token')
});

const metadataClient = new MetadataApiClient({
    baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000'
});

// Use in your components
async function fetchUsers() {
    const response = await dataClient.list('users', {
        filter: [['status', '=', 'active']],
        sort: [['created_at', 'desc']]
    });
    return response.items;
}
```

### Node.js

```javascript
const { DataApiClient } = require('@objectql/sdk');

const client = new DataApiClient({
    baseUrl: 'http://localhost:3000'
});

async function main() {
    const users = await client.list('users');
    console.log(users.items);
}

main();
```

---

## 📚 API Reference

### DataApiClient

Client for CRUD operations on data records.

#### Constructor

```typescript
new DataApiClient(config: DataApiClientConfig)
```

**Config Options:**
* `baseUrl` (string, required) - Base URL of the ObjectQL server
* `token` (string, optional) - Authentication token
* `headers` (Record<string, string>, optional) - Additional HTTP headers
* `timeout` (number, optional) - Request timeout in milliseconds (default: 30000)

#### Methods

##### `list<T>(objectName: string, params?: DataApiListParams): Promise<DataApiListResponse<T>>`

List records with optional filtering, sorting, and pagination.

```typescript
const users = await client.list('users', {
    filter: [['status', '=', 'active']],
    sort: [['name', 'asc']],
    limit: 20,
    skip: 0,
    fields: ['name', 'email', 'status']
});
```

##### `get<T>(objectName: string, id: string | number): Promise<DataApiItemResponse<T>>`

Get a single record by ID.

```typescript
const user = await client.get('users', 'user_123');
```

##### `create<T>(objectName: string, data: DataApiCreateRequest): Promise<DataApiItemResponse<T>>`

Create a new record.

```typescript
const newUser = await client.create('users', {
    name: 'Alice',
    email: 'alice@example.com',
    status: 'active'
});
```

##### `createMany<T>(objectName: string, data: DataApiCreateManyRequest): Promise<DataApiListResponse<T>>`

Create multiple records at once.

```typescript
const newUsers = await client.createMany('users', [
    { name: 'Bob', email: 'bob@example.com' },
    { name: 'Charlie', email: 'charlie@example.com' }
]);
```

##### `update<T>(objectName: string, id: string | number, data: DataApiUpdateRequest): Promise<DataApiItemResponse<T>>`

Update an existing record.

```typescript
const updated = await client.update('users', 'user_123', {
    status: 'inactive'
});
```

##### `updateMany(objectName: string, request: DataApiBulkUpdateRequest): Promise<DataApiResponse>`

Update multiple records matching filters.

```typescript
await client.updateMany('users', {
    filters: [['status', '=', 'pending']],
    data: { status: 'active' }
});
```

##### `delete(objectName: string, id: string | number): Promise<DataApiDeleteResponse>`

Delete a record by ID.

```typescript
await client.delete('users', 'user_123');
```

##### `deleteMany(objectName: string, request: DataApiBulkDeleteRequest): Promise<DataApiDeleteResponse>`

Delete multiple records matching filters.

```typescript
await client.deleteMany('users', {
    filters: [['created_at', '<', '2023-01-01']]
});
```

##### `count(objectName: string, filters?: FilterExpression): Promise<DataApiCountResponse>`

Count records matching filters.

```typescript
const result = await client.count('users', [['status', '=', 'active']]);
console.log(result.count);
```

---

### MetadataApiClient

Client for reading object schemas and metadata.

#### Constructor

```typescript
new MetadataApiClient(config: MetadataApiClientConfig)
```

#### Methods

##### `listObjects(): Promise<MetadataApiObjectListResponse>`

List all available objects.

```typescript
const objects = await metadataClient.listObjects();
```

##### `getObject(objectName: string): Promise<MetadataApiObjectDetailResponse>`

Get detailed schema for an object.

```typescript
const userSchema = await metadataClient.getObject('users');
console.log(userSchema.fields);
```

##### `getField(objectName: string, fieldName: string): Promise<FieldMetadataResponse>`

Get metadata for a specific field.

```typescript
const emailField = await metadataClient.getField('users', 'email');
```

##### `listActions(objectName: string): Promise<MetadataApiActionsResponse>`

List actions available for an object.

```typescript
const actions = await metadataClient.listActions('users');
```

---

## 🌐 Browser Compatibility

The SDK uses modern JavaScript APIs available in all current browsers:

* **fetch API** - Available in all modern browsers
* **Promises/async-await** - ES2017+ 
* **AbortSignal.timeout()** - Chrome 103+, Firefox 100+, Safari 16.4+

### Automatic Polyfill

The SDK **automatically includes a polyfill** for `AbortSignal.timeout()` that activates when running in older browsers. You don't need to add any polyfills manually - the SDK works universally out of the box!

The polyfill is lightweight and only adds the missing functionality when needed, ensuring compatibility with:
- Chrome 90+
- Firefox 90+
- Safari 15+
- Edge 90+

For even older browsers, you may need to add polyfills for:
- `fetch` API (via `whatwg-fetch`)
- `AbortController` (via `abort-controller` package)

---

## 🔧 Advanced Usage

### Custom Headers

```typescript
const client = new DataApiClient({
    baseUrl: 'http://localhost:3000',
    headers: {
        'X-Custom-Header': 'value',
        'X-Request-ID': crypto.randomUUID()
    }
});
```

### Dynamic Token Updates

```typescript
class AuthenticatedClient {
    private client: DataApiClient;

    constructor(baseUrl: string) {
        this.client = new DataApiClient({ baseUrl });
    }

    setToken(token: string) {
        this.client = new DataApiClient({
            baseUrl: this.client['baseUrl'],
            token
        });
    }

    async fetchData() {
        return this.client.list('users');
    }
}
```

### Error Handling

```typescript
import { ObjectQLError, ApiErrorCode } from '@objectql/types';

try {
    await client.create('users', { email: 'invalid' });
} catch (error) {
    if (error instanceof ObjectQLError) {
        console.error('ObjectQL Error:', error.code, error.message);
        
        if (error.code === ApiErrorCode.VALIDATION_ERROR) {
            console.log('Validation failed:', error.details);
        }
    }
}
```

---

## 📖 Examples

### React Hook

```typescript
import { useState, useEffect } from 'react';
import { DataApiClient } from '@objectql/sdk';

const client = new DataApiClient({
    baseUrl: process.env.REACT_APP_API_URL
});

export function useObjectData<T>(objectName: string, params?: any) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const response = await client.list<T>(objectName, params);
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

### Vue Composable

```typescript
import { ref, watchEffect } from 'vue';
import { DataApiClient } from '@objectql/sdk';

const client = new DataApiClient({
    baseUrl: import.meta.env.VITE_API_URL
});

export function useObjectData<T>(objectName: string, params?: any) {
    const data = ref<T[]>([]);
    const loading = ref(true);
    const error = ref<Error | null>(null);

    watchEffect(async () => {
        try {
            loading.value = true;
            const response = await client.list<T>(objectName, params);
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

## 🏗️ Architecture

The SDK is designed with the ObjectQL "Trinity" architecture:

1. **@objectql/types** (The Contract) - Pure TypeScript interfaces
2. **@objectql/sdk** (The Client) - HTTP communication layer
3. **ObjectQL Server** (The Backend) - Data processing and storage

```
┌─────────────────┐
│   Frontend      │
│  (Browser/App)  │
│                 │
│  @objectql/sdk  │
└────────┬────────┘
         │ HTTP/REST
         │
┌────────▼────────┐
│ ObjectQL Server │
│                 │
│  @objectql/core │
└────────┬────────┘
         │
    ┌────┴────┐
    │ SQL/Mongo│
    └─────────┘
```

---

## 📄 License

MIT License - see [LICENSE](../../LICENSE) file for details.

---

## 🔗 Related Packages

* **[@objectql/types](../../foundation/types)** - TypeScript type definitions
* **[@objectql/core](../../foundation/core)** - Core ObjectQL engine
* **[@objectql/server](../../runtime/server)** - HTTP server implementation

---

## 🤝 Contributing

We welcome contributions! Please see the main [repository README](../../../README.md) for guidelines.

---

## 📚 Documentation

For complete documentation, visit:
* [Client SDK Guide](../../../docs/api/client-sdk.md)
* [REST API Reference](../../../docs/api/rest.md)
* [ObjectQL Documentation](https://objectql.org)
