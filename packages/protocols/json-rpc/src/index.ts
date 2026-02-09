/**
 * JSON-RPC 2.0 Protocol Plugin for ObjectStack
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { RuntimePlugin, RuntimeContext } from '@objectql/types';
import { ObjectQLError } from '@objectql/types';
import { IncomingMessage, ServerResponse, createServer, Server } from 'http';
import {
    validateRequest,
    validateBatchRequest,
    validateResponse,
    validateBatchResponse,
    createErrorResponse,
    createSuccessResponse,
    JSONRPCValidationError,
    JSONRPCErrorCode,
} from './validation.js';

// Re-export validation utilities
export * from './validation.js';

/**
 * Configuration for the JSON-RPC Plugin
 */
export interface JSONRPCPluginConfig {
    /** Port to listen on (deprecated in favor of shared Hono server) */
    port?: number;
    /** Base path for JSON-RPC endpoint */
    basePath?: string;
    /** Enable CORS (handled by Hono usually, kept for config compatibility) */
    enableCORS?: boolean;
    /** Enable introspection methods */
    enableIntrospection?: boolean;
    /** Enable session management */
    enableSessions?: boolean;
    /** Session timeout in milliseconds (default: 30 minutes) */
    sessionTimeout?: number;
    /** Enable progress notifications via SSE */
    enableProgress?: boolean;
    /** Enable method call chaining in batch requests */
    enableChaining?: boolean;
}

/**
 * Session data
 */
interface Session {
    id: string;
    data: Record<string, any>;
    lastAccess: number;
    timeout?: NodeJS.Timeout;
}

/**
 * Progress notification
 */
interface ProgressNotification {
    method: string;
    params: {
        id: string;
        progress: number;
        total: number;
        message?: string;
    };
}

/**
 * JSON-RPC 2.0 Request
 */
interface _JSONRPCRequest {
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
 * - Batch request support with call chaining
 * - Notification support (requests without id)
 * - Built-in introspection methods (system.listMethods, system.describe)
 * - Session management for stateful operations
 * - Progress notifications via Server-Sent Events (SSE) (Partial support in Hono adapter)
 * - Method call chaining with result references
 * - CRUD operations mapped to RPC methods
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
 * 
 * @example
 * ```typescript
 * import { ObjectStackKernel } from '@objectstack/core';
 * import { JSONRPCPlugin } from '@objectql/protocol-json-rpc';
 * 
 * const kernel = new ObjectStackKernel([
 *   new JSONRPCPlugin({ 
 *     basePath: '/rpc',
 *     enableSessions: true
 *   })
 * ]);
 * await kernel.start();
 * ```
 */
export class JSONRPCPlugin implements RuntimePlugin {
    name = '@objectql/protocol-json-rpc';
    version = '0.2.0';
    
    private engine?: any;
    private config: Required<JSONRPCPluginConfig>;
    private methods: Map<string, Function>;
    private methodSignatures: Map<string, MethodSignature>;
    private sessions: Map<string, Session> = new Map();
    private progressClients: Map<string, Set<(data: string) => void>> = new Map();
    private server?: Server;

    constructor(config: JSONRPCPluginConfig = {}) {
        this.config = {
            port: config.port || 9000,
            basePath: config.basePath || '/rpc',
            enableCORS: config.enableCORS !== false,
            enableIntrospection: config.enableIntrospection !== false,
            enableSessions: config.enableSessions !== false,
            sessionTimeout: config.sessionTimeout || 30 * 60 * 1000, // 30 minutes
            enableProgress: config.enableProgress !== false,
            enableChaining: config.enableChaining !== false
        };
        
        this.methods = new Map();
        this.methodSignatures = new Map();
    }

