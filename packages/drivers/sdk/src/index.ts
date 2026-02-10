import { Data, System as _SystemSpec } from '@objectstack/spec';
import { z } from 'zod';
import { QueryAST } from '@objectql/types';
type _DriverInterface = z.infer<typeof Data.DriverInterface>;
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
    Filter
} from '@objectql/types';

/**
 * Command interface for executeCommand method
 * Defines the structure of mutation commands sent to the remote API
 */
export interface Command {
    type: 'create' | 'update' | 'delete' | 'bulkCreate' | 'bulkUpdate' | 'bulkDelete';
    object: string;
    data?: any;
    id?: string | number;
    ids?: Array<string | number>;
    records?: any[];
    updates?: Array<{id: string | number, data: any}>;
    options?: any;
}

/**
 * Command result interface
 * Standard response format for command execution
 */
export interface CommandResult {
    success: boolean;
    data?: any;
    affected: number;
    error?: string;
}

/**
 * SDK Configuration for the RemoteDriver
 */
export interface SdkConfig {
    /** Base URL of the remote ObjectQL server */
    baseUrl: string;
    /** RPC endpoint path (default: /api/objectql) */
    rpcPath?: string;
    /** Query endpoint path (default: /api/query) */
    queryPath?: string;
    /** Command endpoint path (default: /api/command) */
    commandPath?: string;
    /** Custom execute endpoint path (default: /api/execute) */
    executePath?: string;
    /** Authentication token */
    token?: string;
    /** API key for authentication */
    apiKey?: string;
    /** Custom headers */
    headers?: Record<string, string>;
    /** Request timeout in milliseconds (default: 30000) */
    timeout?: number;
    /** Enable retry on failure (default: false) */
    enableRetry?: boolean;
    /** Maximum number of retry attempts (default: 3) */
    maxRetries?: number;
    /** Enable request/response logging (default: false) */
    enableLogging?: boolean;
}

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
 * 
 * Implements both the legacy Driver interface from @objectql/types and
 * the standard DriverInterface from @objectstack/spec for compatibility
 * with the new kernel-based plugin system.
 * 
 * @version 4.0.0 - DriverInterface compliant
 */
export class RemoteDriver implements Driver {
    // Driver metadata (ObjectStack-compatible)
    public readonly name = 'RemoteDriver';
    public readonly version = '4.0.0';
    public readonly supports = {
        transactions: false,
        joins: false,
        fullTextSearch: false,
        jsonFields: true,
        arrayFields: true,
        queryFilters: true,
        queryAggregations: true,
        querySorting: true,
        queryPagination: true,
        queryWindowFunctions: false,
        querySubqueries: false
    };

    private rpcPath: string;
    private queryPath: string;
    private commandPath: string;
    private executePath: string;
    private baseUrl: string;
    private token?: string;
    private apiKey?: string;
    private headers: Record<string, string>;
    private timeout: number;
    private enableRetry: boolean;
    private maxRetries: number;
    private enableLogging: boolean;
    
    constructor(baseUrlOrConfig: string | SdkConfig, rpcPath?: string) {
        if (typeof baseUrlOrConfig === 'string') {
            // Legacy constructor signature
            this.baseUrl = baseUrlOrConfig;
            this.rpcPath = rpcPath || '/api/objectql';
            this.queryPath = '/api/query';
            this.commandPath = '/api/command';
            this.executePath = '/api/execute';
            this.headers = {};
            this.timeout = 30000;
            this.enableRetry = false;
            this.maxRetries = 3;
            this.enableLogging = false;
        } else {
            // New config-based constructor
            const config = baseUrlOrConfig;
            this.baseUrl = config.baseUrl;
            this.rpcPath = config.rpcPath || '/api/objectql';
            this.queryPath = config.queryPath || '/api/query';
            this.commandPath = config.commandPath || '/api/command';
            this.executePath = config.executePath || '/api/execute';
            this.token = config.token;
            this.apiKey = config.apiKey;
            this.headers = config.headers || {};
            this.timeout = config.timeout || 30000;
            this.enableRetry = config.enableRetry || false;
            this.maxRetries = config.maxRetries || 3;
            this.enableLogging = config.enableLogging || false;
        }
    }

