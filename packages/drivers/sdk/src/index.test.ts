/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * SDK Driver Tests
 *
 * Test suite for the @objectql/sdk package covering RemoteDriver,
 * DataApiClient, MetadataApiClient, and exported interfaces.
 */

import { vi, type Mock } from 'vitest';
import {
    RemoteDriver,
    DataApiClient,
    MetadataApiClient,
    type Command,
    type CommandResult,
    type SdkConfig,
} from './index';

// ---------------------------------------------------------------------------
// Global fetch mock
// ---------------------------------------------------------------------------
const fetchMock = vi.fn() as Mock;
global.fetch = fetchMock;

function mockFetchJson(json: unknown, ok = true, status = 200, statusText = 'OK') {
    fetchMock.mockResolvedValueOnce({
        ok,
        status,
        statusText,
        json: async () => json,
    });
}

// ---------------------------------------------------------------------------
// RemoteDriver
// ---------------------------------------------------------------------------
describe('RemoteDriver', () => {
    const BASE = 'http://localhost:3000';
    let driver: RemoteDriver;

    beforeEach(() => {
        driver = new RemoteDriver(BASE);
        vi.clearAllMocks();
    });

    // -- Construction & configuration --------------------------------------
    describe('Construction', () => {
        it('should create instance with string URL', () => {
            expect(driver).toBeInstanceOf(RemoteDriver);
            expect(driver.name).toBe('RemoteDriver');
            expect(driver.version).toBe('4.0.0');
        });

        it('should accept SdkConfig object', () => {
            const cfg: SdkConfig = {
                baseUrl: BASE,
                token: 'tok',
                apiKey: 'key',
                timeout: 5000,
                enableRetry: true,
                maxRetries: 2,
                enableLogging: false,
            };
            const d = new RemoteDriver(cfg);
            expect(d).toBeInstanceOf(RemoteDriver);
        });

        it('should expose supports capabilities', () => {
            expect(driver.supports).toBeDefined();
            expect(driver.supports.transactions).toBe(false);
            expect(driver.supports.queryFilters).toBe(true);
        });

        it('should strip trailing slash from base URL', async () => {
            const d = new RemoteDriver('http://example.com/');
            mockFetchJson({ data: [] });
            await d.find('users', {});
            expect(fetchMock).toHaveBeenCalledWith(
                'http://example.com/api/objectql',
                expect.any(Object),
            );
        });
    });

    // -- Legacy RPC operations (find, findOne, create, update, delete, count)
    describe('find', () => {
        it('should POST to RPC endpoint and return data array', async () => {
            mockFetchJson({ data: [{ _id: '1', name: 'Alice' }] });
            const result = await driver.find('users', { where: { active: true } });

            expect(fetchMock).toHaveBeenCalledWith(
                `${BASE}/api/objectql`,
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        op: 'find',
                        object: 'users',
                        args: { where: { active: true } },
                    }),
                }),
            );
            expect(result).toEqual([{ _id: '1', name: 'Alice' }]);
        });

        it('should return empty array when server returns empty data', async () => {
            mockFetchJson({ data: [] });
            const result = await driver.find('users', {});
            expect(result).toEqual([]);
        });

        it('should throw ObjectQLError when response contains error', async () => {
            mockFetchJson({ error: { message: 'Object not found' } });
            await expect(driver.find('missing', {})).rejects.toThrow('Object not found');
        });
    });

    describe('findOne', () => {
        it('should fetch a single record by id', async () => {
            mockFetchJson({ data: { _id: '1', name: 'Alice' } });
            const result = await driver.findOne('users', '1');

            expect(fetchMock).toHaveBeenCalledWith(
                `${BASE}/api/objectql`,
                expect.objectContaining({
                    body: JSON.stringify({
                        op: 'findOne',
                        object: 'users',
                        args: { id: '1', query: undefined },
                    }),
                }),
            );
            expect(result).toEqual({ _id: '1', name: 'Alice' });
        });

        it('should return null when record not found', async () => {
            mockFetchJson({ data: null });
            expect(await driver.findOne('users', 'x')).toBeNull();
        });

        it('should accept numeric ids', async () => {
            mockFetchJson({ data: { _id: 42 } });
            await driver.findOne('users', 42);
            const body = JSON.parse((fetchMock.mock.calls[0][1] as any).body);
            expect(body.args.id).toBe(42);
        });
    });

    describe('create', () => {
        it('should create a record and return the result', async () => {
            const input = { name: 'Bob', email: 'bob@test.com' };
            mockFetchJson({ data: { _id: '2', ...input } });
            const result = await driver.create('users', input);
            expect(result._id).toBe('2');
            expect(result.name).toBe('Bob');
        });

        it('should propagate server validation errors', async () => {
            mockFetchJson({ error: { message: 'email is required' } });
            await expect(driver.create('users', {})).rejects.toThrow('email is required');
        });
    });

    describe('update', () => {
        it('should update and return the record', async () => {
            mockFetchJson({ data: { _id: '1', name: 'Updated' } });
            const result = await driver.update('users', '1', { name: 'Updated' });

            const body = JSON.parse((fetchMock.mock.calls[0][1] as any).body);
            expect(body).toEqual({
                op: 'update',
                object: 'users',
                args: { id: '1', data: { name: 'Updated' } },
            });
            expect(result.name).toBe('Updated');
        });

        it('should handle numeric id', async () => {
            mockFetchJson({ data: { _id: 7 } });
            await driver.update('users', 7, { role: 'admin' });
            const body = JSON.parse((fetchMock.mock.calls[0][1] as any).body);
            expect(body.args.id).toBe(7);
        });
    });

    describe('delete', () => {
        it('should delete a record and return affected count', async () => {
            mockFetchJson({ data: 1 });
            const result = await driver.delete('users', '1');
            expect(result).toBe(1);
        });

        it('should propagate not-found errors', async () => {
            mockFetchJson({ error: { message: 'Record not found' } });
            await expect(driver.delete('users', 'x')).rejects.toThrow('Record not found');
        });
    });

    describe('count', () => {
        it('should return record count', async () => {
            mockFetchJson({ data: 42 });
            const result = await driver.count('users', { active: true });
            expect(result).toBe(42);
        });

        it('should return 0 for empty collection', async () => {
            mockFetchJson({ data: 0 });
            expect(await driver.count('empty', {})).toBe(0);
        });
    });

    describe('createMany / updateMany / deleteMany', () => {
        it('should create many records', async () => {
            mockFetchJson({ data: [{ _id: '1' }, { _id: '2' }] });
            const result = await driver.createMany('users', [{ name: 'A' }, { name: 'B' }]);
            expect(result).toHaveLength(2);
        });

        it('should update many records', async () => {
            mockFetchJson({ data: { affected: 3 } });
            await driver.updateMany('users', { active: false }, { active: true });
            const body = JSON.parse((fetchMock.mock.calls[0][1] as any).body);
            expect(body.op).toBe('updateMany');
        });

        it('should delete many records', async () => {
            mockFetchJson({ data: { affected: 2 } });
            await driver.deleteMany('users', { status: 'deleted' });
            const body = JSON.parse((fetchMock.mock.calls[0][1] as any).body);
            expect(body.op).toBe('deleteMany');
        });
    });

    // -- DriverInterface v4 methods ----------------------------------------
    describe('executeQuery', () => {
        it('should POST QueryAST to /api/query and return results', async () => {
            const ast = { object: 'users', fields: ['name'] };
            mockFetchJson({ value: [{ name: 'Alice' }], count: 1 });
            const result = await driver.executeQuery(ast);

            expect(fetchMock).toHaveBeenCalledWith(
                `${BASE}/api/query`,
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(ast),
                }),
            );
            expect(result.value).toEqual([{ name: 'Alice' }]);
            expect(result.count).toBe(1);
        });

        it('should normalise data-wrapped responses', async () => {
            mockFetchJson({ data: [{ id: 1 }] });
            const result = await driver.executeQuery({ object: 'items' });
            expect(result.value).toEqual([{ id: 1 }]);
        });

        it('should normalise plain-array responses', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => [{ id: 2 }],
            });
            const result = await driver.executeQuery({ object: 'items' });
            expect(result.value).toEqual([{ id: 2 }]);
        });

        it('should include auth headers when configured', async () => {
            const d = new RemoteDriver({ baseUrl: BASE, token: 'tk', apiKey: 'ak' });
            mockFetchJson({ value: [] });
            await d.executeQuery({ object: 'x' });

            const headers = (fetchMock.mock.calls[0][1] as any).headers;
            expect(headers['Authorization']).toBe('Bearer tk');
            expect(headers['X-API-Key']).toBe('ak');
        });

        it('should throw on HTTP error with structured error body', async () => {
            mockFetchJson(
                { error: { code: 'NOT_FOUND', message: 'Not found' } },
                false, 404, 'Not Found',
            );
            await expect(driver.executeQuery({ object: 'x' })).rejects.toThrow('Not found');
        });
    });

    describe('executeCommand', () => {
        it('should POST command to /api/command', async () => {
            const cmd: Command = { type: 'create', object: 'users', data: { name: 'A' } };
            mockFetchJson({ success: true, data: { id: '1' }, affected: 1 });
            const result = await driver.executeCommand(cmd);

            expect(fetchMock).toHaveBeenCalledWith(
                `${BASE}/api/command`,
                expect.objectContaining({ method: 'POST', body: JSON.stringify(cmd) }),
            );
            expect(result.success).toBe(true);
            expect(result.affected).toBe(1);
        });

        it('should return failure result on error response', async () => {
            mockFetchJson({ error: { message: 'Validation failed' } });
            const result = await driver.executeCommand({
                type: 'create', object: 'users', data: {},
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('Validation failed');
        });

        it('should throw on HTTP-level error', async () => {
            mockFetchJson(
                { error: { message: 'Server error' } },
                false, 500, 'Internal Server Error',
            );
            await expect(
                driver.executeCommand({ type: 'delete', object: 'users', id: '1' }),
            ).rejects.toThrow('Server error');
        });
    });

    describe('executeCustomEndpoint', () => {
        it('should call custom endpoint path', async () => {
            mockFetchJson({ result: 'ok' });
            const result = await driver.executeCustomEndpoint('/api/custom', { a: 1 });

            expect(fetchMock).toHaveBeenCalledWith(
                `${BASE}/api/custom`,
                expect.objectContaining({ method: 'POST', body: JSON.stringify({ a: 1 }) }),
            );
            expect(result).toEqual({ result: 'ok' });
        });

        it('should default to /api/execute when no path given', async () => {
            mockFetchJson({ ok: true });
            await driver.executeCustomEndpoint(undefined, { action: 'test' });
            expect(fetchMock).toHaveBeenCalledWith(
                `${BASE}/api/execute`,
                expect.any(Object),
            );
        });

        it('should throw on error response', async () => {
            mockFetchJson(
                { error: { message: 'Server error' } },
                false, 500, 'Internal Server Error',
            );
            await expect(driver.executeCustomEndpoint('/api/x', {})).rejects.toThrow('Server error');
        });
    });

    // -- Error handling ----------------------------------------------------
    describe('Error handling', () => {
        it('should propagate network errors', async () => {
            fetchMock.mockRejectedValueOnce(new Error('Network error'));
            await expect(driver.find('users', {})).rejects.toThrow('Network error');
        });

        it('should propagate JSON parse errors', async () => {
            fetchMock.mockResolvedValueOnce({
                json: async () => { throw new Error('Invalid JSON'); },
            });
            await expect(driver.find('users', {})).rejects.toThrow('Invalid JSON');
        });
    });

    // -- Retry logic -------------------------------------------------------
    describe('Retry logic', () => {
        beforeEach(() => { vi.useFakeTimers(); });
        afterEach(() => { vi.useRealTimers(); });

        it('should retry on network errors when enabled', async () => {
            const d = new RemoteDriver({ baseUrl: BASE, enableRetry: true, maxRetries: 2 });

            fetchMock
                .mockRejectedValueOnce(new Error('Network error'))
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce({ ok: true, json: async () => ({ value: [], count: 0 }) });

            const promise = d.executeQuery({ object: 'users' });

            for (let i = 0; i < 2; i++) {
                await vi.runAllTimersAsync();
            }

            const result = await promise;
            expect(result.value).toEqual([]);
            expect(fetchMock).toHaveBeenCalledTimes(3);
        });

        it('should not retry on 400 validation errors', async () => {
            const d = new RemoteDriver({ baseUrl: BASE, enableRetry: true, maxRetries: 3 });

            mockFetchJson(
                { error: { code: 'VALIDATION_ERROR', message: 'Invalid data' } },
                false, 400, 'Bad Request',
            );

            await expect(d.executeQuery({ object: 'users' })).rejects.toThrow('Invalid data');
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });
    });
});

