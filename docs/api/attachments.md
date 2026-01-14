# Attachment API Specification

**Version:** 1.0.0

This document specifies how to handle file uploads, image uploads, and attachment field types in ObjectQL APIs.

> **💡 Quick Guides:**
> - **How to upload multiple files to one field?** → [Multiple File Upload Guide (中文)](../examples/multiple-file-upload-guide-cn.md) ⭐
> - **How to associate attachments with records?** → [Attachment Association Guide (中文)](../examples/attachment-association-guide-cn.md)
> - **How to integrate S3 storage?** → [S3 Integration Guide (中文)](../examples/s3-integration-guide-cn.md)

## Table of Contents

1. [Overview](#overview)
2. [Field Types](#field-types)
3. [Data Format](#data-format)
4. [Upload API](#upload-api)
5. [CRUD Operations with Attachments](#crud-operations-with-attachments)
6. [Download & Access](#download--access)
7. [Best Practices](#best-practices)
8. [Examples](#examples)

---

## Overview

ObjectQL supports two attachment-related field types:

- **`file`**: General file attachments (documents, PDFs, archives, etc.)
- **`image`**: Image files with optional image-specific metadata (including user avatars, product photos, galleries, etc.)

All attachment fields store metadata as JSON in the database, while the actual file content is stored in a configurable storage backend (local filesystem, S3, cloud storage, etc.).

**Note:** User profile pictures (avatars) should use the `image` type with appropriate constraints (e.g., `multiple: false`, size limits, aspect ratio requirements). UI frameworks can identify avatar fields by naming conventions (e.g., `profile_picture`, `avatar`) to apply specific rendering (circular cropping, etc.).

## Design Principles

1. **Metadata-Driven**: File metadata (URL, size, type) is stored in the database
2. **Storage-Agnostic**: Actual files can be stored anywhere (local, S3, CDN)
3. **URL-Based**: Files are referenced by URLs for maximum flexibility
4. **Type-Safe**: Full TypeScript support for attachment data structures
5. **Validation**: Built-in file type, size, and extension validation

---

## Field Types

## `file` Field Type

General-purpose file attachment field.

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `type` | `'file'` | **Required.** Field type identifier |
| `label` | `string` | Display label |
| `required` | `boolean` | Whether file is mandatory |
| `multiple` | `boolean` | Allow multiple file uploads (array) |
| `accept` | `string[]` | Allowed file extensions (e.g., `['.pdf', '.docx']`) |
| `max_size` | `number` | Maximum file size in bytes |
| `min_size` | `number` | Minimum file size in bytes |

**Example Definition:**

```yaml
# expense.object.yml
fields:
  receipt:
    type: file
    label: Receipt Attachment
    required: true
    accept: ['.pdf', '.jpg', '.png']
    max_size: 5242880  # 5MB
  
  supporting_docs:
    type: file
    label: Supporting Documents
    multiple: true
    accept: ['.pdf', '.docx', '.xlsx']
    max_size: 10485760  # 10MB
```

## `image` Field Type

Image-specific attachment field with additional metadata support.

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `type` | `'image'` | **Required.** Field type identifier |
| `label` | `string` | Display label |
| `required` | `boolean` | Whether image is mandatory |
| `multiple` | `boolean` | Allow multiple images (gallery) |
| `accept` | `string[]` | Allowed image formats (default: `['.jpg', '.jpeg', '.png', '.gif', '.webp']`) |
| `max_size` | `number` | Maximum file size in bytes |
| `max_width` | `number` | Maximum image width in pixels |
| `max_height` | `number` | Maximum image height in pixels |
| `min_width` | `number` | Minimum image width in pixels |
| `min_height` | `number` | Minimum image height in pixels |

**Example Definition:**

```yaml
# product.object.yml
fields:
  product_image:
    type: image
    label: Product Image
    required: true
    accept: ['.jpg', '.png', '.webp']
    max_size: 2097152  # 2MB
    max_width: 2000
    max_height: 2000
  
  gallery:
    type: image
    label: Product Gallery
    multiple: true
    max_size: 5242880  # 5MB per image
  
  # User avatar (profile picture)
  profile_picture:
    type: image
    label: Profile Picture
    multiple: false  # Single image only
    max_size: 1048576  # 1MB
    max_width: 500
    max_height: 500
    accept: ['.jpg', '.png', '.webp']
```

---

## Data Format

Attachment fields store structured JSON data containing file metadata. The actual file content is stored separately.

## Single File Format

For non-multiple file/image fields, the data is stored as a single object:

```typescript
interface AttachmentData {
  /** Unique identifier for this file */
  id?: string;
  
  /** File name (e.g., "invoice.pdf") */
  name: string;
  
  /** Publicly accessible URL to the file */
  url: string;
  
  /** File size in bytes */
  size: number;
  
  /** MIME type (e.g., "application/pdf", "image/jpeg") */
  type: string;
  
  /** Original filename as uploaded by user */
  original_name?: string;
  
  /** Upload timestamp (ISO 8601) */
  uploaded_at?: string;
  
  /** User ID who uploaded the file */
  uploaded_by?: string;
}
```

**Example:**

```json
{
  "id": "file_abc123",
  "name": "receipt_2024.pdf",
  "url": "https://cdn.example.com/files/receipt_2024.pdf",
  "size": 245760,
  "type": "application/pdf",
  "original_name": "Receipt - Jan 2024.pdf",
  "uploaded_at": "2024-01-15T10:30:00Z",
  "uploaded_by": "user_xyz"
}
```

## Multiple Files Format

For `multiple: true` fields, the data is an array of attachment objects:

```typescript
type MultipleAttachmentData = AttachmentData[];
```

**Example:**

```json
[
  {
    "id": "img_001",
    "name": "product_front.jpg",
    "url": "https://cdn.example.com/images/product_front.jpg",
    "size": 156789,
    "type": "image/jpeg",
    "uploaded_at": "2024-01-15T10:30:00Z"
  },
  {
    "id": "img_002",
    "name": "product_back.jpg",
    "url": "https://cdn.example.com/images/product_back.jpg",
    "size": 142356,
    "type": "image/jpeg",
    "uploaded_at": "2024-01-15T10:31:00Z"
  }
]
```

## Image-Specific Metadata

Image fields can include additional metadata:

```typescript
interface ImageAttachmentData extends AttachmentData {
  /** Image width in pixels */
  width?: number;
  
  /** Image height in pixels */
  height?: number;
  
  /** Thumbnail URL (if generated) */
  thumbnail_url?: string;
  
  /** Alternative sizes/versions */
  variants?: {
    small?: string;
    medium?: string;
    large?: string;
  };
}
```

**Example:**

```json
{
  "id": "img_abc123",
  "name": "product_hero.jpg",
  "url": "https://cdn.example.com/images/product_hero.jpg",
  "size": 523400,
  "type": "image/jpeg",
  "width": 1920,
  "height": 1080,
  "thumbnail_url": "https://cdn.example.com/images/product_hero_thumb.jpg",
  "variants": {
    "small": "https://cdn.example.com/images/product_hero_small.jpg",
    "medium": "https://cdn.example.com/images/product_hero_medium.jpg",
    "large": "https://cdn.example.com/images/product_hero_large.jpg"
  }
}
```

---

## Upload API

ObjectQL provides dedicated endpoints for file uploads using multipart/form-data.

## Upload Endpoint

```
POST /api/files/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

## Request Format

Use standard multipart form data with the following fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | The file to upload |
| `object` | string | No | Object name (for context/validation) |
| `field` | string | No | Field name (for validation against field config) |
| `folder` | string | No | Logical folder/path for organization |

## Response Format

**Success Response (200 OK):**

```json
{
  "data": {
    "id": "file_abc123",
    "name": "invoice.pdf",
    "url": "https://cdn.example.com/files/invoice.pdf",
    "size": 245760,
    "type": "application/pdf",
    "uploaded_at": "2024-01-15T10:30:00Z",
    "uploaded_by": "user_xyz"
  }
}
```

**Error Response (400 Bad Request):**

```json
{
  "error": {
    "code": "FILE_VALIDATION_ERROR",
    "message": "File validation failed",
    "details": {
      "file": "invoice.exe",
      "reason": "File type not allowed. Allowed types: .pdf, .jpg, .png"
    }
  }
}
```

## Upload Examples

**Using cURL:**

```bash
curl -X POST https://api.example.com/api/files/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/invoice.pdf" \
  -F "object=expense" \
  -F "field=receipt"
```

**Using JavaScript Fetch:**

```javascript
const fileInput = document.getElementById('fileInput');
const file = fileInput.files[0];

const formData = new FormData();
formData.append('file', file);
formData.append('object', 'expense');
formData.append('field', 'receipt');

const response = await fetch('/api/files/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
});

const { data: uploadedFile } = await response.json();
console.log('Uploaded:', uploadedFile);
// { id: 'file_abc123', url: '...', ... }
```

**Using Axios:**

```javascript
import axios from 'axios';

const formData = new FormData();
formData.append('file', file);
formData.append('object', 'expense');
formData.append('field', 'receipt');

const response = await axios.post('/api/files/upload', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
    'Authorization': 'Bearer ' + token
  }
});

const uploadedFile = response.data.data;
```

## Batch Upload

For uploading multiple files at once:

```
POST /api/files/upload/batch
Content-Type: multipart/form-data
```

**Request:**

```bash
curl -X POST https://api.example.com/api/files/upload/batch \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "files=@/path/to/image1.jpg" \
  -F "files=@/path/to/image2.jpg" \
  -F "files=@/path/to/image3.jpg" \
  -F "object=product" \
  -F "field=gallery"
```

**Response:**

```json
{
  "data": [
    {
      "id": "img_001",
      "name": "image1.jpg",
      "url": "https://cdn.example.com/images/image1.jpg",
      "size": 156789,
      "type": "image/jpeg"
    },
    {
      "id": "img_002",
      "name": "image2.jpg",
      "url": "https://cdn.example.com/images/image2.jpg",
      "size": 142356,
      "type": "image/jpeg"
    },
    {
      "id": "img_003",
      "name": "image3.jpg",
      "url": "https://cdn.example.com/images/image3.jpg",
      "size": 198234,
      "type": "image/jpeg"
    }
  ]
}
```

---

## CRUD Operations with Attachments

## Creating Records with Attachments

**Step 1: Upload the file(s)**

```javascript
// Upload file first
const uploadResponse = await fetch('/api/files/upload', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + token },
  body: formData
});

const uploadedFile = (await uploadResponse.json()).data;
```

**Step 2: Create record with file metadata**

```javascript
// Create expense record with the uploaded file
const createResponse = await fetch('/api/objectql', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    op: 'create',
    object: 'expense',
    args: {
      expense_number: 'EXP-2024-001',
      amount: 125.50,
      description: 'Office supplies',
      receipt: uploadedFile  // Reference to uploaded file
    }
  })
});

