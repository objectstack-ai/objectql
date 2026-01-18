/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { IObjectQL, ObjectConfig, FieldConfig, ApiRouteConfig, resolveApiRoutes } from '@objectql/types';

interface OpenAPISchema {
    openapi: string;
    info: {
        title: string;
        version: string;
    };
    paths: Record<string, any>;
    components: {
        schemas: Record<string, any>;
    };
}

export function generateOpenAPI(app: IObjectQL, routeConfig?: ApiRouteConfig): OpenAPISchema {
    const registry = (app as any).metadata; // Direct access or via interface
    const objects = registry.list('object') as ObjectConfig[];
    const routes = resolveApiRoutes(routeConfig);

    const paths: Record<string, any> = {};
    const schemas: Record<string, any> = {};

    
    // 1. JSON-RPC Endpoint
    paths[routes.rpc] = {
        post: {
            summary: 'JSON-RPC Entry Point',
            description: 'Execute any ObjectQL operation via a JSON body.',
            tags: ['System'],
            requestBody: {
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                op: { type: 'string', enum: ['find', 'findOne', 'create', 'update', 'delete', 'count', 'action'] },
                                object: { type: 'string' },
                                args: { type: 'object' }
                            },
                            required: ['op', 'object']
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'Operation Result',
                    content: {
                        'application/json': {
                            schema: { type: 'object' } // Dynamic result
                        }
                    }
                }
            }
        }
    };

    // 2. Generate Schemas
    for (const obj of objects) {
        const schemaName = obj.name;
        const properties: Record<string, any> = {};
        
        for (const [fieldName, field] of Object.entries(obj.fields)) {
            properties[fieldName] = mapFieldTypeToOpenAPI(field);
        }

        schemas[schemaName] = {
            type: 'object',
            properties
        };
    }
    
    // 3. REST API Paths
    for (const obj of objects) {
        const name = obj.name;
        const basePath = `${routes.data}/${name}`; // Standard REST Path
        
        // GET {dataPath}/:name (List)
        paths[basePath] = {
            get: {
                summary: `List ${name}`,
                tags: [name],
                parameters: [
                    { name: 'filter', in: 'query', schema: { type: 'string' }, description: 'JSON filter args' },
                    { name: 'fields', in: 'query', schema: { type: 'string' }, description: 'Comma-separated fields to return' },
                    { name: 'top', in: 'query', schema: { type: 'integer' }, description: 'Limit' },
                    { name: 'skip', in: 'query', schema: { type: 'integer' }, description: 'Offset' }
                ],
                responses: {
                    200: {
                        description: `List of ${name}`,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: { type: 'array', items: { $ref: `#/components/schemas/${name}` } }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            post: {
                summary: `Create ${name}`,
                tags: [name],
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    data: { $ref: `#/components/schemas/${name}` }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Created' }
                }
            }
        };

        // /api/data/:name/:id
        paths[`${basePath}/{id}`] = {
            get: {
                summary: `Get ${name}`,
                tags: [name],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: {
                        description: 'Item',
                        content: {
                            'application/json': {
                                schema: { $ref: `#/components/schemas/${name}` }
                            }
                        }
                    }
                }
            },
            patch: {
                summary: `Update ${name}`,
                tags: [name],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    data: { type: 'object' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Updated' }
                }
            },
            delete: {
                summary: `Delete ${name}`,
                tags: [name],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Deleted' }
                }
            }
        };
    }

    return {
        openapi: '3.0.0',
        info: {
            title: 'ObjectQL API',
            version: '1.0.0'
        },
        paths,
        components: {
            schemas
        }
    };
}

function mapFieldTypeToOpenAPI(field: FieldConfig | string): any {
    const type = typeof field === 'string' ? field : field.type;
    
    switch (type) {
        case 'string': return { type: 'string' };
        case 'integer': return { type: 'integer' };
        case 'float': return { type: 'number' };
        case 'boolean': return { type: 'boolean' };
        case 'date': return { type: 'string', format: 'date-time' };
        case 'json': return { type: 'object' };
        default: return { type: 'string' }; // Fallback or relationship ID
    }
}
