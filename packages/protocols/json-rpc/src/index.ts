/**
 * JSON-RPC 2.0 Protocol Plugin for ObjectStack
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { RuntimePlugin, RuntimeContext } from '@objectql/types';
import { IncomingMessage, ServerResponse, createServer, Server } from 'http';

/**
 * Configuration for the JSON-RPC Plugin
 */
export interface JSONRPCPluginConfig {
    /** Port to listen on */
    port?: number;
    /** Base path for JSON-RPC endpoint */
    basePath?: string;
    /** Enable CORS */
    enableCORS?: boolean;
    /** Enable introspection methods */
    enableIntrospection?: boolean;
}

/**
 * JSON-RPC 2.0 Request
 */
interface JSONRPCRequest {
    jsonrpc: '2.0';
    method: string;
    params?: any[] | Record<string, any>;
    id?: string | number | null;
}

/**
 * JSON-RPC 2.0 Response
 */
interface JSONRPCResponse {
    jsonrpc: '2.0';
    result?: any;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
    id: string | number | null;
}

/**
 * Method signature for parameter mapping
 */
interface MethodSignature {
    params: string[];
    description?: string;
}

/**
 * JSON-RPC 2.0 Protocol Plugin
 * 
 * Implements the RuntimePlugin interface to provide JSON-RPC 2.0 protocol support.
 * 
 * Key Features:
 * - Full JSON-RPC 2.0 specification compliance
 * - Batch request support
 * - Notification support (requests without id)
 * - Built-in introspection methods (system.listMethods, system.describe)
 * - CRUD operations mapped to RPC methods
 * - Named and positional parameter support
 * - No direct database access - all operations through ObjectStackProtocolImplementation
 * 
 * Available RPC Methods:
 * - object.find(objectName, query) - Find multiple records
 * - object.get(objectName, id) - Get single record
 * - object.create(objectName, data) - Create record
 * - object.update(objectName, id, data) - Update record
 * - object.delete(objectName, id) - Delete record
 * - object.count(objectName, filters) - Count records
 * - metadata.list() - List all objects
 * - metadata.get(objectName) - Get object metadata
 * - action.execute(actionName, params) - Execute custom action
 * - system.listMethods() - List available methods (if introspection enabled)
 * - system.describe(method) - Describe method signature (if introspection enabled)
 * 
 * @example
 * ```typescript
 * import { ObjectKernel } from '@objectstack/runtime';
 * import { JSONRPCPlugin } from '@objectql/protocol-json-rpc';
 * 
 * const kernel = new ObjectKernel([
 *   new JSONRPCPlugin({ port: 9000, basePath: '/rpc' })
 * ]);
 * await kernel.start();
 * 
 * // Client request (positional):
 * // POST /rpc
 * // {"jsonrpc":"2.0","method":"object.find","params":["users",{"where":{"active":true}}],"id":1}
 * 
 * // Client request (named):
 * // POST /rpc
 * // {"jsonrpc":"2.0","method":"object.find","params":{"objectName":"users","query":{"where":{"active":true}}},"id":1}
 * ```
 */
export class JSONRPCPlugin implements RuntimePlugin {
    name = '@objectql/protocol-json-rpc';
    version = '0.1.0';
    
    private server?: Server;
    private engine?: any;
    private config: Required<JSONRPCPluginConfig>;
    private methods: Map<string, Function>;
    private methodSignatures: Map<string, MethodSignature>;

    constructor(config: JSONRPCPluginConfig = {}) {
        this.config = {
            port: config.port || 9000,
            basePath: config.basePath || '/rpc',
            enableCORS: config.enableCORS !== false,
            enableIntrospection: config.enableIntrospection !== false
        };
        
        this.methods = new Map();
        this.methodSignatures = new Map();
    }

    /**
     * Install hook - called during kernel initialization
     */
    async install(ctx: RuntimeContext): Promise<void> {
        console.log(`[${this.name}] Installing JSON-RPC 2.0 protocol plugin...`);
        
        // Store reference to the engine for later use
        this.engine = ctx.engine || (ctx as any).getKernel?.();
        
        // Register RPC methods
        this.registerMethods();
        
        console.log(`[${this.name}] Protocol bridge initialized with ${this.methods.size} methods`);
    }

