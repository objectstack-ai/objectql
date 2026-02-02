/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// ============================================================================
// Gateway Types
// ============================================================================

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

export interface ApiRequest {
    path: string;
    method: ApiMethod;
    headers: Record<string, string | string[] | undefined>;
    query: Record<string, any>;
    body?: any;
    protocol?: string; // e.g. 'rest', 'graphql'
}

export interface ApiResponse {
    status: number;
    headers?: Record<string, string | string[]>;
    body: any;
}

export interface GatewayProtocol {
    name: string;
    route(request: ApiRequest): boolean; // Can this protocol handle this request?
    handle(request: ApiRequest): Promise<ApiResponse>;
}

export interface GatewayConfig {
    protocols: GatewayProtocol[];
    // Middleware chain?
}