const expense = (await createResponse.json()).data;
```

**Complete Example (JSON-RPC):**

```json
{
  "op": "create",
  "object": "expense",
  "args": {
    "expense_number": "EXP-2024-001",
    "amount": 125.50,
    "category": "office_supplies",
    "description": "Office supplies - printer paper",
    "receipt": {
      "id": "file_abc123",
      "name": "receipt.pdf",
      "url": "https://cdn.example.com/files/receipt.pdf",
      "size": 245760,
      "type": "application/pdf"
    }
  }
}
```

## Creating with Multiple Attachments

```json
{
  "op": "create",
  "object": "product",
  "args": {
    "name": "Premium Laptop",
    "price": 1299.99,
    "description": "High-performance laptop",
    "gallery": [
      {
        "id": "img_001",
        "name": "laptop_front.jpg",
        "url": "https://cdn.example.com/images/laptop_front.jpg",
        "size": 156789,
        "type": "image/jpeg",
        "width": 1920,
        "height": 1080
      },
      {
        "id": "img_002",
        "name": "laptop_back.jpg",
        "url": "https://cdn.example.com/images/laptop_back.jpg",
        "size": 142356,
        "type": "image/jpeg",
        "width": 1920,
        "height": 1080
      }
    ]
  }
}
```

## Updating Attachments

**Replace entire attachment:**

```json
{
  "op": "update",
  "object": "expense",
  "args": {
    "id": "exp_xyz",
    "data": {
      "receipt": {
        "id": "file_new123",
        "name": "updated_receipt.pdf",
        "url": "https://cdn.example.com/files/updated_receipt.pdf",
        "size": 198234,
        "type": "application/pdf"
      }
    }
  }
}
```

**Add to multiple attachments (array):**

```javascript
// First, fetch the current record
const currentRecord = await fetch('/api/objectql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    op: 'findOne',
    object: 'product',
    args: 'product_123'
  })
}).then(r => r.json());

