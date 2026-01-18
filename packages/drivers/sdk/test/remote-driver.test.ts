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
});