    // --- Adapter for @objectstack/core compatibility ---
    init = async (kernel: any): Promise<void> => {
        const ctx: any = {
             engine: kernel,
             getKernel: () => kernel
        };
        // Ensure getService is available if passed from kernel
        if (kernel && kernel.context && kernel.context.getService) {
             ctx.getService = kernel.context.getService;
        }
        return this.install(ctx);
    }

    start = async (kernel: any): Promise<void> => {
        const ctx: any = {
            engine: kernel,
            getKernel: () => kernel
        };
        return this.onStart(ctx);
    }

    /**
     * Install hook - called during kernel initialization
     */
    async install(ctx: RuntimeContext): Promise<void> {
        // Store reference to the engine for later use
        this.engine = ctx.engine || (ctx as any).getKernel?.();
        
        // Register RPC methods
        this.registerMethods();
    }

    /**
     * Start hook - called when kernel starts
     */
    async onStart(ctx: RuntimeContext): Promise<void> {
        if (!this.engine) {
            throw new ObjectQLError({ code: 'PROTOCOL_ERROR', message: 'Protocol not initialized. Install hook must be called first.' });
        }

        // Check if Hono server is available via service injection
        // Try getting from local context first, then fallback to kernel engine
        let httpServer = (ctx as any).getService?.('http-server');
        
        if (!httpServer && this.engine && (this.engine as any).getService) {
            httpServer = (this.engine as any).getService('http-server');
        }

        // Compatibility fallback: try 'http.server' shim if registered
        if (!httpServer) {
             httpServer = (ctx as any).getService?.('http.server') ||
                          (this.engine as any).getService?.('http.server');
        }

        if (httpServer && httpServer.app) {
             this.attachToHono(httpServer.app);
             return;
        }
        
        // Start standalone HTTP server for testing/development
        
        // Create HTTP server
        this.server = createServer(this.handleRequest.bind(this));
        
        // Start listening
        await new Promise<void>((resolve, reject) => {
            const onError = (err: Error) => {
                this.server!.removeListener('error', onError);
                reject(err);
            };
            
            this.server!.on('error', onError);
            this.server!.listen(this.config.port, () => {
                this.server!.removeListener('error', onError);
                resolve();
            });
        });
    }


    /**
     * Stop hook - called when kernel stops
     */
    async onStop(_ctx: RuntimeContext): Promise<void> {
        // Stop the HTTP server
        if (this.server) {
            await new Promise<void>((resolve) => {
                this.server!.close((err) => {
                    if (err) {
                        // Error silently ignored
                    }
                    resolve();
                });
            });
        }
        // Cleanup sessions
        for (const session of this.sessions.values()) {
            if (session.timeout) {
                clearTimeout(session.timeout);
            }
        }
        this.sessions.clear();
    }

    /**
     * Handle HTTP request for standalone server
     */
    private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
        // Enable CORS if configured
        if (this.config.enableCORS) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            
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
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not Found' }));
            return;
        }

        // Only accept POST requests
        if (req.method !== 'POST') {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Method Not Allowed' }));
            return;
        }

        try {
            // Read request body with size limit (10MB)
            const maxBodySize = 10 * 1024 * 1024; // 10MB
            const chunks: Buffer[] = [];
            let totalSize = 0;
            
            for await (const chunk of req) {
                totalSize += chunk.length;
                if (totalSize > maxBodySize) {
                    res.writeHead(413, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(createErrorResponse(
                        null,
                        JSONRPCErrorCode.INVALID_REQUEST,
                        'Request body too large'
                    )));
                    return;
                }
                chunks.push(chunk);
            }
            
            const body = Buffer.concat(chunks).toString();
            const jsonBody = JSON.parse(body);
            
            // Handle batch or single request
            let response;
            if (Array.isArray(jsonBody)) {
                // Validate batch request
                try {
                    validateBatchRequest(jsonBody);
                } catch (error: any) {
                    if (error instanceof JSONRPCValidationError) {
                        response = createErrorResponse(null, error.code, error.message, error.data);
                    } else {
                        response = createErrorResponse(null, JSONRPCErrorCode.INVALID_REQUEST, 'Invalid batch request');
                    }
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(response));
                    return;
                }
                
                if (this.config.enableChaining) {
                    const responses = await this.processBatchWithChaining(jsonBody);
                    response = validateBatchResponse(responses);
                } else {
                    const responses = await Promise.all(
                        jsonBody.map((request: any) => this.processRequest(request))
                    );
                    const filteredResponses = responses.filter(r => r !== null);
                    response = validateBatchResponse(filteredResponses);
                }
            } else {
                response = await this.processRequest(jsonBody);
            }