// Upload new image
const newImage = await uploadFile(file);

// Update with appended gallery
await fetch('/api/objectql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    op: 'update',
    object: 'product',
    args: {
      id: 'product_123',
      data: {
        gallery: [...currentRecord.data.gallery, newImage]
      }
    }
  })
});
```

**Remove attachment:**

```json
{
  "op": "update",
  "object": "expense",
  "args": {
    "id": "exp_xyz",
    "data": {
      "receipt": null
    }
  }
}
```

## Querying Records with Attachments

Attachments are returned as part of the record data:

```json
{
  "op": "find",
  "object": "expense",
  "args": {
    "fields": ["id", "expense_number", "amount", "receipt"],
    "filters": [["status", "=", "approved"]]
  }
}
```

**Response:**

```json
{
  "data": [
    {
      "id": "exp_001",
      "expense_number": "EXP-2024-001",
      "amount": 125.50,
      "receipt": {
        "id": "file_abc123",
        "name": "receipt.pdf",
        "url": "https://cdn.example.com/files/receipt.pdf",
        "size": 245760,
        "type": "application/pdf"
      }
    },
    {
      "id": "exp_002",
      "expense_number": "EXP-2024-002",
      "amount": 89.99,
      "receipt": null  // No receipt attached
    }
  ]
}
```

## Filtering by Attachment Presence

Check if a file is attached:

```json
{
  "op": "find",
  "object": "expense",
  "args": {
    "filters": [["receipt", "!=", null]]
  }
}
```

Check if no file is attached:

```json
{
  "op": "find",
  "object": "expense",
  "args": {
    "filters": [["receipt", "=", null]]
  }
}
```

---

## Download & Access

## Direct URL Access

Files are accessed directly via their `url` property:

```javascript
const expense = await fetchExpense('exp_123');
const receiptUrl = expense.receipt.url;

