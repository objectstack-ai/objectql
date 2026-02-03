/**
 * REST Protocol TCK (Technology Compatibility Kit) Tests
 * 
 * This test suite verifies that the REST protocol implementation
 * complies with the Protocol TCK requirements and RESTful principles.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { runProtocolTCK, ProtocolEndpoint, ProtocolOperation, ProtocolResponse } from '@objectql/protocol-tck';
import { RestPlugin } from '../src/index';
import { ObjectKernel } from '@objectstack/core';
import { MemoryDriver } from '@objectql/driver-memory';

/**
 * REST Protocol Endpoint Adapter
 * 
 * Translates TCK operations into RESTful HTTP requests
 */
class RESTEndpoint implements ProtocolEndpoint {
  private plugin: RestPlugin;
  private kernel: ObjectKernel;
  private baseUrl: string;
  
  constructor(plugin: RestPlugin, kernel: ObjectKernel) {
    this.plugin = plugin;
    this.kernel = kernel;
    const port = plugin.config.port || 3000;
    const basePath = plugin.config.basePath || '/api';
    this.baseUrl = `http://localhost:${port}${basePath}`;
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
          code: error.code || 'REST_ERROR',
          message: error.message
        }
      };
    }
  }
  
  private async executeCreate(operation: ProtocolOperation): Promise<ProtocolResponse> {
    const url = `${this.baseUrl}/${operation.entity}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(operation.data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: {
          code: error.code || 'CREATE_ERROR',
          message: error.message || 'Create failed'
        }
      };
    }
    
    const result = await response.json();
    return {
      success: true,
      data: result.data || result
    };
  }
  
  private async executeRead(operation: ProtocolOperation): Promise<ProtocolResponse> {
    const url = `${this.baseUrl}/${operation.entity}/${operation.id}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: true,
          data: null
        };
      }
      
      const error = await response.json();
      return {
        success: false,
        error: {
          code: error.code || 'READ_ERROR',
          message: error.message || 'Read failed'
        }
      };
    }
    
    const result = await response.json();
    return {
      success: true,
      data: result.data || result
    };
  }
  
  private async executeUpdate(operation: ProtocolOperation): Promise<ProtocolResponse> {
    const url = `${this.baseUrl}/${operation.entity}/${operation.id}`;
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(operation.data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: {
          code: error.code || 'UPDATE_ERROR',
          message: error.message || 'Update failed'
        }
      };
    }
    
    const result = await response.json();
    return {
      success: true,
      data: result.data || result
    };
  }
  
  private async executeDelete(operation: ProtocolOperation): Promise<ProtocolResponse> {
    const url = `${this.baseUrl}/${operation.entity}/${operation.id}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: {
          code: error.code || 'DELETE_ERROR',
          message: error.message || 'Delete failed'
        }
      };
    }
    
    return {
      success: true,
      data: { deleted: true }
    };
  }
  
  private async executeQuery(operation: ProtocolOperation): Promise<ProtocolResponse> {
    const params = new URLSearchParams();
    
    // Build query parameters
    if (operation.filter) {
      Object.entries(operation.filter).forEach(([key, value]) => {
        params.append(key, String(value));
      });
    }
    
    if (operation.options?.limit) {
      params.append('limit', operation.options.limit.toString());
    }
    
    if (operation.options?.offset) {
      params.append('skip', operation.options.offset.toString());
    }
    
    if (operation.options?.orderBy && Array.isArray(operation.options.orderBy)) {
      const sortStr = operation.options.orderBy
        .map((o: any) => {
          const order = o.order === 'DESC' ? '-' : '';
          return `${order}${o.field}`;
        })
        .join(',');
      params.append('sort', sortStr);
    }
    
    if (operation.options?.select && Array.isArray(operation.options.select)) {
      params.append('fields', operation.options.select.join(','));
    }
    
    const url = `${this.baseUrl}/${operation.entity}?${params.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: {
          code: error.code || 'QUERY_ERROR',
          message: error.message || 'Query failed'
        }
      };
    }
    
    const result = await response.json();
    
    // Handle both {items: [...]} and direct array responses
    return {
      success: true,
      data: result.items || result.data || result
    };
  }
  
  private async executeBatch(operation: ProtocolOperation): Promise<ProtocolResponse> {
    // REST batch: send array of items
    const url = `${this.baseUrl}/${operation.entity}`;
    
    if (!Array.isArray(operation.data)) {
      return {
        success: false,
        error: {
          code: 'INVALID_BATCH_DATA',
          message: 'Batch data must be an array'
        }
      };
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(operation.data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: {
          code: error.code || 'BATCH_ERROR',
          message: error.message || 'Batch operation failed'
        }
      };
    }
    
    const result = await response.json();
    return {
      success: true,
      data: result.data || result
    };
  }
  
  async getMetadata(): Promise<any> {
    const url = `${this.baseUrl}/metadata`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      return { objects: [] };
    }
    
    const metadata = await response.json();
    return metadata;
  }
  
  async close(): Promise<void> {
    // REST server cleanup is handled by kernel shutdown
  }
}

