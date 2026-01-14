import { IObjectQL, ObjectConfig, FieldConfig } from '@objectql/types';
import { ObjectQLServer } from '../server';
import { ErrorCode } from '../types';
import { IncomingMessage, ServerResponse } from 'http';
import { graphql, GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLFloat, GraphQLBoolean, GraphQLList, GraphQLNonNull, GraphQLInputObjectType, GraphQLFieldConfigMap, GraphQLOutputType, GraphQLInputType } from 'graphql';

/**
 * Normalize ObjectQL response to use 'id' instead of '_id'
 */
function normalizeId(data: unknown): unknown {
    if (!data) return data;
    
    if (Array.isArray(data)) {
        return data.map(item => normalizeId(item));
    }
    
    if (typeof data === 'object') {
        const normalized = { ...data as Record<string, unknown> };
        
        // Map _id to id if present
        if ('_id' in normalized) {
            normalized.id = normalized._id;
            delete normalized._id;
        }
        
        // Remove '@type' field as it's not needed in GraphQL
        delete normalized['@type'];
        
        return normalized;
    }
    
    return data;
}

/**
 * Map ObjectQL field types to GraphQL types
 */
function mapFieldTypeToGraphQL(field: FieldConfig, isInput: boolean = false): GraphQLOutputType | GraphQLInputType {
    const type = field.type;
    
    switch (type) {
        case 'text':
        case 'textarea':
        case 'markdown':
        case 'html':
        case 'email':
        case 'url':
        case 'phone':
        case 'password':
            return GraphQLString;
        case 'number':
        case 'currency':
        case 'percent':
            return GraphQLFloat;
        case 'auto_number':
            return GraphQLInt;
        case 'boolean':
            return GraphQLBoolean;
        case 'date':
        case 'datetime':
        case 'time':
            return GraphQLString; // ISO 8601 string format
        case 'select':
            // For select fields, we could create an enum type, but for simplicity use String
            return GraphQLString;
        case 'lookup':
        case 'master_detail':
            // For relationships, return ID reference
            return GraphQLString;
        case 'file':
        case 'image':
            // File fields return metadata object (simplified as String for now)
            return GraphQLString;
        case 'object':
        case 'formula':
        case 'summary':
        case 'location':
        case 'vector':
        case 'grid':
            // Return as JSON string
            return GraphQLString;
        default:
            return GraphQLString;
    }
}

/**
 * Sanitize field/object names to be valid GraphQL identifiers
 * GraphQL names must match /^[_a-zA-Z][_a-zA-Z0-9]*$/
 */
function sanitizeGraphQLName(name: string): string {
    // Replace invalid characters with underscores
    let sanitized = name.replace(/[^_a-zA-Z0-9]/g, '_');
    
    // Ensure it starts with a letter or underscore
    if (!/^[_a-zA-Z]/.test(sanitized)) {
        sanitized = '_' + sanitized;
    }
    
    return sanitized;
}

/**
 * Generate GraphQL schema from ObjectQL metadata
 */
