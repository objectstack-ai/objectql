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
                    break;
                case 'findOne':
                    // Support both string ID and query object
                    if (typeof req.args === 'string') {
                        result = await repo.findOne({ filters: [['_id', '=', req.args]] });
                    } else {
                        result = await repo.findOne(req.args);
                    }
                    break;
                case 'create':
                    result = await repo.create(req.args);
                    break;
                case 'update':
                    result = await repo.update(req.args.id, req.args.data);
                    break;
                case 'delete':
                    result = await repo.delete(req.args.id);
                    if (!result) {
                        return this.errorResponse(
                            ErrorCode.NOT_FOUND,
                            `Record with id '${req.args.id}' not found for delete`
                        );
                    }
                    // Return standardized delete response on success
                    result = { id: req.args.id, deleted: true };
                    break;
                case 'count':
                    result = await repo.count(req.args);
                    break;
                case 'action':
                    // Map generic args to ActionContext
                    result = await app.executeAction(req.object, req.args.action, {
                         ...ctx, // Pass context (user, etc.)
                         id: req.args.id,
                         input: req.args.input || req.args.params // Support both for convenience
                    });
                    break;
                default:
                    return this.errorResponse(
                        ErrorCode.INVALID_REQUEST,
                        `Unknown operation: ${req.op}`
                    );
            }

            return { data: result };

        } catch (e: any) {
            return this.handleError(e);
        }
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
