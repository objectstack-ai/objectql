# File Upload Example

This example demonstrates how to use the ObjectQL file upload API.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Run the example:
```bash
ts-node file-upload-example.ts
```

## Code

```typescript
import { ObjectQL } from '@objectql/core';
import { SqlDriver } from '@objectql/driver-sql';
import { createNodeHandler, LocalFileStorage } from '@objectql/server';
import * as http from 'http';
import * as fs from 'fs';

async function main() {
    // 1. Initialize ObjectQL
    const driver = new SqlDriver({
        client: 'sqlite3',
        connection: { filename: './data.db' },
        useNullAsDefault: true
    });

    const app = new ObjectQL({
        datasources: { default: driver }
    });

    // 2. Define expense object with file attachment
    app.registerObject({
        name: 'expense',
        label: 'Expense',
        fields: {
            expense_number: {
                type: 'text',
                required: true,
                label: 'Expense Number'
            },
            amount: {
                type: 'number',
                required: true,
                label: 'Amount'
            },
            receipt: {
                type: 'file',
                label: 'Receipt',
                accept: ['.pdf', '.jpg', '.png'],
                max_size: 5242880 // 5MB
            }
        }
    });

    await app.init();

    // 3. Setup file storage
    const fileStorage = new LocalFileStorage({
        baseDir: './uploads',
        baseUrl: 'http://localhost:3000/api/files'
    });

    // 4. Create HTTP server
    const handler = createNodeHandler(app, { fileStorage });
    const server = http.createServer(handler);

    server.listen(3000, () => {
        console.log('Server running on http://localhost:3000');
        console.log('\nEndpoints:');
        console.log('  POST   /api/files/upload           - Upload a file');
        console.log('  POST   /api/files/upload/batch     - Upload multiple files');
        console.log('  GET    /api/files/:fileId          - Download a file');
        console.log('  POST   /api/objectql               - Execute ObjectQL operations');
        console.log('  GET    /api/data/expense           - List expenses');
        console.log('  GET    /api/data/expense/:id       - Get expense by ID');
        console.log('\nExample upload:');
        console.log('  curl -X POST http://localhost:3000/api/files/upload \\');
        console.log('    -F "file=@receipt.pdf" \\');
        console.log('    -F "object=expense" \\');
        console.log('    -F "field=receipt"');
    });
}

main().catch(console.error);
```

## Usage Examples

### 1. Upload a file

```bash
curl -X POST http://localhost:3000/api/files/upload \
  -F "file=@receipt.pdf" \
  -F "object=expense" \
  -F "field=receipt"
```

Response:
```json
{
  "data": {
    "id": "a1b2c3d4e5f6...",
    "name": "a1b2c3d4e5f6.pdf",
    "url": "http://localhost:3000/api/files/uploads/expense/a1b2c3d4e5f6.pdf",
    "size": 245760,
    "type": "application/pdf",
    "original_name": "receipt.pdf",
    "uploaded_at": "2024-01-15T10:30:00Z"
  }
}
```

### 2. Create expense with uploaded file

```bash
curl -X POST http://localhost:3000/api/objectql \
  -H "Content-Type: application/json" \
  -d '{
    "op": "create",
    "object": "expense",
    "args": {
      "expense_number": "EXP-2024-001",
      "amount": 125.50,
      "receipt": {
        "id": "a1b2c3d4e5f6...",
        "name": "a1b2c3d4e5f6.pdf",
        "url": "http://localhost:3000/api/files/uploads/expense/a1b2c3d4e5f6.pdf",
        "size": 245760,
        "type": "application/pdf",
        "original_name": "receipt.pdf",
        "uploaded_at": "2024-01-15T10:30:00Z"
      }
    }
  }'
```

### 3. Download a file

```bash
curl http://localhost:3000/api/files/a1b2c3d4e5f6 \
  --output receipt.pdf
```

### 4. Query expenses with attachments

```bash
curl "http://localhost:3000/api/data/expense?filter=\[\[\"receipt\",\"!=\",null\]\]"
```

### 5. Upload multiple files (batch)

```bash
curl -X POST http://localhost:3000/api/files/upload/batch \
  -F "files=@image1.jpg" \
  -F "files=@image2.jpg" \
  -F "files=@image3.jpg" \
  -F "object=product" \
  -F "field=gallery"
```

## JavaScript/TypeScript Usage

```typescript
import { ObjectQLClient } from '@objectql/sdk';

const client = new ObjectQLClient({
    baseUrl: 'http://localhost:3000'
});

// Upload a file
async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('object', 'expense');
    formData.append('field', 'receipt');

    const response = await fetch('http://localhost:3000/api/files/upload', {
        method: 'POST',
        body: formData
    });

    const { data: uploadedFile } = await response.json();
    return uploadedFile;
}

// Create expense with uploaded file
async function createExpense(fileData: any) {
    const expense = await client.create('expense', {
        expense_number: 'EXP-2024-001',
        amount: 125.50,
        receipt: fileData
    });

    return expense;
}

// Complete workflow
async function submitExpense(file: File) {
    // Step 1: Upload file
    const uploadedFile = await uploadFile(file);

    // Step 2: Create expense record
    const expense = await createExpense(uploadedFile);

    console.log('Expense created:', expense);
}
```

## React Component Example

```tsx
import React, { useState } from 'react';

export function ExpenseForm() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!file) return;

        setUploading(true);

        try {
            // Upload file
            const formData = new FormData();
            formData.append('file', file);
            formData.append('object', 'expense');
            formData.append('field', 'receipt');

            const uploadResponse = await fetch('/api/files/upload', {
                method: 'POST',
                body: formData
            });

            const { data: uploadedFile } = await uploadResponse.json();

            // Create expense
            const createResponse = await fetch('/api/objectql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    op: 'create',
                    object: 'expense',
                    args: {
                        expense_number: 'EXP-2024-001',
                        amount: 125.50,
                        receipt: uploadedFile
                    }
                })
            });

            const expense = await createResponse.json();
            alert('Expense created successfully!');
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="file"
                accept=".pdf,.jpg,.png"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <button type="submit" disabled={!file || uploading}>
                {uploading ? 'Uploading...' : 'Submit Expense'}
            </button>
        </form>
    );
}
```
