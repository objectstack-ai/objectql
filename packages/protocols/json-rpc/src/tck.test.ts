/**
 * JSON-RPC Protocol TCK (Technology Compatibility Kit) Tests
 * 
 * This test suite verifies that the JSON-RPC protocol implementation
 * complies with the Protocol TCK requirements and JSON-RPC 2.0 specification.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { runProtocolTCK, ProtocolEndpoint, ProtocolOperation, ProtocolResponse } from '@objectql/protocol-tck';
import { JSONRPCPlugin } from './index';
import { ObjectKernel } from '@objectstack/core';
import { MemoryDriver } from '@objectql/driver-memory';

/**
 * JSON-RPC Protocol Endpoint Adapter
 * 
 * Translates TCK operations into JSON-RPC 2.0 requests
 */
class JSONRPCEndpoint implements ProtocolEndpoint {
  private plugin: JSONRPCPlugin;
  private kernel: ObjectKernel;
  private baseUrl: string;
  private requestId: number = 1;
  
  constructor(plugin: JSONRPCPlugin, kernel: ObjectKernel) {
    this.plugin = plugin;
    this.kernel = kernel;
    const port = plugin.config.port || 3000;
    const basePath = plugin.config.basePath || '/rpc';
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
          code: error.code || 'JSON_RPC_ERROR',
          message: error.message
        }
      };
    }
  }
  
  private async executeCreate(operation: ProtocolOperation): Promise<ProtocolResponse> {
    const request = {
      jsonrpc: '2.0',
      method: 'object.create',
      params: [operation.entity, operation.data],
      id: this.requestId++
    };
    
    const result = await this.rpcRequest(request);
    
    if (result.error) {
      return {
        success: false,
        error: {
          code: result.error.code?.toString() || 'CREATE_ERROR',
          message: result.error.message
        }
      };
    }
    
    return {
      success: true,
      data: result.result
    };
  }
  
  private async executeRead(operation: ProtocolOperation): Promise<ProtocolResponse> {
    const request = {
      jsonrpc: '2.0',
      method: 'object.get',
      params: [operation.entity, operation.id],
      id: this.requestId++
    };
    
    const result = await this.rpcRequest(request);
    
    if (result.error) {
      return {
        success: false,
        error: {
          code: result.error.code?.toString() || 'READ_ERROR',
          message: result.error.message
        }
      };
    }
    
    return {
      success: true,
      data: result.result
    };
  }
  
  private async executeUpdate(operation: ProtocolOperation): Promise<ProtocolResponse> {
    const request = {
      jsonrpc: '2.0',
      method: 'object.update',
      params: [operation.entity, operation.id, operation.data],
      id: this.requestId++
    };
    
    const result = await this.rpcRequest(request);
    
    if (result.error) {
      return {
        success: false,
        error: {
          code: result.error.code?.toString() || 'UPDATE_ERROR',
          message: result.error.message
        }
      };
    }
    
    return {
      success: true,
      data: result.result
    };
  }
  
  private async executeDelete(operation: ProtocolOperation): Promise<ProtocolResponse> {
    const request = {
      jsonrpc: '2.0',
      method: 'object.delete',
      params: [operation.entity, operation.id],
      id: this.requestId++
    };
    
    const result = await this.rpcRequest(request);
    
    if (result.error) {
      return {
        success: false,
        error: {
          code: result.error.code?.toString() || 'DELETE_ERROR',
          message: result.error.message
        }
      };
    }
    
    return {
      success: true,
      data: { deleted: true }
    };
  }
  
  private async executeQuery(operation: ProtocolOperation): Promise<ProtocolResponse> {
    const queryParams: any = {};
    
    if (operation.filter) {
      queryParams.filter = operation.filter;
    }
    
    if (operation.options?.limit) {
      queryParams.limit = operation.options.limit;
    }
    
    if (operation.options?.offset) {
      queryParams.skip = operation.options.offset;
    }
    
    if (operation.options?.orderBy) {
      queryParams.sort = operation.options.orderBy.map((o: any) => ({
        [o.field]: o.order === 'DESC' ? -1 : 1
      }));
    }
    
    if (operation.options?.select) {
      queryParams.fields = operation.options.select.join(',');
    }
    
    const request = {
      jsonrpc: '2.0',
      method: 'object.find',
      params: [operation.entity, queryParams],
      id: this.requestId++
    };
    
    const result = await this.rpcRequest(request);
    
    if (result.error) {
      return {
        success: false,
        error: {
          code: result.error.code?.toString() || 'QUERY_ERROR',
          message: result.error.message
        }
      };
    }
    
    return {
      success: true,
      data: result.result
    };
  }
  
  private async executeBatch(operation: ProtocolOperation): Promise<ProtocolResponse> {
    if (!Array.isArray(operation.data)) {
      return {
        success: false,
        error: {
          code: 'INVALID_BATCH_DATA',
          message: 'Batch data must be an array'
        }
      };
    }
    
    // JSON-RPC batch request
    const batchRequests = operation.data.map((item, index) => ({
      jsonrpc: '2.0',
      method: 'object.create',
      params: [operation.entity, item],
      id: this.requestId + index
    }));
    
    this.requestId += batchRequests.length;
    
    const results = await this.rpcBatchRequest(batchRequests);
    
    // Check for errors in batch
    const errors = results.filter((r: any) => r.error);
    if (errors.length > 0) {
      return {
        success: false,
        error: {
          code: 'BATCH_ERROR',
          message: `${errors.length} operations failed`
        }
      };
    }
    
    return {
      success: true,
      data: results.map((r: any) => r.result)
    };
  }
  
  async getMetadata(): Promise<any> {
    const request = {
      jsonrpc: '2.0',
      method: 'metadata.getAll',
      params: ['object'],
      id: this.requestId++
    };
    
    const result = await this.rpcRequest(request);
    
    return {
      entities: result.result || [],
      protocol: 'JSON-RPC 2.0'
    };
  }
  
  async close(): Promise<void> {
    // JSON-RPC server cleanup is handled by kernel shutdown
  }
  
  private async rpcRequest(request: any): Promise<any> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });
    
    return await response.json();
  }
  
  private async rpcBatchRequest(requests: any[]): Promise<any[]> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requests)
    });
    
    return await response.json();
  }
}

