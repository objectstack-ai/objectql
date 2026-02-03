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
import { generateOpenAPI } from './openapi';

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
    private ctx?: RuntimeContext;

    constructor(config: RestPluginConfig = {}) {
        this.config = {
            basePath: config.basePath || '/api'
        };
    }

    async install(ctx: RuntimeContext): Promise<void> {
        console.log(`[${this.name}] Installing REST protocol...`);
        this.ctx = ctx;
        this.engine = ctx.engine || (ctx as any).getKernel?.();
        this.server = new ObjectQLServer(this.engine);
    }
    
    /**
     * Init hook - for ObjectStack Plugin interface compatibility
     */
    async init(ctx: any): Promise<void> {
        console.log(`[${this.name}] Installing REST protocol...`);
        this.ctx = ctx;
        // Don't try to get the service yet - it might not be registered
        // We'll get it when we actually need it in startPlugin
        this.server = undefined; // Will be initialized when needed
    }

    async onStart(ctx: RuntimeContext): Promise<void> {
        return this.startPlugin(ctx);
    }
    
    /**
     * Start hook - for ObjectStack Plugin interface compatibility
     */
    async start(ctx: any): Promise<void> {
        return this.startPlugin(ctx);
    }
    
    /**
     * Internal start method used by both interfaces
     */
    private async startPlugin(ctx: any): Promise<void> {
        // Initialize server if not already done
        if (!this.server) {
            // Try to get engine from context - don't fail if it doesn't exist
            try {
                this.engine = (ctx as any).getService?.('objectql') || (ctx as any).getService?.('engine') || this.engine;
            } catch (e) {
                // Service not found - that's ok, we'll work without it
                console.log(`[${this.name}] No ObjectQL service found, using minimal spec`);
            }
            if (this.engine) {
                this.server = new ObjectQLServer(this.engine);
            }
        }
        
        // Check for Hono server service
        const httpServer = (ctx as any)?.getService?.('http-server');
        if (httpServer && httpServer.app) {
             console.log(`[${this.name}] Attaching to existing Hono server...`);
             this.attachToHono(httpServer.app);
             return;
        }

        console.log(`[${this.name}] REST protocol ready. Mount at ${this.config.basePath}`);
    }

    attachToHono(app: any) {
        const { basePath } = this.config;
        console.log(`[${this.name}] Attaching REST to Hono at ${basePath}`);

        // OpenAPI Specification Endpoint
        app.get(`${basePath}/openapi.json`, (c: any) => {
            try {
                // Generate spec even if engine is not available (will show minimal spec)
                const spec = this.engine ? generateOpenAPI(this.engine) : {
                    openapi: '3.0.0',
                    info: {
                        title: 'ObjectQL API',
                        version: '1.0.0',
                        description: 'API is initializing...'
                    },
                    paths: {},
                    components: { schemas: {} }
                };
                return c.json(spec);
            } catch (error) {
                console.error(`[${this.name}] Error generating OpenAPI spec:`, error);
                return c.json({ error: 'Failed to generate OpenAPI specification' }, 500);
            }
        });

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
