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

import { ObjectStackKernel } from '@objectstack/core';
import { ObjectQLPlugin } from '@objectql/core';
import { MemoryDriver } from '@objectql/driver-memory';
import { RestPlugin } from '@objectql/protocol-rest';
import { SwaggerUIPlugin } from '@objectql/protocol-swagger-ui';
import { HonoServerPlugin } from '@objectstack/plugin-hono-server';

// Define a sample CRM application with multiple objects
const crmApp = {
  name: 'crm-app',
  label: 'CRM Application',
  description: 'Customer Relationship Management System',
  objects: {
    accounts: {
      name: 'accounts',
      label: 'Accounts',
      description: 'Companies and organizations',
      fields: {
        name: { 
          type: 'text', 
          label: 'Account Name', 
          required: true,
          description: 'The name of the company or organization'
        },
        industry: { 
          type: 'select', 
          label: 'Industry',
          description: 'Primary industry sector',
          options: ['Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Other']
        },
        revenue: { 
          type: 'number', 
          label: 'Annual Revenue',
          description: 'Annual revenue in USD'
        },
        employees: { 
          type: 'number', 
          label: 'Employee Count',
          description: 'Number of employees'
        },
        website: { 
          type: 'url', 
          label: 'Website',
          description: 'Company website URL'
        },
        active: { 
          type: 'boolean', 
          label: 'Active', 
          default: true,
          description: 'Whether the account is active'
        }
      }
    },
    contacts: {
      name: 'contacts',
      label: 'Contacts',
      description: 'People associated with accounts',
      fields: {
        firstName: { 
          type: 'text', 
          label: 'First Name', 
          required: true,
          description: 'Contact first name'
        },
        lastName: { 
          type: 'text', 
          label: 'Last Name', 
          required: true,
          description: 'Contact last name'
        },
        email: { 
          type: 'email', 
          label: 'Email',
          description: 'Primary email address'
        },
        phone: { 
          type: 'text', 
          label: 'Phone',
          description: 'Primary phone number'
        },
        title: { 
          type: 'text', 
          label: 'Job Title',
          description: 'Job title or position'
        },
        accountId: { 
          type: 'lookup', 
          label: 'Account',
          reference_to: 'accounts',
          description: 'Associated account'
        }
      }
    },
    leads: {
      name: 'leads',
      label: 'Leads',
      description: 'Potential sales opportunities',
      fields: {
        name: { 
          type: 'text', 
          label: 'Lead Name', 
          required: true,
          description: 'Name of the lead or company'
        },
        email: { 
          type: 'email', 
          label: 'Email',
          description: 'Contact email address'
        },
        phone: { 
          type: 'text', 
          label: 'Phone',
          description: 'Contact phone number'
        },
        status: { 
          type: 'select', 
          label: 'Status',
          description: 'Current lead status',
          options: ['New', 'Contacted', 'Qualified', 'Converted', 'Lost'],
          default: 'New'
        },
        source: { 
          type: 'select', 
          label: 'Source',
          description: 'How the lead was acquired',
          options: ['Website', 'Referral', 'Email', 'Social Media', 'Event', 'Other']
        },
        estimatedValue: { 
          type: 'number', 
          label: 'Estimated Value',
          description: 'Estimated deal value in USD'
        }
      }
    },
    opportunities: {
      name: 'opportunities',
      label: 'Opportunities',
      description: 'Active sales opportunities',
      fields: {
        name: { 
          type: 'text', 
          label: 'Opportunity Name', 
          required: true,
          description: 'Name or description of the opportunity'
        },
        accountId: { 
          type: 'lookup', 
          label: 'Account',
          reference_to: 'accounts',
          description: 'Associated account'
        },
        stage: { 
          type: 'select', 
          label: 'Stage',
          description: 'Current sales stage',
          options: ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
          default: 'Prospecting'
        },
        amount: { 
          type: 'number', 
          label: 'Amount',
          description: 'Opportunity value in USD'
        },
        probability: { 
          type: 'number', 
          label: 'Probability (%)',
          description: 'Likelihood of closing (0-100)'
        },
        closeDate: { 
          type: 'date', 
          label: 'Expected Close Date',
          description: 'Expected date to close the deal'
        }
      }
    }
  }
};

async function main() {
  console.log('🚀 Starting Swagger UI Demo Server...\n');

  // Create the kernel with all required components
  const kernel = new ObjectStackKernel([
    // Application manifest (metadata)
    crmApp,
    
    // In-memory driver (for demo purposes)
    new MemoryDriver(),
    
    // Core ObjectQL plugin (provides repository, validator)
    new ObjectQLPlugin(),
    
    // HTTP server plugin (required for REST and Swagger UI)
    new HonoServerPlugin({ 
      port: 3000,
      staticRoot: './public'
    }),
    
    // REST API protocol
    new RestPlugin({ 
      basePath: '/api' 
    }),
    
    // Swagger UI documentation
    new SwaggerUIPlugin({ 
      basePath: '/api-docs',
      title: 'CRM API Documentation',
      swaggerOptions: {
        displayOperationId: true,
        filter: true,
        displayRequestDuration: true
      }
    })
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

  // Start the kernel
  await kernel.start();
  
  console.log('\n✅ Server started successfully!\n');
  console.log('📡 Available endpoints:');
  console.log('  - REST API:      http://localhost:3000/api');
  console.log('  - OpenAPI Spec:  http://localhost:3000/api/openapi.json');
  console.log('  - Swagger UI:    http://localhost:3000/api-docs');
  console.log('\n💡 Open http://localhost:3000/api-docs in your browser to explore the API');
  console.log('💡 Press Ctrl+C to stop the server\n');
  
  // Add some sample data for demonstration
  console.log('📝 Adding sample data...\n');
  try {
    const ctx = (kernel as any).createContext?.({ isSystem: true });
    if (ctx) {
      // Create sample accounts
      await ctx.object('accounts').create({
        name: 'Acme Corporation',
        industry: 'Technology',
        revenue: 5000000,
        employees: 150,
        website: 'https://acme.example.com',
        active: true
      });

      await ctx.object('accounts').create({
        name: 'Global Enterprises',
        industry: 'Finance',
        revenue: 12000000,
        employees: 500,
        website: 'https://global-ent.example.com',
        active: true
      });

      console.log('✅ Sample data added successfully!\n');
    }
  } catch (error) {
    console.log('⚠️  Could not add sample data (context not available):', error.message);
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
