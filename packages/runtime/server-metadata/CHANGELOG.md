# @objectql/server-metadata Changelog

## [4.0.2] - 2026-01-30

### Added
- Initial release as a separate package
- Extracted from `@objectql/server` as part of plugin-based architecture subdivision
- Metadata API handler (`createMetadataHandler`)
- Welcome page HTML template

### Features
- Object metadata listing and retrieval
- Field metadata access
- Action discovery
- Standardized response format with `items` array
- HTML landing page for API discovery

## Migration from @objectql/server

The API remains unchanged. You can continue importing from `@objectql/server`:

```typescript
import { createMetadataHandler } from '@objectql/server';
```

Or import directly from this package:

```typescript
import { createMetadataHandler } from '@objectql/server-metadata';
```