// ---------------------------------------------------------------------------
// DataApiClient
// ---------------------------------------------------------------------------
describe('DataApiClient', () => {
    let client: DataApiClient;
    const BASE = 'http://localhost:4000';

    beforeEach(() => {
        client = new DataApiClient({ baseUrl: BASE });
        vi.clearAllMocks();
    });

    describe('Construction', () => {
        it('should create instance with config', () => {
            expect(client).toBeInstanceOf(DataApiClient);
        });

        it('should strip trailing slash and accept custom dataPath', () => {
            const c = new DataApiClient({ baseUrl: `${BASE}/`, dataPath: '/v2/data' });
            expect(c).toBeInstanceOf(DataApiClient);
        });

        it('should include auth header when token provided', async () => {
            const c = new DataApiClient({ baseUrl: BASE, token: 'secret' });
            mockFetchJson({ data: [], total: 0 });
            await c.list('users');

            const headers = (fetchMock.mock.calls[0][1] as any).headers;
            expect(headers['Authorization']).toBe('Bearer secret');
        });
    });

    describe('list', () => {
        it('should GET /api/data/{object}', async () => {
            mockFetchJson({ data: [{ id: '1' }], total: 1 });
            const result = await client.list('users');

            const url = fetchMock.mock.calls[0][0] as string;
            expect(url).toContain(`${BASE}/api/data/users`);
            expect(result.data).toEqual([{ id: '1' }]);
        });

        it('should pass query params for filtering', async () => {
            mockFetchJson({ data: [], total: 0 });
            await client.list('users', { limit: 10, offset: 0 } as any);

            const url = fetchMock.mock.calls[0][0] as string;
            expect(url).toContain('limit=10');
        });
    });

    describe('get', () => {
        it('should GET /api/data/{object}/{id}', async () => {
            mockFetchJson({ data: { id: '1', name: 'Alice' } });
            const result = await client.get('users', '1');

            const url = fetchMock.mock.calls[0][0] as string;
            expect(url).toBe(`${BASE}/api/data/users/1`);
            expect(result.data).toEqual({ id: '1', name: 'Alice' });
        });
    });

    describe('create', () => {
        it('should POST to /api/data/{object}', async () => {
            const payload = { name: 'Bob' };
            mockFetchJson({ data: { id: '2', name: 'Bob' } });
            const result = await client.create('users', payload);

            expect(fetchMock).toHaveBeenCalledWith(
                `${BASE}/api/data/users`,
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(payload),
                }),
            );
            expect(result.data).toHaveProperty('id');
        });
    });

    describe('createMany', () => {
        it('should POST bulk records', async () => {
            const payload = { records: [{ name: 'A' }, { name: 'B' }] };
            mockFetchJson({ data: [{ id: '1' }, { id: '2' }], total: 2 });
            const result = await client.createMany('users', payload);
            expect(result.data).toHaveLength(2);
        });
    });

    describe('update', () => {
        it('should PUT to /api/data/{object}/{id}', async () => {
            mockFetchJson({ data: { id: '1', name: 'Updated' } });
            await client.update('users', '1', { name: 'Updated' });

            expect(fetchMock).toHaveBeenCalledWith(
                `${BASE}/api/data/users/1`,
                expect.objectContaining({ method: 'PUT' }),
            );
        });
    });

    describe('updateMany', () => {
        it('should POST to /api/data/{object}/bulk-update', async () => {
            mockFetchJson({ success: true, affected: 3 });
            await client.updateMany('users', { ids: ['1', '2', '3'], data: { active: true } } as any);

            const url = fetchMock.mock.calls[0][0] as string;
            expect(url).toBe(`${BASE}/api/data/users/bulk-update`);
        });
    });

    describe('delete', () => {
        it('should DELETE /api/data/{object}/{id}', async () => {
            mockFetchJson({ success: true, affected: 1 });
            await client.delete('users', '1');

            expect(fetchMock).toHaveBeenCalledWith(
                `${BASE}/api/data/users/1`,
                expect.objectContaining({ method: 'DELETE' }),
            );
        });
    });

    describe('deleteMany', () => {
        it('should POST to /api/data/{object}/bulk-delete', async () => {
            mockFetchJson({ success: true, affected: 2 });
            await client.deleteMany('users', { ids: ['1', '2'] } as any);

            const url = fetchMock.mock.calls[0][0] as string;
            expect(url).toBe(`${BASE}/api/data/users/bulk-delete`);
        });
    });

    describe('count', () => {
        it('should GET count with limit=0', async () => {
            mockFetchJson({ total: 99 });
            await client.count('users');

            const url = fetchMock.mock.calls[0][0] as string;
            expect(url).toContain('limit=0');
        });
    });

    describe('Error handling', () => {
        it('should throw ObjectQLError on error response', async () => {
            mockFetchJson({ error: { code: 'NOT_FOUND', message: 'Not found' } });
            await expect(client.get('users', 'x')).rejects.toThrow('Not found');
        });

        it('should propagate network errors', async () => {
            fetchMock.mockRejectedValueOnce(new Error('Offline'));
            await expect(client.list('users')).rejects.toThrow('Offline');
        });
    });
});

