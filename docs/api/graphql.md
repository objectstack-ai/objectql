# GraphQL API

ObjectQL provides a **GraphQL interface** for flexible, efficient queries with complex multi-table relationships. GraphQL allows clients to request exactly the data they need in a single request, making it ideal for modern frontends with complex data requirements.

## Overview

The GraphQL API provides:
- **Strongly-typed schema** automatically generated from ObjectQL metadata
- **Single endpoint** for all queries and mutations
- **Efficient data fetching** with precise field selection
- **Real-time introspection** for developer tools
- **Standards-compliant** GraphQL implementation

### Endpoint

```
POST /api/graphql
GET /api/graphql
```

Both GET and POST methods are supported:
- **POST**: Send queries in request body (recommended for most cases)
- **GET**: Send queries via URL parameters (useful for simple queries and caching)

---

## Getting Started

### Installation

The GraphQL adapter is included in `@objectql/server`:

```typescript
import { createGraphQLHandler } from '@objectql/server';
import { ObjectQL } from '@objectql/core';

const app = new ObjectQL({
  datasources: {
    default: myDriver
  }
});

// Create GraphQL handler
const graphqlHandler = createGraphQLHandler(app);

// Use with your HTTP server
server.on('request', (req, res) => {
  if (req.url?.startsWith('/api/graphql')) {
    return graphqlHandler(req, res);
  }
  // ... other handlers
});
```

### Basic Query Example

```graphql
query {
  user(id: "user_123") {
    id
    name
    email
  }
}
```

**Response:**
```json
{
  "data": {
    "user": {
      "id": "user_123",
      "name": "Alice",
      "email": "alice@example.com"
    }
  }
}
```

---

## Schema Generation

The GraphQL schema is **automatically generated** from your ObjectQL metadata. Each object definition creates:

1. **Output Type**: For query results (e.g., `User`, `Task`)
2. **Input Type**: For mutations (e.g., `UserInput`, `TaskInput`)
3. **Query Fields**: For fetching data (e.g., `user(id)`, `userList()`)
4. **Mutation Fields**: For creating/updating/deleting data

### Example Object Definition

```yaml
# user.object.yml
name: user
label: User
fields:
  name:
    type: text
    required: true
  email:
    type: email
    required: true
  age:
    type: number
  role:
    type: select
    options: [admin, user, guest]
```

**Generated GraphQL Types:**

```graphql
type User {
  id: String!
  name: String!
  email: String!
  age: Float
  role: String
}

input UserInput {
  name: String
  email: String
  age: Float
  role: String
}
```

---

## Queries

### Fetch Single Record

Query a single record by ID:

```graphql
query {
  user(id: "user_123") {
    id
    name
    email
    role
  }
}
```

### Fetch Multiple Records

Query multiple records with optional filtering and pagination:

```graphql
query {
  userList(limit: 10, skip: 0) {
    id
    name
    email
  }
}
```

**Available Arguments:**
- `limit` (Int): Maximum number of records to return
- `skip` (Int): Number of records to skip (for pagination)
- `filters` (String): JSON-encoded filter expression
- `fields` (List): Specific fields to include
- `sort` (String): JSON-encoded sort specification

### Advanced Filtering

Use the `filters` argument with JSON-encoded filter expressions:

```graphql
query {
  userList(
    filters: "[[\\"role\\", \\"=\\", \\"admin\\"], \\"and\\", [\\"age\\", \\">=\\", 30]]"
    limit: 20
  ) {
    id
    name
    role
    age
  }
}
```

### Sorting

Use the `sort` argument with JSON-encoded sort specification:

```graphql
query {
  userList(
    sort: "[[\\"created_at\\", \\"desc\\"]]"
  ) {
    id
    name
    created_at
  }
}
```

### Field Selection

GraphQL's field selection naturally limits the data returned:

```graphql
query {
  userList {
    id
    name
    # Only these two fields are returned
  }
}
```

---

## Mutations

### Create Record

