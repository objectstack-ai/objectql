/**
 * OData V4 Protocol TCK (Technology Compatibility Kit) Tests
 * 
 * This test suite verifies that the OData V4 protocol implementation
 * complies with the Protocol TCK requirements and OData V4.01 specification.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { runProtocolTCK, ProtocolEndpoint, ProtocolOperation, ProtocolResponse } from '@objectql/protocol-tck';
import { ODataV4Plugin } from './index';
import { MemoryDriver } from '@objectql/driver-memory';

/**
 * OData V4 Protocol Endpoint Adapter
 * 
 * Translates TCK operations into OData V4 HTTP requests
 */
class ODataEndpoint implements ProtocolEndpoint {
  private plugin: ODataV4Plugin;
  private kernel: any;
  private baseUrl: string;
  
  constructor(plugin: ODataV4Plugin, kernel: any) {
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
    
    // Extract entity sets from the EDMX XML for TCK compatibility
    // The TCK expects { entities } or { entitySets } or { types }
    const entitySetMatches = metadata.match(/<EntitySet Name="([^"]+)"/g) || [];
    const entitySets = entitySetMatches.map(match => {
      const nameMatch = match.match(/Name="([^"]+)"/);
      return nameMatch ? nameMatch[1] : '';
    }).filter(Boolean);
    
    return { 
      metadata, 
      format: 'EDMX',
      entitySets // Add this for TCK compatibility
    };
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
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

/**
 * OData V4 Protocol TCK Test Suite
 */
describe('OData V4 Protocol TCK', () => {
  let kernel: any; // Mock kernel
  let plugin: ODataV4Plugin;
  let testPort: number;
  let driver: MemoryDriver;
  
  beforeAll(async () => {
    // Use a unique port for tests to avoid conflicts
    testPort = 9100 + Math.floor(Math.random() * 1000);
    
    // Create driver
    driver = new MemoryDriver();
    
    // Create mock kernel similar to integration tests
    const metadataStore = new Map<string, any>();
    // Use capitalized name for OData entity sets
    metadataStore.set('Tck_test_entity', {
      content: {
        name: 'Tck_test_entity',
        label: 'TCK Test Entity',
        fields: {
          name: { type: 'text', label: 'Name' },
          value: { type: 'number', label: 'Value' },
          active: { type: 'boolean', label: 'Active' }
        }
      }
    });
    
    kernel = {
      metadata: {
        register: (type: string, name: string, item: any) => {
          metadataStore.set(name, { content: item });
        },
        list: (type: string) => {
          if (type === 'object') {
            return Array.from(metadataStore.values());
          }
          return [];
        },
        get: (type: string, name: string) => {
          return metadataStore.get(name) || null;
        }
      },
      repository: {
        find: async (objectName: string, query: any) => driver.find(objectName, query),
        findOne: async (objectName: string, id: string) => driver.findOne(objectName, id),
        create: async (objectName: string, data: any) => driver.create(objectName, data),
        update: async (objectName: string, id: string, data: any) => driver.update(objectName, id, data),
        delete: async (objectName: string, id: string) => driver.delete(objectName, id),
        count: async (objectName: string, filters: any) => driver.count(objectName, filters),
      },
      // Add direct methods that OData plugin expects
      // Note: OData uses capitalized entity set names but driver uses lowercase
      find: async (objectName: string, query: any) => {
        const lowerName = objectName.toLowerCase();
        return driver.find(lowerName, query);
      },
      get: async (objectName: string, id: string) => {
        const lowerName = objectName.toLowerCase();
        return driver.findOne(lowerName, id);
      },
      create: async (objectName: string, data: any) => {
        const lowerName = objectName.toLowerCase();
        return driver.create(lowerName, data);
      },
      update: async (objectName: string, id: string, data: any) => {
        const lowerName = objectName.toLowerCase();
        return driver.update(lowerName, id, data);
      },
      delete: async (objectName: string, id: string) => {
        const lowerName = objectName.toLowerCase();
        return driver.delete(lowerName, id);
      },
      count: async (objectName: string, filters: any) => {
        const lowerName = objectName.toLowerCase();
        return driver.count(lowerName, filters);
      },
      driver,
      getDriver: () => driver
    };
    
    // Create test kernel with memory driver
    plugin = new ODataV4Plugin({
      port: testPort,
      basePath: '/odata',
      namespace: 'TCKTest'
    });
    
    await plugin.install?.({ engine: kernel });
    await plugin.onStart?.({ engine: kernel });
    
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 30000);
  
  afterAll(async () => {
    await plugin.onStop?.({ engine: kernel });
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
