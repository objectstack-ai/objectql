/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { IObjectQL, ObjectQLContext } from '@objectql/types';
import { ObjectQLRequest, ObjectQLResponse, ErrorCode } from './types.js';
import { validateRequest, validateResponse, ValidationError } from './validation.js';

export class ObjectQLServer {
    constructor(private app: IObjectQL) {}

    /**
     * The core handler that processes a JSON request object and returns a result.
     * This is framework-agnostic.
     */
    async handle(req: ObjectQLRequest): Promise<ObjectQLResponse> {
        try {
            // Validate the request using Zod schemas
            const validatedReq = validateRequest(req);
            
            // Log AI context if provided
            if (validatedReq.ai_context) {
                console.log('[ObjectQL AI Context]', {
                    object: validatedReq.object,
                    op: validatedReq.op,
                    intent: validatedReq.ai_context.intent,
                    natural_language: validatedReq.ai_context.natural_language,
                    use_case: validatedReq.ai_context.use_case
                });
            }

            // 1. Build Context
            // TODO: integrate with real session/auth
            const contextOptions = {
                userId: validatedReq.user?.id,
                roles: validatedReq.user?.roles || [],
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
            const objectConfig = app.getObject(validatedReq.object);
            if (!objectConfig) {
                return this.errorResponse(
                    ErrorCode.NOT_FOUND,
                    `Object '${validatedReq.object}' not found`
                );
            }
            
            const repo = ctx.object(validatedReq.object);

            let result: any;
            
            switch (validatedReq.op) {
                case 'find':
                    result = await repo.find(validatedReq.args);
                    // For find operations, return items array with pagination metadata
                    const findResponse = await this.buildListResponse(result, validatedReq.args, repo);
                    return validateResponse(findResponse);
                case 'findOne':
                    // Support both string ID and query object
                    result = await repo.findOne(validatedReq.args);
                    if (result) {
                        return validateResponse({ data: { ...result, '@type': validatedReq.object } });
                    }
                    return validateResponse({ data: null });
                case 'create':
                    result = await repo.create(validatedReq.args);
                    if (result) {
                        return validateResponse({ data: { ...result, '@type': validatedReq.object } });
                    }
                    return validateResponse({ data: null });
                case 'update':
                    result = await repo.update(validatedReq.args.id, validatedReq.args.data);
                    if (result) {
                        return validateResponse({ data: { ...result, '@type': validatedReq.object } });
                    }
                    return validateResponse({ data: null });
                case 'delete':
                    result = await repo.delete(validatedReq.args.id);
                    if (!result) {
                        return this.errorResponse(
                            ErrorCode.NOT_FOUND,
                            `Record with id '${validatedReq.args.id}' not found for delete`
                        );
                    }
                    // Return standardized delete response with data wrapper
                    return validateResponse({ 
                        data: {
                            id: validatedReq.args.id,
                            deleted: true,
                            '@type': validatedReq.object
                        }
                    });
                case 'count':
                    result = await repo.count(validatedReq.args);
                    return validateResponse({ count: result, '@type': validatedReq.object });
                case 'action':
                    // Map generic args to ActionContext
                    result = await app.executeAction(validatedReq.object, validatedReq.args.action, {
                         ...ctx, // Pass context (user, etc.)
                         id: validatedReq.args.id,
                         input: validatedReq.args.input || validatedReq.args.params // Support both for convenience
                    });
                    if (result && typeof result === 'object') {
                        return validateResponse({ ...result, '@type': validatedReq.object });
                    }
                    return validateResponse(result);
                case 'createMany':
                    // Bulk create operation (already validated by schema)
                    result = await repo.createMany(validatedReq.args);
                    return validateResponse({ 
                        items: result,
                        count: Array.isArray(result) ? result.length : 0,
                        '@type': validatedReq.object
                    });
                case 'updateMany':
                    // Bulk update operation (already validated by schema)
                    result = await repo.updateMany(validatedReq.args.filters || {}, validatedReq.args.data);
                    return validateResponse({ 
                        count: result,
                        '@type': validatedReq.object
                    });
                case 'deleteMany':
                    // Bulk delete operation (already validated by schema)
                    result = await repo.deleteMany(validatedReq.args.filters || {});
                    return validateResponse({ 
                        count: result,
                        '@type': validatedReq.object
                    });
                default:
                    return this.errorResponse(
                        ErrorCode.INVALID_REQUEST,
                        `Unknown operation: ${validatedReq.op}`
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

        // Calculate pagination metadata if limit/skip/offset are present
        if (args && (args.limit || args.skip || args.offset)) {
            const skip = args.offset || args.skip || 0;
            const limit = args.limit || items.length;
            
            // Get total count - exclude limit/skip to count all matching records
            const countArgs: any = {};
            if (args.filters) countArgs.filters = args.filters;
            if (args.expand) countArgs.expand = args.expand;
            const total = await repo.count(countArgs);
            
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

        // Handle validation errors (including Zod validation)
        if (error instanceof ValidationError || error.name === 'ValidationError' || error.code === 'VALIDATION_ERROR') {
            return this.errorResponse(
                ErrorCode.VALIDATION_ERROR,
                error.message || 'Validation failed',
                error.details || { fields: error.fields }
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
