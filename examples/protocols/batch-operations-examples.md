# Phase 3: Batch Operations Examples

This document provides comprehensive examples of the new batch operation features introduced in Phase 3.

## Table of Contents

1. [JSON-RPC SSE Progress Notifications](#json-rpc-sse-progress-notifications)
2. [JSON-RPC Call Chaining](#json-rpc-call-chaining)
3. [OData $batch Operations](#odata-batch-operations)
4. [OData Atomic Changesets](#odata-atomic-changesets)

---

## JSON-RPC SSE Progress Notifications

### Server-Side Setup

```typescript
import { ObjectKernel } from '@objectstack/runtime';
import { JSONRPCPlugin } from '@objectql/protocol-json-rpc';
import { HonoServerPlugin } from '@objectstack/plugin-hono-server';

const kernel = new ObjectKernel([
  new HonoServerPlugin({ port: 5050 }),
  new JSONRPCPlugin({
    basePath: '/rpc',
    enableProgress: true,  // Enable SSE progress
    enableSessions: true
  })
]);

await kernel.start();
```

### Client-Side: Connecting to Progress Stream

```javascript
// 1. Start a long-running operation
async function startBatchImport() {
  const sessionId = `session_${Date.now()}`;
  
  // Connect to SSE stream first
  const eventSource = new EventSource(`http://localhost:5050/rpc/progress/${sessionId}`);
  
  eventSource.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'connected') {
      console.log('✅ Connected to progress stream');
    } else if (data.method === 'progress.update') {
      const { id, progress, total, message } = data.params;
      const percent = Math.round((progress / total) * 100);
      console.log(`📊 ${id}: ${percent}% - ${message}`);
      
      // Update UI progress bar
      updateProgressBar(percent, message);
    }
  });
  
  eventSource.addEventListener('error', (error) => {
    console.error('❌ SSE connection error:', error);
    eventSource.close();
    
    // Production: Implement reconnection with exponential backoff
    // See Best Practices section below for reconnection logic example
  });
  
  // 2. Start the batch operation
  const response = await fetch('http://localhost:5050/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'object.batchImport',
      params: {
        objectName: 'users',
        records: largeDataset,
        sessionId: sessionId  // Link to SSE session
      },
      id: 1
    })
  });
  
  const result = await response.json();
  console.log('✅ Batch import completed:', result);
  
  // Close SSE connection when done
  eventSource.close();
}

// UI helper
function updateProgressBar(percent, message) {
  document.getElementById('progress-bar').style.width = `${percent}%`;
  document.getElementById('progress-text').textContent = message;
}
```

### Server-Side: Emitting Progress

```typescript
// Example: Custom method that emits progress
import { JSONRPCPlugin } from '@objectql/protocol-json-rpc';

class CustomImportHandler {
  constructor(private rpcPlugin: JSONRPCPlugin) {}
  
  async batchImport(objectName: string, records: any[], sessionId: string) {
    const total = records.length;
    const operationId = `import-${Date.now()}`;
    
    for (let i = 0; i < records.length; i++) {
      // Process record
      await this.processRecord(objectName, records[i]);
      
      // Emit progress
      this.rpcPlugin.emitProgress(
        sessionId,
        operationId,
        i + 1,
        total,
        `Processing record ${i + 1} of ${total}`
      );
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return { imported: total, operationId };
  }
  
  private async processRecord(objectName: string, record: any) {
    // Your record processing logic here
  }
}
```

---

## JSON-RPC Call Chaining

Call chaining allows you to reference results from previous requests in a batch using the `$N.result.path` syntax.

### Example 1: Create User and Project

```javascript
// Create a user, then create a project owned by that user
const batchRequest = [
  {
    jsonrpc: '2.0',
    method: 'object.create',
    params: ['users', {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      role: 'developer'
    }],
    id: 1
  },
  {
    jsonrpc: '2.0',
    method: 'object.create',
    params: ['projects', {
      name: 'New Project',
      description: 'Project description',
      owner: '$1.result._id'  // Reference user ID from request 1
    }],
    id: 2
  }
];

const response = await fetch('http://localhost:5050/rpc', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(batchRequest)
});

const results = await response.json();
console.log('User created:', results[0].result);
console.log('Project created with owner:', results[1].result);
```

### Example 2: Complex Nested References

```javascript
// Create multiple related entities with nested field references
const complexBatch = [
  // 1. Create company
  {
    jsonrpc: '2.0',
    method: 'object.create',
    params: ['companies', {
      name: 'Acme Corp',
      address: { city: 'New York', country: 'USA' }
    }],
    id: 1
  },
  // 2. Create department
  {
    jsonrpc: '2.0',
    method: 'object.create',
    params: ['departments', {
      name: 'Engineering',
      companyId: '$1.result._id'
    }],
    id: 2
  },
  // 3. Create employee
  {
    jsonrpc: '2.0',
    method: 'object.create',
    params: ['employees', {
      name: 'Bob Smith',
      departmentId: '$2.result._id',
      companyId: '$1.result._id',
      location: '$1.result.address.city'  // Nested field reference
    }],
    id: 3
  },
  // 4. Get the created employee with all details
  {
    jsonrpc: '2.0',
    method: 'object.get',
    params: ['employees', '$3.result._id'],
    id: 4
  }
];