```graphql
mutation {
  createUser(input: {
    name: "Bob"
    email: "bob@example.com"
    role: "user"
  }) {
    id
    name
    email
  }
}
```

**Response:**
```json
{
  "data": {
    "createUser": {
      "id": "user_456",
      "name": "Bob",
      "email": "bob@example.com"
    }
  }
}
```

### Update Record

```graphql
mutation {
  updateUser(id: "user_123", input: {
    name: "Alice Updated"
    role: "admin"
  }) {
    id
    name
    role
    updated_at
  }
}
```

### Delete Record

```graphql
mutation {
  deleteUser(id: "user_123") {
    id
    deleted
  }
}
```

**Response:**
```json
{
  "data": {
    "deleteUser": {
      "id": "user_123",
      "deleted": true
    }
  }
}
```

---

## Variables

GraphQL variables provide a cleaner way to pass dynamic values:

### Query with Variables

```graphql
query GetUser($userId: String!) {
  user(id: $userId) {
    id
    name
    email
  }
}
```

**Variables:**
```json
{
  "userId": "user_123"
}
```

**Request (POST):**
```json
{
  "query": "query GetUser($userId: String!) { user(id: $userId) { id name email } }",
  "variables": {
    "userId": "user_123"
  }
}
```

### Mutation with Variables

```graphql
mutation CreateUser($input: UserInput!) {
  createUser(input: $input) {
    id
    name
    email
  }
}
```

**Variables:**
```json
{
  "input": {
    "name": "Charlie",
    "email": "charlie@example.com",
    "role": "user"
  }
}
```

---

## GET Requests

For simple queries, you can use GET requests with URL parameters:

```bash
GET /api/graphql?query={user(id:"user_123"){id,name,email}}
```

With variables:

```bash
GET /api/graphql?query=query GetUser($id:String!){user(id:$id){name}}&variables={"id":"user_123"}
```

**Note:** GET requests are useful for:
- Simple queries that can be cached
- Direct browser testing
- Debugging and development

For complex queries or mutations, use POST requests.

---

## Error Handling

### GraphQL Errors

Errors follow the GraphQL specification:

```json
{
  "errors": [
    {
      "message": "Object 'nonexistent' not found",
      "locations": [{"line": 1, "column": 3}],
      "path": ["nonexistent"]
    }
  ],
  "data": null
}
```

### Validation Errors

```json
{
  "errors": [
    {
      "message": "Validation failed",
      "extensions": {
        "code": "VALIDATION_ERROR"
      }
    }
  ]
}
```

### Not Found

```json
{
  "data": {
    "user": null
  }
}
```

---

## Type Mapping

ObjectQL field types are mapped to GraphQL types:

| ObjectQL Type | GraphQL Type | Notes |
|--------------|--------------|-------|
| `text`, `textarea`, `email`, `url`, `phone` | `String` | Text fields |
| `number`, `currency`, `percent` | `Float` | Numeric fields |
| `auto_number` | `Int` | Integer fields |
| `boolean` | `Boolean` | True/false |
| `date`, `datetime`, `time` | `String` | ISO 8601 format |
| `select` | `String` | String enum values |
| `lookup`, `master_detail` | `String` | Reference by ID |
| `file`, `image` | `String` | File metadata as JSON |
| `object`, `json` | `String` | JSON as string |

### Required Fields

Fields marked as `required: true` in ObjectQL become non-nullable (`!`) in GraphQL:

```yaml
# ObjectQL
fields:
  name:
    type: text
    required: true
```

```graphql
# GraphQL
type User {
  name: String!  # Non-nullable
}
```

---

## Introspection

GraphQL provides built-in introspection for schema discovery:

### Get All Types

```graphql
{
  __schema {
    types {
      name
      kind
      description
    }
  }
}
```

### Get Type Details

```graphql
{
  __type(name: "User") {
    name
    kind
    fields {
      name
      type {
        name
        kind
      }
    }
  }
}
```

### Available Operations

