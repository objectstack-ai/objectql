/**
 * Multi-Protocol Server Example
 * 
 * This example demonstrates how to run multiple protocol plugins
 * (OData V4 and JSON-RPC 2.0) on the same ObjectStack kernel.
 */

import { ObjectStackKernel } from '@objectql/runtime';
import { ObjectQLPlugin } from '@objectql/core';
import { MemoryDriver } from '@objectql/driver-memory';
import { ODataV4Plugin } from '@objectql/protocol-odata-v4';
import { JSONRPCPlugin } from '@objectql/protocol-json-rpc';

// Define sample metadata
const sampleMetadata = {
  users: {
    name: 'users',
    label: 'Users',
    fields: {
      name: { type: 'text', label: 'Name', required: true },
      email: { type: 'email', label: 'Email', required: true },
      active: { type: 'boolean', label: 'Active', default: true },
      role: { type: 'select', label: 'Role', options: ['admin', 'user', 'guest'] }
    }
  }
};

async function main() {
  console.log('🚀 Starting Multi-Protocol ObjectStack Server...\n');

  const memoryDriver = new MemoryDriver();

  const kernel = new ObjectStackKernel([
    new ObjectQLPlugin({ datasources: { default: memoryDriver } }),
    new ODataV4Plugin({ port: 8080, basePath: '/odata' }),
    new JSONRPCPlugin({ port: 9000, basePath: '/rpc' })
  ]);

  for (const [name, metadata] of Object.entries(sampleMetadata)) {
    kernel.metadata.register('object', name, metadata);
  }

  await kernel.start();
  console.log('✅ Server started!\n');
}

main().catch(console.error);