    /**
     * Build full endpoint URL
     * @private
     */
    private buildEndpoint(path: string): string {
        return `${this.baseUrl.replace(/\/$/, '')}${path}`;
    }

    /**
     * Get authentication headers
     * @private
     */
    private getAuthHeaders(): Record<string, string> {
        const authHeaders: Record<string, string> = {};
        
        if (this.token) {
            authHeaders['Authorization'] = `Bearer ${this.token}`;
        }
        
        if (this.apiKey) {
            authHeaders['X-API-Key'] = this.apiKey;
        }
        
        return authHeaders;
    }

    /**
     * Handle HTTP errors and convert to ObjectQLError
     * @private
     */
    private async handleHttpError(response: Response): Promise<never> {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let errorCode: ApiErrorCode = ApiErrorCode.INTERNAL_ERROR;
        let errorDetails: any = undefined;

        try {
            const json = await response.json();
            if (json.error) {
                errorMessage = json.error.message || errorMessage;
                errorCode = json.error.code || errorCode;
                errorDetails = json.error.details;
            }
        } catch {
            // Could not parse JSON, use default error message
        }

        // Map HTTP status codes to ObjectQL error codes
        if (response.status === 401) {
            errorCode = ApiErrorCode.UNAUTHORIZED;
        } else if (response.status === 403) {
            errorCode = ApiErrorCode.FORBIDDEN;
        } else if (response.status === 404) {
            errorCode = ApiErrorCode.NOT_FOUND;
        } else if (response.status === 400) {
            errorCode = ApiErrorCode.VALIDATION_ERROR;
        } else if (response.status >= 500) {
            errorCode = ApiErrorCode.INTERNAL_ERROR;
        }

        throw new ObjectQLError({
            code: errorCode,
            message: errorMessage,
            details: errorDetails
        });
    }

    /**
     * Retry logic with exponential backoff
     * @private
     */
    private async retryWithBackoff<T>(
        fn: () => Promise<T>,
        attempt: number = 0
    ): Promise<T> {
        let currentAttempt = attempt;
        
        while (true) {
            try {
                return await fn();
            } catch (error: any) {
                // Don't retry on client errors (4xx) or if retries are disabled
                if (!this.enableRetry || currentAttempt >= this.maxRetries) {
                    throw error;
                }

                // Don't retry on validation or auth errors
                if (error instanceof ObjectQLError) {
                    const nonRetryableCodes = [
                        ApiErrorCode.VALIDATION_ERROR,
                        ApiErrorCode.UNAUTHORIZED,
                        ApiErrorCode.FORBIDDEN,
                        ApiErrorCode.NOT_FOUND
                    ];
                    if (nonRetryableCodes.includes(error.code as ApiErrorCode)) {
                        throw error;
                    }
                }

                // Calculate exponential backoff delay
                const delay = Math.min(1000 * Math.pow(2, currentAttempt), 10000);
                
                if (this.enableLogging) {
                    console.log(`Retry attempt ${currentAttempt + 1}/${this.maxRetries} after ${delay}ms delay`);
                }

                await new Promise(resolve => setTimeout(resolve, delay));
                currentAttempt++;
            }
        }
    }

    /**
     * Log request/response if logging is enabled
     * @private
     */
    private log(message: string, data?: any): void {
        if (this.enableLogging) {
            console.log(`[RemoteDriver] ${message}`, data || '');
        }
    }

    /**
     * Connect to the remote server (for DriverInterface compatibility)
     */
    async connect(): Promise<void> {
        // Test connection with a simple health check
        try {
            await this.checkHealth();
        } catch (error) {
            throw new ObjectQLError({ code: 'DRIVER_CONNECTION_FAILED', message: `Failed to connect to remote server: ${(error as Error).message}` });
        }
    }

