/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { IObjectQL, ApiRouteConfig, resolveApiRoutes } from '@objectql/types';
import { IncomingMessage, ServerResponse } from 'http';
import { ErrorCode } from './types';
import { escapeRegexPath } from './utils';

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
 * Options for createMetadataHandler
 */
export interface MetadataHandlerOptions {
    /** Custom API route configuration */
    routes?: ApiRouteConfig;
}

/**
 * Creates a handler for metadata endpoints.
 * These endpoints expose information about registered objects and other metadata.
 * 
 * @param app - ObjectQL application instance
 * @param options - Optional configuration including custom routes
 */
export function createMetadataHandler(app: IObjectQL, options?: MetadataHandlerOptions) {
    const routes = resolveApiRoutes(options?.routes);
    const metadataPath = routes.metadata;
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
            // Helper to send JSON
            const sendJson = (data: any, status = 200) => {
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = status;
                res.end(JSON.stringify(data));
            };

            const sendError = (code: ErrorCode, message: string, status = 400) => {
                sendJson({ error: { code, message } }, status);
            };

            // ---------------------------------------------------------
            // 1. List Entries (GET {metadataPath}/:type)
            // ---------------------------------------------------------
            
            // Generic List: {metadataPath}/:type
            // Also handles legacy {metadataPath} (defaults to objects)
            const escapedPath = escapeRegexPath(metadataPath);
            const listMatch = url.match(new RegExp(`^${escapedPath}/([^/]+)$`));
            const isRootMetadata = url === metadataPath;
            
            if (method === 'GET' && (listMatch || isRootMetadata)) {
                let type = isRootMetadata ? 'object' : listMatch![1];
                if (type === 'objects') type = 'object'; // Alias behavior

                if (type === 'object') {
                    const configs = app.getConfigs();
                    const objects = Object.values(configs).map(obj => ({
                        name: obj.name,
                        label: obj.label || obj.name,
                        icon: obj.icon,
                        description: obj.description,
                        fields: obj.fields || {}
                    }));
                    // Return standardized format with items
                    return sendJson({ items: objects });
                }
                
                const entries = app.metadata.list(type);
                // Return standardized list format
                return sendJson({ 
                    items: entries
                });
            }

            // ---------------------------------------------------------
            // 2. Get Single Entry (GET {metadataPath}/:type/:id)
            // ---------------------------------------------------------
            
            const detailMatch = url.match(new RegExp(`^${escapedPath}/([^/]+)/([^/\\?]+)$`));
            
            if (method === 'GET' && detailMatch) {
                let [, type, id] = detailMatch;
                if (type === 'objects') type = 'object';

                // Handle Object Special Logic (Field Formatting)
                if (type === 'object') {
                    const metadata = app.getObject(id);
                    if (!metadata) {
                        return sendError(ErrorCode.NOT_FOUND, `Object '${id}' not found`, 404);
                    }
                    
                    // Convert fields to map with name populated
                    const fields: Record<string, any> = {};
                    if (metadata.fields) {
                        Object.entries(metadata.fields).forEach(([key, field]) => {
                            fields[key] = {
                                ...field,
                                name: field.name || key
                            };
                        });
                    }
                    
                    return sendJson({
                        ...metadata,
                        fields
                    });
                } else {
                    // Generic Metadata (View, Form, etc.)
                    const content = app.metadata.get(type, id);
                    if (!content) {
                         return sendError(ErrorCode.NOT_FOUND, `${type} '${id}' not found`, 404);
                    }
                    return sendJson(content);
                }
            }

            // ---------------------------------------------------------
            // 3. Update Entry (POST/PUT {metadataPath}/:type/:id)
            // ---------------------------------------------------------
            if ((method === 'POST' || method === 'PUT') && detailMatch) {
                let [, type, id] = detailMatch;
                if (type === 'objects') type = 'object';

                const body = await readBody(req);
                try {
                    // await app.updateMetadata(type, id, body);
                    // return sendJson({ success: true });
                    return sendError(ErrorCode.INTERNAL_ERROR, 'Metadata updates via API are temporarily disabled in this architectural version.', 501);
                } catch (e: any) {
                    const isUserError = e.message.startsWith('Cannot update') || e.message.includes('not found');
                    return sendError(
                        isUserError ? ErrorCode.INVALID_REQUEST : ErrorCode.INTERNAL_ERROR,
                        e.message,
                        isUserError ? 400 : 500
                    );
                }
            }

            // ---------------------------------------------------------
            // 4. Object Sub-resources (Fields, Actions)
            // ---------------------------------------------------------
            
            // GET {metadataPath}/object/:name/fields/:field
            // Legacy path support.
            const fieldMatch = url.match(new RegExp(`^${escapedPath}/(?:objects|object)/([^/]+)/fields/([^/\\?]+)$`));
            if (method === 'GET' && fieldMatch) {
                const [, objectName, fieldName] = fieldMatch;
                const metadata = app.getObject(objectName);
                
                if (!metadata) return sendError(ErrorCode.NOT_FOUND, `Object '${objectName}' not found`, 404);

                const field = metadata.fields?.[fieldName];
                if (!field) return sendError(ErrorCode.NOT_FOUND, `Field '${fieldName}' not found`, 404);

                return sendJson({
                    name: field.name || fieldName,
                    type: field.type,
                    label: field.label,
                    required: field.required,
                    unique: field.unique,
                    defaultValue: field.defaultValue,
                    options: field.options,
                    min: field.min,
                    max: field.max,
                    min_length: field.min_length,
                    max_length: field.max_length,
                    regex: field.regex
                });
            }

            // GET {metadataPath}/object/:name/actions
            const actionsMatch = url.match(new RegExp(`^${escapedPath}/(?:objects|object)/([^/]+)/actions$`));
            if (method === 'GET' && actionsMatch) {
                const [, objectName] = actionsMatch;
                const metadata = app.getObject(objectName);
                
                if (!metadata) return sendError(ErrorCode.NOT_FOUND, `Object '${objectName}' not found`, 404);

                const actions = metadata.actions || {};
                const formattedActions = Object.entries(actions).map(([key, action]) => {
                    const actionConfig = action as any;
                    const hasFields = !!actionConfig.fields && Object.keys(actionConfig.fields).length > 0;
                    return {
                        name: key,
                        type: actionConfig.type || (hasFields ? 'record' : 'global'),
                        label: actionConfig.label || key,
                        params: actionConfig.params || {},
                        description: actionConfig.description
                    };
                });

                return sendJson({ items: formattedActions });
            }

            // Not found
            sendError(ErrorCode.NOT_FOUND, 'Not Found', 404);
            
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