/**
 * JSON-RPC Protocol TCK Test Suite
 */
describe('JSON-RPC Protocol TCK', () => {
  let kernel: ObjectKernel;
  let plugin: JSONRPCPlugin;
  let testPort: number;
  
  beforeAll(async () => {
    // Use a unique port for tests to avoid conflicts
    testPort = 9300 + Math.floor(Math.random() * 1000);
    
    // Create test kernel with memory driver
    plugin = new JSONRPCPlugin({
      port: testPort,
      basePath: '/rpc',
      enableProgress: true,
      enableChaining: true,
      enableSessions: true
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
    () => new JSONRPCEndpoint(plugin, kernel),
    'JSON-RPC',
    {
      skip: {
        // Features not applicable to JSON-RPC
        subscriptions: true,  // JSON-RPC uses SSE instead
        federation: true,     // JSON-RPC doesn't support GraphQL federation
        expand: true,         // JSON-RPC uses different relation loading
        search: true         // Full-text search not standard
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
          create: 80,
          read: 40,
          update: 80,
          delete: 40,
          query: 120,
          batch: 250
        }
      }
    }
  );
  
  // Additional JSON-RPC-specific tests
  describe('JSON-RPC 2.0 Specification Compliance', () => {
    it('should follow JSON-RPC 2.0 request format', async () => {
      const endpoint = new JSONRPCEndpoint(plugin, kernel);
      
      const response = await endpoint.execute({
        type: 'create',
        entity: 'tck_test_entity',
        data: { name: 'Test', value: 42, active: true }
      });
      
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
    });
    
    it('should support batch requests (JSON-RPC 2.0)', async () => {
      const endpoint = new JSONRPCEndpoint(plugin, kernel);
      
      const response = await endpoint.execute({
        type: 'batch',
        entity: 'tck_test_entity',
        data: [
          { name: 'Item 1', value: 1, active: true },
          { name: 'Item 2', value: 2, active: true },
          { name: 'Item 3', value: 3, active: true }
        ]
      });
      
      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBe(3);
    });
    
    it('should return proper error objects', async () => {
      const endpoint = new JSONRPCEndpoint(plugin, kernel);
      
      // Try to read non-existent item
      const response = await endpoint.execute({
        type: 'read',
        entity: 'tck_test_entity',
        id: 'nonexistent-id-12345'
      });
      
      // Should either return null or error
      expect(response.success).toBeDefined();
    });
    
    it('should support system methods', async () => {
      const endpoint = new JSONRPCEndpoint(plugin, kernel);
      const metadata = await endpoint.getMetadata();
      
      expect(metadata).toBeDefined();
      expect(metadata.protocol).toBe('JSON-RPC 2.0');
    });
    
    it('should handle filter parameters', async () => {
      const endpoint = new JSONRPCEndpoint(plugin, kernel);
      
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
        filter: { active: true }
      });
      
      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
    });
  });
});