```graphql
{
  __schema {
    queryType {
      fields {
        name
        description
      }
    }
    mutationType {
      fields {
        name
        description
      }
    }
  }
}
```

---

## Client Integration

### JavaScript/TypeScript

```typescript
const query = `
  query GetUsers {
    userList(limit: 10) {
      id
      name
      email
    }
  }
`;

const response = await fetch('/api/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({ query })
});

const result = await response.json();
console.log(result.data.userList);
```

### Apollo Client

```typescript
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

const client = new ApolloClient({
  uri: '/api/graphql',
  cache: new InMemoryCache()
});

const { data } = await client.query({
  query: gql`
    query GetUsers {
      userList {
        id
        name
        email
      }
    }
  `
});
```

### React with Apollo

```tsx
import { useQuery, gql } from '@apollo/client';

const GET_USERS = gql`
  query GetUsers {
    userList {
      id
      name
      email
    }
  }
`;

function UserList() {
  const { loading, error, data } = useQuery(GET_USERS);
  
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  
  return (
    <ul>
      {data.userList.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

---

## Development Tools

### GraphQL Playground

ObjectQL doesn't include GraphQL Playground by default, but you can easily add it:

```typescript
import express from 'express';
import { graphqlHTTP } from 'express-graphql';
import { createGraphQLHandler, generateGraphQLSchema } from '@objectql/server';

const app = express();
const schema = generateGraphQLSchema(objectQLApp);

app.use('/api/graphql', graphqlHTTP({
  schema,
  graphiql: true  // Enable GraphiQL interface
}));
```

### Postman

Import the GraphQL schema into Postman for testing:
1. Create a new GraphQL request
2. Point to `/api/graphql`
3. Use the introspection feature to load the schema

---

## Best Practices

### 1. Request Only What You Need

❌ **Don't** request all fields:
```graphql
query {
  userList {
    id
    name
    email
    age
    role
    created_at
    updated_at
    # ... many more fields
  }
}
```

✅ **Do** request specific fields:
```graphql
query {
  userList {
    id
    name
    email
  }
}
```

### 2. Use Variables for Dynamic Values

❌ **Don't** embed values in queries:
```graphql
query {
  user(id: "user_123") {
    name
  }
}
```

✅ **Do** use variables:
```graphql
query GetUser($id: String!) {
  user(id: $id) {
    name
  }
}
```

### 3. Use Fragments for Reusability

```graphql
fragment UserBasic on User {
  id
  name
  email
}

query {
  user(id: "user_123") {
    ...UserBasic
    role
  }
  
  userList(limit: 10) {
    ...UserBasic
  }
}
```

### 4. Implement Pagination

```graphql
query GetUsersPaginated($limit: Int!, $skip: Int!) {
  userList(limit: $limit, skip: $skip) {
    id
    name
    email
  }
}
```

### 5. Handle Errors Gracefully

```typescript
const result = await fetch('/api/graphql', {
  method: 'POST',
  body: JSON.stringify({ query })
});

const json = await result.json();

if (json.errors) {
  console.error('GraphQL errors:', json.errors);
  // Handle errors appropriately
}

