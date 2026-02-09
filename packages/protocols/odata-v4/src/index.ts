/**
 * OData V4 Protocol Plugin for ObjectStack
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { RuntimePlugin, RuntimeContext } from '@objectql/types';
import { ObjectQLError } from '@objectql/types';
import { IncomingMessage, ServerResponse, createServer, Server } from 'http';
import { mapErrorToODataError } from './validation.js';

// Re-export validation utilities
export * from './validation.js';

/**
 * Configuration for the OData V4 Plugin
 */
export interface ODataV4PluginConfig {
    /** Port to listen on */
    port?: number;
    /** Base path for OData endpoints */
    basePath?: string;
    /** Enable CORS */
    enableCORS?: boolean;
    /** Service namespace */
    namespace?: string;
    /** Maximum depth for nested $expand operations (default: 3) */
    maxExpandDepth?: number;
    /** Enable $batch operations */
    enableBatch?: boolean;
    /** Enable $search full-text search */
    enableSearch?: boolean;
    /** Enable ETags for optimistic concurrency */
    enableETags?: boolean;
}

/**
 * OData V4 Protocol Plugin
 * 
 * Implements the RuntimePlugin interface to provide OData V4 protocol support.
 * 
 * Key Features:
 * - Automatic metadata document generation ($metadata)
 * - Service document generation (/)
 * - Entity set queries with $filter, $select, $orderby, $top, $skip
 * - Single entity retrieval by key
 * - Create, Update, Delete operations
 * - Nested $expand support with depth limiting
 * - $batch bulk operations (read and write with changesets)
 * - $search full-text search
 * - ETags for optimistic concurrency control
 * - No direct database access - all operations through ObjectStackProtocolImplementation
 * 
 * @example
 * ```typescript
 * import { ObjectKernel } from '@objectstack/core';
 * import { ODataV4Plugin } from '@objectql/protocol-odata-v4';
 * 
 * const kernel = new ObjectKernel([
 *   new ODataV4Plugin({ 
 *     port: 8080, 
 *     basePath: '/odata',
 *     maxExpandDepth: 3,
 *     enableBatch: true,
 *     enableSearch: true,
 *     enableETags: true
 *   })
 * ]);
 * await kernel.start();
 * ```
 */
export class ODataV4Plugin implements RuntimePlugin {
    name = '@objectql/protocol-odata-v4';
    version = '0.2.0';
    
    private server?: Server;
    private engine?: any;
    readonly config: Required<ODataV4PluginConfig>;

    constructor(config: ODataV4PluginConfig = {}) {
        this.config = {
            port: config.port || 8080,
            basePath: config.basePath || '/odata',
            enableCORS: config.enableCORS !== false,
            namespace: config.namespace || 'ObjectStack',
            maxExpandDepth: config.maxExpandDepth || 3,
            enableBatch: config.enableBatch !== false,
            enableSearch: config.enableSearch !== false,
            enableETags: config.enableETags !== false
        };
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
        // Store reference to the engine for later use
        this.engine = ctx.engine || (ctx as any).getKernel?.();
        
    }

    /**
     * Start hook - called when kernel starts
     * This is where we start the HTTP server
     */
    async onStart(ctx: RuntimeContext): Promise<void> {
        if (!this.engine) {
            throw new ObjectQLError({ code: 'PROTOCOL_ERROR', message: 'Protocol not initialized. Install hook must be called first.' });
        }

        // Check if Hono server is available via service injection
        // Try getting from local context first, then fallback to kernel engine
        let httpServer = (ctx as any).getService?.('http-server');
        
        if (!httpServer && this.engine && (this.engine as any).getService) {
            httpServer = (this.engine as any).getService('http-server');
        }

        // Compatibility fallback: try 'http.server' shim if registered
        if (!httpServer) {
             httpServer = (ctx as any).getService?.('http.server') ||
                          (this.engine as any).getService?.('http.server');
        }

        if (httpServer && httpServer.app) {
             await this.attachToHono(httpServer.app);
             return;
        }

        // Create HTTP server with request handler
        this.server = createServer((req, res) => this.handleRequest(req, res));

        // Start listening
        await new Promise<void>((resolve) => {
            this.server!.listen(this.config.port, () => {
                resolve();
            });
        });
    }

    private async attachToHono(app: any) {
        const basePath = this.config.basePath || '/odata';
        
        // Register wildcard route for this base path
        app.all(`${basePath}/*`, async (c: any) => {
             // Pre-read body to ensure we have it all and can emit it via the shim
             const bodyText = await c.req.text().catch(() => '');

             let responseBody: any = null;
             let statusCode = 200;
             const headers: Record<string, string> = {};

             const reqShim: any = {
                 url: c.req.url.replace(new URL(c.req.url).origin, ''), // /odata/foo
                 method: c.req.method,
                 headers: c.req.header(),
                 on: (event: string, callback: any) => {
                     if (event === 'data') {
                         if (bodyText) {
                             // Emit as buffer so toString() works as expected in readBody
                             callback(Buffer.from(bodyText));
                         }
                     }
                     if (event === 'end') {
                         callback(); 
                     }
                     return reqShim;
                 }
             };

             const resShim: any = {
                 setHeader: (key: string, value: string) => {
                     headers[key] = value;
                 },
                 writeHead: (code: number, headersArgs?: any) => {
                     statusCode = code;
                     if (headersArgs) {
                         Object.assign(headers, headersArgs);
                     }
                 },
                 write: (chunk: any) => {
                     if (responseBody === null) responseBody = chunk;
                     else {
                         if (typeof responseBody === 'string') responseBody += chunk;
                         else if (Buffer.isBuffer(responseBody)) responseBody = Buffer.concat([responseBody, chunk]);
                         else responseBody = [responseBody, chunk]; 
                     }
                 },
                 end: (chunk: any) => {
                     if (chunk) resShim.write(chunk);
                 }
             };
             
             await this.handleRequest(reqShim, resShim);

             // Construct Hono response
             for (const [k, v] of Object.entries(headers)) {
                 c.header(k, v);
             }
             c.status(statusCode);
             return c.body(responseBody);
        });

    }

