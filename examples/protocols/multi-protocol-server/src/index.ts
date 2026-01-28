/**
 * Multi-Protocol Server Example
 * 
 * This example demonstrates how to run multiple protocol plugins
 * (OData V4, JSON-RPC 2.0, and GraphQL) on the same ObjectStack kernel
 * using the new micro-kernel pattern.
 * 
 * The micro-kernel pattern allows you to pass a heterogeneous array of:
 * - Application configs (metadata manifests)
 * - Drivers (database/storage adapters)
 * - Plugins (protocol adapters, features)
 */

import { ObjectStackKernel } from '@objectstack/runtime';
import { ObjectQLPlugin } from '@objectql/core';
import { MemoryDriver } from '@objectql/driver-memory';
import { ODataV4Plugin } from '@objectql/protocol-odata-v4';
import { JSONRPCPlugin } from '@objectql/protocol-json-rpc';
import { GraphQLPlugin } from '@objectql/protocol-graphql';

// Define sample application config
const sampleApp = {
  name: 'sample-app',
  label: 'Sample Application',
  description: 'A sample multi-protocol application',
  objects: {
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
  }
};

async function main() {
  console.log('🚀 Starting Multi-Protocol ObjectStack Server (Micro-Kernel Pattern)...\n');

  // Create the kernel with the micro-kernel pattern
  // All components (apps, drivers, plugins) are passed together
  const kernel = new ObjectStackKernel([
    // Application manifest (metadata)
    sampleApp,
    
    // Driver (database/storage)
    new MemoryDriver(),
    
    // Core ObjectQL plugin (provides repository, validator, formulas)
    // Note: datasources parameter is now optional - it will use drivers from kernel
    new ObjectQLPlugin(),
    
    // Protocol plugins
    new ODataV4Plugin({ port: 8080, basePath: '/odata' }),
    new JSONRPCPlugin({ port: 9000, basePath: '/rpc' }),
    new GraphQLPlugin({ port: 4000, introspection: true })
  ]);

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

  // Start the kernel - this will:
  // 1. Load application manifests
  // 2. Connect drivers
  // 3. Install plugins
  // 4. Start plugins (protocol servers)
  await kernel.start();
  
  console.log('\n✅ Server started!\n');
  console.log('📡 Available endpoints:');
  console.log('  - OData V4:  http://localhost:8080/odata');
  console.log('  - JSON-RPC:  http://localhost:9000/rpc');
  console.log('  - GraphQL:   http://localhost:4000/');
  console.log('\n💡 Press Ctrl+C to stop the server\n');
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
