# @objectql/server-rest Changelog

## [4.0.2] - 2026-01-30

### Added
- Initial release as a separate package
- Extracted from `@objectql/server` as part of plugin-based architecture subdivision
- REST API handler (`createRESTHandler`)
- Node.js HTTP adapter (`createNodeHandler`)
- OpenAPI 3.0 specification generation

### Features
- Full CRUD operations via REST endpoints
- Express and Next.js compatibility
- Query parameter support
- Pagination support
- Error handling with standardized error responses

## Migration from @objectql/server

The API remains unchanged. You can continue importing from `@objectql/server`:

```typescript
import { createRESTHandler, createNodeHandler } from '@objectql/server';
```

Or import directly from this package:

```typescript
import { createRESTHandler, createNodeHandler } from '@objectql/server-rest';
```
