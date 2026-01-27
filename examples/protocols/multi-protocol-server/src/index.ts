/**
 * Multi-Protocol Server Example
 * 
 * This example demonstrates how to run multiple protocol plugins
 * (OData V4, JSON-RPC 2.0, and GraphQL) on the same ObjectStack kernel.
 */

import { ObjectStackKernel } from '@objectql/runtime';
import { ObjectQLPlugin } from '@objectql/core';
import { MemoryDriver } from '@objectql/driver-memory';
import { ODataV4Plugin } from '@objectql/protocol-odata-v4';
import { JSONRPCPlugin } from '@objectql/protocol-json-rpc';
import { GraphQLPlugin } from '@objectql/protocol-graphql';

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
    new JSONRPCPlugin({ port: 9000, basePath: '/rpc' }),
    new GraphQLPlugin({ port: 4000, introspection: true, playground: true })
  ]);

  for (const [name, metadata] of Object.entries(sampleMetadata)) {
    kernel.metadata.register('object', name, metadata);
  }

  // Setup graceful shutdown handlers
  const shutdown = async (signal: string) => {
    console.log(`\n\n🛑 Received ${signal}, shutting down gracefully...`);
    try {
      await kernel.stop();
      console.log('✅ Server stopped successfully. Goodbye!');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error);
    shutdown('UNCAUGHT_EXCEPTION').catch(() => process.exit(1));
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
    shutdown('UNHANDLED_REJECTION').catch(() => process.exit(1));
  });

  await kernel.start();
  console.log('✅ Server started!\n');
  console.log('💡 Press Ctrl+C to stop the server\n');
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
