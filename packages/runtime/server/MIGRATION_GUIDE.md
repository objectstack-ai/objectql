# API Response Format Migration Guide

This document outlines the changes made to standardize ObjectQL API response formats.

## Overview

The ObjectQL API has been updated to use a consistent response format across all endpoints. This change affects both data APIs and metadata APIs.

## Changes Summary

### Before (Old Format)

**List Operations:**
```json
{
  "data": [
    { "id": "1", "name": "Item 1" },
    { "id": "2", "name": "Item 2" }
  ]
}
```

**Metadata List:**
```json
{
  "objects": [
    { "name": "contract", "label": "Contract" },
    { "name": "invoice", "label": "Invoice" }
  ]
}
```

### After (New Format)

**List Operations (without pagination):**
```json
{
  "items": [
    { "id": "1", "name": "Item 1" },
    { "id": "2", "name": "Item 2" }
  ]
}
```

**List Operations (with pagination):**
```json
{
  "items": [
    { "id": "1", "name": "Item 1" },
    { "id": "2", "name": "Item 2" }
  ],
  "meta": {
    "total": 105,       // Total number of records
    "page": 1,          // Current page number (1-indexed)
    "size": 20,         // Items per page
    "pages": 6,         // Total number of pages
    "has_next": true    // Whether there is a next page
  }
}
```

**Single Item Operations (unchanged):**
```json
{
  "data": {
    "id": "1",
    "name": "Item 1"
  }
}
```

**Metadata Lists:**
```json
{
  "items": [
    { "name": "contract", "label": "Contract" },
    { "name": "invoice", "label": "Invoice" }
  ]
}
```

## Pagination Metadata

The `meta` object is only included when pagination parameters (`limit` and/or `skip`) are provided in the request.

### Pagination Parameters

- `limit` or `top` - Number of items per page
- `skip` or `offset` - Number of items to skip

### Metadata Fields

- `total` - Total number of records matching the query
- `page` - Current page number (1-indexed)
- `size` - Number of items per page
- `pages` - Total number of pages
- `has_next` - Boolean indicating if there are more pages

## Breaking Changes

### For Frontend Applications

If you're consuming the API from a frontend application, you'll need to update your code:

**Before:**
```typescript
const response = await fetch('/api/data/contracts');
const data = await response.json();
const contracts = data.data; // Old format
```

**After:**
```typescript
const response = await fetch('/api/data/contracts');
const data = await response.json();
const contracts = data.items; // New format

// Access pagination metadata if available
if (data.meta) {
  console.log(`Page ${data.meta.page} of ${data.meta.pages}`);
  console.log(`Total: ${data.meta.total} records`);
}
```

### For Metadata Endpoints

**Before:**
```typescript
const response = await fetch('/api/metadata/object');
const data = await response.json();
const objects = data.objects; // or data.object
```

**After:**
```typescript
const response = await fetch('/api/metadata/object');
const data = await response.json();
const objects = data.items;
```

## Migration Strategy

### Gradual Migration

If you need to support both formats during migration, you can use a compatibility layer:

```typescript
function getItems(response: any): any[] {
  // Support both old and new formats
  return response.items || response.data || response.objects || response.object || [];
}

const response = await fetch('/api/data/contracts');
const data = await response.json();
const contracts = getItems(data);
```

### Type Definitions

Update your TypeScript interfaces:

```typescript
// New response types
interface ListResponse<T> {
  items: T[];
  meta?: PaginationMeta;
}

interface SingleItemResponse<T> {
  data: T;
}

interface PaginationMeta {
  total: number;
  page?: number;
  size?: number;
  pages?: number;
  has_next?: boolean;
}

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

## Benefits

1. **Consistency** - All list endpoints use the same `items` format
2. **Clear Semantics** - `items` for lists, `data` for single items
3. **Rich Pagination** - Comprehensive metadata for implementing pagination UI
4. **Forward Compatibility** - Structured format allows adding more metadata in the future
5. **Industry Standard** - Aligns with common REST API conventions

## Examples

### Example 1: Paginated List Request

```bash
GET /api/data/contracts?limit=10&skip=0
```

```json
{
  "items": [
    { "id": "1", "name": "Contract A", "amount": 5000 },
    { "id": "2", "name": "Contract B", "amount": 3000 }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "size": 10,
    "pages": 3,
    "has_next": true
  }
}
```

### Example 2: Non-Paginated List Request

```bash
GET /api/data/contracts
```

```json
{
  "items": [
    { "id": "1", "name": "Contract A", "amount": 5000 },
    { "id": "2", "name": "Contract B", "amount": 3000 },
    { "id": "3", "name": "Contract C", "amount": 7500 }
  ]
}
```

Note: No `meta` object when pagination parameters are not provided.

### Example 3: Single Item Request

```bash
GET /api/data/contracts/1
```

```json
{
  "data": {
    "id": "1",
    "name": "Contract A",
    "amount": 5000
  }
}
```

### Example 4: Metadata List

```bash
GET /api/metadata/object
```

```json
{
  "items": [
    { "name": "contract", "label": "Contract", "icon": "document" },
    { "name": "invoice", "label": "Invoice", "icon": "receipt" }
  ]
}
```

## Support

For questions or issues with the migration, please:
1. Check the [updated documentation](../README.md)
2. Review the [integration examples](../test/integration-example.ts)
3. Open an issue on GitHub
