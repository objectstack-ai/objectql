import { IObjectQL } from '@objectql/types';
import { ObjectQLServer } from '../server';
import { ObjectQLRequest } from '../types';
import { IncomingMessage, ServerResponse } from 'http';

/**
 * Creates a standard Node.js HTTP request handler.
 */
export function createNodeHandler(app: IObjectQL) {
    const server = new ObjectQLServer(app);


    return async (req: IncomingMessage & { body?: any }, res: ServerResponse) => {
        if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end('Method Not Allowed');
            return;
        }

        const handleRequest = async (json: any) => {
             try {
                // TODO: Parse user from header or request override
                const qlReq: ObjectQLRequest = {
                    op: json.op,
                    object: json.object,
                    args: json.args,
                    user: json.user // For dev/testing, allowing user injection
                };

                const result = await server.handle(qlReq);
                
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = result.error ? 500 : 200;
                res.end(JSON.stringify(result));
            } catch (e) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' }}));
            }
        };

        // 1. Check if body is already parsed (e.g. by express.json())
        if (req.body && typeof req.body === 'object') {
            await handleRequest(req.body);
            return;
        }

        // 2. Parse Body from stream
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const json = JSON.parse(body);
                await handleRequest(json);
            } catch (e) {
                res.statusCode = 400;
                res.end('Invalid JSON');
            }
        });
    };
}