export function generateGraphQLSchema(app: IObjectQL): GraphQLSchema {
    const objects = app.metadata.list<ObjectConfig>('object');
    
    // Validate that there are objects to generate schema from
    if (!objects || objects.length === 0) {
        // Create a minimal schema with a dummy query to avoid GraphQL error
        return new GraphQLSchema({
            query: new GraphQLObjectType({
                name: 'Query',
                fields: {
                    _schema: {
                        type: GraphQLString,
                        description: 'Schema introspection placeholder',
                        resolve: () => 'No objects registered in ObjectQL metadata'
                    }
                }
            })
        });
    }
    
    const typeMap: Record<string, GraphQLObjectType> = {};
    const inputTypeMap: Record<string, GraphQLInputObjectType> = {};
    const deleteResultTypeMap: Record<string, GraphQLObjectType> = {};
    
    // Create a shared ObjectQL server instance to reuse across resolvers
    // This is safe because ObjectQLServer is stateless - it only holds a reference to the app
    // and creates fresh contexts for each request via handle()
    const server = new ObjectQLServer(app);
    
    // First pass: Create all object types
    for (const config of objects) {
        const objectName = config.name;
        
        // Skip if no name or fields defined
        if (!objectName || !config.fields || Object.keys(config.fields).length === 0) {
            continue;
        }
        
        const sanitizedTypeName = sanitizeGraphQLName(objectName.charAt(0).toUpperCase() + objectName.slice(1));
        
        // Create output type
        const fields: GraphQLFieldConfigMap<any, any> = {
            id: { type: new GraphQLNonNull(GraphQLString) }
        };
        
        for (const [fieldName, fieldConfig] of Object.entries(config.fields)) {
            const sanitizedFieldName = sanitizeGraphQLName(fieldName);
            const gqlType = mapFieldTypeToGraphQL(fieldConfig, false) as GraphQLOutputType;
            fields[sanitizedFieldName] = {
                type: fieldConfig.required ? new GraphQLNonNull(gqlType) : gqlType,
                description: fieldConfig.label || fieldName
            };
        }
        
        typeMap[objectName] = new GraphQLObjectType({
            name: sanitizedTypeName,
            description: config.label || objectName,
            fields
        });
        
        // Create input type for mutations
        const inputFields: Record<string, any> = {};
        
        for (const [fieldName, fieldConfig] of Object.entries(config.fields)) {
            const sanitizedFieldName = sanitizeGraphQLName(fieldName);
            const gqlType = mapFieldTypeToGraphQL(fieldConfig, true) as GraphQLInputType;
            inputFields[sanitizedFieldName] = {
                type: gqlType,
                description: fieldConfig.label || fieldName
            };
        }
        
        inputTypeMap[objectName] = new GraphQLInputObjectType({
            name: sanitizedTypeName + 'Input',
            description: `Input type for ${config.label || objectName}`,
            fields: inputFields
        });
        
        // Create delete result type (shared across all delete mutations for this object)
        deleteResultTypeMap[objectName] = new GraphQLObjectType({
            name: 'Delete' + sanitizedTypeName + 'Result',
            fields: {
                id: { type: new GraphQLNonNull(GraphQLString) },
                deleted: { type: new GraphQLNonNull(GraphQLBoolean) }
            }
        });
    }
    
    // Build query root
    const queryFields: GraphQLFieldConfigMap<any, any> = {};
    
    for (const config of objects) {
        const objectName = config.name;
        
        if (!objectName || !typeMap[objectName]) continue;
        
        // Query single record by ID
        queryFields[objectName] = {
            type: typeMap[objectName],
            args: {
                id: { type: new GraphQLNonNull(GraphQLString) }
            },
            resolve: async (_, args) => {
                const result = await server.handle({
                    op: 'findOne',
                    object: objectName,
                    args: args.id
                });
                
                if (result.error) {
                    throw new Error(result.error.message);
                }
                
                return normalizeId(result);
            }
        };
        
        // Query list of records
        // Using 'List' suffix to avoid naming conflicts and handle irregular plurals
        queryFields[objectName + 'List'] = {
            type: new GraphQLList(typeMap[objectName]),
            args: {
                limit: { type: GraphQLInt },
                skip: { type: GraphQLInt },
                filters: { type: GraphQLString }, // JSON string
                fields: { type: new GraphQLList(GraphQLString) },
                sort: { type: GraphQLString } // JSON string
            },
            resolve: async (_, args) => {
                const queryArgs: any = {};
                if (args.limit) queryArgs.limit = args.limit;
                if (args.skip) queryArgs.skip = args.skip;
                if (args.fields) queryArgs.fields = args.fields;
                if (args.filters) {
                    try {
                        queryArgs.filters = JSON.parse(args.filters);
                    } catch (e) {
                        throw new Error('Invalid filters JSON');
                    }
                }
                if (args.sort) {
                    try {
                        queryArgs.sort = JSON.parse(args.sort);
                    } catch (e) {
                        throw new Error('Invalid sort JSON');
                    }
                }
                
                const result = await server.handle({
                    op: 'find',
                    object: objectName,
                    args: queryArgs
                });
                
                if (result.error) {
                    throw new Error(result.error.message);
                }
                
                return normalizeId(result.items || []);
            }
        };
    }
    
    const queryType = new GraphQLObjectType({
        name: 'Query',
        fields: queryFields
    });
    
    // Build mutation root
    const mutationFields: GraphQLFieldConfigMap<any, any> = {};
    
    for (const config of objects) {
        const objectName = config.name;
        
        if (!objectName || !typeMap[objectName] || !inputTypeMap[objectName]) continue;
        
        const capitalizedName = sanitizeGraphQLName(objectName.charAt(0).toUpperCase() + objectName.slice(1));
        
        // Create mutation
        mutationFields['create' + capitalizedName] = {
            type: typeMap[objectName],
            args: {
                input: { type: new GraphQLNonNull(inputTypeMap[objectName]) }
            },
            resolve: async (_, args) => {
                const result = await server.handle({
                    op: 'create',
                    object: objectName,
                    args: args.input
                });
                
                if (result.error) {
                    throw new Error(result.error.message);
                }
                
                return normalizeId(result);
            }
        };
        
        // Update mutation
        mutationFields['update' + capitalizedName] = {
            type: typeMap[objectName],
            args: {
                id: { type: new GraphQLNonNull(GraphQLString) },
                input: { type: new GraphQLNonNull(inputTypeMap[objectName]) }
            },
            resolve: async (_, args) => {
                const result = await server.handle({
                    op: 'update',
                    object: objectName,
                    args: {
                        id: args.id,
                        data: args.input
                    }
                });
                
                if (result.error) {
                    throw new Error(result.error.message);
                }
                
                return normalizeId(result);
            }
        };
        
        // Delete mutation - use shared delete result type
        mutationFields['delete' + capitalizedName] = {
            type: deleteResultTypeMap[objectName],
            args: {
                id: { type: new GraphQLNonNull(GraphQLString) }
            },
            resolve: async (_, args) => {
                const result = await server.handle({
                    op: 'delete',
                    object: objectName,
                    args: { id: args.id }
                });
                
                if (result.error) {
                    throw new Error(result.error.message);
                }
                
                return result;
            }
        };
    }
    
    const mutationType = new GraphQLObjectType({
        name: 'Mutation',
        fields: mutationFields
    });
    
    return new GraphQLSchema({
        query: queryType,
        mutation: mutationType
    });
}

