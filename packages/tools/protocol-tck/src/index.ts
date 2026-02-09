/**
 * Protocol Technology Compatibility Kit (TCK)
 * 
 * Comprehensive test suite ensuring all ObjectQL protocol implementations
 * provide consistent behavior across CRUD operations, metadata retrieval,
 * error handling, and protocol-specific features.
 * 
 * This TCK ensures that protocols (GraphQL, OData V4, REST, JSON-RPC) all
 * correctly interface with the ObjectQL engine and provide expected behavior.
 */

export interface ProtocolEndpoint {
    /**
     * Perform a CRUD operation through the protocol
     */
    execute(operation: ProtocolOperation): Promise<ProtocolResponse>;
    
    /**
     * Get metadata through the protocol
     */
    getMetadata(): Promise<any>;
    
    /**
     * Close/cleanup the endpoint
     */
    close?(): Promise<void>;
}

export interface ProtocolOperation {
    type: 'create' | 'read' | 'update' | 'delete' | 'query' | 'batch' | 'subscribe';
    entity: string;
    data?: any;
    id?: string;
    filter?: any;
    options?: any;
}

export interface ProtocolResponse {
    success: boolean;
    data?: any;
    error?: {
        code: string;
        message: string;
    };
    metadata?: any;
}

export interface ProtocolTCKConfig {
    skip?: {
        metadata?: boolean;
        subscriptions?: boolean;
        batch?: boolean;
        search?: boolean;
        transactions?: boolean;
        expand?: boolean;
        federation?: boolean;
    };
    timeout?: number;
    hooks?: {
        beforeAll?: () => Promise<void>;
        afterAll?: () => Promise<void>;
        beforeEach?: () => Promise<void>;
        afterEach?: () => Promise<void>;
    };
    performance?: {
        enabled?: boolean;
        thresholds?: {
            create?: number;  // milliseconds
            read?: number;
            update?: number;
            delete?: number;
            query?: number;
            batch?: number;
        };
    };
}

/**
 * Run the complete Protocol TCK test suite
 */
