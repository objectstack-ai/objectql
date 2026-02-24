/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TursoPlatformAPI } from '../src/turso-platform-api';
import { ObjectQLError } from '@objectql/types';

describe('TursoPlatformAPI - Configuration', () => {
    it('should throw CONFIG_ERROR if orgSlug is missing', () => {
        expect(() => {
            new TursoPlatformAPI({ orgSlug: '', apiToken: 'token' });
        }).toThrow(ObjectQLError);
        expect(() => {
            new TursoPlatformAPI({ orgSlug: '', apiToken: 'token' });
        }).toThrow('orgSlug');
    });

    it('should throw CONFIG_ERROR if apiToken is missing', () => {
        expect(() => {
            new TursoPlatformAPI({ orgSlug: 'my-org', apiToken: '' });
        }).toThrow(ObjectQLError);
        expect(() => {
            new TursoPlatformAPI({ orgSlug: 'my-org', apiToken: '' });
        }).toThrow('apiToken');
    });

    it('should create instance with valid config', () => {
        const api = new TursoPlatformAPI({
            orgSlug: 'my-org',
            apiToken: 'test-token',
        });
        expect(api).toBeDefined();
    });

    it('should accept custom baseUrl', () => {
        const api = new TursoPlatformAPI({
            orgSlug: 'my-org',
            apiToken: 'test-token',
            baseUrl: 'https://custom-api.example.com',
        });
        expect(api).toBeDefined();
    });
});

describe('TursoPlatformAPI - API Methods (mocked fetch)', () => {
    let api: TursoPlatformAPI;

    beforeEach(() => {
        api = new TursoPlatformAPI({
            orgSlug: 'test-org',
            apiToken: 'test-token',
        });
    });

    it('should call createDatabase with correct URL and body', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                database: { Hostname: 'mydb-test-org.turso.io', Name: 'mydb' },
            }),
        });
        vi.stubGlobal('fetch', mockFetch);

        const result = await api.createDatabase('mydb', 'default');

        expect(result.hostname).toBe('mydb-test-org.turso.io');
        expect(result.name).toBe('mydb');
        expect(mockFetch).toHaveBeenCalledWith(
            'https://api.turso.tech/v1/organizations/test-org/databases',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ name: 'mydb', group: 'default' }),
            })
        );

        vi.unstubAllGlobals();
    });

    it('should call deleteDatabase with correct URL', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({}),
        });
        vi.stubGlobal('fetch', mockFetch);

        await api.deleteDatabase('mydb');

        expect(mockFetch).toHaveBeenCalledWith(
            'https://api.turso.tech/v1/organizations/test-org/databases/mydb',
            expect.objectContaining({ method: 'DELETE' })
        );

        vi.unstubAllGlobals();
    });

    it('should call createToken with correct URL and options', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ jwt: 'test-jwt-token' }),
        });
        vi.stubGlobal('fetch', mockFetch);

        const result = await api.createToken('mydb', { expiration: '2w', authorization: 'read-only' });

        expect(result.jwt).toBe('test-jwt-token');
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('expiration=2w'),
            expect.any(Object)
        );
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('authorization=read-only'),
            expect.any(Object)
        );

        vi.unstubAllGlobals();
    });

    it('should call listDatabases and map response', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                databases: [
                    { Name: 'db1', Hostname: 'db1-org.turso.io', group: 'default' },
                    { Name: 'db2', Hostname: 'db2-org.turso.io' },
                ],
            }),
        });
        vi.stubGlobal('fetch', mockFetch);

        const result = await api.listDatabases();

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('db1');
        expect(result[0].hostname).toBe('db1-org.turso.io');
        expect(result[0].group).toBe('default');
        expect(result[1].name).toBe('db2');

        vi.unstubAllGlobals();
    });

    it('should throw ObjectQLError on HTTP error', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 404,
            statusText: 'Not Found',
            json: () => Promise.resolve({ error: 'database not found' }),
        });
        vi.stubGlobal('fetch', mockFetch);

        await expect(api.deleteDatabase('nonexistent')).rejects.toThrow(ObjectQLError);
        await expect(api.deleteDatabase('nonexistent')).rejects.toThrow('404');

        vi.unstubAllGlobals();
    });

    it('should throw ObjectQLError on network failure', async () => {
        const mockFetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
        vi.stubGlobal('fetch', mockFetch);

        await expect(api.listDatabases()).rejects.toThrow(ObjectQLError);
        await expect(api.listDatabases()).rejects.toThrow('ECONNREFUSED');

        vi.unstubAllGlobals();
    });
});
