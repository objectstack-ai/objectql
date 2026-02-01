/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { IObjectQL, ApiRouteConfig, resolveApiRoutes } from '@objectql/types';
import { IncomingMessage, ServerResponse } from 'http';
import { ObjectQLServer } from './server';
import { ErrorCode } from './types';

/**
 * Read and parse request body as JSON
 */
function readBody(req: IncomingMessage, maxSize = 1024 * 1024): Promise<any> {
    return new Promise((resolve, reject) => {
        let body = '';
        let size = 0;
        
        req.on('data', chunk => {
            size += chunk.length;
            if (size > maxSize) {
                reject(new Error('Request body too large'));
                return;
            }
            body += chunk.toString();
        });
        
        req.on('end', () => {
            if (!body) return resolve({});
            try {
                resolve(JSON.parse(body));
            } catch (e) {
                reject(e);
            }
        });
        req.on('error', reject);
    });
}

/**
 * Options for createNodeHandler
 */
export interface NodeHandlerOptions {
    /** Custom API route configuration */
    routes?: ApiRouteConfig;
    /** Maximum request body size in bytes (default: 1MB) */
    maxBodySize?: number;
    /** CORS allowed origins (default: '*' for development, should be restricted in production) */
    corsOrigins?: string | string[];
}

/**
 * Creates a Node.js HTTP handler for ObjectQL JSON-RPC protocol.
 * This handler processes JSON-RPC 2.0 style requests.
 * 
 * @param app - ObjectQL application instance
 * @param options - Optional configuration including custom routes
 * @returns Node.js HTTP request handler
 */
export function createNodeHandler(app: IObjectQL, options?: NodeHandlerOptions) {
    const server = new ObjectQLServer(app);
    const routes = resolveApiRoutes(options?.routes);
    const maxBodySize = options?.maxBodySize || 1024 * 1024; // Default 1MB
    const corsOrigins = options?.corsOrigins || '*';
    
    return async (req: IncomingMessage, res: ServerResponse) => {
        // CORS headers
        const allowedOrigin = Array.isArray(corsOrigins) ? corsOrigins.join(', ') : corsOrigins;
        res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            res.end();
            return;
        }
        
        try {
            // Only accept POST requests for JSON-RPC
            if (req.method !== 'POST') {
                res.statusCode = 405;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                    error: {
                        code: ErrorCode.INVALID_REQUEST,
                        message: 'Method Not Allowed'
                    }
                }));
                return;
            }
            
            const body = await readBody(req, maxBodySize);
            const response = await server.handle(body);
            
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(response));
        } catch (error: any) {
            console.error('[createNodeHandler] Error:', error);
            res.statusCode = error.message === 'Request body too large' ? 413 : 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
                error: {
                    code: ErrorCode.INTERNAL_ERROR,
                    message: error.message || 'Internal Server Error'
                }
            }));
        }
    };
}

/**
 * Options for createRESTHandler
 */
export interface RESTHandlerOptions {
    /** Custom API route configuration */
    routes?: ApiRouteConfig;
    /** Maximum request body size in bytes (default: 1MB) */
    maxBodySize?: number;
    /** CORS allowed origins (default: '*' for development, should be restricted in production) */
    corsOrigins?: string | string[];
}

/**
 * Creates a Node.js HTTP handler for RESTful API endpoints.
 * This handler maps HTTP methods (GET, POST, PUT, DELETE) to ObjectQL operations.
 * 
 * URL Patterns:
 * - GET /api/data/:object - List records
 * - GET /api/data/:object/:id - Get single record
 * - POST /api/data/:object - Create record
 * - PUT /api/data/:object/:id - Update record
 * - DELETE /api/data/:object/:id - Delete record
 * 
 * @param app - ObjectQL application instance
 * @param options - Optional configuration including custom routes
 * @returns Node.js HTTP request handler
 */