const response = await fetch('http://localhost:5050/rpc', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(complexBatch)
});
```

### Example 3: Update and Query

```javascript
// Update a record and then query with the updated value
const updateAndQuery = [
  {
    jsonrpc: '2.0',
    method: 'object.update',
    params: ['users', 'user123', {
      status: 'active',
      lastLogin: new Date().toISOString()
    }],
    id: 1
  },
  {
    jsonrpc: '2.0',
    method: 'object.find',
    params: ['activities', {
      where: {
        userId: 'user123',
        status: '$1.result.status'  // Use the updated status
      }
    }],
    id: 2
  }
];
```

---

## OData $batch Operations

### Basic Batch Request with Mixed Operations

```javascript
async function executeBatchRequest() {
  const boundary = `batch_${Date.now()}`;
  
  // Build multipart batch request
  let body = '';
  
  // Read operation 1: Get all users
  body += `--${boundary}\r\n`;
  body += `Content-Type: application/http\r\n\r\n`;
  body += `GET /odata/users HTTP/1.1\r\n\r\n`;
  
  // Read operation 2: Get specific user
  body += `--${boundary}\r\n`;
  body += `Content-Type: application/http\r\n\r\n`;
  body += `GET /odata/users('user123') HTTP/1.1\r\n\r\n`;
  
  // End batch
  body += `--${boundary}--\r\n`;
  
  const response = await fetch('http://localhost:8080/odata/$batch', {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/mixed; boundary=${boundary}`
    },
    body
  });
  
  const result = await response.text();
  console.log('Batch response:', result);
}
```

---

## OData Atomic Changesets

Changesets ensure that multiple write operations succeed or fail together.

### Example 1: Atomic Multi-Record Creation

```javascript
async function createUsersAtomically(users) {
  const boundary = `batch_${Date.now()}`;
  const changesetBoundary = `changeset_${Date.now()}`;
  
  let body = '';
  
  // Start changeset
  body += `--${boundary}\r\n`;
  body += `Content-Type: multipart/mixed; boundary=${changesetBoundary}\r\n\r\n`;
  
  // Add each user creation to the changeset
  users.forEach(user => {
    body += `--${changesetBoundary}\r\n`;
    body += `Content-Type: application/http\r\n\r\n`;
    body += `POST /odata/users HTTP/1.1\r\n`;
    body += `Content-Type: application/json\r\n\r\n`;
    body += JSON.stringify(user) + '\r\n';
  });
  
  // End changeset and batch
  body += `--${changesetBoundary}--\r\n`;
  body += `--${boundary}--\r\n`;
  
  try {
    const response = await fetch('http://localhost:8080/odata/$batch', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/mixed; boundary=${boundary}`
      },
      body
    });
    
    if (!response.ok) {
      const error = await response.json();
      
      if (error.error?.code === 'CHANGESET_FAILED') {
        console.error('❌ Changeset failed!');
        console.error(`   Failed at operation: ${error.error.details.completedOperations + 1}`);
        console.error(`   Total operations: ${error.error.details.totalOperations}`);
        console.error(`   Rollback attempted: ${error.error.details.rollbackAttempted}`);
        console.error(`   Error: ${error.error.message}`);
      }
      
      throw new Error(error.error?.message || 'Batch operation failed');
    }
    
    console.log('✅ All users created successfully');
    return response;
    
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Usage
const users = [
  { name: 'Alice', email: 'alice@example.com', role: 'admin' },
  { name: 'Bob', email: 'bob@example.com', role: 'user' },
  { name: 'Charlie', email: 'charlie@example.com', role: 'user' }
];

