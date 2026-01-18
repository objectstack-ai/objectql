/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { IObjectQL, ObjectQLContext } from '@objectql/types';
import { ObjectQLRequest, ObjectQLResponse, ErrorCode } from './types';

export class ObjectQLServer {
    constructor(private app: IObjectQL) {}

    /**
     * The core handler that processes a JSON request object and returns a result.
     * This is framework-agnostic.
     */
    async handle(req: ObjectQLRequest): Promise<ObjectQLResponse> {
        try {
            // Log AI context if provided
            if (req.ai_context) {
                console.log('[ObjectQL AI Context]', {
                    object: req.object,
                    op: req.op,
                    intent: req.ai_context.intent,
                    natural_language: req.ai_context.natural_language,
                    use_case: req.ai_context.use_case
                });
            }

            // 1. Build Context
            // TODO: integrate with real session/auth
            const contextOptions = {
                userId: req.user?.id,
                roles: req.user?.roles || [],
                // TODO: spaceId
            };
            
            // Note: Currently IObjectQL.createContext implies we have access to it.
            // But IObjectQL interface in @objectql/types usually doesn't expose createContext (it's on the class).
            // We need to cast or fix the interface. Assuming 'app' behaves like ObjectQL class.
            const app = this.app as any; 
            if (typeof app.createContext !== 'function') {
                return this.errorResponse(
                    ErrorCode.INTERNAL_ERROR,
                    "The provided ObjectQL instance does not support createContext."
                );
            }
            
            const ctx: ObjectQLContext = app.createContext(contextOptions);
            
            // Validate object exists
            const objectConfig = app.getObject(req.object);
            if (!objectConfig) {
                return this.errorResponse(
                    ErrorCode.NOT_FOUND,
                    `Object '${req.object}' not found`
                );
            }
            
            const repo = ctx.object(req.object);

            let result: any;
            
            switch (req.op) {
                case 'find':
                    result = await repo.find(req.args);
                    // For find operations, return items array with pagination metadata
                    return this.buildListResponse(result, req.args, repo);
                case 'findOne':
                    // Support both string ID and query object
                    result = await repo.findOne(req.args);
                    if (result) {
                        return { ...result, '@type': req.object };
                    }
                    return result;
                case 'create':
                    result = await repo.create(req.args);
                    if (result) {
                        return { ...result, '@type': req.object };
                    }
                    return result;
                case 'update':
                    result = await repo.update(req.args.id, req.args.data);
                    if (result) {
                        return { ...result, '@type': req.object };
                    }
                    return result;
                case 'delete':
                    result = await repo.delete(req.args.id);
                    if (!result) {
                        return this.errorResponse(
                            ErrorCode.NOT_FOUND,
                            `Record with id '${req.args.id}' not found for delete`
                        );
                    }
                    // Return standardized delete response with object type
                    return { 
                        id: req.args.id,
                        deleted: true,
                        '@type': req.object
                    };
                case 'count':
                    result = await repo.count(req.args);
                    return { count: result, '@type': req.object };
                case 'action':
                    // Map generic args to ActionContext
                    result = await app.executeAction(req.object, req.args.action, {
                         ...ctx, // Pass context (user, etc.)
                         id: req.args.id,
                         input: req.args.input || req.args.params // Support both for convenience
                    });
                    if (result && typeof result === 'object') {
                        return { ...result, '@type': req.object };
                    }
                    return result;
                case 'createMany':
                    // Bulk create operation
                    if (!Array.isArray(req.args)) {
                        return this.errorResponse(
                            ErrorCode.INVALID_REQUEST,
                            'createMany expects args to be an array of records'
                        );
                    }
                    result = await repo.createMany(req.args);
                    return { 
                        items: result,
                        count: Array.isArray(result) ? result.length : 0,
                        '@type': req.object
                    };
                case 'updateMany':
                    // Bulk update operation
                    // args should be { filters, data }
                    if (!req.args || typeof req.args !== 'object' || !req.args.data) {
                        return this.errorResponse(
                            ErrorCode.INVALID_REQUEST,
                            'updateMany expects args to be an object with { filters, data }'
                        );
                    }
                    result = await repo.updateMany(req.args.filters || {}, req.args.data);
                    return { 
                        count: result,
                        '@type': req.object
                    };
                case 'deleteMany':
                    // Bulk delete operation
                    // args should be { filters }
                    if (!req.args || typeof req.args !== 'object') {
                        return this.errorResponse(
                            ErrorCode.INVALID_REQUEST,
                            'deleteMany expects args to be an object with { filters }'
                        );
                    }
                    result = await repo.deleteMany(req.args.filters || {});
                    return { 
                        count: result,
                        '@type': req.object
                    };
                default:
                    return this.errorResponse(
                        ErrorCode.INVALID_REQUEST,
                        `Unknown operation: ${req.op}`
                    );
            }

        } catch (e: any) {
            return this.handleError(e);
        }
    }

    /**
     * Build a standardized list response with pagination metadata
     */
    private async buildListResponse(items: any[], args: any, repo: any): Promise<ObjectQLResponse> {
        const response: ObjectQLResponse = {
            items
        };

        // Calculate pagination metadata if limit/skip are present
        if (args && (args.limit || args.skip)) {
            const skip = args.skip || 0;
            const limit = args.limit || items.length;
            
            // Get total count - use the same arguments as the query to ensure consistency
            const total = await repo.count(args || {});
            
            const size = limit;
            const page = limit > 0 ? Math.floor(skip / limit) + 1 : 1;
            const pages = limit > 0 ? Math.ceil(total / limit) : 1;
            const has_next = skip + items.length < total;

            response.meta = {
                total,
                page,
                size,
                pages,
                has_next
            };
        }

        return response;
    }

    /**
     * Handle errors and convert them to appropriate error responses
     */
    private handleError(error: any): ObjectQLResponse {
        console.error('[ObjectQL Server] Error:', error);

        // Handle validation errors
        if (error.name === 'ValidationError' || error.code === 'VALIDATION_ERROR') {
            return this.errorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Validation failed',
                { fields: error.fields || error.details }
            );
        }

        // Handle permission errors
        if (error.name === 'PermissionError' || error.code === 'FORBIDDEN') {
            return this.errorResponse(
                ErrorCode.FORBIDDEN,
                error.message || 'You do not have permission to access this resource',
                error.details
            );
        }

        // Handle not found errors
        if (error.name === 'NotFoundError' || error.code === 'NOT_FOUND') {
            return this.errorResponse(
                ErrorCode.NOT_FOUND,
                error.message || 'Resource not found'
            );
        }

        // Handle conflict errors (e.g., unique constraint violations)
        if (error.name === 'ConflictError' || error.code === 'CONFLICT') {
            return this.errorResponse(
                ErrorCode.CONFLICT,
                error.message || 'Resource conflict',
                error.details
            );
        }

        // Handle database errors
        if (error.name === 'DatabaseError' || error.code?.startsWith('DB_')) {
            return this.errorResponse(
                ErrorCode.DATABASE_ERROR,
                'Database operation failed',
                { originalError: error.message }
            );
        }

        // Default to internal error
        return this.errorResponse(
            ErrorCode.INTERNAL_ERROR,
            error.message || 'An error occurred'
        );
    }

    /**
     * Create a standardized error response
     */
    private errorResponse(code: ErrorCode, message: string, details?: any): ObjectQLResponse {
        return {
            error: {
                code,
                message,
                details
            }
        };
    }
}
