/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * @objectql/sdk - Universal HTTP Client for ObjectQL
 * 
 * This package provides type-safe HTTP clients for ObjectQL servers.
 * It works seamlessly in browsers, Node.js, Deno, and edge runtimes.
 * 
 * ## Browser Compatibility
 * 
 * The SDK uses modern JavaScript APIs:
 * - fetch API (universal)
 * - AbortSignal.timeout() (Chrome 103+, Firefox 100+, Safari 16.4+)
 * 
 * For older browsers, a polyfill is automatically applied if AbortSignal.timeout is not available.
 * 
 * @packageDocumentation
 */

import { 
    Driver,
    IDataApiClient,
    IMetadataApiClient,
    DataApiClientConfig,
    MetadataApiClientConfig,
    DataApiListParams,
    DataApiListResponse,
    DataApiItemResponse,
    DataApiCreateRequest,
    DataApiCreateManyRequest,
    DataApiUpdateRequest,
    DataApiBulkUpdateRequest,
    DataApiBulkDeleteRequest,
    DataApiCountResponse,
    DataApiDeleteResponse,
    DataApiResponse,
    MetadataApiObjectListResponse,
    MetadataApiObjectDetailResponse,
    FieldMetadataResponse,
    MetadataApiActionsResponse,
    MetadataApiListResponse,
    MetadataApiResponse,
    ObjectQLError,
    ApiErrorCode,
    FilterExpression
} from '@objectql/types';

/**
 * Polyfill for AbortSignal.timeout if not available (for older browsers)
 * This ensures the SDK works universally across all JavaScript environments.
 */
if (typeof AbortSignal !== 'undefined' && !AbortSignal.timeout) {
    (AbortSignal as any).timeout = function(ms: number): AbortSignal {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), ms);
        return controller.signal;
    };
}

/**
 * Helper function to create a timeout signal that works in all environments
 */
function createTimeoutSignal(ms: number): AbortSignal {
    if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
        return AbortSignal.timeout(ms);
    }
    // Fallback for environments without AbortSignal
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
}

/**
 * Legacy Driver implementation that uses JSON-RPC style API
 */
export class RemoteDriver implements Driver {
    private rpcPath: string;
    
    constructor(private baseUrl: string, rpcPath: string = '/api/objectql') {
        this.rpcPath = rpcPath;
    }

    private async request(op: string, objectName: string, args: any) {
        // Implementation detail: we assume there is a standard endpoint at rpcPath
        // that accepts the ObjectQLRequest format.
        const endpoint = `${this.baseUrl.replace(/\/$/, '')}${this.rpcPath}`;
        
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                op,
                object: objectName,
                args
            })
        });
        
        const json = await res.json();
        
        if (json.error) {
            throw new Error(json.error.message);
        }
        
        return json.data;
    }

    async find(objectName: string, query: any, options?: any): Promise<any[]> {
        return this.request('find', objectName, query);
    }

    async findOne(objectName: string, id: string | number, query?: any, options?: any): Promise<any> {
        return this.request('findOne', objectName, { id, query }); // Note: args format must match server expectation
    }

    async create(objectName: string, data: any, options?: any): Promise<any> {
        return this.request('create', objectName, data);
    }

    async update(objectName: string, id: string | number, data: any, options?: any): Promise<any> {
        // args for update: { id, data } based on server code: repo.update(req.args.id, req.args.data)
        return this.request('update', objectName, { id, data });
    }

    async delete(objectName: string, id: string | number, options?: any): Promise<any> {
        return this.request('delete', objectName, { id });
    }

    async count(objectName: string, filters: any, options?: any): Promise<number> {
        return this.request('count', objectName, filters);
    }

    async createMany(objectName: string, data: any[], options?: any): Promise<any> {
        return this.request('createMany', objectName, data);
    }

    async updateMany(objectName: string, filters: any, data: any, options?: any): Promise<any> {
        return this.request('updateMany', objectName, { filters, data });
    }

    async deleteMany(objectName: string, filters: any, options?: any): Promise<any> {
        return this.request('deleteMany', objectName, { filters });
    }
}

/**
 * REST-based Data API Client
 * 
 * Implements type-safe client for ObjectQL Data API endpoints.
 * Uses the RESTful interface described in docs/api/rest.md
 * 
 * @example
 * ```typescript
 * const client = new DataApiClient({ 
 *   baseUrl: 'http://localhost:3000',
 *   dataPath: '/api/data' // optional, defaults to /api/data
 * });
 * 
 * // List users
 * const response = await client.list('users', {
 *   filter: [['status', '=', 'active']],
 *   sort: [['created_at', 'desc']],
 *   limit: 20
 * });
 * 
 * // Get single user
 * const user = await client.get('users', 'user_123');
 * 
 * // Create user
 * const newUser = await client.create('users', {
 *   name: 'Alice',
 *   email: 'alice@example.com'
 * });
 * ```
 */
export class DataApiClient implements IDataApiClient {
    private baseUrl: string;
    private token?: string;
    private headers: Record<string, string>;
    private timeout: number;
    private dataPath: string;

    constructor(config: DataApiClientConfig) {
        this.baseUrl = config.baseUrl.replace(/\/$/, '');
        this.token = config.token;
        this.headers = config.headers || {};
        this.timeout = config.timeout || 30000;
        this.dataPath = config.dataPath || '/api/data';
    }

