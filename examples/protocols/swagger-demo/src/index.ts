/**
 * Swagger UI Demo Example
 * 
 * This example demonstrates how to use the Swagger UI plugin to provide
 * interactive API documentation for your ObjectQL application.
 * 
 * The example shows:
 * - Setting up REST API with ObjectQL
 * - Configuring Swagger UI for API documentation
 * - Serving both REST endpoints and Swagger UI interface
 */

import { ObjectKernel } from '@objectstack/core';
import { RestPlugin } from '@objectql/protocol-rest';
import { SwaggerUIPlugin } from '@objectql/protocol-swagger-ui';
import { HonoServerPlugin } from '@objectstack/plugin-hono-server';

async function main() {
  console.log('🚀 Starting Swagger UI Demo Server...\n');

  // Create the kernel
  const kernel = new ObjectKernel();
  
  // Register HTTP server plugin (required for REST and Swagger UI)
  kernel.use(new HonoServerPlugin({ 
    port: 3000
  }));
  
  // Register REST API protocol
  kernel.use(new RestPlugin({ 
    basePath: '/api' 
  }));
  
  // Register Swagger UI documentation
  kernel.use(new SwaggerUIPlugin({ 
    basePath: '/api-docs',
    title: 'ObjectQL API Documentation',
    swaggerOptions: {
      displayOperationId: true,
      filter: true,
      displayRequestDuration: true
    }
  }));

  // Setup graceful shutdown handlers
  const shutdown = async (signal: string) => {
    console.log(`\n\n🛑 Received ${signal}, shutting down gracefully...`);
    try {
      await kernel.shutdown();
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

  // Start the kernel (bootstrap all plugins)
  await kernel.bootstrap();
  
  console.log('\n✅ Server started successfully!\n');
  console.log('📡 Available endpoints:');
  console.log('  - REST API:      http://localhost:3000/api');
  console.log('  - OpenAPI Spec:  http://localhost:3000/api/openapi.json');
  console.log('  - Swagger UI:    http://localhost:3000/api-docs');
  console.log('\n💡 Open http://localhost:3000/api-docs in your browser to explore the API');
  console.log('💡 Press Ctrl+C to stop the server\n');
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
