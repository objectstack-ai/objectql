# @objectql/server-storage Changelog

## [4.0.2] - 2026-01-30

### Added
- Initial release as a separate package
- Extracted from `@objectql/server` as part of plugin-based architecture subdivision
- `LocalFileStorage` - File system storage implementation
- `MemoryFileStorage` - In-memory storage implementation
- `createFileUploadHandler` - Multipart file upload handler
- `createBatchFileUploadHandler` - Batch file upload handler
- `createFileDownloadHandler` - File download handler

### Features
- Multipart/form-data parsing
- File validation (size, type)
- Storage abstraction with `IFileStorage` interface
- Local file system and memory storage backends
- Batch upload support

## Migration from @objectql/server

The API remains unchanged. You can continue importing from `@objectql/server`:

```typescript
import { LocalFileStorage, createFileUploadHandler } from '@objectql/server';
```

Or import directly from this package:

```typescript
import { LocalFileStorage, createFileUploadHandler } from '@objectql/server-storage';
```
