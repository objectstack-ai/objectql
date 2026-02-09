/**
 * JSON-RPC 2.0 Protocol - Feature Tests (E2E)
 * 
 * Tests for work plan features:
 * 1. object.count() method (P0)
 * 2. action.execute() method (P0)
 * 3. Batch request support per JSON-RPC spec §6 (P1)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { JSONRPCPlugin } from './index';
import { MemoryDriver } from '@objectql/driver-memory';

// Mock kernel with Memory Driver and action support
const createTestKernel = () => {
    const driver = new MemoryDriver();
    
    const metadata = {
        register: (_type: string, _name: string, _item: any) => {},
        list: (type: string) => {
            if (type === 'object') {
                return [
                    {
                        content: {
                            name: 'products',
                            fields: {
                                id: { type: 'text', label: 'ID' },
                                name: { type: 'text', label: 'Name' },
                                price: { type: 'number', label: 'Price' },
                                category: { type: 'select', label: 'Category', options: ['electronics', 'books', 'clothing'] },
                                inStock: { type: 'boolean', label: 'In Stock' }
                            }
                        }
                    }
                ];
            }
            return [];
        },
        get: (type: string, name: string) => {
            if (type === 'object' && name === 'products') {
                return {
                    content: {
                        name: 'products',
                        fields: {
                            id: { type: 'text' },
                            name: { type: 'text' },
                            price: { type: 'number' },
                            category: { type: 'select', options: ['electronics', 'books', 'clothing'] },
                            inStock: { type: 'boolean' }
                        }
                    }
                };
            }
            return null;
        }
    };
    
    const repository = {
        find: async (objectName: string, query: any) => driver.find(objectName, query),
        findOne: async (objectName: string, id: string) => driver.findOne(objectName, id),
        create: async (objectName: string, data: any) => driver.create(objectName, data),
        update: async (objectName: string, id: string, data: any) => driver.update(objectName, id, data),
        delete: async (objectName: string, id: string) => driver.delete(objectName, id),
        count: async (objectName: string, filters: any) => driver.count(objectName, filters),
    };
    
    // Mock action registry
    const actions = new Map<string, Function>();
    actions.set('sendEmail', async (params: any) => {
        return {
            success: true,
            messageId: `msg_${Date.now()}`,
            to: params.to,
            subject: params.subject
        };
    });
    actions.set('calculateDiscount', async (params: any) => {
        const discount = params.amount * (params.percentage / 100);
        return {
            originalAmount: params.amount,
            discountPercentage: params.percentage,
            discountAmount: discount,
            finalAmount: params.amount - discount
        };
    });
    actions.set('processPayment', async (params: any) => {
        if (!params.amount || params.amount <= 0) {
            throw new Error('Invalid payment amount');
        }
        return {
            transactionId: `txn_${Date.now()}`,
            amount: params.amount,
            status: 'completed'
        };
    });
    
    return {
        metadata,
        repository,
        driver,
        executeAction: async (actionName: string, params: any) => {
            const action = actions.get(actionName);
            if (!action) {
                throw new Error(`Action not found: ${actionName}`);
            }
            return await action(params);
        },
        listActions: async () => {
            return Array.from(actions.keys());
        }
    };
};

describe('JSON-RPC Features - E2E Tests', () => {
    let plugin: JSONRPCPlugin;
    let kernel: any;
    const TEST_PORT = 14100;
    const BASE_URL = `http://localhost:${TEST_PORT}/rpc`;
    
    beforeAll(async () => {
        kernel = createTestKernel();
        
        plugin = new JSONRPCPlugin({
            port: TEST_PORT,
            basePath: '/rpc',
            enableIntrospection: true,
            enableChaining: true
        });
        
        await plugin.install?.({ engine: kernel });
        await plugin.onStart?.({ engine: kernel });
        
        // Wait for server to start
        await new Promise(resolve => setTimeout(resolve, 1000));
    });
    
    afterAll(async () => {
        if (plugin) {
            await plugin.onStop?.({ engine: kernel });
        }
    });
    
    beforeEach(async () => {
        if (kernel?.driver) {
            await kernel.driver.clear();
        }
    });
    
    describe('Feature 1: object.count() Method', () => {
        beforeEach(async () => {
            // Seed test data
            await kernel.repository.create('products', {
                id: 'prod-1',
                name: 'Laptop',
                price: 999,
                category: 'electronics',
                inStock: true
            });
            await kernel.repository.create('products', {
                id: 'prod-2',
                name: 'Book',
                price: 29,
                category: 'books',
                inStock: true
            });
            await kernel.repository.create('products', {
                id: 'prod-3',
                name: 'Headphones',
                price: 199,
                category: 'electronics',
                inStock: false
            });
            await kernel.repository.create('products', {
                id: 'prod-4',
                name: 'T-Shirt',
                price: 25,
                category: 'clothing',
                inStock: true
            });
        });
        
        it('should count all records without filters', async () => {
            const request = {
                jsonrpc: '2.0',
                method: 'object.count',
                params: ['products'],
                id: 1
            };
            
            const response = await fetch(BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });
            
            const result = await response.json();
            
            expect(result.jsonrpc).toBe('2.0');
            expect(result.id).toBe(1);
            expect(result.result).toBe(4);
        });
        
        it('should count records with simple filter', async () => {
            const request = {
                jsonrpc: '2.0',
                method: 'object.count',
                params: ['products', {
                    type: 'comparison',
                    field: 'category',
                    operator: '=',
                    value: 'electronics'
                }],
                id: 2
            };
            
            const response = await fetch(BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });
            
            const result = await response.json();
            
            expect(result.jsonrpc).toBe('2.0');
            expect(result.id).toBe(2);
            expect(result.result).toBe(2);
        });
        
        it('should count records with complex filter', async () => {
            const request = {
                jsonrpc: '2.0',
                method: 'object.count',
                params: ['products', {
                    type: 'logical',
                    operator: 'and',
                    conditions: [
                        {
                            type: 'comparison',
                            field: 'inStock',
                            operator: '=',
                            value: true
                        },
                        {
                            type: 'comparison',
                            field: 'price',
                            operator: '>',
                            value: 50
                        }
                    ]
                }],
                id: 3
            };
            
            const response = await fetch(BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });
            
            const result = await response.json();
            
            expect(result.jsonrpc).toBe('2.0');
            expect(result.id).toBe(3);
            expect(result.result).toBe(1); // Only Laptop matches
        });
        
        it('should return 0 for no matches', async () => {
            const request = {
                jsonrpc: '2.0',
                method: 'object.count',
                params: ['products', {
                    type: 'comparison',
                    field: 'category',
                    operator: '=',
                    value: 'furniture'
                }],
                id: 4
            };
            
            const response = await fetch(BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });
            
            const result = await response.json();
            
            expect(result.jsonrpc).toBe('2.0');
            expect(result.id).toBe(4);
            expect(result.result).toBe(0);
        });
    });
    
    describe('Feature 2: action.execute() Method', () => {
        it('should execute simple action', async () => {
            const request = {
                jsonrpc: '2.0',
                method: 'action.execute',
                params: ['sendEmail', {
                    to: 'user@example.com',
                    subject: 'Test Email'
                }],
                id: 1
            };
            
            const response = await fetch(BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });
            
            const result = await response.json();
            
            expect(result.jsonrpc).toBe('2.0');
            expect(result.id).toBe(1);
            expect(result.result).toBeDefined();
            expect(result.result.success).toBe(true);
            expect(result.result.to).toBe('user@example.com');
            expect(result.result.subject).toBe('Test Email');
            expect(result.result.messageId).toMatch(/^msg_/);
        });
        
        it('should execute action with calculations', async () => {
            const request = {
                jsonrpc: '2.0',
                method: 'action.execute',
                params: ['calculateDiscount', {
                    amount: 100,
                    percentage: 20
                }],
                id: 2
            };
            
            const response = await fetch(BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });
            
            const result = await response.json();
            
            expect(result.jsonrpc).toBe('2.0');
            expect(result.id).toBe(2);
            expect(result.result).toBeDefined();
            expect(result.result.originalAmount).toBe(100);
            expect(result.result.discountPercentage).toBe(20);
            expect(result.result.discountAmount).toBe(20);
            expect(result.result.finalAmount).toBe(80);
        });
        
        it('should handle action errors', async () => {
            const request = {
                jsonrpc: '2.0',
                method: 'action.execute',
                params: ['processPayment', {
                    amount: -100 // Invalid amount
                }],
                id: 3
            };
            
            const response = await fetch(BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });
            
            const result = await response.json();
            
            expect(result.jsonrpc).toBe('2.0');
            expect(result.id).toBe(3);
            expect(result.error).toBeDefined();
            expect(result.error.code).toBe(-32603); // Internal error
            expect(result.error.message).toContain('Invalid payment amount');
        });
        
        it('should return error for unknown action', async () => {
            const request = {
                jsonrpc: '2.0',
                method: 'action.execute',
                params: ['unknownAction', {}],
                id: 4
            };
            
            const response = await fetch(BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });
            
            const result = await response.json();
            
            expect(result.jsonrpc).toBe('2.0');
            expect(result.id).toBe(4);
            expect(result.error).toBeDefined();
            expect(result.error.code).toBe(-32603); // Internal error
            expect(result.error.message).toContain('Action not found');
        });
        
        it('should list available actions', async () => {
            const request = {
                jsonrpc: '2.0',
                method: 'action.list',
                id: 5
            };
            
            const response = await fetch(BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });
            
            const result = await response.json();
            
            expect(result.jsonrpc).toBe('2.0');
            expect(result.id).toBe(5);
            expect(Array.isArray(result.result)).toBe(true);
            expect(result.result).toContain('sendEmail');
            expect(result.result).toContain('calculateDiscount');
            expect(result.result).toContain('processPayment');
        });
    });
    
    describe('Feature 3: Batch Request Support (JSON-RPC §6)', () => {
        beforeEach(async () => {
            // Seed test data
            await kernel.repository.create('products', {
                id: 'batch-prod-1',
                name: 'Laptop',
                price: 999,
                category: 'electronics',
                inStock: true
            });
            await kernel.repository.create('products', {
                id: 'batch-prod-2',
                name: 'Book',
                price: 29,
                category: 'books',
                inStock: true
            });
        });
        
        it('should process batch with multiple read operations', async () => {
            const batchRequest = [
                {
                    jsonrpc: '2.0',
                    method: 'object.find',
                    params: ['products', {}],
                    id: 1
                },
                {
                    jsonrpc: '2.0',
                    method: 'object.count',
                    params: ['products'],
                    id: 2
                },
                {
                    jsonrpc: '2.0',
                    method: 'metadata.list',
                    id: 3
                }
            ];
            
            const response = await fetch(BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(batchRequest)
            });
            
            const results = await response.json();
            
            expect(Array.isArray(results)).toBe(true);
            expect(results).toHaveLength(3);
            
            // First result: object.find
            expect(results[0].jsonrpc).toBe('2.0');
            expect(results[0].id).toBe(1);
            expect(Array.isArray(results[0].result)).toBe(true);
            expect(results[0].result).toHaveLength(2);
            
            // Second result: object.count
            expect(results[1].jsonrpc).toBe('2.0');
            expect(results[1].id).toBe(2);
            expect(results[1].result).toBe(2);
            
            // Third result: metadata.list
            expect(results[2].jsonrpc).toBe('2.0');
            expect(results[2].id).toBe(3);
            expect(Array.isArray(results[2].result)).toBe(true);
        });
        
        it('should process batch with mixed CRUD operations', async () => {
            const batchRequest = [
                {
                    jsonrpc: '2.0',
                    method: 'object.create',
                    params: ['products', {
                        name: 'New Product',
                        price: 50,
                        category: 'electronics',
                        inStock: true
                    }],
                    id: 1
                },
                {
                    jsonrpc: '2.0',
                    method: 'object.update',
                    params: ['products', 'batch-prod-1', {
                        price: 899
                    }],
                    id: 2
                },
                {
                    jsonrpc: '2.0',
                    method: 'object.count',
                    params: ['products'],
                    id: 3
                }
            ];
            
            const response = await fetch(BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(batchRequest)
            });
            
            const results = await response.json();
            
            expect(Array.isArray(results)).toBe(true);
            expect(results).toHaveLength(3);
            
            // Create result
            expect(results[0].id).toBe(1);
            expect(results[0].result).toBeDefined();
            expect(results[0].result.name).toBe('New Product');
            
            // Update result
            expect(results[1].id).toBe(2);
            expect(results[1].result).toBeDefined();
            expect(results[1].result.price).toBe(899);
            
            // Count result (should be 3 now)
            expect(results[2].id).toBe(3);
            expect(results[2].result).toBe(3);
        });
        
        it('should process batch with call chaining', async () => {
            const batchRequest = [
                {
                    jsonrpc: '2.0',
                    method: 'object.create',
                    params: ['products', {
                        name: 'Chained Product',
                        price: 150,
                        category: 'electronics',
                        inStock: true
                    }],
                    id: 1
                },
                {
                    jsonrpc: '2.0',
                    method: 'object.get',
                    params: ['products', '$1.result.id'], // Reference to created product ID
                    id: 2
                }
            ];
            
            const response = await fetch(BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(batchRequest)
            });
            
            const results = await response.json();
            
            expect(Array.isArray(results)).toBe(true);
            expect(results).toHaveLength(2);
            
            // Create result
            expect(results[0].id).toBe(1);
            expect(results[0].result).toBeDefined();
            expect(results[0].result.name).toBe('Chained Product');
            const createdId = results[0].result.id;
            
            // Get result (should retrieve the same product)
            expect(results[1].id).toBe(2);
            expect(results[1].result).toBeDefined();
            expect(results[1].result.id).toBe(createdId);
            expect(results[1].result.name).toBe('Chained Product');
        });
        
        it('should handle batch with notifications (no id)', async () => {
            const batchRequest = [
                {
                    jsonrpc: '2.0',
                    method: 'object.find',
                    params: ['products', {}],
                    id: 1
                },
                {
                    jsonrpc: '2.0',
                    method: 'action.execute',
                    params: ['sendEmail', { to: 'test@example.com', subject: 'Notification' }]
                    // No id - this is a notification
                },
                {
                    jsonrpc: '2.0',
                    method: 'object.count',
                    params: ['products'],
                    id: 2
                }
            ];
            
            const response = await fetch(BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(batchRequest)
            });
            
            const results = await response.json();
            
            expect(Array.isArray(results)).toBe(true);
            expect(results).toHaveLength(2); // Notification doesn't return response
            
            expect(results[0].id).toBe(1);
            expect(results[1].id).toBe(2);
        });
        
        it('should handle batch with partial errors', async () => {
            const batchRequest = [
                {
                    jsonrpc: '2.0',
                    method: 'object.count',
                    params: ['products'],
                    id: 1
                },
                {
                    jsonrpc: '2.0',
                    method: 'object.get',
                    params: ['products', 'non-existent-id'],
                    id: 2
                },
                {
                    jsonrpc: '2.0',
                    method: 'action.execute',
                    params: ['unknownAction', {}],
                    id: 3
                },
                {
                    jsonrpc: '2.0',
                    method: 'metadata.list',
                    id: 4
                }
            ];
            
            const response = await fetch(BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(batchRequest)
            });
            
            const results = await response.json();
            
            expect(Array.isArray(results)).toBe(true);
            expect(results).toHaveLength(4);
            
            // First request succeeds
            expect(results[0].id).toBe(1);
            expect(results[0].result).toBe(2);
            
            // Second request returns null (not found)
            expect(results[1].id).toBe(2);
            expect(results[1].result).toBeNull();
            
            // Third request fails with error
            expect(results[2].id).toBe(3);
            expect(results[2].error).toBeDefined();
            
            // Fourth request succeeds
            expect(results[3].id).toBe(4);
            expect(Array.isArray(results[3].result)).toBe(true);
        });
        
        it('should handle complex batch with actions and counts', async () => {
            const batchRequest = [
                {
                    jsonrpc: '2.0',
                    method: 'object.count',
                    params: ['products', {
                        type: 'comparison',
                        field: 'inStock',
                        operator: '=',
                        value: true
                    }],
                    id: 1
                },
                {
                    jsonrpc: '2.0',
                    method: 'action.execute',
                    params: ['calculateDiscount', {
                        amount: 999,
                        percentage: 15
                    }],
                    id: 2
                },
                {
                    jsonrpc: '2.0',
                    method: 'action.list',
                    id: 3
                }
            ];
            
            const response = await fetch(BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(batchRequest)
            });
            
            const results = await response.json();
            
            expect(Array.isArray(results)).toBe(true);
            expect(results).toHaveLength(3);
            
            // Count result
            expect(results[0].id).toBe(1);
            expect(results[0].result).toBe(2); // Both products are in stock
            
            // Calculate discount result
            expect(results[1].id).toBe(2);
            expect(results[1].result.finalAmount).toBe(849.15);
            
            // Action list result
            expect(results[2].id).toBe(3);
            expect(results[2].result).toContain('calculateDiscount');
        });
        
        it('should maintain request order in batch response', async () => {
            const batchRequest = [];
            for (let i = 1; i <= 10; i++) {
                batchRequest.push({
                    jsonrpc: '2.0',
                    method: 'object.count',
                    params: ['products'],
                    id: i
                });
            }
            
            const response = await fetch(BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(batchRequest)
            });
            
            const results = await response.json();
            
            expect(Array.isArray(results)).toBe(true);
            expect(results).toHaveLength(10);
            
            // Verify order is maintained
            for (let i = 0; i < 10; i++) {
                expect(results[i].id).toBe(i + 1);
            }
        });
    });
    
    describe('Edge Cases and Validation', () => {
        it('should reject empty batch array', async () => {
            const response = await fetch(BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify([])
            });
            
            const result = await response.json();
            
            expect(result.error).toBeDefined();
            expect(result.error.code).toBe(-32600); // Invalid Request
        });
        
        it('should handle large batch requests', async () => {
            const batchRequest = [];
            for (let i = 0; i < 50; i++) {
                batchRequest.push({
                    jsonrpc: '2.0',
                    method: 'object.count',
                    params: ['products'],
                    id: i + 1
                });
            }
            
            const response = await fetch(BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(batchRequest)
            });
            
            const results = await response.json();
            
            expect(Array.isArray(results)).toBe(true);
            expect(results).toHaveLength(50);
        });
    });
});
