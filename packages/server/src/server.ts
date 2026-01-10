import { IObjectQL, ObjectQLContext } from '@objectql/types';
import { ObjectQLRequest, ObjectQLResponse } from './types';

export class ObjectQLServer {
    constructor(private app: IObjectQL) {}

    /**
     * The core handler that processes a JSON request object and returns a result.
     * This is framework-agnostic.
     */
    async handle(req: ObjectQLRequest): Promise<ObjectQLResponse> {
        try {
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
                throw new Error("The provided ObjectQL instance does not support createContext.");
            }
            
            const ctx: ObjectQLContext = app.createContext(contextOptions);
            const repo = ctx.object(req.object);

            let result: any;
            
            switch (req.op) {
                case 'find':
                    result = await repo.find(req.args);
                    break;
                case 'findOne':
                    result = await repo.findOne(req.args);
                    break;
                case 'create':
                    result = await repo.create(req.args);
                    break;
                case 'update':
                    result = await repo.update(req.args.id, req.args.data);
                    break;
                case 'delete':
                    result = await repo.delete(req.args.id);
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
                    throw new Error(`Unknown operation: ${req.op}`);
            }

            return { data: result };

        } catch (e: any) {
            console.error('[ObjectQL Server] Error:', e);
            return {
                error: {
                    code: 'INTERNAL_ERROR',
                    message: e.message || 'An error occurred'
                }
            };
        }
    }
}
