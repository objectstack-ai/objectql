/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ObjectGateway } from '../src/gateway';
import { ApiRequest, ApiResponse, GatewayProtocol } from '@objectql/types';

describe('ObjectGateway', () => {
    let gateway: ObjectGateway;
    let mockProtocol: GatewayProtocol;

    beforeEach(() => {
        gateway = new ObjectGateway();
        mockProtocol = {
            name: 'mock',
            route: jest.fn().mockReturnValue(true),
            handle: jest.fn().mockResolvedValue({ status: 200, body: 'ok' })
        };
        gateway.registerProtocol(mockProtocol);
    });

    it('should route request to registered protocol', async () => {
        const req: ApiRequest = {
            path: '/test',
            method: 'GET',
            headers: {},
            query: {}
        };
        
        const response = await gateway.handle(req);
        
        expect(mockProtocol.route).toHaveBeenCalledWith(req);
        expect(mockProtocol.handle).toHaveBeenCalledWith(req);
        expect(response.status).toBe(200);
    });

    it('should return 404 if no protocol matches', async () => {
        const specializedGateway = new ObjectGateway();
        const response = await specializedGateway.handle({
            path: '/unknown',
            method: 'GET',
            headers: {},
            query: {}
        });
        
        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe('PROTOCOL_NOT_FOUND');
    });

    it('should apply request transformers', async () => {
        const req: ApiRequest = {
            path: '/original',
            method: 'GET',
            headers: {},
            query: {}
        };

        gateway.addRequestTransform(async (r) => {
            return { ...r, path: '/transformed' };
        });

        await gateway.handle(req);
        
        // Protocol should see the transformed request
        expect(mockProtocol.route).toHaveBeenCalledWith(expect.objectContaining({ path: '/transformed' }));
    });

    it('should apply response transformers', async () => {
        const req: ApiRequest = {
            path: '/test',
            method: 'GET',
            headers: {},
            query: {}
        };

        gateway.addResponseTransform(async (res) => {
            return { ...res, headers: { ...res.headers, 'X-Custom': 'Added' } };
        });

        const response = await gateway.handle(req);
        
        expect(response.headers?.['X-Custom']).toBe('Added');
    });
});
