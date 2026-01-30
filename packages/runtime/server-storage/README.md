# @objectql/server-storage

File storage adapter for ObjectQL - File upload/download handlers with local and memory storage.

## Overview

This package provides file storage adapters for ObjectQL, extracted from the monolithic `@objectql/server` package as part of the plugin-based architecture subdivision.

## Installation

```bash
pnpm add @objectql/server-storage
```

## Features

- **File Upload** - Multipart file upload handling
- **File Download** - File serving and download
- **Batch Upload** - Multiple file upload support
- **Storage Backends** - Local file system and in-memory storage
- **File Validation** - Size and type restrictions

## Usage

### With Express

```typescript
import express from 'express';
import { LocalFileStorage, createFileUploadHandler, createFileDownloadHandler } from '@objectql/server-storage';
import { app } from './objectql';

const server = express();
const storage = new LocalFileStorage({ storagePath: './uploads' });

const uploadHandler = createFileUploadHandler(storage, app);
const downloadHandler = createFileDownloadHandler(storage);

server.post('/api/files/upload', uploadHandler);
server.get('/api/files/:id', downloadHandler);
server.listen(3000);
```

## Storage Backends

### LocalFileStorage

Stores files in the local file system:

```typescript
const storage = new LocalFileStorage({
  storagePath: './uploads',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'application/pdf']
});
```

### MemoryFileStorage

Stores files in memory (for testing):

```typescript
const storage = new MemoryFileStorage();
```

## File Upload

Upload files using multipart/form-data:

```bash
curl -X POST \
  -F "file=@document.pdf" \
  -F "object=contracts" \
  -F "field=attachment" \
  http://localhost:3000/api/files/upload
```

Response:

```json
{
  "id": "abc123",
  "filename": "document.pdf",
  "size": 12345,
  "contentType": "application/pdf",
  "url": "/api/files/abc123"
}
```

## Architecture

This package is part of the ObjectQL micro-kernel architecture, which follows the principle of separating concerns into focused, independently versioned packages.

### Related Packages

- `@objectql/server` - Core server types and utilities
- `@objectql/server-rest` - REST adapter
- `@objectql/server-graphql` - GraphQL adapter
- `@objectql/server-metadata` - Metadata API adapter

## License

MIT
