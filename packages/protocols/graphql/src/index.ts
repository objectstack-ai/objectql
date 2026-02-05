/**
 * GraphQL Protocol Plugin for ObjectStack
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * 
 * Based on reference implementation by @hotlong
 */

import type { RuntimePlugin, RuntimeContext } from '@objectql/types';
import { ApolloServer, HeaderMap } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { gql } from 'graphql-tag';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { PubSub } from 'graphql-subscriptions';
import DataLoader from 'dataloader';
import express from 'express';
import cors from 'cors';
import { mapErrorToGraphQLError } from './validation.js';

// Re-export validation utilities
export * from './validation.js';

/**
 * Configuration for the GraphQL Plugin
 */
export interface GraphQLPluginConfig {
    /** Port to listen on */
    port?: number;
    /** Enable introspection (also enables Apollo Sandbox in development) */
    introspection?: boolean;
    /** Enable GraphQL Playground/landing page (Apollo Sandbox). When false, disables the landing page. */
    playground?: boolean;
    /** Custom type definitions (optional) */
    typeDefs?: string;
    /** Enable subscriptions via WebSocket */
    enableSubscriptions?: boolean;
    /** Maximum query depth allowed */
    maxDepth?: number;
    /** PubSub instance for subscriptions (default: in-memory) */
    pubsub?: PubSub;
    /**
     * Mount path for the GraphQL endpoint
     * @default "/graphql"
     */
    path?: string;

    /**
     * Alias for path, used for consistency with other plugins
     * @default "/graphql"
     */
    basePath?: string;
    
    /**
     * Enable Apollo Federation support
     * When enabled, generates a federated subgraph schema
     * @default false
     */
    enableFederation?: boolean;
    
    /**
     * Federation service name for subgraph identification
     * @default "objectql"
     */
    federationServiceName?: string;
}

/**
 * GraphQL Protocol Plugin
 * 
 * Implements the RuntimePlugin interface to provide GraphQL protocol support.
 * 
 * Key Features:
 * - Automatic schema generation from ObjectStack metadata
 * - Query and mutation resolvers
 * - GraphQL Subscriptions via WebSocket (graphql-ws)
 * - Apollo Server v4+ integration
 * - Strongly-typed Input Types
 * - Advanced filtering and pagination (Relay-style cursors)
 * - DataLoader for N+1 query prevention
 * - Nested relationship queries
 * - GraphQL introspection and Apollo Sandbox
 * - No direct database access - all operations through ObjectStackProtocolImplementation
 * 
 * @example
 * ```typescript
 * import { ObjectKernel } from '@objectstack/core';
 * import { GraphQLPlugin } from '@objectql/protocol-graphql';
 * 
 * const kernel = new ObjectKernel([
 *   new GraphQLPlugin({ 
 *     port: 4000, 
 *     introspection: true,
 *     enableSubscriptions: true 
 *   })
 * ]);
 * await kernel.start();
 * 
 * // Access Apollo Sandbox: http://localhost:4000/
 * // WebSocket subscriptions: ws://localhost:4000/graphql
 * ```
 */
export class GraphQLPlugin implements RuntimePlugin {
    name = '@objectql/protocol-graphql';
    version = '0.2.0';
    
    private server?: ApolloServer;
    private engine?: any;
    private config: Required<Omit<GraphQLPluginConfig, 'pubsub'>> & { pubsub: PubSub };
    private httpServer?: any;
    private wsServer?: WebSocketServer;
    private expressApp?: any;
    private dataLoaders: Map<string, DataLoader<string, any>> = new Map();
    private ctx?: any;

    constructor(config: GraphQLPluginConfig = {}) {
        this.config = {
            port: config.port || 4000,
            introspection: config.introspection !== false,
            typeDefs: config.typeDefs || '',
            enableSubscriptions: config.enableSubscriptions !== false,
            enableFederation: config.enableFederation || false,
            federationServiceName: config.federationServiceName || 'objectql',
            maxDepth: config.maxDepth || 10,
            pubsub: config.pubsub || new PubSub(),
            path: config.path,
            basePath: config.basePath
        } as any;
        
        // Ensure defaults
        if (!this.config.path && !this.config.basePath) {
             this.config.path = '/graphql';
        }
    }

    // --- Adapter for @objectstack/core compatibility ---
    init = async (kernel: any): Promise<void> => {
        const ctx: any = {
            engine: kernel,
            getKernel: () => kernel
        };
        // Ensure getService is available if passed from kernel
        if (kernel && kernel.context && kernel.context.getService) {
             ctx.getService = kernel.context.getService;
        }
        return this.install(ctx);
    }

    start = async (kernel: any): Promise<void> => {
        const ctx: any = {
            engine: kernel,
            getKernel: () => kernel
        };
        return this.onStart(ctx);
    }

    /**
     * Install hook - called during kernel initialization
     */
    async install(ctx: RuntimeContext): Promise<void> {
        console.log(`[${this.name}] Installing GraphQL protocol plugin...`);
        this.ctx = ctx;
        
        // Store reference to the engine for later use
        this.engine = ctx.engine || (ctx as any).getKernel?.();
        
        console.log(`[${this.name}] Protocol bridge initialized`);
    }