// Download file
window.open(receiptUrl, '_blank');

// Or display image
document.getElementById('receipt-img').src = receiptUrl;
```

## Secure Download Endpoint

For files requiring authentication:

```
GET /api/files/:fileId
Authorization: Bearer <token>
```

**Example:**

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://api.example.com/api/files/file_abc123 \
  --output receipt.pdf
```

## Thumbnail/Preview Endpoint

For images, request specific sizes:

```
GET /api/files/:fileId/thumbnail?size=small|medium|large
GET /api/files/:fileId/preview?width=200&height=200
```

**Example:**

```html
<!-- Display thumbnail -->
<img src="/api/files/img_abc123/thumbnail?size=medium" alt="Product" />

<!-- Display custom size -->
<img src="/api/files/img_abc123/preview?width=300&height=300" alt="Product" />
```

---

## Best Practices

## Security

1. **Validate File Types**: Always specify `accept` to restrict file types
2. **Enforce Size Limits**: Set appropriate `max_size` to prevent abuse
3. **Scan for Malware**: Integrate virus scanning for uploaded files
4. **Use Signed URLs**: For sensitive files, use time-limited signed URLs
5. **Authenticate Downloads**: Require authentication for private files

## Performance

1. **Use CDN**: Store files on CDN for fast global access
2. **Generate Thumbnails**: Pre-generate image thumbnails for galleries
3. **Lazy Load Images**: Load images on-demand in lists
4. **Compress Images**: Automatically compress uploaded images
5. **Cache Metadata**: Cache file metadata to reduce database queries

