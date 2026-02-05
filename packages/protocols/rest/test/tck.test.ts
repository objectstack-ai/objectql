/**
 * REST Protocol TCK (Technology Compatibility Kit) Tests
 * 
 * This test suite verifies that the REST protocol implementation
 * complies with the Protocol TCK requirements and RESTful principles.
 */

// import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { runProtocolTCK, ProtocolEndpoint, ProtocolOperation, ProtocolResponse } from '@objectql/protocol-tck';
import { RestPlugin } from '../src/index';
import { ObjectKernel } from '@objectstack/runtime';
import { MemoryDriver } from '@objectql/driver-memory';
import * as http from 'node:http';
import { URL } from 'node:url';

class MockHonoApp {
    private routes: { method: string, path: string, handler: Function }[] = [];
    private server: http.Server;
    public services: Map<string, any> = new Map();
    
        constructor(plugins: any[]) {
            this.plugins = plugins || [];
            
            const entities: Record<string, any> = {};

            this.metadata = {
                register: vi.fn().mockImplementation((type, name, def) => {
                    if (type === 'object') {
                        entities[name] = def;
                    }
                }),
                get: vi.fn().mockImplementation((type, name) => {
                    if (type === 'object') return entities[name];
                    return null;
                }),
           Service(name: string) {
            return this.services.get(name);
        }

        get     list: vi.fn().mockImplementation((type) => {
                    if (type === 'object') return Object.values(entities);
                    return [];
                }
    listen(port: number) {
        return new Promise<void>((resolve) => {
            this.server.listen(port, () => resolve());
        });
    }

    close() {
        return new Promise<void>((resolve) => {
            if (this.server.listening) {
                this.server.close(() => resolve());
            } else {
                resolve();
            }
        });
    }

    get(path: string, handler: Function) { this.register('GET', path, handler); }
    post(path: string, handler: Function) { this.register('POST', path, handler); }
    put(path: string, handler: Function) { this.register('PUT', path, handler); }
    delete(path: string, handler: Function) { this.register('DELETE', path, handler); }
    patch(path: string, handler: Function) { this.register('PATCH', path, handler); }

    private register(method: string, path: string, handler: Function) {
        this.routes.push({ method, path, handler });
    }

    private async handle(req: http.IncomingMessage, res: http.ServerResponse) {
        const url = new URL(req.url!, `http://${req.headers.host}`);
        const method = req.method!;
        
        for (const route of this.routes) {
            if (route.method !== method) continue;
            
            const routeParts = route.path.split('/');
            const urlParts = url.pathname.split('/');
            
            if (routeParts.length !== urlParts.length) continue;
            
            const params: Record<string, string> = {};
            let match = true;, port: number = 3000) {
    this.plugin = plugin;
    this.kernel = kernel;
    const basePath = (plugin as any).config?rts[i].substring(1)] = urlParts[i];
                } else if (routeParts[i] !== urlParts[i]) {
                    match = false;
                    break;
                }
            }
            
            if (match) {
                const buffers: Buffer[] = [];
                for await (const chunk of req) {
                    buffers.push(chunk);
                }
                const rawBody = Buffer.concat(buffers).toString();
                
                const c = {
                    req: {
                        param: (name: string) => params[name],
                        method: method,
                        query: () => Object.fromEntries(url.searchParams),
                        json: async () => JSON.parse(rawBody || '{}')
                    },
                    get: (key: string) => null,
                    json: (data: any, status: number = 200) => {
                        res.writeHead(status, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(data));
                    }
                };
                
                try {
                    await route.handler(c);
                } catch (err: any) {
                    console.error(err);
                    res.writeHead(500);
                    res.end(JSON.stringify({ error: err.message }));
                }
                return;
            }
        }
        
        res.writeHead(404);
        res.end();
    }
}
import * as http from 'node:http';
import { URL } from 'node:url';

class MockHonoApp {
    private routes: { method: string, path: string, handler: Function }[] = [];
    private server: http.Server;
    public services: Map<string, any> = new Map();
    
