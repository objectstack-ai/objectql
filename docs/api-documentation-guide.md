# API Documentation Guide

Comprehensive guide for all ObjectQL API protocols and their documentation.

**Version:** 4.0.5  
**Last Updated:** February 2026

---

## Table of Contents

1. [Overview](#overview)
2. [OpenAPI Documentation (REST)](#openapi-documentation-rest)
3. [GraphQL Schema Documentation](#graphql-schema-documentation)
4. [OData Metadata Documentation](#odata-metadata-documentation)
5. [JSON-RPC API Documentation](#json-rpc-api-documentation)
6. [Common Patterns](#common-patterns)
7. [Client SDK Generation](#client-sdk-generation)
8. [Interactive Documentation](#interactive-documentation)

---

## Overview

ObjectQL provides comprehensive API documentation for all supported protocols:

| Protocol | Documentation Format | Auto-Generated | Interactive UI |
|----------|---------------------|----------------|----------------|
| REST | OpenAPI 3.0 | ✅ Yes | Swagger UI |
| GraphQL | Schema SDL | ✅ Yes | GraphQL Playground |
| OData V4 | EDMX Metadata | ✅ Yes | OData Explorer |
| JSON-RPC | JSON Schema | ⚠️ Partial | Custom UI |

---

## OpenAPI Documentation (REST)

### Auto-Generated OpenAPI Specification

The REST protocol automatically generates an OpenAPI 3.0 specification from your ObjectQL metadata.

#### Accessing the Specification

```bash
# Get OpenAPI spec in JSON format
GET /api/openapi.json

# Get OpenAPI spec in YAML format
GET /api/openapi.yaml
```

#### Configuration

```typescript
import { RESTPlugin } from '@objectql/protocol-rest';

const restPlugin = new RESTPlugin({
  basePath: '/api',
  enableOpenAPI: true,  // Enable OpenAPI generation
  openapi: {
    title: 'My API',
    version: '1.0.0',
    description: 'My ObjectQL REST API',
    servers: [
      { url: 'https://api.example.com', description: 'Production' },
      { url: 'https://staging-api.example.com', description: 'Staging' }
    ],
    security: [
      { bearerAuth: [] }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  }
});
```

#### Generated Specification Structure

```yaml
openapi: 3.0.0
info:
  title: My API
  version: 1.0.0
  description: My ObjectQL REST API

servers:
  - url: https://api.example.com
    description: Production

paths:
  /api/users:
    get:
      summary: List users
      tags: [Users]
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
          description: Number of items to return
        - name: skip
          in: query
          schema:
            type: integer
          description: Number of items to skip
        - name: sort
          in: query
          schema:
            type: string
          description: Sort order (e.g., "-created_at")
      responses:
        200:
          description: Success
          content:
            application/json:
              schema:
                type: object
                properties:
                  items:
                    type: array
                    items:
                      $ref: '#/components/schemas/User'
                  meta:
                    type: object
                    properties:
                      total:
                        type: integer
                      page:
                        type: integer
                      size:
                        type: integer
    
    post:
      summary: Create user
      tags: [Users]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/User'
      responses:
        201:
          description: Created
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: '#/components/schemas/User'
  
  /api/users/{id}:
    get:
      summary: Get user by ID
      tags: [Users]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        200:
          description: Success
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: '#/components/schemas/User'
        404:
          description: Not found
    
    patch:
      summary: Update user
      tags: [Users]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/User'
      responses:
        200:
          description: Updated
    
    delete:
      summary: Delete user
      tags: [Users]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        204:
          description: Deleted

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        email:
          type: string
          format: email
        age:
          type: integer
          minimum: 0
        active:
          type: boolean
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time
      required:
        - name
        - email
```

#### Field Type Mapping

ObjectQL field types are automatically mapped to OpenAPI types:

| ObjectQL Type | OpenAPI Type | Format | Example |
|--------------|--------------|---------|---------|
| `text` | `string` | - | `"Alice"` |
| `email` | `string` | `email` | `"alice@example.com"` |
| `url` | `string` | `uri` | `"https://example.com"` |
| `number` | `number` | - | `42` |
| `integer` | `integer` | - | `42` |
| `boolean` | `boolean` | - | `true` |
| `date` | `string` | `date` | `"2026-02-03"` |
| `datetime` | `string` | `date-time` | `"2026-02-03T10:30:00Z"` |
| `lookup` | `string` | - | `"user-id-123"` |
| `select` | `string` | `enum` | `"active"` |
| `json` | `object` | - | `{"key": "value"}` |

#### Swagger UI Integration

Serve interactive documentation with Swagger UI:

```typescript
import { RESTPlugin } from '@objectql/protocol-rest';
import swaggerUi from 'swagger-ui-express';

const kernel = new ObjectKernel([
  new RESTPlugin({
    basePath: '/api',
    enableOpenAPI: true
  })
]);

// Add Swagger UI middleware (if using Express-compatible server)
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(null, {
  swaggerUrl: '/api/openapi.json',
  customCss: '.swagger-ui .topbar { display: none }'
}));
```

Access at: `http://localhost:3000/api-docs`

---

## GraphQL Schema Documentation

### Auto-Generated GraphQL Schema

GraphQL protocol automatically generates a strongly-typed schema with introspection support.

#### Accessing the Schema

```graphql
# Introspection query
{
  __schema {
    types {
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
}
```

#### Configuration

```typescript
import { GraphQLPlugin } from '@objectql/protocol-graphql';

const graphqlPlugin = new GraphQLPlugin({
  port: 4000,
  introspection: true,      // Enable introspection (default: true)
  playground: true,         // Enable GraphQL Playground (default: true)
  schema: {
    description: 'My ObjectQL GraphQL API',
    deprecationReason: null
  }
});
```

#### Generated Schema Example

```graphql
"""
User entity
"""
type User {
  id: ID!
  name: String!
  email: String!
  age: Int
  active: Boolean
  created_at: DateTime
  updated_at: DateTime
  
  """
  Related projects owned by this user
  """
  projects: [Project!]
}

"""
Project entity
"""
type Project {
  id: ID!
  name: String!
  description: String
  status: String
  owner_id: String
  
  """
  Project owner
  """
  owner: User
}

type Query {
  """
  Get a single user by ID
  """
  users(id: ID!): User
  
  """
  List users with optional filtering
  """
  usersList(
    filter: JSON
    limit: Int
    offset: Int
    orderBy: [OrderByInput!]
  ): [User!]!
  
  """
  Get a single project by ID
  """
  projects(id: ID!): Project
  
  """
  List projects with optional filtering
  """
  projectsList(
    filter: JSON
    limit: Int
    offset: Int
    orderBy: [OrderByInput!]
  ): [Project!]!
}

type Mutation {
  """
  Create a new user
  """
  createUsers(data: JSON!): User!
  
  """
  Update an existing user
  """
  updateUsers(id: ID!, data: JSON!): User!
  
  """
  Delete a user
  """
  deleteUsers(id: ID!): Boolean!
  
  """
  Create a new project
  """
  createProjects(data: JSON!): Project!
  
  """
  Update an existing project
  """
  updateProjects(id: ID!, data: JSON!): Project!
  
  """
  Delete a project
  """
  deleteProjects(id: ID!): Boolean!
}

"""
Scalar type for JSON data
"""
scalar JSON

"""
Scalar type for DateTime
"""
scalar DateTime

"""
Input for ordering results
"""
input OrderByInput {
  field: String!
  order: String!
}
```

#### GraphQL Playground

Access interactive documentation at: `http://localhost:4000`

Features:
- ✅ Auto-complete queries and mutations
- ✅ Schema explorer
- ✅ Query history
- ✅ Variables editor
- ✅ HTTP headers configuration

#### Generating Schema Documentation

Export schema for documentation tools:

```bash
# Export schema SDL
curl -X POST http://localhost:4000 \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __schema { types { name } } }"}' \
  | jq '.data' > schema.graphql

# Use with documentation generators
npx graphdoc -e http://localhost:4000 -o ./docs/graphql
```

---

## OData Metadata Documentation

### Auto-Generated EDMX Metadata

OData V4 protocol generates EDMX (Entity Data Model XML) metadata.

#### Accessing Metadata

```bash
# Get EDMX metadata
GET /odata/$metadata
```

#### Configuration

```typescript
import { ODataV4Plugin } from '@objectql/protocol-odata-v4';

const odataPlugin = new ODataV4Plugin({
  basePath: '/odata',
  namespace: 'MyApp',          // EDMX namespace
  metadata: {
    version: '4.0',
    description: 'My OData Service',
    termsOfService: 'https://example.com/terms'
  }
});
```

#### Generated EDMX Example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<edmx:Edmx xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx" Version="4.0">
  <edmx:DataServices>
    <Schema xmlns="http://docs.oasis-open.org/odata/ns/edm" Namespace="MyApp">
      
      <!-- User Entity Type -->
      <EntityType Name="User">
        <Key>
          <PropertyRef Name="id"/>
        </Key>
        <Property Name="id" Type="Edm.String" Nullable="false"/>
        <Property Name="name" Type="Edm.String" Nullable="false"/>
        <Property Name="email" Type="Edm.String" Nullable="false"/>
        <Property Name="age" Type="Edm.Int32" Nullable="true"/>
        <Property Name="active" Type="Edm.Boolean" Nullable="true"/>
        <Property Name="created_at" Type="Edm.DateTimeOffset" Nullable="true"/>
        <Property Name="updated_at" Type="Edm.DateTimeOffset" Nullable="true"/>
        
        <!-- Navigation Properties -->
        <NavigationProperty Name="projects" Type="Collection(MyApp.Project)"/>
      </EntityType>
      
      <!-- Project Entity Type -->
      <EntityType Name="Project">
        <Key>
          <PropertyRef Name="id"/>
        </Key>
        <Property Name="id" Type="Edm.String" Nullable="false"/>
        <Property Name="name" Type="Edm.String" Nullable="false"/>
        <Property Name="description" Type="Edm.String" Nullable="true"/>
        <Property Name="status" Type="Edm.String" Nullable="true"/>
        <Property Name="owner_id" Type="Edm.String" Nullable="true"/>
        
        <!-- Navigation Properties -->
        <NavigationProperty Name="owner" Type="MyApp.User"/>
      </EntityType>
      
      <!-- Entity Container -->
      <EntityContainer Name="DefaultContainer">
        <EntitySet Name="Users" EntityType="MyApp.User">
          <NavigationPropertyBinding Path="projects" Target="Projects"/>
        </EntitySet>
        <EntitySet Name="Projects" EntityType="MyApp.Project">
          <NavigationPropertyBinding Path="owner" Target="Users"/>
        </EntitySet>
      </EntityContainer>
      
    </Schema>
  </edmx:DataServices>
</edmx:Edmx>
```

#### Field Type Mapping

| ObjectQL Type | EDM Type | Example |
|--------------|----------|---------|
| `text` | `Edm.String` | `"Alice"` |
| `number` | `Edm.Double` | `42.5` |
| `integer` | `Edm.Int32` | `42` |
| `boolean` | `Edm.Boolean` | `true` |
| `date` | `Edm.Date` | `"2026-02-03"` |
| `datetime` | `Edm.DateTimeOffset` | `"2026-02-03T10:30:00Z"` |
| `lookup` | `Edm.String` | `"user-id-123"` |

---

## JSON-RPC API Documentation

### JSON-RPC 2.0 Specification

JSON-RPC protocol follows the JSON-RPC 2.0 specification.

#### Available Methods

```typescript
// System Methods
'system.ping'              // Health check
'system.listObjects'       // List available objects
'system.getMetadata'       // Get object metadata

// Object Methods
'object.create'            // Create record
'object.findOne'           // Find single record
'object.find'              // Query records
'object.update'            // Update record
'object.delete'            // Delete record
'object.count'             // Count records

// Batch Methods (use array of requests)
```

#### Request Format

```json
{
  "jsonrpc": "2.0",
  "method": "object.create",
  "params": ["users", {
    "name": "Alice",
    "email": "alice@example.com"
  }],
  "id": 1
}
```

#### Response Format

```json
{
  "jsonrpc": "2.0",
  "result": {
    "id": "user-123",
    "name": "Alice",
    "email": "alice@example.com",
    "created_at": "2026-02-03T10:30:00Z"
  },
  "id": 1
}
```

#### Error Format

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32600,
    "message": "Invalid Request",
    "data": {
      "field": "email",
      "issue": "Email is required"
    }
  },
  "id": 1
}
```

---

## Common Patterns

### Authentication

All protocols support the same authentication mechanisms:

```javascript
// API Key
fetch('/api/users', {
  headers: {
    'X-API-Key': 'your-api-key'
  }
});

// JWT Bearer Token
fetch('/api/users', {
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIs...'
  }
});

// OAuth 2.0
fetch('/api/users', {
  headers: {
    'Authorization': 'Bearer oauth2-access-token'
  }
});
```

### Pagination

| Protocol | Syntax | Example |
|----------|--------|---------|
| REST | `?limit=10&skip=20` | `/api/users?limit=10&skip=20` |
| GraphQL | `first/after` or `limit/offset` | `usersList(first: 10, after: "cursor")` |
| OData | `$top/$skip` | `/odata/Users?$top=10&$skip=20` |
| JSON-RPC | `limit/skip` in params | `params: ["users", {limit: 10, skip: 20}]` |

### Filtering

| Protocol | Syntax | Example |
|----------|--------|---------|
| REST | Query params | `?active=true&age_gte=18` |
| GraphQL | `filter` argument | `usersList(filter: {active: true})` |
| OData | `$filter` | `$filter=active eq true and age ge 18` |
| JSON-RPC | `filter` in params | `params: ["users", {filter: {active: true}}]` |

### Sorting

| Protocol | Syntax | Example |
|----------|--------|---------|
| REST | `sort` param | `?sort=-created_at,name` |
| GraphQL | `orderBy` argument | `orderBy: [{field: "created_at", order: "DESC"}]` |
| OData | `$orderby` | `$orderby=created_at desc, name asc` |
| JSON-RPC | `sort` in params | `sort: [{created_at: -1}, {name: 1}]` |

---

## Client SDK Generation

Generate type-safe client SDKs from API documentation:

### TypeScript/JavaScript

```bash
# From OpenAPI (REST)
npx openapi-typescript-codegen --input /api/openapi.json --output ./sdk/rest

# From GraphQL
npx graphql-codegen --schema http://localhost:4000 --output ./sdk/graphql
```

### C# / .NET

```bash
# From OData
# Use Visual Studio "Add Service Reference" with /odata/$metadata
# Or use OData CLI:
odata-cli --metadata /odata/$metadata --output ./SDK/OData
```

### Python

```bash
# From OpenAPI
pip install openapi-python-client
openapi-python-client generate --url /api/openapi.json
```

---

## Interactive Documentation

### Recommended Tools

| Protocol | Tool | URL |
|----------|------|-----|
| REST | Swagger UI | `/api-docs` |
| REST | ReDoc | `/api-redoc` |
| GraphQL | GraphQL Playground | `http://localhost:4000` |
| GraphQL | GraphiQL | Custom setup |
| OData | OData Explorer | Third-party tools |
| JSON-RPC | Postman | Import schema |

---

## References

- [OpenAPI 3.0 Specification](https://spec.openapis.org/oas/v3.0.0)
- [GraphQL Specification](https://spec.graphql.org/)
- [OData V4 Specification](https://www.odata.org/documentation/)
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)
- [Protocol Compliance Matrix](./protocol-compliance-matrix.md)
- [Protocol Migration Guide](./protocol-migration-guide.md)

---

**Last Updated:** February 2026  
**Maintained by:** ObjectStack Team  
**License:** MIT
