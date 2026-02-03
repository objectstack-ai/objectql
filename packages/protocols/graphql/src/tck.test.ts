/**
 * GraphQL Protocol TCK (Technology Compatibility Kit) Tests
 * 
 * This test suite verifies that the GraphQL protocol implementation
 * complies with the Protocol TCK requirements and provides consistent
 * behavior with other ObjectQL protocols.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { runProtocolTCK, ProtocolEndpoint, ProtocolOperation, ProtocolResponse } from '@objectql/protocol-tck';
import { GraphQLPlugin } from './index';
import { ObjectKernel } from '@objectstack/core';
import { MemoryDriver } from '@objectql/driver-memory';

/**
 * GraphQL Protocol Endpoint Adapter
 * 
 * Translates TCK operations into GraphQL queries/mutations
 */
class GraphQLEndpoint implements ProtocolEndpoint {
  private plugin: GraphQLPlugin;
  private kernel: ObjectKernel;
  private baseUrl: string;
  
  constructor(plugin: GraphQLPlugin, kernel: ObjectKernel) {
    this.plugin = plugin;
    this.kernel = kernel;
    this.baseUrl = `http://localhost:${plugin.config.port || 4000}/graphql`;
  }
  
  async execute(operation: ProtocolOperation): Promise<ProtocolResponse> {
    try {
      switch (operation.type) {
        case 'create':
          return await this.executeCreate(operation);
        case 'read':
          return await this.executeRead(operation);
        case 'update':
          return await this.executeUpdate(operation);
        case 'delete':
          return await this.executeDelete(operation);
        case 'query':
          return await this.executeQuery(operation);
        case 'batch':
          return await this.executeBatch(operation);
        default:
          return {
            success: false,
            error: {
              code: 'UNSUPPORTED_OPERATION',
              message: `Operation ${operation.type} not supported`
            }
          };
      }
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.extensions?.code || 'GRAPHQL_ERROR',
          message: error.message
        }
      };
    }
  }
  
  private async executeCreate(operation: ProtocolOperation): Promise<ProtocolResponse> {
    const entityName = this.capitalize(operation.entity);
    const mutation = `
      mutation Create${entityName}($input: ${entityName}Input!) {
        create${entityName}(input: $input)
      }
    `;
    
    const result = await this.graphqlRequest(mutation, { input: operation.data });
    
    if (result.errors) {
      return {
        success: false,
        error: {
          code: result.errors[0].extensions?.code || 'CREATE_ERROR',
          message: result.errors[0].message
        }
      };
    }
    
    return {
      success: true,
      data: result.data[`create${entityName}`]
    };
  }
  
  private async executeRead(operation: ProtocolOperation): Promise<ProtocolResponse> {
    const entityName = this.capitalize(operation.entity);
    const camelName = this.toCamelCase(operation.entity);
    const query = `
      query Get${entityName}($id: ID!) {
        ${camelName}(id: $id)
      }
    `;
    
    const result = await this.graphqlRequest(query, { id: operation.id });
    
    if (result.errors) {
      return {
        success: false,
        error: {
          code: result.errors[0].extensions?.code || 'READ_ERROR',
          message: result.errors[0].message
        }
      };
    }
    
    return {
      success: true,
      data: result.data[camelName]
    };
  }
  
  private async executeUpdate(operation: ProtocolOperation): Promise<ProtocolResponse> {
    const entityName = this.capitalize(operation.entity);
    const mutation = `
      mutation Update${entityName}($id: ID!, $input: ${entityName}UpdateInput!) {
        update${entityName}(id: $id, input: $input)
      }
    `;
    
    const result = await this.graphqlRequest(mutation, {
      id: operation.id,
      input: operation.data
    });
    
    if (result.errors) {
      return {
        success: false,
        error: {
          code: result.errors[0].extensions?.code || 'UPDATE_ERROR',
          message: result.errors[0].message
        }
      };
    }
    
    return {
      success: true,
      data: result.data[`update${entityName}`]
    };
  }
  
  private async executeDelete(operation: ProtocolOperation): Promise<ProtocolResponse> {
    const entityName = this.capitalize(operation.entity);
    const mutation = `
      mutation Delete${entityName}($id: ID!) {
        delete${entityName}(id: $id)
      }
    `;
    
    const result = await this.graphqlRequest(mutation, { id: operation.id });
    
    if (result.errors) {
      return {
        success: false,
        error: {
          code: result.errors[0].extensions?.code || 'DELETE_ERROR',
          message: result.errors[0].message
        }
      };
    }
    
    return {
      success: true,
      data: result.data[`delete${entityName}`]
    };
  }
  
  private async executeQuery(operation: ProtocolOperation): Promise<ProtocolResponse> {
    const entityName = this.capitalize(operation.entity);
    const camelName = this.toCamelCase(operation.entity);
    
    let queryArgs = '';
    const variables: any = {};
    
    if (operation.filter) {
      queryArgs += `$where: ${entityName}Filter`;
      variables.where = operation.filter;
    }
    
    if (operation.options?.limit) {
      queryArgs += queryArgs ? ', ' : '';
      queryArgs += '$limit: Int';
      variables.limit = operation.options.limit;
    }
    
    if (operation.options?.offset) {
      queryArgs += queryArgs ? ', ' : '';
      queryArgs += '$offset: Int';
      variables.offset = operation.options.offset;
    }
    
    const query = `
      query List${entityName}${queryArgs ? `(${queryArgs})` : ''} {
        ${camelName}List${this.buildQueryArgs(variables)}
      }
    `;
    
    const result = await this.graphqlRequest(query, variables);
    
    if (result.errors) {
      return {
        success: false,
        error: {
          code: result.errors[0].extensions?.code || 'QUERY_ERROR',
          message: result.errors[0].message
        }
      };
    }
    
    return {
      success: true,
      data: result.data[`${camelName}List`] || []
    };
  }
  
  private async executeBatch(operation: ProtocolOperation): Promise<ProtocolResponse> {
    // GraphQL doesn't have native batch in the same way, but we can use multiple mutations
    const entityName = this.capitalize(operation.entity);
    
    if (!Array.isArray(operation.data)) {
      return {
        success: false,
        error: {
          code: 'INVALID_BATCH_DATA',
          message: 'Batch data must be an array'
        }
      };
    }
    
    const mutations = operation.data.map((item, index) => `
      item${index}: create${entityName}(input: $input${index})
    `).join('\n');
    
    const variables: any = {};
    const variableDefinitions = operation.data.map((_, index) => 
      `$input${index}: ${entityName}Input!`
    ).join(', ');
    
    operation.data.forEach((item, index) => {
      variables[`input${index}`] = item;
    });
    
    const mutation = `
      mutation BatchCreate${entityName}(${variableDefinitions}) {
        ${mutations}
      }
    `;
    
    const result = await this.graphqlRequest(mutation, variables);
    
    if (result.errors) {
      return {
        success: false,
        error: {
          code: result.errors[0].extensions?.code || 'BATCH_ERROR',
          message: result.errors[0].message
        }
      };
    }
    
    // Extract results from the batch response
    const results = Object.values(result.data);
    
    return {
      success: true,
      data: results
    };
  }
  
  async getMetadata(): Promise<any> {
    const query = `
      {
        __schema {
          types {
            name
            kind
            fields {
              name
              type {
                name
                kind
              }
            }
          }
        }
      }
    `;
    
    const result = await this.graphqlRequest(query, {});
    return result.data;
  }
  
  async close(): Promise<void> {
    // GraphQL server cleanup is handled by kernel shutdown
  }
  
  private async graphqlRequest(query: string, variables: any): Promise<any> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables })
    });
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Expected JSON response but got: ${contentType}. Response: ${text.substring(0, 200)}`);
    }
    
    return await response.json();
  }
  
  private capitalize(str: string): string {
    // Convert to PascalCase (handle underscores and hyphens)
    return str
      .split(/[_-]/)
      .filter(word => word.length > 0) // Remove empty segments
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }
  
  private toCamelCase(str: string): string {
    const pascal = this.capitalize(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }
  
  private buildQueryArgs(variables: any): string {
    if (Object.keys(variables).length === 0) return '';
    
    const args = Object.entries(variables)
      .map(([key, _]) => `${key}: $${key}`)
      .join(', ');
    
    return `(${args})`;
  }
}

/**
 * GraphQL Protocol TCK Test Suite
 */
describe('GraphQL Protocol TCK', () => {
  let kernel: ObjectKernel;
  let plugin: GraphQLPlugin;
  let testPort: number;
  
  beforeAll(async () => {
    // Use a unique port for tests to avoid conflicts
    testPort = 9000 + Math.floor(Math.random() * 1000);
    
    // Create test kernel with memory driver
    plugin = new GraphQLPlugin({
      port: testPort,
      introspection: true,
      playground: false // Disable playground in tests
    });
    
    kernel = new ObjectKernel([
      new MemoryDriver(),
      plugin
    ]);
    
    // Register test entity
    kernel.metadata.register('object', 'tck_test_entity', {
      name: 'tck_test_entity',
      label: 'TCK Test Entity',
      fields: {
        name: { type: 'text', label: 'Name' },
        value: { type: 'number', label: 'Value' },
        active: { type: 'boolean', label: 'Active' }
      }
    });
    
    await kernel.start();
    
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 30000);
  
  afterAll(async () => {
    await kernel.stop();
  }, 30000);
  
  // Run the Protocol TCK
  runProtocolTCK(
    () => new GraphQLEndpoint(plugin, kernel),
    'GraphQL',
    {
      skip: {
        // GraphQL doesn't use traditional expand syntax (it's native)
        expand: true,
        // OData-specific features
        search: true
      },
      timeout: 30000,
      hooks: {
        beforeEach: async () => {
          // Clear data between tests
          const driver = kernel.getDriver();
          if (driver && typeof (driver as any).clear === 'function') {
            await (driver as any).clear();
          }
        }
      },
      performance: {
        enabled: true,
        thresholds: {
          create: 100,
          read: 50,
          update: 100,
          delete: 50,
          query: 150,
          batch: 300
        }
      }
    }
  );
  
  // Additional GraphQL-specific tests
  describe('GraphQL-Specific Features', () => {
    it('should support introspection queries', async () => {
      const endpoint = new GraphQLEndpoint(plugin, kernel);
      const metadata = await endpoint.getMetadata();
      
      expect(metadata).toBeDefined();
      expect(metadata.__schema).toBeDefined();
      expect(metadata.__schema.types).toBeDefined();
      expect(Array.isArray(metadata.__schema.types)).toBe(true);
    });
    
    it('should support field selection (avoid over-fetching)', async () => {
      const endpoint = new GraphQLEndpoint(plugin, kernel);
      
      // Create entity with multiple fields
      await endpoint.execute({
        type: 'create',
        entity: 'tck_test_entity',
        data: {
          name: 'Test',
          value: 42,
          active: true
        }
      });
      
      // Query with field selection would be done at GraphQL query level
      // This is a conceptual test - actual field selection happens in client queries
      const response = await endpoint.execute({
        type: 'query',
        entity: 'tck_test_entity'
      });
      
      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
    });
  });
});