## Storage

1. **Organize by Object**: Store files in folders by object type
2. **Use Object Storage**: Use S3, GCS, or Azure Blob for scalability
3. **Implement Cleanup**: Delete orphaned files periodically
4. **Version Files**: Keep file versions for audit trails
5. **Backup Regularly**: Include files in backup strategy

## User Experience

1. **Show Upload Progress**: Display progress bars for large files
2. **Preview Before Upload**: Show image previews before submission
3. **Validate Client-Side**: Check file type/size before upload
4. **Provide Feedback**: Clear error messages for upload failures
5. **Support Drag & Drop**: Enable drag-and-drop file upload

---

## Examples

## Complete Upload & Create Flow

```javascript
/**
 * Upload a file and create an expense record
 */
async function createExpenseWithReceipt(expenseData, receiptFile) {
  // Step 1: Upload the receipt file
  const formData = new FormData();
  formData.append('file', receiptFile);
  formData.append('object', 'expense');
  formData.append('field', 'receipt');
  
  const uploadResponse = await fetch('/api/files/upload', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + getAuthToken()
    },
    body: formData
  });
  
  if (!uploadResponse.ok) {
    throw new Error('File upload failed');
  }
  
  const uploadedFile = (await uploadResponse.json()).data;
  
  // Step 2: Create expense record with file metadata
  const createResponse = await fetch('/api/objectql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + getAuthToken()
    },
    body: JSON.stringify({
      op: 'create',
      object: 'expense',
      args: {
        ...expenseData,
        receipt: uploadedFile
      }
    })
  });
  
  if (!createResponse.ok) {
    throw new Error('Failed to create expense');
  }
  
  return (await createResponse.json()).data;
}

// Usage
const file = document.getElementById('receipt-input').files[0];
const expense = await createExpenseWithReceipt({
  expense_number: 'EXP-2024-001',
  amount: 125.50,
  category: 'office_supplies',
  description: 'Printer paper and toner'
}, file);

console.log('Created expense:', expense);
```

## Product Gallery Management

```javascript
/**
 * Upload multiple images and create product
 */
async function createProductWithGallery(productData, imageFiles) {
  // Upload all images
  const uploadPromises = Array.from(imageFiles).map(async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('object', 'product');
    formData.append('field', 'gallery');
    
    const response = await fetch('/api/files/upload', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + getAuthToken() },
      body: formData
    });
    
    return (await response.json()).data;
  });
  
  const uploadedImages = await Promise.all(uploadPromises);
  
  // Create product with gallery
  const response = await fetch('/api/objectql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + getAuthToken()
    },
    body: JSON.stringify({
      op: 'create',
      object: 'product',
      args: {
        ...productData,
        gallery: uploadedImages
      }
    })
  });
  
  return (await response.json()).data;
}

// Usage
const files = document.getElementById('gallery-input').files;
const product = await createProductWithGallery({
  name: 'Premium Laptop',
  price: 1299.99,
  description: 'High-performance laptop'
}, files);
```