export function createRESTHandler(app: IObjectQL, options?: RESTHandlerOptions) {
    const server = new ObjectQLServer(app);
    const routes = resolveApiRoutes(options?.routes);
    const dataPath = routes.data;
    const maxBodySize = options?.maxBodySize || 1024 * 1024; // Default 1MB
    const corsOrigins = options?.corsOrigins || '*';
    
    return async (req: IncomingMessage, res: ServerResponse) => {
        // CORS headers
        const allowedOrigin = Array.isArray(corsOrigins) ? corsOrigins.join(', ') : corsOrigins;
        res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            res.end();
            return;
        }
        
        try {
            const url = req.url || '';
            const method = req.method || 'GET';
            
            // Helper to send JSON response
            const sendJson = (data: any, status = 200) => {
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = status;
                res.end(JSON.stringify(data));
            };
            
            // Parse URL path - expecting /api/data/:object or /api/data/:object/:id
            // Remove query string
            const urlPath = url.split('?')[0];
            
            // Strip the base data path
            const relativePath = urlPath.startsWith(dataPath) 
                ? urlPath.substring(dataPath.length) 
                : urlPath;
            
            const parts = relativePath.split('/').filter(p => p);
            
            if (parts.length === 0) {
                sendJson({ error: { code: ErrorCode.INVALID_REQUEST, message: 'Object name required' } }, 400);
                return;
            }
            
            const objectName = parts[0];
            const recordId = parts[1];
            
            // Parse query parameters for filters
            const queryString = url.split('?')[1] || '';
            const searchParams = new URLSearchParams(queryString);
            
            // Helper to safely parse and validate integer parameters
            const parseIntParam = (value: string | null, max = 10000): number | undefined => {
                if (!value) return undefined;
                const parsed = parseInt(value, 10);
                if (isNaN(parsed) || parsed < 0 || parsed > max) {
                    throw new Error(`Invalid pagination parameter: ${value}`);
                }
                return parsed;
            };
            
            let objectQLRequest: any = {
                object: objectName,
                op: '',
                args: {}
            };
            
            // Map HTTP method + URL pattern to ObjectQL operation
            if (method === 'GET') {
                if (recordId) {
                    // GET /api/data/:object/:id - findOne
                    objectQLRequest.op = 'findOne';
                    objectQLRequest.args = recordId;
                } else {
                    // GET /api/data/:object - find
                    objectQLRequest.op = 'find';
                    objectQLRequest.args = {};
                    
                    // Parse pagination and filter params with validation
                    const limit = parseIntParam(searchParams.get('limit'));
                    const skip = parseIntParam(searchParams.get('skip'));
                    const offset = parseIntParam(searchParams.get('offset'));
                    
                    if (limit !== undefined) objectQLRequest.args.limit = limit;
                    if (skip !== undefined) objectQLRequest.args.skip = skip;
                    if (offset !== undefined) objectQLRequest.args.offset = offset;
                }
            } else if (method === 'POST') {
                // POST /api/data/:object - create
                objectQLRequest.op = 'create';
                const body = await readBody(req, maxBodySize);
                objectQLRequest.args = body;
            } else if (method === 'PUT') {
                if (!recordId) {
                    sendJson({ error: { code: ErrorCode.INVALID_REQUEST, message: 'Record ID required for update' } }, 400);
                    return;
                }
                // PUT /api/data/:object/:id - update
                objectQLRequest.op = 'update';
                const body = await readBody(req, maxBodySize);
                objectQLRequest.args = {
                    id: recordId,
                    data: body
                };
            } else if (method === 'DELETE') {
                if (!recordId) {
                    sendJson({ error: { code: ErrorCode.INVALID_REQUEST, message: 'Record ID required for delete' } }, 400);
                    return;
                }
                // DELETE /api/data/:object/:id - delete
                objectQLRequest.op = 'delete';
                objectQLRequest.args = { id: recordId };
            } else {
                sendJson({ error: { code: ErrorCode.INVALID_REQUEST, message: 'Method not allowed' } }, 405);
                return;
            }
            
            // Execute operation
            const response = await server.handle(objectQLRequest);
            
            // Map status codes based on operation and result
            let statusCode = 200;
            if (objectQLRequest.op === 'create' && !response.error) {
                statusCode = 201; // Created
            } else if (response.error) {
                if (response.error.code === ErrorCode.NOT_FOUND) {
                    statusCode = 404;
                } else if (response.error.code === ErrorCode.VALIDATION_ERROR) {
                    statusCode = 400;
                } else if (response.error.code === ErrorCode.FORBIDDEN) {
                    statusCode = 403;
                } else {
                    statusCode = 500;
                }
            }
            
            sendJson(response, statusCode);
        } catch (error: any) {
            console.error('[createRESTHandler] Error:', error);
            
            // Determine appropriate status code based on error
            let statusCode = 500;
            let errorCode = ErrorCode.INTERNAL_ERROR;
            
            if (error.message === 'Request body too large') {
                statusCode = 413; // Payload Too Large
            } else if (error.message?.includes('Invalid pagination parameter')) {
                statusCode = 400; // Bad Request
                errorCode = ErrorCode.INVALID_REQUEST;
            }
            
            res.statusCode = statusCode;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
                error: {
                    code: errorCode,
                    message: error.message || 'Internal Server Error'
                }
            }));
        }
    };
}
