# Attachment Upload Demo

This example demonstrates how to upload files and create records with attachments using the ObjectQL API.

## Prerequisites

- ObjectQL server running at `http://localhost:3000`
- Authentication token (if required)
- Node.js or browser environment

## Example 1: Upload and Create Expense with Receipt

### Step 1: Upload the Receipt File

```javascript
// Upload file using fetch API
const fileInput = document.getElementById('receipt-file');
const file = fileInput.files[0];

const formData = new FormData();
formData.append('file', file);
formData.append('object', 'expense');
formData.append('field', 'receipt');

const uploadResponse = await fetch('http://localhost:3000/api/files/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: formData
});

const { data: uploadedFile } = await uploadResponse.json();
console.log('Uploaded file:', uploadedFile);
// Output: { id: 'file_abc123', name: 'receipt.pdf', url: '...', size: 245760, type: 'application/pdf' }
```

### Step 2: Create Expense Record

```javascript
const createResponse = await fetch('http://localhost:3000/api/objectql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: JSON.stringify({
    op: 'create',
    object: 'expense',
    args: {
      expense_number: 'EXP-2024-001',
      amount: 125.50,
      category: 'office_supplies',
      description: 'Printer paper and toner',
      receipt: uploadedFile  // Reference to the uploaded file
    }
  })
});

const { data: expense } = await createResponse.json();
console.log('Created expense:', expense);
```

## Example 2: Product Gallery with Multiple Images

### Upload Multiple Images

```javascript
const imageFiles = document.getElementById('gallery-input').files;

// Upload all images in parallel
const uploadPromises = Array.from(imageFiles).map(async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('object', 'product');
  formData.append('field', 'gallery');
  
  const response = await fetch('http://localhost:3000/api/files/upload', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
    },
    body: formData
  });
  
  return (await response.json()).data;
});

const uploadedImages = await Promise.all(uploadPromises);
console.log('Uploaded images:', uploadedImages);
```

### Create Product with Gallery

```javascript
const createResponse = await fetch('http://localhost:3000/api/objectql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: JSON.stringify({
    op: 'create',
    object: 'product',
    args: {
      name: 'Premium Laptop',
      price: 1299.99,
      description: 'High-performance laptop for professionals',
      gallery: uploadedImages  // Array of uploaded images
    }
  })
});

const { data: product } = await createResponse.json();
console.log('Created product:', product);
```

## Example 3: Update User Profile Picture (Avatar)

```javascript
// Upload new profile picture
const avatarFile = document.getElementById('avatar-input').files[0];

const formData = new FormData();
formData.append('file', avatarFile);
formData.append('object', 'user');
formData.append('field', 'profile_picture');

const uploadResponse = await fetch('http://localhost:3000/api/files/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: formData
});

const { data: uploadedImage } = await uploadResponse.json();

// Update user record with new profile picture
const updateResponse = await fetch('http://localhost:3000/api/objectql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: JSON.stringify({
    op: 'update',
    object: 'user',
    args: {
      id: 'user_123',
      data: {
        profile_picture: uploadedImage  // image type field
      }
    }
  })
});

const { data: updatedUser } = await updateResponse.json();
console.log('Updated user:', updatedUser);
```

## Example 4: Query Records with Attachments

### Find Expenses with Receipts

```javascript
const response = await fetch('http://localhost:3000/api/objectql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: JSON.stringify({
    op: 'find',
    object: 'expense',
    args: {
      fields: ['id', 'expense_number', 'amount', 'receipt'],
      filters: [
        ['receipt', '!=', null]  // Only expenses with receipts
      ]
    }
  })
});

const { data: expenses } = await response.json();
console.log('Expenses with receipts:', expenses);

// Display receipt URLs
expenses.forEach(expense => {
  if (expense.receipt) {
    console.log(`Receipt for ${expense.expense_number}: ${expense.receipt.url}`);
  }
});
```

## Example 5: Complete React Component

```typescript
import React, { useState } from 'react';

interface UploadReceiptProps {
  onSuccess?: (expense: any) => void;
}

export const UploadReceiptForm: React.FC<UploadReceiptProps> = ({ onSuccess }) => {
  const [expenseNumber, setExpenseNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a receipt file');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Step 1: Upload file
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
        throw new Error('File upload failed');
      }

      const uploadedFile = (await uploadResponse.json()).data;

      // Step 2: Create expense
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
            expense_number: expenseNumber,
            amount: parseFloat(amount),
            description,
            receipt: uploadedFile
          }
        })
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create expense');
      }

      const expense = (await createResponse.json()).data;
      
      // Reset form
      setExpenseNumber('');
      setAmount('');
      setDescription('');
      setFile(null);
      
      onSuccess?.(expense);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Expense Number:</label>
        <input
          type="text"
          value={expenseNumber}
          onChange={(e) => setExpenseNumber(e.target.value)}
          required
        />
      </div>

      <div>
        <label>Amount:</label>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>

      <div>
        <label>Description:</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div>
        <label>Receipt:</label>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          required
        />
      </div>

      {error && <div style={{ color: 'red' }}>{error}</div>}

      <button type="submit" disabled={uploading}>
        {uploading ? 'Uploading...' : 'Create Expense'}
      </button>
    </form>
  );
};

function getAuthToken(): string {
  // Implement your auth token retrieval logic
  return localStorage.getItem('auth_token') || '';
}
```

## Error Handling

### File Too Large

```javascript
try {
  const response = await fetch('/api/files/upload', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token },
    body: formData
  });

  const result = await response.json();
  
  if (!response.ok) {
    // Handle error
    if (result.error.code === 'FILE_TOO_LARGE') {
      console.error('File exceeds maximum size limit');
    } else if (result.error.code === 'FILE_TYPE_NOT_ALLOWED') {
      console.error('File type not allowed');
    }
  }
} catch (err) {
  console.error('Upload failed:', err);
}
```

## Related Documentation

- [Attachment API Specification](../docs/api/attachments.md)
- [Complete API Reference](../docs/api/README.md)
- [Object Definition Specification](../docs/spec/object.md)