/**
 * Parse GraphQL request body
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
 * Creates a GraphQL HTTP request handler for ObjectQL
 * 
 * Endpoints:
 * - POST /api/graphql - GraphQL queries and mutations
 * - GET /api/graphql - GraphQL queries via URL parameters
 */
export function createGraphQLHandler(app: IObjectQL) {
    // Generate schema once - Note: Schema is static after handler creation.
    // If metadata changes at runtime, create a new handler or regenerate the schema.
    const schema = generateGraphQLSchema(app);
    
    return async (req: IncomingMessage & { body?: any }, res: ServerResponse) => {
        try {
            // CORS headers
            const requestOrigin = req.headers.origin;
            const configuredOrigin = process.env.OBJECTQL_CORS_ORIGIN;
            const isProduction = process.env.NODE_ENV === 'production';

            if (!isProduction) {
                res.setHeader('Access-Control-Allow-Origin', configuredOrigin || '*');
            } else if (configuredOrigin && (!requestOrigin || requestOrigin === configuredOrigin)) {
                res.setHeader('Access-Control-Allow-Origin', configuredOrigin);
            }
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

            if (req.method === 'OPTIONS') {
                res.statusCode = 200;
                res.end();
                return;
            }

            const url = req.url || '';
            const method = req.method || 'POST';

            if (method !== 'GET' && method !== 'POST') {
                sendJSON(res, 405, {
                    errors: [{
                        message: 'Method not allowed. Use GET or POST.'
                    }]
                });
                return;
            }

            let query: string = '';
            let variables: any = null;
            let operationName: string | null = null;

            if (method === 'GET') {
                // Parse query string for GET requests
                const urlObj = new URL(url, `http://${req.headers.host || 'localhost'}`);
                query = urlObj.searchParams.get('query') || '';
                const varsParam = urlObj.searchParams.get('variables');
                if (varsParam) {
                    try {
                        variables = JSON.parse(varsParam);
                    } catch (e) {
                        sendJSON(res, 400, {
                            errors: [{
                                message: 'Invalid variables JSON'
                            }]
                        });
                        return;
                    }
                }
                operationName = urlObj.searchParams.get('operationName');
            } else {
                // Parse body for POST requests
                const body = req.body || await readBody(req);
                query = body.query || '';
                variables = body.variables || null;
                operationName = body.operationName || null;
            }

            if (!query) {
                sendJSON(res, 400, {
                    errors: [{
                        message: 'Must provide query string'
                    }]
                });
                return;
            }

            // Execute GraphQL query
            const result = await graphql({
                schema,
                source: query,
                variableValues: variables,
                operationName,
                contextValue: { app }
            });

            sendJSON(res, 200, result);

        } catch (e: any) {
            console.error('[GraphQL Handler] Error:', e);
            
            const errorResponse: {
                errors: Array<{
                    message: string;
                    extensions: {
                        code: ErrorCode;
                        debug?: {
                            message?: string;
                            stack?: string;
                        };
                    };
                }>;
            } = {
                errors: [{
                    message: 'Internal server error',
                    extensions: {
                        code: ErrorCode.INTERNAL_ERROR
                    }
                }]
            };

            // In non-production environments, include additional error details to aid debugging
            if (typeof process !== 'undefined' &&
                process.env &&
                process.env.NODE_ENV !== 'production') {
                const firstError = errorResponse.errors[0];
                firstError.extensions.debug = {
                    message: e && typeof e.message === 'string' ? e.message : undefined,
                    stack: e && typeof e.stack === 'string' ? e.stack : undefined
                };
            }

            sendJSON(res, 500, errorResponse);
        }
    };
}
