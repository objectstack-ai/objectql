import { IObjectQL } from '@objectql/types';
import { ObjectQLServer } from '../server';
import { ObjectQLRequest, ErrorCode } from '../types';
import { IncomingMessage, ServerResponse } from 'http';

/**
 * Parse query string parameters
 */
function parseQueryParams(url: string): Record<string, any> {
    const params: Record<string, any> = {};
    const queryIndex = url.indexOf('?');
    if (queryIndex === -1) return params;

    const queryString = url.substring(queryIndex + 1);
    const pairs = queryString.split('&');

    for (const pair of pairs) {
        const [key, value] = pair.split('=');
        if (!key) continue;

        const decodedKey = decodeURIComponent(key);
        const decodedValue = decodeURIComponent(value || '');

        // Try to parse JSON values
        try {
            params[decodedKey] = JSON.parse(decodedValue);
        } catch {
            params[decodedKey] = decodedValue;
        }
    }

    return params;
}

/**
 * Read request body as JSON
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
                reject(new Error('Invalid JSON'));
            }
        });
        req.on('error', reject);
    });
}

/**
 * Send JSON response
 */
function sendJSON(res: ServerResponse, statusCode: number, data: any) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = statusCode;
    res.end(JSON.stringify(data));
}

/**
 * Creates a REST-style HTTP request handler for ObjectQL
 * 
 * Endpoints:
 * - GET    /api/data/:object       - List records
 * - GET    /api/data/:object/:id   - Get single record
 * - POST   /api/data/:object       - Create record
 * - PUT    /api/data/:object/:id   - Update record
 * - DELETE /api/data/:object/:id   - Delete record
 */
export function createRESTHandler(app: IObjectQL) {
    const server = new ObjectQLServer(app);

    return async (req: IncomingMessage & { body?: any }, res: ServerResponse) => {
        try {
            // CORS headers
            const requestOrigin = req.headers.origin;
            const configuredOrigin = process.env.OBJECTQL_CORS_ORIGIN;
            const isProduction = process.env.NODE_ENV === 'production';

            // In development, allow all origins by default (or use configured override).
            // In production, require an explicit OBJECTQL_CORS_ORIGIN to be set.
            if (!isProduction) {
                res.setHeader('Access-Control-Allow-Origin', configuredOrigin || '*');
            } else if (configuredOrigin && (!requestOrigin || requestOrigin === configuredOrigin)) {
                res.setHeader('Access-Control-Allow-Origin', configuredOrigin);
            }
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

            if (req.method === 'OPTIONS') {
                res.statusCode = 200;
                res.end();
                return;
            }

            const url = req.url || '';
            const method = req.method || 'GET';

            // Parse URL: /api/data/:object or /api/data/:object/:id
            const match = url.match(/^\/api\/data\/([^\/\?]+)(?:\/([^\/\?]+))?(\?.*)?$/);

            if (!match) {
                sendJSON(res, 404, {
                    error: {
                        code: ErrorCode.NOT_FOUND,
                        message: 'Invalid REST API endpoint'
                    }
                });
                return;
            }

            const [, objectName, id, queryString] = match;
            const queryParams = queryString ? parseQueryParams(queryString) : {};

            let qlRequest: ObjectQLRequest;

            switch (method) {
                case 'GET':
                    if (id) {
                        // GET /api/data/:object/:id - Get single record
                        qlRequest = {
                            op: 'findOne',
                            object: objectName,
                            args: id
                        };
                    } else {
                        // GET /api/data/:object - List records
                        const args: any = {};

                        // Parse query parameters
                        if (queryParams.filter) {
                            args.filters = queryParams.filter;
                        }
                        if (queryParams.fields) {
                            args.fields = queryParams.fields;
                        }
                        if (queryParams.sort) {
                            args.sort = Array.isArray(queryParams.sort) 
                                ? queryParams.sort 
                                : [[queryParams.sort, 'asc']];
                        }
                        if (queryParams.top || queryParams.limit) {
                            args.top = queryParams.top || queryParams.limit;
                        }
                        if (queryParams.skip || queryParams.offset) {
                            args.skip = queryParams.skip || queryParams.offset;
                        }
                        if (queryParams.expand) {
                            args.expand = queryParams.expand;
                        }

                        qlRequest = {
                            op: 'find',
                            object: objectName,
                            args
                        };
                    }
                    break;

                case 'POST':
                    // POST /api/data/:object - Create record
                    const createBody = req.body || await readBody(req);
                    qlRequest = {
                        op: 'create',
                        object: objectName,
                        args: createBody
                    };
                    break;

                case 'PUT':
                case 'PATCH':
                    // PUT /api/data/:object/:id - Update record
                    if (!id) {
                        sendJSON(res, 400, {
                            error: {
                                code: ErrorCode.INVALID_REQUEST,
                                message: 'ID is required for update operation'
                            }
                        });
                        return;
                    }

                    const updateBody = req.body || await readBody(req);
                    qlRequest = {
                        op: 'update',
                        object: objectName,
                        args: {
                            id,
                            data: updateBody
                        }
                    };
                    break;

                case 'DELETE':
                    // DELETE /api/data/:object/:id - Delete record
                    if (!id) {
                        sendJSON(res, 400, {
                            error: {
                                code: ErrorCode.INVALID_REQUEST,
                                message: 'ID is required for delete operation'
                            }
                        });
                        return;
                    }

                    qlRequest = {
                        op: 'delete',
                        object: objectName,
                        args: { id }
                    };
                    break;

                default:
                    sendJSON(res, 405, {
                        error: {
                            code: ErrorCode.INVALID_REQUEST,
                            message: 'Method not allowed'
                        }
                    });
                    return;
            }

            // Execute the request
            const result = await server.handle(qlRequest);

            // Determine HTTP status code
            let statusCode = 200;
            if (result.error) {
                switch (result.error.code) {
                    case ErrorCode.INVALID_REQUEST:
                    case ErrorCode.VALIDATION_ERROR:
                        statusCode = 400;
                        break;
                    case ErrorCode.UNAUTHORIZED:
                        statusCode = 401;
                        break;
                    case ErrorCode.FORBIDDEN:
                        statusCode = 403;
                        break;
                    case ErrorCode.NOT_FOUND:
                        statusCode = 404;
                        break;
                    case ErrorCode.CONFLICT:
                        statusCode = 409;
                        break;
                    case ErrorCode.RATE_LIMIT_EXCEEDED:
                        statusCode = 429;
                        break;
                    default:
                        statusCode = 500;
                }
            } else if (method === 'POST') {
                statusCode = 201; // Created
            }

            sendJSON(res, statusCode, result);

        } catch (e: any) {
            console.error('[REST Handler] Error:', e);
            sendJSON(res, 500, {
                error: {
                    code: ErrorCode.INTERNAL_ERROR,
                    message: 'Internal server error'
                }
            });
        }
    };
}
