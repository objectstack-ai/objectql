/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { IObjectQL, ApiRouteConfig, resolveApiRoutes } from '@objectql/types';
import { ObjectQLServer } from '../server';
import { ObjectQLRequest, ErrorCode } from '../types';

/**
 * Options for createHonoAdapter
 */
export interface HonoAdapterOptions {
    /** Custom API route configuration */
    routes?: ApiRouteConfig;
}

/**
 * Creates a Hono-compatible middleware for ObjectQL
 * 
 * This adapter integrates ObjectQL with the Hono web framework.
 * 
 * @example
 * ```typescript
 * import { Hono } from 'hono';
 * import { ObjectQL } from '@objectql/core';
 * import { createHonoAdapter } from '@objectql/plugin-server/hono';
 * 
 * const app = new ObjectQL({ ... });
 * await app.init();
 * 
 * const server = new Hono();
 * const objectqlMiddleware = createHonoAdapter(app);
 * 
 * server.all('/api/*', objectqlMiddleware);
 * ```
 */
export function createHonoAdapter(app: IObjectQL, options?: HonoAdapterOptions) {
    const server = new ObjectQLServer(app);
    const routes = resolveApiRoutes(options?.routes);

    // Return Hono-compatible handler
    return async (c: any) => {
        try {
            const req = c.req;
            const path = req.path;
            const method = req.method;

            // Handle JSON-RPC endpoint
            if (path === routes.rpc || path.startsWith(routes.rpc + '/')) {
                if (method === 'POST') {
                    const body = await req.json();
                    const qlReq: ObjectQLRequest = {
                        op: body.op,
                        object: body.object,
                        args: body.args,
                        user: body.user,
                        ai_context: body.ai_context
                    };

                    const result = await server.handle(qlReq);
                    
                    // Determine HTTP status code based on error
                    let statusCode = 200;
                    if (result.error) {
                        statusCode = getStatusCodeFromError(result.error.code as ErrorCode);
                    }

                    return c.json(result, statusCode);
                }
                return c.json({ error: { code: ErrorCode.INVALID_REQUEST, message: 'Method not allowed' } }, 405);
            }

            // Handle REST API endpoint
            if (path.startsWith(routes.data + '/')) {
                const pathParts = path.replace(routes.data + '/', '').split('/');
                const objectName = pathParts[0];
                const id = pathParts[1];

                let qlReq: ObjectQLRequest;

                switch (method) {
                    case 'GET':
                        if (id) {
                            // GET /api/data/:object/:id - findOne
                            qlReq = {
                                op: 'findOne',
                                object: objectName,
                                args: id
                            };
                        } else {
                            // GET /api/data/:object - find with query params
                            const query = req.query();
                            const args: any = {};
                            if (query.filter) args.filters = JSON.parse(query.filter);
                            if (query.fields) args.fields = query.fields.split(',');
                            if (query.limit || query.top) args.limit = parseInt(query.limit || query.top);
                            if (query.skip || query.offset) args.skip = parseInt(query.skip || query.offset);
                            
                            qlReq = {
                                op: 'find',
                                object: objectName,
                                args
                            };
                        }
                        break;

                    case 'POST':
                        const createBody = await req.json();
                        if (Array.isArray(createBody)) {
                            // Bulk create
                            qlReq = {
                                op: 'createMany',
                                object: objectName,
                                args: createBody
                            };
                        } else {
                            // Single create
                            qlReq = {
                                op: 'create',
                                object: objectName,
                                args: createBody
                            };
                        }
                        break;

                    case 'PUT':
                    case 'PATCH':
                        if (!id) {
                            return c.json({ 
                                error: { 
                                    code: ErrorCode.INVALID_REQUEST, 
                                    message: 'ID is required for update' 
                                } 
                            }, 400);
                        }
                        const updateBody = await req.json();
                        qlReq = {
                            op: 'update',
                            object: objectName,
                            args: { id, data: updateBody }
                        };
                        break;

                    case 'DELETE':
                        if (!id) {
                            return c.json({ 
                                error: { 
                                    code: ErrorCode.INVALID_REQUEST, 
                                    message: 'ID is required for delete' 
                                } 
                            }, 400);
                        }
                        qlReq = {
                            op: 'delete',
                            object: objectName,
                            args: { id }
                        };
                        break;

                    default:
                        return c.json({ 
                            error: { 
                                code: ErrorCode.INVALID_REQUEST, 
                                message: 'Method not allowed' 
                            } 
                        }, 405);
                }

                const result = await server.handle(qlReq);
                let statusCode = 200;
                if (result.error) {
                    statusCode = getStatusCodeFromError(result.error.code as ErrorCode);
                } else if (method === 'POST') {
                    statusCode = 201;
                }

                return c.json(result, statusCode);
            }

            // Handle Metadata endpoint
            if (path.startsWith(routes.metadata + '/') || path === routes.metadata) {
                const resource = path.replace(routes.metadata, '').replace(/^\//, '');
                
                if (!resource || resource === 'object') {
                    // List all objects
                    const objects = app.metadata.list('object');
                    return c.json({ objects });
                }

                if (resource.startsWith('object/')) {
                    // Get specific object
                    const objectName = resource.replace('object/', '');
                    const obj = app.getObject(objectName);
                    if (!obj) {
                        return c.json({ 
                            error: { 
                                code: ErrorCode.NOT_FOUND, 
                                message: `Object '${objectName}' not found` 
                            } 
                        }, 404);
                    }
                    return c.json({ object: obj });
                }

                return c.json({ 
                    error: { 
                        code: ErrorCode.NOT_FOUND, 
                        message: 'Metadata resource not found' 
                    } 
                }, 404);
            }

            // Default 404
            return c.json({ 
                error: { 
                    code: ErrorCode.NOT_FOUND, 
                    message: 'Endpoint not found' 
                } 
            }, 404);

        } catch (e: any) {
            console.error('[Hono Adapter] Error:', e);
            return c.json({ 
                error: { 
                    code: ErrorCode.INTERNAL_ERROR, 
                    message: 'Internal server error' 
                } 
            }, 500);
        }
    };
}

/**
 * Map ObjectQL error codes to HTTP status codes
 */
function getStatusCodeFromError(code: ErrorCode): number {
    switch (code) {
        case ErrorCode.INVALID_REQUEST:
        case ErrorCode.VALIDATION_ERROR:
            return 400;
        case ErrorCode.UNAUTHORIZED:
            return 401;
        case ErrorCode.FORBIDDEN:
            return 403;
        case ErrorCode.NOT_FOUND:
            return 404;
        case ErrorCode.CONFLICT:
            return 409;
        case ErrorCode.RATE_LIMIT_EXCEEDED:
            return 429;
        default:
            return 500;
    }
}