## Update User Avatar

```javascript
/**
 * Update user profile picture
 */
async function updateUserAvatar(userId, avatarFile) {
  // Upload avatar
  const formData = new FormData();
  formData.append('file', avatarFile);
  formData.append('object', 'user');
  formData.append('field', 'profile_picture');
  
  const uploadResponse = await fetch('/api/files/upload', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + getAuthToken() },
    body: formData
  });
  
  const uploadedAvatar = (await uploadResponse.json()).data;
  
  // Update user record
  const updateResponse = await fetch('/api/objectql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + getAuthToken()
    },
    body: JSON.stringify({
      op: 'update',
      object: 'user',
      args: {
        id: userId,
        data: {
          profile_picture: uploadedAvatar
        }
      }
    })
  });
  
  return (await updateResponse.json()).data;
}

// Usage
const avatarFile = document.getElementById('avatar-input').files[0];
const updatedUser = await updateUserAvatar('user_123', avatarFile);
```

## React Component Example

```typescript
import React, { useState } from 'react';
import { ObjectQLClient } from '@objectql/sdk';

interface UploadReceiptProps {
  expenseId?: string;
  onSuccess?: (expense: any) => void;
}

export const UploadReceipt: React.FC<UploadReceiptProps> = ({ 
  expenseId, 
  onSuccess 
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file
    if (!file.type.match(/^(application\/pdf|image\/(jpeg|png))$/)) {
      setError('Only PDF, JPG, and PNG files are allowed');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }
    
    setUploading(true);
    setError(null);
    
    try {
      // Upload file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('object', 'expense');
      formData.append('field', 'receipt');
      
      const uploadResponse = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + getAuthToken()
        },
        body: formData
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }
      
      const uploadedFile = (await uploadResponse.json()).data;
      
      // Update expense with receipt
      const client = new ObjectQLClient();
      const expense = await client.update('expense', expenseId!, {
        receipt: uploadedFile
      });
      
      onSuccess?.(expense);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div>
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileChange}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `FILE_TOO_LARGE` | File exceeds `max_size` limit |
| `FILE_TOO_SMALL` | File is smaller than `min_size` |
| `FILE_TYPE_NOT_ALLOWED` | File extension not in `accept` list |
| `IMAGE_DIMENSIONS_INVALID` | Image dimensions don't meet requirements |
| `UPLOAD_FAILED` | General upload failure |
| `STORAGE_QUOTA_EXCEEDED` | Storage quota exceeded |
| `FILE_NOT_FOUND` | Requested file doesn't exist |
| `FILE_ACCESS_DENIED` | User doesn't have permission to access file |

---

## TypeScript Definitions

```typescript
/**
 * Attachment field data structure
 */
export interface AttachmentData {
  id?: string;
  name: string;
  url: string;
  size: number;
  type: string;
  original_name?: string;
  uploaded_at?: string;
  uploaded_by?: string;
}

/**
 * Image-specific attachment data
 */
export interface ImageAttachmentData extends AttachmentData {
  width?: number;
  height?: number;
  thumbnail_url?: string;
  variants?: {
    small?: string;
    medium?: string;
    large?: string;
  };
}

/**
 * Upload response
 */
export interface UploadResponse {
  data: AttachmentData;
}

/**
 * Batch upload response
 */
export interface BatchUploadResponse {
  data: AttachmentData[];
}
```

---

## Server Implementation

### Setting up File Storage

ObjectQL provides a flexible file storage abstraction that supports multiple backends.

#### Using Local File Storage

```typescript
import { createNodeHandler, LocalFileStorage } from '@objectql/server';
import { ObjectQL } from '@objectql/core';
import * as http from 'http';

const app = new ObjectQL({ /* ... */ });

// Configure local file storage
const fileStorage = new LocalFileStorage({
    baseDir: './uploads',  // or process.env.OBJECTQL_UPLOAD_DIR
    baseUrl: 'http://localhost:3000/api/files'  // or process.env.OBJECTQL_BASE_URL
});