    private async request<T>(
        method: string,
        path: string,
        body?: unknown,
        queryParams?: Record<string, unknown>
    ): Promise<T> {
        const url = new URL(`${this.baseUrl}${path}`);
        
        // Add query parameters
        if (queryParams) {
            Object.entries(queryParams).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    url.searchParams.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
                }
            });
        }

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...this.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(url.toString(), {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
            signal: createTimeoutSignal(this.timeout)
        });

        const json = await response.json();
        
        if (json.error) {
            throw new ObjectQLError({
                code: json.error.code || ApiErrorCode.INTERNAL_ERROR,
                message: json.error.message,
                details: json.error.details
            });
        }

        return json as T;
    }

    async list<T = unknown>(objectName: string, params?: DataApiListParams): Promise<DataApiListResponse<T>> {
        return this.request<DataApiListResponse<T>>(
            'GET',
            `${this.dataPath}/${objectName}`,
            undefined,
            params as Record<string, unknown>
        );
    }

    async get<T = unknown>(objectName: string, id: string | number): Promise<DataApiItemResponse<T>> {
        return this.request<DataApiItemResponse<T>>(
            'GET',
            `${this.dataPath}/${objectName}/${id}`
        );
    }

    async create<T = unknown>(objectName: string, data: DataApiCreateRequest): Promise<DataApiItemResponse<T>> {
        return this.request<DataApiItemResponse<T>>(
            'POST',
            `${this.dataPath}/${objectName}`,
            data
        );
    }

    async createMany<T = unknown>(objectName: string, data: DataApiCreateManyRequest): Promise<DataApiListResponse<T>> {
        return this.request<DataApiListResponse<T>>(
            'POST',
            `${this.dataPath}/${objectName}`,
            data
        );
    }

    async update<T = unknown>(objectName: string, id: string | number, data: DataApiUpdateRequest): Promise<DataApiItemResponse<T>> {
        return this.request<DataApiItemResponse<T>>(
            'PUT',
            `${this.dataPath}/${objectName}/${id}`,
            data
        );
    }

    async updateMany(objectName: string, request: DataApiBulkUpdateRequest): Promise<DataApiResponse> {
        return this.request<DataApiResponse>(
            'POST',
            `${this.dataPath}/${objectName}/bulk-update`,
            request
        );
    }

    async delete(objectName: string, id: string | number): Promise<DataApiDeleteResponse> {
        return this.request<DataApiDeleteResponse>(
            'DELETE',
            `${this.dataPath}/${objectName}/${id}`
        );
    }

    async deleteMany(objectName: string, request: DataApiBulkDeleteRequest): Promise<DataApiDeleteResponse> {
        return this.request<DataApiDeleteResponse>(
            'POST',
            `${this.dataPath}/${objectName}/bulk-delete`,
            request
        );
    }

    async count(objectName: string, filters?: FilterExpression): Promise<DataApiCountResponse> {
        return this.request<DataApiCountResponse>(
            'GET',
            `${this.dataPath}/${objectName}`,
            undefined,
            { filter: filters, limit: 0 }
        );
    }
}

/**
 * REST-based Metadata API Client
 * 
 * Implements type-safe client for ObjectQL Metadata API endpoints.
 * Uses the interface described in docs/api/metadata.md
 * 
 * @example
 * ```typescript
 * const client = new MetadataApiClient({ 
 *   baseUrl: 'http://localhost:3000',
 *   metadataPath: '/api/metadata' // optional, defaults to /api/metadata
 * });
 * 
 * // List all objects
 * const objects = await client.listObjects();
 * 
 * // Get detailed object metadata
 * const userSchema = await client.getObject('users');
 * console.log(userSchema.fields);
 * 
 * // Get field metadata
 * const emailField = await client.getField('users', 'email');
 * 
 * // List actions
 * const actions = await client.listActions('users');
 * ```
 */
export class MetadataApiClient implements IMetadataApiClient {
    private baseUrl: string;
    private token?: string;
    private headers: Record<string, string>;
    private timeout: number;
    private metadataPath: string;

    constructor(config: MetadataApiClientConfig) {
        this.baseUrl = config.baseUrl.replace(/\/$/, '');
        this.token = config.token;
        this.headers = config.headers || {};
        this.timeout = config.timeout || 30000;
        this.metadataPath = config.metadataPath || '/api/metadata';
    }

    private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...this.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(`${this.baseUrl}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
            signal: createTimeoutSignal(this.timeout)
        });

        const json = await response.json();
        
        if (json.error) {
            throw new ObjectQLError({
                code: json.error.code || ApiErrorCode.INTERNAL_ERROR,
                message: json.error.message,
                details: json.error.details
            });
        }

        return json as T;
    }

    async listObjects(): Promise<MetadataApiObjectListResponse> {
        return this.request<MetadataApiObjectListResponse>(
            'GET',
            `${this.metadataPath}/objects`
        );
    }

    async getObject(objectName: string): Promise<MetadataApiObjectDetailResponse> {
        return this.request<MetadataApiObjectDetailResponse>(
            'GET',
            `${this.metadataPath}/object/${objectName}`
        );
    }

    async getField(objectName: string, fieldName: string): Promise<FieldMetadataResponse> {
        return this.request<FieldMetadataResponse>(
            'GET',
            `${this.metadataPath}/object/${objectName}/fields/${fieldName}`
        );
    }

    async listActions(objectName: string): Promise<MetadataApiActionsResponse> {
        return this.request<MetadataApiActionsResponse>(
            'GET',
            `${this.metadataPath}/object/${objectName}/actions`
        );
    }

    async listByType<T = unknown>(metadataType: string): Promise<MetadataApiListResponse<T>> {
        return this.request<MetadataApiListResponse<T>>(
            'GET',
            `${this.metadataPath}/${metadataType}`
        );
    }

    async getMetadata<T = unknown>(metadataType: string, id: string): Promise<MetadataApiResponse<T>> {
        return this.request<MetadataApiResponse<T>>(
            'GET',
            `${this.metadataPath}/${metadataType}/${id}`
        );
    }
}
