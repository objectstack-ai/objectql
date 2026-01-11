import { IObjectQL } from '@objectql/types';
import { ObjectQLServer } from '../server';
import { ObjectQLRequest, ErrorCode } from '../types';
import { IncomingMessage, ServerResponse } from 'http';
import { generateOpenAPI } from '../openapi';

/**
 * Creates a standard Node.js HTTP request handler.
 */
export function createNodeHandler(app: IObjectQL) {
    const server = new ObjectQLServer(app);


    return async (req: IncomingMessage & { body?: any }, res: ServerResponse) => {
        // Handle OpenAPI spec request
        if (req.method === 'GET' && req.url?.endsWith('/openapi.json')) {
            const spec = generateOpenAPI(app);
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify(spec));
            return;
        }

        const handleRequest = async (json: any) => {
             try {
                // TODO: Parse user from header or request override
                const qlReq: ObjectQLRequest = {
                    op: json.op,
                    object: json.object,
                    args: json.args,
                    user: json.user, // For dev/testing, allowing user injection
                    ai_context: json.ai_context // Support AI context
                };

                const result = await server.handle(qlReq);
                
                // Determine HTTP status code based on error
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
                }

                res.setHeader('Content-Type', 'application/json');
                res.statusCode = statusCode;
                res.end(JSON.stringify(result));
            } catch (e) {
                res.statusCode = 500;
                res.end(JSON.stringify({ 
                    error: { 
                        code: ErrorCode.INTERNAL_ERROR, 
                        message: 'Internal Server Error' 
                    }
                }));
            }
        };

        if (req.method !== 'POST') {
            // Attempt to handle GET requests for simple queries like /api/objectql/table
            // We map this to a find operation
            // URL pattern: /api/objectql/:objectName
            const match = req.url?.match(/\/([^\/?]+)(\?.*)?$/);
            if (req.method === 'GET' && match) {
                const objectName = match[1];
                // Ignore special paths
                if (objectName !== 'openapi.json' && objectName !== 'metadata') {
                     await handleRequest({
                        op: 'find',
                        object: objectName,
                        args: {} // TODO: Parse query params to args
                     });
                     return;
                }
            }

            res.statusCode = 405;
            res.end(JSON.stringify({
                error: {
                    code: ErrorCode.INVALID_REQUEST,
                    message: 'Method Not Allowed'
                }
            }));
            return;
        }

        // 1. Check if body is already parsed (e.g. by express.json())
        if (req.body && typeof req.body === 'object') {
            await handleRequest(req.body);
            return;
        }

        // 2. Parse Body from stream
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const json = JSON.parse(body);
                await handleRequest(json);
            } catch (e) {
                res.statusCode = 400;
                res.end(JSON.stringify({
                    error: {
                        code: ErrorCode.INVALID_REQUEST,
                        message: 'Invalid JSON'
                    }
                }));
            }
        });
    };
}