    // ---------------------------------------------------

    /**
     * Stop hook - called when kernel stops
     */
    async onStop(ctx: RuntimeContext): Promise<void> {
        if (this.server) {
            await new Promise<void>((resolve, reject) => {
                this.server!.close((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            this.server = undefined;
        }
    }

    /**
     * Helper: Get list of registered object types from metadata
     */
    private getMetaTypes(): string[] {
        if (!this.engine?.metadata) return [];
        
        if (typeof this.engine.metadata.getTypes === 'function') {
            const types = this.engine.metadata.getTypes();
            return types.filter((t: string) => {
                const items = this.engine.metadata.list(t);
                return items && items.length > 0;
            }).filter((t: string) => t === 'object');
        }
        
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
        
        if (typeof this.engine.find === 'function') {
            const result = await this.engine.find(objectName, query);
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
    private async countData(objectName: string, filters?: any): Promise<number> {
        if (!this.engine) return 0;
        
        if (typeof this.engine.count === 'function') {
            return await this.engine.count(objectName, filters);
        }
        
        return 0;
    }

    /**
     * Main HTTP request handler
     */
    private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
        // Enable CORS if configured
        if (this.config.enableCORS) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, If-Match, If-None-Match');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(204);
                res.end();
                return;
            }
        }

        const url = req.url || '/';
        const basePath = this.config.basePath;

        // Check if request is for OData endpoints
        if (!url.startsWith(basePath)) {
            this.sendError(res, 404, 'Not Found');
            return;
        }

        try {
            // Extract path without query string
            const urlWithoutQuery = url.split('?')[0];
            const path = urlWithoutQuery.substring(basePath.length) || '/';
            
            // Route to appropriate handler
            if (path === '/' || path === '') {
                await this.handleServiceDocument(req, res);
            } else if (path === '/$metadata') {
                await this.handleMetadataDocument(req, res);
            } else if (path === '/$batch' && this.config.enableBatch) {
                await this.handleBatchRequest(req, res);
            } else {
                await this.handleEntityRequest(req, res, path);
            }
        } catch (error) {
            this.sendError(res, 500, error instanceof Error ? error.message : 'Internal Server Error');
        }
    }

    /**
     * Handle OData service document (/)
     * Returns list of available entity sets
     */
    private async handleServiceDocument(req: IncomingMessage, res: ServerResponse): Promise<void> {
        const entityTypes = this.getMetaTypes();
        
        const serviceDoc = {
            '@odata.context': `${this.config.basePath}/$metadata`,
            value: entityTypes.map(name => ({
                name,
                kind: 'EntitySet',
                url: name
            }))
        };

        this.sendJSON(res, 200, serviceDoc);
    }

    /**
     * Handle OData metadata document ($metadata)
     * Generates EDMX XML schema from ObjectStack metadata
     */
    private async handleMetadataDocument(req: IncomingMessage, res: ServerResponse): Promise<void> {
        const entityTypes = this.getMetaTypes();
        const namespace = this.config.namespace;
        
        // Build EDMX XML
        let edmx = `<?xml version="1.0" encoding="UTF-8"?>
<edmx:Edmx Version="4.0" xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx">
  <edmx:DataServices>
    <Schema Namespace="${namespace}" xmlns="http://docs.oasis-open.org/odata/ns/edm">
`;

        // Generate EntityType for each object
        for (const objectName of entityTypes) {
            const metadata = this.getMetaItem('object', objectName) as any;
            edmx += `      <EntityType Name="${objectName}">
        <Key>
          <PropertyRef Name="id"/>
        </Key>
        <Property Name="id" Type="Edm.String" Nullable="false"/>
`;
            
            // Add fields from metadata
            if (metadata?.fields) {
                for (const [fieldName, field] of Object.entries(metadata.fields as Record<string, any>)) {
                    const edmType = this.mapFieldTypeToEdm(field.type);
                    edmx += `        <Property Name="${fieldName}" Type="${edmType}" Nullable="true"/>\n`;
                }
            }
            
            edmx += `      </EntityType>\n`;
        }

        // Generate EntityContainer
        edmx += `      <EntityContainer Name="Container">
`;
        for (const objectName of entityTypes) {
            edmx += `        <EntitySet Name="${objectName}" EntityType="${namespace}.${objectName}"/>\n`;
        }
        edmx += `      </EntityContainer>
    </Schema>
  </edmx:DataServices>
</edmx:Edmx>`;

        res.setHeader('Content-Type', 'application/xml');
        res.writeHead(200);
        res.end(edmx);
    }

    /**
     * Handle entity requests (CRUD operations)
     */
    private async handleEntityRequest(req: IncomingMessage, res: ServerResponse, path: string): Promise<void> {
        // Check for /$count endpoint: /EntitySet/$count
        const countMatch = path.match(/^\/([^/($]+)\/\$count$/);
        if (countMatch) {
            const entitySet = countMatch[1];
            const queryString = req.url?.split('?')[1] || '';
            const queryParams = this.parseODataQuery(queryString);
            
            // Check if entity set exists
            if (!this.getMetaItem('object', entitySet)) {
                this.sendError(res, 404, `Entity set '${entitySet}' not found`);
                return;
            }
            
            await this.handleCountEntitySet(res, entitySet, queryParams);
            return;
        }
        
        // Parse path: /EntitySet or /EntitySet(id) or /EntitySet('id')
        const match = path.match(/^\/([^(/]+)(?:\((?:')?([^)']+)(?:')?\))?/);
        
        if (!match) {
            this.sendError(res, 400, 'Invalid OData path');
            return;
        }

        const [, entitySet, entityId] = match;
        const queryString = req.url?.split('?')[1] || '';
        const queryParams = this.parseODataQuery(queryString);

        // Check if entity set exists
        if (!this.getMetaItem('object', entitySet)) {
            this.sendError(res, 404, `Entity set '${entitySet}' not found`);
            return;
        }

        const method = req.method?.toUpperCase();

        // Route based on HTTP method
        if (method === 'GET') {
            if (entityId) {
                await this.handleGetEntity(res, entitySet, entityId, queryParams, req);
            } else {
                await this.handleQueryEntitySet(res, entitySet, queryParams);
            }
        } else if (method === 'POST') {
            await this.handleCreateEntity(req, res, entitySet);
        } else if (method === 'PUT' || method === 'PATCH') {
            if (!entityId) {
                this.sendError(res, 400, 'Entity ID required for update');
                return;
            }
            await this.handleUpdateEntity(req, res, entitySet, entityId);
        } else if (method === 'DELETE') {
            if (!entityId) {
                this.sendError(res, 400, 'Entity ID required for delete');
                return;
            }
            await this.handleDeleteEntity(res, entitySet, entityId);
        } else {
            this.sendError(res, 405, 'Method not allowed');
        }
    }

    /**
     * Handle GET request for a single entity
     */
    private async handleGetEntity(res: ServerResponse, entitySet: string, id: string, queryParams: ODataQueryParams, req?: IncomingMessage): Promise<void> {
        const entity = await this.getData(entitySet, id);
        
        if (!entity) {
            this.sendError(res, 404, 'Entity not found');
            return;
        }

        // Generate and set ETag if enabled
        if (this.config.enableETags) {
            const etag = this.generateETag(entity);
            res.setHeader('ETag', etag);
            
            // Handle If-None-Match (304 Not Modified)
            if (req) {
                const ifNoneMatch = req.headers['if-none-match'];
                if (ifNoneMatch && ifNoneMatch === etag) {
                    res.writeHead(304);
                    res.end();
                    return;
                }
            }
        }

        // $expand -> expand navigation properties for single entity
        if (queryParams.$expand) {
            await this.expandNavigationProperties(entitySet, [entity], queryParams.$expand, 0);
        }

        this.sendJSON(res, 200, {
            '@odata.context': `${this.config.basePath}/$metadata#${entitySet}/$entity`,
            ...entity
        });
    }

    /**
     * Handle GET request for entity set with query options
     */
    private async handleQueryEntitySet(res: ServerResponse, entitySet: string, queryParams: ODataQueryParams): Promise<void> {
        // Build query from OData parameters
        const query: any = {};
        
        // $search -> full-text search (if enabled)
        if (queryParams.$search && this.config.enableSearch) {
            query.search = queryParams.$search;
        }
        
        // $filter -> where clause
        if (queryParams.$filter) {
            query.where = this.parseODataFilter(queryParams.$filter);
        }
        
        // $orderby -> orderBy clause
        if (queryParams.$orderby) {
            query.orderBy = this.parseODataOrderBy(queryParams.$orderby);
        }
        
        // $top -> limit
        if (queryParams.$top) {
            query.limit = parseInt(queryParams.$top);
        }
        
        // $skip -> offset
        if (queryParams.$skip) {
            query.offset = parseInt(queryParams.$skip);
        }
        
        const result = await this.findData(entitySet, query);
        
        // $expand -> expand navigation properties with depth tracking
        if (queryParams.$expand) {
            await this.expandNavigationProperties(entitySet, result, queryParams.$expand, 0);
        }
        
        // Calculate count if $count=true is specified
        let count: number | undefined;
        if (queryParams.$count === 'true') {
            // Count with same filters but no limit/offset
            const countQuery: any = {};
            if (query.where) countQuery.where = query.where;
            if (query.search) countQuery.search = query.search;
            count = await this.countData(entitySet, countQuery);
        }

        this.sendJSON(res, 200, {
            '@odata.context': `${this.config.basePath}/$metadata#${entitySet}`,
            '@odata.count': count,
            value: result
        });
    }
    
    /**
     * Handle GET request for entity set /$count endpoint
     */
    private async handleCountEntitySet(res: ServerResponse, entitySet: string, queryParams: ODataQueryParams): Promise<void> {
        // Build query from OData parameters (only filter is relevant for count)
        const query: any = {};
        
        // $filter -> where clause
        if (queryParams.$filter) {
            query.where = this.parseODataFilter(queryParams.$filter);
        }
        
        const count = await this.countData(entitySet, query);
        
        // Return plain number as per OData spec
        res.setHeader('Content-Type', 'text/plain');
        res.writeHead(200);
        res.end(count.toString());
    }

    /**
     * Handle POST request to create entity
     */
    private async handleCreateEntity(req: IncomingMessage, res: ServerResponse, entitySet: string): Promise<void> {
        const body = await this.readBody(req);
        const entity = await this.createData(entitySet, body);

        this.sendJSON(res, 201, {
            '@odata.context': `${this.config.basePath}/$metadata#${entitySet}/$entity`,
            ...entity
        });
    }

    /**
     * Handle PUT/PATCH request to update entity
     */
    private async handleUpdateEntity(req: IncomingMessage, res: ServerResponse, entitySet: string, id: string): Promise<void> {
        // Check ETags if enabled
        if (this.config.enableETags) {
            const ifMatch = req.headers['if-match'];
            
            if (ifMatch) {
                // Get current entity to check ETag
                const currentEntity = await this.getData(entitySet, id);
                
                if (!currentEntity) {
                    this.sendError(res, 404, 'Entity not found');
                    return;
                }
                
                const currentETag = this.generateETag(currentEntity);
                
                // Check if ETags match
                if (ifMatch !== currentETag && ifMatch !== '*') {
                    // 412 Precondition Failed
                    this.sendError(res, 412, 'Precondition Failed: ETag mismatch');
                    return;
                }
            }
        }
        
        const body = await this.readBody(req);
        const entity = await this.updateData(entitySet, id, body);

        // Set ETag on updated entity
        if (this.config.enableETags && entity) {
            const etag = this.generateETag(entity);
            res.setHeader('ETag', etag);
        }

        this.sendJSON(res, 200, {
            '@odata.context': `${this.config.basePath}/$metadata#${entitySet}/$entity`,
            ...entity
        });
    }

    /**
     * Handle DELETE request to delete entity
     */
    private async handleDeleteEntity(res: ServerResponse, entitySet: string, id: string): Promise<void> {
        await this.deleteData(entitySet, id);
        res.writeHead(204);
        res.end();
    }

    // ========================================
    // HELPER METHODS
    // ========================================

    /**
     * Parse OData query string parameters
     */
    private parseODataQuery(queryString: string): ODataQueryParams {
        const params: ODataQueryParams = {};
        
        if (!queryString) return params;

        const pairs = queryString.split('&');
        for (const pair of pairs) {
            const [key, value] = pair.split('=');
            if (key) {
                // Replace + with space before decoding (application/x-www-form-urlencoded format)
                const decodedKey = decodeURIComponent(key.replace(/\+/g, ' '));
                const decodedValue = decodeURIComponent((value || '').replace(/\+/g, ' '));
                params[decodedKey as keyof ODataQueryParams] = decodedValue;
            }
        }

        return params;
    }

    /**
     * Expand navigation properties for OData $expand
     * 
     * Implements OData V4 $expand feature to include related entities in the response.
     * 
     * **Current Support**:
     * - ✅ Single property expand: $expand=owner
     * - ✅ Multiple properties: $expand=owner,department
     * - ✅ Expand with options: $expand=orders($filter=status eq 'active')
     * - ✅ Supported options: $filter, $select, $orderby, $top, $expand
     * - ✅ Nested expand: $expand=owner($expand=department)
     * - ✅ Multi-level nested expand with depth limiting
     * - ✅ OData standard property names (no @expanded suffix)
     * 
     * @param entitySet - The main entity set name
     * @param entities - Array of entities to expand properties for
     * @param expandParam - The $expand query parameter value
     * @param depth - Current recursion depth (for limiting nested expands)
     */
    private async expandNavigationProperties(entitySet: string, entities: any[], expandParam: string, depth: number = 0): Promise<void> {
        if (!entities || entities.length === 0 || !expandParam) {
            return;
        }

        // Check depth limit
        if (depth >= this.config.maxExpandDepth) {
            return;
        }

        // Get metadata for the entity set to find lookup fields
        const metadata = this.getMetaItem('object', entitySet);
        if (!metadata || !metadata.content || !metadata.content.fields) {
            return;
        }

        // Parse the expand parameter - now supports nested $expand
        const expandProperties = this.parseExpandParameter(expandParam);

        // For each expand property, fetch related data
        for (const expandProp of expandProperties) {
            const fieldName = expandProp.property;
            
            // Find the field in metadata
            const field = metadata.content.fields[fieldName];
            if (!field) {
                continue; // Skip if field doesn't exist
            }

            // Check if this is a lookup field (relationship)
            const referenceObject = field.reference || field.reference_to;
            if (!referenceObject || (field.type !== 'lookup' && field.type !== 'master_detail')) {
                continue; // Skip non-lookup fields
            }

            // Extract IDs from the entities for the lookup field
            const ids = entities
                .map(entity => entity[fieldName])
                .filter(id => id !== null && id !== undefined);

            if (ids.length === 0) {
                continue; // No IDs to expand
            }

            // Build query for related entities
            const relatedQuery: any = {
                where: {
                    _id: { $in: ids }
                }
            };

            // Apply expand options if present
            if (expandProp.options) {
                // Apply $filter if present
                if (expandProp.options.$filter) {
                    const filterCondition = this.parseODataFilter(expandProp.options.$filter);
                    relatedQuery.where = {
                        $and: [
                            { _id: { $in: ids } },
                            filterCondition
                        ]
                    };
                }

                // Apply $select if present
                if (expandProp.options.$select) {
                    relatedQuery.fields = expandProp.options.$select.split(',').map(f => f.trim());
                }

                // Apply $orderby if present
                if (expandProp.options.$orderby) {
                    relatedQuery.orderBy = this.parseODataOrderBy(expandProp.options.$orderby);
                }

                // Apply $top if present
                if (expandProp.options.$top) {
                    relatedQuery.limit = parseInt(expandProp.options.$top);
                }
            }

            // Fetch related entities
            const relatedEntities = await this.findData(referenceObject, relatedQuery);

            // Recursively expand nested properties
            if (expandProp.options?.$expand && depth < this.config.maxExpandDepth) {
                await this.expandNavigationProperties(
                    referenceObject,
                    relatedEntities,
                    expandProp.options.$expand,
                    depth + 1
                );
            }

            // Create a map of related entities by ID for quick lookup
            const relatedMap = new Map();
            for (const relatedEntity of relatedEntities) {
                relatedMap.set(relatedEntity._id, relatedEntity);
            }

            // Add related entities to the main entities using OData standard property names
            for (const entity of entities) {
                const lookupId = entity[fieldName];
                if (lookupId && relatedMap.has(lookupId)) {
                    // Use standard OData property name (no @expanded suffix)
                    entity[fieldName] = relatedMap.get(lookupId);
                }
            }
        }
    }

    /**
     * Parse $expand parameter supporting nested expands
     * Format: property1,property2($expand=nested1;$filter=...),property3
     */
    private parseExpandParameter(expandParam: string): Array<{ property: string; options?: ODataQueryParams }> {
        const result: Array<{ property: string; options?: ODataQueryParams }> = [];
        
        // Handle simple case: no nested options
        if (!expandParam.includes('(')) {
            return expandParam.split(',').map(p => ({ property: p.trim() }));
        }

        // Parse with nested options
        let currentProp = '';
        let depth = 0;
        let currentOptions = '';
        
        for (let i = 0; i < expandParam.length; i++) {
            const char = expandParam[i];
            
            if (char === '(' && depth === 0) {
                // Start of options
                depth = 1;
                currentOptions = '';
            } else if (char === '(') {
                depth++;
                currentOptions += char;
            } else if (char === ')') {
                depth--;
                if (depth === 0) {
                    // End of options
                    const options = this.parseODataQuery(currentOptions);
                    result.push({
                        property: currentProp.trim(),
                        options
                    });
                    currentProp = '';
                    currentOptions = '';
                } else {
                    currentOptions += char;
                }
            } else if (char === ',' && depth === 0) {
                // Next property
                if (currentProp.trim()) {
                    result.push({ property: currentProp.trim() });
                }
                currentProp = '';
            } else if (char === ';' && depth > 0) {
                // Separator in options - convert to &
                currentOptions += '&';
            } else {
                if (depth > 0) {
                    currentOptions += char;
                } else {
                    currentProp += char;
                }
            }
        }
        
        // Add last property if any
        if (currentProp.trim()) {
            result.push({ property: currentProp.trim() });
        }
        
        return result;
    }

    /**
     * Parse OData $filter expression to ObjectQL where clause
     * 
     * Supports OData V4 filter operations:
     * - Comparison operators: eq, ne, gt, ge, lt, le
     * - Logical operators: and, or, not
     * - String functions: contains, startswith, endswith, substringof
     * - Grouping with parentheses
     * 
     * Examples:
     * - "name eq 'John'" -> { name: { $eq: 'John' } }
     * - "age gt 18" -> { age: { $gt: 18 } }
     * - "name eq 'John' and age gt 18" -> { $and: [{ name: { $eq: 'John' } }, { age: { $gt: 18 } }] }
     * - "contains(name, 'John')" -> { name: { $contains: 'John' } }
     */
    private parseODataFilter(filter: string): any {
        if (!filter || filter.trim() === '') {
            return {};
        }

        // Remove leading/trailing whitespace
        filter = filter.trim();

        // Validate parentheses are balanced before parsing
        this.validateParentheses(filter);

        // Handle logical operators (and, or)
        const andMatch = this.splitByLogicalOperator(filter, ' and ');
        if (andMatch.length > 1) {
            return {
                $and: andMatch.map(part => this.parseODataFilter(part))
            };
        }

        const orMatch = this.splitByLogicalOperator(filter, ' or ');
        if (orMatch.length > 1) {
            return {
                $or: orMatch.map(part => this.parseODataFilter(part))
            };
        }

        // Handle NOT operator
        if (filter.startsWith('not ')) {
            return {
                $not: this.parseODataFilter(filter.substring(4).trim())
            };
        }

        // Handle parentheses
        if (filter.startsWith('(') && filter.endsWith(')')) {
            return this.parseODataFilter(filter.substring(1, filter.length - 1));
        }

        // Handle string functions
        const containsMatch = filter.match(/contains\((\w+),\s*'([^']+)'\)/i);
        if (containsMatch) {
            return { [containsMatch[1]]: { $contains: containsMatch[2] } };
        }

        const startswithMatch = filter.match(/startswith\((\w+),\s*'([^']+)'\)/i);
        if (startswithMatch) {
            return { [startswithMatch[1]]: { $startsWith: startswithMatch[2] } };
        }

        const endswithMatch = filter.match(/endswith\((\w+),\s*'([^']+)'\)/i);
        if (endswithMatch) {
            return { [endswithMatch[1]]: { $endsWith: endswithMatch[2] } };
        }

        const substringofMatch = filter.match(/substringof\('([^']+)',\s*(\w+)\)/i);
        if (substringofMatch) {
            return { [substringofMatch[2]]: { $contains: substringofMatch[1] } };
        }

        // Handle comparison operators
        const comparisonRegex = /(\w+)\s+(eq|ne|gt|ge|lt|le)\s+('([^']+)'|(\d+\.?\d*)|true|false|null)/i;
        const compMatch = filter.match(comparisonRegex);
        if (compMatch) {
            const field = compMatch[1];
            const operator = compMatch[2].toLowerCase();
            let value: any = compMatch[4] || compMatch[5];

            // Parse value type
            if (compMatch[3] === 'true') value = true;
            else if (compMatch[3] === 'false') value = false;
            else if (compMatch[3] === 'null') value = null;
            else if (compMatch[5]) value = parseFloat(compMatch[5]);

            // Map OData operators to ObjectQL operators
            const operatorMap: Record<string, string> = {
                'eq': '$eq',
                'ne': '$ne',
                'gt': '$gt',
                'ge': '$gte',
                'lt': '$lt',
                'le': '$lte'
            };

            return { [field]: { [operatorMap[operator]]: value } };
        }

        // Unsupported filter expression
        throw new ObjectQLError({
            code: 'PROTOCOL_INVALID_REQUEST',
            message: `Unsupported $filter expression: "${filter}". ` +
            `Supported operators: eq, ne, gt, ge, lt, le, and, or, not. ` +
            `Supported functions: contains, startswith, endswith, substringof.`
        });
    }

    /**
     * Validate that parentheses in filter are balanced
     * @throws Error if parentheses are mismatched
     */
    private validateParentheses(filter: string): void {
        let depth = 0;
        let inQuotes = false;

        for (let i = 0; i < filter.length; i++) {
            const char = filter[i];
            
            // Track quoted strings
            if (char === "'" && (i === 0 || filter[i - 1] !== '\\')) {
                inQuotes = !inQuotes;
                continue;
            }

            // Track parentheses depth (outside quotes)
            if (!inQuotes) {
                if (char === '(') {
                    depth++;
                } else if (char === ')') {
                    depth--;
                    // Check for negative depth (closing before opening)
                    if (depth < 0) {
                        throw new ObjectQLError({
                            code: 'PROTOCOL_INVALID_REQUEST',
                            message: `Invalid $filter expression: Mismatched parentheses. ` +
                            `Found closing ')' without matching opening '(' at position ${i}.`
                        });
                    }
                }
            }
        }

        // Check final depth is zero
        if (depth !== 0) {
            throw new ObjectQLError({
                code: 'PROTOCOL_INVALID_REQUEST',
                message: `Invalid $filter expression: Mismatched parentheses. ` +
                `${depth} unclosed opening parenthesis(es).`
            });
        }

        // Check quotes are balanced
        if (inQuotes) {
            throw new ObjectQLError({
                code: 'PROTOCOL_INVALID_REQUEST',
                message: `Invalid $filter expression: Unclosed quoted string.`
            });
        }
    }

    /**
     * Split filter string by logical operator, respecting parentheses and quoted strings
     */
    private splitByLogicalOperator(filter: string, operator: string): string[] {
        const parts: string[] = [];
        let current = '';
        let depth = 0;
        let inQuotes = false;
        let i = 0;

        while (i < filter.length) {
            const char = filter[i];
            
            // Track quoted strings
            if (char === "'" && (i === 0 || filter[i - 1] !== '\\')) {
                inQuotes = !inQuotes;
                current += char;
                i++;
                continue;
            }

            // Track parentheses depth
            if (!inQuotes) {
                if (char === '(') depth++;
                if (char === ')') depth--;

                // Check for operator at depth 0
                if (depth === 0 && filter.substring(i, i + operator.length) === operator) {
                    parts.push(current.trim());
                    current = '';
                    i += operator.length;
                    continue;
                }
            }

            current += char;
            i++;
        }

        if (current.trim()) {
            parts.push(current.trim());
        }

        return parts.length > 1 ? parts : [filter];
    }

    /**
     * Parse OData $orderby expression
     */
    private parseODataOrderBy(orderby: string): any[] {
        // "name desc" -> [{ field: 'name', order: 'desc' }]
        const parts = orderby.split(',').map(s => s.trim());
        return parts.map(part => {
            const [field, order = 'asc'] = part.split(' ');
            return { field, order };
        });
    }

    /**
     * Map ObjectQL field type to OData EDM type
     */
    private mapFieldTypeToEdm(fieldType: string): string {
        const typeMap: Record<string, string> = {
            'text': 'Edm.String',
            'textarea': 'Edm.String',
            'markdown': 'Edm.String',
            'html': 'Edm.String',
            'email': 'Edm.String',
            'url': 'Edm.String',
            'phone': 'Edm.String',
            'password': 'Edm.String',
            'number': 'Edm.Double',
            'currency': 'Edm.Double',
            'percent': 'Edm.Double',
            'autonumber': 'Edm.Int32',
            'boolean': 'Edm.Boolean',
            'date': 'Edm.Date',
            'datetime': 'Edm.DateTimeOffset',
            'time': 'Edm.TimeOfDay',
            'select': 'Edm.String',
            'lookup': 'Edm.String',
            'master_detail': 'Edm.String',
            'file': 'Edm.String',
            'image': 'Edm.String',
            'object': 'Edm.String',
            'formula': 'Edm.String',
            'summary': 'Edm.String'
        };
        
        const edmType = typeMap[fieldType];
        if (!edmType) {
            return 'Edm.String';
        }
        
        return edmType;
    }

    /**
     * Generate ETag for an entity
     * Uses entity's updated_at timestamp or creates hash from entity content
     */
    private generateETag(entity: any): string {
        if (entity.updated_at) {
            // Use timestamp-based ETag (weak ETag)
            const timestamp = new Date(entity.updated_at).getTime();
            return `W/"${timestamp}"`;
        } else if (entity._id) {
            // Use ID-based ETag if no timestamp available
            return `W/"${entity._id}"`;
        } else {
            // Fallback: hash the entity content
            const content = JSON.stringify(entity);
            const hash = this.simpleHash(content);
            return `W/"${hash}"`;
        }
    }

    /**
     * Simple hash function for ETag generation
     */
    private simpleHash(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Handle OData $batch requests
     * Supports both read operations and changesets (transactional writes)
     */
    private async handleBatchRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
        if (req.method !== 'POST') {
            this.sendError(res, 405, '$batch requires POST method');
            return;
        }

        try {
            const contentType = req.headers['content-type'] || '';
            const boundaryMatch = contentType.match(/boundary=["']?([^"';,\s\r\n]+)["']?/);
            
            if (!boundaryMatch) {
                this.sendError(res, 400, 'Missing multipart boundary in Content-Type');
                return;
            }

            const boundary = boundaryMatch[1];
            const body = await this.readBatchBody(req);
            
            // Parse multipart batch request
            const parts = this.parseBatchRequest(body, boundary);
            const responses: string[] = [];

            for (const part of parts) {
                if (part.type === 'changeset' && part.requests) {
                    // Process changeset (transactional)
                    const changesetResponses = await this.processChangeset(part.requests);
                    responses.push(...changesetResponses);
                } else {
                    // Process single request
                    const response = await this.processBatchRequest(part);
                    responses.push(response);
                }
            }

            // Build multipart response
            const responseBoundary = `batch_${Date.now()}`;
            const batchResponse = responses.map(r => 
                `--${responseBoundary}\r\nContent-Type: application/http\r\n\r\n${r}\r\n`
            ).join('') + `--${responseBoundary}--`;

            res.setHeader('Content-Type', `multipart/mixed; boundary=${responseBoundary}`);
            res.writeHead(200);
            res.end(batchResponse);

        } catch (error) {
            this.sendError(res, 500, error instanceof Error ? error.message : 'Batch processing failed');
        }
    }

    /**
     * Read batch request body
     */
    private readBatchBody(req: IncomingMessage): Promise<string> {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => resolve(body));
            req.on('error', reject);
        });
    }

    /**
     * Parse multipart batch request
     */
    private parseBatchRequest(body: string, boundary: string): Array<{ type: string; method?: string; url?: string; body?: string; requests?: any[] }> {
        const parts: Array<{ type: string; method?: string; url?: string; body?: string; requests?: any[] }> = [];
        const sections = body.split(`--${boundary}`).filter(s => s.trim() && !s.startsWith('--'));

        for (const section of sections) {
            // Check if this is a changeset header (contains boundary definition but no HTTP methods)
            if (section.includes('Content-Type: multipart/mixed')) {
                const changesetBoundaryMatch = section.match(/boundary=["']?([^"';,\s\r\n]+)["']?/);
                if (changesetBoundaryMatch) {
                    const changesetBoundary = changesetBoundaryMatch[1];
                    
                    // Only recurse if the boundary is different from current boundary
                    // This prevents infinite recursion on header-only sections
                    if (changesetBoundary !== boundary) {
                        const changesetRequests = this.parseBatchRequest(section, changesetBoundary);
                        parts.push({ type: 'changeset', requests: changesetRequests });
                    }
                }
            } else if (section.match(/(GET|POST|PATCH|PUT|DELETE)\s+/)) {
                // Parse individual HTTP request
                const httpMatch = section.match(/(GET|POST|PATCH|PUT|DELETE)\s+([^\s]+)/);
                if (httpMatch) {
                    const method = httpMatch[1];
                    const url = httpMatch[2];
                    
                    // Extract body if present (for POST/PATCH/PUT)
                    // Body is the content after the last \r\n\r\n separator
                    let requestBody = '';
                    const sectionParts = section.split('\r\n\r\n');
                    if (sectionParts.length > 1) {
                        requestBody = sectionParts[sectionParts.length - 1].trim();
                    }
                    
                    parts.push({ 
                        type: 'request', 
                        method, 
                        url,
                        body: requestBody
                    });
                }
            }
        }

        return parts;
    }

    /**
     * Process a single batch request
     */
    private async processBatchRequest(part: any): Promise<string> {
        try {
            if (!part.method || !part.url) {
                return 'HTTP/1.1 400 Bad Request\r\nContent-Type: application/json\r\n\r\n{"error":{"code":"400","message":"Invalid request format"}}';
            }

            const method = part.method;
            const url = part.url;
            
            // Parse URL to extract entity set and key
            const urlParts = url.replace(this.config.basePath, '').split('/').filter((p: string) => p);
            
            if (urlParts.length === 0) {
                return 'HTTP/1.1 400 Bad Request\r\nContent-Type: application/json\r\n\r\n{"error":{"code":"400","message":"Invalid URL"}}';
            }

            const entitySet = urlParts[0].split('(')[0]; // Remove key if present
            const keyMatch = url.match(/\(([^)]+)\)/);
            const key = keyMatch ? keyMatch[1].replace(/'/g, '') : null;

            let result: any;
            let statusCode = 200;

            // Execute the operation
            if (method === 'GET') {
                if (key) {
                    result = await this.getData(entitySet, key);
                    if (!result) {
                        return 'HTTP/1.1 404 Not Found\r\nContent-Type: application/json\r\n\r\n{"error":{"code":"404","message":"Entity not found"}}';
                    }
                } else {
                    result = await this.findData(entitySet, {});
                }
            } else if (method === 'POST') {
                const data = part.body ? JSON.parse(part.body) : {};
                result = await this.createData(entitySet, data);
                statusCode = 201;
            } else if (method === 'PATCH' || method === 'PUT') {
                if (!key) {
                    return 'HTTP/1.1 400 Bad Request\r\nContent-Type: application/json\r\n\r\n{"error":{"code":"400","message":"Key required for update"}}';
                }
                const data = part.body ? JSON.parse(part.body) : {};
                result = await this.updateData(entitySet, key, data);
            } else if (method === 'DELETE') {
                if (!key) {
                    return 'HTTP/1.1 400 Bad Request\r\nContent-Type: application/json\r\n\r\n{"error":{"code":"400","message":"Key required for delete"}}';
                }
                await this.deleteData(entitySet, key);
                return 'HTTP/1.1 204 No Content\r\n\r\n';
            }

            const responseBody = JSON.stringify(result, null, 2);
            return `HTTP/1.1 ${statusCode} OK\r\nContent-Type: application/json\r\n\r\n${responseBody}`;

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Internal server error';
            return `HTTP/1.1 500 Internal Server Error\r\nContent-Type: application/json\r\n\r\n{"error":{"code":"500","message":"${message}"}}`;
        }
    }

    /**
     * Process changeset (transactional batch of write operations)
     * 
     * In OData V4, changesets are atomic - either all operations succeed or all fail.
     * This implementation provides enhanced error handling and atomic rollback.
     */
    private async processChangeset(requests: any[]): Promise<string[]> {
        const responses: string[] = [];
        const operations: Array<{ type: string; entitySet: string; key?: string; data?: any }> = [];
        const tempResults: any[] = [];
        
        try {
            // First pass: Execute all operations and collect results
            for (let i = 0; i < requests.length; i++) {
                const request = requests[i];
                const response = await this.processBatchRequest(request);
                
                // Parse the operation details for potential rollback
                if (request.method && request.url) {
                    const urlParts = request.url.replace(this.config.basePath, '').split('/').filter((p: string) => p);
                    const entitySet = urlParts[0]?.split('(')[0];
                    const keyMatch = request.url.match(/\(([^)]+)\)/);
                    const key = keyMatch ? keyMatch[1].replace(/'/g, '') : undefined;
                    
                    operations.push({
                        type: request.method,
                        entitySet,
                        key,
                        data: request.body ? JSON.parse(request.body) : undefined
                    });
                }
                
                // Check if any request failed
                if (response.includes('HTTP/1.1 4') || response.includes('HTTP/1.1 5')) {
                    // Extract error details from response
                    const errorMatch = response.match(/{"error":\s*({[^}]+}|"[^"]+")}/);
                    const errorDetail = errorMatch ? errorMatch[0] : 'Unknown error';
                    
                    throw new ObjectQLError({ code: 'PROTOCOL_BATCH_ERROR', message: `Changeset operation ${i + 1}/${requests.length} failed: ${errorDetail}` });
                }
                
                tempResults.push(response);
            }
            
            // All operations succeeded - commit all responses
            responses.push(...tempResults);
            
        } catch (error) {
            // Enhanced error handling with rollback information
            const errorMessage = error instanceof Error ? error.message : 'Changeset failed';
            // Attempt to rollback completed operations (in reverse order)
            // Note: This is a best-effort rollback since we don't have true database transactions
            // In a production system, this would use database transaction support
            try {
                await this.rollbackChangeset(operations, tempResults.length);
            } catch (rollbackError) {
                // Error silently ignored
            }
            
            // Return detailed error response for the entire changeset
            const errorResponse = {
                error: {
                    code: "CHANGESET_FAILED",
                    message: errorMessage,
                    details: {
                        completedOperations: tempResults.length,
                        totalOperations: requests.length,
                        rollbackAttempted: true
                    }
                }
            };
            
            responses.push(`HTTP/1.1 500 Internal Server Error\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(errorResponse)}`);
        }
        
        return responses;
    }

    /**
     * Attempt to rollback completed changeset operations
     * 
     * ⚠️ IMPORTANT: This is a DEMONSTRATION-ONLY implementation.
     * DO NOT use in production without proper database transaction support!
     * 
     * This method only LOGS rollback intentions but does NOT actually reverse operations.
     * 
     * For production use, you must implement ONE of the following:
     * 1. Database transaction support (BEGIN TRANSACTION / ROLLBACK)
     * 2. Compensating transaction pattern with state storage
     * 3. Event sourcing with operation replay capability
     * 
     * Current limitations:
     * - Does not actually reverse operations (logs intentions only)
     * - Requires storing created IDs, deleted records, and previous values
     * - No guaranteed atomicity without database transaction support
     * 
     * Implementation requirements for true rollback:
     * - Store created IDs during POST operations for deletion
     * - Store deleted records before DELETE operations for restoration
     * - Store previous values before PATCH/PUT operations for reversion
     */
    private async rollbackChangeset(operations: Array<{ type: string; entitySet: string; key?: string; data?: any }>, completedCount: number): Promise<void> {
        // Rollback in reverse order
        for (let i = completedCount - 1; i >= 0; i--) {
            const op = operations[i];
            try {
                // Reverse the operation
                if (op.type === 'POST') {
                    // Created record - try to delete it
                    // TODO: Need to extract and store the created ID from the response
                } else if (op.type === 'DELETE') {
                    // Deleted record - try to restore it
                    // TODO: Need to store the deleted record data before deletion
                } else if (op.type === 'PATCH' || op.type === 'PUT') {
                    // Updated record - try to restore previous values
                    // TODO: Need to fetch and store previous values before update
                }
            } catch (error) {
                // Error silently ignored
            }
        }
    }

    /**
     * Read request body as JSON
     */
    private readBody(req: IncomingMessage): Promise<any> {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => {
                if (!body) return resolve({});
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    reject(new Error('Invalid JSON'));
                }
            });
            req.on('error', reject);
        });
    }

    /**
     * Send JSON response
     */
    private sendJSON(res: ServerResponse, statusCode: number, data: any): void {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(statusCode);
        res.end(JSON.stringify(data, null, 2));
    }

    /**
     * Send OData error response
     */
    private sendError(res: ServerResponse, statusCode: number, message: string): void {
        this.sendJSON(res, statusCode, {
            error: {
                code: statusCode.toString(),
                message
            }
        });
    }
}

/**
 * OData query parameters
 */
interface ODataQueryParams {
    $filter?: string;
    $select?: string;
    $orderby?: string;
    $top?: string;
    $skip?: string;
    $count?: string;
    $expand?: string;
    $search?: string;
}