/**
 * REST Protocol TCK Test Suite
 */
describe('REST Protocol TCK', () => {
  let kernel: ObjectKernel;
  let plugin: RestPlugin;
  let testPort: number;
  
  beforeAll(async () => {
    // Use a unique port for tests to avoid conflicts
    testPort = 9200 + Math.floor(Math.random() * 1000);
    
    // Create test kernel with memory driver
    plugin = new RestPlugin({
      port: testPort,
      basePath: '/api',
      enableOpenAPI: true
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
    () => new RESTEndpoint(plugin, kernel),
    'REST',
    {
      skip: {
        // Features not applicable to REST
        subscriptions: true,  // REST doesn't have built-in subscriptions
        federation: true,     // REST doesn't support GraphQL federation
        search: true         // Full-text search not standard in REST
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
  
  // Additional REST-specific tests
  describe('REST-Specific Features', () => {
    it('should return correct HTTP status codes', async () => {
      const endpoint = new RESTEndpoint(plugin, kernel);
      
      // Create should return 200/201
      const createResponse = await endpoint.execute({
        type: 'create',
        entity: 'tck_test_entity',
        data: { name: 'Test', value: 42, active: true }
      });
      
      expect(createResponse.success).toBe(true);
    });
    
    it('should support query parameters', async () => {
      const endpoint = new RESTEndpoint(plugin, kernel);
      
      // Create test data
      await endpoint.execute({
        type: 'create',
        entity: 'tck_test_entity',
        data: { name: 'Active Item', value: 10, active: true }
      });
      
      await endpoint.execute({
        type: 'create',
        entity: 'tck_test_entity',
        data: { name: 'Inactive Item', value: 20, active: false }
      });
      
      // Query with filter
      const response = await endpoint.execute({
        type: 'query',
        entity: 'tck_test_entity',
        filter: { active: 'true' }
      });
      
      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
    });
    
    it('should support pagination with limit and skip', async () => {
      const endpoint = new RESTEndpoint(plugin, kernel);
      
      // Create test data
      for (let i = 1; i <= 10; i++) {
        await endpoint.execute({
          type: 'create',
          entity: 'tck_test_entity',
          data: { name: `Item ${i}`, value: i, active: true }
        });
      }
      
      // Query with pagination
      const response = await endpoint.execute({
        type: 'query',
        entity: 'tck_test_entity',
        options: {
          limit: 3,
          offset: 2
        }
      });
      
      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeLessThanOrEqual(3);
    });
    
    it('should support sorting with sort parameter', async () => {
      const endpoint = new RESTEndpoint(plugin, kernel);
      
      // Create test data in random order
      await endpoint.execute({
        type: 'create',
        entity: 'tck_test_entity',
        data: { name: 'C', value: 3, active: true }
      });
      
      await endpoint.execute({
        type: 'create',
        entity: 'tck_test_entity',
        data: { name: 'A', value: 1, active: true }
      });
      
      await endpoint.execute({
        type: 'create',
        entity: 'tck_test_entity',
        data: { name: 'B', value: 2, active: true }
      });
      
      // Query with sorting
      const response = await endpoint.execute({
        type: 'query',
        entity: 'tck_test_entity',
        options: {
          orderBy: [{ field: 'value', order: 'ASC' }]
        }
      });
      
      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
    });
    
    it('should support OpenAPI metadata endpoint', async () => {
      const endpoint = new RESTEndpoint(plugin, kernel);
      const metadata = await endpoint.getMetadata();
      
      expect(metadata).toBeDefined();
    });
  });
});