// Create HTTP handler with file storage
const handler = createNodeHandler(app, { fileStorage });

const server = http.createServer(handler);
server.listen(3000);
```

#### Using Memory Storage (For Testing)

```typescript
import { MemoryFileStorage } from '@objectql/server';

const fileStorage = new MemoryFileStorage({
    baseUrl: 'http://localhost:3000/api/files'
});

const handler = createNodeHandler(app, { fileStorage });
```

#### Custom Storage Implementation

You can implement custom storage backends by implementing the `IFileStorage` interface:

```typescript
import { IFileStorage, AttachmentData, FileStorageOptions } from '@objectql/server';

class S3FileStorage implements IFileStorage {
    async save(
        file: Buffer,
        filename: string,
        mimeType: string,
        options?: FileStorageOptions
    ): Promise<AttachmentData> {
        // Upload to S3
        const key = `${options?.folder || 'uploads'}/${Date.now()}-${filename}`;
        await s3.putObject({
            Bucket: 'my-bucket',
            Key: key,
            Body: file,
            ContentType: mimeType
        }).promise();
        
        return {
            id: key,
            name: filename,
            url: `https://my-bucket.s3.amazonaws.com/${key}`,
            size: file.length,
            type: mimeType,
            uploaded_at: new Date().toISOString(),
            uploaded_by: options?.userId
        };
    }
    
    async get(fileId: string): Promise<Buffer | null> {
        // Download from S3
        const result = await s3.getObject({
            Bucket: 'my-bucket',
            Key: fileId
        }).promise();
        
        return result.Body as Buffer;
    }
    
    async delete(fileId: string): Promise<boolean> {
        // Delete from S3
        await s3.deleteObject({
            Bucket: 'my-bucket',
            Key: fileId
        }).promise();
        
        return true;
    }
    
    getPublicUrl(fileId: string): string {
        return `https://my-bucket.s3.amazonaws.com/${fileId}`;
    }
}

// Use custom storage
const fileStorage = new S3FileStorage();
const handler = createNodeHandler(app, { fileStorage });
```

**For detailed S3 integration guide with complete implementation code, see:**
- [S3 Integration Guide (中文)](../examples/s3-integration-guide-cn.md) - Comprehensive Chinese guide
- [S3 Storage Implementation](../examples/s3-storage-implementation.ts) - Production-ready TypeScript code

### API Endpoints

The file upload/download functionality is automatically available when using `createNodeHandler`:

- **POST /api/files/upload** - Single file upload
- **POST /api/files/upload/batch** - Batch file upload
- **GET /api/files/:fileId** - Download file

### File Validation

File validation is automatically enforced based on field configuration:

```yaml
# expense.object.yml
fields:
  receipt:
    type: file
    label: Receipt
    accept: ['.pdf', '.jpg', '.png']  # Only these extensions
    max_size: 5242880  # 5MB max
    min_size: 1024     # 1KB min
```

Validation errors return standardized responses:

```json
{
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size (6000000 bytes) exceeds maximum allowed size (5242880 bytes)",
    "details": {
      "file": "receipt.pdf",
      "size": 6000000,
      "max_size": 5242880
    }
  }
}
```

### Environment Variables

Configure file storage behavior using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `OBJECTQL_UPLOAD_DIR` | Directory for local file storage | `./uploads` |
| `OBJECTQL_BASE_URL` | Base URL for file access | `http://localhost:3000/api/files` |

---

## Related Documentation

- [Object Definition Specification](../spec/object.md) - Field type definitions
- [API Reference](./README.md) - Complete API documentation
- [Validation Rules](../spec/validation.md) - File validation configuration
- [Server Integration](../guide/server-integration.md) - Setting up file storage

---

**Last Updated**: January 2026  
**API Version**: 1.0.0
