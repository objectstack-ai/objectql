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
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

/**
 * Configuration for the GraphQL Plugin
 */
export interface GraphQLPluginConfig {
    /** Port to listen on */
    port?: number;
    /** Enable introspection (also enables Apollo Sandbox in development) */
    introspection?: boolean;
    /** Custom type definitions (optional) */
    typeDefs?: string;
}

/**
 * GraphQL Protocol Plugin
 * 
 * Implements the RuntimePlugin interface to provide GraphQL protocol support.
 * 
 * Key Features:
 * - Automatic schema generation from ObjectStack metadata
 * - Query and mutation resolvers
 * - Apollo Server v4+ integration
 * - GraphQL introspection and Apollo Sandbox
 * - No direct database access - all operations through ObjectStackProtocolImplementation
 * 
 * @example
 * ```typescript
 * import { ObjectKernel } from '@objectstack/runtime';
 * import { GraphQLPlugin } from '@objectql/protocol-graphql';
 * 
 * const kernel = new ObjectKernel([
 *   new GraphQLPlugin({ port: 4000, introspection: true })
 * ]);
 * await kernel.start();
 * 
 * // Access Apollo Sandbox: http://localhost:4000/
 * ```
 */
export class GraphQLPlugin implements RuntimePlugin {
    name = '@objectql/protocol-graphql';
    version = '0.1.0';
    
    private server?: ApolloServer;
    private engine?: any;
    private config: Required<GraphQLPluginConfig>;
    private serverCleanup?: { url: string };

    constructor(config: GraphQLPluginConfig = {}) {
        this.config = {
            port: config.port || 4000,
            introspection: config.introspection !== false,
            typeDefs: config.typeDefs || ''
        };
    }

    /**
     * Install hook - called during kernel initialization
     */
    async install(ctx: RuntimeContext): Promise<void> {
        console.log(`[${this.name}] Installing GraphQL protocol plugin...`);
        
        // Store reference to the engine for later use
        this.engine = ctx.engine || (ctx as any).getKernel?.();
        
        console.log(`[${this.name}] Protocol bridge initialized`);
    }