// ---------------------------------------------------------------------------
// MetadataApiClient
// ---------------------------------------------------------------------------
describe('MetadataApiClient', () => {
    let client: MetadataApiClient;
    const BASE = 'http://localhost:5000';

    beforeEach(() => {
        client = new MetadataApiClient({ baseUrl: BASE });
        vi.clearAllMocks();
    });

    describe('Construction', () => {
        it('should create instance with defaults', () => {
            expect(client).toBeInstanceOf(MetadataApiClient);
        });

        it('should accept custom metadataPath', () => {
            const c = new MetadataApiClient({ baseUrl: BASE, metadataPath: '/v2/meta' });
            expect(c).toBeInstanceOf(MetadataApiClient);
        });

        it('should include auth header when token provided', async () => {
            const c = new MetadataApiClient({ baseUrl: BASE, token: 'tok' });
            mockFetchJson({ data: [] });
            await c.listObjects();

            const headers = (fetchMock.mock.calls[0][1] as any).headers;
            expect(headers['Authorization']).toBe('Bearer tok');
        });
    });

    describe('listObjects', () => {
        it('should GET /api/metadata/objects', async () => {
            mockFetchJson({ data: [{ name: 'users' }, { name: 'projects' }] });
            const result = await client.listObjects();

            expect(fetchMock).toHaveBeenCalledWith(
                `${BASE}/api/metadata/objects`,
                expect.objectContaining({ method: 'GET' }),
            );
            expect(result.data).toHaveLength(2);
        });
    });

    describe('getObject', () => {
        it('should GET /api/metadata/object/{name}', async () => {
            mockFetchJson({ data: { name: 'users', fields: [] } });
            const result = await client.getObject('users');

            expect(fetchMock).toHaveBeenCalledWith(
                `${BASE}/api/metadata/object/users`,
                expect.any(Object),
            );
            expect(result.data).toHaveProperty('name', 'users');
        });
    });

    describe('getField', () => {
        it('should GET /api/metadata/object/{obj}/fields/{field}', async () => {
            mockFetchJson({ data: { name: 'email', type: 'string' } });
            const result = await client.getField('users', 'email');

            expect(fetchMock).toHaveBeenCalledWith(
                `${BASE}/api/metadata/object/users/fields/email`,
                expect.any(Object),
            );
            expect(result.data).toHaveProperty('type', 'string');
        });
    });

    describe('listActions', () => {
        it('should GET /api/metadata/object/{obj}/actions', async () => {
            mockFetchJson({ data: [{ name: 'approve' }] });
            const result = await client.listActions('orders');

            expect(fetchMock).toHaveBeenCalledWith(
                `${BASE}/api/metadata/object/orders/actions`,
                expect.any(Object),
            );
            expect(result.data).toHaveLength(1);
        });
    });

    describe('listByType', () => {
        it('should GET /api/metadata/{type}', async () => {
            mockFetchJson({ data: [{ id: '1' }] });
            await client.listByType('permissions');

            expect(fetchMock).toHaveBeenCalledWith(
                `${BASE}/api/metadata/permissions`,
                expect.any(Object),
            );
        });
    });

    describe('getMetadata', () => {
        it('should GET /api/metadata/{type}/{id}', async () => {
            mockFetchJson({ data: { id: 'p1', name: 'admin' } });
            await client.getMetadata('permissions', 'p1');

            expect(fetchMock).toHaveBeenCalledWith(
                `${BASE}/api/metadata/permissions/p1`,
                expect.any(Object),
            );
        });
    });

    describe('Error handling', () => {
        it('should throw ObjectQLError on error response', async () => {
            mockFetchJson({ error: { code: 'NOT_FOUND', message: 'Object not found' } });
            await expect(client.getObject('missing')).rejects.toThrow('Object not found');
        });
    });
});

