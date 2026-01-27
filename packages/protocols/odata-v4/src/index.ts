/**
 * OData V4 Protocol Plugin for ObjectStack
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { RuntimePlugin, RuntimeContext } from '@objectql/runtime';
import { ObjectStackRuntimeProtocol } from '@objectql/runtime';
import { IncomingMessage, ServerResponse, createServer, Server } from 'http';

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
 * - No direct database access - all operations through ObjectStackRuntimeProtocol
 * 
 * @example
 * ```typescript
 * import { ObjectStackKernel } from '@objectql/runtime';
 * import { ODataV4Plugin } from '@objectql/protocol-odata-v4';
 * 
 * const kernel = new ObjectStackKernel([
 *   new ODataV4Plugin({ port: 8080, basePath: '/odata' })
 * ]);
 * await kernel.start();
 * ```
 */
export class ODataV4Plugin implements RuntimePlugin {
    name = '@objectql/protocol-odata-v4';
    version = '0.1.0';
    
    private server?: Server;
    private protocol?: ObjectStackRuntimeProtocol;
    private config: Required<ODataV4PluginConfig>;

    constructor(config: ODataV4PluginConfig = {}) {
        this.config = {
            port: config.port || 8080,
            basePath: config.basePath || '/odata',
            enableCORS: config.enableCORS !== false,
            namespace: config.namespace || 'ObjectStack'
        };
    }

    /**
     * Install hook - called during kernel initialization
     */
    async install(ctx: RuntimeContext): Promise<void> {
        console.log(`[${this.name}] Installing OData V4 protocol plugin...`);
        
        // Initialize the protocol bridge
        this.protocol = new ObjectStackRuntimeProtocol(ctx.engine);
        
        console.log(`[${this.name}] Protocol bridge initialized`);
    }

    /**
     * Start hook - called when kernel starts
     * This is where we start the HTTP server
     */
    async onStart(ctx: RuntimeContext): Promise<void> {
        if (!this.protocol) {
            throw new Error('Protocol not initialized. Install hook must be called first.');
        }

        console.log(`[${this.name}] Starting OData V4 server...`);

        // Create HTTP server with request handler
        this.server = createServer((req, res) => this.handleRequest(req, res));

        // Start listening
        await new Promise<void>((resolve) => {
            this.server!.listen(this.config.port, () => {
                console.log(`[${this.name}] OData V4 server listening on http://localhost:${this.config.port}${this.config.basePath}`);
                resolve();
            });
        });
    }

    /**
     * Stop hook - called when kernel stops
     */
    async onStop(ctx: RuntimeContext): Promise<void> {
        if (this.server) {
            console.log(`[${this.name}] Stopping OData V4 server...`);
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
     * Main HTTP request handler
     */
    private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
        // Enable CORS if configured
        if (this.config.enableCORS) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            
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
            const path = url.substring(basePath.length) || '/';
            
            // Route to appropriate handler
            if (path === '/' || path === '') {
                await this.handleServiceDocument(req, res);
            } else if (path === '/$metadata') {
                await this.handleMetadataDocument(req, res);
            } else {
                await this.handleEntityRequest(req, res, path);
            }
        } catch (error) {
            console.error(`[${this.name}] Request error:`, error);
            this.sendError(res, 500, error instanceof Error ? error.message : 'Internal Server Error');
        }
    }

    /**
     * Handle OData service document (/)
     * Returns list of available entity sets
     */
    private async handleServiceDocument(req: IncomingMessage, res: ServerResponse): Promise<void> {
        const entityTypes = this.protocol!.getMetaTypes();
        
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
        const entityTypes = this.protocol!.getMetaTypes();
        const namespace = this.config.namespace;
        
        // Build EDMX XML
        let edmx = `<?xml version="1.0" encoding="UTF-8"?>
<edmx:Edmx Version="4.0" xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx">
  <edmx:DataServices>
    <Schema Namespace="${namespace}" xmlns="http://docs.oasis-open.org/odata/ns/edm">
`;

        // Generate EntityType for each object
        for (const objectName of entityTypes) {
            const metadata = this.protocol!.getMetaItem(objectName) as any;
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
        if (!this.protocol!.hasObject(entitySet)) {
            this.sendError(res, 404, `Entity set '${entitySet}' not found`);
            return;
        }

        const method = req.method?.toUpperCase();

        // Route based on HTTP method
        if (method === 'GET') {
            if (entityId) {
                await this.handleGetEntity(res, entitySet, entityId);
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
    private async handleGetEntity(res: ServerResponse, entitySet: string, id: string): Promise<void> {
        const entity = await this.protocol!.getData(entitySet, id);
        
        if (!entity) {
            this.sendError(res, 404, 'Entity not found');
            return;
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

        const result = await this.protocol!.findData(entitySet, query);

        this.sendJSON(res, 200, {
            '@odata.context': `${this.config.basePath}/$metadata#${entitySet}`,
            '@odata.count': queryParams.$count === 'true' ? result.count : undefined,
            value: result.value
        });
    }

    /**
     * Handle POST request to create entity
     */
    private async handleCreateEntity(req: IncomingMessage, res: ServerResponse, entitySet: string): Promise<void> {
        const body = await this.readBody(req);
        const entity = await this.protocol!.createData(entitySet, body);

        this.sendJSON(res, 201, {
            '@odata.context': `${this.config.basePath}/$metadata#${entitySet}/$entity`,
            ...entity
        });
    }

    /**
     * Handle PUT/PATCH request to update entity
     */
    private async handleUpdateEntity(req: IncomingMessage, res: ServerResponse, entitySet: string, id: string): Promise<void> {
        const body = await this.readBody(req);
        const entity = await this.protocol!.updateData(entitySet, id, body);

        this.sendJSON(res, 200, {
            '@odata.context': `${this.config.basePath}/$metadata#${entitySet}/$entity`,
            ...entity
        });
    }

    /**
     * Handle DELETE request to delete entity
     */
    private async handleDeleteEntity(res: ServerResponse, entitySet: string, id: string): Promise<void> {
        await this.protocol!.deleteData(entitySet, id);
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
                params[key as keyof ODataQueryParams] = decodeURIComponent(value || '');
            }
        }

        return params;
    }

    /**
     * Parse OData $filter expression to ObjectQL where clause
     * 
     * NOTE: This is a simplified implementation for demonstration purposes.
     * Production use requires a full OData filter parser supporting:
     * - Comparison operators: eq, ne, gt, ge, lt, le
     * - Logical operators: and, or, not
     * - String functions: contains, startswith, endswith
     * - Arithmetic operators: add, sub, mul, div, mod
     * 
     * Currently only supports: field eq 'value'
     * 
     * TODO: Implement full OData filter expression parser
     */
    private parseODataFilter(filter: string): any {
        // Simple implementation: "name eq 'John'" -> { name: { $eq: 'John' } }
        const eqMatch = filter.match(/(\w+)\s+eq\s+'([^']+)'/);
        if (eqMatch) {
            return { [eqMatch[1]]: { $eq: eqMatch[2] } };
        }
        
        // Unsupported filter expression - log warning and return empty filter
        console.warn(`[ODataV4Plugin] Unsupported $filter expression: "${filter}". Only "field eq 'value'" is currently supported.`);
        return {};
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
            'number': 'Edm.Double',
            'boolean': 'Edm.Boolean',
            'date': 'Edm.Date',
            'datetime': 'Edm.DateTimeOffset',
            'select': 'Edm.String',
            'lookup': 'Edm.String',
            'master_detail': 'Edm.String'
        };
        
        return typeMap[fieldType] || 'Edm.String';
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
}
