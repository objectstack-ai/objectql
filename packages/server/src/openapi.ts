import { IObjectQL, ObjectConfig, FieldType, FieldConfig } from '@objectql/types';

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

export function generateOpenAPI(app: IObjectQL): OpenAPISchema {
    const registry = (app as any).metadata; // Direct access or via interface
    const objects = registry.list('object') as ObjectConfig[];

    const paths: Record<string, any> = {};
    const schemas: Record<string, any> = {};

    
    // 1. Generate Schemas
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

        // 2. Generate Paths (RPC Style representation for documentation purposes)
        // Since we only have one endpoint, we might document operations as descriptions
        // Or if we support REST style in the future, we would add /object paths here.
        // For now, let's document the "Virtual" REST API that could exist via a gateway
        // OR just document the schema.
        // Let's assume the user might want to see standard CRUD paths even if implementation is RPC,
        // so they can pass it to frontend generators?
        // No, that would be misleading if the server doesn't support it.
        
        // Let's DOCUMENT the RPC operations as if they were paths, 
        // OR clearer: One path /api/objectql with polymorphic body?
        // Swagger UI handles oneOf poorly for top level operations sometimes.
    }
    
    // Let's do a "Virtual" REST path generation for better visualization
    // Assuming we WILL support REST mapping in this update.
    for (const obj of objects) {
        const name = obj.name;
        
        // GET /name (List)
        paths[`/${name}`] = {
            get: {
                summary: `List ${name}s`,
                tags: [name],
                parameters: [
                    { name: 'filter', in: 'query', schema: { type: 'string' }, description: 'JSON filter args' }
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

        // GET /name/{id}
        paths[`/${name}/{id}`] = {
            get: {
                summary: `Get ${name}`,
                tags: [name],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Item' } }
            },
            patch: {
                 summary: `Update ${name}`,
                 tags: [name],
                 parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                 requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object' }} } } } },
                 responses: { 200: { description: 'Updated' } }
            },
            delete: {
                 summary: `Delete ${name}`,
                 tags: [name],
                 parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                 responses: { 200: { description: 'Deleted' } }
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
