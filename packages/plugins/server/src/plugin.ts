/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { IObjectQL, ObjectQLPlugin, ApiRouteConfig } from '@objectql/types';
import { IncomingMessage, ServerResponse, createServer, Server } from 'http';
import { createNodeHandler, NodeHandlerOptions } from './adapters/node';
import { createRESTHandler, RESTHandlerOptions } from './adapters/rest';
import { createGraphQLHandler } from './adapters/graphql';
import { createMetadataHandler } from './metadata';

export interface ServerPluginOptions {
    /**
     * Port number to listen on
     * @default 3000
     */
    port?: number;

    /**
     * Host address to bind to
     * @default 'localhost'
     */
    host?: string;

    /**
     * Custom API route configuration
     */
    routes?: ApiRouteConfig;

    /**
     * File storage configuration
     */
    fileStorage?: NodeHandlerOptions['fileStorage'];

    /**
     * Enable GraphQL endpoint
     * @default false
     */
    enableGraphQL?: boolean;

    /**
     * Enable REST endpoint
     * @default true
     */
    enableREST?: boolean;

    /**
     * Enable metadata endpoint
     * @default true
     */
    enableMetadata?: boolean;

    /**
     * Enable JSON-RPC endpoint
     * @default true
     */
    enableRPC?: boolean;

    /**
     * Automatically start server on setup
     * @default false
     */
    autoStart?: boolean;

    /**
     * Custom request handler middleware
     */
    middleware?: ((req: IncomingMessage, res: ServerResponse, next: () => void) => void)[];
}

/**
 * Server Plugin for ObjectQL
 * Provides HTTP server capabilities with support for JSON-RPC, REST, GraphQL and Metadata APIs
 */
export class ServerPlugin implements ObjectQLPlugin {
    name = 'objectql-server';
    private server?: Server;
    private options: ServerPluginOptions;

    constructor(options: ServerPluginOptions = {}) {
        this.options = {
            port: options.port || parseInt(process.env.PORT || '3000'),
            host: options.host || process.env.HOST || 'localhost',
            routes: options.routes || {},
            fileStorage: options.fileStorage,
            enableGraphQL: options.enableGraphQL ?? false,
            enableREST: options.enableREST ?? true,
            enableMetadata: options.enableMetadata ?? true,
            enableRPC: options.enableRPC ?? true,
            autoStart: options.autoStart ?? false,
            middleware: options.middleware || []
        };
    }

    async setup(app: IObjectQL): Promise<void> {
        console.log('[ServerPlugin] Setting up HTTP server...');

        // Create handlers based on enabled features
        const nodeHandler = this.options.enableRPC 
            ? createNodeHandler(app, { 
                routes: this.options.routes,
                fileStorage: this.options.fileStorage 
              }) 
            : undefined;

        const restHandler = this.options.enableREST 
            ? createRESTHandler(app, { routes: this.options.routes }) 
            : undefined;

        const graphqlHandler = this.options.enableGraphQL 
            ? createGraphQLHandler(app) 
            : undefined;

        const metadataHandler = this.options.enableMetadata 
            ? createMetadataHandler(app) 
            : undefined;

        // Create HTTP server
        this.server = createServer((req, res) => {
            // Apply middleware
            let middlewareIndex = 0;
            const middleware = this.options.middleware || [];
            const next = () => {
                if (middlewareIndex < middleware.length) {
                    const fn = middleware[middlewareIndex++];
                    fn(req, res, next);
                } else {
                    // Route to appropriate handler
                    this.routeRequest(req, res, {
                        nodeHandler,
                        restHandler,
                        graphqlHandler,
                        metadataHandler
                    });
                }
            };
            next();
        });

        // Auto-start if configured
        if (this.options.autoStart) {
            await this.start();
        }

        console.log('[ServerPlugin] Server setup complete');
    }

    /**
     * Route incoming requests to the appropriate handler
     */
    private routeRequest(
        req: IncomingMessage,
        res: ServerResponse,
        handlers: {
            nodeHandler?: (req: IncomingMessage, res: ServerResponse) => Promise<void>;
            restHandler?: (req: IncomingMessage, res: ServerResponse) => Promise<void>;
            graphqlHandler?: (req: IncomingMessage, res: ServerResponse) => Promise<void>;
            metadataHandler?: (req: IncomingMessage, res: ServerResponse) => Promise<void>;
        }
    ) {
        const url = req.url || '/';
        const resolvedRoutes = this.options.routes || {};

        // Determine which handler to use based on URL path
        // Note: GraphQL not in default routes, would need custom configuration
        if (handlers.restHandler && url.startsWith(resolvedRoutes.data || '/api/data')) {
            handlers.restHandler(req, res);
        } else if (handlers.metadataHandler && url.startsWith(resolvedRoutes.metadata || '/api/metadata')) {
            handlers.metadataHandler(req, res);
        } else if (handlers.nodeHandler) {
            handlers.nodeHandler(req, res);
        } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Endpoint not found' } }));
        }
    }

    /**
     * Start the HTTP server
     */
    async start(): Promise<void> {
        if (!this.server) {
            throw new Error('Server not initialized. Call setup() first.');
        }

        return new Promise((resolve, reject) => {
            this.server!.listen(this.options.port, this.options.host, () => {
                const routes = this.options.routes || {};
                console.log(`\n🚀 ObjectQL Server running on http://${this.options.host}:${this.options.port}`);
                console.log(`\n🔌 APIs:`);
                if (this.options.enableRPC) {
                    console.log(`  - JSON-RPC:  http://${this.options.host}:${this.options.port}${routes.rpc || '/api/objectql'}`);
                }
                if (this.options.enableREST) {
                    console.log(`  - REST:      http://${this.options.host}:${this.options.port}${routes.data || '/api/data'}`);
                }
                if (this.options.enableGraphQL) {
                    console.log(`  - GraphQL:   http://${this.options.host}:${this.options.port}/api/graphql`);
                }
                if (this.options.enableMetadata) {
                    console.log(`  - Metadata:  http://${this.options.host}:${this.options.port}${routes.metadata || '/api/metadata'}`);
                }
                resolve();
            });

            this.server!.on('error', reject);
        });
    }

    /**
     * Stop the HTTP server
     */
    async stop(): Promise<void> {
        if (!this.server) {
            return;
        }

        return new Promise((resolve, reject) => {
            this.server!.close((err) => {
                if (err) reject(err);
                else {
                    console.log('[ServerPlugin] Server stopped');
                    resolve();
                }
            });
        });
    }

    /**
     * Get the underlying Node.js HTTP server instance
     */
    getServer(): Server | undefined {
        return this.server;
    }
}
