/**
 * ObjectQL REST Protocol Plugin
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RuntimePlugin, RuntimeContext } from '@objectql/types';
import { ObjectQLServer } from './server';
import { ObjectQLRequest } from './types';

export interface RestPluginConfig {
    /**
     * Base path for the REST API
     * @default "/api"
     */
    basePath?: string;
}

export class RestPlugin implements RuntimePlugin {
    name = '@objectql/protocol-rest';
    version = '4.0.4';

    private config: Required<RestPluginConfig>;
    private server?: ObjectQLServer;
    private engine?: any;

    constructor(config: RestPluginConfig = {}) {
        this.config = {
            basePath: config.basePath || '/api'
        };
    }

    async install(ctx: RuntimeContext): Promise<void> {
        console.log(`[${this.name}] Installing REST protocol...`);
        this.engine = ctx.engine || (ctx as any).getKernel?.();
        this.server = new ObjectQLServer(this.engine);
    }

    async onStart(ctx: RuntimeContext): Promise<void> {
        console.log(`[${this.name}] REST protocol ready. Mount at ${this.config.basePath}`);
    }

    // --- Adapter for compatibility ---
    async init(ctx: any): Promise<void> {
        return this.install(ctx);
    }

    async start(ctx: any): Promise<void> {
        return this.onStart(ctx);
    }
    // ---------------------------------

    attachToHono(app: any) {
        const { basePath } = this.config;
        console.log(`[${this.name}] Attaching REST to Hono at ${basePath}`);

        // Helper to map Hono request to ObjectQLRequest
        const handleRequest = async (c: any, op: string) => {
            const objectName = c.req.param('object');
            const id = c.req.param('id');
            const method = c.req.method;
            const query = c.req.query();
            
            let body = {};
            if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
                try {
                    body = await c.req.json();
                } catch (e) {}
            }

            const req: ObjectQLRequest = {
                object: objectName,
                op: op as any,
                args: {
                    id,
                    data: body,
                    ...query
                },
                user: (c.get('user') || { id: 'anonymous', roles: ['guest'] }) // TODO: Integ auth
            };

            const response = await this.server!.handle(req);
            
            if (response.error) {
                return c.json({ error: response.error }, 400); // Simple error mapping
            }
            
            return c.json(response.data || { success: true });
        };

        // Define Routes
        
        // Find (List)
        app.get(`${basePath}/:object`, (c: any) => handleRequest(c, 'find'));
        
        // FindOne (Get by ID)
        app.get(`${basePath}/:object/:id`, (c: any) => handleRequest(c, 'findOne'));
        
        // Create
        app.post(`${basePath}/:object`, (c: any) => handleRequest(c, 'create'));
        
        // Update
        app.put(`${basePath}/:object/:id`, (c: any) => handleRequest(c, 'update'));
        app.patch(`${basePath}/:object/:id`, (c: any) => handleRequest(c, 'update'));
        
        // Delete
        app.delete(`${basePath}/:object/:id`, (c: any) => handleRequest(c, 'delete'));
    }
}
