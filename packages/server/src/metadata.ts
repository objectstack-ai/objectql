import { IObjectQL } from '@objectql/types';
import { IncomingMessage, ServerResponse } from 'http';
import { ErrorCode } from './types';

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
 * Creates a handler for metadata endpoints.
 * These endpoints expose information about registered objects.
 */
export function createMetadataHandler(app: IObjectQL) {
    return async (req: IncomingMessage, res: ServerResponse) => {
        // Parse the URL
        const url = req.url || '';
        const method = req.method;
        
        // CORS headers for development
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            res.end();
            return;
        }

        try {
            // GET /api/metadata or /api/metadata/objects - List all objects
            if (method === 'GET' && (url === '/api/metadata' || url === '/api/metadata/objects')) {
                const configs = app.getConfigs();
                const objects = Object.values(configs).map(obj => ({
                    name: obj.name,
                    label: obj.label || obj.name,
                    icon: obj.icon,
                    description: obj.description,
                    fields: obj.fields || {}
                }));
                
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify({ objects }));
                return;
            }

            // GET /api/metadata/objects/:name - Get object details
            const objectMatch = url.match(/^\/api\/metadata\/objects\/([^\/\?]+)$/);
            if (method === 'GET' && objectMatch) {
                const objectName = objectMatch[1];
                const metadata = app.getObject(objectName);
                if (!metadata) {
                    res.statusCode = 404;
                    res.end(JSON.stringify({ 
                        error: {
                            code: ErrorCode.NOT_FOUND,
                            message: `Object '${objectName}' not found`
                        }
                    }));
                    return;
                }
                
                // Convert fields object to array
                const fields = metadata.fields 
                    ? Object.entries(metadata.fields).map(([key, field]) => ({
                        name: field.name || key,
                        type: field.type,
                        label: field.label,
                        required: field.required,
                        defaultValue: field.defaultValue,
                        unique: field.unique,
                        options: field.options,
                        validations: field.validations
                    }))
                    : [];
                
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify({
                    ...metadata,
                    fields
                }));
                return;
            }

            // GET /api/metadata/objects/:name/fields/:field - Get field metadata
            const fieldMatch = url.match(/^\/api\/metadata\/objects\/([^\/]+)\/fields\/([^\/\?]+)$/);
            if (method === 'GET' && fieldMatch) {
                const [, objectName, fieldName] = fieldMatch;
                const metadata = app.getObject(objectName);
                
                if (!metadata) {
                    res.statusCode = 404;
                    res.end(JSON.stringify({ 
                        error: {
                            code: ErrorCode.NOT_FOUND,
                            message: `Object '${objectName}' not found`
                        }
                    }));
                    return;
                }

                const field = metadata.fields?.[fieldName];
                if (!field) {
                    res.statusCode = 404;
                    res.end(JSON.stringify({ 
                        error: {
                            code: ErrorCode.NOT_FOUND,
                            message: `Field '${fieldName}' not found in object '${objectName}'`
                        }
                    }));
                    return;
                }

                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify({
                    name: field.name || fieldName,
                    type: field.type,
                    label: field.label,
                    required: field.required,
                    unique: field.unique,
                    defaultValue: field.defaultValue,
                    options: field.options,
                    validations: field.validations
                }));
                return;
            }

            // GET /api/metadata/objects/:name/actions - List actions
            const actionsMatch = url.match(/^\/api\/metadata\/objects\/([^\/]+)\/actions$/);
            if (method === 'GET' && actionsMatch) {
                const [, objectName] = actionsMatch;
                const metadata = app.getObject(objectName);
                
                if (!metadata) {
                    res.statusCode = 404;
                    res.end(JSON.stringify({ 
                        error: {
                            code: ErrorCode.NOT_FOUND,
                            message: `Object '${objectName}' not found`
                        }
                    }));
                    return;
                }

                const actions = metadata.actions || [];
                const formattedActions = Array.isArray(actions) 
                    ? actions.map(action => ({
                        name: action.name,
                        type: action.type || 'record',
                        label: action.label || action.name,
                        params: action.params || {},
                        description: action.description
                    }))
                    : [];

                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify({ actions: formattedActions }));
                return;
            }

            // POST/PUT /api/metadata/:type/:id - Update metadata
            const updateMatch = url.match(/^\/api\/metadata\/([^\/]+)\/([^\/]+)$/);
            if ((method === 'POST' || method === 'PUT') && updateMatch) {
                const [, type, id] = updateMatch;
                const body = await readBody(req);
                
                try {
                    await app.updateMetadata(type, id, body);
                    res.setHeader('Content-Type', 'application/json');
                    res.statusCode = 200;
                    res.end(JSON.stringify({ success: true }));
                } catch (e: any) {
                    const isUserError = e.message.startsWith('Cannot update') || e.message.includes('not found');
                    res.statusCode = isUserError ? 400 : 500;
                    res.end(JSON.stringify({ 
                        error: {
                            code: isUserError ? ErrorCode.INVALID_REQUEST : ErrorCode.INTERNAL_ERROR,
                            message: e.message
                        }
                    }));
                }
                return;
            }

            // Not found
            res.statusCode = 404;
            res.end(JSON.stringify({
                error: {
                    code: ErrorCode.NOT_FOUND,
                    message: 'Not Found'
                }
            }));
        } catch (e: any) {
            console.error('[Metadata Handler] Error:', e);
            res.statusCode = 500;
            res.end(JSON.stringify({ 
                error: {
                    code: ErrorCode.INTERNAL_ERROR,
                    message: 'Internal Server Error'
                }
            }));
        }
    };
}