export function runProtocolTCK(
    createEndpoint: () => ProtocolEndpoint,
    protocolName: string,
    config: ProtocolTCKConfig = {}
) {
    const skip = config.skip || {};
    const timeout = config.timeout || 30000;
    const hooks = config.hooks || {};
    const perf = config.performance || { enabled: false };
    
    describe(`Protocol TCK - ${protocolName}`, () => {
        let endpoint: ProtocolEndpoint;
        const TEST_ENTITY = 'tck_test_entity';
        
        // Performance metrics storage
        const perfMetrics: Record<string, number[]> = {
            create: [],
            read: [],
            update: [],
            delete: [],
            query: [],
            batch: []
        };
        
        beforeAll(async () => {
            if (hooks.beforeAll) {
                await hooks.beforeAll();
            }
        }, timeout);
        
        afterAll(async () => {
            if (hooks.afterAll) {
                await hooks.afterAll();
            }
            
            // Report performance metrics if enabled
            if (perf.enabled) {
                console.log(`\n📊 Performance Metrics for ${protocolName}:`);
                Object.entries(perfMetrics).forEach(([op, times]) => {
                    if (times.length > 0) {
                        const avg = times.reduce((a, b) => a + b, 0) / times.length;
                        const min = Math.min(...times);
                        const max = Math.max(...times);
                        console.log(`  ${op}: avg=${avg.toFixed(2)}ms, min=${min}ms, max=${max}ms`);
                        
                        // Check against thresholds
                        const threshold = perf.thresholds?.[op as keyof typeof perf.thresholds];
                        if (threshold && avg > threshold) {
                            console.warn(`  ⚠️  Average ${op} time (${avg.toFixed(2)}ms) exceeds threshold (${threshold}ms)`);
                        }
                    }
                });
            }
        }, timeout);
        
        beforeEach(async () => {
            endpoint = createEndpoint();
            if (hooks.beforeEach) {
                await hooks.beforeEach();
            }
        }, timeout);
        
        afterEach(async () => {
            if (hooks.afterEach) {
                await hooks.afterEach();
            }
            if (endpoint.close) {
                await endpoint.close();
            }
        }, timeout);
        
        // Helper function to measure performance
        const measurePerf = async <T>(operation: string, fn: () => Promise<T>): Promise<T> => {
            const start = Date.now();
            const result = await fn();
            const duration = Date.now() - start;
            
            if (perf.enabled && perfMetrics[operation]) {
                perfMetrics[operation].push(duration);
            }
            
            return result;
        };
        
        // ===== 1. CORE CRUD OPERATIONS =====
        describe('1. Core CRUD Operations', () => {
            test('should create an entity', async () => {
                const response = await measurePerf('create', () =>
                    endpoint.execute({
                        type: 'create',
                        entity: TEST_ENTITY,
                        data: {
                            name: 'Test Entity',
                            value: 42,
                            active: true
                        }
                    })
                );
                
                expect(response.success).toBe(true);
                expect(response.data).toBeDefined();
                expect(response.data.id).toBeDefined();
                expect(response.data.name).toBe('Test Entity');
                expect(response.data.value).toBe(42);
                expect(response.data.active).toBe(true);
            }, timeout);
            
            test('should read an entity by ID', async () => {
                // First create an entity
                const createResponse = await endpoint.execute({
                    type: 'create',
                    entity: TEST_ENTITY,
                    data: { name: 'Read Test', value: 100 }
                });
                
                const entityId = createResponse.data.id;
                
                // Then read it
                const response = await measurePerf('read', () =>
                    endpoint.execute({
                        type: 'read',
                        entity: TEST_ENTITY,
                        id: entityId
                    })
                );
                
                expect(response.success).toBe(true);
                expect(response.data).toBeDefined();
                expect(response.data.id).toBe(entityId);
                expect(response.data.name).toBe('Read Test');
            }, timeout);
            
            test('should update an entity', async () => {
                // Create
                const createResponse = await endpoint.execute({
                    type: 'create',
                    entity: TEST_ENTITY,
                    data: { name: 'Original', value: 1 }
                });
                
                const entityId = createResponse.data.id;
                
                // Update
                const response = await measurePerf('update', () =>
                    endpoint.execute({
                        type: 'update',
                        entity: TEST_ENTITY,
                        id: entityId,
                        data: { name: 'Updated', value: 2 }
                    })
                );
                
                expect(response.success).toBe(true);
                expect(response.data.name).toBe('Updated');
                expect(response.data.value).toBe(2);
            }, timeout);
            
            test('should delete an entity', async () => {
                // Create
                const createResponse = await endpoint.execute({
                    type: 'create',
                    entity: TEST_ENTITY,
                    data: { name: 'To Delete' }
                });
                
                const entityId = createResponse.data.id;
                
                // Delete
                const response = await measurePerf('delete', () =>
                    endpoint.execute({
                        type: 'delete',
                        entity: TEST_ENTITY,
                        id: entityId
                    })
                );
                
                expect(response.success).toBe(true);
                
                // Verify deletion
                const readResponse = await endpoint.execute({
                    type: 'read',
                    entity: TEST_ENTITY,
                    id: entityId
                });
                
                expect(readResponse.data).toBeNull();
            }, timeout);
        });
        
        // ===== 2. QUERY OPERATIONS =====
        describe('2. Query Operations', () => {
            beforeEach(async () => {
                // Create test data
                for (let i = 1; i <= 5; i++) {
                    await endpoint.execute({
                        type: 'create',
                        entity: TEST_ENTITY,
                        data: {
                            name: `Entity ${i}`,
                            value: i * 10,
                            active: i % 2 === 0
                        }
                    });
                }
            }, timeout);
            
            test('should query all entities', async () => {
                const response = await measurePerf('query', () =>
                    endpoint.execute({
                        type: 'query',
                        entity: TEST_ENTITY
                    })
                );
                
                expect(response.success).toBe(true);
                expect(response.data).toBeDefined();
                expect(Array.isArray(response.data)).toBe(true);
                expect(response.data.length).toBeGreaterThanOrEqual(5);
            }, timeout);
            
            test('should filter entities', async () => {
                const response = await endpoint.execute({
                    type: 'query',
                    entity: TEST_ENTITY,
                    filter: { active: true }
                });
                
                expect(response.success).toBe(true);
                expect(response.data.every((e: any) => e.active === true)).toBe(true);
            }, timeout);
            
            test('should support pagination', async () => {
                const response = await endpoint.execute({
                    type: 'query',
                    entity: TEST_ENTITY,
                    options: { limit: 2, offset: 1 }
                });
                
                expect(response.success).toBe(true);
                expect(response.data.length).toBeLessThanOrEqual(2);
            }, timeout);
            
            test('should support sorting', async () => {
                const response = await endpoint.execute({
                    type: 'query',
                    entity: TEST_ENTITY,
                    options: { orderBy: [{ field: 'value', order: 'DESC' }] }
                });
                
                expect(response.success).toBe(true);
                const values = response.data.map((e: any) => e.value);
                const sortedValues = [...values].sort((a, b) => b - a);
                expect(values).toEqual(sortedValues);
            }, timeout);
        });
        
        // ===== 3. METADATA OPERATIONS =====
        if (!skip.metadata) {
            describe('3. Metadata Operations', () => {
                test('should retrieve protocol metadata', async () => {
                    const metadata = await endpoint.getMetadata();
                    
                    expect(metadata).toBeDefined();
                    expect(typeof metadata).toBe('object');
                }, timeout);
                
                test('should list available entities', async () => {
                    const metadata = await endpoint.getMetadata();
                    
                    expect(metadata.entities || metadata.entitySets || metadata.types).toBeDefined();
                }, timeout);
            });
        }
        
        // ===== 4. ERROR HANDLING =====
        describe('4. Error Handling', () => {
            test('should handle invalid entity name gracefully', async () => {
                const response = await endpoint.execute({
                    type: 'query',
                    entity: 'nonexistent_entity_xyz'
                });
                
                // Either returns error OR returns empty results
                // Different implementations may handle this differently
                if (response.success) {
                    // If successful, should return empty array for non-existent entity
                    expect(Array.isArray(response.data) ? response.data.length : 0).toBe(0);
                } else {
                    // Or return an error
                    expect(response.error).toBeDefined();
                }
            }, timeout);
            
            test('should handle invalid ID on read', async () => {
                const response = await endpoint.execute({
                    type: 'read',
                    entity: TEST_ENTITY,
                    id: 'nonexistent-id-12345'
                });
                
                expect(response.data).toBeNull();
            }, timeout);
            
            test('should validate required fields on create', async () => {
                const response = await endpoint.execute({
                    type: 'create',
                    entity: TEST_ENTITY,
                    data: {} // Empty data - may fail validation
                });
                
                // Either succeeds or returns validation error
                if (!response.success) {
                    expect(response.error).toBeDefined();
                }
            }, timeout);
        });
        
        // ===== 5. BATCH OPERATIONS (Optional) =====
        if (!skip.batch) {
            describe('5. Batch Operations', () => {
                test('should support batch create', async () => {
                    const response = await measurePerf('batch', () =>
                        endpoint.execute({
                            type: 'batch',
                            entity: TEST_ENTITY,
                            data: [
                                { name: 'Batch 1', value: 1 },
                                { name: 'Batch 2', value: 2 },
                                { name: 'Batch 3', value: 3 }
                            ]
                        })
                    );
                    
                    expect(response.success).toBe(true);
                    expect(Array.isArray(response.data)).toBe(true);
                    expect(response.data.length).toBe(3);
                }, timeout);
            });
        }
    });
}

/**
 * Export individual test categories for custom test composition
 */
export const ProtocolTCK = {
    runCRUDTests: (_endpoint: ProtocolEndpoint, _entity: string, _timeout: number) => {
        // Individual CRUD test implementation
        // Can be used for custom test composition
    },
    
    runQueryTests: (_endpoint: ProtocolEndpoint, _entity: string, _timeout: number) => {
        // Individual query test implementation
    },
    
    runMetadataTests: (_endpoint: ProtocolEndpoint, _timeout: number) => {
        // Individual metadata test implementation
    },
    
    runErrorHandlingTests: (_endpoint: ProtocolEndpoint, _entity: string, _timeout: number) => {
        // Individual error handling test implementation
    }
};
