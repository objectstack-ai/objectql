# Microservices & Federation

ObjectQL provides a built-in mechanism to aggregate data from multiple services into a single unified graph. This is similar to **GraphQL Federation** or Salesforce's **External Objects**, but strictly for the ObjectQL protocol.

## Concept: Remote Remotes

You can configure an ObjectQL instance to act as a **Gateway**. It connects to other ObjectQL instances, downloads their metadata (Schema), and automatically creates proxy drivers for them.

*   **Source of Truth**: The microservice defines the object (`user.object.yml`).
*   **Proxy**: The gateway sees a virtual object (`user`) and forwards all queries (Find, Update, Actions) to the microservice.

## Configuration

### The Subgraph (Service A)

This is a standard ObjectQL service running standard drivers (SQL/Mongo).
It must expose the metadata API (default in `@objectql/server`).

```typescript
// user-service/index.ts
const app = new ObjectQL({
    source: './src/objects', // Defines 'user', 'role'
    datasources: { ... }
});
// Exposes http://user-service:3000/api/metadata/objects
```

### The Gateway

The gateway aggregates multiple services.

```typescript
// gateway/index.ts
const app = new ObjectQL({
    // No local source needed, just remotes
    remotes: [
        'http://user-service:3000',
        'http://order-service:3000'
    ]
});

await app.init();
```

### Usage

Once initialized, the Gateway behaves exactly like a monolith.

```typescript
// Code running on Gateway
// Transparently forwards request to User Service via HTTP
const users = await app.object('user').find({
    filters: [['status', '=', 'active']]
});
```

## Benefits

1.  **Decoupling**: Services manage their own schema migrations and domain logic.
2.  **Unity**: Frontend or upper layers see a single API surface.
3.  **Hybrid**: A Gateway can *also* have local objects. You can mix "local cache tables" with "remote live tables" in the same application.