await createUsersAtomically(users);
```

### Example 2: Atomic Update and Delete

```javascript
async function atomicUpdateAndDelete() {
  const boundary = `batch_${Date.now()}`;
  const changesetBoundary = `changeset_${Date.now()}`;
  
  let body = '';
  
  // Start changeset
  body += `--${boundary}\r\n`;
  body += `Content-Type: multipart/mixed; boundary=${changesetBoundary}\r\n\r\n`;
  
  // Update user status
  body += `--${changesetBoundary}\r\n`;
  body += `Content-Type: application/http\r\n\r\n`;
  body += `PATCH /odata/users('user123') HTTP/1.1\r\n`;
  body += `Content-Type: application/json\r\n\r\n`;
  body += JSON.stringify({ status: 'inactive', archived: true }) + '\r\n';
  
  // Delete associated projects
  body += `--${changesetBoundary}\r\n`;
  body += `Content-Type: application/http\r\n\r\n`;
  body += `DELETE /odata/projects('project456') HTTP/1.1\r\n\r\n`;
  
  // End changeset and batch
  body += `--${changesetBoundary}--\r\n`;
  body += `--${boundary}--\r\n`;
  
  const response = await fetch('http://localhost:8080/odata/$batch', {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/mixed; boundary=${boundary}`
    },
    body
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('Changeset failed - all operations rolled back:', error);
    throw error;
  }
  
  console.log('✅ User archived and project deleted atomically');
}
```

### Example 3: Error Handling with Detailed Feedback

```javascript
async function handleBatchErrors() {
  const users = [
    { name: 'User1', email: 'user1@example.com' },
    { name: 'User2', email: 'invalid-email' },  // This will fail validation
    { name: 'User3', email: 'user3@example.com' }
  ];
  
  try {
    await createUsersAtomically(users);
  } catch (error) {
    // Parse the detailed error response
    if (error.message.includes('CHANGESET_FAILED')) {
      console.log('⚠️  The batch operation failed atomically');
      console.log('   None of the users were created (rollback successful)');
      console.log('   Fix the validation error and retry the entire batch');
    }
  }
}
```

---

## Complete Integration Example

Here's a complete example combining SSE progress with batch operations:

```javascript
class BatchImportManager {
  constructor(baseUrl = 'http://localhost:5050') {
    this.baseUrl = baseUrl;
    this.eventSource = null;
  }
  
  async importWithProgress(records) {
    const sessionId = `import_${Date.now()}`;
    
    // Set up progress monitoring
    await this.setupProgressMonitoring(sessionId);
    
    // Execute batch import
    try {
      const result = await this.executeBatchImport(records, sessionId);
      console.log('✅ Import completed:', result);
      return result;
    } finally {
      this.cleanup();
    }
  }
  
  setupProgressMonitoring(sessionId) {
    return new Promise((resolve) => {
      this.eventSource = new EventSource(
        `${this.baseUrl}/rpc/progress/${sessionId}`
      );
      
      this.eventSource.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'connected') {
          console.log('📡 Connected to progress stream');
          resolve();
        } else if (data.method === 'progress.update') {
          const { progress, total, message } = data.params;
          const percent = Math.round((progress / total) * 100);
          console.log(`⏳ ${percent}% - ${message}`);
        }
      });
      
      this.eventSource.addEventListener('error', (error) => {
        console.error('❌ SSE error:', error);
      });
    });
  }
  
  async executeBatchImport(records, sessionId) {
    // Use JSON-RPC batch with chaining for efficiency
    const batchRequests = records.map((record, index) => ({
      jsonrpc: '2.0',
      method: 'object.create',
      params: ['users', record],
      id: index + 1
    }));
    
    const response = await fetch(`${this.baseUrl}/rpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batchRequests)
    });
    
    return response.json();
  }
  
  cleanup() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

// Usage
const manager = new BatchImportManager();
const records = [
  { name: 'Alice', email: 'alice@example.com' },
  { name: 'Bob', email: 'bob@example.com' },
  { name: 'Charlie', email: 'charlie@example.com' }
  // ... many more records
];

await manager.importWithProgress(records);
```

---

## Best Practices

### JSON-RPC Best Practices

1. **Use Progress Notifications for Long Operations**: Any operation taking > 5 seconds should emit progress
2. **Clean Up SSE Connections**: Always close EventSource when done
3. **Handle Connection Errors**: Implement reconnection logic for production
4. **Batch Related Operations**: Group related operations for efficiency

### OData Best Practices

1. **Use Changesets for Related Writes**: Ensure data consistency
2. **Keep Batch Size Reasonable**: Don't exceed ~100 operations per batch
3. **Handle Errors Gracefully**: Check for CHANGESET_FAILED and implement retry logic
4. **Separate Reads and Writes**: Only include write operations in changesets

---

## Configuration Reference

### JSON-RPC Configuration

```typescript
new JSONRPCPlugin({
  basePath: '/rpc',
  enableProgress: true,      // Enable SSE progress
  enableChaining: true,      // Enable call chaining
  enableSessions: true,      // Enable session management
  sessionTimeout: 1800000    // 30 minutes
})
```

### OData Configuration

```typescript
new ODataV4Plugin({
  basePath: '/odata',
  enableBatch: true,         // Enable $batch operations
  enableETags: true,         // Enable optimistic concurrency
  namespace: 'MyApp'
})
```

---

For more information, see:
- [JSON-RPC Protocol Documentation](../../packages/protocols/json-rpc/README.md)
- [OData V4 Protocol Documentation](../../packages/protocols/odata-v4/README.md)
