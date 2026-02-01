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
function readBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
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
    
    return async (req: IncomingMessage, res: ServerResponse) => {
        // CORS headers for development
        res.setHeader('Access-Control-Allow-Origin', '*');
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
            
            const body = await readBody(req);
            const response = await server.handle(body);
            
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(response));
        } catch (error: any) {
            console.error('[createNodeHandler] Error:', error);
            res.statusCode = 500;
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
    
    return async (req: IncomingMessage, res: ServerResponse) => {
        // CORS headers for development
        res.setHeader('Access-Control-Allow-Origin', '*');
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
                    
                    // Parse pagination and filter params
                    if (searchParams.has('limit')) {
                        objectQLRequest.args.limit = parseInt(searchParams.get('limit')!);
                    }
                    if (searchParams.has('skip')) {
                        objectQLRequest.args.skip = parseInt(searchParams.get('skip')!);
                    }
                    if (searchParams.has('offset')) {
                        objectQLRequest.args.offset = parseInt(searchParams.get('offset')!);
                    }
                }
            } else if (method === 'POST') {
                // POST /api/data/:object - create
                objectQLRequest.op = 'create';
                const body = await readBody(req);
                objectQLRequest.args = body;
            } else if (method === 'PUT') {
                if (!recordId) {
                    sendJson({ error: { code: ErrorCode.INVALID_REQUEST, message: 'Record ID required for update' } }, 400);
                    return;
                }
                // PUT /api/data/:object/:id - update
                objectQLRequest.op = 'update';
                const body = await readBody(req);
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
            res.statusCode = 500;
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