            // Send response (don't send for notifications)
            if (response) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(response));
            } else {
                res.writeHead(204);
                res.end();
            }
        } catch (error) {
            const errorResponse = createErrorResponse(
                null,
                JSONRPCErrorCode.PARSE_ERROR,
                error instanceof Error ? error.message : 'Parse error'
            );
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(errorResponse));
        }
    }

    /**
     * Attach to Hono server
     */
    attachToHono(app: any) {
        const basePath = this.config.basePath;

        // Post handler for RPC requests
        app.post(basePath, async (c: any) => {
            try {
                const body = await c.req.json();
                
                // Handle batch requests with optional chaining
                if (Array.isArray(body)) {
                    // Validate batch request
                    try {
                        validateBatchRequest(body);
                    } catch (error: any) {
                        if (error instanceof JSONRPCValidationError) {
                            return c.json(createErrorResponse(null, error.code, error.message, error.data));
                        }
                        return c.json(createErrorResponse(null, JSONRPCErrorCode.INVALID_REQUEST, 'Invalid batch request'));
                    }
                    
                    if (this.config.enableChaining) {
                        const responses = await this.processBatchWithChaining(body);
                        const validatedResponses = validateBatchResponse(responses);
                        return c.json(validatedResponses);
                    } else {
                        const responses = await Promise.all(
                            body.map((request: any) => this.processRequest(request))
                        );
                        const filteredResponses = responses.filter(r => r !== null);
                        const validatedResponses = validateBatchResponse(filteredResponses);
                        return c.json(validatedResponses);
                    }
                } else {
                    const response = await this.processRequest(body);
                    // Don't send response for notifications
                    if (response) {
                        return c.json(response);
                    } else {
                        return c.body(null, 204);
                    }
                }
            } catch (_error) {
                const errorResponse = createErrorResponse(null, JSONRPCErrorCode.PARSE_ERROR, 'Parse error');
                return c.json(errorResponse);
            }
        });

        // SSE endpoint for progress notifications
        if (this.config.enableProgress) {
            app.get(`${basePath}/progress/:sessionId`, async (c: any) => {
                const sessionId = c.req.param('sessionId');
                
                // Set SSE headers
                c.header('Content-Type', 'text/event-stream');
                c.header('Cache-Control', 'no-cache');
                c.header('Connection', 'keep-alive');

                // Use Hono's stream helper
                return c.streamText(async (stream: any) => {
                    // Create a callback for this client
                    const callback = (data: string) => {
                        stream.write(data);
                    };

                    // Register client
                    if (!this.progressClients.has(sessionId)) {
                        this.progressClients.set(sessionId, new Set());
                    }
                    this.progressClients.get(sessionId)!.add(callback);

                    // Send initial connection message
                    await stream.write(`data: ${JSON.stringify({ type: 'connected', sessionId })}\n\n`);

                    // Keep connection alive with heartbeat
                    const heartbeat = setInterval(async () => {
                        try {
                            await stream.write(`: heartbeat\n\n`);
                        } catch (_e) {
                            clearInterval(heartbeat);
                        }
                    }, 30000); // 30 seconds

                    // Handle client disconnect
                    c.req.raw.signal.addEventListener('abort', () => {
                        clearInterval(heartbeat);
                        const clients = this.progressClients.get(sessionId);
                        if (clients) {
                            clients.delete(callback);
                            if (clients.size === 0) {
                                this.progressClients.delete(sessionId);
                            }
                        }
                    });
                });
            });
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
            } catch (_e) {
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
            } catch (_e) {
                return [];
            }
        }
        
        return [];
    }
    
    /**
     * Helper: Get data by ID
     */
    private async getData(objectName: string, id: string): Promise<any> {
        if (!this.engine) return null;
        
        if (typeof this.engine.get === 'function') {
            return await this.engine.get(objectName, id);
        }
        
        if (this.engine.repository && typeof this.engine.repository.get === 'function') {
            return await this.engine.repository.get(objectName, id);
        }
        
        if (this.engine.repository && typeof this.engine.repository.findOne === 'function') {
            return await this.engine.repository.findOne(objectName, id);
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
        
        if (this.engine.repository && typeof this.engine.repository.find === 'function') {
            const result = await this.engine.repository.find(objectName, query);
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
        
        if (this.engine.repository && typeof this.engine.repository.create === 'function') {
            return await this.engine.repository.create(objectName, data);
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
        
        if (this.engine.repository && typeof this.engine.repository.update === 'function') {
            return await this.engine.repository.update(objectName, id, data);
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
        
        if (this.engine.repository && typeof this.engine.repository.delete === 'function') {
            return await this.engine.repository.delete(objectName, id);
        }
        
        return false;
    }
    
    /**
     * Helper: Count data
     */
    private async countData(objectName: string, filters?: any): Promise<number> {
        if (!this.engine) return 0;
        
        if (typeof this.engine.count === 'function') {
            return await this.engine.count(objectName, filters);
        }
        
        if (this.engine.repository && typeof this.engine.repository.count === 'function') {
            return await this.engine.repository.count(objectName, filters);
        }
        
        return 0;
    }
    
    /**
     * Helper: Execute action
     */
    private async executeAction(actionName: string, params?: any): Promise<any> {
        if (!this.engine) {
            throw new ObjectQLError({ code: 'INTERNAL_ERROR', message: 'Engine not initialized' });
        }
        
        if (typeof this.engine.executeAction === 'function') {
            return await this.engine.executeAction(actionName, params);
        }
        
        throw new ObjectQLError({ code: 'PROTOCOL_METHOD_NOT_FOUND', message: 'Action execution not supported by engine' });
    }
    
    /**
     * Helper: List actions
     */
    private async listActions(): Promise<string[]> {
        if (!this.engine) return [];
        
        if (typeof this.engine.listActions === 'function') {
            return await this.engine.listActions();
        }
        
        if (this.engine.actions && typeof this.engine.actions.list === 'function') {
            const actions = await this.engine.actions.list();
            return actions.map((action: any) => action.name || action.id).filter(Boolean);
        }
        
        return [];
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
            return await this.countData(objectName, filters);
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
                throw new ObjectQLError({ code: 'PROTOCOL_INVALID_REQUEST', message: 'Invalid metaType parameter: must be a non-empty string' });
            }
            
            return this.getMetaItems(metaType);
        });
        this.methodSignatures.set('metadata.getAll', {
            params: ['metaType'],
            description: 'Get all metadata items of a specific type'
        });

        // Action methods
        this.methods.set('action.execute', async (actionName: string, params?: any) => {
            return await this.executeAction(actionName, params);
        });
        this.methodSignatures.set('action.execute', {
            params: ['actionName', 'params'],
            description: 'Execute a custom action'
        });

        this.methods.set('action.list', async () => {
            return await this.listActions();
        });
        this.methodSignatures.set('action.list', {
            params: [],
            description: 'List all registered actions'
        });

        // Session methods (if enabled)
        if (this.config.enableSessions) {
            this.methods.set('session.create', async () => {
                const sessionId = this.generateSessionId();
                this.createSession(sessionId);
                return { sessionId };
            });
            this.methodSignatures.set('session.create', {
                params: [],
                description: 'Create a new session'
            });

            this.methods.set('session.get', async (sessionId: string, key: string) => {
                const session = this.sessions.get(sessionId);
                if (!session) {
                    throw new ObjectQLError({ code: 'NOT_FOUND', message: 'Session not found or expired' });
                }
                this.updateSessionAccess(sessionId);
                return session.data[key];
            });
            this.methodSignatures.set('session.get', {
                params: ['sessionId', 'key'],
                description: 'Get value from session'
            });

            this.methods.set('session.set', async (sessionId: string, key: string, value: any) => {
                const session = this.sessions.get(sessionId);
                if (!session) {
                    throw new ObjectQLError({ code: 'NOT_FOUND', message: 'Session not found or expired' });
                }
                this.updateSessionAccess(sessionId);
                session.data[key] = value;
                return { success: true };
            });
            this.methodSignatures.set('session.set', {
                params: ['sessionId', 'key', 'value'],
                description: 'Set value in session'
            });

            this.methods.set('session.destroy', async (sessionId: string) => {
                this.destroySession(sessionId);
                return { success: true };
            });
            this.methodSignatures.set('session.destroy', {
                params: ['sessionId'],
                description: 'Destroy a session'
            });
        }

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
                    throw new ObjectQLError({ code: 'PROTOCOL_METHOD_NOT_FOUND', message: `Method not found: ${methodName}` });
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
     * Process a single JSON-RPC request
     */
    private async processRequest(request: any): Promise<JSONRPCResponse | null> {
        try {
            // Validate JSON-RPC 2.0 format using Zod schema
            const validatedRequest = validateRequest(request);

            // Check if this is a notification (no id)
            const isNotification = validatedRequest.id === undefined;

            try {
                // Find method
                const method = this.methods.get(validatedRequest.method);
                if (!method) {
                    if (isNotification) return null;
                    return createErrorResponse(
                        validatedRequest.id ?? null,
                        JSONRPCErrorCode.METHOD_NOT_FOUND,
                        `Method not found: ${validatedRequest.method}`
                    );
                }

                // Execute method with params
                let result: any;
                if (Array.isArray(validatedRequest.params)) {
                    // Positional parameters - pass directly
                    result = await method(...validatedRequest.params);
                } else if (validatedRequest.params && typeof validatedRequest.params === 'object' && !Array.isArray(validatedRequest.params)) {
                    // Named parameters - map to positional based on method signature
                    const signature = this.methodSignatures.get(validatedRequest.method);
                    if (signature && signature.params.length > 0) {
                        // Map named params to positional array
                        const positionalParams = signature.params.map((paramName, _index) => {
                            const value = (validatedRequest.params as Record<string, any>)[paramName];
                            // Note: undefined values are allowed - the method will handle validation
                            // If you need stricter validation, check required params here
                            return value;
                        });
                        result = await method(...positionalParams);
                    } else {
                        // No signature or no params - pass params object as single argument
                        // This handles methods that accept a single object parameter
                        result = await method(validatedRequest.params);
                    }
                } else {
                    // No parameters
                    result = await method();
                }

                // Don't send response for notifications
                if (isNotification) return null;

                const response = createSuccessResponse(validatedRequest.id ?? null, result);
                return validateResponse(response);
            } catch (error: any) {
                if (isNotification) return null;
                
                // Handle validation errors
                if (error instanceof JSONRPCValidationError) {
                    return createErrorResponse(
                        validatedRequest.id ?? null,
                        error.code,
                        error.message,
                        error.data
                    );
                }

                return createErrorResponse(
                    validatedRequest.id ?? null,
                    JSONRPCErrorCode.INTERNAL_ERROR,
                    error instanceof Error ? error.message : 'Internal error'
                );
            }
        } catch (error: any) {
            // Handle request validation errors
            if (error instanceof JSONRPCValidationError) {
                return createErrorResponse(
                    null,
                    error.code,
                    error.message,
                    error.data
                );
            }
            
            // Fallback for unexpected errors
            return createErrorResponse(
                null,
                JSONRPCErrorCode.INVALID_REQUEST,
                error instanceof Error ? error.message : 'Invalid request'
            );
        }
    }

    /**
     * Process batch requests with call chaining support
     */
    private async processBatchWithChaining(requests: any[]): Promise<JSONRPCResponse[]> {
        const results = new Map<number | string, any>();
        const responses: JSONRPCResponse[] = [];
        
        for (const request of requests) {
            // Resolve parameter references
            if (request.params) {
                request.params = this.resolveReferences(request.params, results);
            }
            
            // Process request
            const response = await this.processRequest(request);
            
            // Store result for future references
            if (response && request.id !== undefined) {
                results.set(request.id, response);
            }
            
            if (response) {
                responses.push(response);
            }
        }
        
        return responses;
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
     * Generate a unique session ID
     */
    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Create a new session
     */
    private createSession(sessionId: string): void {
        const session: Session = {
            id: sessionId,
            data: {},
            lastAccess: Date.now(),
            timeout: setTimeout(() => {
                this.destroySession(sessionId);
            }, this.config.sessionTimeout)
        };
        
        this.sessions.set(sessionId, session);
    }

    /**
     * Update session access time and reset timeout
     */
    private updateSessionAccess(sessionId: string): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;
        
        session.lastAccess = Date.now();
        
        // Reset timeout
        if (session.timeout) {
            clearTimeout(session.timeout);
        }
        session.timeout = setTimeout(() => {
            this.destroySession(sessionId);
        }, this.config.sessionTimeout);
    }

    /**
     * Destroy a session
     */
    private destroySession(sessionId: string): void {
        const session = this.sessions.get(sessionId);
        if (session && session.timeout) {
            clearTimeout(session.timeout);
        }
        this.sessions.delete(sessionId);
    }

    /**
     * Send progress notification to SSE clients
     */
    private sendProgress(sessionId: string, progress: ProgressNotification): void {
        const clients = this.progressClients.get(sessionId);
        if (!clients || clients.size === 0) return;

        const message = `data: ${JSON.stringify(progress)}\n\n`;
        
        // Send to all connected clients for this session
        clients.forEach(callback => {
            try {
                callback(message);
            } catch (_error) {
                // Error silently ignored
            }
        });
    }

    /**
     * Send progress update for a specific operation
     */
    public emitProgress(sessionId: string, operationId: string, progress: number, total: number, message?: string): void {
        if (!this.config.enableProgress) return;

        const notification: ProgressNotification = {
            method: 'progress.update',
            params: {
                id: operationId,
                progress,
                total,
                message
            }
        };

        this.sendProgress(sessionId, notification);
    }

    /**
     * Resolve result references in batch requests (e.g., $1.result.id)
     */
    private resolveReferences(params: any, results: Map<number | string, any>): any {
        if (typeof params === 'string' && params.startsWith('$')) {
            // Parse reference: $1.result.id
            const match = params.match(/^\$(\d+)\.(.+)$/);
            if (match) {
                const [, refId, path] = match;
                const result = results.get(parseInt(refId));
                if (result) {
                    // Navigate path: result.id
                    const parts = path.split('.');
                    let value = result;
                    for (const part of parts) {
                        value = value?.[part];
                    }
                    return value;
                }
            }
        } else if (Array.isArray(params)) {
            return params.map(p => this.resolveReferences(p, results));
        } else if (typeof params === 'object' && params !== null) {
            const resolved: any = {};
            for (const [key, value] of Object.entries(params)) {
                resolved[key] = this.resolveReferences(value, results);
            }
            return resolved;
        }
        
        return params;
    }
}