// ---------------------------------------------------------------------------
// Command / CommandResult interfaces (compile-time shape validation)
// ---------------------------------------------------------------------------
describe('Command and CommandResult interfaces', () => {
    it('should accept valid Command shapes', () => {
        const createCmd: Command = { type: 'create', object: 'users', data: { name: 'A' } };
        const updateCmd: Command = { type: 'update', object: 'users', id: '1', data: { name: 'B' } };
        const deleteCmd: Command = { type: 'delete', object: 'users', id: '1' };
        const bulkCreateCmd: Command = { type: 'bulkCreate', object: 'users', records: [{ name: 'C' }] };
        const bulkUpdateCmd: Command = {
            type: 'bulkUpdate', object: 'users',
            updates: [{ id: '1', data: { active: true } }],
        };
        const bulkDeleteCmd: Command = { type: 'bulkDelete', object: 'users', ids: ['1', '2'] };

        expect(createCmd.type).toBe('create');
        expect(updateCmd.type).toBe('update');
        expect(deleteCmd.type).toBe('delete');
        expect(bulkCreateCmd.type).toBe('bulkCreate');
        expect(bulkUpdateCmd.type).toBe('bulkUpdate');
        expect(bulkDeleteCmd.type).toBe('bulkDelete');
    });

    it('should accept valid CommandResult shapes', () => {
        const success: CommandResult = { success: true, affected: 1, data: { id: '1' } };
        const failure: CommandResult = { success: false, affected: 0, error: 'Something went wrong' };

        expect(success.success).toBe(true);
        expect(failure.error).toBeDefined();
    });
});

