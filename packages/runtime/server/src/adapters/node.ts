import { IObjectQL } from '@objectql/types';
import { ObjectQLServer } from '../server';
import { ObjectQLRequest, ErrorCode, IFileStorage } from '../types';
import { IncomingMessage, ServerResponse } from 'http';
import { generateOpenAPI } from '../openapi';
import { createFileUploadHandler, createBatchFileUploadHandler, createFileDownloadHandler } from '../file-handler';
import { LocalFileStorage } from '../storage';

/**
 * Options for createNodeHandler
 */
export interface NodeHandlerOptions {
    /** File storage provider (defaults to LocalFileStorage) */
    fileStorage?: IFileStorage;
}

/**
 * Creates a standard Node.js HTTP request handler.
 */
export function createNodeHandler(app: IObjectQL, options?: NodeHandlerOptions) {
    const server = new ObjectQLServer(app);
    
    // Initialize file storage
    const fileStorage = options?.fileStorage || new LocalFileStorage({
        baseDir: process.env.OBJECTQL_UPLOAD_DIR || './uploads',
        baseUrl: process.env.OBJECTQL_BASE_URL || 'http://localhost:3000/api/files'
    });
    
    // Create file handlers
    const uploadHandler = createFileUploadHandler(fileStorage, app);
    const batchUploadHandler = createBatchFileUploadHandler(fileStorage, app);
    const downloadHandler = createFileDownloadHandler(fileStorage);


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
                // Determine Operation based on JSON or previously derived info
                const qlReq: ObjectQLRequest = {
                    op: json.op,
                    object: json.object,
                    args: json.args,
                    user: json.user,
                    ai_context: json.ai_context
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
                console.error(e);
                res.statusCode = 500;
                res.end(JSON.stringify({ 
                    error: { 
                        code: ErrorCode.INTERNAL_ERROR, 
                        message: 'Internal Server Error' 
                    }
                }));
            }
        };

        // Parse URL
        const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
        const pathName = urlObj.pathname;
        const method = req.method;

        // 1. JSON-RPC: POST /api/objectql
        if (pathName === '/api/objectql' && method === 'POST') {
             await processBody(req, async (json) => {
                 await handleRequest(json);
             }, res);
             return;
        }

        // 2. REST API: /api/data/:object and /api/data/:object/:id
        // Regex to match /api/data/objectName(/id)?
        const restMatch = pathName.match(/^\/api\/data\/([^/]+)(?:\/(.+))?$/);
        
        if (restMatch) {
            const objectName = restMatch[1];
            const id = restMatch[2];
            const query = Object.fromEntries(urlObj.searchParams.entries());

            if (method === 'GET') {
                // GET /api/data/:object/:id -> findOne
                if (id) {
                    await handleRequest({
                        op: 'findOne',
                        object: objectName,
                        args: id
                    });
                } 
                // GET /api/data/:object -> find (List)
                else {
                    // Parse standard params
                    const args: any = {};
                    if (query.fields) args.fields = (query.fields as string).split(',');
                    if (query.top) args.limit = parseInt(query.top as string);
                    if (query.skip) args.skip = parseInt(query.skip as string);
                    if (query.filter) {
                        try {
                            args.filters = JSON.parse(query.filter as string);
                        } catch (e) {
                            // ignore invalid filter json
                        }
                    }
                    await handleRequest({ op: 'find', object: objectName, args });
                }
                return;
            }

            if (method === 'POST' && !id) {
                // POST /api/data/:object -> create
                await processBody(req, async (body) => {
                    await handleRequest({
                        op: 'create',
                        object: objectName,
                        args: body.data || body // Support enclosed in data or flat
                    });
                }, res);
                return;
            }

            if (method === 'PATCH' && id) {
                // PATCH /api/data/:object/:id -> update
                await processBody(req, async (body) => {
                    await handleRequest({
                        op: 'update',
                        object: objectName,
                        args: {
                            id: id,
                            data: body.data || body
                        }
                    });
                }, res);
                return;
            }

            if (method === 'DELETE' && id) {
                // DELETE /api/data/:object/:id -> delete
                await handleRequest({
                    op: 'delete',
                    object: objectName,
                    args: { id: id }
                });
                return;
            }
        }
        
        // File Upload Endpoints
        // POST /api/files/upload - Single file upload
        if (pathName === '/api/files/upload' && method === 'POST') {
            await uploadHandler(req, res);
            return;
        }
        
        // POST /api/files/upload/batch - Batch file upload
        if (pathName === '/api/files/upload/batch' && method === 'POST') {
            await batchUploadHandler(req, res);
            return;
        }
        
        // GET /api/files/:fileId - Download file
        const fileMatch = pathName.match(/^\/api\/files\/([^/]+)$/);
        if (fileMatch && method === 'GET') {
            const fileId = fileMatch[1];
            await downloadHandler(req, res, fileId);
            return;
        }
        
        // Fallback or 404
        if (req.method === 'POST') {
             // Fallback for root POSTs if people forget /api/objectql but send to /api something
             await processBody(req, handleRequest, res);
             return;
        }

        // Special case for root: since we accept POST / (RPC), correct response for GET / is 405
        if (pathName === '/') {
            res.setHeader('Allow', 'POST');
            res.statusCode = 405;
            res.end(JSON.stringify({ error: { code: ErrorCode.INVALID_REQUEST, message: 'Method Not Allowed. Use POST for JSON-RPC.' } }));
            return;
        }

        res.statusCode = 404;
        res.end(JSON.stringify({ error: { code: ErrorCode.NOT_FOUND, message: 'Not Found' } }));
    };
}

// Helper to process body
async function processBody(req: IncomingMessage & { body?: any }, callback: (json: any) => Promise<void>, res: ServerResponse) {
    if (req.body && typeof req.body === 'object') {
        return callback(req.body);
    }
    
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
        try {
            const json = body ? JSON.parse(body) : {};
            await callback(json);
        } catch (e) {
            res.statusCode = 400;
            res.end(JSON.stringify({
                error: {
                    code: 'INVALID_JSON',
                    message: 'Invalid JSON body'
                }
            }));
        }
    });
}
