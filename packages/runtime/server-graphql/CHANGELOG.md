# @objectql/server-graphql Changelog

## [4.0.2] - 2026-01-30

### Added
- Initial release as a separate package
- Extracted from `@objectql/server` as part of plugin-based architecture subdivision
- GraphQL schema generation (`generateGraphQLSchema`)
- GraphQL request handler (`createGraphQLHandler`)

### Features
- Automatic schema generation from ObjectQL metadata
- Type mapping from ObjectQL to GraphQL
- Query and mutation resolvers
- Apollo Sandbox support
- Introspection support

## Migration from @objectql/server

The API remains unchanged. You can continue importing from `@objectql/server`:

```typescript
import { createGraphQLHandler } from '@objectql/server';
```

Or import directly from this package:

```typescript
import { createGraphQLHandler } from '@objectql/server-graphql';
```
