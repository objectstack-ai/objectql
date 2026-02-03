/**
 * OData V4 Protocol TCK (Technology Compatibility Kit) Tests
 * 
 * This test suite verifies that the OData V4 protocol implementation
 * complies with the Protocol TCK requirements and OData V4.01 specification.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { runProtocolTCK, ProtocolEndpoint, ProtocolOperation, ProtocolResponse } from '@objectql/protocol-tck';
import { ODataV4Plugin } from './index';
import { ObjectKernel } from '@objectstack/core';
import { MemoryDriver } from '@objectql/driver-memory';

/**
 * OData V4 Protocol Endpoint Adapter
 * 
 * Translates TCK operations into OData V4 HTTP requests
 */
class ODataEndpoint implements ProtocolEndpoint {
  private plugin: ODataV4Plugin;
  private kernel: ObjectKernel;
  private baseUrl: string;
  
  constructor(plugin: ODataV4Plugin, kernel: ObjectKernel) {
    this.plugin = plugin;
    this.kernel = kernel;
    const port = plugin.config.port || 3000;
    const basePath = plugin.config.basePath || '/odata';
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
          code: error.error?.code || 'ODATA_ERROR',
          message: error.error?.message || error.message
        }
      };
    }
  }
  
  private async executeCreate(operation: ProtocolOperation): Promise<ProtocolResponse> {
    const entitySet = this.capitalize(operation.entity);
    const url = `${this.baseUrl}/${entitySet}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(operation.data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('[TCK OData] Create error:', error);
      return {
        success: false,
        error: {
          code: error.error?.code || 'CREATE_ERROR',
          message: error.error?.message || 'Create failed'
        }
      };
    }
    
    const data = await response.json();
    return {
      success: true,
      data: data
    };
  }
  
  private async executeRead(operation: ProtocolOperation): Promise<ProtocolResponse> {
    const entitySet = this.capitalize(operation.entity);
    const url = `${this.baseUrl}/${entitySet}('${operation.id}')`;
    
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
          code: error.error?.code || 'READ_ERROR',
          message: error.error?.message || 'Read failed'
        }
      };
    }
    
    const data = await response.json();
    return {
      success: true,
      data: data
    };
  }
  
  private async executeUpdate(operation: ProtocolOperation): Promise<ProtocolResponse> {
    const entitySet = this.capitalize(operation.entity);
    const url = `${this.baseUrl}/${entitySet}('${operation.id}')`;
    
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
          code: error.error?.code || 'UPDATE_ERROR',
          message: error.error?.message || 'Update failed'
        }
      };
    }
    
    const data = await response.json();
    return {
      success: true,
      data: data
    };
  }
  
  private async executeDelete(operation: ProtocolOperation): Promise<ProtocolResponse> {
    const entitySet = this.capitalize(operation.entity);
    const url = `${this.baseUrl}/${entitySet}('${operation.id}')`;
    
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
          code: error.error?.code || 'DELETE_ERROR',
          message: error.error?.message || 'Delete failed'
        }
      };
    }
    
    return {
      success: true,
      data: { deleted: true }
    };
  }
  
  private async executeQuery(operation: ProtocolOperation): Promise<ProtocolResponse> {
    const entitySet = this.capitalize(operation.entity);
    const params = new URLSearchParams();
    
    // Build OData query parameters
    if (operation.filter) {
      const filterStr = this.buildODataFilter(operation.filter);
      if (filterStr) {
        params.append('$filter', filterStr);
      }
    }
    
    if (operation.options?.limit) {
      params.append('$top', operation.options.limit.toString());
    }
    
    if (operation.options?.offset) {
      params.append('$skip', operation.options.offset.toString());
    }
    
    if (operation.options?.orderBy && Array.isArray(operation.options.orderBy)) {
      const orderByStr = operation.options.orderBy
        .map((o: any) => `${o.field} ${o.order?.toLowerCase() || 'asc'}`)
        .join(',');
      params.append('$orderby', orderByStr);
    }
    
    if (operation.options?.select && Array.isArray(operation.options.select)) {
      params.append('$select', operation.options.select.join(','));
    }
    
    const url = `${this.baseUrl}/${entitySet}?${params.toString()}`;
    
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
          code: error.error?.code || 'QUERY_ERROR',
          message: error.error?.message || 'Query failed'
        }
      };
    }
    
    const data = await response.json();
    
    // OData returns results in a "value" array
    return {
      success: true,
      data: data.value || data
    };
  }
  
  private async executeBatch(operation: ProtocolOperation): Promise<ProtocolResponse> {
    // OData batch operations use multipart/mixed format
    const boundary = 'batch_' + Date.now();
    const changesetBoundary = 'changeset_' + Date.now();
    
    let batchBody = '';
    
    // Start changeset for transactional batch
    batchBody += `--${boundary}\r\n`;
    batchBody += `Content-Type: multipart/mixed; boundary=${changesetBoundary}\r\n\r\n`;
    
    if (Array.isArray(operation.data)) {
      operation.data.forEach((item, index) => {
        const entitySet = this.capitalize(operation.entity);
        
        batchBody += `--${changesetBoundary}\r\n`;
        batchBody += `Content-Type: application/http\r\n`;
        batchBody += `Content-Transfer-Encoding: binary\r\n`;
        batchBody += `Content-ID: ${index + 1}\r\n\r\n`;
        
        batchBody += `POST ${entitySet} HTTP/1.1\r\n`;
        batchBody += `Content-Type: application/json\r\n\r\n`;
        batchBody += JSON.stringify(item) + '\r\n';
      });
    }
    
    batchBody += `--${changesetBoundary}--\r\n`;
    batchBody += `--${boundary}--\r\n`;
    
    const response = await fetch(`${this.baseUrl}/$batch`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/mixed; boundary=${boundary}`,
      },
      body: batchBody
    });
    
    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: {
          code: error.error?.code || 'BATCH_ERROR',
          message: error.error?.message || 'Batch operation failed'
        }
      };
    }
    
    // Parse multipart response
    const responseText = await response.text();
    const results = this.parseBatchResponse(responseText);
    
    return {
      success: true,
      data: results
    };
  }
  
  async getMetadata(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/$metadata`, {
      method: 'GET',
      headers: {
        'Accept': 'application/xml',
      }
    });
    
    const metadata = await response.text();
    return { metadata, format: 'EDMX' };
  }
  
  async close(): Promise<void> {
    // OData server cleanup is handled by kernel shutdown
  }
  
  private buildODataFilter(filter: any): string {
    if (typeof filter !== 'object' || filter === null) {
      return '';
    }
    
    const conditions: string[] = [];
    
    for (const [key, value] of Object.entries(filter)) {
      if (typeof value === 'string') {
        conditions.push(`${key} eq '${value}'`);
      } else if (typeof value === 'number') {
        conditions.push(`${key} eq ${value}`);
      } else if (typeof value === 'boolean') {
        conditions.push(`${key} eq ${value}`);
      } else if (value === null) {
        conditions.push(`${key} eq null`);
      }
    }
    
    return conditions.join(' and ');
  }
  
  private parseBatchResponse(responseText: string): any[] {
    // Simple parser for batch responses
    // In production, use a proper multipart parser
    const results: any[] = [];
    
    // Extract JSON objects from the multipart response
    const jsonMatches = responseText.match(/\{[^}]*\}/g);
    if (jsonMatches) {
      jsonMatches.forEach(match => {
        try {
          results.push(JSON.parse(match));
        } catch (e) {
          // Skip invalid JSON
        }
      });
    }
    
    return results;
  }
  
  private capitalize(str: string): string {
    // Convert to PascalCase (handle underscores and hyphens)
    return str
      .split(/[_-]/)
      .filter(word => word.length > 0) // Remove empty segments
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }
}

/**
 * OData V4 Protocol TCK Test Suite
 */
describe('OData V4 Protocol TCK', () => {
  let kernel: ObjectKernel;
  let plugin: ODataV4Plugin;
  let testPort: number;
  
  beforeAll(async () => {
    // Use a unique port for tests to avoid conflicts
    testPort = 9100 + Math.floor(Math.random() * 1000);
    
    // Create memory driver
    const driver = new MemoryDriver();
    
    // Create test kernel with memory driver
    plugin = new ODataV4Plugin({
      port: testPort,
      basePath: '/odata',
      namespace: 'TCKTest'
    });
    
    // Create kernel and register plugins
    kernel = new ObjectKernel();
    
    // Register plugin if kernel.use exists
    if (typeof (kernel as any).use === 'function') {
      (kernel as any).use(plugin);
    }
    
    // Patch kernel with CRUD methods that delegate to the driver
    // This is necessary because @objectstack/core@0.9.x doesn't provide these methods
    (kernel as any).create = (object: string, doc: any, options?: any) => driver.create(object, doc, options);
    (kernel as any).update = (object: string, id: any, doc: any, options?: any) => driver.update(object, id, doc, options);
    (kernel as any).delete = (object: string, id: any, options?: any) => driver.delete(object, id, options);
    (kernel as any).find = async (object: string, query?: any, options?: any) => {
      const res = await driver.find(object, query, options);
      return { value: res || [], count: (res || []).length };
    };
    (kernel as any).findOne = (object: string, id: any, options?: any) => driver.findOne(object, id, options);
    (kernel as any).get = (object: string, id: any) => driver.findOne(object, id);
    (kernel as any).count = (object: string, query?: any, options?: any) => driver.count(object, query, options);
    (kernel as any).getDriver = () => driver;
    
    // Stub metadata registry
    (kernel as any).metadata = {
      register: (type: string, name: string, item: any) => {
        // Simple in-memory metadata storage
        if (!(kernel as any)._metadata) {
          (kernel as any)._metadata = new Map();
        }
        if (!(kernel as any)._metadata.has(type)) {
          (kernel as any)._metadata.set(type, new Map());
        }
        (kernel as any)._metadata.get(type).set(name, item);
      },
      get: (type: string, name: string) => {
        if (!(kernel as any)._metadata) return null;
        const typeMap = (kernel as any)._metadata.get(type);
        const item = typeMap ? typeMap.get(name) : null;
        // Return the item with content wrapper for protocol plugins
        return item ? { content: item } : null;
      },
      list: (type: string) => {
        if (!(kernel as any)._metadata) return [];
        const typeMap = (kernel as any)._metadata.get(type);
        const items = typeMap ? Array.from(typeMap.values()) : [];
        // Wrap each item in content wrapper for protocol plugins
        return items.map(item => ({ content: item }));
      }
    };
    
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
    
    // Manually install and start the plugin
    // Since the new kernel might not auto-start plugins, we do it manually
    const ctx = {
      engine: kernel,
      services: (kernel as any).services || new Map()
    };
    
    if (typeof (plugin as any).install === 'function') {
      await (plugin as any).install(ctx);
    }
    
    if (typeof (plugin as any).onStart === 'function') {
      await (plugin as any).onStart(ctx);
    }
    
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 30000);
  
  afterAll(async () => {
    if ((kernel as any).shutdown) {
      await (kernel as any).shutdown();
    } else if ((kernel as any).stop) {
      await (kernel as any).stop();
    }
  }, 30000);
  
  // Run the Protocol TCK
  runProtocolTCK(
    () => new ODataEndpoint(plugin, kernel),
    'OData V4',
    {
      skip: {
        // Features not yet implemented
        subscriptions: true,  // OData doesn't support GraphQL-style subscriptions
        federation: true      // OData doesn't support GraphQL federation
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
          create: 150,
          read: 75,
          update: 150,
          delete: 75,
          query: 200,
          batch: 400
        }
      }
    }
  );
  
  // Additional OData-specific tests
  describe('OData V4-Specific Features', () => {
    it('should support $metadata endpoint', async () => {
      const endpoint = new ODataEndpoint(plugin, kernel);
      const metadata = await endpoint.getMetadata();
      
      expect(metadata).toBeDefined();
      expect(metadata.metadata).toBeDefined();
      expect(metadata.format).toBe('EDMX');
      expect(metadata.metadata).toContain('<?xml');
    });
    
    it('should support $filter query option', async () => {
      const endpoint = new ODataEndpoint(plugin, kernel);
      
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
      expect(response.data.every((item: any) => item.active === true)).toBe(true);
    });
    
    it('should support $top and $skip (pagination)', async () => {
      const endpoint = new ODataEndpoint(plugin, kernel);
      
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
    
    it('should support $orderby (sorting)', async () => {
      const endpoint = new ODataEndpoint(plugin, kernel);
      
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
      
      const values = response.data.map((item: any) => item.value);
      const sortedValues = [...values].sort((a, b) => a - b);
      expect(values).toEqual(sortedValues);
    });
  });
});
