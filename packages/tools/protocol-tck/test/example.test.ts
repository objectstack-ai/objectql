/**
 * Example Protocol TCK Test
 * 
 * Demonstrates how to use the Protocol TCK with a mock protocol endpoint
 */

import { describe } from 'vitest';
import { runProtocolTCK, ProtocolEndpoint, ProtocolOperation, ProtocolResponse } from '../src/index';

/**
 * Mock in-memory protocol endpoint for testing the TCK itself
 */
class MockProtocolEndpoint implements ProtocolEndpoint {
    private data: Map<string, Map<string, any>> = new Map();
    private idCounter = 0;
    
    async execute(operation: ProtocolOperation): Promise<ProtocolResponse> {
        try {
            const { type, entity, data, id, filter, options } = operation;
            
            // Ensure entity collection exists
            if (!this.data.has(entity)) {
                this.data.set(entity, new Map());
            }
            
            const collection = this.data.get(entity)!;
            
            switch (type) {
                case 'create': {
                    const newId = data?.id || `mock-${++this.idCounter}`;
                    const newData = {
                        ...data,
                        id: newId,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };
                    collection.set(newId, newData);
                    return { success: true, data: newData };
                }
                
                case 'read': {
                    if (!id) {
                        return { success: false, error: { code: '400', message: 'ID required' } };
                    }
                    const item = collection.get(id);
                    return { success: true, data: item || null };
                }
                
                case 'update': {
                    if (!id) {
                        return { success: false, error: { code: '400', message: 'ID required' } };
                    }
                    const existing = collection.get(id);
                    if (!existing) {
                        return { success: false, error: { code: '404', message: 'Not found' } };
                    }
                    const updated = {
                        ...existing,
                        ...data,
                        id, // Don't allow ID change
                        updated_at: new Date().toISOString()
                    };
                    collection.set(id, updated);
                    return { success: true, data: updated };
                }
                
                case 'delete': {
                    if (!id) {
                        return { success: false, error: { code: '400', message: 'ID required' } };
                    }
                    const deleted = collection.delete(id);
                    return { success: deleted, data: deleted ? { id } : null };
                }
                
                case 'query': {
                    let results = Array.from(collection.values());
                    
                    // Apply filter
                    if (filter) {
                        results = results.filter(item => {
                            return Object.entries(filter).every(([key, value]) => item[key] === value);
                        });
                    }
                    
                    // Apply sorting
                    if (options?.orderBy) {
                        const sortField = options.orderBy[0]?.field;
                        const sortOrder = options.orderBy[0]?.order?.toLowerCase();
                        if (sortField) {
                            results.sort((a, b) => {
                                const aVal = a[sortField];
                                const bVal = b[sortField];
                                const compare = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
                                return sortOrder === 'desc' ? -compare : compare;
                            });
                        }
                    }
                    
                    // Apply pagination
                    if (options?.offset) {
                        results = results.slice(options.offset);
                    }
                    if (options?.limit) {
                        results = results.slice(0, options.limit);
                    }
                    
                    return { success: true, data: results };
                }
                
                case 'batch': {
                    if (!Array.isArray(data)) {
                        return { success: false, error: { code: '400', message: 'Batch requires array' } };
                    }
                    
                    const batchResults = [];
                    for (const item of data) {
                        const result = await this.execute({
                            type: 'create',
                            entity,
                            data: item
                        });
                        if (result.data) {
                            batchResults.push(result.data);
                        }
                    }
                    
                    return { success: true, data: batchResults };
                }
                
                default:
                    return {
                        success: false,
                        error: { code: '400', message: `Unsupported operation: ${type}` }
                    };
            }
        } catch (error) {
            return {
                success: false,
                error: {
                    code: '500',
                    message: error instanceof Error ? error.message : 'Internal error'
                }
            };
        }
    }
    
    async getMetadata(): Promise<any> {
        return {
            entities: Array.from(this.data.keys()),
            protocol: 'mock',
            version: '1.0.0'
        };
    }
    
    async close(): Promise<void> {
        this.data.clear();
    }
}

// Run the TCK tests
describe('Protocol TCK - Mock Protocol Example', () => {
    runProtocolTCK(
        () => new MockProtocolEndpoint(),
        'Mock Protocol',
        {
            timeout: 10000,
            performance: {
                enabled: true,
                thresholds: {
                    create: 10,
                    read: 5,
                    update: 10,
                    delete: 5,
                    query: 20,
                    batch: 50
                }
            }
        }
    );
});
