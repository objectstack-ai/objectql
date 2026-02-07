/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ApiRequest, ApiResponse, GatewayProtocol, Logger, ConsoleLogger } from '@objectql/types';

export type RequestTransformer = (request: ApiRequest) => Promise<ApiRequest>;
export type ResponseTransformer = (response: ApiResponse) => Promise<ApiResponse>;

/**
 * Unified API Gateway
 * Routtes generic API requests to specific protocol implementations
 */
export class ObjectGateway {
    private protocols: GatewayProtocol[] = [];
    private requestTransforms: RequestTransformer[] = [];
    private responseTransforms: ResponseTransformer[] = [];
    private logger: Logger;

    constructor(protocols: GatewayProtocol[] = [], logger?: Logger) {
        this.protocols = protocols;
        this.logger = logger ?? new ConsoleLogger({ name: '@objectql/gateway', level: 'info' });
    }

    /**
     * Register a new protocol handler
     */
    registerProtocol(protocol: GatewayProtocol) {
        this.protocols.push(protocol);
    }
    
    /**
     * Add a request transformer (middleware)
     */
    addRequestTransform(transformer: RequestTransformer) {
        this.requestTransforms.push(transformer);
    }

    /**
     * Add a response transformer (middleware)
     */
    addResponseTransform(transformer: ResponseTransformer) {
        this.responseTransforms.push(transformer);
    }

    /**
     * Handle an incoming API request
     */
    async handle(request: ApiRequest): Promise<ApiResponse> {
        let req = request;

        // 1. Apply Request Transforms
        for (const transform of this.requestTransforms) {
            req = await transform(req);
        }

        // 2. Find matching protocol
        const protocol = this.protocols.find(p => p.route(req));

        if (!protocol) {
            return {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
                body: {
                    error: {
                        code: 'PROTOCOL_NOT_FOUND',
                        message: `No protocol found to handle path: ${req.path}`
                    }
                }
            };
        }

        let response: ApiResponse;

        // 3. Delegate to protocol
        try {
            response = await protocol.handle(req);
        } catch (error: any) {
            console.error(`[ObjectGateway] Error in ${protocol.name}:`, error);
            // TODO: migrate to this.logger once all gateway consumers pass logger
            response = {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
                body: {
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: error.message || 'Internal Gateway Error'
                    }
                }
            };
        }

        // 4. Apply Response Transforms
        for (const transform of this.responseTransforms) {
            response = await transform(response);
        }

        return response;
    }
}
