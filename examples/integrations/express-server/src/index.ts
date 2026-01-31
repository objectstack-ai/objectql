/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ObjectQLPlugin } from '@objectql/core';
import { SqlDriver } from '@objectql/driver-sql';
import { JSONRPCPlugin } from '@objectql/protocol-json-rpc';
import { GraphQLPlugin } from '@objectql/protocol-graphql';
import { ObjectKernel } from '@objectstack/runtime';

// Define application config with objects converted from YAML
const expressServerApp = {
  name: 'express-server-app',
  label: 'Express Server Example Application',
  description: 'Demonstrates ObjectStack Runtime with JSON-RPC and GraphQL protocols',
  objects: {
    User: {
      name: 'User',
      label: 'Users',
      ai_context: {
        intent: 'Manage user accounts and profiles',
        domain: 'user_management',
        common_queries: [
          'Find active users',
          'List users by age',
          'Search users by email'
        ]
      },
      fields: {
        name: {
          type: 'text',
          label: 'Full Name',
          required: true,
          ai_context: {
            intent: "User's full name for display"
          }
        },
        email: {
          type: 'email',
          label: 'Email Address',
          required: true,
          ai_context: {
            intent: 'Primary contact email and login identifier'
          }
        },
        status: {
          type: 'select',
          label: 'Status',
          options: [
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
            { label: 'Suspended', value: 'suspended' }
          ],
          defaultValue: 'active',
          ai_context: {
            intent: 'Account status',
            is_state_machine: true,
            transitions: {
              active: ['inactive', 'suspended'],
              inactive: ['active'],
              suspended: ['active', 'inactive']
            }
          }
        },
        age: {
          type: 'number',
          label: 'Age',
          ai_context: {
            intent: "User's age for demographic purposes"
          }
        }
      }
    },
    Task: {
      name: 'Task',
      label: 'Tasks',
      ai_context: {
        intent: 'Track individual tasks and their completion status',
        domain: 'task_management',
        common_queries: [
          'Find pending tasks',
          'Show overdue tasks',
          'List tasks by priority'
        ]
      },
      fields: {
        title: {
          type: 'text',
          label: 'Title',
          required: true,
          ai_context: {
            intent: 'Brief description of the task'
          }
        },
        description: {
          type: 'textarea',
          label: 'Description',
          ai_context: {
            intent: 'Detailed task information'
          }
        },
        status: {
          type: 'select',
          label: 'Status',
          options: [
            { label: 'Pending', value: 'pending' },
            { label: 'In Progress', value: 'in_progress' },
            { label: 'Completed', value: 'completed' },
            { label: 'Cancelled', value: 'cancelled' }
          ],
          defaultValue: 'pending',
          ai_context: {
            intent: 'Current state of the task',
            is_state_machine: true,
            transitions: {
              pending: ['in_progress', 'cancelled'],
              in_progress: ['completed', 'pending', 'cancelled'],
              completed: [],
              cancelled: ['pending']
            }
          }
        },
        priority: {
          type: 'select',
          label: 'Priority',
          options: [
            { label: 'Low', value: 'low' },
            { label: 'Medium', value: 'medium' },
            { label: 'High', value: 'high' },
            { label: 'Urgent', value: 'urgent' }
          ],
          defaultValue: 'medium',
          ai_context: {
            intent: 'Task urgency level'
          }
        },
        due_date: {
          type: 'date',
          label: 'Due Date',
          ai_context: {
            intent: 'Deadline for task completion'
          }
        },
        completed: {
          type: 'boolean',
          label: 'Completed',
          defaultValue: false,
          ai_context: {
            intent: 'Quick completion flag'
          }
        }
      }
    }
  }
};

async function main() {
  console.log('🚀 Starting ObjectStack Runtime Server...\n');

  // Create kernel
  const kernel = new ObjectKernel();
  
  // Create driver
  const driver = new SqlDriver({
    client: 'sqlite3',
    connection: {
      filename: ':memory:'
    },
    useNullAsDefault: true
  });

  // Create ObjectQL plugin
  const objectQLPlugin = new ObjectQLPlugin({
    datasources: {
      default: driver
    }
  });

  // Register app metadata with kernel
  if (expressServerApp.objects) {
    for (const [objName, objDef] of Object.entries(expressServerApp.objects)) {
      kernel.metadata.register('object', objName, objDef);
    }
  }

  // Register plugins
  kernel.use(objectQLPlugin);
  kernel.use(new JSONRPCPlugin({ port: 3004, basePath: '/api/objectql' }));
  kernel.use(new GraphQLPlugin({ port: 4000, introspection: true }));

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

  // Bootstrap the kernel
  await kernel.bootstrap();
  
  console.log('\n✅ Server started!\n');
  console.log('📡 Available endpoints:');
  console.log('  - JSON-RPC:  http://localhost:3004/api/objectql');
  console.log('  - GraphQL:   http://localhost:4000/');
  console.log('\n💡 Test the APIs:');
  console.log('\nJSON-RPC Example:');
  console.log('curl -X POST http://localhost:3004/api/objectql \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"jsonrpc":"2.0","method":"object.find","params":["User",{}],"id":1}\'');
  console.log('\nGraphQL Example (open in browser):');
  console.log('http://localhost:4000/');
  console.log('\n💡 Press Ctrl+C to stop the server\n');
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
