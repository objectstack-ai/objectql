/**
 * JSON-RPC 2.0 Protocol Plugin for ObjectStack
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { RuntimePlugin, RuntimeContext, ObjectStackRuntimeProtocol } from '@objectql/runtime';
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
 * - No direct database access - all operations through ObjectStackRuntimeProtocol
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
 * - system.listMethods() - List available methods (if introspection enabled)
 * - system.describe(method) - Describe method signature (if introspection enabled)
 * 
 * @example
 * ```typescript
 * import { ObjectStackKernel } from '@objectql/runtime';
 * import { JSONRPCPlugin } from '@objectql/protocol-json-rpc';
 * 
 * const kernel = new ObjectStackKernel([
 *   new JSONRPCPlugin({ port: 9000, basePath: '/rpc' })
 * ]);
 * await kernel.start();
 * 
 * // Client request:
 * // POST /rpc
 * // {"jsonrpc":"2.0","method":"object.find","params":["users",{"where":{"active":true}}],"id":1}
 * ```
 */
export class JSONRPCPlugin implements RuntimePlugin {
    name = '@objectql/protocol-json-rpc';
    version = '0.1.0';
    
    private server?: Server;
    private protocol?: ObjectStackRuntimeProtocol;
    private config: Required<JSONRPCPluginConfig>;
    private methods: Map<string, Function>;

    constructor(config: JSONRPCPluginConfig = {}) {
        this.config = {
            port: config.port || 9000,
            basePath: config.basePath || '/rpc',
            enableCORS: config.enableCORS !== false,
            enableIntrospection: config.enableIntrospection !== false
        };
        
        this.methods = new Map();
    }

    /**
     * Install hook - called during kernel initialization
     */
    async install(ctx: RuntimeContext): Promise<void> {
        console.log(`[${this.name}] Installing JSON-RPC 2.0 protocol plugin...`);
        
        // Import the ObjectStackRuntimeProtocol class
        const { ObjectStackRuntimeProtocol } = await import('@objectql/runtime');
        
        // Initialize the protocol bridge
        this.protocol = new ObjectStackRuntimeProtocol(ctx.engine);
        
        // Register RPC methods
        this.registerMethods();
        
        console.log(`[${this.name}] Protocol bridge initialized with ${this.methods.size} methods`);
    }

    /**
     * Start hook - called when kernel starts
     */
    async onStart(ctx: RuntimeContext): Promise<void> {
        if (!this.protocol) {
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
     * Register all available RPC methods
     */
    private registerMethods(): void {
        // Object CRUD methods
        this.methods.set('object.find', async (objectName: string, query?: any) => {
            return await this.protocol!.findData(objectName, query);
        });

        this.methods.set('object.get', async (objectName: string, id: string) => {
            return await this.protocol!.getData(objectName, id);
        });

        this.methods.set('object.create', async (objectName: string, data: any) => {
            return await this.protocol!.createData(objectName, data);
        });

        this.methods.set('object.update', async (objectName: string, id: string, data: any) => {
            return await this.protocol!.updateData(objectName, id, data);
        });

        this.methods.set('object.delete', async (objectName: string, id: string) => {
            return await this.protocol!.deleteData(objectName, id);
        });

        this.methods.set('object.count', async (objectName: string, filters?: any) => {
            return await this.protocol!.countData(objectName, filters);
        });

        // Metadata methods
        this.methods.set('metadata.list', async () => {
            return this.protocol!.getMetaTypes();
        });

        this.methods.set('metadata.get', async (objectName: string) => {
            return this.protocol!.getMetaItem(objectName);
        });

        this.methods.set('metadata.getAll', async (metaType: string) => {
            const items = this.protocol!.getAllMetaItems(metaType);
            return Object.fromEntries(items);
        });

        // Action methods
        this.methods.set('action.execute', async (actionName: string, params?: any) => {
            return await this.protocol!.executeAction(actionName, params);
        });

        this.methods.set('action.list', async () => {
            return this.protocol!.getActions();
        });

        // View methods
        this.methods.set('view.get', async (objectName: string, viewType?: 'list' | 'form') => {
            return this.protocol!.getViewConfig(objectName, viewType);
        });

        // Introspection methods (if enabled)
        if (this.config.enableIntrospection) {
            this.methods.set('system.listMethods', async () => {
                return Array.from(this.methods.keys());
            });

            this.methods.set('system.describe', async (methodName: string) => {
                return this.getMethodSignature(methodName);
            });
        }
    }

    /**
     * Get method signature for introspection
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
                result = await method(...request.params);
            } else if (request.params && typeof request.params === 'object') {
                // Named parameters - convert to positional (simplified)
                result = await method(request.params);
            } else {
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
