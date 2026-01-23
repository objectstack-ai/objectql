/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RemoteDriver } from '../src/index';

// Mock fetch globally
global.fetch = jest.fn();

describe('RemoteDriver', () => {
    let driver: RemoteDriver;
    const baseUrl = 'http://localhost:3000';

    beforeEach(() => {
        driver = new RemoteDriver(baseUrl);
        jest.clearAllMocks();
    });

    describe('Constructor', () => {
        it('should create instance with base URL', () => {
            expect(driver).toBeDefined();
            expect(driver).toBeInstanceOf(RemoteDriver);
        });

        it('should handle base URL with trailing slash', () => {
            const driverWithSlash = new RemoteDriver('http://localhost:3000/');
            expect(driverWithSlash).toBeDefined();
        });
    });

    describe('find', () => {
        it('should fetch multiple records', async () => {
            const mockResponse = {
                data: [
                    { _id: '1', name: 'Alice' },
                    { _id: '2', name: 'Bob' }
                ]
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                json: async () => mockResponse
            });

            const result = await driver.find('user', { filters: [['name', '=', 'Alice']] });

            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:3000/api/objectql',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        op: 'find',
                        object: 'user',
                        args: { filters: [['name', '=', 'Alice']] }
                    })
                })
            );
            expect(result).toEqual(mockResponse.data);
        });

        it('should handle empty result', async () => {
            const mockResponse = { data: [] };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                json: async () => mockResponse
            });

            const result = await driver.find('user', {});
            expect(result).toEqual([]);
        });

        it('should throw error when server returns error', async () => {
            const mockResponse = {
                error: { message: 'Object not found' }
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                json: async () => mockResponse
            });

            await expect(driver.find('unknown', {}))
                .rejects
                .toThrow('Object not found');
        });
    });

    describe('findOne', () => {
        it('should fetch single record by id', async () => {
            const mockResponse = {
                data: { _id: '1', name: 'Alice', email: 'alice@example.com' }
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                json: async () => mockResponse
            });

            const result = await driver.findOne('user', '1');

            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:3000/api/objectql',
                expect.objectContaining({
                    body: JSON.stringify({
                        op: 'findOne',
                        object: 'user',
                        args: { id: '1', query: undefined }
                    })
                })
            );
            expect(result).toEqual(mockResponse.data);
        });

        it('should return null when record not found', async () => {
            const mockResponse = { data: null };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                json: async () => mockResponse
            });

            const result = await driver.findOne('user', 'non-existent');
            expect(result).toBeNull();
        });

        it('should handle numeric id', async () => {
            const mockResponse = {
                data: { _id: 123, name: 'Test' }
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                json: async () => mockResponse
            });

            const result = await driver.findOne('user', 123);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:3000/api/objectql',
                expect.objectContaining({
                    body: JSON.stringify({
                        op: 'findOne',
                        object: 'user',
                        args: { id: 123, query: undefined }
                    })
                })
            );
            expect(result).toEqual(mockResponse.data);
        });
    });

    describe('create', () => {
        it('should create a new record', async () => {
            const newData = { name: 'Charlie', email: 'charlie@example.com' };
            const mockResponse = {
                data: { _id: '3', ...newData }
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                json: async () => mockResponse
            });

            const result = await driver.create('user', newData);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:3000/api/objectql',
                expect.objectContaining({
                    body: JSON.stringify({
                        op: 'create',
                        object: 'user',
                        args: newData
                    })
                })
            );
            expect(result).toEqual(mockResponse.data);
            expect(result._id).toBeDefined();
        });

        it('should handle validation errors', async () => {
            const mockResponse = {
                error: { message: 'Validation failed: email is required' }
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                json: async () => mockResponse
            });

            await expect(driver.create('user', { name: 'Test' }))
                .rejects
                .toThrow('Validation failed: email is required');
        });
    });

    describe('update', () => {
        it('should update an existing record', async () => {
            const updateData = { name: 'Alice Updated' };
            const mockResponse = {
                data: { _id: '1', name: 'Alice Updated', email: 'alice@example.com' }
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                json: async () => mockResponse
            });

            const result = await driver.update('user', '1', updateData);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:3000/api/objectql',
                expect.objectContaining({
                    body: JSON.stringify({
                        op: 'update',
                        object: 'user',
                        args: { id: '1', data: updateData }
                    })
                })
            );
            expect(result).toEqual(mockResponse.data);
        });

        it('should handle update of non-existent record', async () => {
            const mockResponse = {
                error: { message: 'Record not found' }
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                json: async () => mockResponse
            });

            await expect(driver.update('user', 'non-existent', { name: 'Test' }))
                .rejects
                .toThrow('Record not found');
        });

        it('should handle numeric id in update', async () => {
            const mockResponse = {
                data: { _id: 123, name: 'Updated' }
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                json: async () => mockResponse
            });

            await driver.update('user', 123, { name: 'Updated' });

            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:3000/api/objectql',
                expect.objectContaining({
                    body: JSON.stringify({
                        op: 'update',
                        object: 'user',
                        args: { id: 123, data: { name: 'Updated' } }
                    })
                })
            );
        });
    });

    describe('delete', () => {
        it('should delete a record', async () => {
            const mockResponse = { data: 1 };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                json: async () => mockResponse
            });

            const result = await driver.delete('user', '1');

            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:3000/api/objectql',
                expect.objectContaining({
                    body: JSON.stringify({
                        op: 'delete',
                        object: 'user',
                        args: { id: '1' }
                    })
                })
            );
            expect(result).toBe(1);
        });

        it('should handle delete of non-existent record', async () => {
            const mockResponse = {
                error: { message: 'Record not found' }
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                json: async () => mockResponse
            });

            await expect(driver.delete('user', 'non-existent'))
                .rejects
                .toThrow('Record not found');
        });

        it('should handle numeric id in delete', async () => {
            const mockResponse = { data: 1 };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                json: async () => mockResponse
            });

            await driver.delete('user', 999);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:3000/api/objectql',
                expect.objectContaining({
                    body: JSON.stringify({
                        op: 'delete',
                        object: 'user',
                        args: { id: 999 }
                    })
                })
            );
        });
    });

    describe('count', () => {
        it('should count records', async () => {
            const mockResponse = { data: 42 };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                json: async () => mockResponse
            });

            const result = await driver.count('user', { filters: [['active', '=', true]] });

            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:3000/api/objectql',
                expect.objectContaining({
                    body: JSON.stringify({
                        op: 'count',
                        object: 'user',
                        args: { filters: [['active', '=', true]] }
                    })
                })
            );
            expect(result).toBe(42);
        });

        it('should count all records when no filters', async () => {
            const mockResponse = { data: 100 };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                json: async () => mockResponse
            });

            const result = await driver.count('user', {});
            expect(result).toBe(100);
        });

        it('should return 0 for empty collection', async () => {
            const mockResponse = { data: 0 };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                json: async () => mockResponse
            });

            const result = await driver.count('empty_collection', {});
            expect(result).toBe(0);
        });
    });

    describe('Error Handling', () => {
        it('should handle network errors', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

            await expect(driver.find('user', {}))
                .rejects
                .toThrow('Network error');
        });

        it('should handle invalid JSON response', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                json: async () => { throw new Error('Invalid JSON'); }
            });

            await expect(driver.find('user', {}))
                .rejects
                .toThrow('Invalid JSON');
        });

        it('should handle server errors with custom error messages', async () => {
            const mockResponse = {
                error: { 
                    message: 'Internal server error',
                    code: 'SERVER_ERROR'
                }
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                json: async () => mockResponse
            });

            await expect(driver.create('user', {}))
                .rejects
                .toThrow('Internal server error');
        });
    });

    describe('Base URL Handling', () => {
        it('should remove trailing slash from base URL', async () => {
            const driverWithSlash = new RemoteDriver('http://example.com/');
            const mockResponse = { data: [] };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                json: async () => mockResponse
            });

            await driverWithSlash.find('user', {});

            expect(global.fetch).toHaveBeenCalledWith(
                'http://example.com/api/objectql',
                expect.any(Object)
            );
        });

        it('should work with different protocols', async () => {
            const httpsDriver = new RemoteDriver('https://secure.example.com');
            const mockResponse = { data: [] };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                json: async () => mockResponse
            });

            await httpsDriver.find('user', {});

            expect(global.fetch).toHaveBeenCalledWith(
                'https://secure.example.com/api/objectql',
                expect.any(Object)
            );
        });

        it('should work with custom ports', async () => {
            const customPortDriver = new RemoteDriver('http://localhost:8080');
            const mockResponse = { data: [] };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                json: async () => mockResponse
            });

            await customPortDriver.find('user', {});

            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:8080/api/objectql',
                expect.any(Object)
            );
        });
    });

    describe('executeQuery', () => {
        it('should execute a QueryAST and return results', async () => {
            const queryAST = {
                object: 'users',
                fields: ['name', 'email'],
                filters: {
                    type: 'comparison' as const,
                    field: 'status',
                    operator: '=',
                    value: 'active'
                },
                sort: [{ field: 'created_at', order: 'desc' as const }],
                top: 10
            };

            const mockResponse = {
                value: [
                    { name: 'Alice', email: 'alice@example.com' },
                    { name: 'Bob', email: 'bob@example.com' }
                ],
                count: 2
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await driver.executeQuery(queryAST);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:3000/api/query',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json'
                    }),
                    body: JSON.stringify(queryAST)
                })
            );
            expect(result).toEqual(mockResponse);
        });

        it('should handle authentication headers in executeQuery', async () => {
            const driverWithAuth = new RemoteDriver({
                baseUrl: 'http://localhost:3000',
                token: 'test-token',
                apiKey: 'test-api-key'
            });

            const queryAST = {
                object: 'users',
                fields: ['name']
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ value: [], count: 0 })
            });

            await driverWithAuth.executeQuery(queryAST);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:3000/api/query',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer test-token',
                        'X-API-Key': 'test-api-key'
                    })
                })
            );
        });

        it('should handle different response formats in executeQuery', async () => {
            const queryAST = { object: 'users' };

            // Test data response format
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ data: [{ id: 1 }] })
            });

            let result = await driver.executeQuery(queryAST);
            expect(result.value).toEqual([{ id: 1 }]);

            // Test direct array response
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => [{ id: 2 }]
            });

            result = await driver.executeQuery(queryAST);
            expect(result.value).toEqual([{ id: 2 }]);
        });

        it('should handle errors in executeQuery', async () => {
            const queryAST = { object: 'users' };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: 'Not Found',
                json: async () => ({
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Object not found'
                    }
                })
            });

            await expect(driver.executeQuery(queryAST))
                .rejects
                .toThrow('Object not found');
        });
    });

    describe('executeCommand', () => {
        it('should execute a create command', async () => {
            const command = {
                type: 'create' as const,
                object: 'users',
                data: { name: 'Alice', email: 'alice@example.com' }
            };

            const mockResponse = {
                success: true,
                data: { id: '1', name: 'Alice', email: 'alice@example.com' },
                affected: 1
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await driver.executeCommand(command);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:3000/api/command',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json'
                    }),
                    body: JSON.stringify(command)
                })
            );
            expect(result).toEqual(mockResponse);
        });

        it('should execute a bulkUpdate command', async () => {
            const command = {
                type: 'bulkUpdate' as const,
                object: 'users',
                updates: [
                    { id: '1', data: { status: 'active' } },
                    { id: '2', data: { status: 'inactive' } }
                ]
            };

            const mockResponse = {
                success: true,
                affected: 2
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await driver.executeCommand(command);

            expect(result.success).toBe(true);
            expect(result.affected).toBe(2);
        });

        it('should handle command errors', async () => {
            const command = {
                type: 'create' as const,
                object: 'users',
                data: { name: 'Test' }
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    error: {
                        message: 'Validation failed',
                        code: 'VALIDATION_ERROR'
                    }
                })
            });

            const result = await driver.executeCommand(command);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Validation failed');
        });

        it('should handle HTTP errors in executeCommand', async () => {
            const command = {
                type: 'delete' as const,
                object: 'users',
                id: '999'
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: 'Not Found',
                json: async () => ({
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Record not found'
                    }
                })
            });

            await expect(driver.executeCommand(command))
                .rejects
                .toThrow('Record not found');
        });
    });

    describe('execute', () => {
        it('should execute custom endpoint', async () => {
            const payload = {
                action: 'calculateMetrics',
                params: { year: 2024 }
            };

            const mockResponse = {
                result: { total: 1000 }
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await driver.execute('/api/custom', payload);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:3000/api/custom',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(payload)
                })
            );
            expect(result).toEqual(mockResponse);
        });

        it('should use default execute endpoint when not specified', async () => {
            const payload = { action: 'test' };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true })
            });

            await driver.execute(undefined, payload);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:3000/api/execute',
                expect.any(Object)
            );
        });

        it('should handle errors in execute', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                json: async () => ({
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: 'Server error'
                    }
                })
            });

            await expect(driver.execute('/api/test', {}))
                .rejects
                .toThrow('Server error');
        });
    });

    describe('Authentication', () => {
        it('should support token-based authentication', async () => {
            const driverWithToken = new RemoteDriver({
                baseUrl: 'http://localhost:3000',
                token: 'my-secret-token'
            });

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ value: [], count: 0 })
            });

            await driverWithToken.executeQuery({ object: 'users' });

            expect(global.fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer my-secret-token'
                    })
                })
            );
        });

        it('should support API key authentication', async () => {
            const driverWithApiKey = new RemoteDriver({
                baseUrl: 'http://localhost:3000',
                apiKey: 'my-api-key'
            });

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ value: [], count: 0 })
            });

            await driverWithApiKey.executeQuery({ object: 'users' });

            expect(global.fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'X-API-Key': 'my-api-key'
                    })
                })
            );
        });

        it('should support both token and API key', async () => {
            const driverWithBoth = new RemoteDriver({
                baseUrl: 'http://localhost:3000',
                token: 'my-token',
                apiKey: 'my-api-key'
            });

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ value: [], count: 0 })
            });

            await driverWithBoth.executeQuery({ object: 'users' });

            expect(global.fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer my-token',
                        'X-API-Key': 'my-api-key'
                    })
                })
            );
        });
    });

    describe('Retry Logic', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should retry on network errors when enabled', async () => {
            const driverWithRetry = new RemoteDriver({
                baseUrl: 'http://localhost:3000',
                enableRetry: true,
                maxRetries: 2
            });

            // First two attempts fail, third succeeds
            (global.fetch as jest.Mock)
                .mockRejectedValueOnce(new Error('Network error'))
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ value: [], count: 0 })
                });

            const promise = driverWithRetry.executeQuery({ object: 'users' });
            
            // Fast-forward through retries
            await jest.runAllTimersAsync();
            
            const result = await promise;

            expect(result.value).toEqual([]);
            expect(global.fetch).toHaveBeenCalledTimes(3);
        });

        it('should not retry on validation errors', async () => {
            const driverWithRetry = new RemoteDriver({
                baseUrl: 'http://localhost:3000',
                enableRetry: true,
                maxRetries: 3
            });

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                json: async () => ({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid data'
                    }
                })
            });

            await expect(driverWithRetry.executeQuery({ object: 'users' }))
                .rejects
                .toThrow('Invalid data');

            // Should only be called once, no retries
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });
    });

    describe('Config-based Constructor', () => {
        it('should accept config object', () => {
            const driver = new RemoteDriver({
                baseUrl: 'http://localhost:3000',
                queryPath: '/custom/query',
                commandPath: '/custom/command',
                timeout: 60000
            });

            expect(driver).toBeDefined();
            expect(driver.version).toBe('4.0.0');
        });

        it('should use default paths when not specified', () => {
            const driver = new RemoteDriver({
                baseUrl: 'http://localhost:3000'
            });

            expect(driver).toBeDefined();
        });
    });
});