    /**
     * Start hook - called when kernel starts
     * This is where we start the GraphQL server with WebSocket support
     */
    async onStart(ctx: RuntimeContext): Promise<void> {
        if (!this.engine) {
            throw new Error('Protocol not initialized. Install hook must be called first.');
        }

        // Check for Hono server service
        // Try getting from local context first, then fallback to kernel engine
        let httpServer = (this.ctx as any).getService?.('http-server');
        if (!httpServer && this.engine && (this.engine as any).getService) {
            httpServer = (this.engine as any).getService('http-server');
        }

        // Compatibility fallback: try 'http.server' shim if registered
        if (!httpServer) {
             httpServer = (this.ctx as any).getService?.('http.server') ||
                          (this.engine as any).getService?.('http.server');
        }

        if (httpServer && httpServer.app) {
            console.log(`[${this.name}] Attaching to existing Hono server...`);
            await this.attachToHono(httpServer.app);
            return;
        }

        console.log(`[${this.name}] Starting GraphQL server with subscriptions (Standalone)...`);

        // Generate schema from metadata
        const typeDefs = this.generateSchema();
        const resolvers = this.generateResolvers();

        // Create executable schema with optional Federation support
        let schema;
        if (this.config.enableFederation) {
            // Build federated subgraph schema
            // buildSubgraphSchema expects parsed GraphQL documents
            schema = buildSubgraphSchema([
                {
                    typeDefs: gql(typeDefs),
                    resolvers
                }
            ]);
            console.log(`[${this.name}] 🔗 Apollo Federation enabled - service: ${this.config.federationServiceName}`);
        } else {
            // Build standard GraphQL schema
            schema = makeExecutableSchema({
                typeDefs,
                resolvers
            });
        }

        // Create Express app
        this.expressApp = express();
        this.httpServer = createServer(this.expressApp);

        // Create WebSocket server for subscriptions
        if (this.config.enableSubscriptions) {
            this.wsServer = new WebSocketServer({
                server: this.httpServer,
                path: '/graphql'
            });

            // Setup GraphQL WS server
            const serverCleanup = useServer(
                {
                    schema,
                    context: async () => ({
                        engine: this.engine,
                        pubsub: this.config.pubsub,
                        dataLoaders: this.getDataLoaders()
                    })
                },
                this.wsServer as any
            );
        }

        // Create Apollo Server with WebSocket support
        const plugins: any[] = [
            ApolloServerPluginDrainHttpServer({ httpServer: this.httpServer }),
            {
                async serverWillStart() {
                    return {
                        async drainServer() {
                            // Cleanup WebSocket server on shutdown
                        }
                    };
                }
            }
        ];

        // Disable landing page in test mode when playground is explicitly set to false
        if (this.config.playground === false) {
            plugins.push(ApolloServerPluginLandingPageDisabled());
        }

        this.server = new ApolloServer({
            schema,
            introspection: this.config.introspection,
            plugins,
            includeStacktraceInErrorResponses: process.env.NODE_ENV !== 'production',
            formatError: (formattedError, error) => {
                return {
                    message: formattedError.message,
                    locations: formattedError.locations,
                    path: formattedError.path,
                    extensions: {
                        code: formattedError.extensions?.code || 'INTERNAL_SERVER_ERROR',
                        ...formattedError.extensions
                    }
                };
            }
        });

        await this.server.start();

        // Apply middleware
        this.expressApp.use(
            '/graphql',
            cors<cors.CorsRequest>(),
            express.json(),
            expressMiddleware(this.server, {
                context: async () => ({
                    engine: this.engine,
                    pubsub: this.config.pubsub,
                    dataLoaders: this.getDataLoaders()
                })
            })
        );

        // Start HTTP server
        await new Promise<void>((resolve) => {
            this.httpServer.listen(this.config.port, () => {
                console.log(`[${this.name}] 🚀 GraphQL server ready at: http://localhost:${this.config.port}/graphql`);
                if (this.config.introspection) {
                    console.log(`[${this.name}] 📊 Apollo Sandbox available at: http://localhost:${this.config.port}/graphql`);
                }
                if (this.config.enableSubscriptions) {
                    console.log(`[${this.name}] 🔌 WebSocket subscriptions ready at: ws://localhost:${this.config.port}/graphql`);
                }
                resolve();
            });
        });
    }

    // ---------------------------------------------------

    private async attachToHono(app: any) {
        // Generate schema
        const typeDefs = this.generateSchema();
        const resolvers = this.generateResolvers();
        const schema = makeExecutableSchema({ typeDefs, resolvers });

        // Initialize Apollo Server (without express middleware yet)
        const plugins: any[] = [
            {
                async serverWillStart() {
                    return { async drainServer() {} };
                }
            }
        ];

        // Disable landing page in test mode when playground is explicitly set to false
        if (this.config.playground === false) {
            plugins.push(ApolloServerPluginLandingPageDisabled());
        }

        this.server = new ApolloServer({
            schema,
            introspection: this.config.introspection,
            plugins,
            includeStacktraceInErrorResponses: process.env.NODE_ENV !== 'production',
        });

        await this.server.start();

        // Mount on Hono
        // Based on common Hono-Apollo adapter patterns
        const path = this.config.path || this.config.basePath || '/graphql';
        // console.log(`[${this.name}] Mounting GraphQL endpoint at: ${path}`);
        app.use(path, async (c: any) => {
            const httpGraphQLRequest = {
                body: await c.req.json().catch(() => ({})),
                headers: new HeaderMap(Object.entries(c.req.header())),
                method: c.req.method,
                search: new URL(c.req.url).search,
            };

            const httpGraphQLResponse = await this.server!.executeHTTPGraphQLRequest({
                httpGraphQLRequest,
                context: async () => ({
                    engine: this.engine,
                    pubsub: this.config.pubsub,
                    dataLoaders: this.getDataLoaders()
                }),
            });

            // Set headers
            for (const [key, value] of httpGraphQLResponse.headers) {
                c.header(key, value);
            }
            c.status(httpGraphQLResponse.status || 200);

            if (httpGraphQLResponse.body.kind === 'complete') {
                return c.body(httpGraphQLResponse.body.string);
            } else {
                // Determine if we are allowed to stream
                 // For now, simpler to text
                 let text = '';
                 for await (const chunk of httpGraphQLResponse.body.asyncIterator) {
                     text += chunk;
                 }
                 return c.body(text);
            }
        });
        
        console.log(`[${this.name}] 🚀 GraphQL mounted at /graphql`);
        if (this.config.introspection) {
            console.log(`[${this.name}] 📊 Apollo Sandbox available at /graphql`);
        }
    }