    /**
     * Check remote server connection health
     */
    async checkHealth(): Promise<boolean> {
        try {
            const endpoint = `${this.baseUrl.replace(/\/$/, '')}${this.rpcPath}`;
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    op: 'ping',
                    object: '_health',
                    args: {}
                })
            });
            return res.ok;
        } catch (_error) {
            return false;
        }
    }

    /**
     * Execute a query using QueryAST format (DriverInterface v4.0)
     * 
     * Sends a QueryAST to the remote server's /api/query endpoint
     * and returns the query results.
     * 
     * @param ast - The QueryAST to execute
     * @param options - Optional execution options
     * @returns Query result with value array and optional count
     * 
     * @example
     * ```typescript
     * const result = await driver.executeQuery({
     *   object: 'users',
     *   fields: ['name', 'email'],
     *   filters: {
     *     type: 'comparison',
     *     field: 'status',
     *     operator: '=',
     *     value: 'active'
     *   },
     *   sort: [{ field: 'created_at', order: 'desc' }],
     *   top: 10
     * });
     * ```
     */
    async executeQuery(ast: QueryAST, _options?: any): Promise<{ value: any[]; count?: number }> {
        return this.retryWithBackoff(async () => {
            const endpoint = this.buildEndpoint(this.queryPath);
            this.log('executeQuery', { endpoint, ast });

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                ...this.getAuthHeaders(),
                ...this.headers
            };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(ast),
                signal: createTimeoutSignal(this.timeout)
            });

            if (!response.ok) {
                await this.handleHttpError(response);
            }

            const json = await response.json();
            this.log('executeQuery response', json);

            // Handle both direct data response and wrapped response formats
            if (json.error) {
                throw new ObjectQLError({
                    code: json.error.code || ApiErrorCode.INTERNAL_ERROR,
                    message: json.error.message,
                    details: json.error.details
                });
            }

            // Support multiple response formats
            if (json.value !== undefined) {
                return {
                    value: Array.isArray(json.value) ? json.value : [json.value],
                    count: json.count
                };
            } else if (json.data !== undefined) {
                return {
                    value: Array.isArray(json.data) ? json.data : [json.data],
                    count: json.count || (Array.isArray(json.data) ? json.data.length : 1)
                };
            } else if (Array.isArray(json)) {
                return {
                    value: json,
                    count: json.length
                };
            } else {
                return {
                    value: [json],
                    count: 1
                };
            }
        });
    }

    /**
     * Execute a command using Command format (DriverInterface v4.0)
     * 
     * Sends a Command to the remote server's /api/command endpoint
     * for mutation operations (create, update, delete, bulk operations).
     * 
     * @param command - The command to execute
     * @param options - Optional execution options
     * @returns Command execution result
     * 
     * @example
     * ```typescript
     * // Create a record
     * const result = await driver.executeCommand({
     *   type: 'create',
     *   object: 'users',
     *   data: { name: 'Alice', email: 'alice@example.com' }
     * });
     * 
     * // Bulk update
     * const bulkResult = await driver.executeCommand({
     *   type: 'bulkUpdate',
     *   object: 'users',
     *   updates: [
     *     { id: '1', data: { status: 'active' } },
     *     { id: '2', data: { status: 'inactive' } }
     *   ]
     * });
     * ```
     */
    async executeCommand(command: Command, _options?: any): Promise<CommandResult> {
        return this.retryWithBackoff(async () => {
            const endpoint = this.buildEndpoint(this.commandPath);
            this.log('executeCommand', { endpoint, command });

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                ...this.getAuthHeaders(),
                ...this.headers
            };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(command),
                signal: createTimeoutSignal(this.timeout)
            });

            if (!response.ok) {
                await this.handleHttpError(response);
            }

            const json = await response.json();
            this.log('executeCommand response', json);

            // Handle error response
            if (json.error) {
                return {
                    success: false,
                    error: json.error.message || 'Command execution failed',
                    affected: 0
                };
            }

            // Handle standard CommandResult format
            if (json.success !== undefined) {
                return {
                    success: json.success,
                    data: json.data,
                    affected: json.affected || 0,
                    error: json.error
                };
            }

            // Handle legacy response formats
            return {
                success: true,
                data: json.data || json,
                affected: json.affected || 1
            };
        });
    }

    /**
     * Execute a custom operation on the remote server
     * 
     * Allows calling custom HTTP endpoints with flexible parameters.
     * Useful for custom actions, workflows, or specialized operations.
     * 
     * @param endpoint - Optional custom endpoint path (defaults to /api/execute)
     * @param payload - Request payload
     * @param options - Optional execution options
     * @returns Execution result
     * 
     * @example
     * ```typescript
     * // Execute a custom workflow
     * const result = await driver.executeCustomEndpoint('/api/workflows/approve', {
     *   workflowId: 'wf_123',
     *   comment: 'Approved'
     * });
     * 
     * // Use default execute endpoint
     * const result = await driver.executeCustomEndpoint(undefined, {
     *   action: 'calculateMetrics',
     *   params: { year: 2024 }
     * });
     * ```
     */
    async executeCustomEndpoint(endpoint?: string, payload?: any, _options?: any): Promise<any> {
        return this.retryWithBackoff(async () => {
            const targetEndpoint = endpoint 
                ? this.buildEndpoint(endpoint)
                : this.buildEndpoint(this.executePath);
            
            this.log('execute', { endpoint: targetEndpoint, payload });

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                ...this.getAuthHeaders(),
                ...this.headers
            };

            const response = await fetch(targetEndpoint, {
                method: 'POST',
                headers,
                body: payload !== undefined ? JSON.stringify(payload) : undefined,
                signal: createTimeoutSignal(this.timeout)
            });

            if (!response.ok) {
                await this.handleHttpError(response);
            }

            const json = await response.json();
            this.log('execute response', json);

            if (json.error) {
                throw new ObjectQLError({
                    code: json.error.code || ApiErrorCode.INTERNAL_ERROR,
                    message: json.error.message,
                    details: json.error.details
                });
            }

            return json;
        });
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
            throw new ObjectQLError({ code: 'DRIVER_QUERY_FAILED', message: json.error.message });
        }
        
        return json.data;
    }

    /**
     * Normalizes query format to support both legacy UnifiedQuery and QueryAST formats.
     * This ensures backward compatibility while supporting the new @objectstack/spec interface.
     * 
     * QueryAST format uses 'top' for limit, while UnifiedQuery uses 'limit'.
     * QueryAST sort is array of {field, order}, while UnifiedQuery is array of [field, order].
     */
    async find(objectName: string, query: any, _options?: any): Promise<any[]> {
        return this.request('find', objectName, query);
    }

    async findOne(objectName: string, id: string | number, query?: any, _options?: any): Promise<any> {
        return this.request('findOne', objectName, { id, query });
    }

    async create(objectName: string, data: any, _options?: any): Promise<any> {
        return this.request('create', objectName, data);
    }

    async update(objectName: string, id: string | number, data: any, _options?: any): Promise<any> {
        // args for update: { id, data } based on server code: repo.update(req.args.id, req.args.data)
        return this.request('update', objectName, { id, data });
    }

    async delete(objectName: string, id: string | number, _options?: any): Promise<any> {
        return this.request('delete', objectName, { id });
    }

    async count(objectName: string, filters: any, _options?: any): Promise<number> {
        return this.request('count', objectName, filters);
    }

    async createMany(objectName: string, data: any[], _options?: any): Promise<any> {
        return this.request('createMany', objectName, data);
    }

    async updateMany(objectName: string, filters: any, data: any, _options?: any): Promise<any> {
        return this.request('updateMany', objectName, { filters, data });
    }

    async deleteMany(objectName: string, filters: any, _options?: any): Promise<any> {
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

    async count(objectName: string, filters?: Filter): Promise<DataApiCountResponse> {
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