if (json.data) {
  // Process data
}
```

---

## Comparison with Other APIs

### GraphQL vs REST

| Feature | GraphQL | REST |
|---------|---------|------|
| **Endpoint** | Single endpoint | Multiple endpoints |
| **Data Fetching** | Precise field selection | Fixed response structure |
| **Multiple Resources** | Single request | Multiple requests |
| **Over-fetching** | No | Common |
| **Under-fetching** | No | Common |
| **Versioning** | Schema evolution | URL versioning |
| **Caching** | More complex | Simple (HTTP) |

### GraphQL vs JSON-RPC

| Feature | GraphQL | JSON-RPC |
|---------|---------|----------|
| **Type System** | Strongly typed | Flexible |
| **Introspection** | Built-in | Not available |
| **Field Selection** | Granular | All or custom |
| **Developer Tools** | Excellent | Limited |
| **Learning Curve** | Moderate | Low |
| **Flexibility** | High | Very High |

### When to Use GraphQL

**Use GraphQL when:**
- Building complex UIs with nested data requirements
- Client needs flexibility in data fetching
- You want strong typing and introspection
- Reducing network requests is critical
- Working with modern frontend frameworks (React, Vue, Angular)

**Use REST when:**
- Simple CRUD operations
- Caching is critical
- Working with legacy systems
- Team is more familiar with REST

**Use JSON-RPC when:**
- Need maximum flexibility
- Building internal microservices
- Working with AI agents
- Custom operations beyond CRUD

---

## Limitations

### Current Limitations

1. **No Subscriptions**: Real-time subscriptions are not yet supported
2. **No Nested Mutations**: Cannot create related records in a single mutation
3. **Basic Relationships**: Relationships are represented as IDs, not nested objects
4. **No Custom Scalars**: Uses built-in GraphQL scalars only
5. **No Directives**: Custom directives not supported

### Planned Features

- **Nested Relationships**: Query related objects without separate requests
- **Subscriptions**: Real-time updates via WebSocket
- **Custom Scalars**: Date, DateTime, JSON scalars
- **Relay Connections**: Standardized pagination
- **Field Resolvers**: Custom field resolution logic
- **DataLoader Integration**: Batch and cache database queries

---

## Performance Considerations

### Query Complexity

ObjectQL GraphQL doesn't currently limit query complexity. For production:

1. **Implement Rate Limiting**: Limit requests per user/IP
2. **Set Depth Limits**: Prevent deeply nested queries
3. **Monitor Performance**: Track slow queries
4. **Add Caching**: Use Redis or similar for frequently accessed data

### Database Optimization

1. **Add Indexes**: Index fields used in filters and sorts
2. **Use Pagination**: Always limit result sets
3. **Optimize Filters**: Use indexed fields in filter conditions

---

## Security

### Authentication

GraphQL uses the same authentication as other ObjectQL APIs:

```typescript
// With JWT
fetch('/api/graphql', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
})
```

### Authorization

ObjectQL's permission system works with GraphQL:
- Object-level permissions
- Field-level permissions  
- Record-level permissions

### Best Practices

1. **Always Authenticate**: Require authentication for mutations
2. **Validate Input**: ObjectQL validates based on schema
3. **Rate Limit**: Prevent abuse
4. **Sanitize Errors**: Don't expose internal details in production
5. **Use HTTPS**: Always in production

---

## Troubleshooting

### Common Issues

**Query Returns Null**

Check that:
- Object exists in metadata
- ID is correct
- User has permission
- Record exists in database

**Type Errors**

Ensure:
- Variable types match schema
- Required fields are provided
- Field names are correct

**Performance Issues**

Solutions:
- Limit result sets with pagination
- Request only needed fields
- Add database indexes
- Use caching

---

## Examples

### Complete CRUD Example

```graphql
# Create
mutation CreateUser($input: UserInput!) {
  createUser(input: $input) {
    id
    name
    email
  }
}

# Read One
query GetUser($id: String!) {
  user(id: $id) {
    id
    name
    email
    role
  }
}

# Read Many
query ListUsers($limit: Int, $skip: Int) {
  userList(limit: $limit, skip: $skip) {
    id
    name
    email
  }
}

# Update
mutation UpdateUser($id: String!, $input: UserInput!) {
  updateUser(id: $id, input: $input) {
    id
    name
    email
    updated_at
  }
}

# Delete
mutation DeleteUser($id: String!) {
  deleteUser(id: $id) {
    id
    deleted
  }
}
```

---

## Further Reading

- [GraphQL Specification](https://spec.graphql.org/)
- [ObjectQL Query Language](../spec/query-language.md)
- [REST API Documentation](./README.md#rest-style-api)
- [Authentication Guide](./authentication.md)

---

**Last Updated**: January 2026  
**API Version**: 1.0.0