        constructor(plugins: any[]) {
            this.plugins = plugins || [];
            
            const entities: Record<string, any> = {};

            this.metadata = {
                register: vi.fn().mockImplementation((type, name, def) => {
                    if (type === 'object') {
                        entities[name] = def;
                    }
                }),
                get: vi.fn().mockImplementation((type, name) => {
                    if (type === 'object') return entities[name];
                    return null;
                }),
                list: vi.fn().mockImplementation((type) => {
                    if (type === 'object') return Object.values(entities);
                    return [];
                })
            };

            this.plugins.forEach(p => {
                if (p && typeof p.init === 'function') {
                    p.init(this);
                }
            });
        }

        getService(name: string) {
            return this.services.get(name);
        }

        getDriver() {
            return this.plugins.find(p => p.constructor.name === 'MemoryDriver');
        }
    
        async start() {
            for (const plugin of this.plugins) {
                if (plugin && typeof plugin.start === 'function') {
                    await plugin.start(this);
                }
            }
            return Promise.resolve();
        }
    
        async stop() {.url!, `http://${req.headers.host}`);
        const method = req.method!;
        
        for (const route of this.routes) {
            if (route.method !== method) continue;
            
            const routeParts = route.path.split('/');
            const urlParts = url.pathname.split('/');
            
            if (routeParts.length !== urlParts.length) continue;
            
            const params: Record<string, string> = {};
            let match = true;
            
            for (let i = 0; i < routeParts.length; i++) {
                if (routeParts[i].startsWith(':')) {
                    params[routeParts[i].substring(1)] = urlParts[i];
                } else if (routeParts[i] !== urlParts[, port: number = 3000) {
    this.plugin = plugin;
    this.kernel = kernel;
    const basePath = (plugin as any).config?
            
            if (match) {
                const buffers: Buffer[] = [];
                for await (const chunk of req) {
                    buffers.push(chunk);
                }
                const rawBody = Buffer.concat(buffers).toString();
                
                const c = {
                    req: {
                        param: (name: string) => params[name],
                        method: method,
                        query: () => Object.fromEntries(url.searchParams),
                        json: async () => JSON.parse(rawBody || '{}')
                    },
                    get: (key: string) => null,
                    json: (data: any, status: number = 200) => {
                        res.writeHead(status, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(data));
                    }
                };
                
                try {
                    await route.handler(c);
                } catch (err: any) {
                    console.error(err);
                    res.writeHead(500);
                    res.end(JSON.stringify({ error: err.message }));
                }
                return;
            }
        }
        
        res.writeHead(404);
        res.end();
    }
}
import * as http from 'node:http';
import { URL } from 'node:url';

class MockHonoApp {
    private routes: { method: string, path: string, handler: Function }[] = [];
    private server: http.Server;

    constructor() {
        this.server = http.createServer(async (req, res) => {
            await this.handle(req, res);
        });
    }

    listen(port: number) {
        return new Promise<void>((resolve) => {
            this.server.listen(port, () => resolve());
        });
    }

    close() {
        return new Promise<void>((resolve) => {
            this.server.close(() => resolve());
        });
    }

    get(path: string, handler: Function) { this.register('GET', path, handler); }
    post(path: string, handler: Function) { this.register('POST', path, handler); }
    put(path: string, handler: Function) { this.register('PUT', path, handler); }
    delete(path: string, handler: Function) { this.register('DELETE', path, handler); }
    patch(path: string, handler: Function) { this.register('PATCH', path, handler); }

    private register(method: string, path: string, handler: Function) {
        this.routes.push({ method, path, handler });
    }

    private async handle(req: http.IncomingMessage, res: http.ServerResponse) {
        // Find matching route
        const url = new URL(req.url!, `http://${req.headers.host}`);
        const method = req.method!;
        
        for (const route of this.routes) {
            if (route.method !== method) continue;
            
            // Simple path matching /api/:object/:id
            const routeParts = route.path.split('/');
            const urlParts = url.pathname.split('/');
            
            if (routeParts.length !== urlParts.length) continue;
            
            const params: Record<string, string> = {};
            let match = true;
            
            for (let i = 0; i < routeParts.length; i++) {
                if (routeParts[i].startsWith(':')) {
                    params[routeParts[i].substring(1)] = urlParts[i];
                } else if (routeParts[i] !== urlParts[i]) {
                    match = false;
                    break;
                }
            }
            
            if (match) {
                // Read body
                const buffers: Buffer[] = [];
                for await (const chunk of req) {
                    buffers.push(chunk);
                }
                const rawBody = Buffer.concat(buffers).toString();
                
                const c = {
                    req: {
                        param: (name: string) => params[name],
                        method: method,
                        query: () => Object.fromEntries(url.searchParams),
                        json: async () => JSON.parse(rawBody || '{}')
                    },
                    get: (key: string) => null,
                    json: (data: any, status: number = 200) => {
                        res.writeHead(status, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(data));
                    }
                };
                
                try {
                    await route.handler(c);
                } catch (err) {
                    console.error(err);
                    res.writeHead(500);
                    res.end(JSON.stringify({ error: 'Internal Error' }));
                }
                return;
            }
        }
        
        res.writeHead(404);
        res.end();
    }
}

// Mock the module
vi.mock('@objectstack/runtime', () => {
    class MockObjectKernel {
        public metadata: any;
        public plugins: any[];
    
        constructor(plugins: any[]) {
            this.plugins = plugins || [];
            
            const entities: Record<string, any> = {};

            this.metadata = {
                register: vi.fn().mockImplementation((type, name, def) => {
                    if (type === 'object') {
                        entities[name] = def;
                    }
                }),
                get: vi.fn().mockImplementation((type, name) => {
                    if (type === 'object') return entities[name];
                    return null;
                }),
                list: vi.fn().mockImplementation((type) => {
                    if (type === 'object') return Object.values(entities);
                    return [];
                })
            };

            // Initialize plugins immediately upon construction, matching real Kernel behavior roughly
            this.plugins.forEach(p => {
                if (p && typeof p.init === 'function') {
                    p.init(this);
                }
            });
        }

        getDriver() {
            // Find the driver in the plugins list
            // In the test: new ObjectKernel([new MemoryDriver(), plugin]);
  let mockHonoApp: MockHonoApp;
  
  beforeAll(async () => {
    // Use a unique port for tests to avoid conflicts
    testPort = 9200 + Math.floor(Math.random() * 1000);
    
    // Create mock server
    mockHonoApp = new MockHonoApp();

    // Create test kernel with memory driver
    plugin = new RestPlugin({
      basePath: '/api'
    });
    
    kernel = new ObjectKernel([
      new MemoryDriver(),
      plugin
    ]);
    
    // Inject mock server service
    (kernel as any).services.set('http-server', { app: mockHonoApp });
    
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
    
    // Start listening
    await mockHonoApp.listen(testPort);
    
    await kernel.start();
    
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 500));
  }, 30000);
  
  afterAll(async () => {
    await kernel.stop();
    if (mockHonoApp) await mockHonoApp.close();
  }, 30000);
  
  // Run the Protocol TCK
  runProtocolTCK(
    () => new RESTEndpoint(plugin, kernel, testPort
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
        default:, testPort
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
          code: error.code || 'REST_ERROR',, testPort
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
    }, testPort
    
    const result = await response.json();
    return {
      success: true,
      data: result.data || result
    };
  }
  
  let mockHonoApp: MockHonoApp;
  
  beforeAll(async () => {
    // Use a unique port for tests to avoid conflicts
    testPort = 9200 + Math.floor(Math.random() * 1000);
    
    // Create mock server
    mockHonoApp = new MockHonoApp();
    
    // Create plugin
    plugin = new RestPlugin({
      basePath: '/api'
    });
    
    kernel = new ObjectKernel([
      new MemoryDriver(),
      plugin
    ]);
    , testPort
    // Inject mock server service
    (kernel as any).services.set('http-server', { app: mockHonoApp });
    
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

    // Start listening
    await mockHonoApp.listen(testPort);
    
    await kernel.start();
    
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 500));
  }, 30000);
  
  afterAll(async () => {
    await kernel.stop();
    if (mockHonoApp) await mockHonoApp.close();
  }, 30000);
  
  // Run the Protocol TCK
  runProtocolTCK(
    () => new RESTEndpoint(plugin, kernel, testPort
  
  afterAll(async () => {
    await kernel.stop();
    if (mockHonoApp) await mockHonoApp.close();, testPort
  }, 30000);
  
  // Run the Protocol TCK
  runProtocolTCK(
    () => new RESTEndpoint(plugin, kernel, testPort
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