    /**
     * Start hook - called when kernel starts
     * This is where we start the GraphQL server
     */
    async onStart(ctx: RuntimeContext): Promise<void> {
        if (!this.engine) {
            throw new Error('Protocol not initialized. Install hook must be called first.');
        }

        console.log(`[${this.name}] Starting GraphQL server...`);

        // Generate schema from metadata
        const typeDefs = this.generateSchema();
        const resolvers = this.generateResolvers();

        // Create Apollo Server with Apollo Server 4+ configuration
        this.server = new ApolloServer({
            typeDefs,
            resolvers,
            introspection: this.config.introspection,
            // Apollo Server 4+ uses Apollo Sandbox by default when introspection is enabled
            // The playground config option is deprecated - Sandbox is now the default
            includeStacktraceInErrorResponses: process.env.NODE_ENV !== 'production',
            // Format errors with GraphQL spec-compliant structure
            formatError: (formattedError, error) => {
                // Return standard GraphQL error format with extensions
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

        // Start standalone server
        this.serverCleanup = await startStandaloneServer(this.server, {
            listen: { port: this.config.port }
        });

        console.log(`[${this.name}] 🚀 GraphQL server ready at: ${this.serverCleanup.url}`);
        if (this.config.introspection) {
            console.log(`[${this.name}] 📊 Apollo Sandbox available at: ${this.serverCleanup.url}`);
        }
    }

    /**
     * Stop hook - called when kernel stops
     */
    async onStop(ctx: RuntimeContext): Promise<void> {
        if (this.server) {
            console.log(`[${this.name}] Stopping GraphQL server...`);
            await this.server.stop();
            this.server = undefined;
            this.serverCleanup = undefined;
        }
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
                return objects.map((obj: any) => obj.name || obj.id).filter(Boolean);
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
            return this.engine.metadata.get(type, name);
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
     * Generate GraphQL schema from ObjectStack metadata
     */
    private generateSchema(): string {
        const objectTypes = this.getMetaTypes();
        
        let typeDefs = `#graphql
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
            typeDefs += `    
    # Query ${objectName}
    ${camelCaseName}(id: String!): ${this.toPascalCase(objectName)}
    ${camelCaseName}List(limit: Int, offset: Int): [${this.toPascalCase(objectName)}!]!
`;
        }

        typeDefs += `  }\n\n`;

        // Add Mutation type
        typeDefs += `  type Mutation {\n`;
        
        for (const objectName of objectTypes) {
            const camelCaseName = this.toCamelCase(objectName);
            const pascalCaseName = this.toPascalCase(objectName);
            typeDefs += `    
    # Create ${objectName}
    create${pascalCaseName}(input: String!): ${pascalCaseName}
    
    # Update ${objectName}
    update${pascalCaseName}(id: String!, input: String!): ${pascalCaseName}
    
    # Delete ${objectName}
    delete${pascalCaseName}(id: String!): Boolean
`;
        }

        typeDefs += `  }\n\n`;

        // Generate type definitions for each object
        for (const objectName of objectTypes) {
            const metadata = this.getMetaItem('object', objectName) as any;
            const pascalCaseName = this.toPascalCase(objectName);
            
            typeDefs += `  type ${pascalCaseName} {\n`;
            typeDefs += `    id: String!\n`;
            
            if (metadata?.fields) {
                for (const [fieldName, field] of Object.entries(metadata.fields as Record<string, any>)) {
                    const graphqlType = this.mapFieldTypeToGraphQL(field.type);
                    const required = field.required ? '!' : '';
                    typeDefs += `    ${fieldName}: ${graphqlType}${required}\n`;
                }
            }
            
            typeDefs += `  }\n\n`;
        }

        // Add custom type defs if provided
        if (this.config.typeDefs) {
            typeDefs += this.config.typeDefs;
        }

        return typeDefs;
    }

    /**
     * Generate GraphQL resolvers
     */
    private generateResolvers(): any {
        const objectTypes = this.getMetaTypes();
        
        const resolvers: any = {
            Query: {
                hello: () => 'Hello from GraphQL Protocol Plugin!',
                
                getObjectMetadata: async (_: any, args: { name: string }) => {
                    const meta = this.getMetaItem('object', args.name);
                    return JSON.stringify(meta, null, 2);
                },
                
                listObjects: () => {
                    return this.getMetaTypes();
                }
            },
            Mutation: {}
        };

        // Generate resolvers for each object type
        for (const objectName of objectTypes) {
            const camelCaseName = this.toCamelCase(objectName);
            const pascalCaseName = this.toPascalCase(objectName);

            // Query resolvers
            resolvers.Query[camelCaseName] = async (_: any, args: { id: string }) => {
                return await this.getData(objectName, args.id);
            };

            resolvers.Query[`${camelCaseName}List`] = async (_: any, args: { limit?: number; offset?: number }) => {
                const query: any = {};
                if (args.limit) query.limit = args.limit;
                if (args.offset) query.offset = args.offset;
                
                const result = await this.findData(objectName, query);
                return result;
            };

            // Mutation resolvers
            resolvers.Mutation[`create${pascalCaseName}`] = async (_: any, args: { input: string }) => {
                const data = JSON.parse(args.input);
                return await this.createData(objectName, data);
            };

            resolvers.Mutation[`update${pascalCaseName}`] = async (_: any, args: { id: string; input: string }) => {
                const data = JSON.parse(args.input);
                return await this.updateData(objectName, args.id, data);
            };

            resolvers.Mutation[`delete${pascalCaseName}`] = async (_: any, args: { id: string }) => {
                return await this.deleteData(objectName, args.id);
            };
        }

        return resolvers;
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