    /**
     * Start hook - called when kernel starts
     */
    async onStart(ctx: RuntimeContext): Promise<void> {
        if (!this.engine) {
            throw new Error('Protocol not initialized. Install hook must be called first.');
        }

        console.log(`[${this.name}] Starting JSON-RPC 2.0 server...`);

        // Create HTTP server
        this.server = createServer((req, res) => this.handleRequest(req, res));

        // Start listening
        await new Promise<void>((resolve) => {
            this.server!.listen(this.config.port, () => {
                console.log(`[${this.name}] JSON-RPC 2.0 server listening on http://localhost:${this.config.port}${this.config.basePath}`);
                resolve();
            });
        });
    }

    /**
     * Stop hook - called when kernel stops
     */
    async onStop(ctx: RuntimeContext): Promise<void> {
        if (this.server) {
            console.log(`[${this.name}] Stopping JSON-RPC 2.0 server...`);
            await new Promise<void>((resolve, reject) => {
                this.server!.close((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            this.server = undefined;
        }
    }

    /**
     * Helper: Get list of registered object types from metadata
     */
    private getMetaTypes(): string[] {
        if (!this.engine?.metadata) return [];
        
        if (typeof this.engine.metadata.getTypes === 'function') {
            const types = this.engine.metadata.getTypes();
            return types.filter((t: string) => {
                const items = this.engine.metadata.list(t);
                return items && items.length > 0;
            }).filter((t: string) => t === 'object');
        }
        
        if (typeof this.engine.metadata.list === 'function') {
            try {
                const objects = this.engine.metadata.list('object');
                return objects.map((obj: any) => obj.name || obj.id).filter(Boolean);
            } catch (e) {
                return [];
            }
        }
        
        return [];
    }
    
    /**
     * Helper: Get metadata item
     */
    private getMetaItem(type: string, name: string): any {
        if (!this.engine?.metadata) return null;
        
        if (typeof this.engine.metadata.get === 'function') {
            return this.engine.metadata.get(type, name);
        }
        
        return null;
    }
    
    /**
     * Helper: Get all metadata items of a type
     */
    private getMetaItems(type: string): any[] {
        if (!this.engine?.metadata) return [];
        
        if (typeof this.engine.metadata.list === 'function') {
            try {
                return this.engine.metadata.list(type);
            } catch (e) {
                return [];
            }
        }
        
        return [];
    }
    
    /**
     * Helper: Get UI view
     */
    private getUiView(objectName: string, viewType: 'list' | 'form'): any {
        if (!this.engine) return null;
        
        if (typeof this.engine.getView === 'function') {
            return this.engine.getView(objectName, viewType);
        }
        
        return null;
    }
    
    /**
     * Helper: Get data by ID
     */
    private async getData(objectName: string, id: string): Promise<any> {
        if (!this.engine) return null;
        
        if (typeof this.engine.get === 'function') {
            return await this.engine.get(objectName, id);
        }
        
        return null;
    }
    
    /**
     * Helper: Find data with query
     */
    private async findData(objectName: string, query: any): Promise<any[]> {
        if (!this.engine) return [];
        
        if (typeof this.engine.find === 'function') {
            const result = await this.engine.find(objectName, query);
            return Array.isArray(result) ? result : (result?.value || []);
        }
        
        return [];
    }
    
    /**
     * Helper: Create data
     */
    private async createData(objectName: string, data: any): Promise<any> {
        if (!this.engine) return null;
        
        if (typeof this.engine.create === 'function') {
            return await this.engine.create(objectName, data);
        }
        
        return null;
    }
    
    /**
     * Helper: Update data
     */
    private async updateData(objectName: string, id: string, data: any): Promise<any> {
        if (!this.engine) return null;
        
        if (typeof this.engine.update === 'function') {
            return await this.engine.update(objectName, id, data);
        }
        
        return null;
    }
    
    /**
     * Helper: Delete data
     */
    private async deleteData(objectName: string, id: string): Promise<boolean> {
        if (!this.engine) return false;
        
        if (typeof this.engine.delete === 'function') {
            return await this.engine.delete(objectName, id);
        }
        
        return false;
    }

    /**
     * Register all available RPC methods with their signatures
     */
    private registerMethods(): void {
        // Object CRUD methods
        this.methods.set('object.find', async (objectName: string, query?: any) => {
            return await this.findData(objectName, query);
        });
        this.methodSignatures.set('object.find', {
            params: ['objectName', 'query'],
            description: 'Find records matching query'
        });

        this.methods.set('object.get', async (objectName: string, id: string) => {
            return await this.getData(objectName, id);
        });
        this.methodSignatures.set('object.get', {
            params: ['objectName', 'id'],
            description: 'Get a single record by ID'
        });

        this.methods.set('object.create', async (objectName: string, data: any) => {
            return await this.createData(objectName, data);
        });
        this.methodSignatures.set('object.create', {
            params: ['objectName', 'data'],
            description: 'Create a new record'
        });

        this.methods.set('object.update', async (objectName: string, id: string, data: any) => {
            return await this.updateData(objectName, id, data);
        });
        this.methodSignatures.set('object.update', {
            params: ['objectName', 'id', 'data'],
            description: 'Update an existing record'
        });

        this.methods.set('object.delete', async (objectName: string, id: string) => {
            return await this.deleteData(objectName, id);
        });
        this.methodSignatures.set('object.delete', {
            params: ['objectName', 'id'],
            description: 'Delete a record'
        });

        this.methods.set('object.count', async (objectName: string, filters?: any) => {
            // Not supported in protocol 
            throw new Error('Method not implemented: object.count');
        });
        this.methodSignatures.set('object.count', {
            params: ['objectName', 'filters'],
            description: 'Count records matching filters'
        });

        // Metadata methods
        this.methods.set('metadata.list', async () => {
            return this.getMetaTypes();
        });
        this.methodSignatures.set('metadata.list', {
            params: [],
            description: 'List all registered objects'
        });

        this.methods.set('metadata.get', async (objectName: string) => {
            return this.getMetaItem('object', objectName);
        });
        this.methodSignatures.set('metadata.get', {
            params: ['objectName'],
            description: 'Get metadata for a specific object'
        });

        this.methods.set('metadata.getAll', async (metaType: string) => {
            // Validate metaType parameter
            if (!metaType || typeof metaType !== 'string') {
                throw new Error('Invalid metaType parameter: must be a non-empty string');
            }
            
            return this.getMetaItems(metaType);
        });
        this.methodSignatures.set('metadata.getAll', {
            params: ['metaType'],
            description: 'Get all metadata items of a specific type'
        });

        // Action methods
        this.methods.set('action.execute', async (actionName: string, params?: any) => {
            throw new Error('Method not implemented: action.execute');
        });
        this.methodSignatures.set('action.execute', {
            params: ['actionName', 'params'],
            description: 'Execute a custom action'
        });

        this.methods.set('action.list', async () => {
             throw new Error('Method not implemented: action.list');
        });
        this.methodSignatures.set('action.list', {
            params: [],
            description: 'List all registered actions'
        });

        // View methods
        this.methods.set('view.get', async (objectName: string, viewType?: 'list' | 'form') => {
            return this.getUiView(objectName, viewType || 'list');
        });
        this.methodSignatures.set('view.get', {
            params: ['objectName', 'viewType'],
            description: 'Get view configuration for an object'
        });

        // Introspection methods (if enabled)
        if (this.config.enableIntrospection) {
            this.methods.set('system.listMethods', async () => {
                return Array.from(this.methods.keys());
            });
            this.methodSignatures.set('system.listMethods', {
                params: [],
                description: 'List all available methods'
            });

            this.methods.set('system.describe', async (methodName: string) => {
                const signature = this.methodSignatures.get(methodName);
                if (!signature) {
                    throw new Error(`Method not found: ${methodName}`);
                }
                return signature;
            });
            this.methodSignatures.set('system.describe', {
                params: ['methodName'],
                description: 'Get method signature and description'
            });
        }
    }

    /**
     * Get method signature for introspection (deprecated - use methodSignatures map)
     * @deprecated Use this.methodSignatures.get(methodName) instead
     */
    private getMethodSignature(methodName: string): any {
        const signatures: Record<string, any> = {
            'object.find': {
                description: 'Find multiple records',
                params: [
                    { name: 'objectName', type: 'string', required: true },
                    { name: 'query', type: 'object', required: false }
                ],
                returns: { type: 'object', properties: ['value', 'count'] }
            },
            'object.get': {
                description: 'Get a single record by ID',
                params: [
                    { name: 'objectName', type: 'string', required: true },
                    { name: 'id', type: 'string', required: true }
                ],
                returns: { type: 'object' }
            },
            'object.create': {
                description: 'Create a new record',
                params: [
                    { name: 'objectName', type: 'string', required: true },
                    { name: 'data', type: 'object', required: true }
                ],
                returns: { type: 'object' }
            },
            'object.update': {
                description: 'Update an existing record',
                params: [
                    { name: 'objectName', type: 'string', required: true },
                    { name: 'id', type: 'string', required: true },
                    { name: 'data', type: 'object', required: true }
                ],
                returns: { type: 'object' }
            },
            'object.delete': {
                description: 'Delete a record',
                params: [
                    { name: 'objectName', type: 'string', required: true },
                    { name: 'id', type: 'string', required: true }
                ],
                returns: { type: 'boolean' }
            },
            'metadata.list': {
                description: 'List all registered object types',
                params: [],
                returns: { type: 'array', items: 'string' }
            },
            'metadata.get': {
                description: 'Get metadata for a specific object',
                params: [
                    { name: 'objectName', type: 'string', required: true }
                ],
                returns: { type: 'object' }
            }
        };

        return signatures[methodName] || { description: 'No description available' };
    }

    /**
     * Main HTTP request handler
     */
    private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
        // Enable CORS if configured
        if (this.config.enableCORS) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(204);
                res.end();
                return;
            }
        }

        const url = req.url || '/';
        const basePath = this.config.basePath;

        // Check if request is for RPC endpoint
        if (!url.startsWith(basePath)) {
            this.sendError(res, null, -32600, 'Invalid Request: Wrong endpoint');
            return;
        }

        // Only accept POST requests
        if (req.method !== 'POST') {
            this.sendError(res, null, -32600, 'Invalid Request: Method must be POST');
            return;
        }

        try {
            const body = await this.readBody(req);
            
            // Handle batch requests
            if (Array.isArray(body)) {
                const responses = await Promise.all(
                    body.map(request => this.processRequest(request))
                );
                this.sendJSON(res, 200, responses);
            } else {
                const response = await this.processRequest(body);
                // Don't send response for notifications
                if (response) {
                    this.sendJSON(res, 200, response);
                } else {
                    res.writeHead(204);
                    res.end();
                }
            }
        } catch (error) {
            console.error(`[${this.name}] Request error:`, error);
            this.sendError(res, null, -32700, 'Parse error');
        }
    }

    /**
     * Process a single JSON-RPC request
     */
    private async processRequest(request: any): Promise<JSONRPCResponse | null> {
        // Validate JSON-RPC 2.0 format
        if (request.jsonrpc !== '2.0') {
            return this.createErrorResponse(request.id, -32600, 'Invalid Request: jsonrpc must be "2.0"');
        }

        if (typeof request.method !== 'string') {
            return this.createErrorResponse(request.id, -32600, 'Invalid Request: method must be a string');
        }

        // Check if this is a notification (no id)
        const isNotification = request.id === undefined;

        try {
            // Find method
            const method = this.methods.get(request.method);
            if (!method) {
                if (isNotification) return null;
                return this.createErrorResponse(request.id, -32601, `Method not found: ${request.method}`);
            }

            // Execute method with params
            let result: any;
            if (Array.isArray(request.params)) {
                // Positional parameters - pass directly
                result = await method(...request.params);
            } else if (request.params && typeof request.params === 'object') {
                // Named parameters - map to positional based on method signature
                const signature = this.methodSignatures.get(request.method);
                if (signature && signature.params.length > 0) {
                    // Map named params to positional array
                    const positionalParams = signature.params.map((paramName, index) => {
                        const value = request.params[paramName];
                        // Note: undefined values are allowed - the method will handle validation
                        // If you need stricter validation, check required params here
                        return value;
                    });
                    result = await method(...positionalParams);
                } else {
                    // No signature or no params - pass params object as single argument
                    // This handles methods that accept a single object parameter
                    result = await method(request.params);
                }
            } else {
                // No parameters
                result = await method();
            }

            // Don't send response for notifications
            if (isNotification) return null;

            return {
                jsonrpc: '2.0',
                result,
                id: request.id
            };
        } catch (error) {
            if (isNotification) return null;
            
            return this.createErrorResponse(
                request.id,
                -32603,
                error instanceof Error ? error.message : 'Internal error'
            );
        }
    }

    /**
     * Create JSON-RPC error response
     */
    private createErrorResponse(id: any, code: number, message: string, data?: any): JSONRPCResponse {
        return {
            jsonrpc: '2.0',
            error: {
                code,
                message,
                data
            },
            id: id ?? null
        };
    }

    /**
     * Read request body as JSON
     */
    private readBody(req: IncomingMessage): Promise<any> {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => {
                if (!body) {
                    reject(new Error('Empty body'));
                    return;
                }
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    reject(new Error('Invalid JSON'));
                }
            });
            req.on('error', reject);
        });
    }

    /**
     * Send JSON response
     */
    private sendJSON(res: ServerResponse, statusCode: number, data: any): void {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(statusCode);
        res.end(JSON.stringify(data, null, 2));
    }

    /**
     * Send error response
     */
    private sendError(res: ServerResponse, id: any, code: number, message: string): void {
        this.sendJSON(res, 200, this.createErrorResponse(id, code, message));
    }
}