// ---------------------------------------------------------------------------
// SdkConfig interface
// ---------------------------------------------------------------------------
describe('SdkConfig interface', () => {
    it('should require baseUrl and allow optional fields', () => {
        const minimal: SdkConfig = { baseUrl: 'http://localhost:3000' };
        const full: SdkConfig = {
            baseUrl: 'http://localhost:3000',
            rpcPath: '/rpc',
            queryPath: '/q',
            commandPath: '/cmd',
            executePath: '/exec',
            token: 'tok',
            apiKey: 'key',
            headers: { 'X-Custom': 'val' },
            timeout: 5000,
            enableRetry: true,
            maxRetries: 5,
            enableLogging: true,
        };

        expect(minimal.baseUrl).toBeDefined();
        expect(full.enableRetry).toBe(true);
    });

    it('should use custom paths when provided to RemoteDriver', async () => {
        const d = new RemoteDriver({
            baseUrl: 'http://localhost:3000',
            queryPath: '/custom/query',
            commandPath: '/custom/cmd',
        });

        mockFetchJson({ value: [], count: 0 });
        await d.executeQuery({ object: 'x' });
        expect(fetchMock).toHaveBeenCalledWith(
            'http://localhost:3000/custom/query',
            expect.any(Object),
        );

        vi.clearAllMocks();
        mockFetchJson({ success: true, affected: 0 });
        await d.executeCommand({ type: 'create', object: 'x', data: {} });
        expect(fetchMock).toHaveBeenCalledWith(
            'http://localhost:3000/custom/cmd',
            expect.any(Object),
        );
    });
});