    /**
     * Stop hook - called when kernel stops
     */
    async onStop(ctx: RuntimeContext): Promise<void> {
        console.log(`[${this.name}] Stopping GraphQL server...`);
        
        if (this.server) {
            await this.server.stop();
            this.server = undefined;
        }
        
        if (this.wsServer) {
            this.wsServer.close();
            this.wsServer = undefined;
        }
        
        if (this.httpServer) {
            await new Promise<void>((resolve, reject) => {
                this.httpServer.close((err: any) => {
                    // Ignore ERR_SERVER_NOT_RUNNING as it means the server is already stopped
                    if (err && err.code !== 'ERR_SERVER_NOT_RUNNING') {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
            this.httpServer = undefined;
        }
        
        this.dataLoaders.clear();
    }

    /**
     * Get or create DataLoaders for preventing N+1 queries
     */
    private getDataLoaders(): Map<string, DataLoader<string, any>> {
        // Clear and recreate data loaders for each request
        this.dataLoaders.clear();
        
        const objectTypes = this.getMetaTypes();
        
        for (const objectName of objectTypes) {
            this.dataLoaders.set(objectName, new DataLoader(async (ids: readonly string[]) => {
                const results = await Promise.all(
                    ids.map(id => this.getData(objectName, id))
                );
                return results;
            }));
        }
        
        return this.dataLoaders;
    }

    /**
     * Helper: Get list of registered object types from metadata
     */
    private getMetaTypes(): string[] {
        if (!this.engine?.metadata) return [];
        
        // Try modern metadata API first
        if (typeof this.engine.metadata.getTypes === 'function') {
            const types = this.engine.metadata.getTypes();
            // Filter to only 'object' types
            return types.filter((t: string) => {
                const items = this.engine.metadata.list(t);
                return items && items.length > 0;
            }).filter((t: string) => t === 'object');
        }
        
        // Fallback to list method if available
        if (typeof this.engine.metadata.list === 'function') {
            try {
                const objects = this.engine.metadata.list('object');
                return objects.map((obj: any) => obj.content?.name ?? obj.name ?? obj.id).filter(Boolean);
            } catch (e) {
                return [];
            }
        }
        
        return [];
    }
    
    /**
     * Helper: Get metadata item
     */
    private getMetaItem(type: string, name: string): any {
        if (!this.engine?.metadata) return null;
        
        if (typeof this.engine.metadata.get === 'function') {
            const result = this.engine.metadata.get(type, name);
            // Handle both wrapped (with .content) and direct metadata structures
            return result?.content ?? result;
        }
        
        return null;
    }
    
    /**
     * Helper: Get data by ID
     */
    private async getData(objectName: string, id: string): Promise<any> {
        if (!this.engine) return null;
        
        // Try modern kernel API
        if (typeof this.engine.get === 'function') {
            return await this.engine.get(objectName, id);
        }
        
        return null;
    }
    
    /**
     * Helper: Find data with query
     */
    private async findData(objectName: string, query: any): Promise<any[]> {
        if (!this.engine) return [];
        
        // Try modern kernel API
        if (typeof this.engine.find === 'function') {
            const result = await this.engine.find(objectName, query);
            // Handle both array response and {value, count} response
            return Array.isArray(result) ? result : (result?.value || []);
        }
        
        return [];
    }
    
    /**
     * Helper: Create data
     */
    private async createData(objectName: string, data: any): Promise<any> {
        if (!this.engine) return null;
        
        if (typeof this.engine.create === 'function') {
            return await this.engine.create(objectName, data);
        }
        
        return null;
    }
    
    /**
     * Helper: Update data
     */
    private async updateData(objectName: string, id: string, data: any): Promise<any> {
        if (!this.engine) return null;
        
        if (typeof this.engine.update === 'function') {
            return await this.engine.update(objectName, id, data);
        }
        
        return null;
    }
    
    /**
     * Helper: Delete data
     */
    private async deleteData(objectName: string, id: string): Promise<boolean> {
        if (!this.engine) return false;
        
        if (typeof this.engine.delete === 'function') {
            return await this.engine.delete(objectName, id);
        }
        
        return false;
    }

    /**
     * Helper: Count data
     */
    private async countData(objectName: string, query?: any): Promise<number> {
        if (!this.engine) return 0;
        
        if (typeof this.engine.count === 'function') {
            return await this.engine.count(objectName, query);
        }
        
        return 0;
    }

    /**
     * Helper: Aggregate data with groupBy support
     */
    private async aggregateData(
        objectName: string,
        query: any,
        groupBy?: string[],
        functions?: Array<{ field: string; function: string }>
    ): Promise<any> {
        if (!this.engine) return null;
        
        // Fetch all matching records
        const records = await this.findData(objectName, query);
        
        if (!records || records.length === 0) {
            return {
                groupBy: groupBy || [],
                data: []
            };
        }
        
        // If no groupBy, perform global aggregation
        if (!groupBy || groupBy.length === 0) {
            const aggregates = this.calculateAggregates(records, functions || []);
            return {
                groupBy: [],
                data: [{
                    key: 'all',
                    count: records.length,
                    aggregates
                }]
            };
        }
        
        // Group records by the specified fields
        const groups = new Map<string, any[]>();
        
        for (const record of records) {
            // Use JSON.stringify to avoid key collisions with delimiter characters
            const keyValues = groupBy.map(field => record[field] ?? null);
            const key = JSON.stringify(keyValues);
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key)!.push(record);
        }
        
        // Calculate aggregates for each group
        const data = Array.from(groups.entries()).map(([key, groupRecords]) => ({
            key, // JSON stringified array of values
            count: groupRecords.length,
            aggregates: this.calculateAggregates(groupRecords, functions || [])
        }));
        
        return {
            groupBy,
            data
        };
    }

    /**
     * Calculate aggregate functions for a set of records
     * Note: Non-numeric values are filtered out for numeric aggregations (SUM, AVG, MIN, MAX)
     */
    private calculateAggregates(
        records: any[],
        functions: Array<{ field: string; function: string }>
    ): any[] {
        return functions.map(({ field, function: fn }) => {
            // Filter to numeric values only for numeric aggregations
            const values = records
                .map(r => r[field])
                .filter(v => v !== null && v !== undefined && typeof v === 'number');
            
            const result: any = { field };
            
            switch (fn) {
                case 'SUM':
                    result.sum = values.reduce((sum, val) => sum + val, 0);
                    break;
                case 'AVG':
                    result.avg = values.length > 0 
                        ? values.reduce((sum, val) => sum + val, 0) / values.length 
                        : null;
                    break;
                case 'MIN':
                    result.min = values.length > 0 ? Math.min(...values) : null;
                    break;
                case 'MAX':
                    result.max = values.length > 0 ? Math.max(...values) : null;
                    break;
                case 'COUNT':
                    // COUNT is handled at the group level, not per-field
                    // This case is here for completeness but doesn't populate result
                    break;
            }
            
            return result;
        });
    }

    /**
     * Generate GraphQL schema from ObjectStack metadata
     * Includes Input Types, Filtering, Pagination (Relay Connection), and Subscriptions
     */
    private generateSchema(): string {
        const objectTypes = this.getMetaTypes();
        
        let typeDefs = `#graphql`;

        if (this.config.enableFederation) {
            typeDefs += `
  extend schema @link(url: "https://specs.apollo.dev/federation/v2.3", import: ["@key", "@shareable"])
`;
        }
        
        typeDefs += `
  # Custom scalars
  """
  Represents arbitrary JSON values. Can be used for dynamic data structures.
  Supports objects, arrays, strings, numbers, booleans, and null.
  """
  scalar JSON
  
  # Common filter types
  input StringFilter {
    eq: String
    ne: String
    in: [String!]
    notIn: [String!]
    contains: String
    startsWith: String
    endsWith: String
  }

  input IntFilter {
    eq: Int
    ne: Int
    gt: Int
    gte: Int
    lt: Int
    lte: Int
    in: [Int!]
    notIn: [Int!]
  }

  input BooleanFilter {
    eq: Boolean
    ne: Boolean
  }

  # Aggregation types
  type AggregateResult {
    count: Int!
    sum: Float
    avg: Float
    min: Float
    max: Float
  }

  input AggregateFunction {
    field: String!
    function: AggregateFunctionType!
  }

  enum AggregateFunctionType {
    COUNT
    SUM
    AVG
    MIN
    MAX
  }

  type GroupByResult {
    groupBy: [String!]!
    data: [GroupByData!]!
  }

  type GroupByData {
    key: String!
    count: Int!
    aggregates: [AggregateFieldResult!]
  }

  type AggregateFieldResult {
    field: String!
    sum: Float
    avg: Float
    min: Float
    max: Float
  }

  # Relay Connection types
  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  type Query {
    hello: String
    
    # Get metadata for an object
    getObjectMetadata(name: String!): String
    
    # List all registered objects
    listObjects: [String!]!
`;

        // Generate queries for each object type
        for (const objectName of objectTypes) {
            const camelCaseName = this.toCamelCase(objectName);
            const pascalCaseName = this.toPascalCase(objectName);
            
            typeDefs += `    
    # Query ${objectName}
    ${camelCaseName}(id: ID!): ${pascalCaseName}
    ${camelCaseName}List(
      where: ${pascalCaseName}Filter
      orderBy: [${pascalCaseName}OrderBy!]
      limit: Int
      offset: Int
    ): [${pascalCaseName}!]!
    ${camelCaseName}Connection(
      where: ${pascalCaseName}Filter
      orderBy: [${pascalCaseName}OrderBy!]
      first: Int
      after: String
      last: Int
      before: String
    ): ${pascalCaseName}Connection!
    
    # Count ${objectName}
    ${camelCaseName}Count(where: ${pascalCaseName}Filter): Int!
    
    # Aggregate ${objectName}
    ${camelCaseName}Aggregate(
      where: ${pascalCaseName}Filter
      groupBy: [String!]
      functions: [AggregateFunction!]!
    ): GroupByResult
`;
        }

        typeDefs += `  }\n\n`;

        // Add Mutation type
        typeDefs += `  type Mutation {\n`;
        
        if (objectTypes.length > 0) {
            for (const objectName of objectTypes) {
                const pascalCaseName = this.toPascalCase(objectName);
                typeDefs += `    
    # Create ${objectName}
    create${pascalCaseName}(input: ${pascalCaseName}Input!): ${pascalCaseName}
    
    # Update ${objectName}
    update${pascalCaseName}(id: ID!, input: ${pascalCaseName}UpdateInput!): ${pascalCaseName}
    
    # Delete ${objectName}
    delete${pascalCaseName}(id: ID!): Boolean
`;
            }
        } else {
            typeDefs += `    _dummy: String\n`;
        }

        typeDefs += `  }\n\n`;

        // Add Subscription type (if enabled)
        if (this.config.enableSubscriptions) {
            typeDefs += `  type Subscription {\n`;
            
            if (objectTypes.length > 0) {
                for (const objectName of objectTypes) {
                    const pascalCaseName = this.toPascalCase(objectName);
                    const camelCaseName = this.toCamelCase(objectName);
                    typeDefs += `    
    # Subscribe to ${objectName} changes
    ${camelCaseName}Created(where: ${pascalCaseName}Filter): ${pascalCaseName}
    ${camelCaseName}Updated(where: ${pascalCaseName}Filter): ${pascalCaseName}
    ${camelCaseName}Deleted: ID
`;
                }
            } else {
                typeDefs += `    _dummy: String\n`;
            }
            
            typeDefs += `  }\n\n`;
        }

        // Generate type definitions, Input types, Filter types, and Connection types for each object
        for (const objectName of objectTypes) {
            const metadata = this.getMetaItem('object', objectName) as any;
            const pascalCaseName = this.toPascalCase(objectName);
            
            // Main Type
            typeDefs += `  type ${pascalCaseName}`;
            
            // Add Federation @key directive if enabled
            if (this.config.enableFederation) {
                typeDefs += ` @key(fields: "id")`;
            }
            
            typeDefs += ` {\n`;
            typeDefs += `    id: ID!\n`;
            
            if (metadata?.fields) {
                for (const [fieldName, field] of Object.entries(metadata.fields as Record<string, any>)) {
                    // Skip id field as it's already added above
                    if (fieldName === 'id') continue;
                    
                    const graphqlType = this.mapFieldTypeToGraphQL(field.type);
                    const required = field.required ? '!' : '';
                    typeDefs += `    ${fieldName}: ${graphqlType}${required}\n`;
                    
                    // Add relationship fields for lookup/master_detail
                    if (field.type === 'lookup' || field.type === 'master_detail') {
                        const refObject = field.reference_to;
                        if (refObject) {
                            const refPascalCase = this.toPascalCase(refObject);
                            typeDefs += `    ${fieldName}_ref: ${refPascalCase}\n`;
                        }
                    }
                }
            }
            
            typeDefs += `  }\n\n`;
            
            // Input Type (for create)
            typeDefs += `  input ${pascalCaseName}Input {\n`;
            
            let hasInputFields = false;
            if (metadata?.fields) {
                for (const [fieldName, field] of Object.entries(metadata.fields as Record<string, any>)) {
                    // Skip auto-generated fields like id, created_at, updated_at
                    if (fieldName === 'id' || fieldName === 'created_at' || fieldName === 'updated_at') continue;
                    
                    hasInputFields = true;
                    const graphqlType = this.mapFieldTypeToGraphQL(field.type);
                    const required = field.required ? '!' : '';
                    typeDefs += `    ${fieldName}: ${graphqlType}${required}\n`;
                }
            }

            if (!hasInputFields) {
                typeDefs += `    _dummy: String\n`;
            }
            
            typeDefs += `  }\n\n`;
            
            // Update Input Type (all fields optional)
            typeDefs += `  input ${pascalCaseName}UpdateInput {\n`;
            
            let hasUpdateFields = false;
            if (metadata?.fields) {
                for (const [fieldName, field] of Object.entries(metadata.fields as Record<string, any>)) {
                    // Skip auto-generated fields
                    if (fieldName === 'id' || fieldName === 'created_at' || fieldName === 'updated_at') continue;
                    
                    hasUpdateFields = true;
                    const graphqlType = this.mapFieldTypeToGraphQL(field.type);
                    typeDefs += `    ${fieldName}: ${graphqlType}\n`;
                }
            }

            if (!hasUpdateFields) {
                typeDefs += `    _dummy: String\n`;
            }
            
            typeDefs += `  }\n\n`;
            
            // Filter Type
            typeDefs += `  input ${pascalCaseName}Filter {\n`;
            typeDefs += `    id: StringFilter\n`;
            typeDefs += `    AND: [${pascalCaseName}Filter!]\n`;
            typeDefs += `    OR: [${pascalCaseName}Filter!]\n`;
            typeDefs += `    NOT: ${pascalCaseName}Filter\n`;
            
            if (metadata?.fields) {
                for (const [fieldName, field] of Object.entries(metadata.fields as Record<string, any>)) {
                    // Skip id field as it's already added above
                    if (fieldName === 'id') continue;
                    
                    const fieldType = field.type;
                    if (fieldType === 'text' || fieldType === 'textarea' || fieldType === 'email' || fieldType === 'url') {
                        typeDefs += `    ${fieldName}: StringFilter\n`;
                    } else if (fieldType === 'number' || fieldType === 'currency' || fieldType === 'autonumber') {
                        typeDefs += `    ${fieldName}: IntFilter\n`;
                    } else if (fieldType === 'boolean') {
                        typeDefs += `    ${fieldName}: BooleanFilter\n`;
                    }
                }
            }
            
            typeDefs += `  }\n\n`;
            
            // OrderBy Type
            typeDefs += `  input ${pascalCaseName}OrderBy {\n`;
            typeDefs += `    field: String!\n`;
            typeDefs += `    direction: OrderDirection!\n`;
            typeDefs += `  }\n\n`;
            
            // Connection Types (Relay-style)
            typeDefs += `  type ${pascalCaseName}Edge {\n`;
            typeDefs += `    node: ${pascalCaseName}!\n`;
            typeDefs += `    cursor: String!\n`;
            typeDefs += `  }\n\n`;
            
            typeDefs += `  type ${pascalCaseName}Connection {\n`;
            typeDefs += `    edges: [${pascalCaseName}Edge!]!\n`;
            typeDefs += `    pageInfo: PageInfo!\n`;
            typeDefs += `    totalCount: Int!\n`;
            typeDefs += `  }\n\n`;
        }

        // Add enum for order direction
        typeDefs += `  enum OrderDirection {\n`;
        typeDefs += `    ASC\n`;
        typeDefs += `    DESC\n`;
        typeDefs += `  }\n\n`;

        // Add custom type defs if provided
        if (this.config.typeDefs) {
            typeDefs += this.config.typeDefs;
        }

        return typeDefs;
    }

    /**
     * Generate GraphQL resolvers with support for filtering, pagination, subscriptions, and DataLoader
     */
    private generateResolvers(): any {
        const objectTypes = this.getMetaTypes();
        
        // Helper function for parsing GraphQL literals to JSON
        const parseLiteral = (ast: any): any => {
            if (ast.kind === 'StringValue') {
                return JSON.parse(ast.value);
            }
            if (ast.kind === 'IntValue' || ast.kind === 'FloatValue') {
                return parseFloat(ast.value);
            }
            if (ast.kind === 'BooleanValue') {
                return ast.value;
            }
            if (ast.kind === 'NullValue') {
                return null;
            }
            if (ast.kind === 'ObjectValue') {
                const obj: any = {};
                ast.fields.forEach((field: any) => {
                    obj[field.name.value] = parseLiteral(field.value);
                });
                return obj;
            }
            if (ast.kind === 'ListValue') {
                return ast.values.map((value: any) => parseLiteral(value));
            }
            return null;
        };
        
        const resolvers: any = {
            // JSON scalar resolver - passes through any value
            JSON: {
                __parseValue(value: any) {
                    return value; // value from the client input variables
                },
                __serialize(value: any) {
                    return value; // value sent to the client
                },
                __parseLiteral(ast: any) {
                    return parseLiteral(ast);
                }
            },
            Query: {
                hello: () => 'Hello from GraphQL Protocol Plugin with Subscriptions!',
                
                getObjectMetadata: async (_: any, args: { name: string }) => {
                    const meta = this.getMetaItem('object', args.name);
                    return JSON.stringify(meta, null, 2);
                },
                
                listObjects: () => {
                    return this.getMetaTypes();
                }
            },
            Mutation: {},
            Subscription: {}
        };

        // Generate resolvers for each object type
        for (const objectName of objectTypes) {
            const camelCaseName = this.toCamelCase(objectName);
            const pascalCaseName = this.toPascalCase(objectName);

            // Query resolvers
            resolvers.Query[camelCaseName] = async (_: any, args: { id: string }, context: any) => {
                // Use DataLoader if available
                if (context?.dataLoaders?.has(objectName)) {
                    return await context.dataLoaders.get(objectName).load(args.id);
                }
                return await this.getData(objectName, args.id);
            };

            resolvers.Query[`${camelCaseName}List`] = async (_: any, args: {
                where?: any;
                orderBy?: Array<{ field: string; direction: string }>;
                limit?: number;
                offset?: number;
            }) => {
                const query: any = {};
                
                if (args.where) {
                    query.where = this.convertFilterToQuery(args.where);
                }
                
                if (args.orderBy && args.orderBy.length > 0) {
                    query.orderBy = args.orderBy.map(o => ({
                        field: o.field,
                        order: o.direction.toLowerCase()
                    }));
                }
                
                if (args.limit) query.limit = args.limit;
                if (args.offset) query.offset = args.offset;
                
                const result = await this.findData(objectName, query);
                return result;
            };

            // Connection resolver (Relay-style pagination)
            resolvers.Query[`${camelCaseName}Connection`] = async (_: any, args: {
                where?: any;
                orderBy?: Array<{ field: string; direction: string }>;
                first?: number;
                after?: string;
                last?: number;
                before?: string;
            }) => {
                const query: any = {};
                
                if (args.where) {
                    query.where = this.convertFilterToQuery(args.where);
                }
                
                if (args.orderBy && args.orderBy.length > 0) {
                    query.orderBy = args.orderBy.map(o => ({
                        field: o.field,
                        order: o.direction.toLowerCase()
                    }));
                }
                
                // Handle cursor-based pagination
                let limit = args.first || args.last || 20;
                let offset = 0;
                
                if (args.after) {
                    // Decode cursor to get offset
                    try {
                        offset = parseInt(Buffer.from(args.after, 'base64').toString('utf-8')) + 1;
                    } catch (e) {
                        offset = 0;
                    }
                }
                
                if (args.before) {
                    // For "before" cursor, we need to calculate offset differently
                    try {
                        const beforeOffset = parseInt(Buffer.from(args.before, 'base64').toString('utf-8'));
                        offset = Math.max(0, beforeOffset - limit);
                    } catch (e) {
                        offset = 0;
                    }
                }
                
                query.limit = limit + 1; // Fetch one extra to check hasNextPage
                query.offset = offset;
                
                const results = await this.findData(objectName, query);
                const totalCount = results.length; // Ideally this should be a separate count query
                
                const hasMore = results.length > limit;
                const items = hasMore ? results.slice(0, limit) : results;
                
                const edges = items.map((item, index) => ({
                    node: item,
                    cursor: Buffer.from((offset + index).toString()).toString('base64')
                }));
                
                return {
                    edges,
                    pageInfo: {
                        hasNextPage: args.first ? hasMore : false,
                        hasPreviousPage: offset > 0,
                        startCursor: edges.length > 0 ? edges[0].cursor : null,
                        endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null
                    },
                    totalCount: items.length // This should ideally be the total count from database
                };
            };

            // Count resolver
            resolvers.Query[`${camelCaseName}Count`] = async (_: any, args: { where?: any }) => {
                const query: any = {};
                
                if (args.where) {
                    query.where = this.convertFilterToQuery(args.where);
                }
                
                return await this.countData(objectName, query);
            };

            // Aggregate resolver
            resolvers.Query[`${camelCaseName}Aggregate`] = async (_: any, args: {
                where?: any;
                groupBy?: string[];
                functions: Array<{ field: string; function: string }>;
            }) => {
                const query: any = {};
                
                if (args.where) {
                    query.where = this.convertFilterToQuery(args.where);
                }
                
                return await this.aggregateData(objectName, query, args.groupBy, args.functions);
            };

            // Mutation resolvers with type-safe inputs
            resolvers.Mutation[`create${pascalCaseName}`] = async (_: any, args: { input: any }, context: any) => {
                const result = await this.createData(objectName, args.input);
                
                // Publish subscription event
                if (this.config.enableSubscriptions && context?.pubsub) {
                    context.pubsub.publish(`${pascalCaseName}_CREATED`, {
                        [`${camelCaseName}Created`]: result
                    });
                }
                
                return result;
            };

            resolvers.Mutation[`update${pascalCaseName}`] = async (_: any, args: { id: string; input: any }, context: any) => {
                const result = await this.updateData(objectName, args.id, args.input);
                
                // Publish subscription event
                if (this.config.enableSubscriptions && context?.pubsub) {
                    context.pubsub.publish(`${pascalCaseName}_UPDATED`, {
                        [`${camelCaseName}Updated`]: result
                    });
                }
                
                return result;
            };

            resolvers.Mutation[`delete${pascalCaseName}`] = async (_: any, args: { id: string }, context: any) => {
                const result = await this.deleteData(objectName, args.id);
                
                // Publish subscription event
                if (this.config.enableSubscriptions && context?.pubsub) {
                    context.pubsub.publish(`${pascalCaseName}_DELETED`, {
                        [`${camelCaseName}Deleted`]: args.id
                    });
                }
                
                return result;
            };

            // Subscription resolvers
            if (this.config.enableSubscriptions) {
                resolvers.Subscription[`${camelCaseName}Created`] = {
                    subscribe: (_: any, args: { where?: any }, context: any) => {
                        if (!context?.pubsub) {
                            throw new Error('PubSub not available');
                        }
                        return context.pubsub.asyncIterator([`${pascalCaseName}_CREATED`]);
                    },
                    resolve: (payload: any, args: { where?: any }) => {
                        // Apply filter if provided
                        const item = payload[`${camelCaseName}Created`];
                        if (args.where && !this.matchesFilter(item, args.where)) {
                            return null; // Filter out items that don't match
                        }
                        return item;
                    }
                };

                resolvers.Subscription[`${camelCaseName}Updated`] = {
                    subscribe: (_: any, args: { where?: any }, context: any) => {
                        if (!context?.pubsub) {
                            throw new Error('PubSub not available');
                        }
                        return context.pubsub.asyncIterator([`${pascalCaseName}_UPDATED`]);
                    },
                    resolve: (payload: any, args: { where?: any }) => {
                        const item = payload[`${camelCaseName}Updated`];
                        if (args.where && !this.matchesFilter(item, args.where)) {
                            return null;
                        }
                        return item;
                    }
                };

                resolvers.Subscription[`${camelCaseName}Deleted`] = {
                    subscribe: (_: any, __: any, context: any) => {
                        if (!context?.pubsub) {
                            throw new Error('PubSub not available');
                        }
                        return context.pubsub.asyncIterator([`${pascalCaseName}_DELETED`]);
                    }
                };
            }

            // Add field resolvers for relationships (lookup/master_detail)
            const metadata = this.getMetaItem('object', objectName) as any;
            if (metadata?.fields) {
                if (!resolvers[pascalCaseName]) {
                    resolvers[pascalCaseName] = {};
                }
                
                for (const [fieldName, field] of Object.entries(metadata.fields as Record<string, any>)) {
                    if (field.type === 'lookup' || field.type === 'master_detail') {
                        const refObject = field.reference_to;
                        if (refObject) {
                            // Add resolver for relationship field
                            resolvers[pascalCaseName][`${fieldName}_ref`] = async (parent: any, _: any, context: any) => {
                                const refId = parent[fieldName];
                                if (!refId) return null;
                                
                                // Use DataLoader if available
                                if (context?.dataLoaders?.has(refObject)) {
                                    return await context.dataLoaders.get(refObject).load(refId);
                                }
                                
                                return await this.getData(refObject, refId);
                            };
                        }
                    }
                }
            }
        }

        return resolvers;
    }

    /**
     * Convert GraphQL filter to ObjectQL query format
     */
    private convertFilterToQuery(filter: any): any {
        if (!filter) return undefined;

        const query: any = {};

        // Handle logical operators
        if (filter.AND) {
            query.$and = filter.AND.map((f: any) => this.convertFilterToQuery(f));
            return query;
        }
        
        if (filter.OR) {
            query.$or = filter.OR.map((f: any) => this.convertFilterToQuery(f));
            return query;
        }
        
        if (filter.NOT) {
            query.$not = this.convertFilterToQuery(filter.NOT);
            return query;
        }

        // Handle field filters
        for (const [field, fieldFilter] of Object.entries(filter)) {
            if (field === 'AND' || field === 'OR' || field === 'NOT') continue;
            
            if (typeof fieldFilter === 'object' && fieldFilter !== null) {
                const filterObj: any = {};
                
                for (const [op, value] of Object.entries(fieldFilter)) {
                    switch (op) {
                        case 'eq':
                            filterObj.$eq = value;
                            break;
                        case 'ne':
                            filterObj.$ne = value;
                            break;
                        case 'gt':
                            filterObj.$gt = value;
                            break;
                        case 'gte':
                            filterObj.$gte = value;
                            break;
                        case 'lt':
                            filterObj.$lt = value;
                            break;
                        case 'lte':
                            filterObj.$lte = value;
                            break;
                        case 'in':
                            filterObj.$in = value;
                            break;
                        case 'notIn':
                            filterObj.$nin = value;
                            break;
                        case 'contains':
                            filterObj.$contains = value;
                            break;
                        case 'startsWith':
                            filterObj.$startsWith = value;
                            break;
                        case 'endsWith':
                            filterObj.$endsWith = value;
                            break;
                    }
                }
                
                query[field] = filterObj;
            }
        }

        return query;
    }

    /**
     * Check if an item matches a filter (for subscription filtering)
     */
    private matchesFilter(item: any, filter: any): boolean {
        if (!filter || !item) return true;

        // Handle logical operators
        if (filter.AND) {
            return filter.AND.every((f: any) => this.matchesFilter(item, f));
        }
        
        if (filter.OR) {
            return filter.OR.some((f: any) => this.matchesFilter(item, f));
        }
        
        if (filter.NOT) {
            return !this.matchesFilter(item, filter.NOT);
        }

        // Handle field filters
        for (const [field, fieldFilter] of Object.entries(filter)) {
            if (field === 'AND' || field === 'OR' || field === 'NOT') continue;
            
            const value = item[field];
            
            if (typeof fieldFilter === 'object' && fieldFilter !== null) {
                for (const [op, filterValue] of Object.entries(fieldFilter)) {
                    switch (op) {
                        case 'eq':
                            if (value !== filterValue) return false;
                            break;
                        case 'ne':
                            if (value === filterValue) return false;
                            break;
                        case 'gt':
                            if (!(value > filterValue)) return false;
                            break;
                        case 'gte':
                            if (!(value >= filterValue)) return false;
                            break;
                        case 'lt':
                            if (!(value < filterValue)) return false;
                            break;
                        case 'lte':
                            if (!(value <= filterValue)) return false;
                            break;
                        case 'in':
                            if (!Array.isArray(filterValue) || !filterValue.includes(value)) return false;
                            break;
                        case 'notIn':
                            if (!Array.isArray(filterValue) || filterValue.includes(value)) return false;
                            break;
                        case 'contains':
                            if (typeof value !== 'string' || !value.includes(filterValue as string)) return false;
                            break;
                        case 'startsWith':
                            if (typeof value !== 'string' || !value.startsWith(filterValue as string)) return false;
                            break;
                        case 'endsWith':
                            if (typeof value !== 'string' || !value.endsWith(filterValue as string)) return false;
                            break;
                    }
                }
            }
        }

        return true;
    }

    /**
     * Map ObjectQL field type to GraphQL type
     */
    private mapFieldTypeToGraphQL(fieldType: string): string {
        const typeMap: Record<string, string> = {
            'text': 'String',
            'textarea': 'String',
            'markdown': 'String',
            'html': 'String',
            'email': 'String',
            'url': 'String',
            'phone': 'String',
            'password': 'String',
            'number': 'Float',
            'currency': 'Float',
            'percent': 'Float',
            'autonumber': 'Int',
            'boolean': 'Boolean',
            'date': 'String',
            'datetime': 'String',
            'time': 'String',
            'select': 'String',
            'lookup': 'String',
            'master_detail': 'String',
            'file': 'String',
            'image': 'String',
            'object': 'String',
            'formula': 'String',
            'summary': 'String'
        };
        
        const graphqlType = typeMap[fieldType];
        if (!graphqlType) {
            console.warn(`[GraphQLPlugin] Unknown field type '${fieldType}', defaulting to String`);
            return 'String';
        }
        
        return graphqlType;
    }

    /**
     * Convert string to camelCase
     */
    private toCamelCase(str: string): string {
        return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    }

    /**
     * Convert string to PascalCase
     */
    private toPascalCase(str: string): string {
        const camel = this.toCamelCase(str);
        return camel.charAt(0).toUpperCase() + camel.slice(1);
    }
}
